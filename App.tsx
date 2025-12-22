import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Lead, Project, MarketData, MacroData, UserProfile } from './types';
import { 
  createChatSession, 
  getMacroEconomics, 
  isQuotaExceeded, 
  generateFallbackChatResponse,
  generateWelcomeBackMessage,
  subscribeToRateLimit
} from './services/geminiService';
import ChatWindow from './components/ChatWindow';
import LeadDashboard from './components/LeadDashboard';
import MortgageCalculator from './components/MortgageCalculator';
import ProjectDetailPanel from './components/ProjectDetailPanel';
import { FinancialPanel, LegalPanel, LifestylePanel, ValuationPanel, ComparisonPanel, LoanAdvisoryPanel, MarketForecastPanel, RentVsBuyPanel, FinancialPlanPanel, FengShuiPanel } from './components/AnalysisTools';
import { 
  Building2, MapPin, LayoutDashboard, 
  MessageSquare, Info, BarChart3,
  Zap, Calculator, Sparkles, TrendingUp, Clock,
  Coins, Landmark, Banknote, DollarSign,
  Briefcase, Shield, Leaf, X, Home, GitCompare, Wallet, LineChart, ArrowRightLeft, Scale, Target, CheckCircle2, Globe, Phone,
  Lock, KeyRound, LogOut, Grid, ChevronDown, Compass, WifiOff
} from 'lucide-react';

const formatPrice = (price: string) => {
  return price
    .replace(' triệu/m²', ' Tr')
    .replace(' tỷ/căn', ' Tỷ')
    .replace(/ \(.*\)/, ''); // Remove content in parentheses
};

// Helper to resize image and convert to Base64 (TOKEN OPTIMIZATION)
// Reduced default width to 512px to save ~40% tokens on image inputs while maintaining chat legibility
const resizeImageToBase64 = (file: File, maxWidth = 512): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = height * (maxWidth / width);
          width = maxWidth;
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // OPTIMIZATION: Output as JPEG with 0.6 quality for minimal tokens
        const dataUrl = elem.toDataURL('image/jpeg', 0.6);
        const base64Data = dataUrl.split(',')[1];
        resolve(base64Data);
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

const ADMIN_SESSION_KEY = 'bds_advisor_admin_token';
const ADMIN_PIN = '9999';
const USER_PROFILE_KEY = 'bds_user_profile';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'chat' | 'dashboard'>('chat');
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPin, setAuthPin] = useState('');
  const [authError, setAuthError] = useState(false);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Macro Data State
  const [macroData, setMacroData] = useState<MacroData | null>(null);

  const [isHandoffTriggered, setIsHandoffTriggered] = useState(false);
  const [groundingSources, setGroundingSources] = useState<any[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  
  // State for Selected Project Details Panel
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // New State for Pro Tools
  const [activeTool, setActiveTool] = useState<'financial' | 'legal' | 'lifestyle' | 'valuation' | 'comparison' | 'loan_advisory' | 'forecast' | 'rent_vs_buy' | 'financial_plan' | 'feng_shui' | null>(null);
  const [showToolsMenu, setShowToolsMenu] = useState(false); // For the new dropdown
  
  // --- OFFLINE MODE STATE ---
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const [isLargeScreen, setIsLargeScreen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  const chatSessionRef = useRef<any>(null);
  const authInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to Rate Limit changes
  useEffect(() => {
    return subscribeToRateLimit((isLimited) => {
        setIsOfflineMode(isLimited);
    });
  }, []);

  // Handle Resize with Debounce
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsLargeScreen(window.innerWidth >= 1024);
      }, 100);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Check for existing session on load
  useEffect(() => {
    const sessionToken = localStorage.getItem(ADMIN_SESSION_KEY);
    if (sessionToken === 'authenticated') {
        setIsAuthenticated(true);
    }
  }, []);

  // Initial Data Fetch & Restore
  useEffect(() => {
    const initializeApp = async () => {
        const savedMessages = localStorage.getItem('chat_history');
        
        // Load User Profile
        const savedProfile = localStorage.getItem(USER_PROFILE_KEY);
        let currentProfile: UserProfile | null = null;
        if (savedProfile) {
            try {
                currentProfile = JSON.parse(savedProfile);
                if (currentProfile) {
                     currentProfile.lastVisit = new Date();
                     localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(currentProfile));
                     setUserProfile(currentProfile);
                }
            } catch (e) {
                console.error("Profile load error", e);
            }
        }

        // Initialize Chat
        chatSessionRef.current = createChatSession(currentProfile);

        // Initial Messages Logic
        if (savedMessages) {
          try {
            const parsed = JSON.parse(savedMessages);
            const hydrated = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
            setMessages(hydrated);
          } catch (e) {
            console.error("Failed to load chat history", e);
          }
        } else {
           // If no history, but we have a profile -> Welcome Back Message
           if (currentProfile && currentProfile.name) {
               setIsLoading(true);
               // Use a small delay before first API call to ensure session is ready/stable
               await new Promise(r => setTimeout(r, 100));
               const welcomeText = await generateWelcomeBackMessage(currentProfile);
               setMessages([
                   { role: 'model', text: welcomeText, timestamp: new Date() }
               ]);
               setIsLoading(false);
           } else {
               // Default Welcome (No API call needed)
               const hours = new Date().getHours();
               let timeGreeting = "Xin chào";
               if (hours < 12) timeGreeting = "Chào buổi sáng";
               else if (hours < 18) timeGreeting = "Chào buổi chiều";
               else timeGreeting = "Buổi tối an lành";

               setMessages([
                {
                  role: 'model',
                  text: `**${timeGreeting}!** Tôi là **BDS Advisor Pro** - Cố vấn Chiến lược BĐS của riêng Anh/Chị.\n\nThị trường đang bước vào **Vận 9 (Hành Hoả)** cùng **Luật Đất Đai 2024** mới. Việc đầu tư lúc này không chỉ là lợi nhuận, mà là **kiến tạo di sản**.\n\nTôi sở hữu bộ não của **5 chuyên gia** để hỗ trợ Anh/Chị:\n**Tài chính:** Tính IRR, NPV & đòn bẩy ngân hàng tối ưu.\n**Phong Thuỷ:** Soi hướng Đại Cát & thế đất tụ tài.\n**Pháp lý:** Rà soát hợp đồng & quy hoạch 1/500.\n\n**Anh/Chị đang quan tâm Dòng tiền (Đầu tư) hay tìm Tổ ấm (An cư) để tôi tư vấn trọng tâm ngay ạ?**`,
                  timestamp: new Date()
                }
              ]);
           }
        }

        // Initial Macro Data Load - Delayed further to avoid startup contention
        await new Promise(r => setTimeout(r, 2000));
        const macro = await getMacroEconomics();
        setMacroData(macro);
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Focus auth input when modal opens
  useEffect(() => {
    if (showAuthModal && authInputRef.current) {
        setTimeout(() => authInputRef.current?.focus(), 100);
    }
  }, [showAuthModal]);

  const handleSendMessage = useCallback(async (text: string, imageFile?: File | null) => {
    if (!chatSessionRef.current) return;

    let imageUrl = undefined;
    let base64Data = "";

    // Prepare User Message
    if (imageFile) {
        // OPTIMIZATION: Resize image before conversion to base64. 512px is sufficient for chat context.
        base64Data = await resizeImageToBase64(imageFile, 512);
        imageUrl = URL.createObjectURL(imageFile);
    }

    const userMsg: Message = { 
        role: 'user', 
        text, 
        timestamp: new Date(),
        image: imageUrl // Store local URL for immediate display
    };

    // Capture the current messages state BEFORE this new message is added to state
    // We will append userMsg to this list for the Lead history
    let currentHistory: Message[] = [];
    
    setMessages(prev => {
        currentHistory = [...prev, userMsg]; // This captures the full history up to this point
        return [...prev, userMsg];
    });
    
    setIsLoading(true);
    setGroundingSources([]);

    try {
      let result;
      
      const sendMessageWithRetry = async () => {
         let attempts = 0;
         while (attempts < 3) {
             try {
                 if (imageFile && base64Data) {
                    const parts = [
                        { text: text || "Phân tích hình ảnh này giúp tôi." },
                        { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
                    ];
                    return await chatSessionRef.current.sendMessage({ message: parts });
                 } else {
                    return await chatSessionRef.current.sendMessage({ message: text });
                 }
             } catch (e) {
                 if (attempts < 2 && isQuotaExceeded(e)) {
                     attempts++;
                     // Exponential backoff: 2000ms, 4000ms
                     await new Promise(r => setTimeout(r, 2000 * attempts));
                     continue;
                 }
                 throw e;
             }
         }
      }

      result = await sendMessageWithRetry();
      
      if (result.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        setGroundingSources(result.candidates[0].groundingMetadata.groundingChunks);
      }

      const functionCalls = result.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        for (const fc of functionCalls) {
          if (fc.name === 'handoffToSales') {
            const args = fc.args as any;
            
            // --- VALIDATION LAYER: Strict Phone Number Check ---
            // 1. Clean the input (remove spaces, dots, dashes)
            const rawPhone = args.phone || '';
            const cleanPhone = rawPhone.replace(/\D/g, ''); // Remove non-digits
            
            // 2. Validation Rules:
            // - Must exist
            // - Must start with '0' (Vietnamese format)
            // - Must be at least 10 digits
            const hasValidPhone = cleanPhone.length >= 10 && cleanPhone.startsWith('0');
            
            if (!hasValidPhone) {
                 // ERROR STATE: Send tool error back to model
                 const toolResp = [{
                    functionResponse: {
                        name: 'handoffToSales',
                        id: fc.id, 
                        response: { result: `Error: Phone '${rawPhone}' is invalid. Vietnamese phone numbers must start with '0' and have at least 10 digits. Please politely ask the user to correct it.` }
                    }
                 }];
                 
                 const followUp = await chatSessionRef.current.sendMessage(toolResp);
                 setMessages(prev => [...prev, {
                    role: 'model',
                    text: followUp.text,
                    timestamp: new Date()
                 }]);
                 return; // Stop processing
            }

            // SUCCESS STATE: Proceed to create lead
            const newLead: Lead = {
              id: Date.now().toString(),
              name: args.customerName,
              phone: cleanPhone, // Save the clean version
              projectInterest: args.projectInterest || 'Đang tư vấn',
              needs: args.notes || 'Cần bảng tính dòng tiền',
              budget: args.budget || 'Đang cập nhật',
              purpose: 'đầu tư',
              timeline: 'Càng sớm càng tốt',
              status: 'new',
              createdAt: new Date(),
              chatHistory: currentHistory // SAVE THE TRANSCRIPT HERE
            };
            
            setLeads(prev => [newLead, ...prev]);
            setIsHandoffTriggered(true);

            // --- SAVE USER PROFILE PERSISTENTLY ---
            const newProfile: UserProfile = {
                name: args.customerName,
                phone: cleanPhone,
                lastInterest: args.projectInterest || 'General',
                budgetRange: args.budget,
                lastVisit: new Date()
            };
            localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));
            setUserProfile(newProfile);
            // -------------------------------------
            
            // Send Success Response to Model to close the tool loop
             const toolResp = [{
                functionResponse: {
                    name: 'handoffToSales',
                    id: fc.id,
                    response: { result: "Success: Lead created. Tell the user you have received their info and will contact them shortly." }
                }
             }];
             const followUp = await chatSessionRef.current.sendMessage(toolResp);

            // Pass the leadData to the confirmation message
            setMessages(prev => [...prev, {
              role: 'model',
              text: followUp.text,
              timestamp: new Date(),
              leadData: newLead 
            }]);
          }
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'model',
          text: result.text,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error(error);
      
      let fallbackText = "Xin lỗi anh chị, hệ thống phân tích hình ảnh hoặc dữ liệu đang gặp sự cố. Vui lòng thử lại sau.";
      
      if (isQuotaExceeded(error)) {
         fallbackText = generateFallbackChatResponse(text);
      }

      setMessages(prev => [...prev, {
        role: 'model',
        text: fallbackText,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- NEW: Reset Profile Function ---
  const handleResetProfile = () => {
    localStorage.removeItem(USER_PROFILE_KEY);
    setUserProfile(null);
    setMessages([]); // Optionally clear chat
    window.location.reload(); // Reload to reset context and UI
  };

  // --- NEW: Add Manual Lead Function ---
  const handleAddLead = (lead: Lead) => {
    setLeads(prev => [lead, ...prev]);
  };

  const handleCalculatorContact = (message: string) => {
    handleSendMessage(message);
    if (!isLargeScreen) {
        setShowCalculator(false); // Close calculator on small screens after sending
    }
  };

  const handleSmartAction = (toolId: string) => {
     setActiveTool(toolId as any);
  };

  // --- AUTH HANDLERS ---
  const handleDashboardAccess = () => {
    if (isAuthenticated) {
        setView('dashboard');
    } else {
        setShowAuthModal(true);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authPin === ADMIN_PIN) { 
        setIsAuthenticated(true);
        localStorage.setItem(ADMIN_SESSION_KEY, 'authenticated'); // PERSIST SESSION
        setShowAuthModal(false);
        setView('dashboard');
        setAuthPin('');
        setAuthError(false);
    } else {
        setAuthError(true);
        setAuthPin('');
    }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem(ADMIN_SESSION_KEY); // CLEAR SESSION
      setView('chat');
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 relative">
      
      {/* Background Pattern for "Premium" Feel */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* --- OFFLINE MODE BANNER --- */}
      {isOfflineMode && (
          <div className="bg-orange-50 border-b border-orange-100 px-4 py-2 flex items-center justify-center gap-2 text-[10px] md:text-xs font-bold text-orange-700 animate-in slide-in-from-top duration-300 relative z-[60]">
             <WifiOff size={14} />
             <span>Hệ thống đang quá tải. Đang sử dụng dữ liệu mẫu và chế độ Offline.</span>
          </div>
      )}

      {/* Detail Panel Overlay */}
      <ProjectDetailPanel 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
      />

      {/* Modern Header - Clean & Focused */}
      <nav className="bg-white/80 backdrop-blur-2xl border-b border-slate-200/60 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-50 shrink-0 shadow-sm relative">
        <div className="flex items-center gap-3">
          {/* New Minimal Logo */}
          <div 
             className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" 
             onClick={() => { localStorage.clear(); window.location.reload(); }}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M12 3C12 3 14 9 20 11C21 11.33 21 12.66 20 13C14 15 12 21 12 21C12 21 10 15 4 13C3 12.66 3 11.33 4 11C10 9 12 3 12 3Z" fill="url(#header-logo-gradient)" />
              <defs>
                <linearGradient id="header-logo-gradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2563EB" />
                  <stop offset="1" stopColor="#9333EA" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
              BDS Advisor <span className="text-indigo-600">Pro</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
            {/* Hotline - Always Visible but Subtle */}
            <a 
               href="tel:0971132378"
               className="hidden md:flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100 hover:bg-red-100 transition-colors shadow-sm animate-pulse"
            >
               <Phone size={14} className="fill-red-600" /> Hotline
            </a>

            {/* --- REFACTORED: Combined "Toolkit" Button --- */}
            <div className="relative">
                <button 
                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        showToolsMenu || activeTool
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <Grid size={16} /> 
                    <span className="hidden md:inline">Bộ công cụ</span>
                    <span className="md:hidden">Tools</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${showToolsMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Grid Menu */}
                {showToolsMenu && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowToolsMenu(false)}></div>
                        <div className="absolute top-full right-0 mt-2 w-72 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 ml-1">Phân tích chuyên sâu</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => {setActiveTool('financial'); setShowToolsMenu(false);}} className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors group text-left border border-slate-50 hover:border-emerald-100">
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform"><Briefcase size={18} /></div>
                                    <div><p className="text-xs font-bold text-slate-800">Dòng tiền</p><p className="text-[10px] text-slate-500">Net Profit (ROI)</p></div>
                                </button>
                                <button onClick={() => {setActiveTool('legal'); setShowToolsMenu(false);}} className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors group text-left border border-slate-50 hover:border-red-100">
                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:scale-110 transition-transform"><Shield size={18} /></div>
                                    <div><p className="text-xs font-bold text-slate-800">Pháp lý</p><p className="text-[10px] text-slate-500">Soi hợp đồng</p></div>
                                </button>
                                <button onClick={() => {setActiveTool('feng_shui'); setShowToolsMenu(false);}} className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition-colors group text-left border border-slate-50 hover:border-amber-100">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:scale-110 transition-transform"><Compass size={18} /></div>
                                    <div><p className="text-xs font-bold text-slate-800">Phong Thuỷ</p><p className="text-[10px] text-slate-500">La Bàn & Hướng</p></div>
                                </button>
                                <button onClick={() => {setActiveTool('comparison'); setShowToolsMenu(false);}} className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group text-left border border-slate-50 hover:border-blue-100">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform"><GitCompare size={18} /></div>
                                    <div><p className="text-xs font-bold text-slate-800">So sánh</p><p className="text-[10px] text-slate-500">Đối chiếu dự án</p></div>
                                </button>
                                <button onClick={() => {setActiveTool('forecast'); setShowToolsMenu(false);}} className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors group text-left border border-slate-50 hover:border-indigo-100">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform"><LineChart size={18} /></div>
                                    <div><p className="text-xs font-bold text-slate-800">Dự báo</p><p className="text-[10px] text-slate-500">Tiềm năng tăng giá</p></div>
                                </button>
                                <button onClick={() => {setActiveTool('rent_vs_buy'); setShowToolsMenu(false);}} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition-colors group text-left border border-slate-50 hover:border-orange-100">
                                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg group-hover:scale-110 transition-transform"><ArrowRightLeft size={18} /></div>
                                    <div><p className="text-xs font-bold text-slate-800">Mua hay Thuê</p><p className="text-[10px] text-slate-500">Phân tích 10 năm</p></div>
                                </button>
                                <button onClick={() => {setShowCalculator(!showCalculator); setShowToolsMenu(false);}} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group text-left border border-slate-50 hover:border-slate-200">
                                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:scale-110 transition-transform"><Calculator size={18} /></div>
                                    <div><p className="text-xs font-bold text-slate-800">Tính lãi vay</p><p className="text-[10px] text-slate-500">Ước tính trả góp</p></div>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Segmented Control View Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/50">
                <button 
                    onClick={() => setView('chat')}
                    className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                        view === 'chat' 
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <MessageSquare size={14} /> <span className="hidden md:inline">Tư vấn</span>
                </button>
                <button 
                    onClick={handleDashboardAccess}
                    className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                        view === 'dashboard' 
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    {isAuthenticated ? <LayoutDashboard size={14} /> : <Lock size={14} />} 
                    <span className="hidden md:inline">Quản trị</span>
                </button>
            </div>
            
            {isAuthenticated && view === 'dashboard' && (
                <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    title="Đăng xuất Admin"
                >
                    <LogOut size={16} />
                </button>
            )}
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden relative z-0">
        {view === 'chat' ? (
          <div className="flex-1 flex flex-col p-0 md:p-6 w-full relative">
            
            {showCalculator && (
                <div className="absolute right-6 top-6 z-[60] w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-300 md:right-8 md:top-8 shadow-2xl rounded-3xl">
                    <MortgageCalculator 
                        onContact={handleCalculatorContact} 
                        onClose={() => setShowCalculator(false)}
                    />
                </div>
            )}

            {/* --- PRO TOOL OVERLAYS (Centered Modal) --- */}
            {activeTool && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-4xl h-[85vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative flex flex-col border border-white/20 ring-1 ring-black/5">
                        <div className="absolute top-4 right-4 z-10">
                            <button onClick={() => setActiveTool(null)} className="p-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors text-slate-500 shadow-sm">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden p-6 md:p-8">
                            {activeTool === 'financial' && <FinancialPanel />}
                            {activeTool === 'rent_vs_buy' && <RentVsBuyPanel />}
                            {activeTool === 'financial_plan' && <FinancialPlanPanel />}
                            {activeTool === 'legal' && <LegalPanel />}
                            {activeTool === 'forecast' && <MarketForecastPanel />}
                            {activeTool === 'lifestyle' && <LifestylePanel />}
                            {activeTool === 'valuation' && <ValuationPanel />}
                            {activeTool === 'comparison' && <ComparisonPanel />}
                            {activeTool === 'loan_advisory' && <LoanAdvisoryPanel />}
                            {activeTool === 'feng_shui' && <FengShuiPanel />}
                        </div>
                    </div>
                </div>
            )}

            {/* --- CENTERED CHAT CONTAINER FOR 10/10 UX --- */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 relative bg-white md:rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden max-w-[1200px] mx-auto w-full border border-slate-100/50">
              <ChatWindow 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading}
                isHandoffTriggered={isHandoffTriggered}
                groundingSources={groundingSources}
                onViewProject={setSelectedProject}
                onSmartAction={handleSmartAction}
                userProfile={userProfile}
                onResetProfile={handleResetProfile}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-0 md:p-8 w-full max-w-[1600px] mx-auto">
            <LeadDashboard leads={leads} onAddLead={handleAddLead} />
          </div>
        )}
      </main>

      {/* --- AUTH MODAL --- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden relative">
                <button 
                  onClick={() => { setShowAuthModal(false); setAuthError(false); setAuthPin(''); }} 
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-700">
                        <Lock size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Truy cập Quản trị</h3>
                    <p className="text-xs text-slate-500 mb-6">Vui lòng nhập mã PIN để xác thực quyền truy cập dữ liệu nhạy cảm.</p>
                    
                    <form onSubmit={handleAuthSubmit} className="w-full">
                        <div className="relative mb-4">
                            <input 
                                ref={authInputRef}
                                type="password" 
                                value={authPin}
                                onChange={(e) => { setAuthPin(e.target.value); setAuthError(false); }}
                                className={`w-full p-4 pl-12 bg-slate-50 border rounded-2xl text-center text-xl font-black tracking-widest focus:outline-none focus:ring-2 transition-all ${authError ? 'border-red-300 focus:ring-red-100 bg-red-50 text-red-600' : 'border-slate-200 focus:ring-indigo-100 text-slate-800'}`}
                                placeholder="••••"
                                maxLength={4}
                            />
                            <KeyRound size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${authError ? 'text-red-400' : 'text-slate-400'}`} />
                        </div>
                        {authError && <p className="text-xs font-bold text-red-500 mb-4 animate-pulse">Mã PIN không chính xác!</p>}
                        <button 
                            type="submit"
                            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200"
                        >
                            Xác thực
                        </button>
                    </form>
                    <p className="text-[10px] text-slate-400 mt-6">Mã mặc định cho demo: <strong className="text-slate-600">9999</strong></p>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;
