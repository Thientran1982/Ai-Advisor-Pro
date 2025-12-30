
import { Type, Schema } from "@google/genai";
import { Lead, SwarmStep, AgentRole, UserPsychology } from "../types";
import { getAI } from "./geminiService";
import { dataService } from "./dataService";

/**
 * 🧠 LANGGRAPH SWARM ENGINE (MULTI-AGENT SYSTEM v3.3 - OPTIMIZED SUPERVISOR)
 * ========================================================
 * Architecture: JSON Schema Enforcement.
 * Quality: Enterprise Grade.
 */

// --- UTILS: ROBUST JSON CLEANER (V2 - SUBSTRING EXTRACTION) ---
const cleanJson = (text: string): string => {
    if (!text) return "{}";
    
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return text.substring(firstBrace, lastBrace + 1);
    }

    let clean = text.replace(/```json/g, "").replace(/```/g, "");
    return clean.trim();
};

// --- 0. ADAPTIVE TONE MATRIX ---
const ADAPTIVE_TONE_MATRIX = {
    'D': "Phong cách: Quyết đoán, Ngắn gọn, Đi thẳng vào lợi nhuận/kết quả. Dùng bullet points.",
    'I': "Phong cách: Nhiệt huyết, Hào hứng, Storytelling. Sử dụng Emoji hợp lý.",
    'S': "Phong cách: Chân thành, Từ tốn, Đồng cảm. Tập trung vào sự An toàn.",
    'C': "Phong cách: Chi tiết, Logic, Chính xác tuyệt đối. Cung cấp số liệu.",
    'Unknown': "Phong cách: Chuyên nghiệp, Lịch sự, Khách quan."
};

// 1. THE BLACKBOARD (Shared State)
interface SwarmState {
    lead: Lead;
    history: string[]; 
    blackboard: {
        psychology_profile?: string;
        disc_type?: 'D'|'I'|'S'|'C'|'Unknown';
        market_data?: string;        
        valuation_data?: string;     
        risk_assessment?: string;    
        financial_plan?: string;     
    };
    next_agent: AgentRole | 'FINISH';
    assigned_task?: string; 
    last_agent?: AgentRole;
    last_output?: string; 
    visited_agents: Set<string>; 
    iteration: number;
}

// 🔥 SCHEMA DEFINITIONS FOR WORKERS (DATA PURITY)
const PSYCHOLOGIST_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        discType: { type: Type.STRING, enum: ['D', 'I', 'S', 'C', 'Unknown'], description: "Nhóm tính cách chủ đạo." },
        riskTolerance: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: "Khẩu vị rủi ro dựa trên lịch sử chat." },
        painPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách nỗi đau/vấn đề cụ thể của khách." },
        summary: { type: Type.STRING, description: "Tóm tắt tâm lý ngắn gọn để hiển thị UI." }
    },
    required: ["discType", "riskTolerance", "summary", "painPoints"]
};

// 2. WORKER NODE FACTORY
const executeWorker = async (
    role: AgentRole, 
    task: string, 
    state: SwarmState,
    onStep: (step: SwarmStep) => void
): Promise<string> => {
    const ai = getAI();
    onStep({ agentName: role, agentRole: "Đang xử lý tác vụ...", agentType: role, status: 'thinking' });

    try {
        const tools = role === 'MarketInsider' || role === 'ValuationExpert' || role === 'RiskOfficer'
            ? [{ googleSearch: {} }] 
            : undefined;

        const macroData = JSON.stringify(dataService.getLiveMarketContext());
        const userDisc = state.blackboard.disc_type || 'Unknown';
        const toneInstruction = ADAPTIVE_TONE_MATRIX[userDisc];
        
        let responseSchema: Schema | undefined = undefined;
        let mimeType = "text/plain";

        if (role === 'Psychologist') {
            responseSchema = PSYCHOLOGIST_SCHEMA;
            mimeType = "application/json";
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `
                [SYSTEM]: Bạn là ${role} - Chuyên gia hàng đầu trong lĩnh vực BĐS.
                [CONTEXT VĨ MÔ]: ${macroData}
                [CONTEXT BLACKBOARD]: ${JSON.stringify(state.blackboard)}
                
                [NHIỆM VỤ]: "${task}"
                
                [CHỈ THỊ]:
                - ${toneInstruction}
                - Trả lời dựa trên dữ liệu thực tế.
            `,
            config: { 
                tools, 
                temperature: 0.3,
                maxOutputTokens: 2000,
                responseMimeType: mimeType,
                responseSchema: responseSchema
            }
        });

        const output = response.text || "DATA_ERROR";
        
        onStep({ 
            agentName: role, 
            agentRole: "Hoàn tất phân tích", 
            agentType: role, 
            status: 'done', 
            output: output.length > 150 ? output.substring(0, 150) + "..." : output
        });
        
        return output;
    } catch (e) {
        console.error(`${role} crashed:`, e);
        return "SYSTEM_FAILURE";
    }
};

// 3. SUPERVISOR NODE (OPTIMIZED)
const supervisorNode = async (state: SwarmState, onStep: (step: SwarmStep) => void): Promise<Partial<SwarmState>> => {
    const ai = getAI();
    if (state.iteration >= 6) return { next_agent: 'FINISH' };

    const allAgents: AgentRole[] = ['Psychologist', 'MarketInsider', 'ValuationExpert', 'RiskOfficer', 'WealthStructurer'];
    const remainingAgents = allAgents.filter(a => !state.visited_agents.has(a));

    if (remainingAgents.length === 0) return { next_agent: 'FINISH' };

    onStep({ agentName: "Supervisor", agentRole: "Đang điều phối...", agentType: 'Manager', status: 'thinking' });

    // Force Psychologist First Rule (Hard Logic)
    if (!state.blackboard.disc_type && !state.visited_agents.has('Psychologist')) {
        onStep({ agentName: "Supervisor", agentRole: "→ Chỉ định: Psychologist", agentType: 'Manager', status: 'done', output: "Cần thấu hiểu khách hàng trước (DISC Analysis)." });
        return { 
            next_agent: 'Psychologist', 
            assigned_task: "Phân tích lịch sử chat để xác định nhóm tính cách DISC (Trả về JSON)." 
        };
    }

    const supervisorSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            next_agent: { type: Type.STRING, enum: [...remainingAgents, 'FINISH'] },
            specific_task: { type: Type.STRING, description: "Nhiệm vụ cụ thể cho agent tiếp theo." },
            reason: { type: Type.STRING, description: "Lý do tại sao chọn agent này." }
        },
        required: ["next_agent", "specific_task", "reason"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `
                [VAI TRÒ]: Lead Project Manager (Điều phối viên cấp cao).
                [MỤC TIÊU]: Hoàn thiện hồ sơ tư vấn BĐS toàn diện.
                
                [TRẠNG THÁI HIỆN TẠI]:
                - Khách hàng: ${state.lead.name} (DISC: ${state.blackboard.disc_type || 'Chưa xác định'})
                - Dữ liệu ĐÃ CÓ trên Blackboard: ${Object.keys(state.blackboard).join(', ')}
                - Agent VỪA HOÀN THÀNH: ${state.last_agent || 'None'}
                
                [DANH SÁCH AGENT CÒN LẠI]: ${remainingAgents.join(', ')}
                
                [QUY TẮC ĐIỀU PHỐI (DEPENDENCY GRAPH)]:
                1. MarketInsider (Thị trường) nên chạy trước ValuationExpert (Định giá).
                2. Nếu khách lo lắng rủi ro (Risk Averse), BẮT BUỘC gọi RiskOfficer.
                3. Nếu khách quan tâm đầu tư/lợi nhuận, BẮT BUỘC gọi ValuationExpert & WealthStructurer.
                4. Nếu đã đủ thông tin quan trọng cho mục tiêu của khách, hãy gọi 'FINISH'.
                
                [NHIỆM VỤ]: Chọn agent tiếp theo tối ưu nhất để lấp đầy khoảng trống thông tin.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: supervisorSchema,
                temperature: 0.0 // Strict logic
            }
        });

        const decision = JSON.parse(cleanJson(response.text || "{}"));
        const next = decision.next_agent || 'FINISH';

        // Log reasoning to UI via output
        onStep({ 
            agentName: "Supervisor", 
            agentRole: next === 'FINISH' ? `Tổng hợp hồ sơ` : `→ Điều động: ${next}`, 
            agentType: 'Manager', 
            status: 'done',
            output: decision.reason ? `[Lý do]: ${decision.reason}` : decision.specific_task
        });

        return { next_agent: next as any, assigned_task: decision.specific_task };
    } catch (e) {
        console.error("Supervisor JSON Error", e);
        // Fail-safe: Instead of crashing, try to wrap up with Storyteller if possible, or just finish.
        return { next_agent: 'FINISH' };
    }
};

// 4. FINALIZER
const finalizerNode = async (state: SwarmState, onStep: any): Promise<string> => {
    const ai = getAI();
    onStep({ agentName: "CRM Sync", agentRole: "Đồng bộ dữ liệu...", agentType: 'Storyteller', status: 'thinking' });

    const finalSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            consultation_script: { type: Type.STRING },
            lead_priority: { type: Type.STRING, enum: ['urgent', 'high', 'medium', 'low'] },
            key_insights: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["consultation_script", "lead_priority"]
    };

    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: `
                [VAI TRÒ]: Deal Closer & Script Writer.
                [DATA TỔNG HỢP]: ${JSON.stringify(state.blackboard)}.
                [KHÁCH HÀNG]: ${state.lead.name} - ${state.lead.purpose}.
                [NHIỆM VỤ]: 
                1. Tổng hợp tất cả dữ liệu từ các chuyên gia thành một kịch bản tư vấn mạch lạc.
                2. Viết bằng giọng văn ${ADAPTIVE_TONE_MATRIX[state.blackboard.disc_type || 'Unknown']}.
                3. Sử dụng Markdown, icon, in đậm các con số quan trọng.
                4. Đánh giá lại mức độ ưu tiên của khách hàng (Priority) dựa trên tiềm năng chốt deal.
            `,
            config: { 
                temperature: 0.2, // Slight creativity for writing
                responseMimeType: "application/json",
                responseSchema: finalSchema
            }
        });

        const result = JSON.parse(cleanJson(res.text || "{}"));
        
        // Priority Sync
        if (result.lead_priority) {
            const pMap = { 'low': 1, 'medium': 2, 'high': 3, 'urgent': 4 };
            if (pMap[result.lead_priority] > pMap[state.lead.priority]) {
                dataService.updateLeadStatus(state.lead.id, state.lead.status); 
                // Implicitly update priority in local DB if supported, for now we assume status update triggers UI refresh
            }
        }

        onStep({ agentName: "CRM Sync", agentRole: "Đã cập nhật & Lưu trữ", agentType: 'Storyteller', status: 'done' });
        return result.consultation_script || "Hệ thống đã phân tích xong nhưng không thể tạo kịch bản chi tiết.";

    } catch (e) {
        console.error("Finalizer Error", e);
        return "Xin lỗi, tôi gặp lỗi khi tổng hợp dữ liệu cuối cùng. Tuy nhiên các dữ liệu thành phần đã được lưu vào hồ sơ.";
    }
};

// --- MAIN EXECUTOR ---
export const runLangGraphSwarm = async (lead: Lead, onStep: (step: SwarmStep) => void): Promise<string> => {
    let state: SwarmState = {
        lead,
        history: [],
        blackboard: {},
        next_agent: 'Manager',
        iteration: 0,
        visited_agents: new Set(),
        last_output: ""
    };

    if (lead.psychology) {
        state.blackboard.disc_type = lead.psychology.discType;
        // Don't mark Psychologist as visited if we want to allow re-analysis, 
        // but typically we trust the DB profile to save tokens.
        state.visited_agents.add('Psychologist'); 
    }

    while (state.next_agent !== 'FINISH') {
        state.iteration++;
        
        if (state.next_agent === 'Manager') {
            const decision = await supervisorNode(state, onStep);
            state.next_agent = decision.next_agent || 'FINISH';
            state.assigned_task = decision.assigned_task;
        } else {
            const currentRole = state.next_agent;
            state.visited_agents.add(currentRole);
            
            const result = await executeWorker(currentRole, state.assigned_task || "Phân tích chuyên sâu.", state, onStep);

            // Update Blackboard & Real-time Sync
            if (currentRole === 'Psychologist') {
                try {
                    const psyData = JSON.parse(cleanJson(result));
                    state.blackboard.psychology_profile = psyData.summary;
                    state.blackboard.disc_type = psyData.discType;
                    
                    dataService.updateLeadPsychology(state.lead.id, {
                        discType: psyData.discType,
                        riskTolerance: psyData.riskTolerance,
                        painPoints: psyData.painPoints
                    });
                    console.log("⚡ [LangGraph] Hot-saved Psychology JSON Structure");
                } catch (e) {
                    console.error("Failed to parse Psychologist JSON", e);
                    state.blackboard.disc_type = 'Unknown';
                }
            } else if (currentRole === 'MarketInsider') state.blackboard.market_data = result;
            else if (currentRole === 'ValuationExpert') state.blackboard.valuation_data = result;
            else if (currentRole === 'RiskOfficer') state.blackboard.risk_assessment = result;
            else if (currentRole === 'WealthStructurer') state.blackboard.financial_plan = result;

            state.last_agent = currentRole;
            state.last_output = result;
            state.next_agent = 'Manager'; 
        }
    }

    return await finalizerNode(state, onStep);
};
