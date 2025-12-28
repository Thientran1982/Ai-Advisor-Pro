
/**
 * BRAIN CONFIGURATION: PROMPT ENGINEERING & KNOWLEDGE BASE
 * =============================================================================
 * DEFINES THE PERSONALITY, KNOWLEDGE BASE, AND BEHAVIORAL GUARDRAILS.
 * UPDATED FOR VIETNAM REAL ESTATE MARKET (REAL-TIME CONTEXT SIMULATION).
 * VERSION: 6.0 (HUMAN-CENTRIC SUPPORT ARCHITECTURE)
 * 
 * @module Constants
 * =============================================================================
 */

import { Project } from "./types";

// ADVISOR KNOWLEDGE BASE (Structured for Algo Consumption)
// UPDATED: Real-world Vietnam Market Data (Simulation Mode: Late 2024/Early 2025)
export const MACRO_ECONOMY = {
    version: "Advisor AI 6.0 (Gemini 3 Pro Core)",
    interestRate: {
        big4: "5.8% - 6.2%", // Vietcombank, BIDV, etc.
        commercial: "6.8% - 8.5%", // Techcom, VPBank, etc.
        floating: "9.5% - 10.5%", // Realistic floating rate
        baseFloating: 10.5, // Number for calculation
        note: "Lãi suất đang ở vùng đáy 10 năm, nhưng biên độ thả nổi bắt đầu nhích nhẹ." 
    },
    goldPrice: "84.5 triệu/lượng (SJC)",
    usdRate: "25.420 VND",
    legalContext: "LUẬT MỚI: Luật Kinh doanh BĐS 2023 siết chặt phân lô bán nền. Bảng giá đất mới sát giá thị trường làm tăng chi phí chuyển đổi.",
    infrastructure: "Vành Đai 3 đang thi công rầm rộ. Nút giao An Phú dự kiến thông xe hầm chui Q1/2025.",
    marketTrend: "Thanh khoản tập trung vào BĐS có pháp lý sạch và bàn giao ngay. Đất nền tỉnh vùng ven vẫn đóng băng."
};

export const FEATURED_PROJECTS: Project[] = [
  {
    id: 'eaton_park',
    name: "Eaton Park",
    developer: "Gamuda Land (Malaysia)",
    location: "Mặt tiền Mai Chí Thọ, P. An Phú, TP. Thủ Đức",
    priceRange: "125 - 145 triệu/m²",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    type: ["Căn hộ hạng sang", "Penthouse"],
    status: "Đang thi công móng cọc",
    highlight: "Pháp lý chuẩn chỉnh nhất khu Đông. Thiết kế Biophilic (Ưa sinh học).",
    legalStatus: "Đã có GPXD. Dự kiến ký HĐMB Q3/2024.",
    paymentSchedule: "Thanh toán giãn 50% đến khi nhận nhà (3 năm).",
    richDetails: {
        marketAnalysis: {
            yield: "5.0% - 6.0%",
            baseYield: 0.055, 
            appreciationPotential: "Rất Cao (Ăn theo hạ tầng nút giao An Phú)",
            competitors: ["The Global City (Cao tầng)", "Lumiere Riverside"],
            risks: ["Ùn tắc giao thông cục bộ giờ cao điểm", "Giá sơ cấp thiết lập mặt bằng mới"],
            opportunities: ["Khan hiếm nguồn cung căn hộ hạng sang khu Đông", "Thương hiệu Gamuda uy tín"],
            forecast: "Tăng giá 15-20% khi bàn giao và nút giao An Phú hoàn thiện."
        },
        legalDetail: "Đất sở hữu lâu dài. Người nước ngoài 50 năm.",
        legalScore: 95, 
        fengShui: {
            direction: "Đông Nam (Mát), Tây Bắc (View Landmark)",
            element: "Mộc & Thủy",
            note: "Thế đất Tụ Thủy, vượng khí, mặt tiền đại lộ."
        },
        finance: {
            bankSupport: "Vietinbank, Public Bank, BIDV",
            minDownPayment: "5% ký HĐMB",
            maxLoanRatio: 0.7
        }
    }
  },
  {
    id: 'global_city',
    name: "The Global City",
    developer: "Masterise Homes",
    location: "Đỗ Xuân Hợp, P. An Phú, TP. Thủ Đức",
    priceRange: "380 - 550 triệu/m² (Nhà phố)",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    type: ["Nhà phố SOHO", "Biệt thự", "Căn hộ"],
    status: "Đã bàn giao khu SOHO",
    highlight: "Trung tâm mới (New Downtown). Tiện ích chuẩn quốc tế Foster + Partners.",
    legalStatus: "Sổ hồng từng căn (Khu SOHO).",
    paymentSchedule: "Thanh toán sớm chiết khấu 9%. Vay 80% ân hạn gốc lãi.",
    richDetails: {
        marketAnalysis: {
            yield: "3.0% - 4.0% (Giai đoạn đầu)",
            baseYield: 0.035,
            appreciationPotential: "Đột biến dài hạn nhờ đường Liên Phường nối thông.",
            competitors: ["Thủ Thiêm (Metropole, Empire)"],
            risks: ["Giá vốn rất cao, kén khách thuê", "Cần chờ TTTM hoạt động để hút traffic"],
            opportunities: ["Kết nối Q9 về Thảo Điền chỉ 5 phút (khi đường thông)", "Biểu tượng địa vị (Status Symbol)"],
            forecast: "Tài sản trú ẩn (Safe Haven) chống lạm phát tốt nhất."
        },
        legalDetail: "Pháp lý sạch 100%. Masterise rất mạnh về ra sổ.",
        legalScore: 99,
        fengShui: {
            direction: "Đa dạng (Tứ trạch)",
            element: "Kim & Thổ",
            note: "Vị trí long mạch, quy hoạch bàn cờ chuẩn mực."
        },
        finance: {
            bankSupport: "Techcombank (Strategic Partner)",
            minDownPayment: "20%",
            maxLoanRatio: 0.8
        }
    }
  },
  {
    id: 'empire',
    name: "Empire City",
    developer: "Keppel Land (Singapore)",
    location: "Khu chức năng 2B, Thủ Thiêm, TP.HCM",
    priceRange: "160 - 450 triệu/m²",
    image: "https://images.unsplash.com/photo-1565538420870-da08ff96a207?auto=format&fit=crop&w=1200&q=80",
    type: ["Căn hộ hạng sang", "Duplex", "Penthouse"],
    status: "Đã bàn giao (Linden, Tilia, Cove, Narra)",
    highlight: "Vị trí ven sông trực diện Quận 1. Cộng đồng cư dân tinh hoa.",
    legalStatus: "Đã có sổ hồng (Linden, Tilia).",
    paymentSchedule: "Thanh toán 95% nhận nhà ngay (Mua thứ cấp).",
    richDetails: {
        marketAnalysis: {
            yield: "4.5% - 5.5%",
            baseYield: 0.05,
            appreciationPotential: "Ổn định, tăng trưởng bền vững theo Thủ Thiêm.",
            competitors: ["The Metropole Thủ Thiêm", "The River Thủ Thiêm"],
            risks: ["Tòa tháp 88 tầng chưa khởi công", "Giá thứ cấp đã tăng khá cao"],
            opportunities: ["Cầu Thủ Thiêm 4 sắp triển khai", "View sông vĩnh viễn không bị chắn"],
            forecast: "Giữ giá cực tốt, thanh khoản cao nhất Thủ Thiêm."
        },
        legalDetail: "Sổ hồng sở hữu lâu dài. Keppel Land uy tín top đầu.",
        legalScore: 98,
        fengShui: {
            direction: "Tây Nam (View Q1), Đông Bắc (View hồ)",
            element: "Thủy",
            note: "Ngọc đới ôm eo (Sông Sài Gòn bao quanh)."
        },
        finance: {
            bankSupport: "Vietcombank, UOB, Shinhan",
            minDownPayment: "30%",
            maxLoanRatio: 0.7
        }
    }
  }
];

export const QUICK_PROMPTS = [
  "Lãi suất vay mua nhà VCB hôm nay?",
  "Pháp lý Eaton Park có ổn không?",
  "So sánh dòng tiền Metropole vs Global City?",
  "Đường Liên Phường khi nào thông xe?"
];

// 🔥 UPDATED: HUMAN-CENTRIC SYSTEM INSTRUCTION
export const SYSTEM_INSTRUCTION = `
ROLE: Bạn là [TEN_SEP] - Trợ lý Phân tích Cấp cao (Senior Analyst Assistant).
MISSION: Nhiệm vụ của bạn là hỗ trợ nhà môi giới bằng cách cung cấp dữ liệu chính xác, phân tích chuyên sâu và các góc nhìn đa chiều. Bạn là "người đứng sau cánh gà", giúp môi giới tỏa sáng trước khách hàng.

!!! NGUYÊN TẮC HỖ TRỢ (SUPPORT PROTOCOLS) !!!

1. **Giao thức Phân tích (Analytic Support):**
   - Nhiệm vụ của bạn là xử lý số liệu (lãi suất, dòng tiền, pháp lý) thật nhanh và chính xác.
   - Luôn đưa ra các kịch bản (Scenario Planning): "Nếu thị trường tốt...", "Nếu rủi ro xảy ra...".
   - Để quyền quyết định và lời khuyên cuối cùng cho nhà môi giới (người hiểu cảm xúc khách hàng nhất).

2. **Giao thức Đề xuất (Suggestion Mode):**
   - Thay vì ra lệnh, hãy dùng ngôn ngữ đề xuất: "Dựa trên dữ liệu, em gợi ý...", "Anh/chị có thể cân nhắc hướng tư vấn này...".
   - Nếu thấy khách hàng gặp khó khăn tài chính, hãy GỢI Ý các giải pháp cấu trúc vốn để môi giới tham khảo.

3. **Giao thức Cảnh báo (Risk Alert):**
   - Bạn là người gác cổng rủi ro. Nếu thấy pháp lý dự án có vấn đề hoặc lãi suất đang tăng, hãy CẢNH BÁO nhẹ nhàng để môi giới lưu ý.

!!! TONE & VOICE (GIỌNG ĐIỆU) !!!
- **Tận tâm (Dedicated):** Luôn sẵn sàng hỗ trợ, xưng hô "Em" với môi giới.
- **Khách quan (Objective):** Cung cấp dữ liệu trung thực, không thiên vị.
- **Chuyên nghiệp (Professional):** Ngắn gọn, súc tích, đi thẳng vào trọng tâm.

[CONTEXT - THỜI GIAN THỰC]: Dữ liệu thị trường được cập nhật liên tục. Hãy dùng nó để trang bị kiến thức tốt nhất cho môi giới.
`;
