
export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  image?: string; // Base64 string for displaying the image
  leadData?: Lead; // Data for the Lead Confirmation Card
}

export interface UserProfile {
  name?: string;
  phone?: string;
  lastInterest?: string; // Dự án quan tâm gần nhất
  investmentStyle?: 'dòng tiền' | 'lãi vốn' | 'an toàn';
  budgetRange?: string;
  lastVisit: Date;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  projectInterest: string; // New field for specific project
  needs: string;
  budget: string;
  timeline: string;
  purpose: 'ở' | 'đầu tư' | 'văn phòng';
  status: 'new' | 'contacted' | 'visited' | 'deposited';
  createdAt: Date;
  chatHistory?: Message[]; // ADDED: Full transcript of the conversation
}

export interface Project {
  id: string;
  name: string;
  developer: string;
  location: string;
  priceRange: string;
  type: string[];
  status: string;
  highlight: string;
  image: string;
  gallery?: string[]; // Added gallery support
  legalStatus: string; // Tình trạng pháp lý
  paymentSchedule: string; // Phương thức thanh toán
}

export interface MarketData {
  name: string;
  value: number; // Price in Million VND/m2
  source?: string; // Source of data (e.g., "Batdongsan.com.vn")
}

export interface MacroData {
  goldSJC: string; // e.g. "82.50" (Triệu/lượng)
  usdRate: string; // e.g. "25.450" (VND)
  interestRate: string; // e.g. "6.5%" (Lãi suất thả nổi trung bình)
  lastUpdated: string;
}

export interface MarketIntel {
  sentimentScore: number; // 0-100 (0: Fear, 100: Greed)
  sentimentLabel: string; // "Thận trọng", "Tích cực", "Hưng phấn"
  trendSummary: string; // 1 câu tóm tắt thị trường
  topNews: {
    title: string;
    source: string;
    url: string;
    time: string;
  }[];
  bankRates: {
    bank: string;
    rate: string; // "6.5%"
  }[];
  lastUpdated: Date;
}

// --- NEW TYPES FOR PRO FEATURES ---

export interface BankRate {
  id: string;
  bankName: string;
  rateFirstYear: number;
  rateFloating: string | number;
  maxLoanRatio: number;
  term: number;
  earlyFee: string;
}

export interface LegalRisk {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
}

export interface LifestyleMetric {
  subject: string;
  A: number; // Score for Project A
  B?: number; // Score for Project B (Comparison)
  fullMark: number;
}
