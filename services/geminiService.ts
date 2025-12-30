
import { GoogleGenAI, Type, FunctionDeclaration, Schema, GenerateContentResponse, Content, Part } from "@google/genai";
import { UserProfile, TenantProfile, Message, Lead, MarketIntel } from "../types";
import { dataService } from "./dataService";
import { DOMAIN_KNOWLEDGE_BASE } from "../constants";

// EXPORT THIS FOR LANGGRAPH SERVICE
export const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    // 🔥 NEW: REAL-TIME ERP TOOL
    {
        name: "check_inventory",
        description: "Truy cập hệ thống ERP/CRM để kiểm tra tình trạng giỏ hàng (Còn/Hết), giá bán chính xác và mã căn. GỌI TOOL NÀY KHI KHÁCH HỎI VỀ: Tình trạng căn, Giá cụ thể, Chính sách bán hàng, Thông tin dự án.",
        parameters: { 
            type: Type.OBJECT, 
            properties: { 
                project_name: { type: Type.STRING, description: "Tên dự án (VD: Eaton Park, Global City)" },
                unit_code: { type: Type.STRING, description: "Mã căn hộ (nếu có, VD: A5.12.05)" }
            },
            required: ["project_name"]
        }
    },
    {
        name: "show_valuation",
        description: "Hiển thị bảng định giá BĐS (Comparative Market Analysis). LƯU Ý: Tool này chỉ vẽ biểu đồ. ĐỂ CÓ SỐ LIỆU ĐIỀN VÀO BIỂU ĐỒ, BẠN BẮT BUỘC PHẢI DÙNG 'googleSearch' với các nguồn sau: [batdongsan.com.vn, homedy.com, alonhadat.com.vn, nhatot.com, muaban.net] để tìm giá rao bán thực tế.",
        parameters: { 
            type: Type.OBJECT, 
            properties: { 
                projectId: { type: Type.STRING, description: "ID dự án" },
                address: { type: Type.STRING, description: "Địa chỉ BĐS" }
            } 
        }
    },
    {
        name: "show_bank_rates",
        description: "Hiển thị bảng lãi suất. LƯU Ý: Trước khi gọi tool này, BẮT BUỘC phải dùng 'googleSearch' tìm 'Lãi suất vay mua nhà các ngân hàng hôm nay' để điền dữ liệu thực tế vào lời thoại.",
        parameters: { type: Type.OBJECT, properties: {} }
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
// 🔥 CHANGED: Now returns minimal info, forcing AI to use tools to get details
const getTargetProjectContext = (projectId: string | null) => {
    if (!projectId) return "";
    const project = dataService.getProjectById(projectId);
    if (!project) return "";

    return `
[DỰ ÁN ĐANG TƯ VẤN]: ${project.name}
(Để lấy giá, chính sách, tình trạng căn, HÃY DÙNG TOOL 'check_inventory'. KHÔNG ĐƯỢC TỰ BỊA DỮ LIỆU)
`;
};

const getKnowledgeBaseContext = () => {
    const docs = dataService.getDocuments();
    if (docs.length === 0) return "";
    return `
[THÔNG TIN TỪ TÀI LIỆU NỘI BỘ (RAG)]:
${docs.map(d => `--- FILE: "${d.name}" ---\n${(d as any).content || "Nội dung đang được xử lý..."}`).join('\n')}
`;
};

const getAdaptiveContext = (userProfile?: UserProfile | null) => {
    let adaptationContext = "";
    const leads = dataService.getAllLeadsRaw();
    const matchedLead = userProfile 
        ? leads.find(l => l.name === userProfile.name || l.phone === userProfile.phone)
        : leads[0]; 

    if (matchedLead) {
        adaptationContext += `[KHÁCH HÀNG]: ${matchedLead.name} (${matchedLead.phone || 'N/A'})\n`;
        if (matchedLead.psychology) {
            const psy = matchedLead.psychology;
            adaptationContext += `[DISC]: ${psy.discType} - ${psy.riskTolerance === 'high' ? 'Thích rủi ro' : 'An toàn'}.\n`;
        }
        if (matchedLead.longTermMemory && matchedLead.longTermMemory.length > 0) {
            adaptationContext += `[MEMORY]: ${matchedLead.longTermMemory.map(m => m.value).join('; ')}\n`;
        }
    }
    return adaptationContext;
};

// --- CORE SYSTEM INSTRUCTION BUILDER ---
const buildSystemInstruction = (agentName: string, contextBlocks: string[], isVoiceMode: boolean = false) => {
    return `
ROLE: Bạn là ${agentName}, Chuyên gia BĐS Real-time.

!!! [TRUST_BRIDGE_PROTOCOL] - QUY TẮC SỐNG CÒN !!!
1. **Dữ liệu Nội bộ (Internal Data):**
   - Khi khách hỏi: "Giá bao nhiêu?", "Căn này còn không?", "Chính sách bán hàng thế nào?"
   - **HÀNH ĐỘNG BẮT BUỘC:** Gọi tool \`check_inventory\`.
   - **CẤM:** Không được tự bịa ra giá hoặc tình trạng căn. Nếu tool không trả về, hãy nói "Tôi cần kiểm tra lại Admin".

2. **Dữ liệu Thị trường (External Data - White-list Sources):**
   - Khi khách hỏi: "Lãi suất ngân hàng?", "Giá vàng?", "Giá cắt lỗ/thứ cấp?", "Giá thị trường căn này bao nhiêu?".
   - **HÀNH ĐỘNG BẮT BUỘC:** Gọi tool \`googleSearch\`.
   - **NGUỒN BẮT BUỘC TRA CỨU:**
     - batdongsan.com.vn
     - homedy.com
     - alonhadat.com.vn
     - nhatot.com
     - muaban.net
   - **CẤM:** Tuyệt đối không dùng cụm từ "[Source: ERP]" cho dữ liệu thị trường bên ngoài. Phải trích dẫn: "[Source: batdongsan.com.vn]".

3. **Ghi nhớ (Memory):**
   - Khi khách chia sẻ thông tin cá nhân -> Gọi tool \`remember_preference\`.

${isVoiceMode ? 
`[VOICE MODE]: Trả lời ngắn gọn (< 50 từ). Tập trung vào trọng tâm.` 
: 
`[TEXT MODE]: Trình bày đẹp (Markdown). Dùng Bullet point cho dễ đọc. Trích dẫn URL nguồn tin.`}

[CONTEXT DỮ LIỆU]:
${contextBlocks.join('\n')}
`;
};

// 🔥 HISTORY NORMALIZATION 🔥
const normalizeHistory = (messages: Message[]): Content[] => {
    const history: Content[] = [];
    let currentRole: string | null = null;
    let currentParts: Part[] = [];

    // Filter only valid messages
    const validMessages = messages.filter(msg => msg.text || msg.toolPayload || msg.image);

    for (const msg of validMessages) {
        const role = msg.role; // 'user' or 'model'
        const text = msg.text + (msg.toolPayload ? `\n[SYSTEM_LOG: Đã dùng Tool ${msg.toolPayload.type}]` : '');
        
        // Ensure text is not empty if it's the only part
        const safeText = text || (msg.image ? "" : "."); 
        
        const part: Part = { text: safeText };
        
        // If switching role, push previous group
        if (currentRole && currentRole !== role) {
            history.push({ role: currentRole, parts: currentParts });
            currentParts = [];
        }

        currentRole = role;
        currentParts.push(part);
    }

    // Push the last group
    if (currentRole && currentParts.length > 0) {
        history.push({ role: currentRole, parts: currentParts });
    }

    // 🔥 RULE: History must START with User. If Model is first, remove it.
    if (history.length > 0 && history[0].role === 'model') {
        history.shift();
    }
    
    return history;
};

// --- PUBLIC EXPORTS ---

export const getLiveSystemInstruction = (userProfile?: UserProfile | null) => {
    const adaptiveContext = getAdaptiveContext(userProfile); 
    const now = new Date().toLocaleString('vi-VN');

    return buildSystemInstruction(
        "Advisor", 
        [
            `[THỜI GIAN]: ${now}`,
            DOMAIN_KNOWLEDGE_BASE, 
            adaptiveContext,
            "LƯU Ý: Đây là chế độ hội thoại trực tiếp."
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
  const now = new Date().toLocaleString('vi-VN');
  
  const aiConfig = tenant?.aiConfig;
  
  let brandInstruction = "";
  if (aiConfig?.tone === 'friendly') brandInstruction = "Tone: Thân thiện, emoji.";
  else if (aiConfig?.tone === 'data_driven') brandInstruction = "Tone: Phân tích số liệu, logic.";
  else brandInstruction = "Tone: Chuyên nghiệp.";

  const projectContext = getTargetProjectContext(targetProject);
  const docContext = getKnowledgeBaseContext();
  const adaptationContext = getAdaptiveContext(userProfile);
  
  const marketContext = `
[THỜI GIAN THỰC]: ${now}.
[YÊU CẦU]: Dữ liệu biến động (Lãi suất, Giá thị trường) phải search từ Batdongsan.com.vn, Homedy...
`;

  const fullInstruction = buildSystemInstruction(
      agentName, 
      [brandInstruction, DOMAIN_KNOWLEDGE_BASE, projectContext, docContext, adaptationContext, marketContext], 
      false
  );

  const normalizedHistory = normalizeHistory(previousMessages.slice(0, -1)); // Exclude the new message

  const modelName = useThinkingMode ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  const thinkingConfig = useThinkingMode ? { thinkingBudget: 16384 } : undefined;

  return ai.chats.create({
    model: modelName,
    history: normalizedHistory,
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

export const marketIntelSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sentimentScore: { type: Type.NUMBER },
    sentimentLabel: { type: Type.STRING },
    trendSummary: { type: Type.STRING },
    goldPrice: { type: Type.STRING, description: "Giá vàng SJC hôm nay (VND/lượng)" },
    usdRate: { type: Type.STRING, description: "Tỷ giá USD/VND VCB hôm nay" },
    floatingRate: { type: Type.STRING, description: "Lãi suất thả nổi trung bình vay mua nhà (Vietcombank, BIDV...)" },
    topNews: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, source: { type: Type.STRING }, url: { type: Type.STRING }, time: { type: Type.STRING } } } },
    bankRates: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { bank: { type: Type.STRING }, rate: { type: Type.STRING } } } },
  },
};

export const fetchMarketIntelligence = async (): Promise<MarketIntel | null> => {
    const ai = getAI();
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: "Tìm kiếm các chỉ số tài chính mới nhất tại Việt Nam ngày hôm nay: 1) Giá vàng SJC (Mua/Bán). 2) Tỷ giá USD Vietcombank. 3) Lãi suất vay mua nhà thả nổi trung bình các ngân hàng Big4. 4) Top 5 tin tức bất động sản quan trọng nhất trong 24h qua (ưu tiên CafeF, VnExpress, Batdongsan.com.vn). Trả về JSON theo schema.",
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
