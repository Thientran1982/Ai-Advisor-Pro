
/**
 * BRAIN CONFIGURATION: PROMPT ENGINEERING & KNOWLEDGE BASE
 * =============================================================================
 * DEFINES THE PERSONALITY, KNOWLEDGE BASE, AND BEHAVIORAL GUARDRAILS.
 * UPDATED FOR VIETNAM REAL ESTATE MARKET (REAL-TIME CONTEXT SIMULATION).
 * VERSION: 9.3 (Source Enforcement: Batdongsan, Homedy, Nhatot)
 * 
 * @module Constants
 * =============================================================================
 */

import { Project } from "./types";

// 🔥 DOMAIN TRUTHS (Kiến thức nghiệp vụ bất biến - Verified Data)
export const DOMAIN_KNOWLEDGE_BASE = `
[HỆ THỐNG KIẾN THỨC NGHIỆP VỤ BẤT BIẾN (DOMAIN TRUTH)]:

1. **KHUNG PHÁP LÝ 2024-2025 (Legal Framework):**
   - **Luật Đất đai 2024:** Bỏ khung giá đất, áp dụng bảng giá đất sát thị trường. Siết chặt phân lô bán nền.
   - **Luật Kinh doanh BĐS 2023:** CĐT phải công khai đầy đủ thông tin trước khi mở bán. Tiền cọc không quá 5%.
   - **Người nước ngoài:** Sở hữu 50 năm (được gia hạn). Tối đa 30% căn hộ/tòa.

2. **NGUỒN DỮ LIỆU ĐỊNH GIÁ & THAM CHIẾU BẮT BUỘC (MANDATORY SOURCES):**
   - **Khi khách hỏi giá thị trường/cắt lỗ/thứ cấp:** BẮT BUỘC tra cứu và trích dẫn từ:
     1. **batdongsan.com.vn** (Ưu tiên số 1)
     2. **homedy.com**
     3. **alonhadat.com.vn**
     4. **nhatot.com** (Chợ Tốt Nhà)
     5. **muaban.net**
   - **LƯU Ý:** Tuyệt đối không dùng nguồn "ERP" cho giá thị trường thứ cấp. ERP chỉ dùng cho giỏ hàng sơ cấp của Chủ đầu tư.

3. **CẤU TRÚC THUẾ & PHÍ (Mới nhất):**
   - **Phí bảo trì (PBT):** 2% giá trị căn hộ (trước VAT).
   - **Thuế VAT:** 10%.
   - **Lệ phí trước bạ:** 0.5% giá trị tài sản (theo khung giá mới).
   - **Phí môi giới:** Thị trường sơ cấp (F1): 1.5% - 3%. Thứ cấp (F2): 1% - 2%.
`;

export const MACRO_ECONOMY = {
    version: "Advisor AI 9.3 (Expert Mode)",
    snapshotDate: "DYNAMIC_REALTIME",
    interestRate: {
        big4: "SEARCH_REQUIRED", 
        commercial: "SEARCH_REQUIRED", 
        baseFloating: 10.5, 
        note: "Lãi suất thả nổi đang là mối quan tâm hàng đầu. BẮT BUỘC kiểm tra lãi suất cơ sở (Base Rate) khi tư vấn vay." 
    },
    goldPrice: "SEARCH_REQUIRED", 
    usdRate: "SEARCH_REQUIRED", 
    legalContext: "Luật Đất Đai 2024, Luật Kinh Doanh BĐS 2023, Luật Nhà Ở 2023.",
    infrastructure: "Vành đai 3 (HCM), Sân bay Long Thành, Cao tốc Biên Hòa - Vũng Tàu, Metro số 1 (Bến Thành - Suối Tiên)."
};

// 🔥 MEGA PROJECT DATABASE (Content Enriched with Selling Points)
export const FEATURED_PROJECTS: Project[] = [
  // ========================================================================
  // KHU ĐÔNG TP.HCM (TP. THỦ ĐỨC)
  // ========================================================================
  {
    id: 'eaton_park',
    name: "Eaton Park",
    developer: "Gamuda Land (Malaysia)",
    location: "Mặt tiền Mai Chí Thọ, P. An Phú, TP. Thủ Đức",
    priceRange: "125 - 150 triệu/m²",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    type: ["Căn hộ hạng sang", "Penthouse"],
    status: "Đang thi công (Hầm móng)",
    highlight: "Biểu tượng kiến trúc Biophilic. Vị trí cửa ngõ khu Đông.",
    legalStatus: "GPXD, Quy hoạch 1/500 đầy đủ.",
    paymentSchedule: "Thanh toán giãn 5% mỗi đợt. 3 năm nhận nhà.",
    richDetails: {
        marketAnalysis: {
            yield: "5.5% - 6.0%",
            baseYield: 0.055, 
            appreciationPotential: "Rất Cao (Hưởng lợi trực tiếp từ Nút giao An Phú)",
            competitors: ["The Global City", "Lumiere Riverside"],
            risks: ["Ùn tắc giao thông cục bộ trong thời gian thi công nút giao"],
            opportunities: ["Khan hiếm nguồn cung mới tại An Phú", "Thương hiệu Gamuda bảo chứng chất lượng"],
            forecast: "Tăng giá ổn định 10-15%/năm theo tiến độ hạ tầng."
        },
        legalDetail: "Sở hữu lâu dài (Người VN). 50 năm (Người NN).",
        legalScore: 98, 
        fengShui: { direction: "Đông Nam, Tây Bắc", element: "Mộc & Thủy", note: "Thế đất Tụ Thủy sinh Tài." },
        finance: { bankSupport: "Vietinbank, Public Bank, BIDV", minDownPayment: "5%", maxLoanRatio: 0.7 }
    }
  },
  {
    id: 'global_city',
    name: "The Global City",
    developer: "Masterise Homes",
    location: "Đỗ Xuân Hợp, P. An Phú, TP. Thủ Đức",
    priceRange: "380 - 450 triệu/m² (Nhà phố)",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    type: ["Nhà phố SOHO", "Biệt thự", "Căn hộ"],
    status: "Đã bàn giao khu SOHO",
    highlight: "New Downtown. Thiết kế bởi Foster+Partners. Nhạc nước lớn nhất ĐNA.",
    legalStatus: "Sổ hồng từng căn.",
    paymentSchedule: "Thanh toán sớm chiết khấu cao.",
    richDetails: {
        marketAnalysis: {
            yield: "3.5% - 4.5% (Giai đoạn đầu)",
            baseYield: 0.04,
            appreciationPotential: "Đột biến dài hạn (Khi TTTM 123.000m2 hoạt động)",
            competitors: ["Thủ Thiêm Zeit", "Metropole"],
            risks: ["Vốn đầu tư ban đầu lớn"],
            opportunities: ["Kết nối đường Liên Phường", "Biểu tượng địa vị xã hội"],
            forecast: "Tài sản trú ẩn an toàn, định vị đẳng cấp."
        },
        legalDetail: "Pháp lý sạch 100%. Đã có sổ.",
        legalScore: 99,
        fengShui: { direction: "Đa dạng", element: "Kim & Thổ", note: "Vị trí Long mạch, Tọa sơn hướng thủy." },
        finance: { bankSupport: "Techcombank", minDownPayment: "20%", maxLoanRatio: 0.8 }
    }
  },
  {
    id: 'vhgp',
    name: "Vinhomes Grand Park",
    developer: "Vingroup",
    location: "Nguyễn Xiển, P. Long Thạnh Mỹ, TP. Thủ Đức",
    priceRange: "45 - 80 triệu/m²",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=80",
    type: ["Căn hộ", "Nhà phố", "Biệt thự"],
    status: "Bàn giao nhiều phân khu (Glory Heights đang bán)",
    highlight: "Đại đô thị thông minh. Công viên 36ha. Vincom Mega Mall.",
    legalStatus: "Sổ hồng (Khu cũ), HĐMB (Khu mới).",
    paymentSchedule: "Vay 70% miễn lãi 18-24 tháng.",
    richDetails: {
        marketAnalysis: {
            yield: "4.5% - 5.5%",
            baseYield: 0.05,
            appreciationPotential: "Trung bình - Ổn định",
            competitors: ["Masteri Centre Point", "MT Eastmark"],
            risks: ["Nguồn cung thứ cấp lớn, cạnh tranh cho thuê cao"],
            opportunities: ["Vành đai 3 đi qua dự án (kết nối 2026)", "Hệ sinh thái Vingroup trọn vẹn"],
            forecast: "Tăng trưởng bền vững theo hạ tầng Vành đai 3."
        },
        legalDetail: "Chuẩn chỉnh.",
        legalScore: 90,
        fengShui: { direction: "Đông Tứ Trạch, Tây Tứ Trạch", element: "Thủy & Mộc", note: "Kề sông Tắc và sông Đồng Nai." },
        finance: { bankSupport: "Techcombank, MB, Vietcombank", minDownPayment: "15%", maxLoanRatio: 0.8 }
    }
  },
  {
    id: 'metropole',
    name: "The Metropole Thủ Thiêm",
    developer: "SonKim Land",
    location: "Khu chức năng số 1, Thủ Thiêm",
    priceRange: "8,000 - 12,000 USD/m²",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    type: ["Căn hộ hạng sang", "Shophouse"],
    status: "Bàn giao The Opera/The Crest",
    highlight: "Vị trí kim cương ngay chân cầu Ba Son. View trực diện Q1.",
    legalStatus: "HĐMB / Sổ hồng",
    paymentSchedule: "Thanh toán theo tiến độ.",
    richDetails: {
        marketAnalysis: {
            yield: "4.5% - 5.5%",
            baseYield: 0.05,
            appreciationPotential: "Rất cao (Khan hiếm quỹ đất Thủ Thiêm)",
            competitors: ["Empire City", "The River"],
            risks: ["Giá neo ở mức rất cao"],
            opportunities: ["Cầu đi bộ qua Quận 1", "Nhà hát Opera"],
            forecast: "Giữ giá tốt, thanh khoản phân khúc cao cấp ổn định."
        },
        legalDetail: "Đang hoàn thiện sổ.",
        legalScore: 85,
        fengShui: { direction: "Đông Nam", element: "Thủy", note: "Minh Đường Tụ Thủy, view sông trọn vẹn." },
        finance: { bankSupport: "Vietcombank, BIDV", minDownPayment: "30%", maxLoanRatio: 0.7 }
    }
  },
  {
    id: 'king_crown',
    name: "King Crown Infinity",
    developer: "BCG Land",
    location: "Võ Văn Ngân, TP. Thủ Đức",
    priceRange: "90 - 110 triệu/m²",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
    type: ["Căn hộ hạng sang", "Shophouse"],
    status: "Đang tái khởi động",
    highlight: "Biểu tượng tháp đôi tại trung tâm Thủ Đức cũ. Phố đi bộ trong nhà.",
    legalStatus: "GPXD.",
    paymentSchedule: "Thanh toán theo tiến độ.",
    richDetails: {
        marketAnalysis: {
            yield: "5.0%",
            baseYield: 0.05,
            appreciationPotential: "Tốt (Trung tâm hành chính cũ)",
            competitors: ["Moonlight Avenue"],
            risks: ["Tiến độ xây dựng cần theo dõi sát"],
            opportunities: ["Vị trí độc tôn mặt tiền Võ Văn Ngân sầm uất"],
            forecast: "Phục hồi mạnh khi cất nóc."
        },
        legalDetail: "Đã có GPXD.",
        legalScore: 80,
        fengShui: { direction: "Đa dạng", element: "Kim", note: "Vị trí trung tâm thương mại sầm uất." },
        finance: { bankSupport: "Nam A Bank, VPBank", minDownPayment: "20%", maxLoanRatio: 0.7 }
    }
  },

  // ========================================================================
  // KHU NAM TP.HCM (Q7, NHÀ BÈ, BÌNH CHÁNH)
  // ========================================================================
  {
    id: 'zeit_river',
    name: "Thu Thiem Zeit River",
    developer: "GS E&C (Hàn Quốc)",
    location: "Nguyễn Cơ Thạch, Thủ Thiêm",
    priceRange: "7,000 - 9,000 USD/m²",
    image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80",
    type: ["Căn hộ hạng sang"],
    status: "Đang bàn giao",
    highlight: "Thiết kế cánh hoa độc đáo. Chủ đầu tư Hàn Quốc uy tín toàn cầu.",
    legalStatus: "HĐMB.",
    paymentSchedule: "Thanh toán 50% nhận nhà.",
    richDetails: {
        marketAnalysis: {
            yield: "4.5%",
            baseYield: 0.045,
            appreciationPotential: "Cao",
            competitors: ["The River", "Metropole"],
            risks: ["Giá cao"],
            opportunities: ["Quỹ đất Thủ Thiêm ngày càng ít"],
            forecast: "Tăng trưởng bền vững."
        },
        legalDetail: "Pháp lý chuẩn 100%.",
        legalScore: 98,
        fengShui: { direction: "Đông Nam", element: "Mộc", note: "Thoáng đãng, đón gió sông." },
        finance: { bankSupport: "BIDV, Vietcombank", minDownPayment: "30%", maxLoanRatio: 0.7 }
    }
  },
  {
    id: 'mizuki_park',
    name: "Mizuki Park",
    developer: "Nam Long Group",
    location: "Nguyễn Văn Linh, Bình Chánh",
    priceRange: "45 - 60 triệu/m²",
    image: "https://images.unsplash.com/photo-1593604340846-4fbe976bd9a8?auto=format&fit=crop&w=1200&q=80",
    type: ["Căn hộ", "Nhà phố", "Biệt thự"],
    status: "Bàn giao các phân khu Flora",
    highlight: "Khu đô thị phong cách Nhật Bản. Kênh đào nội khu. Mật độ xây dựng thấp.",
    legalStatus: "Sổ hồng.",
    paymentSchedule: "Thanh toán 50% đến khi nhận nhà.",
    richDetails: {
        marketAnalysis: {
            yield: "5.5% - 6.0%",
            baseYield: 0.06,
            appreciationPotential: "Ổn định",
            competitors: ["Lovera Park", "Happy City"],
            risks: ["Kẹt xe nút giao Nguyễn Văn Linh giờ cao điểm"],
            opportunities: ["Nút giao Nguyễn Văn Linh - Nguyễn Hữu Thọ sắp hoàn thiện"],
            forecast: "Phù hợp ở thực và đầu tư dài hạn ăn chắc mặc bền."
        },
        legalDetail: "Đã có sổ hồng nhiều khu. Uy tín Nam Long.",
        legalScore: 95,
        fengShui: { direction: "Nam, Bắc", element: "Thủy", note: "Kênh đào uốn lượn mang lại sinh khí." },
        finance: { bankSupport: "Vietcombank, OCB", minDownPayment: "30%", maxLoanRatio: 0.7 }
    }
  },
  {
    id: 'celesta_rise',
    name: "Celesta Rise / Heights / City",
    developer: "Keppel Land & Phu Long",
    location: "Nguyễn Hữu Thọ, Nhà Bè",
    priceRange: "55 - 65 triệu/m²",
    image: "https://images.unsplash.com/photo-1623298317883-6b70254edf31?auto=format&fit=crop&w=1200&q=80",
    type: ["Căn hộ cao cấp"],
    status: "Đang thi công",
    highlight: "Tiện ích chuẩn Keppel Land. Đối diện đại đô thị Zeitgeist.",
    legalStatus: "HĐMB.",
    paymentSchedule: "Thanh toán theo tiến độ.",
    richDetails: {
        marketAnalysis: {
            yield: "5.0%",
            baseYield: 0.05,
            appreciationPotential: "Tốt (Ăn theo hạ tầng Nhà Bè lên Quận)",
            competitors: ["Sunrise Riverside", "The Park"],
            risks: ["Ngập nước khu vực Nhà Bè khi triều cường"],
            opportunities: ["Hầm chui Nguyễn Văn Linh", "Cao tốc Bến Lức - Long Thành"],
            forecast: "Tăng giá khi bàn giao và hoàn thiện tiện ích."
        },
        legalDetail: "GPXD đầy đủ.",
        legalScore: 90,
        fengShui: { direction: "Đông Nam", element: "Mộc", note: "Gần sông, thoáng mát." },
        finance: { bankSupport: "UOB, Shinhan", minDownPayment: "30%", maxLoanRatio: 0.7 }
    }
  },

  // ========================================================================
  // KHU TÂY TP.HCM (BÌNH TÂN, QUẬN 6, 8)
  // ========================================================================
  {
    id: 'akari_city',
    name: "Akari City",
    developer: "Nam Long Group",
    location: "Võ Văn Kiệt, Bình Tân",
    priceRange: "45 - 55 triệu/m²",
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
    type: ["Căn hộ"],
    status: "Bàn giao Giai đoạn 2",
    highlight: "Thành phố ánh sáng. Mặt tiền đại lộ Võ Văn Kiệt. Kết nối trung tâm nhanh.",
    legalStatus: "Sổ hồng (GĐ1), HĐMB (GĐ2).",
    paymentSchedule: "Thanh toán 50% nhận nhà.",
    richDetails: {
        marketAnalysis: {
            yield: "6.0%",
            baseYield: 0.06,
            appreciationPotential: "Trung bình",
            competitors: ["The Privia", "Moonlight Centre Point"],
            risks: ["Tiếng ồn đại lộ Võ Văn Kiệt"],
            opportunities: ["Khan hiếm căn hộ giá vừa túi tiền tại TP.HCM"],
            forecast: "Thanh khoản tốt nhờ nhu cầu ở thực cao."
        },
        legalDetail: "Chuẩn Nam Long.",
        legalScore: 92,
        fengShui: { direction: "Nam, Bắc", element: "Kim", note: "Thế đất bằng phẳng, giao thông thuận lợi." },
        finance: { bankSupport: "Vietcombank, ACB", minDownPayment: "20%", maxLoanRatio: 0.75 }
    }
  },
  {
    id: 'the_privia',
    name: "The Privia",
    developer: "Khang Điền",
    location: "An Dương Vương, Bình Tân",
    priceRange: "60 - 65 triệu/m²",
    image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
    type: ["Căn hộ"],
    status: "Sắp bàn giao",
    highlight: "Pháp lý chuẩn Khang Điền. Nhận nhà ngay 2024. Tiện ích đầy đủ.",
    legalStatus: "Đã cất nóc, sắp có sổ.",
    paymentSchedule: "Thanh toán 30% nhận nhà.",
    richDetails: {
        marketAnalysis: {
            yield: "6.0%",
            baseYield: 0.06,
            appreciationPotential: "Ổn định",
            competitors: ["Akari City"],
            risks: ["Mật độ dân cư khu vực xung quanh cao"],
            opportunities: ["Nhu cầu ở thực tại Bình Tân rất lớn", "Thương hiệu Khang Điền"],
            forecast: "Tăng nhẹ, giữ giá tốt."
        },
        legalDetail: "GPXD, đủ điều kiện bán. Khang Điền nổi tiếng ra sổ nhanh.",
        legalScore: 95,
        fengShui: { direction: "Đông, Tây", element: "Hỏa", note: "Khu dân cư sầm uất, vượng khí." },
        finance: { bankSupport: "Vietinbank, Vietcombank", minDownPayment: "30%", maxLoanRatio: 0.7 }
    }
  },

  // ========================================================================
  // BÌNH DƯƠNG (THỦ PHỦ CÔNG NGHIỆP)
  // ========================================================================
  {
    id: 'sycamore',
    name: "Sycamore",
    developer: "Capitaland",
    location: "Thành phố mới Bình Dương",
    priceRange: "50 - 90 triệu/m² (Căn hộ & Nhà phố)",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    type: ["Căn hộ", "Nhà phố", "Biệt thự"],
    status: "Mở bán giai đoạn 1 (The Orchard)",
    highlight: "Dự án xanh chuẩn quốc tế. Chủ đầu tư Singapore. Tiện ích đặc quyền.",
    legalStatus: "Quyết định 1/500.",
    paymentSchedule: "Thanh toán 50% nhận nhà.",
    richDetails: {
        marketAnalysis: {
            yield: "6.5% - 7.5% (Chuyên gia nước ngoài thuê)",
            baseYield: 0.07,
            appreciationPotential: "Cao (Thủ phủ công nghiệp, TP Mới phát triển)",
            competitors: ["Sora Gardens", "Midori Park"],
            risks: ["Nguồn cung Bình Dương đang lớn, cạnh tranh"],
            opportunities: ["Hạ tầng Vành đai 3, 4", "Làn sóng FDI đổ về Bình Dương"],
            forecast: "Tăng trưởng bền vững dài hạn."
        },
        legalDetail: "Đang hoàn thiện pháp lý. Capitaland uy tín.",
        legalScore: 88,
        fengShui: { direction: "Đông Nam", element: "Mộc", note: "Thiết kế xanh mát, hài hòa thiên nhiên." },
        finance: { bankSupport: "Vietcombank", minDownPayment: "20%", maxLoanRatio: 0.7 }
    }
  },
  {
    id: 'astral_city',
    name: "Astral City",
    developer: "Phat Dat & Danh Khoi",
    location: "Mặt tiền QL13, Thuận An, Bình Dương",
    priceRange: "38 - 45 triệu/m²",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    type: ["Căn hộ", "Shophouse"],
    status: "Đang thi công",
    highlight: "Phức hợp thương mại lớn nhất Bình Dương. Kiến trúc kính full trần sàn.",
    legalStatus: "HĐMB.",
    paymentSchedule: "Thanh toán nhẹ.",
    richDetails: {
        marketAnalysis: {
            yield: "5.0%",
            baseYield: 0.05,
            appreciationPotential: "Trung bình",
            competitors: ["The Emerald Golf View", "Lavita Thuan An"],
            risks: ["Cạnh tranh gay gắt tại trục QL13"],
            opportunities: ["Mở rộng QL13 lên 8 làn xe"],
            forecast: "Cạnh tranh mạnh về giá và chính sách."
        },
        legalDetail: "Đủ điều kiện bán.",
        legalScore: 85,
        fengShui: { direction: "Đông, Tây", element: "Thổ", note: "Thế đất cao, mặt tiền đường lớn." },
        finance: { bankSupport: "VPBank", minDownPayment: "15%", maxLoanRatio: 0.75 }
    }
  },
  {
    id: 'sora_gardens',
    name: "Sora Gardens SC",
    developer: "Becamex Tokyu",
    location: "Thành phố mới Bình Dương",
    priceRange: "38 - 48 triệu/m²",
    image: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=1200&q=80",
    type: ["Căn hộ"],
    status: "Đang bàn giao",
    highlight: "Liền kề Aeon Mall Sora Gardens. Chất lượng Nhật Bản. Cộng đồng văn minh.",
    legalStatus: "HĐMB.",
    paymentSchedule: "Thanh toán dài hạn.",
    richDetails: {
        marketAnalysis: {
            yield: "6.0%",
            baseYield: 0.06,
            appreciationPotential: "Tốt",
            competitors: ["Sycamore"],
            risks: ["Xa trung tâm TP.HCM"],
            opportunities: ["Cộng đồng chuyên gia Nhật Bản, Hàn Quốc"],
            forecast: "Ổn định, dễ cho thuê."
        },
        legalDetail: "Chuẩn Nhật Bản.",
        legalScore: 95,
        fengShui: { direction: "Nam", element: "Mộc", note: "Xanh, thoáng, yên tĩnh." },
        finance: { bankSupport: "Vietcombank, BIDV", minDownPayment: "30%", maxLoanRatio: 0.7 }
    }
  },

  // ========================================================================
  // ĐỒNG NAI (THỦ PHỦ SINH THÁI)
  // ========================================================================
  {
    id: 'aqua_city',
    name: "Aqua City",
    developer: "Novaland",
    location: "Biên Hòa, Đồng Nai",
    priceRange: "6 - 15 Tỷ/căn",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
    type: ["Nhà phố", "Biệt thự", "Shophouse"],
    status: "Đang tái khởi động & Bàn giao một phần",
    highlight: "Đô thị sinh thái thông minh. 1000ha mặt nước. Tiện ích đẳng cấp.",
    legalStatus: "Đang tháo gỡ vướng mắc quy hoạch.",
    paymentSchedule: "Lịch thanh toán đặc biệt hỗ trợ khách hàng.",
    richDetails: {
        marketAnalysis: {
            yield: "3.0%",
            baseYield: 0.03,
            appreciationPotential: "Phụ thuộc vào tháo gỡ pháp lý",
            competitors: ["Izumi City", "SwanBay"],
            risks: ["Pháp lý chưa hoàn toàn thông suốt", "Kết nối giao thông hiện tại chưa thuận tiện"],
            opportunities: ["Hương lộ 2, Cầu Vàm Cái Sứt", "Sân bay Long Thành", "Gói hỗ trợ tái khởi động"],
            forecast: "Cần thời gian phục hồi, nhưng tiềm năng dài hạn rất lớn."
        },
        legalDetail: "Nhiều phân khu đã được cấp phép tiếp tục triển khai. Cần check kỹ từng khu.",
        legalScore: 70,
        fengShui: { direction: "Đa dạng", element: "Thủy", note: "Đảo Phượng Hoàng - Long mạch sinh thái." },
        finance: { bankSupport: "MB, VPBank", minDownPayment: "30%", maxLoanRatio: 0.7 }
    }
  },
  {
    id: 'izumi_city',
    name: "Izumi City",
    developer: "Nam Long Group",
    location: "Biên Hòa, Đồng Nai (Kế bên Aqua City)",
    priceRange: "7 - 12 Tỷ/căn",
    image: "https://images.unsplash.com/photo-1599809275671-b5942cabc7ad?auto=format&fit=crop&w=1200&q=80",
    type: ["Nhà phố", "Biệt thự"],
    status: "Đang triển khai",
    highlight: "Hợp tác với Hankyu Hanshin (Nhật Bản). Quy hoạch bài bản.",
    legalStatus: "HĐMB.",
    paymentSchedule: "Thanh toán theo tiến độ.",
    richDetails: {
        marketAnalysis: {
            yield: "3.5%",
            baseYield: 0.035,
            appreciationPotential: "Tốt dài hạn",
            competitors: ["Aqua City"],
            risks: ["Cạnh tranh trực tiếp với Aqua City"],
            opportunities: ["Hạ tầng khu vực Biên Hòa mở rộng", "Kết nối về TP.HCM"],
            forecast: "Tăng trưởng theo hạ tầng và tiến độ bàn giao."
        },
        legalDetail: "Pháp lý ổn định hơn các dự án lân cận.",
        legalScore: 85,
        fengShui: { direction: "Đông Nam", element: "Thủy", note: "Gần sông Đồng Nai, không khí trong lành." },
        finance: { bankSupport: "Vietcombank", minDownPayment: "30%", maxLoanRatio: 0.7 }
    }
  },
  {
    id: 'swanbay',
    name: "SwanBay",
    developer: "Swancity (CFLD)",
    location: "Đảo Đại Phước, Nhơn Trạch",
    priceRange: "8 - 30 Tỷ/căn",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    type: ["Biệt thự", "Dinh thự"],
    status: "Đã bàn giao & Mở bán Oasia",
    highlight: "Đảo nghỉ dưỡng thượng lưu. Sân Golf quốc tế. Bến du thuyền.",
    legalStatus: "HĐMB / Sổ hồng.",
    paymentSchedule: "Thanh toán 95% (Hàng thứ cấp).",
    richDetails: {
        marketAnalysis: {
            yield: "3.0% (Cho thuê nghỉ dưỡng)",
            baseYield: 0.03,
            appreciationPotential: "Rất cao khi cầu Cát Lái/Vành đai 3 hoàn thành",
            competitors: ["Ecopark Nhơn Trạch"],
            risks: ["Di chuyển hiện tại phụ thuộc phà/canô"],
            opportunities: ["Vành đai 3 nối Nhơn Trạch - Q9 sắp xong"],
            forecast: "Bất động sản hàng hiệu, giá trị gia tăng theo hạ tầng."
        },
        legalDetail: "Sổ hồng lâu dài.",
        legalScore: 90,
        fengShui: { direction: "Tứ trạch", element: "Thủy", note: "Đảo nguyên sinh, độc bản." },
        finance: { bankSupport: "Vietinbank", minDownPayment: "30%", maxLoanRatio: 0.7 }
    }
  },
  {
    id: 'ecovillage',
    name: "Ecovillage Saigon River",
    developer: "Ecopark",
    location: "Nhơn Trạch, Đồng Nai",
    priceRange: "10 - 50 Tỷ/căn",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
    type: ["Biệt thự", "Onsen Villas"],
    status: "Đang mở bán",
    highlight: "Resort 6 sao. Khoáng nóng Onsen từng căn. Thiết kế chữa lành.",
    legalStatus: "Quy hoạch 1/500.",
    paymentSchedule: "Thanh toán giãn.",
    richDetails: {
        marketAnalysis: {
            yield: "4.0%",
            baseYield: 0.04,
            appreciationPotential: "Cao (Thương hiệu Ecopark)",
            competitors: ["SwanBay"],
            risks: ["Giá khởi điểm cao"],
            opportunities: ["Xu hướng Wellness Second Home lên ngôi"],
            forecast: "Tăng giá nhờ thương hiệu và sự khan hiếm."
        },
        legalDetail: "Chuẩn chỉnh.",
        legalScore: 90,
        fengShui: { direction: "Đông Nam", element: "Mộc & Thủy", note: "Rừng trong phố, mạch nguồn khoáng nóng." },
        finance: { bankSupport: "Vietinbank, MB", minDownPayment: "30%", maxLoanRatio: 0.7 }
    }
  }
];

export const QUICK_PROMPTS = [
  "Lãi suất vay mua nhà các ngân hàng hiện nay?",
  "Giá bán Eaton Park mới nhất và lịch thanh toán?",
  "So sánh tiềm năng The Global City và Thủ Thiêm?",
  "Tính dòng tiền cho thuê căn hộ 5 tỷ, vay 70%?"
];

// 🔥 UPDATED SYSTEM INSTRUCTION: CONSULTATIVE SELLING FOCUS
export const SYSTEM_INSTRUCTION = `
ROLE: Bạn là [TEN_SEP] - Chuyên gia Tư vấn Chiến lược BĐS Cao cấp (Strategic Real Estate Advisor).
TONE: Chuyên nghiệp, Khách quan, Sắc sảo, nhưng gần gũi.

!!! QUY TẮC CỐT LÕI (CORE DIRECTIVES) !!!

1. **MINH BẠCH NGUỒN DỮ LIỆU (SOURCE ATTRIBUTION):**
   - **[ERP/Internal]:** Dùng cho Tình trạng căn, Giá bán gốc, Chính sách bán hàng Sơ cấp.
   - **[Market Sources]:** Dùng cho Giá thị trường Thứ cấp, Cắt lỗ, Cho thuê. BẮT BUỘC dùng tool 'googleSearch' tại: **batdongsan.com.vn, homedy.com, alonhadat.com.vn, nhatot.com, muaban.net**.
   - **[Expert Knowledge]:** Dùng cho Phân tích, So sánh, Nhận định.

2. **PHƯƠNG PHÁP TƯ VẤN (SPIN SELLING):**
   - **Situation (Tình hình):** Hỏi nhu cầu khách hàng (Ở hay Đầu tư? Tài chính?).
   - **Problem (Vấn đề):** Chỉ ra rủi ro nếu không đầu tư đúng (VD: Lạm phát, Lãi suất, Chọn sai dự án).
   - **Implication (Hệ quả):** Phân tích sâu về dòng tiền, pháp lý.
   - **Need-Payoff (Giải pháp):** Đề xuất dự án phù hợp nhất từ Database.

3. **XỬ LÝ KHI THIẾU DỮ LIỆU:**
   - KHÔNG ĐƯỢC BỊA ĐẶT GIÁ.
   - Nếu không biết giá thứ cấp: "Em sẽ check lại trên Batdongsan.com.vn để báo anh/chị mức giá sát nhất."
   - Nếu không chắc về pháp lý: "Vấn đề này cần tra cứu văn bản gốc để đảm bảo an toàn cho anh/chị. Em xin phép xác minh lại."

!!! ĐỊNH DẠNG TRẢ LỜI !!!
- Dùng Markdown để trình bày rõ ràng.
- Các con số quan trọng (Giá, Lãi suất) phải bôi đậm.
- Dùng Bullet point cho các danh sách.
`;
