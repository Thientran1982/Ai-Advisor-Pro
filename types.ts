
// --- CORE MESSAGING ---
export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  image?: string; 
  leadData?: Lead; 
  feedback?: 'like' | 'dislike'; 
  
  // NEW: Deep Learning Visualization Fields
  isReasoning?: boolean; // Is the AI currently in "Thinking Mode"?
  reasoningSteps?: string[]; // ["Searching database...", "Calculating yield...", "Verifying legal..."]
  thinkingTime?: number; // Real execution time in seconds (e.g. 1.5)

  toolPayload?: {
    type: 'calculator' | 'comparison' | 'lead_magnet' | 'booking' | 'feng_shui' | 'valuation' | 'legal' | 'finance' | 'strategy' | 'forecast' | 'show_project_info' | 'bank_rates';
    data?: any; 
  };

  groundingMetadata?: {
    groundingChunks: {
      web?: {
        uri: string;
        title: string;
      };
    }[];
  };
}

// NEW: SWARM INTELLIGENCE TYPES
// UPDATED: Added 'Storyteller' (Narrative Designer)
export type AgentRole = 'Manager' | 'Strategist' | 'Psychologist' | 'Copywriter' | 'RiskOfficer' | 'Negotiator' | 'Valuation' | 'Stylist' | 'Insider' | 'Closer' | 'Profiler' | 'Lifestyle' | 'Skeptic' | 'WealthStructurer' | 'Curator' | 'TimingArchitect' | 'Storyteller';

export interface SwarmStep {
    agentName: string; 
    agentRole: string; 
    agentType: AgentRole; // Typed role for icon mapping
    status: 'pending' | 'thinking' | 'done';
    output?: string;
    icon?: string; // Lucide icon name
}

// --- SAAS TENANCY MODEL ---
export type SubscriptionTier = 'free' | 'pro_agent' | 'enterprise';

export interface Invoice {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

export interface UsageStats {
    aiTokens: { used: number; total: number };
    leads: { used: number; total: number };
    campaigns: { used: number; total: number };
}

export interface TenantProfile {
  id: string; 
  type: 'individual_agent' | 'agency';
  role?: 'owner' | 'staff'; 
  name: string; 
  email: string;
  password?: string; 
  phone: string; 
  avatar?: string;
  subscription: SubscriptionTier;
  subscriptionExpiry?: Date; 
  invoices?: Invoice[]; 
  brandColor?: string;
  logoUrl?: string;
  welcomeMessage?: string; 
  
  // NEW: ADVANCED AI CONFIGURATION
  aiConfig?: {
      tone: 'professional' | 'friendly' | 'aggressive' | 'data_driven'; // Giọng văn
      focus: 'investment' | 'residence' | 'neutral'; // Trọng tâm tư vấn
      language: 'vi_north' | 'vi_south' | 'english'; // Ngôn ngữ/Vùng miền
  };

  assignedProjects: string[]; 
  zaloId?: string;
  publicSlug?: string; 
}

// 🔥 PROTOCOL 6: ADAPTIVE MEMORY TYPES 🔥
export interface UserPsychology {
    discType: 'D' | 'I' | 'S' | 'C' | 'Unknown'; // Dominance, Influence, Steadiness, Conscientiousness
    communicationStyle: 'brief' | 'detailed' | 'emotional' | 'factual';
    riskTolerance: 'high' | 'medium' | 'low';
    painPoints: string[];
}

export interface UserMemory {
    key: string; // e.g., 'preferred_direction', 'hated_location'
    value: string;
    confidence: number; // 0-1
    extractedAt: Date;
}

export interface Lead {
  id: string;
  tenantId: string; 
  name: string;
  phone: string;
  userType: 'individual' | 'enterprise'; 
  projectInterest: string;
  needs: string;
  budget: string;
  purpose: 'ở' | 'đầu tư' | 'văn phòng' | 'mua sỉ' | 'hợp tác';
  timeline?: string; 
  status: 'new' | 'contacted' | 'visited' | 'deposited' | 'negotiating' | 'lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // MARKETING ATTRIBUTION
  source?: string; // Facebook, Google, Zalo, Direct
  campaignId?: string; // Campaign Name/ID
  referrer?: string; // Specific URL
  
  // 🔥 NEW: PERSONALIZATION DATA
  psychology?: UserPsychology;
  longTermMemory?: UserMemory[];

  createdAt: Date;
  updatedAt?: Date;
  chatHistory?: Message[]; 
  assignedSalesId?: string; 
}

export interface Campaign {
  id: string;
  name: string;
  channel: 'zalo' | 'sms' | 'email';
  status: 'draft' | 'scheduled' | 'sending' | 'completed';
  audienceSize: number;
  sentCount: number;
  openRate: number; 
  clickRate: number; 
  createdAt: Date;
  scheduledDate?: Date;
  content?: string;
}

// NEW: KNOWLEDGE BASE TYPE
export interface KnowledgeDocument {
    id: string;
    name: string;
    type: 'pdf' | 'docx' | 'txt' | 'xlsx';
    size: string;
    status: 'indexed' | 'processing' | 'error';
    uploadDate: Date;
}

export interface AppNotification {
    id: string;
    type: 'lead' | 'system' | 'campaign' | 'schedule';
    title: string;
    message: string;
    time: Date;
    read: boolean;
    actionUrl?: string;
}

export interface Appointment {
    id: string;
    leadId: string;
    leadName: string;
    title: string; 
    date: Date;
    location: string;
    status: 'upcoming' | 'completed' | 'cancelled';
    note?: string;
}

// --- MASTER DATA (DEEP DATA STRUCTURE) ---

export interface ProjectRichDetails {
    marketAnalysis: {
        yield: string; // Display string
        baseYield: number; // For Calculation (e.g., 0.055)
        appreciationPotential: string; 
        competitors: string[];
        risks?: string[]; 
        opportunities?: string[]; 
        forecast?: string; 
    };
    legalDetail: string; 
    legalScore: number; // 0-100 (Hard scored by expert)
    fengShui: {
        direction: string;
        element: string; 
        note: string;
    };
    finance: {
        bankSupport: string;
        minDownPayment: string;
        maxLoanRatio: number; // e.g. 0.7
    };
}

export interface Project {
  id: string;
  ownerId?: string; 
  name: string;
  developer: string;
  location: string;
  priceRange: string;
  type: string[];
  status: string;
  highlight: string;
  image: string;
  gallery?: string[];
  legalStatus: string;
  paymentSchedule: string;
  aiContext?: string; 
  richDetails?: ProjectRichDetails;
}

export interface MarketIntel {
  sentimentScore: number;
  sentimentLabel: string;
  trendSummary: string;
  topNews: {
    title: string;
    source: string;
    url: string;
    time: string;
  }[];
  bankRates: {
    bank: string;
    rate: string;
  }[];
  lastUpdated: Date;
}

export interface BankRate {
  id: string;
  bankName: string;
  rateFirstYear: number;
  rateFloating: string | number;
  maxLoanRatio: number;
  term: number;
  earlyFee: string;
}

export interface UserProfile {
  name?: string;
  phone?: string;
  email?: string; 
  type: 'individual' | 'enterprise';
  lastInterest?: string; 
  budgetRange?: string;
  lastVisit: Date;
  companyName?: string;
  position?: string;
  investmentStyle?: string;
}
