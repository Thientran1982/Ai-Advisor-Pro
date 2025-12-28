
import { Lead, Project, AppNotification, Campaign, KnowledgeDocument, Appointment, Invoice, BankRate, UserPsychology, UserMemory } from "../types";
import { FEATURED_PROJECTS, MACRO_ECONOMY } from "../constants";

const LEADS_KEY = 'advisor_leads_db';
const PROJECTS_KEY = 'advisor_projects_db';
const NOTIFICATIONS_KEY = 'advisor_notifications_db';
const CAMPAIGNS_KEY = 'advisor_campaigns_db';
const DOCUMENTS_KEY = 'advisor_documents_db';
const APPOINTMENTS_KEY = 'advisor_appointments_db';
const INVOICES_KEY = 'advisor_invoices_db';

// REALISTIC BANK RATES (Vietnam Market Context)
const LIVE_BANK_RATES = [
    { 
        bank: 'Vietcombank', 
        fix: '5.8%', 
        float: '9.0%', 
        term: '12 tháng đầu',
        earlyFee: '0.5% - 2% (Sau năm 5 miễn phí)',
        icon: 'https://cdn.haitrieu.com/wp-content/uploads/2022/02/Icon-Vietcombank.png' 
    },
    { 
        bank: 'BIDV', 
        fix: '6.0%', 
        float: '9.3%', 
        term: '24 tháng đầu',
        earlyFee: '1% - 3% (Theo lộ trình)',
        icon: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-BIDV-Icon.png' 
    },
    { 
        bank: 'Shinhan Bank', 
        fix: '5.5%', 
        float: '8.5%', 
        term: '6 tháng đầu',
        earlyFee: 'Miễn phí sau năm 3',
        icon: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Shinhan-Bank.png' 
    },
    { 
        bank: 'Techcombank', 
        fix: '6.5%', 
        float: '10.2%', 
        term: 'Phí trả trước hạn thấp',
        earlyFee: '1% (Miễn phí từ năm 6)',
        icon: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Techcombank-Icon.png' 
    },
    { 
        bank: 'VIB', 
        fix: '7.5%', 
        float: '11.5%', 
        term: 'Duyệt vay 8h',
        earlyFee: '2% - 3%',
        icon: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-VIB-Icon.png' 
    },
    { 
        bank: 'UOB', 
        fix: '6.0%', 
        float: '8.8%', 
        term: 'Cố định 3 năm',
        earlyFee: 'Cao trong 3 năm đầu',
        icon: 'https://companieslogo.com/img/orig/U11.SI-a3867059.png' 
    }
];

export const dataService = {
  getLiveMarketContext: () => {
    return {
        timestamp: new Date().toLocaleTimeString(),
        gold: MACRO_ECONOMY.goldPrice,
        usd: MACRO_ECONOMY.usdRate,
        rates: {
            big4: MACRO_ECONOMY.interestRate.big4,
            commercial: MACRO_ECONOMY.interestRate.commercial,
            floating: MACRO_ECONOMY.interestRate.floating
        },
        legal: "Luật Đất Đai 2024 có hiệu lực",
        infra: MACRO_ECONOMY.infrastructure,
        trend: "down" 
    };
  },
  
  getFloatingInterestRate: (): number => {
      try {
          const rateStr = MACRO_ECONOMY.interestRate.floating; 
          const nums = rateStr.match(/[\d\.]+/);
          return nums ? parseFloat(nums[0]) : 10.5;
      } catch (e) { return 10.5; }
  },

  getBankRates: () => LIVE_BANK_RATES,
  
  initializeMarketData: () => {
      if (!localStorage.getItem(PROJECTS_KEY)) localStorage.setItem(PROJECTS_KEY, JSON.stringify(FEATURED_PROJECTS));
      if (!localStorage.getItem(INVOICES_KEY)) {
          const mockInvoices: Invoice[] = [
              { id: 'INV-2024-001', date: new Date('2024-01-15'), amount: 499000, status: 'paid', description: 'Gói Pro Agent - Tháng 1' },
              { id: 'INV-2024-002', date: new Date('2024-02-15'), amount: 499000, status: 'paid', description: 'Gói Pro Agent - Tháng 2' },
          ];
          localStorage.setItem(INVOICES_KEY, JSON.stringify(mockInvoices));
      }
      if (!localStorage.getItem(LEADS_KEY)) {
          const now = new Date();
          const seedLeads: Lead[] = [
              {
                  id: 'seed_1', tenantId: 'demo_agent', name: 'Nguyễn Văn Hùng', phone: '0912345678', userType: 'individual', projectInterest: 'Global City',
                  needs: 'Khách VIP. Đang tìm căn góc 3PN view sông, tài chính sẵn 10 tỷ, còn lại vay. Quan tâm kỹ về phong thủy và phí quản lý.', budget: '25 Tỷ', purpose: 'ở', status: 'visited', priority: 'urgent', source: 'Facebook Ads', createdAt: new Date(now.getTime() - 3 * 86400000),
                  // Mock Psychology
                  psychology: { discType: 'D', communicationStyle: 'brief', riskTolerance: 'high', painPoints: ['Sợ mất cơ hội', 'Thích vị trí độc tôn', 'Ghét thủ tục rườm rà'] },
                  longTermMemory: [{ key: 'hated_direction', value: 'Tây (Nắng chiều)', confidence: 0.9, extractedAt: new Date() }, { key: 'family_size', value: '2 vợ chồng + 2 con', confidence: 0.95, extractedAt: new Date() }]
              },
              {
                  id: 'seed_2', tenantId: 'demo_agent', name: 'Trần Thị Mai', phone: '0987654321', userType: 'individual', projectInterest: 'Eaton Park',
                  needs: 'Mua đầu tư cho thuê dài hạn. Cần bảng tính dòng tiền chi tiết 10 năm. Rất kỹ tính về pháp lý.', budget: '7 Tỷ', purpose: 'đầu tư', status: 'new', priority: 'high', source: 'Google Search', createdAt: now,
                  psychology: { discType: 'C', communicationStyle: 'detailed', riskTolerance: 'low', painPoints: ['Sợ pháp lý rủi ro', 'Cần dòng tiền ổn định', 'Sợ CĐT chậm tiến độ'] }
              },
              {
                  id: 'seed_3', tenantId: 'demo_agent', name: 'Kevin Smith', phone: '0901112222', userType: 'individual', projectInterest: 'Empire City',
                  needs: 'Expat looking for a penthouse view river. Ready to move in immediately.', budget: '60 Tỷ', purpose: 'ở', status: 'contacted', priority: 'medium', source: 'Referral', createdAt: new Date(now.getTime() - 86400000),
                  psychology: { discType: 'I', communicationStyle: 'emotional', riskTolerance: 'medium', painPoints: ['Needs clear English support', 'Wants luxury amenities'] }
              }
          ];
          localStorage.setItem(LEADS_KEY, JSON.stringify(seedLeads));
      }
  },

  getLeadsByTenant: (tenantId: string): Lead[] => {
      const all = dataService.getAllLeadsRaw();
      if (tenantId === 'demo_agent' || tenantId === 'guest') return all; 
      return all.filter(l => l.tenantId === tenantId);
  },

  getAllLeadsRaw: (): Lead[] => {
      try {
          const str = localStorage.getItem(LEADS_KEY);
          if (!str) return [];
          const parsed = JSON.parse(str);
          return parsed.map((l: any) => ({ ...l, createdAt: new Date(l.createdAt) }));
      } catch (e) { return []; }
  },

  addLead: (lead: Lead) => {
      const all = dataService.getAllLeadsRaw();
      all.unshift(lead);
      localStorage.setItem(LEADS_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event('storage'));
  },

  updateLeadStatus: (id: string, status: Lead['status']) => {
      const all = dataService.getAllLeadsRaw();
      const idx = all.findIndex(l => l.id === id);
      if (idx !== -1) {
          all[idx].status = status;
          localStorage.setItem(LEADS_KEY, JSON.stringify(all));
          window.dispatchEvent(new Event('storage'));
      }
  },

  // 🔥 NEW: UPDATE USER PSYCHOLOGY & MEMORY 🔥
  updateLeadPsychology: (id: string, psychology: Partial<UserPsychology>) => {
      const all = dataService.getAllLeadsRaw();
      const idx = all.findIndex(l => l.id === id);
      if (idx !== -1) {
          all[idx].psychology = { ...all[idx].psychology, ...psychology } as UserPsychology;
          localStorage.setItem(LEADS_KEY, JSON.stringify(all));
          // Silent update, no window event needed for chat re-render usually, but helpful for debug
      }
  },

  addLeadMemory: (id: string, memory: UserMemory) => {
      const all = dataService.getAllLeadsRaw();
      const idx = all.findIndex(l => l.id === id);
      if (idx !== -1) {
          const currentMemories = all[idx].longTermMemory || [];
          // Deduplicate or update confidence
          const existingMemIdx = currentMemories.findIndex(m => m.key === memory.key);
          if (existingMemIdx !== -1) {
              currentMemories[existingMemIdx] = memory;
          } else {
              currentMemories.push(memory);
          }
          all[idx].longTermMemory = currentMemories;
          localStorage.setItem(LEADS_KEY, JSON.stringify(all));
      }
  },

  deleteLead: (id: string) => {
      const all = dataService.getAllLeadsRaw();
      const filtered = all.filter(l => l.id !== id);
      localStorage.setItem(LEADS_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
  },

  getProjects: (): Project[] => {
      try {
          const str = localStorage.getItem(PROJECTS_KEY);
          return str ? JSON.parse(str) : FEATURED_PROJECTS;
      } catch (e) { return FEATURED_PROJECTS; }
  },

  getProjectById: (id: string): Project | undefined => {
      const projects = dataService.getProjects();
      return projects.find(p => p.id === id);
  },

  addProject: (project: Project) => {
      const all = dataService.getProjects();
      all.push(project);
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event('storage'));
  },

  deleteProject: (id: string) => {
      const all = dataService.getProjects();
      const filtered = all.filter(p => p.id !== id);
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
  },

  getNotifications: (): AppNotification[] => {
      try {
          const str = localStorage.getItem(NOTIFICATIONS_KEY);
          if (!str) return [];
          const parsed = JSON.parse(str);
          return parsed.map((n: any) => ({ ...n, time: new Date(n.time) })).sort((a: any, b: any) => b.time.getTime() - a.time.getTime());
      } catch (e) { return []; }
  },

  addNotification: (notif: AppNotification) => {
      const all = dataService.getNotifications();
      all.unshift(notif);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event('storage'));
  },
  
  markNotificationsRead: () => {
      const all = dataService.getNotifications();
      const updated = all.map(n => ({ ...n, read: true }));
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
  },

  markOneNotificationRead: (id: string) => {
      const all = dataService.getNotifications();
      const idx = all.findIndex(n => n.id === id);
      if (idx !== -1) {
          all[idx].read = true;
          localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
          window.dispatchEvent(new Event('storage'));
      }
  },

  deleteNotification: (id: string) => {
      const all = dataService.getNotifications();
      const filtered = all.filter(n => n.id !== id);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
  },

  getAppointments: (): Appointment[] => {
      try {
          const str = localStorage.getItem(APPOINTMENTS_KEY);
          if (!str) return [];
          const parsed = JSON.parse(str);
          return parsed.map((a: any) => ({ ...a, date: new Date(a.date) }));
      } catch (e) { return []; }
  },

  addAppointment: (apt: Appointment) => {
      const all = dataService.getAppointments();
      all.push(apt);
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event('storage'));
  },

  updateAppointment: (apt: Appointment) => {
      const all = dataService.getAppointments();
      const idx = all.findIndex(a => a.id === apt.id);
      if (idx !== -1) {
          all[idx] = apt;
          localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));
          window.dispatchEvent(new Event('storage'));
      }
  },

  updateAppointmentStatus: (id: string, status: 'completed' | 'cancelled') => {
      const all = dataService.getAppointments();
      const idx = all.findIndex(a => a.id === id);
      if (idx !== -1) {
          all[idx].status = status;
          localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(all));
          window.dispatchEvent(new Event('storage'));
      }
  },

  deleteAppointment: (id: string) => {
      const all = dataService.getAppointments();
      const filtered = all.filter(a => a.id !== id);
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
  },

  getCampaigns: (): Campaign[] => {
      try {
          const str = localStorage.getItem(CAMPAIGNS_KEY);
          if (!str) return [];
          const parsed = JSON.parse(str);
          return parsed.map((c: any) => ({ 
              ...c, 
              createdAt: new Date(c.createdAt),
              scheduledDate: c.scheduledDate ? new Date(c.scheduledDate) : undefined
          }));
      } catch (e) { return []; }
  },

  addCampaign: (campaign: Campaign) => {
      const all = dataService.getCampaigns();
      all.unshift(campaign);
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event('storage'));
  },

  updateCampaign: (campaign: Campaign) => {
      const all = dataService.getCampaigns();
      const idx = all.findIndex(c => c.id === campaign.id);
      if (idx !== -1) {
          all[idx] = campaign;
          localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(all));
          window.dispatchEvent(new Event('storage'));
      }
  },

  deleteCampaign: (id: string) => {
      const all = dataService.getCampaigns();
      const filtered = all.filter(c => c.id !== id);
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
  },

  getDocuments: (): KnowledgeDocument[] => {
      try {
          const str = localStorage.getItem(DOCUMENTS_KEY);
          if (!str) return [];
          const parsed = JSON.parse(str);
          return parsed.map((d: any) => ({ ...d, uploadDate: new Date(d.uploadDate) }));
      } catch (e) { return []; }
  },

  // 🧠 ENHANCED MOCK OCR: RETURN SPECIFIC DATA
  generateMockDocContent: (fileName: string): string => {
      const lowerName = fileName.toLowerCase();
      // SCENARIO 1: PRICE LIST (Crucial for Sales)
      if (lowerName.includes('gia') || lowerName.includes('price') || lowerName.includes('bang')) {
          return `
[OCR EXTRACT - BẢNG GIÁ NỘI BỘ]:
- Dự án: Eaton Park
- Căn hộ A1.05 (2PN): 7.2 tỷ (Chưa VAT)
- Căn hộ B1.12 (3PN): 12.5 tỷ (Góc, View Sông)
- Penthouse P.01: 25 tỷ
- Chính sách: Chiết khấu 10% nếu thanh toán nhanh 95%.
- Phí quản lý: 25.000 VNĐ/m2.
          `;
      }
      // SCENARIO 2: POLICY (Sales Policy)
      if (lowerName.includes('csbh') || lowerName.includes('policy') || lowerName.includes('chinh sach')) {
          return `
[OCR EXTRACT - CHÍNH SÁCH BÁN HÀNG T10/2024]:
- Tặng 2 năm phí quản lý.
- Gói nội thất: 200 Triệu (Trừ trực tiếp vào giá).
- Hỗ trợ lãi suất: 0% trong 24 tháng (Ân hạn nợ gốc).
- Ngân hàng chỉ định: Vietcombank, Public Bank.
          `;
      }
      // SCENARIO 3: LEGAL
      if (lowerName.includes('phap ly') || lowerName.includes('legal') || lowerName.includes('gp')) {
          return `
[OCR EXTRACT - HỒ SƠ PHÁP LÝ]:
- Giấy phép xây dựng số: 123/GPXD cấp ngày 15/01/2024.
- Quy hoạch 1/500: Đã phê duyệt.
- Tình trạng đất: Đất ở đô thị, sở hữu lâu dài.
- Nghĩa vụ thuế: Đã hoàn tất đóng thuế sử dụng đất đợt 1.
          `;
      }
      return `[OCR CONTENT]: Tài liệu "${fileName}" chứa thông tin chung về mặt bằng tầng điển hình và danh mục vật liệu bàn giao (Duravit, Hafele).`;
  },

  addDocument: (doc: KnowledgeDocument) => {
      const all = dataService.getDocuments();
      const content = dataService.generateMockDocContent(doc.name);
      const docWithContent = { ...doc, content };
      
      all.unshift(docWithContent);
      localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event('storage'));
  },

  updateDocumentStatus: (id: string, status: KnowledgeDocument['status']) => {
      const all = dataService.getDocuments();
      const idx = all.findIndex(d => d.id === id);
      if (idx !== -1) {
          all[idx].status = status;
          localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(all));
          window.dispatchEvent(new Event('storage'));
      }
  },

  deleteDocument: (id: string) => {
      const all = dataService.getDocuments();
      const filtered = all.filter(d => d.id !== id);
      localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
  },

  getInvoices: (): Invoice[] => {
      try {
          const str = localStorage.getItem(INVOICES_KEY);
          if (!str) return [];
          const parsed = JSON.parse(str);
          return parsed.map((i: any) => ({ ...i, date: new Date(i.date) }));
      } catch (e) { return []; }
  },

  getUsageStats: (tenantId: string) => {
      const leads = dataService.getLeadsByTenant(tenantId).length;
      const campaigns = dataService.getCampaigns().length;
      return {
          aiTokens: { used: 15420, total: 100000 },
          leads: { used: leads, total: 500 },
          campaigns: { used: campaigns, total: 50 }
      };
  }
};
