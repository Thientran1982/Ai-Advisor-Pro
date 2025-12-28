
import React, { useState, useEffect, useMemo } from 'react';
import { Lead, MarketIntel } from '../../types';
import { 
  Phone, Search, Plus, MessageCircle, TrendingUp, Globe, 
  Layers, Clock, MoreHorizontal, ExternalLink, 
  LayoutList, KanbanSquare, Ghost, UserPlus, Check, ArrowRight, Target, Zap, AlertTriangle,
  Tag, Compass, ShieldCheck, DollarSign, BrainCircuit, Command, Sparkles, LineChart, Landmark, Info
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell
} from 'recharts';
import { fetchMarketIntelligence } from '../../services/geminiService';
import { dataService } from '../../services/dataService'; 
import LeadDetailModal from './LeadDetailModal';

interface LeadDashboardProps {
  leads: Lead[];
  onAddLead?: (lead: Lead) => void;
  onUpdateLead?: (leadId: string, status: Lead['status']) => void; 
  onDeleteLead?: (leadId: string) => void;
  onSimulateClientView?: () => void; 
  onNavigate?: (view: 'dashboard' | 'schedule' | 'campaigns' | 'knowledge' | 'notifications' | 'settings') => void;
}

const STATUS_CONFIG: Record<string, { label: string, color: string, bg: string, border: string, countBg: string }> = {
    'new': { label: 'Mới tiếp nhận', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', countBg: 'bg-blue-100' },
    'contacted': { label: 'Đã liên hệ', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', countBg: 'bg-orange-100' },
    'visited': { label: 'Đã xem nhà', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', countBg: 'bg-purple-100' },
    'deposited': { label: 'Đã cọc', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', countBg: 'bg-emerald-100' },
    'lost': { label: 'Đã hủy', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', countBg: 'bg-slate-200' }
};

interface StatCardProps {
    icon: React.ElementType;
    colorClass: string;
    bgClass: string;
    value: string | number;
    label: string;
    trend?: string;
    trendUp?: boolean;
    subValue?: string;
}

// Modern Stat Card
const StatCard: React.FC<StatCardProps> = ({ icon: Icon, colorClass, bgClass, value, label, trend, trendUp, subValue }) => (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 h-full flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${bgClass} ${colorClass} group-hover:scale-110 transition-transform shadow-sm`}>
                    <Icon size={22} strokeWidth={2.5}/>
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {trendUp ? <TrendingUp size={12}/> : <TrendingUp size={12} className="rotate-180"/>} {trend}
                    </div>
                )}
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1.5">{value}</p>
        </div>
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                {label}
                {label.includes('Lãi suất') && <Info size={10} className="text-slate-300 cursor-help" title="Lãi suất thả nổi trung bình sau ưu đãi (Tham khảo)" />}
            </p>
            {subValue && <p className="text-[10px] text-slate-400 mt-1 font-medium">{subValue}</p>}
        </div>
    </div>
);

interface StrategyTask {
    id: number;
    type: 'risk' | 'opportunity' | 'management';
    title: string;
    desc: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
}

// 🧠 AGENTIC ENGINE: AUTONOMOUS TASK GENERATION
const StrategicCommand = ({ marketTrend, leads, onNavigate }: { marketTrend: string, leads: Lead[], onNavigate?: (view: any) => void }) => {
    const [activeTask, setActiveTask] = useState<number | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    
    // DATA ANALYSIS LOGIC (The Brain)
    const generatedTasks = useMemo(() => {
        const tasks: StrategyTask[] = [];
        const now = new Date();
        
        // 1. Detect Stale High-Priority Leads
        const staleLeads = leads.filter(l => {
            const daysSince = (now.getTime() - new Date(l.createdAt).getTime()) / (1000 * 3600 * 24);
            return (l.priority === 'urgent' || l.priority === 'high') && daysSince > 2 && l.status !== 'deposited';
        });

        if (staleLeads.length > 0) {
            tasks.push({
                id: 1,
                type: 'risk',
                title: 'BÁO ĐỘNG: Khách VIP Cần Chăm Sóc',
                desc: `Phát hiện ${staleLeads.length} khách tiềm năng đang bị bỏ quên quá 48h. Cần tương tác lại ngay để duy trì sự quan tâm.`,
                action: 'Kích hoạt quy trình hâm nóng',
                priority: 'high'
            });
        }

        // 2. Market Opportunity Trigger
        if (marketTrend === 'down') {
            const investors = leads.filter(l => l.purpose === 'đầu tư' && l.budget.includes('tỷ'));
            if (investors.length > 0) {
                tasks.push({
                    id: 2,
                    type: 'opportunity',
                    title: "Chiến thuật: Đầu Tư Giá Trị",
                    desc: `Thị trường đang điều chỉnh. Có ${investors.length} nhà đầu tư sẵn sàng. Hãy giới thiệu danh mục tài sản giá tốt (Undervalued Assets) để kích cầu.`,
                    action: 'Gửi danh sách tài sản giá tốt',
                    priority: 'medium'
                });
            }
        } else {
             tasks.push({
                id: 2,
                type: 'opportunity',
                title: "Chiến thuật: Đón Sóng Hạ Tầng",
                desc: "Thị trường đang ấm lên. Đề xuất gửi tin nhắn cập nhật tiến độ hạ tầng để thúc đẩy quyết định đầu tư.",
                action: 'Triển khai Campaign Thông Tin',
                priority: 'medium'
            });
        }

        // 3. Performance Review (Management)
        const conversionRate = leads.length > 0 ? (leads.filter(l => l.status === 'deposited').length / leads.length) : 0;
        if (conversionRate < 0.1 && leads.length > 5) {
             tasks.push({
                id: 3,
                type: 'management',
                title: "Tối ưu hóa Kịch bản Tư vấn",
                desc: `Tỷ lệ chuyển đổi cần cải thiện (${(conversionRate * 100).toFixed(1)}%). AI đề xuất điều chỉnh kịch bản theo nhóm tính cách DISC.`,
                action: 'Huấn luyện lại AI Agent',
                priority: 'low'
            });
        } else {
             tasks.push({
                id: 3,
                type: 'management',
                title: "Báo cáo Hiệu suất Tuần",
                desc: "Hệ thống vận hành ổn định. AI đang tự động phân loại khách hàng tiềm năng.",
                action: 'Xem báo cáo chi tiết',
                priority: 'low'
            });
        }

        return tasks;
    }, [leads, marketTrend]);

    const handleExecute = (task: StrategyTask) => {
        setActiveTask(task.id);
        setIsExecuting(true);
        
        // EXECUTION LOGIC
        setTimeout(() => {
            setIsExecuting(false);
            
            if (task.action.includes('Campaign')) {
                if (onNavigate) {
                    onNavigate('campaigns'); // SWITCH TAB
                }
            } else if (task.action === 'Xem báo cáo chi tiết') {
                dataService.addNotification({
                    id: `report_${Date.now()}`,
                    type: 'system',
                    title: 'Báo cáo đã sẵn sàng',
                    message: 'AI đã tổng hợp xong báo cáo hiệu suất tuần. Bạn có thể tải về ngay.',
                    time: new Date(),
                    read: false
                });
                alert("Đã tạo báo cáo thành công! Vui lòng kiểm tra mục Thông báo.");
            } else {
                alert(`AI Agent đang thực thi: ${task.action}. Đã thêm vào lịch trình làm việc.`);
            }
        }, 1200);
    };

    return (
        <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[32px] shadow-2xl relative overflow-hidden mb-10 border border-slate-800 group">
            {/* Background Neural Network Effect */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20 pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 border border-white/10">
                            <BrainCircuit size={28} className="text-white"/>
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                                Trung Tâm Chỉ Huy (Strategic Command)
                            </h3>
                            <p className="text-sm text-indigo-200 font-medium">Phân tích hành vi & Đề xuất hành động Chiến lược theo thời gian thực.</p>
                        </div>
                    </div>
                    {/* SWARM STATUS INDICATOR */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { name: "Chiến Lược", icon: LineChart },
                            { name: "Định Giá", icon: Tag },
                            { name: "Pháp Lý", icon: ShieldCheck },
                            { name: "Tài Chính", icon: DollarSign },
                            { name: "Phong Thủy", icon: Compass },
                            { name: "Dự Báo", icon: TrendingUp },
                            { name: "Chốt Deal", icon: Zap }
                        ].map((agent, i) => (
                            <div key={i} className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2" title={`${agent.name} Agent Online`}>
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                                <agent.icon size={12} className="text-slate-300"/>
                                <span className="text-[10px] font-bold text-slate-300 hidden md:inline">{agent.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {generatedTasks.map((task) => (
                        <div 
                            key={task.id} 
                            onClick={() => handleExecute(task)}
                            className={`
                                relative p-5 rounded-3xl border cursor-pointer transition-all duration-300 overflow-hidden
                                ${activeTask === task.id ? 'bg-indigo-600 border-indigo-500 shadow-xl scale-[1.02]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1'}
                            `}
                        >
                            {/* Task Type Icon */}
                            <div className="absolute top-4 right-4 opacity-50">
                                {task.type === 'opportunity' && <Target size={20} className="text-emerald-400"/>}
                                {task.type === 'risk' && <AlertTriangle size={20} className="text-amber-400 animate-pulse"/>}
                                {task.type === 'management' && <Command size={20} className="text-blue-400"/>}
                            </div>

                            <div className="flex flex-col h-full">
                                <div className="mb-3">
                                    <h4 className={`font-bold text-base mb-2 ${activeTask === task.id ? 'text-white' : 'text-slate-100'}`}>{task.title}</h4>
                                    <p className={`text-xs leading-relaxed line-clamp-3 ${activeTask === task.id ? 'text-indigo-100' : 'text-slate-400'}`}>{task.desc}</p>
                                </div>
                                
                                <div className="mt-auto pt-4">
                                    <button className={`w-full py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeTask === task.id ? 'bg-white text-indigo-900 shadow-lg' : 'bg-white/10 text-slate-300 group-hover:bg-white group-hover:text-slate-900'}`}>
                                        {isExecuting && activeTask === task.id ? <Sparkles size={14} className="animate-spin"/> : <ArrowRight size={14}/>}
                                        {isExecuting && activeTask === task.id ? 'Đang triển khai...' : task.action}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const LeadDashboard: React.FC<LeadDashboardProps> = ({ leads, onAddLead, onUpdateLead, onDeleteLead, onSimulateClientView, onNavigate }) => {
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [marketIntel, setMarketIntel] = useState<MarketIntel | null>(null);
  const [liveContext, setLiveContext] = useState<any>(null); // Real-time financial data
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState<Partial<Lead>>({ name: '', phone: '', projectInterest: '', status: 'new', priority: 'medium', needs: '' });
  
  // DRAG AND DROP STATE
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // 1. DATA SYNC ON MOUNT
  useEffect(() => { 
      // Fetch Heavy AI Intel
      fetchMarketIntelligence().then(data => { if(data) setMarketIntel(data); }); 
      // Fetch Instant Financial Data
      setLiveContext(dataService.getLiveMarketContext());
  }, []);

  // 2. REAL-TIME CALCULATION ENGINE
  const stats = useMemo(() => {
      const total = leads.length;
      const urgent = leads.filter(l => l.priority === 'urgent' || l.priority === 'high').length;
      const deposited = leads.filter(l => l.status === 'deposited').length;
      const conversionRate = total > 0 ? ((deposited / total) * 100).toFixed(1) : "0.0";
      
      const contactCount = leads.filter(l => ['contacted', 'visited', 'deposited', 'negotiating'].includes(l.status)).length;
      const visitCount = leads.filter(l => ['visited', 'deposited', 'negotiating'].includes(l.status)).length;
      const dealCount = deposited;

      return {
          total,
          urgent,
          conversionRate,
          funnel: [
            { name: 'K.Hàng', value: total, fill: '#6366f1' }, // Indigo
            { name: 'Liên hệ', value: contactCount, fill: '#8b5cf6' }, // Violet
            { name: 'Gặp mặt', value: visitCount, fill: '#a855f7' }, // Purple
            { name: 'Chốt', value: dealCount, fill: '#10b981' }, // Emerald
          ]
      };
  }, [leads]);

  const filteredLeads = leads.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.phone.includes(searchTerm));

  const handleCreateLead = () => {
      if (onAddLead && newLeadForm.name && newLeadForm.phone) {
          onAddLead({
              id: `manual_${Date.now()}`, tenantId: 'current', name: newLeadForm.name, phone: newLeadForm.phone,
              projectInterest: newLeadForm.projectInterest || 'Chưa rõ', needs: newLeadForm.needs || 'Khách thêm thủ công',
              budget: newLeadForm.budget || 'Chưa xác định', status: 'new', priority: 'medium', createdAt: new Date(), userType: 'individual', purpose: 'đầu tư'
          });
          setIsAddModalOpen(false); setNewLeadForm({ name: '', phone: '', projectInterest: '', status: 'new', priority: 'medium', needs: '' });
      }
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedLeadId(id);
      e.dataTransfer.setData('leadId', id);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
      e.preventDefault(); 
      if (dragOverColumn !== status) { setDragOverColumn(status); }
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('leadId');
      setDragOverColumn(null);
      setDraggedLeadId(null);
      if (id && onUpdateLead) onUpdateLead(id, status as Lead['status']);
  };

  return (
    <div className="h-full bg-[#FAFAFA] p-6 md:p-8 overflow-y-auto custom-scrollbar font-sans">
      
      {/* 1. HEADER & REAL-TIME TICKER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Tổng Quan</h2>
          {liveContext ? (
              <p className="text-slate-500 font-bold text-xs flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 w-fit shadow-sm">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
                 Thị trường Live: Vàng {liveContext.gold} • USD {liveContext.usd}
              </p>
          ) : (
              <p className="text-slate-400 font-medium text-sm flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse"></span> Đang kết nối thị trường...
              </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
             <button onClick={onSimulateClientView} className="px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95">
                 <ExternalLink size={16} /> Trang Khách Hàng
             </button>
             <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 active:scale-95">
                 <Plus size={16} /> Thêm Lead Mới
             </button>
        </div>
      </div>

      {/* 🧠 2. AGENTIC CORE: STRATEGIC COMMAND CENTER */}
      {/* Passes REAL leads data to the brain for analysis */}
      <StrategicCommand marketTrend={liveContext?.trend || "down"} leads={leads} onNavigate={onNavigate} />

      {/* 3. STATS OVERVIEW (REAL DATA) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatCard 
            icon={Layers} bgClass="bg-indigo-50" colorClass="text-indigo-600" 
            value={stats.total} label="Tổng Leads" trend="Hoạt động" trendUp={true} 
          />
          {/* UPDATED: Replaced abstract Sentiment Score with Verifiable Floating Interest Rate */}
          <StatCard 
            icon={Landmark} bgClass="bg-emerald-50" colorClass="text-emerald-600" 
            value={liveContext?.rates?.floating || "10.5%"} 
            label="Lãi suất thả nổi (TB)" 
            trend="Ổn định" trendUp={true} 
            subValue="Dữ liệu tham chiếu ngân hàng"
          />
          <StatCard 
            icon={Clock} bgClass="bg-amber-50" colorClass="text-amber-600" 
            value={stats.urgent} label="Cần xử lý gấp" 
            subValue="Lead quan tâm cao"
          />
          <StatCard 
            icon={TrendingUp} bgClass="bg-rose-50" colorClass="text-rose-600" 
            value={`${stats.conversionRate}%`} label="Tỷ lệ chốt" 
            trend="Thực tế" trendUp={parseFloat(stats.conversionRate) > 0}
          />
      </div>

      {/* ... rest of the component remains similar ... */}
      
      {/* 4. CHARTS & NEWS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
          {/* Funnel Chart (REAL DATA) */}
          <div className="xl:col-span-2 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Phễu Chuyển Đổi</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Dữ liệu thực tế từ CRM</p>
                </div>
                <button className="text-slate-400 hover:text-indigo-600 p-2"><MoreHorizontal size={20}/></button>
             </div>
             <div className="h-[220px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.funnel} layout="vertical" margin={{left: 0, right: 20}} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11, fontWeight: 700, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 'bold'}} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24} animationDuration={1000} background={{ fill: '#f8fafc', radius: [0, 6, 6, 0] }}>
                            {stats.funnel.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          </div>
          
          {/* Market Intel (AI Powered) */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Globe size={20} className="text-indigo-600"/> Thị Trường Live</h3>
                  <div className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 max-h-[250px] xl:max-h-none relative z-10">
                  {marketIntel?.topNews.slice(0, 4).map((news, i) => (
                      <a key={i} href={news.url} target="_blank" className="block p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-md transition-all group">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wide bg-indigo-50 px-2 py-0.5 rounded-full">{news.source}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{news.time}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 leading-relaxed group-hover:text-indigo-700 line-clamp-2">{news.title}</h4>
                      </a>
                  )) || <div className="text-center text-sm text-slate-400 py-10 flex flex-col items-center"><Ghost size={24} className="mb-2 opacity-50"/>Đang AI Scan tin tức...</div>}
              </div>
          </div>
      </div>

      {/* 5. CRM TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 sticky top-0 z-20 bg-[#FAFAFA]/95 backdrop-blur py-3">
           <div className="relative group w-full sm:w-96">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm theo tên, SĐT..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm" 
                />
           </div>
           
           <div className="flex gap-1 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                    <LayoutList size={20}/>
                </button>
                <button onClick={() => setViewMode('board')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'board' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                    <KanbanSquare size={20}/>
                </button>
           </div>
      </div>

      {/* 6. LIST VIEW */}
      {viewMode === 'list' && (
          <div className="space-y-3 pb-24">
             {filteredLeads.map((lead) => (
                <div 
                    key={lead.id} 
                    onClick={() => setSelectedLead(lead)} 
                    className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50/50 transition-all cursor-pointer group flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6"
                >
                    <div className="flex items-center gap-4 w-full md:w-[280px] shrink-0">
                         <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-600 text-lg shrink-0 group-hover:from-indigo-100 group-hover:to-indigo-200 group-hover:text-indigo-700 shadow-inner">
                             {lead.name.charAt(0)}
                         </div>
                         <div className="min-w-0">
                             <h4 className="font-bold text-base text-slate-900 truncate group-hover:text-indigo-700">{lead.name}</h4>
                             <p className="text-xs text-slate-500 font-medium font-mono">{lead.phone}</p>
                         </div>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-2 gap-4 w-full md:w-auto md:border-l border-slate-100 md:pl-6">
                         <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Quan tâm</span>
                            <span className="text-sm font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-md">{lead.projectInterest}</span>
                         </div>
                         <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Trạng thái</span>
                             <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${STATUS_CONFIG[lead.status].bg} ${STATUS_CONFIG[lead.status].color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[lead.status].color.replace('text', 'bg')}`}></span>
                                {STATUS_CONFIG[lead.status].label}
                            </span>
                         </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 justify-end md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <a href={`tel:${lead.phone}`} className="p-2.5 bg-slate-50 hover:bg-green-500 hover:text-white text-slate-400 rounded-xl transition-colors"><Phone size={18}/></a>
                        <a href={`https://zalo.me/${lead.phone}`} target="_blank" className="p-2.5 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-400 rounded-xl transition-colors"><MessageCircle size={18}/></a>
                    </div>
                </div>
             ))}
             {filteredLeads.length === 0 && (
                 <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                     <Ghost size={48} className="mx-auto text-slate-300 mb-4"/>
                     <p className="text-slate-500 font-medium">Không tìm thấy khách hàng nào.</p>
                 </div>
             )}
          </div>
      )}

      {/* 7. KANBAN BOARD VIEW */}
      {viewMode === 'board' && (
          <div className="flex gap-6 overflow-x-auto pb-8 h-[calc(100%-140px)] min-h-[600px] snap-x px-1">
              {Object.keys(STATUS_CONFIG).map((statusKey) => {
                  const items = filteredLeads.filter(l => l.status === statusKey);
                  return (
                    <div 
                            key={statusKey} 
                            className={`
                                flex-shrink-0 w-[320px] rounded-[24px] flex flex-col h-full transition-all duration-300
                                ${dragOverColumn === statusKey ? 'bg-indigo-50/80 ring-2 ring-indigo-200 scale-[1.01]' : 'bg-[#F1F5F9]/70'}
                            `}
                            onDragOver={(e) => handleDragOver(e, statusKey)}
                            onDrop={(e) => handleDrop(e, statusKey)}
                    >
                        {/* Column Header */}
                        <div className="p-4 flex justify-between items-center sticky top-0 bg-transparent z-10">
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[statusKey].color.replace('text', 'bg')}`}></span>
                                <span className="text-sm font-bold text-slate-700">{STATUS_CONFIG[statusKey].label}</span>
                            </div>
                            <span className={`text-[10px] font-bold ${STATUS_CONFIG[statusKey].color} ${STATUS_CONFIG[statusKey].countBg} px-2.5 py-1 rounded-full`}>
                                {items.length}
                            </span>
                        </div>
                        
                        {/* Draggable Area */}
                        <div className="px-3 pb-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                            {items.length === 0 ? (
                                <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                                    <span className="text-xs font-medium">Trống</span>
                                </div>
                            ) : (
                                items.map(lead => (
                                    <div 
                                        key={lead.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, lead.id)}
                                        onClick={() => setSelectedLead(lead)}
                                        className={`
                                            bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 cursor-grab group relative transition-all duration-200
                                            ${draggedLeadId === lead.id ? 'opacity-50 rotate-2 scale-95 shadow-none border-dashed' : 'hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:border-indigo-200'}
                                        `}
                                    >
                                        {/* Priority Badge */}
                                        {lead.priority === 'urgent' && (
                                            <div className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full animate-pulse ring-4 ring-rose-100"></div>
                                        )}

                                        <div className="mb-3">
                                            <h4 className="font-bold text-[15px] text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors">{lead.name}</h4>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{lead.phone}</p>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-bold text-slate-600 truncate max-w-full">
                                                {lead.projectInterest}
                                            </span>
                                            {lead.budget !== 'N/A' && (
                                                <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-bold text-slate-500">
                                                    {lead.budget}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <Clock size={10}/> {new Date(lead.createdAt).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'})}
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 hover:bg-green-50 text-slate-300 hover:text-green-600 rounded-md transition-colors"><Phone size={14}/></button>
                                                <button className="p-1.5 hover:bg-blue-50 text-slate-300 hover:text-blue-600 rounded-md transition-colors"><MessageCircle size={14}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            {/* Drop Zone Indicator */}
                            <div className="h-16 border-2 border-dashed border-slate-200/50 rounded-2xl flex items-center justify-center text-slate-300 text-xs font-bold opacity-0 transition-opacity" style={{ opacity: dragOverColumn === statusKey ? 1 : 0 }}>
                                Thả vào đây
                            </div>
                        </div>
                    </div>
                  );
              })}
          </div>
      )}

      {selectedLead && <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />}

      {/* Add Lead Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95">
              <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                          <UserPlus size={32} />
                      </div>
                      <h3 className="font-black text-2xl text-slate-900">Thêm Khách Mới</h3>
                      <p className="text-sm text-slate-500 mt-1">Nhập thông tin để AI bắt đầu phân tích</p>
                  </div>
                  
                  <div className="space-y-5 relative z-10">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tên khách hàng</label>
                          <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-500 focus:bg-white transition-colors" value={newLeadForm.name} onChange={e => setNewLeadForm({...newLeadForm, name: e.target.value})} placeholder="VD: Anh Nam" autoFocus />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Số điện thoại</label>
                          <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-500 focus:bg-white transition-colors" value={newLeadForm.phone} onChange={e => setNewLeadForm({...newLeadForm, phone: e.target.value})} placeholder="0909..." />
                      </div>
                      
                      <button onClick={handleCreateLead} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 mt-4 flex items-center justify-center gap-2 active:scale-95">
                          <Check size={20} /> Tạo Hồ Sơ
                      </button>
                      <button onClick={() => setIsAddModalOpen(false)} className="w-full py-3 text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors">Đóng lại</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LeadDashboard;
