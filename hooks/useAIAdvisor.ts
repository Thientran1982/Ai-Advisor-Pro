
import { useState, useCallback } from 'react';
import { Message, TenantProfile, Lead } from '../types';
import { createChatSession } from '../services/geminiService';
import { dataService } from '../services/dataService';
import type { GenerateContentResponse } from "@google/genai";

interface UseAIAdvisorProps {
    session: TenantProfile | null;
    targetProject: string | null;
    trafficSource: string;
    leads: Lead[];
}

export const useAIAdvisor = ({ session, targetProject, trafficSource, leads }: UseAIAdvisorProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeepReasoning, setIsDeepReasoning] = useState(false);
    const [showMemoryToast, setShowMemoryToast] = useState(false);
    const [liveReasoning, setLiveReasoning] = useState<string[]>([]);

    // --- COGNITIVE ROUTER ---
    const detectQueryComplexity = (text: string): boolean => {
        const lower = text.toLowerCase();
        const deepTriggers = ['tại sao', 'như thế nào', 'so sánh', 'đầu tư', 'lời', 'dòng tiền', 'pháp lý', 'dự báo', 'vay', 'lãi suất'];
        const fastTriggers = ['hi', 'chào', 'sđt', 'địa chỉ', 'giá'];
        
        if (deepTriggers.some(k => lower.includes(k))) return true;
        if (fastTriggers.some(k => lower.includes(k)) && text.length < 50) return false;
        return true; 
    };

    // --- LOGIC: PROCESS AI RESPONSE ---
    const generateSteps = (functionCalls: any[] | undefined, userQuery: string, modelText: string) => {
        const steps: string[] = ["Tiếp nhận tín hiệu & Phân tích ngữ nghĩa"];
        if (functionCalls && functionCalls.length > 0) {
            const toolName = functionCalls[0].name;
            if (toolName === 'remember_preference') steps.push("Kích hoạt Memory Hook: Ghi vào Bộ Nhớ Dài Hạn");
            else steps.push(`Kích hoạt công cụ chuyên sâu: ${toolName}`);
        } else {
            steps.push("Kích hoạt mạng lưới tri thức đa ngành");
        }
        steps.push("Hoàn tất: Đề xuất chiến lược tối ưu");
        return steps;
    };

    const processResponse = useCallback((response: GenerateContentResponse, userQuery: string, duration: number, wasDeepReasoning: boolean) => {
        const modelText = response.text || "";
        const functionCalls = response.functionCalls;
        const newMessages: Message[] = [];

        const steps = wasDeepReasoning ? generateSteps(functionCalls, userQuery, modelText) : undefined;

        if (modelText) {
            newMessages.push({ 
                role: 'model', text: modelText, timestamp: new Date(),
                reasoningSteps: steps, thinkingTime: duration, isReasoning: wasDeepReasoning
            });
            if (wasDeepReasoning) setLiveReasoning(prev => ["AI: Đã phản hồi.", ...prev].slice(0, 6));
        }

        if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
                // HANDLE MEMORY HOOK
                if (call.name === 'remember_preference') {
                    const { key, value, confidence } = call.args as any;
                    setShowMemoryToast(true);
                    setTimeout(() => setShowMemoryToast(false), 4000);
                    setLiveReasoning(prev => [`AI MEMORY: Đã ghi nhớ "${value}"`, ...prev].slice(0, 6));
                    
                    // Persistence
                    const firstLead = leads[0]; // In real app, identify lead via session/URL
                    if (firstLead) {
                        dataService.addLeadMemory(firstLead.id, {
                            key, value, confidence: confidence || 1.0, extractedAt: new Date()
                        });
                    }
                    continue; 
                }

                // HANDLE WIDGETS
                const toolMapping: Record<string, string> = {
                    'show_valuation': 'valuation', 'show_comparison': 'comparison', 
                    'show_feng_shui': 'feng_shui', 'show_market_forecast': 'forecast', 
                    'show_calculator': 'calculator', 'show_lead_magnet': 'lead_magnet',
                    'show_project_info': 'show_project_info', 'show_bank_rates': 'bank_rates',
                    'show_strategy': 'strategy', 'show_legal': 'legal', 'show_finance': 'finance'    
                };
                
                if (toolMapping[call.name]) {
                    newMessages.push({ 
                        role: 'model', text: '', timestamp: new Date(), 
                        toolPayload: { type: toolMapping[call.name] as any, data: call.args } 
                    });
                    if (wasDeepReasoning) setLiveReasoning(prev => [`AI: Widget ${call.name}`, ...prev].slice(0, 6));
                }
            }
        }
        setMessages(prev => [...prev, ...newMessages]);
        setIsLoading(false);
    }, [leads]);

    // --- MAIN SEND HANDLER ---
    const handleSendMessage = async (text: string, imageFile?: File | null) => {
        const userMsg: Message = { role: 'user', text, timestamp: new Date(), image: imageFile ? URL.createObjectURL(imageFile) : undefined };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        const isComplex = detectQueryComplexity(text);
        setIsDeepReasoning(isComplex);
        const startTime = Date.now();

        try {
            const freshChatSession = createChatSession(null, session, [...messages, userMsg], targetProject, trafficSource, isComplex);
            const response = await freshChatSession.sendMessage({ message: text });
            const duration = (Date.now() - startTime) / 1000;
            processResponse(response, text, duration, isComplex);
        } catch (e: any) {
            console.error("AI Error:", e);
            setMessages(prev => [...prev, { role: 'model', text: "Hệ thống đang quá tải. Vui lòng thử lại sau giây lát.", timestamp: new Date() }]);
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
