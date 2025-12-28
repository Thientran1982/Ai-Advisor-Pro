
import React, { useState, useEffect, useCallback } from 'react';
import { TenantProfile, Lead } from './types';
import { authService, DEMO_TENANT } from './services/authService';
import { dataService } from './services/dataService';
import { useAIAdvisor } from './hooks/useAIAdvisor';

// ICONS
import { 
    LayoutDashboard, LogOut, Megaphone, 
    Settings as SettingsIcon, ChevronLeft, ChevronRight, Menu, Database,
    Calendar, Bell
} from 'lucide-react';

// COMPONENTS
import LandingPage from './components/client/LandingPage';
import ChatWindow from './components/client/ChatWindow';
import AgentProfilePage from './components/client/AgentProfilePage'; 
import LeadDashboard from './components/agent/LeadDashboard';
import CampaignDashboard from './components/agent/CampaignDashboard';
import KnowledgeBase from './components/agent/KnowledgeBase';
import SchedulePage from './components/agent/SchedulePage'; 
import NotificationCenter from './components/agent/NotificationCenter'; 
import AgentConfigPanel from './components/agent/AgentSettings'; 
import OnboardingModal from './components/core/OnboardingModal';
import AuthModal from './components/auth/AuthModal';
import LegalModals from './components/core/LegalModals';
import ProFeatureGateway from './components/tools/ProFeatureGateway';
import BrandLogo from './components/common/BrandLogo';

const App: React.FC = () => {
  // --- GLOBAL STATE ---
  const [session, setSession] = useState<TenantProfile | null>(null);
  const [view, setView] = useState<'landing' | 'profile' | 'client' | 'agent'>('landing');
  const [targetProject, setTargetProject] = useState<string | null>(null);
  const [trafficSource, setTrafficSource] = useState<string>('direct');
  
  // --- AGENT STATE ---
  const [agentView, setAgentView] = useState<'dashboard' | 'schedule' | 'campaigns' | 'knowledge' | 'notifications' | 'settings'>('dashboard');
  const [settingsInitialTab, setSettingsInitialTab] = useState<'profile' | 'projects' | 'billing'>('profile'); 
  const [leads, setLeads] = useState<Lead[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newLeadAlert, setNewLeadAlert] = useState<string | null>(null);

  // --- UI STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
      if (typeof window === 'undefined') return true;
      if (window.innerWidth < 1024) return false; 
      return localStorage.getItem('advisor_sidebar_state') !== 'closed';
  });
  const [proModalOpen, setProModalOpen] = useState(false);
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register'; plan: 'free' | 'pro' }>({ isOpen: false, mode: 'login', plan: 'free' });

  // --- AI HOOK INTEGRATION ---
  const { 
      messages, setMessages, isLoading, isDeepReasoning, showMemoryToast, 
      handleSendMessage, setIsDeepReasoning, setLiveReasoning, liveReasoning
  } = useAIAdvisor({ session, targetProject, trafficSource, leads });

  // --- INITIALIZATION ---
  useEffect(() => {
    const user = authService.getCurrentUser();
    const params = new URLSearchParams(window.location.search);
    const projectParam = params.get('project');
    const sourceParam = params.get('utm_source') || params.get('source');
    
    setTrafficSource(sourceParam || 'direct');

    if (projectParam) {
        setTargetProject(projectParam);
        setSession(DEMO_TENANT);
        setView('client');
    } else if (user) {
        setSession(user);
        setView('agent'); 
    } else {
        setView('landing');
    }
    
    dataService.initializeMarketData();
  }, []);

  useEffect(() => {
    if (!session) return;
    const syncData = () => {
        setLeads(dataService.getLeadsByTenant(session.id));
        const notes = dataService.getNotifications();
        setUnreadCount(notes.filter(n => !n.read).length);
    };
    syncData(); 
    window.addEventListener('storage', syncData);
    return () => window.removeEventListener('storage', syncData);
  }, [session?.id]);

  // --- HANDLERS ---
  const handleExplicitLeadCapture = useCallback((data: { phone?: string, email?: string, name?: string, note?: string }) => {
      if (!session) return;
      const newLead: Lead = {
          id: `L-EXP-${Date.now()}`,
          tenantId: session.id,
          name: data.name || "Khách để lại thông tin",
          phone: data.phone || "Chưa cung cấp",
          needs: `${data.note || 'Khách yêu cầu tư vấn.'} ${data.email ? `| Email: ${data.email}` : ''}`, 
          projectInterest: targetProject || "Quan tâm chung",
          status: 'new', budget: 'Đang xác định', priority: 'urgent', userType: 'individual', purpose: 'đầu tư',
          source: trafficSource, createdAt: new Date()
      };
      dataService.addLead(newLead);
      dataService.addNotification({
          id: `notif_exp_${Date.now()}`, type: 'lead', title: '🔥 KHÁCH MỚI', message: `Thông tin: ${data.phone || data.email}`, time: new Date(), read: false
      });
      setNewLeadAlert(`ĐÃ LƯU: ${data.phone || data.email}`);
      setTimeout(() => setNewLeadAlert(null), 6000);
  }, [session, targetProject, trafficSource]);

  const toggleSidebar = () => {
      setIsSidebarOpen(prev => {
          localStorage.setItem('advisor_sidebar_state', !prev ? 'open' : 'closed');
          return !prev;
      });
  };

  const NavItem = ({ id, icon: Icon, label, active, badge }: { id: typeof agentView, icon: any, label: string, active: boolean, badge?: number }) => {
      const isExpanded = isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024);
      return (
        <button 
            onClick={() => { setAgentView(id); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
            className={`group flex items-center gap-3 p-3.5 rounded-xl transition-all w-full mb-1 ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${!isExpanded ? 'justify-center' : 'px-4'}`}
            title={!isExpanded ? label : undefined}
        >
            <Icon size={22} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
            <div className={`overflow-hidden transition-all ${isExpanded ? 'max-w-[200px] opacity-100 ml-1' : 'max-w-0 opacity-0 ml-0'}`}>
                <span className="text-sm font-bold whitespace-nowrap">{label}</span>
            </div>
            {badge && badge > 0 && isExpanded && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{badge}</span>}
        </button>
      );
  };

  const renderContent = () => {
      if (view === 'landing') return <LandingPage onLogin={() => setAuthModal({ isOpen: true, mode: 'login', plan: 'free' })} onRegister={(plan) => setAuthModal({ isOpen: true, mode: 'register', plan })} onTryDemo={() => { setSession(DEMO_TENANT); setView('profile'); }} onOpenLegal={setLegalType} />;
      if (view === 'profile' && session) return <AgentProfilePage agent={session} onStartChat={() => setView('client')} onSignUp={() => setAuthModal({ isOpen: true, mode: 'register', plan: 'free' })} onBackToLanding={() => { if (session.id === 'demo_agent') setSession(null); setView('landing'); }} />;
      if (view === 'client') return (
        <div className="h-full flex flex-col bg-white relative animate-in fade-in duration-500">
          <div className="flex-1 flex flex-col relative z-10 h-full bg-white">
            <ChatWindow messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} tenant={session} initialProject={targetProject} onLeadCapture={handleExplicitLeadCapture} onClearChat={() => {setMessages([]); setLiveReasoning([]); }} onSwitchToAgent={() => setView('agent')} isThinkingMode={isDeepReasoning} showMemoryToast={showMemoryToast} />
          </div>
          <ProFeatureGateway isOpen={proModalOpen} onClose={() => setProModalOpen(false)} userSubscription={session?.subscription || 'free'} onUpgrade={() => { setProModalOpen(false); if (!session || session.id === 'demo_agent') setAuthModal({ isOpen: true, mode: 'register', plan: 'pro' }); else { setView('agent'); setAgentView('settings'); setSettingsInitialTab('billing'); } }} onExecute={(tool, prompt) => handleSendMessage(prompt)} />
        </div>
      );

      return (
        <div className="h-full flex bg-[#0F172A] overflow-hidden animate-in fade-in duration-500 relative">
            {isSidebarOpen && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden" onClick={() => setIsSidebarOpen(false)}/>)}
            <aside className={`fixed inset-y-0 left-0 z-[50] bg-[#0F172A] flex flex-col py-6 gap-6 border-r border-slate-800 transition-all duration-300 ease-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'w-[280px] translate-x-0 shadow-2xl' : 'w-[280px] -translate-x-full lg:w-[88px] lg:translate-x-0'}`}>
                <button onClick={toggleSidebar} className="absolute -right-3 top-10 w-6 h-6 bg-[#0F172A] hover:bg-indigo-50 text-slate-400 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all z-50 border border-slate-700 group hidden lg:flex"><ChevronLeft size={12} strokeWidth={3} className={isSidebarOpen ? "" : "rotate-180"}/></button>
                <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white lg:hidden"><ChevronLeft size={24} /></button>
                <div className={`flex items-center px-5 transition-all duration-300 cursor-pointer ${!isSidebarOpen && window.innerWidth >= 1024 ? 'justify-center' : ''}`} onClick={() => setView('client')}><BrandLogo variant={(isSidebarOpen || window.innerWidth < 1024) ? 'full' : 'icon'} size="md" lightMode /></div>
                <div className="flex flex-col gap-2 w-full px-4 mt-6">
                    <NavItem id="dashboard" icon={LayoutDashboard} label="Tổng quan" active={agentView === 'dashboard'} />
                    <NavItem id="schedule" icon={Calendar} label="Lịch trình" active={agentView === 'schedule'} />
                    <NavItem id="campaigns" icon={Megaphone} label="Chiến dịch" active={agentView === 'campaigns'} />
                    <NavItem id="knowledge" icon={Database} label="Kho dữ liệu" active={agentView === 'knowledge'} />
                    <NavItem id="notifications" icon={Bell} label="Thông báo" active={agentView === 'notifications'} badge={unreadCount} />
                    <NavItem id="settings" icon={SettingsIcon} label="Cài đặt" active={agentView === 'settings'} />
                </div>
                <div className="mt-auto flex flex-col gap-4 w-full px-4">
                    <button onClick={() => { authService.logout(); setSession(null); setMessages([]); setView('landing'); }} className={`group flex items-center gap-3 p-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all relative ${!isSidebarOpen && window.innerWidth >= 1024 ? 'justify-center' : ''}`}><LogOut size={20} className="shrink-0" /><div className={`overflow-hidden transition-all ${isSidebarOpen || window.innerWidth < 1024 ? 'max-w-[200px] opacity-100 ml-1' : 'max-w-0 opacity-0 ml-0'}`}><span className="text-sm font-medium whitespace-nowrap">Đăng xuất</span></div></button>
                    <div className={`flex items-center gap-3 p-2 rounded-xl transition-all overflow-hidden ${(isSidebarOpen || window.innerWidth < 1024) ? 'bg-white/5 border border-white/5' : 'justify-center'}`}><div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-600 shrink-0"><img src={session?.avatar || "https://ui-avatars.com/api/?name=User"} className="w-full h-full object-cover" alt="Profile"/></div><div className={`overflow-hidden transition-all ${isSidebarOpen || window.innerWidth < 1024 ? 'max-w-[150px] opacity-100' : 'max-w-0 opacity-0 absolute'}`}><p className="text-slate-200 text-xs font-bold truncate">{session?.name || 'Agent'}</p><p className="text-slate-500 text-[10px] font-medium truncate">{session?.subscription === 'pro_agent' ? 'Gói Pro' : 'Miễn phí'}</p></div></div>
                </div>
            </aside>
            <main className="flex-1 min-h-0 overflow-hidden relative bg-[#F8FAFC] lg:rounded-[32px] lg:my-2 lg:mr-2 border-l lg:border border-slate-200/50 shadow-2xl transition-all duration-500 flex flex-col w-full">
                <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm shrink-0 h-16">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl active:scale-95 transition-all shadow-sm border border-slate-100"><Menu size={22} strokeWidth={2.5} /></button>
                    <div className="flex flex-col items-center"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bảng điều khiển</span><h2 className="text-sm font-black text-slate-900 capitalize">Quản trị</h2></div>
                    <div className="w-9 h-9 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setAgentView('settings')}><div className="w-full h-full rounded-lg bg-slate-100 border border-slate-200 overflow-hidden"><img src={session?.avatar} alt="User" className="w-full h-full object-cover" /></div></div>
                </div>
                <div className="flex-1 overflow-hidden relative">
                    {agentView === 'dashboard' && <LeadDashboard leads={leads} onAddLead={(l) => dataService.addLead(l)} onUpdateLead={(id, s) => dataService.updateLeadStatus(id, s)} onDeleteLead={(id) => dataService.deleteLead(id)} onSimulateClientView={() => setView('profile')} onNavigate={(view) => setAgentView(view)} />}
                    {agentView === 'schedule' && <SchedulePage />}
                    {agentView === 'campaigns' && <CampaignDashboard />}
                    {agentView === 'knowledge' && <KnowledgeBase />}
                    {agentView === 'notifications' && <NotificationCenter />}
                    {agentView === 'settings' && session && <AgentConfigPanel tenant={session} initialTab={settingsInitialTab} onUpdate={(updated) => { setSession(updated); authService.updateProfile(updated); }} onNavigateToProfile={() => setView('profile')} />}
                </div>
            </main>
        </div>
      );
  };

  return (
    <div className={`font-sans antialiased text-slate-900 bg-[#F8FAFC] selection:bg-indigo-500/30 selection:text-indigo-900 relative ${view === 'landing' ? 'min-h-screen' : 'h-[100dvh] overflow-hidden'}`}>
      {newLeadAlert && (<div onClick={() => { setView('agent'); setAgentView('dashboard'); }} className="fixed top-6 right-6 z-[100] bg-slate-900 text-white pl-4 pr-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top duration-500 cursor-pointer hover:scale-105 transition-transform border border-slate-800"><span className="relative flex h-2.5 w-2.5 shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span><div><h4 className="font-bold text-xs tracking-wide text-slate-200">AI DETECTED</h4><p className="text-sm font-semibold">{newLeadAlert}</p></div></div>)}
      {showOnboarding && session && <OnboardingModal user={session} onComplete={(data) => { authService.updateProfile(data); setSession({...session, ...data}); setShowOnboarding(false); }} />}
      {renderContent()}
      <LegalModals type={legalType} onClose={() => setLegalType(null)} />
      <AuthModal isOpen={authModal.isOpen} onClose={() => setAuthModal({...authModal, isOpen: false})} onLoginSuccess={(user) => { setSession(user); if(authModal.mode==='register'){setShowOnboarding(true); setView('agent');} else setView('agent'); }} initialMode={authModal.mode} initialPlan={authModal.plan} />
    </div>
  );
};

export default App;
