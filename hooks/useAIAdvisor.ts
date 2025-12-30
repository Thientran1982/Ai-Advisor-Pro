
import { useState, useCallback } from 'react';
import { Message, TenantProfile, Lead, UserProfile, SwarmStep } from '../types';
import { createChatSession } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { runLangGraphSwarm } from '../services/langGraphService';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

interface UseAIAdvisorProps {
    session: TenantProfile | null;
    targetProject: string | null;
    trafficSource: string;
    leads: Lead[];
}

// UI Widget Mapping
const TOOL_MAPPING: Record<string, string> = {
    'show_valuation': 'valuation', 'show_comparison': 'comparison', 
    'show_feng_shui': 'feng_shui', 'show_market_forecast': 'forecast', 
    'show_calculator': 'calculator', 'show_lead_magnet': 'lead_magnet',
    'show_project_info': 'show_project_info', 'show_bank_rates': 'bank_rates',
    'show_strategy': 'strategy', 'show_legal': 'legal', 'show_finance': 'finance'    
};

export const useAIAdvisor = ({ session, targetProject, trafficSource, leads }: UseAIAdvisorProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeepReasoning, setIsDeepReasoning] = useState(false);
    const [showMemoryToast, setShowMemoryToast] = useState(false);
    
    // 🔥 LIVE TRACE LOG: The Source of Truth
    const [liveReasoning, setLiveReasoning] = useState<string[]>([]);

    const getCurrentUserProfile = useCallback((): { profile: UserProfile | null, leadId: string | null } => {
        const matchedLead = leads.find(l => 
            (session?.phone && l.phone === session.phone) || 
            (session?.name && l.name === session.name)
        ) || leads[0]; 

        if (matchedLead) return { profile: { name: matchedLead.name, phone: matchedLead.phone, type: matchedLead.userType, lastVisit: new Date() }, leadId: matchedLead.id };
        if (session) return { profile: { name: session.name, phone: session.phone, type: 'individual', lastVisit: new Date() }, leadId: null };
        return { profile: null, leadId: null };
    }, [leads, session]);

    const detectQueryComplexity = (text: string): boolean => {
        const lower = text.toLowerCase();
        const deepTriggers = ['chiến lược', 'hoạch định', 'so sánh sâu', 'phân tích', 'báo cáo', 'tổng hợp', 'dòng tiền', 'rủi ro'];
        return deepTriggers.some(k => lower.includes(k));
    };

    // --- 🔥 THE TRUTH BRIDGE LOGIC ---
    // Maps technical tool calls to human-readable, domain-specific actions
    const resolveToolReasoning = (toolName: string, args: any): string => {
        switch(toolName) {
            case 'check_inventory': 
                return `🔌 ERP Sync: Kiểm tra Live (Căn: ${args.unit_code || 'Giỏ hàng chung'} - DA: ${args.project_name})`;
            
            case 'googleSearch': 
                // Contextualize the search based on typical real estate queries
                return `🌍 Market Scan: Quét dữ liệu từ Batdongsan.com.vn, Muaban.net, Homedy, Nhatot...`;
            
            case 'show_valuation':
                return `📊 Valuation Engine: Chạy mô hình định giá so sánh (CMA)`;

            case 'show_bank_rates':
                return `🏦 Bank Crawler: Cập nhật lãi suất Big4 & TMCP mới nhất`;

            case 'remember_preference': 
                return `🧠 Long-term Memory: Ghi nhớ "${args.key}" vào hồ sơ khách hàng`;
            
            case 'show_legal':
                return `⚖️ Legal Check: Rà soát pháp lý & Quy hoạch 1/500`;

            default: 
                return `🛠️ System Tool: Kích hoạt ${toolName}`;
        }
    };

    // --- MAIN HANDLER ---
    const handleSendMessage = async (text: string, imageFile?: File | null) => {
        const userMsg: Message = { role: 'user', text, timestamp: new Date(), image: imageFile ? URL.createObjectURL(imageFile) : undefined };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        
        // Reset logs - CLEAN START (No initial noise)
        setLiveReasoning([]); 
        const executionLog: string[] = []; // Accumulator for final message

        const isComplex = detectQueryComplexity(text);
        setIsDeepReasoning(isComplex);
        const startTime = Date.now();

        try {
            const { profile, leadId } = getCurrentUserProfile();

            // --- PATH A: DEEP REASONING (LANGGRAPH SWARM) ---
            if (isComplex && leadId) {
                const lead = leads.find(l => l.id === leadId);
                if (lead) {
                    
                    const finalScript = await runLangGraphSwarm(lead, (step: SwarmStep) => {
                        // FILTER: ONLY CAPTURE IMPORTANT STEPS
                        let logMsg = "";
                        // Only log Supervisor final decisions or Worker completions
                        if (step.agentType === 'Manager' && step.status === 'done' && step.output) {
                            logMsg = `👮 Supervisor: ${step.output}`;
                        }
                        // Workers: Only log if they found something substantive (not just 'Hoàn tất')
                        else if (step.status === 'done' && step.agentType !== 'Manager' && step.output && step.output.length > 20) {
                             logMsg = `🤖 ${step.agentName}: Đã phân tích dữ liệu`;
                        }
                        
                        if (logMsg) {
                            executionLog.push(logMsg);
                            setLiveReasoning(prev => [logMsg, ...prev].slice(0, 6));
                        }
                    });

                    const duration = (Date.now() - startTime) / 1000;
                    setMessages(prev => [...prev, {
                        role: 'model',
                        text: finalScript,
                        timestamp: new Date(),
                        reasoningSteps: executionLog, // Attach REAL Swarm trace
                        thinkingTime: duration,
                        isReasoning: true
                    }]);
                    setIsLoading(false);
                    return;
                }
            }

            // --- PATH B: STANDARD CHAT (GEMINI TOOLS - The "Truth Bridge") ---
            
            // 🔥 OPTIMIZATION: Smart Model Selection
            // "Xin chào" (8 chars) -> Flash (Fast).
            // "Giá Eaton Park là bao nhiêu?" (25 chars) -> Flash (Fast, uses Tools).
            // "Tại sao dự án này lại đắt hơn dự án kia?" (> 40 chars) -> Pro (Thinking).
            const isSimpleQuery = text.length < 40 && !isComplex; 
            const useThinkingMode = !isSimpleQuery;

            const chatSession = createChatSession(
                profile, 
                session, 
                [...messages, userMsg], 
                targetProject, 
                trafficSource, 
                useThinkingMode // Dynamic switching
            );
            
            // Prepare Payload
            let messagePayload: any = { message: text };
            if (imageFile) {
                const base64 = await fileToBase64(imageFile);
                messagePayload = { message: { parts: [{ text: text || " " }, { inlineData: { mimeType: imageFile.type, data: base64 } }] } };
            }

            // 1. Initial Call
            let response = await chatSession.sendMessage(messagePayload);
            
            // 2. Tool Execution Loop (The "Action" Phase)
            let functionCalls = response.functionCalls;
            let iterations = 0;
            const collectedWidgets: any[] = [];

            while (functionCalls && functionCalls.length > 0 && iterations < 5) {
                iterations++;
                const toolParts: any[] = [];
                
                for (const call of functionCalls) {
                    // 🔥 TRUTH BRIDGE: LOG THE ACTUAL TOOL CALL IMMEDIATELY
                    const traceMsg = resolveToolReasoning(call.name, call.args);
                    executionLog.push(traceMsg);
                    setLiveReasoning(prev => [traceMsg, ...prev].slice(0, 6)); // Update UI instantly

                    // --- EXECUTE SPECIFIC TOOLS ---
                    if (TOOL_MAPPING[call.name]) {
                        collectedWidgets.push({ type: TOOL_MAPPING[call.name], data: call.args });
                        toolParts.push({ functionResponse: { name: call.name, id: call.id, response: { result: "Widget Displayed" } } });
                    } 
                    else if (call.name === 'check_inventory') {
                        // Call Mock ERP Service
                        const res = await dataService.checkInventoryRealtime(call.args.project_name as string, call.args.unit_code as string);
                        toolParts.push({ functionResponse: { name: call.name, id: call.id, response: { result: JSON.stringify(res) } } });
                    }
                    else if (call.name === 'remember_preference') {
                        const { key, value, confidence } = call.args as any;
                        if (leadId) dataService.addLeadMemory(leadId, { key, value, confidence: confidence || 1.0, extractedAt: new Date() });
                        setShowMemoryToast(true); setTimeout(() => setShowMemoryToast(false), 3000);
                        toolParts.push({ functionResponse: { name: call.name, id: call.id, response: { result: "Saved to Memory" } } });
                    }
                    // For googleSearch, Gemini handles it internally, we just acknowledge
                    else {
                         toolParts.push({ functionResponse: { name: call.name, id: call.id, response: { result: "Executed" } } });
                    }
                }

                // Send tool outputs back to Gemini
                if (toolParts.length > 0) {
                    response = await chatSession.sendMessage({ message: toolParts });
                    functionCalls = response.functionCalls;
                } else {
                    functionCalls = undefined;
                }
            }

            const duration = (Date.now() - startTime) / 1000;
            const modelText = response.text || "";

            // Push final response with the accumulated TRUTH LOG
            const newMsgs: Message[] = [];
            if (modelText) {
                // Add Grounding Metadata to log if available (Web Sources)
                if (response.groundingMetadata?.groundingChunks) {
                    const sources = response.groundingMetadata.groundingChunks
                        .map((c: any) => c.web?.title).filter(Boolean);
                    if (sources.length > 0) {
                        const sourceMsg = `🔗 Tham chiếu nguồn: ${sources.slice(0, 3).join(', ')}...`;
                        executionLog.push(sourceMsg);
                    }
                }

                // CLEAN UP: Removed generic "Hoàn tất tổng hợp dữ liệu" to reduce noise.

                newMsgs.push({
                    role: 'model',
                    text: modelText,
                    timestamp: new Date(),
                    reasoningSteps: executionLog.length > 0 ? executionLog : undefined, // Only attach if there are meaningful steps
                    thinkingTime: duration,
                    groundingMetadata: response.groundingMetadata
                });
            }
            
            // Add any captured widgets
            collectedWidgets.forEach(w => {
                newMsgs.push({ role: 'model', text: '', timestamp: new Date(), toolPayload: w });
            });

            if (newMsgs.length === 0) newMsgs.push({ role: 'model', text: "Đã cập nhật thông tin.", timestamp: new Date() });

            setMessages(prev => [...prev, ...newMsgs]);
            setIsLoading(false);

        } catch (e) {
            console.error("AI Error:", e);
            setMessages(prev => [...prev, { role: 'model', text: "Hệ thống đang quá tải hoặc gặp gián đoạn. Vui lòng thử lại.", timestamp: new Date() }]);
            setIsLoading(false);
        }
    };

    return {
        messages,
        setMessages,
        isLoading,
        isDeepReasoning,
        showMemoryToast,
        handleSendMessage,
        liveReasoning,
        setLiveReasoning,
        setIsDeepReasoning
    };
};
