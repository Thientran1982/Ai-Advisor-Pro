
import { GoogleGenAI, Type, FunctionDeclaration, Schema, GenerateContentResponse } from "@google/genai";
import { UserProfile, TenantProfile, Message, Lead, MarketIntel, SwarmStep, AgentRole } from "../types";
import { dataService } from "./dataService";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// UTILS: Retry Mechanism for Resilience
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        if (retries === 0) throw error;
        const code = error?.status || error?.response?.status;
        const msg = error?.message || '';
        if (!code || (code >= 500 && code < 600) || msg.includes('xhr') || msg.includes('fetch') || msg.includes('Rpc failed')) {
            console.warn(`API Error (${code || 'Network'}), retrying in ${delay}ms...`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry<T>(fn, retries - 1, delay * 2);
        }
        throw error;
    }
};

// --- TOOL DEFINITIONS ---
export const tools: FunctionDeclaration[] = [
    {
        name: "show_valuation",
        description: "Định giá BĐS chi tiết. Gọi khi khách hỏi: giá bao nhiêu, định giá, đắt hay rẻ.",
        parameters: { 
            type: Type.OBJECT, 
            properties: { 
                projectId: { type: Type.STRING, description: "ID dự án" },
                address: { type: Type.STRING, description: "Địa chỉ BĐS" }
            } 
        }
    },
    {
        name: "show_comparison",
        description: "So sánh 2-3 dự án. Gọi khi khách phân vân, so sánh A và B.",
        parameters: { type: Type.OBJECT, properties: { projectIds: { type: Type.ARRAY, items: { type: Type.STRING } } } } 
    },
    {
        name: "show_feng_shui",
        description: "Xem phong thủy. Gọi khi khách hỏi hướng, tuổi, mệnh.",
        parameters: { type: Type.OBJECT, properties: { birthYear: { type: Type.NUMBER } }, required: ["birthYear"] }
    },
    {
        name: "show_market_forecast",
        description: "Dự báo tăng giá. Gọi khi khách hỏi tiềm năng, tương lai, quy hoạch.",
        parameters: { type: Type.OBJECT, properties: { projectId: { type: Type.STRING } } }
    },
    {
        name: "show_legal",
        description: "Show hồ sơ pháp lý. Gọi khi khách hỏi sổ hồng, pháp lý, giấy phép.",
        parameters: { type: Type.OBJECT, properties: { projectId: { type: Type.STRING } }, required: ["projectId"] }
    },
    {
        name: "show_finance",
        description: "Bài toán dòng tiền/Lợi nhuận. Gọi khi khách hỏi lợi nhuận, cho thuê, yield.",
        parameters: { type: Type.OBJECT, properties: { projectId: { type: Type.STRING } } }
    },
    {
        name: "show_strategy",
        description: "Tư vấn chiến lược đầu tư.",
        parameters: { type: Type.OBJECT, properties: {} }
    },
    {
        name: "show_calculator",
        description: "Tính vay ngân hàng. Gọi khi khách hỏi vay, trả góp, lãi suất.",
        parameters: { type: Type.OBJECT, properties: { initialPrice: { type: Type.NUMBER } } }
    },
    {
        name: "show_lead_magnet",
        description: "Tặng tài liệu/Bảng giá gốc. Gọi khi khách quan tâm sâu hoặc hỏi bảng giá chi tiết.",
        parameters: { type: Type.OBJECT, properties: { documentType: { type: Type.STRING } } }
    },
    {
        name: "show_project_info",
        description: "Hiển thị thông tin/Hình ảnh dự án. Gọi khi khách muốn xem ảnh, tiện ích, vị trí.",
        parameters: { type: Type.OBJECT, properties: { projectId: { type: Type.STRING } }, required: ["projectId"] }
    },
    {
        name: "show_bank_rates",
        description: "Bảng lãi suất ngân hàng. Gọi khi hỏi lãi suất.",
        parameters: { type: Type.OBJECT, properties: {} }
    },
    {
        name: "remember_preference",
        description: "!!! QUAN TRỌNG: Ghi nhớ sở thích/thông tin quan trọng của khách hàng vào Bộ Nhớ Dài Hạn. Gọi NGAY LẬP TỨC khi khách chia sẻ thông tin cá nhân (VD: 'Anh ghét nắng chiều', 'Chị thích tầng cao', 'Nhà có 2 con').",
        parameters: {
            type: Type.OBJECT,
            properties: {
                key: { type: Type.STRING, description: "Từ khóa ngắn gọn (VD: 'hated_direction', 'family_size', 'risk_appetite')" },
                value: { type: Type.STRING, description: "Chi tiết thông tin (VD: 'Ghét hướng Tây vì nóng', '2 vợ chồng + 2 con')" },
                confidence: { type: Type.NUMBER, description: "Độ tin cậy (0.1 - 1.0). Nếu khách nói rõ ràng thì là 1.0" }
            },
            required: ["key", "value"]
        }
    }
];

// --- HELPER: CONTEXT BUILDERS ---
const getTargetProjectContext = (projectId: string | null) => {
    if (!projectId) return "";
    const project = dataService.getProjectById(projectId);
    if (!project) return "";

    return `
[DỮ LIỆU DỰ ÁN ĐANG TƯ VẤN - ƯU TIÊN SỐ 1]:
- Tên: ${project.name} (${project.status})
- Vị trí: ${project.location}
- Giá tham khảo: ${project.priceRange}
- Chủ đầu tư: ${project.developer}
- Pháp lý hiện tại: ${project.legalStatus} (Điểm pháp lý: ${project.richDetails?.legalScore}/100)
- Chính sách thanh toán: ${project.paymentSchedule}
- Tỷ suất cho thuê (Yield): ${project.richDetails?.marketAnalysis?.yield}
- Dự báo tăng giá: ${project.richDetails?.marketAnalysis?.forecast}
- Ngân hàng hỗ trợ: ${project.richDetails?.finance?.bankSupport}
- Điểm yếu (Rủi ro): ${project.richDetails?.marketAnalysis?.risks?.join(', ')}
- Điểm mạnh (Cơ hội): ${project.richDetails?.marketAnalysis?.opportunities?.join(', ')}

[CHỈ THỊ ĐẶC BIỆT]:
Khi khách hỏi về dự án này, HÃY DÙNG CÁC SỐ LIỆU TRÊN ĐỂ TRẢ LỜI. KHÔNG ĐƯỢC BỊA ĐẶT.
Nếu khách hỏi về hình ảnh, hãy gọi tool 'show_project_info'.
Nếu khách hỏi pháp lý, hãy gọi tool 'show_legal'.
`;
};

const getKnowledgeBaseContext = () => {
    const docs = dataService.getDocuments();
    if (docs.length === 0) return "";
    return `
[THÔNG TIN TỪ TÀI LIỆU NỘI BỘ (ĐÃ UPLOAD)]:
${docs.map(d => `--- FILE: "${d.name}" ---\n${(d as any).content || "Nội dung đang được xử lý..."}`).join('\n')}
`;
};

// 🔥 UPDATED: ADAPTIVE CONTEXT BUILDER 🔥
const getAdaptiveContext = (userProfile?: UserProfile | null) => {
    let adaptationContext = "";
    
    // Attempt to find lead in DB to get RICH context (Memory + Psychology)
    const leads = dataService.getAllLeadsRaw();
    // Match by Name/Phone if UserProfile provided, otherwise fallback to most recent/seed for demo
    const matchedLead = userProfile 
        ? leads.find(l => l.name === userProfile.name || l.phone === userProfile.phone)
        : leads[0]; // Fallback for seamless demo experience

    if (matchedLead) {
        adaptationContext += `[KHÁCH HÀNG HIỆN TẠI]: ${matchedLead.name} (${matchedLead.phone || 'Chưa có SĐT'})\n`;
        
        if (matchedLead.psychology) {
            const psy = matchedLead.psychology;
            adaptationContext += `
[HỒ SƠ TÂM LÝ KHÁCH HÀNG (DISC - ${psy.discType})]:
- Phong cách giao tiếp: ${psy.communicationStyle === 'brief' ? 'Ngắn gọn, đi thẳng vào vấn đề (D/C)' : 'Chi tiết, nhẹ nhàng, kể chuyện (I/S)'}.
- Khẩu vị rủi ro: ${psy.riskTolerance}.
- Nỗi đau (Pain Points): ${psy.painPoints.join(', ')}.
-> HÃY ĐIỀU CHỈNH GIỌNG VĂN (TONE) THEO HỒ SƠ NÀY.
`;
        }
        if (matchedLead.longTermMemory && matchedLead.longTermMemory.length > 0) {
            adaptationContext += `
[BỘ NHỚ DÀI HẠN (ĐIỀU KHÁCH ĐÃ TỪNG NÓI)]:
${matchedLead.longTermMemory.map(m => `- ${m.key}: ${m.value}`).join('\n')}
-> HÃY DÙNG THÔNG TIN NÀY ĐỂ CÁ NHÂN HÓA. ĐỪNG HỎI LẠI NHỮNG GÌ KHÁCH ĐÃ NÓI.
`;
        }
    }
    
    return adaptationContext;
};

// --- CORE SYSTEM INSTRUCTION BUILDER ---
const buildSystemInstruction = (agentName: string, contextBlocks: string[], isVoiceMode: boolean = false) => {
    return `
ROLE: Bạn là ${agentName}, Chuyên gia tư vấn BĐS hàng đầu. Phong cách: Chuyên nghiệp, Sắc sảo, Dựa trên số liệu.
MODE: ${isVoiceMode ? 'GIAO TIẾP GIỌNG NÓI (VOICE)' : 'CHAT VĂN BẢN (TEXT)'}

${isVoiceMode ? 
`[QUY TẮC VOICE CHAT]:
1. Trả lời NGẮN GỌN (dưới 3 câu). Văn nói tự nhiên như người Việt.
2. Đi thẳng vào vấn đề. Không liệt kê dài dòng.
3. Nếu cần show hình ảnh/bảng tính, hãy gọi tool tương ứng và nói "Em gửi anh chị xem trên màn hình ạ".
4. TẬN DỤNG KÝ ỨC: Nếu khách đã nói ghét hướng Tây, ĐỪNG bao giờ mời chào hướng Tây.` 
: 
`[QUY TẮC TEXT CHAT]:
1. Trình bày rõ ràng, dùng Markdown (Bold, List) để dễ đọc.
2. Phân tích chi tiết, đa chiều.`}

!!! GIAO THỨC XỬ LÝ SỐ ĐIỆN THOẠI/LIÊN HỆ (ƯU TIÊN TỐI THƯỢNG) !!!
Nếu khách đưa SỐ ĐIỆN THOẠI: Dừng bán hàng. Xác nhận đã nhận và hứa liên hệ lại.

!!! GIAO THỨC MEMORY HOOK !!!
Nếu khách chia sẻ thông tin cá nhân (sở thích, gia đình, ghét/thích), GỌI NGAY tool 'remember_preference'.

[CONTEXT DỮ LIỆU]:
${contextBlocks.join('\n')}
`;
};

// --- PUBLIC EXPORTS ---

export const getLiveSystemInstruction = (userProfile?: UserProfile | null) => {
    const liveData = dataService.getLiveMarketContext();
    const adaptiveContext = getAdaptiveContext(userProfile); // Fetch Memory & Psychology

    return buildSystemInstruction(
        "Advisor", 
        [
            `[THỊ TRƯỜNG]: Vàng ${liveData.gold}, Lãi suất ${liveData.rates.floating}`,
            adaptiveContext // INJECTED MEMORY FOR VOICE
        ], 
        true
    );
};

export const createChatSession = (
    userProfile?: UserProfile | null, 
    tenant?: TenantProfile | null, 
    previousMessages: Message[] = [], 
    targetProject?: string | null,
    trafficSource?: string,
    useThinkingMode: boolean = true
) => {
  const ai = getAI();
  const agentName = tenant?.name || "BDS Advisor";
  
  const liveData = dataService.getLiveMarketContext();
  const projectContext = getTargetProjectContext(targetProject);
  const docContext = getKnowledgeBaseContext();
  const adaptationContext = getAdaptiveContext(userProfile);
  
  const marketContext = `
[THỊ TRƯỜNG VĨ MÔ HIỆN TẠI - ${liveData.timestamp}]:
- Lãi suất thả nổi: ${liveData.rates.floating}.
- Vàng: ${liveData.gold} | USD: ${liveData.usd}.
- Pháp lý: ${liveData.legal}.
`;

  let sourceContext = "";
  if (trafficSource) {
      if (trafficSource.includes('facebook') || trafficSource.includes('tiktok')) sourceContext = `[NGUỒN KHÁCH: MXH] -> Thích hình ảnh, cảm xúc.`;
      else if (trafficSource.includes('google')) sourceContext = `[NGUỒN KHÁCH: TÌM KIẾM] -> Thích số liệu, phân tích.`;
  }

  const fullInstruction = buildSystemInstruction(
      agentName, 
      [projectContext, docContext, adaptationContext, marketContext, sourceContext], 
      false
  );

  const history = previousMessages
      .filter(msg => msg.text || msg.toolPayload)
      .slice(-20) 
      .map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.text + (msg.toolPayload ? `\n[SYSTEM_LOG: Đã hiển thị Widget ${msg.toolPayload.type}]` : '') }]
      }));

  const modelName = useThinkingMode ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  // Use Thinking Config for complex tasks
  const thinkingConfig = useThinkingMode ? { thinkingBudget: 16384 } : undefined;

  return ai.chats.create({
    model: modelName,
    history: history,
    config: {
      systemInstruction: fullInstruction,
      temperature: 0.3, 
      thinkingConfig: thinkingConfig, 
      tools: [
          { functionDeclarations: tools },
          { googleSearch: {} }
      ],
    },
  });
};

// 🔥 UPDATED: MULTI-AGENT SWARM WITH WATERFALL CONTEXT FLOW 🔥
export const runAgentSwarm = async (lead: Lead, onStep: (step: SwarmStep) => void): Promise<string> => {
    const ai = getAI();
    const liveContext = dataService.getLiveMarketContext();
    const contextStr = `${lead.needs} ${lead.projectInterest} ${lead.budget} ${lead.psychology?.painPoints?.join(' ')}`.toLowerCase();
    
    // --- STEP 0: FETCH REAL PROJECT DATA ---
    let projectContext = "Không có dữ liệu dự án cụ thể. Hãy tư vấn chung.";
    let project = null;
    const allProjects = dataService.getProjects();
    
    if (lead.projectInterest) {
        project = allProjects.find(p => lead.projectInterest.toLowerCase().includes(p.name.toLowerCase()));
    }
    
    if (project) {
        projectContext = `
        DỰ ÁN: ${project.name}
        - Giá: ${project.priceRange}
        - Pháp lý: ${project.legalStatus} (Điểm: ${project.richDetails?.legalScore}/100)
        - Ưu điểm: ${project.highlight}
        - Yield cho thuê: ${project.richDetails?.marketAnalysis?.yield}
        - Đối thủ: ${project.richDetails?.marketAnalysis?.competitors.join(', ')}
        - Điểm yếu (Rủi ro): ${project.richDetails?.marketAnalysis?.risks?.join(', ')}
        `;
    }

    // --- AGENT SELECTION LOGIC ---
    const activeAgents: {role: AgentRole, name: string, task: string, icon: string}[] = [];

    // LEVEL 1: PROFILING (INPUT ANALYSIS)
    if (lead.longTermMemory && lead.longTermMemory.length > 0) {
        const memories = lead.longTermMemory.map(m => `"${m.key}: ${m.value}"`).join(', ');
        activeAgents.push({
            role: 'Profiler', name: "Chuyên Gia Hồ Sơ",
            task: `Quét ký ức khách hàng (${memories}). Phát hiện mâu thuẫn hoặc điểm phù hợp đặc biệt giữa nhu cầu cũ và dự án hiện tại ${project?.name || 'này'}.`,
            icon: "Fingerprint"
        });
    }

    // LEVEL 2: HARD ANALYSIS (FACT CHECKING)
    const budgetNum = parseInt(lead.budget.replace(/\D/g, ''));
    if (lead.userType === 'enterprise' || (budgetNum > 10 && lead.budget.includes('Tỷ'))) {
        activeAgents.push({
            role: 'WealthStructurer', name: "Kỹ Sư Tài Chính",
            task: `Khách hàng VIP. Đề xuất cấu trúc vốn: Đòn bẩy tối ưu, Khấu trừ thuế, hoặc Dòng tiền kép.`,
            icon: "Landmark"
        });
    }

    if (project?.priceRange.includes('100') || contextStr.includes('cao cấp') || contextStr.includes('hạng sang')) {
        activeAgents.push({
            role: 'Curator', name: "Người Tuyển Chọn",
            task: `Phân tích tệp cư dân và vị thế xã hội. Tại sao dự án này là biểu tượng của sự thành đạt?`,
            icon: "Crown"
        });
    }

    activeAgents.push({
        role: 'TimingArchitect', name: "Kiến Trúc Sư Thời Điểm",
        task: `Trả lời câu hỏi: "Tại sao phải mua NGAY BÂY GIỜ?". Kết hợp vĩ mô (${liveContext.infra}) để tạo tính cấp thiết.`,
        icon: "Hourglass"
    });

    if (contextStr.includes('giá') || contextStr.includes('tỷ') || !!lead.budget) {
        const budgetStatus = lead.budget ? `Khách có ngân sách ${lead.budget}.` : "Chưa rõ ngân sách.";
        activeAgents.push({ 
            role: 'Valuation', name: "Chuyên Gia Định Giá", 
            task: `So sánh giá dự án (${project?.priceRange}) với ngân sách khách (${budgetStatus}). Đánh giá đắt/rẻ.`, 
            icon: "Tag" 
        });
    }

    if (lead.psychology?.riskTolerance === 'low' || contextStr.includes('rủi ro')) {
        activeAgents.push({ 
            role: 'Skeptic', name: "Người Phản Biện", 
            task: `Đóng vai người mua khó tính. Tìm ra 1 rủi ro thực tế của dự án để tạo sự tin tưởng (Radical Candor).`, 
            icon: "ShieldAlert" 
        });
    } else if (contextStr.includes('pháp lý')) {
        activeAgents.push({ 
            role: 'RiskOfficer', name: "Kiểm Soát Pháp Lý", 
            task: `Rà soát pháp lý: ${project?.legalStatus}. Xác nhận an toàn.`, 
            icon: "Scale" 
        });
    }

    if (contextStr.includes('đầu tư') || contextStr.includes('lời') || lead.purpose === 'đầu tư') {
        activeAgents.push({ 
            role: 'Strategist', name: "Hoạch Định Chiến Lược", 
            task: `Phân tích bài toán đầu tư: Lãi vốn vs Dòng tiền. So sánh với đối thủ.`, 
            icon: "LineChart" 
        });
    }

    // LEVEL 3: SOFT ANALYSIS (EMOTIONAL CONNECTION)
    if (contextStr.match(/(con|trường|học|gym|spa|bơi|sống|ở|gia đình|vợ chồng)/)) {
        activeAgents.push({
            role: 'Lifestyle', name: "Kiến Trúc Sư Lối Sống",
            task: `Vẽ ra viễn cảnh sống tại ${project?.name} dựa trên nhu cầu "${lead.needs}". Tập trung vào cảm xúc.`,
            icon: "Coffee"
        });
    }

    activeAgents.push({ 
        role: 'Closer', name: "Chuyên Gia Chốt Deal", 
        task: `Đưa ra Call-to-Action (CTA) dựa trên trạng thái khách (${lead.status}).`, 
        icon: "Target" 
    });

    // LEVEL 4: SYNTHESIS (OUTPUT)
    activeAgents.push({
        role: 'Storyteller', name: "Người Kể Chuyện",
        task: "Tổng hợp tất cả dữ liệu thành kịch bản hội thoại tự nhiên, có cảm xúc.",
        icon: "PenTool"
    });

    // SORTING LOGIC: Profiler -> Analysts -> Strategists -> Storyteller
    const discType = lead.psychology?.discType || 'Unknown';

    activeAgents.sort((a, b) => {
        if (a.role === 'Profiler') return -1; if (b.role === 'Profiler') return 1;
        if (a.role === 'Storyteller') return 1; if (b.role === 'Storyteller') return -1;

        const priorityD = { 'TimingArchitect': 1, 'WealthStructurer': 2, 'Strategist': 3, 'Valuation': 4, 'Closer': 5, 'Skeptic': 6, 'RiskOfficer': 7 };
        const priorityI = { 'Curator': 1, 'Lifestyle': 2, 'TimingArchitect': 3, 'Closer': 4, 'Strategist': 5, 'Valuation': 6 };
        const priorityS = { 'Lifestyle': 1, 'Skeptic': 2, 'RiskOfficer': 3, 'Curator': 4, 'Valuation': 5, 'Closer': 6 };
        const priorityC = { 'WealthStructurer': 1, 'Valuation': 2, 'Skeptic': 3, 'RiskOfficer': 4, 'Strategist': 5, 'TimingArchitect': 6 };
        const priorityUnknown = { 'TimingArchitect': 1, 'Valuation': 2, 'Lifestyle': 3, 'Strategist': 4, 'Closer': 5 };

        let map: any = priorityUnknown;
        if (discType === 'D') map = priorityD;
        else if (discType === 'I') map = priorityI;
        else if (discType === 'S') map = priorityS;
        else if (discType === 'C') map = priorityC;

        const scoreA = map[a.role] || 99;
        const scoreB = map[b.role] || 99;
        return scoreA - scoreB;
    });

    // EXECUTION SIMULATION (UI FEEDBACK)
    const displayAgents = activeAgents.filter(a => a.role !== 'Storyteller');
    
    for (const agent of displayAgents) {
        onStep({ 
            agentName: agent.name, agentRole: agent.task, agentType: agent.role, status: 'thinking', icon: agent.icon 
        });
        const delay = (agent.role === 'Valuation' || agent.role === 'WealthStructurer') ? 600 : 300;
        await new Promise(r => setTimeout(r, delay)); 
        onStep({ 
            agentName: agent.name, agentRole: agent.task, agentType: agent.role, status: 'done', output: "Đã có dữ liệu.", icon: agent.icon 
        });
    }

    try {
        onStep({ agentName: "Người Kể Chuyện", agentRole: "Dệt câu chuyện khách hàng...", agentType: 'Storyteller', status: 'thinking', icon: "PenTool" });

        // 🔥 THE WATERFALL PROMPT 🔥
        // Explicitly instructs the LLM to follow the cascade of information.
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `
                [VAI TRÒ]: Bạn là 'The Storyteller' (Người Kể Chuyện). Viết tin nhắn tư vấn tâm huyết cho khách.
                [MÔ HÌNH SUY LUẬN]: "WATERFALL CONTEXT FLOW" (Thác nước ngữ cảnh)
                
                Bước 1: Input
                - Khách hàng: ${lead.name} (DISC: ${discType}). Nhu cầu: ${lead.needs}.
                - Dự án: ${projectContext}.
                
                Bước 2: Processing (Giả lập suy luận của các chuyên gia)
                ${displayAgents.map((a, i) => `   ${i + 1}. [${a.role.toUpperCase()}]: ${a.task}`).join('\n')}
                
                Bước 3: Synthesis (Nhiệm vụ của bạn)
                HÃY DÙNG OUTPUT CỦA BƯỚC 2 ĐỂ VIẾT KỊCH BẢN.
                - Mở đầu: Dùng thông tin từ 'Profiler' để tạo sự kết nối cá nhân (Rapport).
                - Thân bài: Dùng số liệu từ 'Analysts' (Valuation/Legal/Wealth) để thuyết phục lý trí.
                - Cao trào: Dùng cảm xúc từ 'Lifestyle/Curator' để vẽ viễn cảnh.
                - Kết thúc: Dùng sự khẩn trương từ 'TimingArchitect/Closer' để chốt hẹn.
                
                [YÊU CẦU]: Viết văn phong tự nhiên, xưng "Em", không dùng gạch đầu dòng khô khan.
            `,
            config: { thinkingConfig: { thinkingBudget: 16384 } } 
        }));
        
        onStep({ agentName: "Người Kể Chuyện", agentRole: "Hoàn tất.", agentType: 'Storyteller', status: 'done', output: "Đã xong.", icon: "PenTool" });
        return response.text || "Lỗi tạo kịch bản.";
    } catch (e) { return "Lỗi hệ thống AI Swarm."; }
};

export const marketIntelSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sentimentScore: { type: Type.NUMBER },
    sentimentLabel: { type: Type.STRING },
    trendSummary: { type: Type.STRING },
    topNews: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, source: { type: Type.STRING }, url: { type: Type.STRING }, time: { type: Type.STRING } } } },
    bankRates: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { bank: { type: Type.STRING }, rate: { type: Type.STRING } } } },
  },
};

export const fetchMarketIntelligence = async (): Promise<MarketIntel | null> => {
    const ai = getAI();
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: "Tìm kiếm tin tức BĐS Việt Nam mới nhất 24h qua.",
            config: { 
                responseMimeType: "application/json",
                responseSchema: marketIntelSchema,
                tools: [{ googleSearch: {} }] 
            }
        }));
        if (response.text) {
            const data = JSON.parse(response.text.trim());
            return { ...data, lastUpdated: new Date() } as MarketIntel;
        }
        return null;
    } catch (error) { return null; }
};
