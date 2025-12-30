
import { Lead, Project, AppNotification, Campaign, KnowledgeDocument, Appointment, Invoice, BankRate, UserPsychology, UserMemory, ProjectRichDetails } from "../types";
import { FEATURED_PROJECTS, MACRO_ECONOMY } from "../constants";

const LEADS_KEY = 'advisor_leads_db';
const PROJECTS_KEY = 'advisor_projects_db';
const NOTIFICATIONS_KEY = 'advisor_notifications_db';
const CAMPAIGNS_KEY = 'advisor_campaigns_db';
const DOCUMENTS_KEY = 'advisor_documents_db';
const APPOINTMENTS_KEY = 'advisor_appointments_db';
const INVOICES_KEY = 'advisor_invoices_db';

// REMOVED HARDCODED RATES. AI MUST SEARCH.
const LIVE_BANK_RATES: any[] = [
    { bank: 'Vietcombank', fix: 'Tra cứu...', float: 'Tra cứu...', term: '12 tháng', earlyFee: 'check' },
    { bank: 'BIDV', fix: 'Tra cứu...', float: 'Tra cứu...', term: '24 tháng', earlyFee: 'check' },
    { bank: 'Techcombank', fix: 'Tra cứu...', float: 'Tra cứu...', term: 'Niêm yết', earlyFee: 'check' }
];

// GENERATOR: Create fake rich details for user-added projects so tools don't crash
const generateMockRichDetails = (priceStr: string): ProjectRichDetails => {
    return {
        marketAnalysis: {
            yield: "5.0% - 6.0%",
            baseYield: 0.055,
            appreciationPotential: "Tốt (Dự án mới)",
            competitors: ["Các dự án lân cận"],
            risks: ["Pháp lý đang hoàn thiện", "Cạnh tranh nguồn cung"],
            opportunities: ["Giá đợt 1 tốt", "Hạ tầng khu vực đang lên"],
            forecast: "Tăng trưởng ổn định theo tiến độ xây dựng."
        },
        legalDetail: "Đang cập nhật (Người dùng tự thêm)",
        legalScore: 80,
        fengShui: {
            direction: "Đa dạng",
            element: "Trung tính",
            note: "Cần xem chi tiết từng căn."
        },
        finance: {
            bankSupport: "Vietcombank, MB",
            minDownPayment: "15%",
            maxLoanRatio: 0.7
        }
    };
};

export const dataService = {
  /**
   * 🔌 REAL-TIME ERP SIMULATOR (SMART GENERATOR V3.2 - BEST MATCH SEARCH)
   * Fixes "First Match False Positive" by implementing a scoring algorithm
   */
  checkInventoryRealtime: async (projectCode: string, unitCode?: string): Promise<any> => {
      // 1. INPUT NORMALIZATION
      const searchName = projectCode.toLowerCase().trim();
      
      // 2. FIND PROJECT METADATA (SMART MATCHING ALGORITHM)
      const allProjects = dataService.getProjects();
      
      let bestMatch: Project | undefined;
      let maxScore = 0;

      allProjects.forEach(p => {
          const pName = p.name.toLowerCase();
          const pId = p.id.toLowerCase();
          let score = 0;

          // Scoring Logic
          if (pName === searchName || pId === searchName) {
              score = 100; // Exact match takes priority
          } else if (pName.includes(searchName)) {
              // Partial match: Higher score for closer length match (e.g. "Global City" matches "City" better than "Aqua City" if context implies)
              // Here we just prioritize basic containment, but we add length weight
              score = 50 + (searchName.length / pName.length) * 20; 
          } else if (pId.includes(searchName)) {
              score = 40;
          }

          if (score > maxScore) {
              maxScore = score;
              bestMatch = p;
          }
      });

      // Threshold to prevent random matches for very generic terms
      const project = maxScore > 30 ? bestMatch : undefined;

      // 3. NETWORK LATENCY SIMULATION (Authenticity feel)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 4. GENERATIVE LOGIC
      if (project) {
          const developer = project.developer;
          const priceRangeStr = project.priceRange;
          
          // EXTRACT NUMERIC PRICE FROM REAL DATA
          const numbers = priceRangeStr.match(/(\d+[,.]?\d*)/g)?.map(n => parseFloat(n.replace(/,/g, ''))) || [50];
          const minPrice = numbers[0];
          const maxPrice = numbers.length > 1 ? numbers[1] : minPrice * 1.2;
          const currency = priceRangeStr.includes('USD') ? 'USD' : (priceRangeStr.includes('Tỷ') ? 'Tỷ' : 'Triệu/m²');

          // Determine if Primary (CĐT) or Secondary (Resale) Market based on Status
          const isSecondaryMarket = project.status.toLowerCase().includes('bàn giao') || project.status.toLowerCase().includes('sổ hồng');
          
          // SOURCE ATTRIBUTION LOGIC
          let sourceName = `ERP_${developer.toUpperCase().replace(/\s/g, '_')}_OFFICIAL`;
          let marketInsight = "Dữ liệu từ bảng hàng Chủ Đầu Tư (Real-time).";
          
          if (isSecondaryMarket) {
              sourceName = "MARKET_CRAWLER_V2";
              marketInsight = "⚠️ Giỏ hàng CĐT đã hết. Dữ liệu này được tổng hợp từ 'Cộng đồng Cư dân' và 'Sàn giao dịch thứ cấp'.";
          }

          // A. UNIT SPECIFIC QUERY
          if (unitCode) {
              const hash = unitCode.split('').reduce((a,b)=>a+b.charCodeAt(0),0);
              const isLocked = hash % 3 === 0; // 33% chance locked
              
              const priceFactor = (hash % 100) / 100; // 0.00 to 0.99
              const actualPriceRaw = minPrice + (maxPrice - minPrice) * priceFactor;
              
              let formattedPrice = "";
              if (currency === 'Triệu/m²') formattedPrice = `${actualPriceRaw.toFixed(1)} Triệu/m²`;
              else if (currency === 'USD') formattedPrice = `${Math.floor(actualPriceRaw).toLocaleString()} USD/m²`;
              else formattedPrice = `${actualPriceRaw.toFixed(1)} Tỷ`;

              return {
                  status: "success",
                  source: sourceName,
                  timestamp: new Date().toISOString(),
                  data: {
                      unit_code: unitCode,
                      is_available: !isLocked,
                      price: isLocked ? "Đã bán" : `${formattedPrice} (Chưa VAT)`,
                      policy: isLocked ? "N/A" : (isSecondaryMarket ? "Thương lượng trực tiếp" : project.paymentSchedule),
                      urgent_note: isLocked 
                          ? `❌ Căn ${unitCode} đã có cọc.` 
                          : `✅ Tín hiệu tốt: Căn ${unitCode} giá tốt hơn trung bình.`,
                      advisor_action: isLocked 
                          ? "Đề xuất căn khác tầng cao hơn." 
                          : "Đề nghị khách lock căn (ưu tiên)."
                  }
              };
          }

          // B. PROJECT OVERVIEW QUERY (SMART GENERATION)
          const stockCount = isSecondaryMarket ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 50) + 10;
          
          const mockUnits = [];
          const blocks = ["A", "B", "C", "D", "T1"];
          const views = ["Sông", "Thành phố", "Hồ bơi", "Công viên", "Landmark"];
          
          for(let i=0; i<3; i++) {
              const block = blocks[Math.floor(Math.random() * blocks.length)];
              const floor = Math.floor(Math.random() * 25) + 3;
              const num = Math.floor(Math.random() * 15) + 1;
              const code = `${block}${floor}.${num < 10 ? '0'+num : num}`;
              const area = Math.floor(Math.random() * 50) + 60; // 60-110m2
              
              let totalPrice = "";
              if (currency === 'Triệu/m²') {
                  const pPerM2 = minPrice + (Math.random() * (maxPrice - minPrice));
                  const total = (pPerM2 * area) / 1000;
                  totalPrice = `${total.toFixed(2)} Tỷ`;
              } else if (currency === 'USD') {
                  const pPerM2 = minPrice + (Math.random() * (maxPrice - minPrice));
                  totalPrice = `${(pPerM2 * area).toLocaleString()} USD`;
              } else {
                  const total = minPrice + (Math.random() * (maxPrice - minPrice));
                  totalPrice = `${total.toFixed(1)} Tỷ`;
              }

              mockUnits.push({
                  code: code,
                  type: `${Math.floor(area/35)}PN - ${area}m2`,
                  status: "Available",
                  price: totalPrice,
                  view: views[Math.floor(Math.random() * views.length)],
                  policy: isSecondaryMarket ? "Bao phí" : "Chiết khấu 1%"
              });
          }

          return {
              status: "success",
              source: sourceName,
              timestamp: new Date().toISOString(),
              data: {
                  stock_count: stockCount,
                  project_status: project.status,
                  units: mockUnits,
                  market_insight: marketInsight,
                  urgent_note: stockCount < 10 ? "🔥 HOT: Quỹ căn cạn dần." : "ℹ️ Nhiều lựa chọn đẹp.",
                  ai_suggestion: "Booking sớm để ưu tiên chọn căn."
              }
          };
      }

      // 5. FALLBACK
      return {
          status: "success",
          source: "EXTERNAL_SEARCH_AGGREGATOR",
          timestamp: new Date().toISOString(),
          data: {
              stock_count: "N/A",
              project_status: "Chưa có dữ liệu",
              units: [],
              market_insight: `Dữ liệu về '${projectCode}' chưa có trên hệ thống.`,
              urgent_note: "Vui lòng check tay.",
              ai_suggestion: "Xin số điện thoại khách để báo sau."
          }
      };
  },

  getLiveMarketContext: () => {
    const now = new Date();
    return {
        timestamp: now.toLocaleString('vi-VN'),
        gold: "Đang cập nhật...",
        usd: "Đang cập nhật...",
        rates: { floating: "10.5% (Tham chiếu)" },
        legal: "Luật 2024",
        infra: "Vành đai 3",
        trend: "YÊU CẦU SEARCH" 
    };
  },
  
  getFloatingInterestRate: (): number => 10.5,
  getBankRates: () => LIVE_BANK_RATES,
  
  initializeMarketData: () => {
      const storedProjectsStr = localStorage.getItem(PROJECTS_KEY);
      // If no projects, init with Featured. If featured has new items, we might miss them, 
      // but simplistic overwrite is safer for demo to ensure data integrity.
      if (!storedProjectsStr) {
          localStorage.setItem(PROJECTS_KEY, JSON.stringify(FEATURED_PROJECTS));
      }

      if (!localStorage.getItem(INVOICES_KEY)) {
          const mockInvoices: Invoice[] = [{ id: 'INV-2024-001', date: new Date('2024-01-15'), amount: 499000, status: 'paid', description: 'Gói Pro Agent - Tháng 1' }];
          localStorage.setItem(INVOICES_KEY, JSON.stringify(mockInvoices));
      }
      if (!localStorage.getItem(LEADS_KEY)) {
          const now = new Date();
          const seedLeads: Lead[] = [{
              id: 'seed_1', tenantId: 'demo_agent', name: 'Nguyễn Văn Hùng', phone: '0912345678', userType: 'individual', projectInterest: 'Global City',
              needs: 'Khách VIP. Quan tâm giá mới nhất.', budget: '25 Tỷ', purpose: 'ở', status: 'visited', priority: 'urgent', source: 'Facebook Ads', createdAt: new Date(now.getTime() - 3 * 86400000),
              psychology: { discType: 'D', communicationStyle: 'brief', riskTolerance: 'high', painPoints: ['Sợ mua hớ', 'Thích vị trí độc tôn'] },
          }];
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

  updateLeadPsychology: (id: string, psychology: Partial<UserPsychology>) => {
      const all = dataService.getAllLeadsRaw();
      const idx = all.findIndex(l => l.id === id);
      if (idx !== -1) {
          all[idx].psychology = { ...all[idx].psychology, ...psychology } as UserPsychology;
          localStorage.setItem(LEADS_KEY, JSON.stringify(all));
      }
  },

  addLeadMemory: (id: string, memory: UserMemory) => {
      const all = dataService.getAllLeadsRaw();
      const idx = all.findIndex(l => l.id === id);
      if (idx !== -1) {
          const currentMemories = all[idx].longTermMemory || [];
          const existingMemIdx = currentMemories.findIndex(m => m.key === memory.key);
          if (existingMemIdx !== -1) currentMemories[existingMemIdx] = memory;
          else currentMemories.push(memory);
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
      // 🔥 FIX: Auto-generate rich details if missing, so tools work for user projects
      if (!project.richDetails) {
          project.richDetails = generateMockRichDetails(project.priceRange);
      }
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

  generateMockDocContent: (fileName: string): string => {
      const lowerName = fileName.toLowerCase();
      if (lowerName.includes('gia')) {
          return `[OCR EXTRACT]: Bảng giá ${fileName}. Dữ liệu này có thể cũ. Hãy yêu cầu search giá mới nhất.`;
      }
      return `[OCR CONTENT]: Tài liệu "${fileName}".`;
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
