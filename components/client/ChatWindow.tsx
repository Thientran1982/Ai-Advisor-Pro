
import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Message, TenantProfile, Project } from '../../types';
import { 
  X, ArrowUp, RefreshCcw, Zap, Image as ImageIcon, Building2, LayoutDashboard, Mic, Loader2, ChevronDown,
  Copy, ThumbsUp, ThumbsDown, BrainCircuit, Sparkles, Check, CheckCircle, Fingerprint, Crown, Square, Volume2,
  Globe, ShieldCheck, Database, Search, Terminal, AlertCircle, ChevronRight
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import ReactMarkdown from 'react-markdown';
import { 
    InvestmentPanel, ValuationPanel, LegalPanel, FengShuiPanel, 
    ForecastPanel, ComparisonPanel, BankRatePanel, StrategyPanel 
} from '../tools/AnalysisTools'; 
import MortgageCalculator from '../tools/MortgageCalculator';
import LeadMagnet from '../tools/LeadMagnet';
import ProjectDetailPanel from './ProjectDetailPanel';
import BrandLogo from '../common/BrandLogo';
import { useGeminiLive } from '../../hooks/useGeminiLive'; 

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string, imageFile?: File | null) => void;
  isLoading: boolean;
  tenant: TenantProfile | null;
  onClearChat?: () => void;
  onSwitchToAgent?: () => void;
  initialProject?: string | null;
  onLeadCapture?: (data: { phone?: string, email?: string, name?: string, note?: string }) => void;
  isThinkingMode?: boolean;
  showMemoryToast?: boolean;
  onUpgradeRequest?: () => void;
  liveReasoning?: string[];
}

// 🔥 FIX: Aggressive cleaning logic to remove artifacts
const cleanText = (text: string) => {
    if (!text) return "";
    return text
        .replace(/\[SYSTEM_LOG:.*?\]/g, "") // Remove System Logs
        .replace(/\n\s*\n/g, '\n') // Collapse multiple newlines into one
        .replace(/^\s+|\s+$/g, '') // Trim outer whitespace
        .trim();
};

// 🔥 EXTRACTED PURE COMPONENT (PERFORMANCE FIX)
const IntelligenceTrace = memo(({ steps, duration }: { steps?: string[], duration?: number }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    if (!steps || steps.length === 0) return null;

    const filteredSteps = steps.filter(step => 
        !step.includes("Tiếp nhận") && 
        !step.includes("Hoàn tất") &&
        !step.includes("Khởi tạo") &&
        !step.includes("Process Completed") &&
        !step.includes("AI Audit") &&
        !step.includes("Kịch bản sẵn sàng")
    );

    if (filteredSteps.length === 0) return null;

    const getLogStyle = (step: string) => {
        if (step.includes('ERP Sync')) return 'text-emerald-700 bg-emerald-50/50 border-emerald-100'; 
        if (step.includes('Market Scan') || step.includes('Google Search')) return 'text-blue-700 bg-blue-50/50 border-blue-100'; 
        if (step.includes('Swarm') || step.includes('Supervisor')) return 'text-purple-700 bg-purple-50/50 border-purple-100'; 
        return 'text-slate-600 bg-slate-50 border-slate-100';
    };

    const getLogIcon = (step: string) => {
        if (step.includes('ERP')) return <Database size={10}/>;
        if (step.includes('Market') || step.includes('Search')) return <Search size={10}/>;
        if (step.includes('Swarm') || step.includes('Supervisor')) return <BrainCircuit size={10}/>;
        return <CheckCircle size={10}/>;
    };

    return (
        <div className="mb-1 mt-0.5">
            <button onClick={() => setIsOpen(!isOpen)} className="group flex items-center gap-1.5 text-[10px] font-medium text-slate-300 hover:text-indigo-500 transition-colors select-none py-1 focus:outline-none">
                <div className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                    <ChevronRight size={10}/>
                </div>
                <span className="uppercase tracking-wider">
                    AI Process ({filteredSteps.length} steps)
                </span>
                {duration && !isOpen && <span className="font-mono opacity-50 ml-1">{(duration).toFixed(1)}s</span>}
            </button>
            
            {isOpen && (
                <div className="space-y-1 pl-1 animate-in slide-in-from-top-1 duration-200 mt-1 border-l-2 border-slate-100 ml-1 mb-2">
                    {filteredSteps.map((step, i) => (
                        <div key={i} className={`flex items-start gap-2 px-2 py-1 rounded-md border text-[10px] font-medium ml-2 ${getLogStyle(step)}`}>
                            <span className="mt-0.5 opacity-70">{getLogIcon(step)}</span>
                            <span className="leading-relaxed">{step}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

const WidgetContainer: React.PropsWithChildren<{}> = ({ children }) => (
    <div className="mt-4 w-full max-w-[400px] animate-in zoom-in-95 duration-500 origin-top-left rounded-2xl overflow-hidden border border-slate-200/60 bg-white shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all ring-1 ring-slate-100 mx-auto md:mx-0">
        {children}
    </div>
);

const Avatar = ({ src, className, fallback }: { src?: string, className?: string, fallback: React.ReactNode }) => {
    const [hasError, setHasError] = useState(false);
    useEffect(() => { setHasError(false); }, [src]);
    const safeClass = `${className || ''} object-cover rounded-full aspect-square`;
    if (src && !hasError) return <img src={src} className={safeClass} alt="Avatar" onError={() => setHasError(true)} />;
    return <>{fallback}</>;
};

const GenerativeWidget = ({ type, data, onLeadCapture, onSendMessage, tenant, onUpgradeRequest }: { type: string, data?: any, onLeadCapture?: (d: any) => void, onSendMessage?: (msg: string) => void, tenant: TenantProfile | null, onUpgradeRequest?: () => void }) => {
    const isPro = tenant?.subscription === 'pro_agent' || tenant?.subscription === 'enterprise';
    const pid = data?.projectId; 
    const comparisonPid = data?.projectIds && data.projectIds.length > 0 ? data.projectIds[0] : pid;
    const handleUnlock = () => { if (onUpgradeRequest) onUpgradeRequest(); };

    switch (type) {
        case 'valuation': return <WidgetContainer><ValuationPanel projectId={pid} isLocked={!isPro} onUnlock={handleUnlock} /></WidgetContainer>;
        case 'feng_shui': return <WidgetContainer><FengShuiPanel isLocked={!isPro} birthYear={data?.birthYear} onUnlock={handleUnlock} /></WidgetContainer>;
        case 'legal': return <WidgetContainer><LegalPanel projectId={pid} isLocked={!isPro} onUnlock={handleUnlock} /></WidgetContainer>;
        case 'finance': return <WidgetContainer><InvestmentPanel projectId={pid} isLocked={!isPro} onUnlock={handleUnlock} /></WidgetContainer>;
        case 'strategy': return <WidgetContainer><StrategyPanel isLocked={!isPro} onUnlock={handleUnlock} /></WidgetContainer>;
        case 'comparison': return <WidgetContainer><ComparisonPanel projectId={comparisonPid} isLocked={!isPro} onUnlock={handleUnlock} /></WidgetContainer>;
        case 'forecast': return <WidgetContainer><ForecastPanel projectId={pid} isLocked={!isPro} onUnlock={handleUnlock} /></WidgetContainer>;
        case 'bank_rates': return <WidgetContainer><BankRatePanel isLocked={!isPro} onUnlock={handleUnlock} /></WidgetContainer>;
        case 'calculator': return (
            <div className="mt-3 w-full max-w-sm animate-in slide-in-from-left-4">
                <MortgageCalculator isEmbedded initialPrice={data?.initialPrice} onContact={(msg) => { if (onSendMessage) onSendMessage(msg); if (onLeadCapture) onLeadCapture({ note: 'Yêu cầu tư vấn vay vốn' }); }} />
            </div>
        );
        case 'lead_magnet': return (
            <div className="mt-3 w-full max-w-sm animate-in slide-in-from-left-4">
                <LeadMagnet title={data?.documentType} onSuccess={(d) => { if (onLeadCapture) onLeadCapture({ email: d.email, note: `Tải tài liệu: ${data?.documentType}` }); }} />
            </div>
        );
        default: return null;
    }
};

const ThinkingStream = ({ inputContext, focus, liveLogs }: { inputContext: string, focus?: string, liveLogs?: string[] }) => {
    // Only use simulated fallback if liveLogs is empty
    const displayThought = (liveLogs && liveLogs.length > 0) ? liveLogs[0] : "Đang kết nối hệ tri thức...";

    return (
        <div className="flex items-center gap-3 py-3 px-4 animate-in fade-in duration-500 bg-white/50 rounded-2xl border border-slate-100/50 backdrop-blur-sm w-fit shadow-sm">
            <div className="relative flex items-center justify-center w-5 h-5">
                <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-ping"></div>
                <BrainCircuit size={18} className="text-indigo-600 relative z-10" />
            </div>
            <span className="text-xs md:text-sm font-medium text-slate-700 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 animate-gradient-x truncate max-w-[250px] md:max-w-md">
                {displayThought}
            </span>
        </div>
    );
};

const MessageActions = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
    const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Sao chép">{copied ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}</button>
            <div className="h-3 w-px bg-slate-200 mx-1"></div>
            <button onClick={() => setFeedback('like')} className={`p-1.5 rounded-lg transition-colors ${feedback === 'like' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}><ThumbsUp size={14} className={feedback === 'like' ? 'fill-current' : ''}/></button>
            <button onClick={() => setFeedback('dislike')} className={`p-1.5 rounded-lg transition-colors ${feedback === 'dislike' ? 'text-rose-600 bg-rose-50' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}><ThumbsDown size={14} className={feedback === 'dislike' ? 'fill-current' : ''}/></button>
        </div>
    );
};

const MemoryToast = ({ show }: { show: boolean }) => {
    if (!show) return null;
    return (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-indigo-100 flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-500 z-50">
            <div className="p-1 bg-indigo-100 rounded-full"><Fingerprint size={12} className="text-indigo-600"/></div>
            <span className="text-xs font-bold text-indigo-900">Đã ghi nhớ sở thích</span>
        </div>
    );
};

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading, tenant, onClearChat, onSwitchToAgent, initialProject, onLeadCapture, isThinkingMode, showMemoryToast, onUpgradeRequest, liveReasoning }) => {
  const [input, setInput] = useState('');
  const [lastUserQuery, setLastUserQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedRef = useRef(false);

  const { isLiveActive, isLiveConnecting, startLiveSession, stopLiveSession, volumeLevel, liveError } = useGeminiLive();

  useEffect(() => {
      if (scrollRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
          if (isNearBottom || messages[messages.length - 1]?.role === 'user') {
              scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
          }
      }
  }, [messages.length, isLoading, previewUrl, liveReasoning]); 

  const handleScroll = () => { 
      if (!scrollRef.current) return; 
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current; 
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 200); 
  };
  
  const manualScrollToBottom = () => { if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); };

  const dynamicQuickPrompts = useMemo(() => {
      let prompts = ["Thị trường BĐS tháng này?", "So sánh giá các dự án?", "Lãi suất ngân hàng hôm nay?", "Dự án nào đang hot?"];
      if (tenant?.aiConfig?.focus === 'investment') prompts = ["Tính dòng tiền cho thuê 5 năm?", "So sánh Yield Metropole vs Empire?", "Dự án nào có tiềm năng X2?", "Phân tích rủi ro pháp lý?"];
      if (tenant?.aiConfig?.focus === 'residence') prompts = ["Dự án nào gần trường quốc tế?", "Tiện ích cho người già & trẻ em?", "Phí quản lý & An ninh?", "Xem hướng hợp tuổi 1990?"];
      return prompts;
  }, [tenant?.aiConfig?.focus]);

  useEffect(() => {
      if (initialProject && !hasInitializedRef.current) {
          hasInitializedRef.current = true;
          const project = dataService.getProjectById(initialProject);
          if (project) {
              setViewingProject(project);
              onSendMessage(`Tôi đang quan tâm dự án ${project.name}. Cho tôi xem thông tin chi tiết và bảng giá?`);
          }
      }
  }, [initialProject, onSendMessage]);

  useEffect(() => {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.toolPayload?.type === 'show_project_info' && lastMsg.toolPayload.data?.projectId) {
          const project = dataService.getProjectById(lastMsg.toolPayload.data.projectId);
          if (project) setViewingProject(project);
      }
  }, [messages]);

  const handleOpenDefaultProject = () => {
      const projects = dataService.getProjects();
      if (projects.length > 0) setViewingProject(projects[0]);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || selectedImage) && !isLoading) {
      setLastUserQuery(input);
      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
      const foundPhone = input.match(phoneRegex);
      if (foundPhone && onLeadCapture) {
          onLeadCapture({ phone: foundPhone[0], note: `Phát hiện SĐT trong chat: "${input}"` });
      }
      onSendMessage(input, selectedImage);
      setInput(''); setSelectedImage(null); setPreviewUrl(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FCFCFD] relative font-sans text-slate-900 overflow-hidden">
      {/* 1. HEADER */}
      <header className="h-[64px] flex items-center justify-between px-4 md:px-6 z-30 absolute top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all">
          <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer hover:scale-105 transition-transform" title={tenant?.name}>
                  <Avatar src={tenant?.avatar} className={`w-9 h-9 rounded-full shadow-md border-2 transition-colors ${isLoading ? 'border-indigo-400' : 'border-white'}`} fallback={<div className="w-9 h-9 bg-slate-900 text-white rounded-full flex items-center justify-center"><Zap size={16} fill="currentColor"/></div>}/>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full transition-colors ${isLoading ? 'bg-indigo-500 animate-pulse' : 'bg-green-50'}`}></span>
                  {isLoading && (<span className="absolute -inset-1 rounded-full border-2 border-indigo-400/30 animate-ping pointer-events-none"></span>)}
              </div>
              <div className="hidden md:flex items-center px-3 py-1 bg-slate-100/80 rounded-full border border-slate-200/50">
                  <BrandLogo variant="icon" size="sm" className={`opacity-50 grayscale scale-75 transition-all ${isLoading ? 'animate-pulse text-indigo-600 opacity-100' : ''}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ml-1 transition-colors ${isLoading ? 'text-indigo-600' : 'text-slate-400'}`}>{isLoading ? 'Đang suy luận...' : 'AI Sẵn Sàng'}</span>
              </div>
          </div>
          <div className="flex items-center gap-2">
              {tenant?.subscription !== 'pro_agent' && (
                  <button onClick={onUpgradeRequest} className="hidden md:flex px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wide shadow-md hover:shadow-lg transition-all items-center gap-1 active:scale-95 animate-in slide-in-from-top-2">
                      <Crown size={12} fill="currentColor" className="text-yellow-300"/> Nâng cấp Pro
                  </button>
              )}
              <button onClick={handleOpenDefaultProject} className="hidden md:flex p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Building2 size={20}/></button>
              <button onClick={onSwitchToAgent} className="md:hidden p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl"><LayoutDashboard size={20} /></button>
              <div className="h-4 w-px bg-slate-200 mx-1"></div>
              <button onClick={onClearChat} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all group"><RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500"/></button>
          </div>
      </header>

      {/* ERROR BANNER FOR LIVE API */}
      {liveError && (
          <div className="absolute top-[64px] left-0 right-0 z-30 flex justify-center animate-in slide-in-from-top-2 fade-in">
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full border border-red-200 text-xs font-bold shadow-sm flex items-center gap-2">
                  <AlertCircle size={14}/> {liveError}
              </div>
          </div>
      )}

      <MemoryToast show={showMemoryToast || false} />

      {/* 2. CHAT AREA */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-3 md:px-0 pt-24 pb-32 md:pb-40 custom-scrollbar scroll-smooth relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.3] pointer-events-none z-0"></div>
          <div className="max-w-3xl mx-auto space-y-6 relative z-10 px-2 md:px-0">
              {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in-95 duration-700">
                      <div className="mb-6 opacity-100 filter drop-shadow-lg"><BrandLogo size="xl" variant="icon" /></div>
                      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-8 tracking-tight">Trợ lý {tenant?.name || 'Advisor'}</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg px-6">
                          {dynamicQuickPrompts.map((p, i) => (
                              <button key={i} onClick={() => onSendMessage(p)} className="px-5 py-4 bg-white/80 backdrop-blur-sm border border-slate-200/60 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 rounded-2xl text-left text-[13px] font-medium text-slate-600 hover:text-indigo-700 transition-all flex justify-between items-center group active:scale-[0.98]">
                                  {p} <ArrowUp size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0"/>
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              {messages.map((msg, i) => (
                  <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                      <div className={`flex gap-3 max-w-full md:max-w-3xl w-full group ${msg.role === 'user' ? 'flex-row-reverse px-2 md:px-0' : 'flex-row px-2 md:px-0'}`}>
                          {msg.role === 'model' && (<div className="flex-shrink-0 mt-1"><div className="w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm border border-slate-100 p-1.5 flex items-center justify-center"><BrandLogo variant="icon" size="sm" /></div></div>)}
                          <div className={`flex flex-col ${msg.role === 'user' ? 'items-end max-w-[85%]' : 'items-start w-full'}`}>
                              <div className={`text-[15px] leading-relaxed relative shadow-sm transition-all ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white px-5 py-3 rounded-[20px] rounded-br-sm' : 'bg-white border border-slate-100 text-slate-700 px-5 py-4 rounded-[20px] rounded-tl-sm w-full shadow-sm hover:shadow-md'}`}>
                                  {msg.image && <img src={msg.image} className="mb-3 rounded-xl max-h-64 object-cover border border-white/20" />}
                                  
                                  {/* RENDER THE REAL TRACE LOG WITH SEMANTIC BADGES */}
                                  {msg.role === 'model' && msg.reasoningSteps && msg.reasoningSteps.length > 0 && (
                                      <IntelligenceTrace steps={msg.reasoningSteps} duration={msg.thinkingTime} />
                                  )}
                                  
                                  {/* Cleaned text rendering */}
                                  {msg.text && (<div className={`prose max-w-none ${msg.role === 'user' ? 'prose-invert prose-p:text-indigo-50' : 'prose-slate prose-p:text-slate-800'} prose-p:my-1 prose-headings:font-bold prose-strong:font-bold prose-ul:my-2 prose-li:my-0.5`}><ReactMarkdown>{cleanText(msg.text)}</ReactMarkdown></div>)}
                              </div>
                              {msg.toolPayload && (
                                  <div className="w-full">
                                      <GenerativeWidget 
                                          type={msg.toolPayload.type} 
                                          data={msg.toolPayload.data} 
                                          onLeadCapture={onLeadCapture} 
                                          onSendMessage={onSendMessage} 
                                          tenant={tenant}
                                          onUpgradeRequest={onUpgradeRequest}
                                      />
                                  </div>
                              )}
                              {msg.role === 'model' && msg.text && (<MessageActions text={cleanText(msg.text)} />)}
                          </div>
                      </div>
                  </div>
              ))}
              
              {isLiveActive && (
                  <div className="flex justify-center w-full sticky bottom-4 z-20 pointer-events-none">
                      <div className="bg-slate-900/90 backdrop-blur text-white px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl animate-in slide-in-from-bottom-4 border border-slate-700 pointer-events-auto">
                          <div className="flex gap-1 h-4 items-center">
                              {[1,2,3,4,5,6].map(i => (
                                  <div key={i} className="w-1 bg-emerald-400 rounded-full transition-all duration-75" style={{height: `${Math.max(4, Math.min(24, volumeLevel * (Math.random() + 0.5) * 0.5))}px`}}></div>
                              ))}
                          </div>
                          <div className="flex flex-col">
                              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Đang nghe...</span>
                              <span className="text-[10px] text-slate-400">Chế độ rảnh tay (Hands-free)</span>
                          </div>
                          <button onClick={stopLiveSession} className="p-2 bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-slate-300 rounded-full transition-colors ml-2"><Square size={14} fill="currentColor"/></button>
                      </div>
                  </div>
              )}

              {isLoading && (
                  <div className="flex w-full justify-start pl-12 md:pl-12">
                      {isThinkingMode ? (
                          <ThinkingStream inputContext={lastUserQuery} focus={tenant?.aiConfig?.focus} liveLogs={liveReasoning} />
                      ) : (
                          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2 animate-pulse">
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>

      {showScrollDown && (<button onClick={manualScrollToBottom} className="absolute bottom-28 right-4 md:right-[calc(50%-380px)] z-20 w-9 h-9 bg-white border border-slate-200 text-slate-500 rounded-full shadow-xl flex items-center justify-center hover:bg-slate-50 hover:text-indigo-600 transition-all animate-in zoom-in-95"><ChevronDown size={18} /></button>)}

      {/* 3. INPUT BAR */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-3 md:px-0 pb-safe pt-4 bg-white/80 border-t border-slate-100/50 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
          <div className="max-w-3xl mx-auto relative pb-2 md:pb-6">
              {previewUrl && (<div className="absolute -top-16 left-4 animate-in slide-in-from-bottom-2"><div className="relative group"><img src={previewUrl} className="h-14 w-14 rounded-xl object-cover border-2 border-white shadow-md" /><button onClick={() => {setSelectedImage(null); setPreviewUrl(null);}} className="absolute -top-2 -right-2 bg-slate-900 text-white p-1 rounded-full shadow hover:bg-red-500 transition-colors"><X size={10}/></button></div></div>)}
              <div className={`bg-white/50 rounded-[32px] shadow-lg shadow-slate-200/50 border border-slate-200 p-1.5 flex items-center gap-2 transition-all duration-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 focus-within:shadow-xl ${isLoading ? 'opacity-80' : ''}`}>
                  <div className="flex items-center gap-1 pl-1">
                      <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors active:scale-95 shrink-0" title="Gửi ảnh"><ImageIcon size={20} strokeWidth={2}/></button>
                      <button 
                        onClick={isLiveActive ? stopLiveSession : startLiveSession} 
                        disabled={isLiveConnecting} 
                        className={`p-2 rounded-full transition-all active:scale-95 shrink-0 ${isLiveActive ? 'bg-red-50 text-red-500 animate-pulse' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`} 
                        title="Trò Chuyện Giọng Nói"
                      >
                        {isLiveConnecting ? <Loader2 size={20} className="animate-spin" /> : (isLiveActive ? <Volume2 size={20} className="animate-pulse" /> : <Mic size={20} strokeWidth={2} />)}
                      </button>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setSelectedImage(file); setPreviewUrl(URL.createObjectURL(file)); } }} />
                  <div className="h-5 w-px bg-slate-200 mx-1"></div>
                  <input className="flex-1 py-3 bg-transparent outline-none text-[15px] font-medium placeholder:text-slate-400 text-slate-900 min-w-0" placeholder={isLoading ? "AI đang suy luận..." : "Hỏi về giá, pháp lý, dòng tiền..."} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} disabled={isLoading}/>
                  {isLoading ? (
                      <button className="p-2.5 bg-slate-100 text-slate-500 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors" title="Dừng lại">
                          <Square size={16} fill="currentColor"/>
                      </button>
                  ) : (
                      <button onClick={handleSubmit} disabled={!input.trim() && !selectedImage} className="p-2.5 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 hover:shadow-indigo-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100 shrink-0">
                          <ArrowUp size={20} strokeWidth={3}/>
                      </button>
                  )}
              </div>
              <div className="text-center mt-2 opacity-0 hover:opacity-100 transition-opacity duration-500 flex justify-center items-center gap-2 hidden md:flex"><Sparkles size={12} className="text-indigo-400"/><p className="text-[10px] text-slate-400 font-medium">Phát triển bởi Advisor Core 7.0 (Source Attribution)</p></div>
          </div>
      </div>
      <ProjectDetailPanel project={viewingProject} onClose={() => setViewingProject(null)} />
    </div>
  );
};

export default ChatWindow;
