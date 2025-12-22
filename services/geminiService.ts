
import { GoogleGenAI, Type, FunctionDeclaration, Modality, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION, BANK_DATA } from "../constants";
import { Lead, MarketData, MacroData, MarketIntel, UserProfile } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- REQUEST DEDUPLICATION (PREVENTS DOUBLE-FIRING) ---
// Maps a unique key to a pending promise. If a request is already in flight, reuse it.
const inflightRequests = new Map<string, Promise<any>>();

async function dedupedRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (inflightRequests.has(key)) {
        // console.log(`[Dedup] Reusing in-flight request for: ${key}`);
        return inflightRequests.get(key);
    }

    const promise = fn().finally(() => {
        // Clear the promise from cache once it resolves or rejects
        // Small delay to ensure React StrictMode double-invocations catch the same promise
        setTimeout(() => inflightRequests.delete(key), 500); 
    });

    inflightRequests.set(key, promise);
    return promise;
}

// --- CIRCUIT BREAKER STATE & OBSERVER ---
let isGlobalRateLimited = false;
let rateLimitResetTime = 0;
type RateLimitListener = (isLimited: boolean) => void;
const listeners: RateLimitListener[] = [];

export const subscribeToRateLimit = (listener: RateLimitListener) => {
    listeners.push(listener);
    listener(isGlobalRateLimited); // Initial call
    return () => {
        const idx = listeners.indexOf(listener);
        if (idx > -1) listeners.splice(idx, 1);
    };
};

const notifyListeners = () => {
    listeners.forEach(l => l(isGlobalRateLimited));
};

const checkCircuitBreaker = () => {
    if (isGlobalRateLimited) {
        if (Date.now() < rateLimitResetTime) {
            return true; // Circuit is open (blocked)
        } else {
            // Cooldown over, try to reset
            isGlobalRateLimited = false;
            notifyListeners(); 
            return false;
        }
    }
    return false;
};

const activateCircuitBreaker = () => {
    if (!isGlobalRateLimited) {
        console.warn("⚡ Circuit Breaker Activated: Switching to offline mode for 60s.");
        isGlobalRateLimited = true;
        rateLimitResetTime = Date.now() + 60000; // 1 minute cooldown
        notifyListeners();
        
        // Auto-attempt reset after 60s
        setTimeout(() => {
            if (isGlobalRateLimited) {
                isGlobalRateLimited = false;
                notifyListeners();
                console.log("⚡ Circuit Breaker Reset: Trying online mode again.");
            }
        }, 60000);
    }
};

// --- HELPER: RETRY LOGIC FOR 429 ERRORS ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(fn: () => Promise<T>, retries = 2, baseDelay = 3000): Promise<T> {
    // 1. Check Circuit Breaker before attempting
    if (checkCircuitBreaker()) {
        throw new Error("Quota exceeded (Circuit Breaker Active).");
    }

    try {
        return await fn();
    } catch (error) {
        if (isQuotaExceeded(error)) {
            if (retries > 0) {
                // console.warn(`[429] Quota exceeded. Retrying in ${baseDelay}ms...`);
                await delay(baseDelay);
                return withRetry(fn, retries - 1, baseDelay * 2);
            } else {
                // All retries failed -> Activate Circuit Breaker
                activateCircuitBreaker();
            }
        }
        throw error;
    }
}

export const isQuotaExceeded = (error: any) => {
    // Check for direct status/code properties
    if (error?.status === 429 || error?.code === 429) return true;
    
    // Check for the specific error structure provided: {"error":{"code":429...}}
    if (error?.error?.code === 429 || error?.error?.status === 'RESOURCE_EXHAUSTED') return true;

    const msg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
    return msg.includes('429') || msg.includes('Quota exceeded') || msg.includes('RESOURCE_EXHAUSTED');
};

// --- CACHING UTILITIES ---
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

const getCachedData = <T>(key: string): T | null => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        const parsed = JSON.parse(item);
        const now = new Date().getTime();
        // Check TTL
        if (now - parsed.timestamp < CACHE_TTL) {
            return parsed.data;
        }
        localStorage.removeItem(key); // Expired
        return null;
    } catch (e) {
        return null;
    }
};

const setCachedData = (key: string, data: any, ttl = CACHE_TTL) => {
    try {
        const payload = {
            data: data,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
        console.warn("LocalStorage full or disabled");
    }
};

const handoffTool: FunctionDeclaration = {
  name: "handoffToSales",
  description: "Triggers when the user provides their contact information (Name and Phone Number) for sales consultation.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      customerName: { type: Type.STRING, description: "Customer's name" },
      phone: { type: Type.STRING, description: "Customer's phone number (must be valid VN phone)" },
      projectInterest: { type: Type.STRING, description: "Project they are interested in" },
      budget: { type: Type.STRING, description: "Their budget range" },
      notes: { type: Type.STRING, description: "Other notes or needs" },
    },
    required: ["customerName", "phone"],
  },
};

// Helper to clean JSON string from Markdown code blocks
const cleanJSON = (text: string) => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const createChatSession = (userProfile?: UserProfile | null, previousMessages: any[] = []) => {
  const now = new Date();
  const hours = now.getHours();
  let timeOfDay = "ngày mới";
  if (hours < 12) timeOfDay = "buổi sáng";
  else if (hours < 18) timeOfDay = "buổi chiều";
  else timeOfDay = "buổi tối";

  const realTimeInstruction = `
  \n=== REAL-TIME CONTEXT ===
  - Thời gian hiện tại: ${now.toLocaleString('vi-VN')} (${timeOfDay}).
  - Hãy chào hỏi phù hợp với thời điểm trong ngày (Ví dụ: Chào buổi sáng/chiều...).
  `;

  // --- PERSONALIZATION INJECTION ---
  let userContext = "";
  if (userProfile && userProfile.name) {
      userContext = `
      \n=== HỒ SƠ KHÁCH HÀNG VIP ===
      - Tên khách hàng: "${userProfile.name}" (Hãy xưng hô bằng tên này một cách trân trọng).
      - Lần cuối ghé thăm: ${new Date(userProfile.lastVisit).toLocaleDateString('vi-VN')}.
      - Mối quan tâm trước đây: ${userProfile.lastInterest || "Chưa rõ"}.
      - Gu đầu tư: ${userProfile.investmentStyle || "Đang tìm hiểu"}.
      
      NHIỆM VỤ CÁ NHÂN HÓA:
      1. Luôn xưng hô tên khách hàng (VD: "Chào anh ${userProfile.name.split(' ').pop()}").
      2. Nếu khách hỏi về dự án cũ (${userProfile.lastInterest}), hãy cập nhật ngay thông tin mới nhất của dự án đó.
      3. Đóng vai trò là "Quản lý tài sản riêng" (Private Banker) chứ không chỉ là sales.
      `;
  } else {
      userContext = `\n=== KHÁCH HÀNG MỚI ===\nHãy chào hỏi chuyên nghiệp, tạo ấn tượng tin cậy, hỏi thăm nhu cầu đầu tư hay mua ở để phân loại khách hàng (Profiling) ngay từ đầu.`;
  }

  const processInstruction = `
\n=== QUY TRÌNH TƯ VẤN TÂM LÝ & THỰC CHIẾN (COMBAT READY SALES) ===
Bạn là chuyên gia tư vấn BĐS Top 1 thị trường. Bạn không chỉ cung cấp thông tin, bạn BÁN GIẢI PHÁP.

1. **Thấu hiểu & Đọc vị (Empathy & Discovery):** 
   - Đừng vội bán hàng. Hãy hỏi để tìm "Pain point" (Nỗi đau). VD: Sợ lạm phát, sợ mua hớ, sợ pháp lý.
   - Nhận diện nhóm tính cách: Shark (Lợi nhuận), Nester (An cư), Luxury (Sĩ diện).

2. **Giải pháp & Neo giá (Solution & Anchoring):** 
   - Dùng kỹ thuật "Chia nhỏ giá": "Chỉ 2 tỷ ban đầu sở hữu ngay...", "Mỗi tháng trả bằng tiền cho thuê...".
   - So sánh để làm nổi bật: So sánh với các dự án cùng phân khúc nhưng giá cao hơn để thấy sự hời.

3. **Chốt chặn cảm xúc (Emotional Closing):** 
   - Tạo sự khẩn cấp (Scarcity): "Suất ngoại giao cuối cùng", "Chính sách chỉ áp dụng trong tuần này".
   - Dùng bằng chứng xã hội (Social Proof): "Nhiều khách hàng bên em ở Q7 đã chuyển qua đây vì..."

4. **Kiến thức Luật Chuyên Sâu (Expert Legal Mode):** 
   - Khi nói về pháp lý, hãy trích dẫn cụ thể:
     + **Luật Kinh Doanh BĐS 2023**: "Yên tâm về dòng tiền vì CĐT chỉ được thu cọc tối đa 5%."
     + **Luật Đất Đai 2024**: "Bảng giá đất mới sẽ làm giá nhà tăng, mua bây giờ là đáy."
     + **Luật Xây Dựng**: "Dự án đã có Giấy phép xây dựng số..., đảm bảo đúng tiến độ."

5. **Kêu gọi hành động (Call to Action):** 
   - Mục tiêu tối thượng: Xin số điện thoại (Lead Capture) để gửi bảng tính dòng tiền chi tiết.
   - Câu chốt mẫu: "Để em chạy thử bảng tính dòng tiền chi tiết gửi qua Zalo cho anh/chị xem nhé? Số Zalo anh/chị là số mấy ạ?"

=== QUAN TRỌNG: THU THẬP LEAD ===
- **TUYỆT ĐỐI KHÔNG** gọi hàm \`handoffToSales\` nếu chưa có Số điện thoại (Phone Number).
- **VALIDATE SỐ ĐIỆN THOẠI**: Phải bắt đầu bằng số '0' và có ít nhất 10 chữ số.
`;

  // --- TOKEN OPTIMIZATION: SLIDING WINDOW HISTORY ---
  // Only keep the last 10 messages to prevent token explosion.
  const recentHistory = previousMessages.slice(-10).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
  }));

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: recentHistory, // Inject pruned history
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + realTimeInstruction + userContext + processInstruction,
      tools: [{ functionDeclarations: [handoffTool] }, { googleSearch: {} }],
    },
  });
};

export const generateWelcomeBackMessage = async (profile: UserProfile): Promise<string> => {
    // 1. Check Cache first (Don't waste token on page refresh for welcome msg)
    const cacheKey = `welcome_msg_${profile.name}`;
    const cachedMsg = getCachedData<string>(cacheKey);
    if (cachedMsg) return cachedMsg;

    try {
        const hours = new Date().getHours();
        let timeGreeting = "ngày mới tốt lành";
        if (hours < 12) timeGreeting = "buổi sáng";
        else if (hours < 18) timeGreeting = "buổi chiều";
        else timeGreeting = "buổi tối";

        const resp = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Bạn là Private Banker (Quản lý tài sản cao cấp) có EQ cao. Hãy viết một tin nhắn chào mừng ngắn (tối đa 2 câu) cho khách hàng VIP tên "${profile.name}".
            - Thời gian: ${timeGreeting}.
            - Lịch sử quan tâm: Dự án "${profile.lastInterest}".
            - Tone giọng: Sang trọng, ân cần, chuyên nghiệp, tạo cảm giác được quan tâm đặc biệt.
            - Mục tiêu: Hỏi xem họ có muốn cập nhật "tin mật" hoặc chính sách mới nhất của dự án cũ không.
            - Không dùng markdown.
            - TUYỆT ĐỐI KHÔNG SỬ DỤNG EMOJI (Biểu tượng cảm xúc).`,
            config: {
                maxOutputTokens: 100 // STRICT LIMIT for welcome message
            }
        }));
        const text = resp.text || `Chào ${profile.name}, chúc anh/chị ${timeGreeting}. Anh/chị có muốn cập nhật bảng hàng mới nhất của ${profile.lastInterest || 'dự án'} không ạ?`;
        
        // Cache for 1 hour
        setCachedData(cacheKey, text, 60 * 60 * 1000); 
        return text;

    } catch (e) {
        if (isQuotaExceeded(e)) {
            // Quietly fail for welcome message
            // console.warn("Welcome Msg Quota Exceeded: Using fallback.");
        }
        return `Chào mừng ${profile.name} quay trở lại. Anh/chị cần hỗ trợ thông tin gì hôm nay ạ?`;
    }
}

export const generateMarketComparison = async (query?: string): Promise<MarketData[]> => {
  // If no query (default view), try cache
  if (!query) {
      const cached = getCachedData<MarketData[]>('market_comparison_default');
      if (cached) return cached;
  }

  // Use dedupedRequest for market comparison as well
  return dedupedRequest(`market_comp_${query || 'default'}`, async () => {
      try {
        const prompt = query 
          ? `Act as a real estate data analyst. Based on the request: "${query}", generate a JSON array containing real estate market data.
             Each item in the array must be an object with:
             - "name": District or area name (string)
             - "value": Price in Million VND/m2 (number)
             - "source": Data source (string, e.g. "Q1 2024 Report")
             Output valid JSON only.`
          : `Act as a real estate data analyst. Generate a JSON array of average real estate prices for 5 key districts in HCMC (Q1, Thu Thiem, Q7, Binh Thanh, Thu Duc).
             Each item in the array must be an object with:
             - "name": District or area name (string)
             - "value": Price in Million VND/m2 (number)
             - "source": Data source (string)
             Output valid JSON only.`;
          
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        }));

        if (response.text) {
            const cleaned = cleanJSON(response.text);
            const parsed = JSON.parse(cleaned);
            let result: MarketData[] = [];
            
            if (Array.isArray(parsed)) result = parsed as MarketData[];
            else {
                const values = Object.values(parsed);
                const arrayVal = values.find(v => Array.isArray(v));
                if (arrayVal) result = arrayVal as MarketData[];
            }

            if (result.length > 0 && !query) {
                setCachedData('market_comparison_default', result);
            }
            return result;
        }
        return [];
      } catch (error) {
        if (isQuotaExceeded(error)) {
            // console.warn("Market Data Quota Exceeded: Using offline fallback data.");
        }
        // Rich Fallback Data
        return [
           { name: 'Quận 1', value: 480, source: 'Dữ liệu Q4/2024 (Offline)' },
           { name: 'Thủ Thiêm', value: 350, source: 'Dữ liệu Q4/2024 (Offline)' },
           { name: 'Quận 7', value: 125, source: 'Dữ liệu Q4/2024 (Offline)' },
           { name: 'Bình Thạnh', value: 165, source: 'Dữ liệu Q4/2024 (Offline)' },
           { name: 'TP. Thủ Đức', value: 95, source: 'Dữ liệu Q4/2024 (Offline)' }
        ];
      }
  });
};

export const getMacroEconomics = async (): Promise<MacroData | null> => {
    // 1. Check Local Cache
    const cached = getCachedData<MacroData>('macro_economics');
    if (cached) return cached;

    // 2. Use Deduplication
    return dedupedRequest('macro_economics', async () => {
        try {
            const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: "Get current Vietnam macro economic data: Gold SJC price (Trieu/luong), USD/VND rate, and average mortgage interest rate (%). Return JSON.",
                config: {
                    tools: [{googleSearch: {}}],
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            goldSJC: { type: Type.STRING },
                            usdRate: { type: Type.STRING },
                            interestRate: { type: Type.STRING },
                            lastUpdated: { type: Type.STRING }
                        }
                    }
                }
            }));
            if (response.text) {
                const cleaned = cleanJSON(response.text);
                const data = JSON.parse(cleaned) as MacroData;
                setCachedData('macro_economics', data);
                return data;
            }
        } catch (e) {
            // Fallback handled below
        }
        // Rich Fallback Data
        return {
            goldSJC: "82.50",
            usdRate: "25.450",
            interestRate: "6.5%",
            lastUpdated: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'}) + " (Offline)"
        };
    });
};

export const fetchMarketIntelligence = async (): Promise<MarketIntel | null> => {
    // 1. Check Local Cache
    const cached = getCachedData<MarketIntel>('market_intel');
    if (cached) return { ...cached, lastUpdated: new Date(cached.lastUpdated) };

    // 2. Use Deduplication
    return dedupedRequest('market_intel', async () => {
        try {
            const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: "Analyze current Vietnam real estate market sentiment. Return JSON with sentiment score (0-100), trend summary, and top news.",
                config: {
                    tools: [{googleSearch: {}}],
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            sentimentScore: { type: Type.NUMBER },
                            sentimentLabel: { type: Type.STRING },
                            trendSummary: { type: Type.STRING },
                            topNews: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        source: { type: Type.STRING },
                                        url: { type: Type.STRING },
                                        time: { type: Type.STRING }
                                    }
                                }
                            },
                            bankRates: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        bank: { type: Type.STRING },
                                        rate: { type: Type.STRING }
                                    }
                                }
                            },
                            lastUpdated: { type: Type.STRING }
                        }
                    }
                }
            }));
            
            if (response.text) {
                const cleaned = cleanJSON(response.text);
                const data = JSON.parse(cleaned);
                setCachedData('market_intel', data);
                return { ...data, lastUpdated: new Date() };
            }
        } catch (e) {
           // Fallback below
        }
        // Rich Fallback Data
        return {
            sentimentScore: 68,
            sentimentLabel: "Tích cực",
            trendSummary: "Thị trường đang hồi phục nhẹ nhờ lãi suất cho vay giảm và các luật BĐS mới có hiệu lực. (Chế độ Offline)",
            topNews: [
                {
                    title: "Lãi suất vay mua nhà chạm đáy 2024",
                    source: "VnExpress",
                    url: "#",
                    time: "2 giờ trước"
                },
                {
                    title: "Giá chung cư TP.HCM tiếp tục lập đỉnh mới",
                    source: "CafeF",
                    url: "#",
                    time: "5 giờ trước"
                },
                {
                    title: "Thủ Thiêm đón sóng đầu tư hạ tầng cuối năm",
                    source: "ZingNews",
                    url: "#",
                    time: "1 ngày trước"
                }
            ],
            bankRates: BANK_DATA.slice(0, 3).map(b => ({ bank: b.bankName, rate: `${b.rateFirstYear}%` })),
            lastUpdated: new Date()
        };
    });
}

export const generateSpeech = async (text: string, voice: string = 'Aoede'): Promise<string | null> => {
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: {
                parts: [{ text: text }]
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice }
                    }
                }
            }
        }));
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        if (isQuotaExceeded(error)) {
            console.warn("TTS Quota Exceeded: Switching to native browser speech.");
        } else {
            console.error("TTS Error:", error);
        }
        return null;
    }
};

export const generateSalesScript = async (lead: Lead): Promise<string> => {
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Bạn là chuyên gia huấn luyện sales BĐS. Hãy viết kịch bản telesale (gọi điện) đỉnh cao cho khách hàng tiềm năng này:
- Tên: ${lead.name}
- Quan tâm: ${lead.projectInterest}
- Nhu cầu: ${lead.needs}
- Ngân sách: ${lead.budget}
- Mục đích: ${lead.purpose}
- Trạng thái: ${lead.status}

YÊU CẦU KỊCH BẢN:
1. Mở đầu: Gây ấn tượng trong 5 giây đầu (Hook). Tránh câu "Em chào anh, em gọi từ..." nhàm chán.
2. Khai thác nỗi đau (Pain Point): Đặt câu hỏi để tìm ra vấn đề của khách (Sợ lạm phát? Sợ mua hớ? Cần dòng tiền?).
3. Giải pháp (Solution): Kết nối dự án ${lead.projectInterest} như một giải pháp tài chính/an cư hoàn hảo.
4. Xử lý từ chối (Objection Handling): Dự đoán 1 lời từ chối khách có thể nói và viết câu đối đáp sắc sảo.
5. Chốt hẹn (Closing): Mời tham quan nhà mẫu hoặc gửi bảng tính dòng tiền.
`,
        }));
        return response.text || "Could not generate script.";
    } catch (error) {
        if (isQuotaExceeded(error)) {
            return `### Kịch bản (Chế độ Offline)\n\n**Chào hỏi:** "Dạ em chào anh/chị ${lead.name}, em gọi từ dự án ${lead.projectInterest}..."\n\n**Kết nối:** "Em thấy anh/chị đang quan tâm đến ${lead.projectInterest} với ngân sách tầm ${lead.budget}..."\n\n*(Hệ thống đang quá tải, vui lòng thử lại sau để có kịch bản chi tiết hơn)*`;
        }
        console.error("Script generation error", error);
        return "Lỗi khi tạo kịch bản.";
    }
};

export const generateFallbackChatResponse = (text: string) => {
    return "Hiện tại hệ thống AI đang quá tải (Quota Exceeded). Tuy nhiên, tôi vẫn có thể giúp bạn sử dụng các công cụ tính toán như:\n- Tính dòng tiền\n- Ước tính khoản vay\n- So sánh lãi suất\n\nVui lòng chọn công cụ từ menu hoặc thử lại sau giây lát.";
};
