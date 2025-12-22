
import React, { useState, useMemo, useEffect } from 'react';
import { Lead, MarketIntel, Message } from '../types';
import { 
  User, Phone, DollarSign, Clock, CheckCircle2, Tag, Building2, 
  Target, Search, Download, Calculator, PieChart, 
  BarChart3, Sparkles, X, Copy, PenTool,
  TrendingUp, Newspaper, Globe, RefreshCcw, Landmark, ExternalLink, ArrowUpRight, Info,
  Filter, Calendar, ChevronDown, MoreHorizontal, Users, ArrowRight, Save, Plus, RotateCcw, MessageSquare,
  AlertTriangle, MessageCircle
} from 'lucide-react';
import { 
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { generateSalesScript, fetchMarketIntelligence } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface LeadDashboardProps {
  leads: Lead[];
  onAddLead?: (lead: Lead) => void;
}

const COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#F59E0B', '#10B981'];

// --- Utility: Remove Vietnamese Tones for Smart Search ---
const removeVietnameseTones = (str: string) => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase();
};

const LeadDashboard: React.FC<LeadDashboardProps> = ({ leads, onAddLead }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'processed'>('all');
  
  // Advanced Filters
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterBudget, setFilterBudget] = useState<string>('all');

  // AI Script Modal
  const [selectedLeadForScript, setSelectedLeadForScript] = useState<Lead | null>(null);
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Chat History Modal
  const [selectedLeadHistory, setSelectedLeadHistory] = useState<Lead | null>(null);

  // Market Intel
  const [marketIntel, setMarketIntel] = useState<MarketIntel | null>(null);
  const [isLoadingIntel, setIsLoadingIntel] = useState(false);
  const [intelError, setIntelError] = useState(false);

  // Add Lead Modal
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadData, setNewLeadData] = useState<Partial<Lead>>({
      name: '', phone: '', projectInterest: '', needs: '', budget: '', purpose: 'ở'
  });

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    handleRefreshIntel();
  }, []);

  const handleRefreshIntel = async () => {
    setIsLoadingIntel(true);
    setIntelError(false);
    try {
        const data = await fetchMarketIntelligence();
        if (data) {
            setMarketIntel(data);
        } else {
            setIntelError(true);
        }
    } catch (e) {
        setIntelError(true);
    } finally {
        setIsLoadingIntel(false);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // 1. Smart Text Search (Vietnamese No-Accent & Multi-keyword)
      let matchesSearch = true;
      if (searchTerm.trim()) {
          const normalizedSearch = removeVietnameseTones(searchTerm);
          // Split search term into keywords (e.g. "Huy 5 ty" -> ["huy", "5", "ty"])
          const keywords = normalizedSearch.split(/\s+/).filter(k => k.length > 0);
          
          // Create a searchable string containing all relevant lead info
          const leadSearchString = removeVietnameseTones(
              `${lead.name} ${lead.phone} ${lead.projectInterest} ${lead.needs} ${lead.budget} ${lead.status} ${lead.purpose}`
          );

          // Check if EVERY keyword exists in the lead string (AND logic)
          matchesSearch = keywords.every(kw => leadSearchString.includes(kw));
      }
      
      // 2. Status Filter
      const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'new' ? lead.status === 'new' : lead.status !== 'new';
      
      // 3. Project Filter
      const matchesProject = filterProject === 'all' ? true : lead.projectInterest.toLowerCase().includes(filterProject.toLowerCase());

      // 4. Budget Filter (Approximate Logic for Demo)
      // Assuming budget format string like "5-7 tỷ"
      let matchesBudget = true;
      if (filterBudget !== 'all') {
          if (filterBudget === '<5') matchesBudget = lead.budget.includes('3') || lead.budget.includes('4'); 
          if (filterBudget === '5-10') matchesBudget = lead.budget.includes('5') || lead.budget.includes('6') || lead.budget.includes('7');
          if (filterBudget === '>10') matchesBudget = lead.budget.length > 2 && !lead.budget.includes('3') && !lead.budget.includes('5');
      }

      return matchesSearch && matchesStatus && matchesProject && matchesBudget;
    });
  }, [leads, searchTerm, statusFilter, filterProject, filterBudget]);

  // --- REAL-TIME ANALYTICS (CALCULATED FROM LEADS PROP) ---
  const leadGrowthData = useMemo(() => {
      if (leads.length === 0) return [];
      const last6Months = new Array(6).fill(0).map((_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          return {
             monthStr: `T${d.getMonth() + 1}`,
             monthKey: `${d.getFullYear()}-${d.getMonth()}`,
             leads: 0
          };
      });
      leads.forEach(lead => {
          const d = new Date(lead.createdAt);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const found = last6Months.find(m => m.monthKey === key);
          if (found) found.leads += 1;
      });
      return last6Months.map(m => ({ month: m.monthStr, leads: m.leads }));
  }, [leads]);

  const funnelData = useMemo(() => {
      const total = leads.length;
      if (total === 0) return [
          { name: 'Tiếp cận', value: 0, fill: '#94a3b8' },
          { name: 'Quan tâm', value: 0, fill: '#60a5fa' },
          { name: 'Tham quan', value: 0, fill: '#818cf8' },
          { name: 'Đặt cọc', value: 0, fill: '#10b981' },
      ];
      const deposited = leads.filter(l => l.status === 'deposited').length;
      const visited = leads.filter(l => l.status === 'visited' || l.status === 'deposited').length;
      const contacted = leads.filter(l => l.status === 'contacted' || l.status === 'visited' || l.status === 'deposited').length;
      return [
          { name: 'Tiếp cận', value: total, fill: '#94a3b8' },
          { name: 'Liên hệ', value: contacted, fill: '#60a5fa' },
          { name: 'Tham quan', value: visited, fill: '#818cf8' },
          { name: 'Đặt cọc', value: deposited, fill: '#10b981' },
      ];
  }, [leads]);

  // --- ACTIONS ---

  const handleGenerateScript = async (lead: Lead) => {
      setSelectedLeadForScript(lead);
      setIsGeneratingScript(true);
      setGeneratedScript('');
      try {
          const script = await generateSalesScript(lead);
          setGeneratedScript(script);
      } catch {
          setGeneratedScript("Hệ thống bận, vui lòng thử lại.");
      } finally {
          setIsGeneratingScript(false);
      }
  };

  const handleCopyLeadInfo = (lead: Lead) => {
      const text = `Khách: ${lead.name}\nSĐT: ${lead.phone}\nDự án: ${lead.projectInterest}\nNhu cầu: ${lead.needs}\nNgân sách: ${lead.budget}`;
      navigator.clipboard.writeText(text);
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    
    // 1. Define Headers
    const headers = ["ID", "Tên KH", "SĐT", "Dự Án Quan Tâm", "Nhu Cầu", "Ngân Sách", "Mục Đích", "Trạng Thái", "Ngày Tạo"];
    
    // 2. Map Data
    const csvRows = filteredLeads.map(lead => [
        lead.id,
        `"${lead.name}"`, // Quote strings to handle commas
        `'${lead.phone}`, // Force string for Excel phone numbers
        `"${lead.projectInterest}"`,
        `"${lead.needs}"`,
        `"${lead.budget}"`,
        lead.purpose,
        lead.status,
        new Date(lead.createdAt).toLocaleDateString('vi-VN')
    ]);

    // 3. Join with newlines
    const csvContent = [headers.join(","), ...csvRows.map(r => r.join(","))].join("\n");
    
    // 4. Create Blob and Link
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel UTF-8
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `BDS_Leads_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveNewLead = () => {
      if (!newLeadData.name || !newLeadData.phone) {
          alert("Vui lòng nhập Tên và Số điện thoại!");
          return;
      }

      if (onAddLead) {
          const newLead: Lead = {
              id: Date.now().toString(),
              name: newLeadData.name,
              phone: newLeadData.phone,
              projectInterest: newLeadData.projectInterest || 'Chưa rõ',
              needs: newLeadData.needs || '',
              budget: newLeadData.budget || 'Thỏa thuận',
              purpose: (newLeadData.purpose as any) || 'ở',
              status: 'new',
              timeline: '1 tháng',
              createdAt: new Date()
          };
          onAddLead(newLead);
          setShowAddLeadModal(false);
          setNewLeadData({ name: '', phone: '', projectInterest: '', needs: '', budget: '', purpose: 'ở' });
      }
  };

  const handleResetFilters = () => {
    setFilterProject('all');
    setFilterBudget('all');
    setStatusFilter('all');
    setSearchTerm('');
  };

  // Visual Helpers
  const getSentimentColor = (score: number) => {
      if (score >= 65) return 'text-green-600';
      if (score >= 40) return 'text-amber-500';
      return 'text-red-500';
  };
  const getSentimentBg = (score: number) => {
      if (score >= 65) return 'bg-green-500';
      if (score >= 40) return 'bg-amber-500';
      return 'bg-red-500';
  };

  // Helper to calculate time ago
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " năm trước";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " tháng trước";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " ngày trước";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " giờ trước";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " phút trước";
    return "Vừa xong";
  };

  return (
    <div className="p-4 md:p-8 min-h-full font-sans bg-slate-50/50">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">BDS Advisor Pro <span className="text-indigo-600 text-lg align-top ml-1">v2.0</span></h2>
          <p className="text-slate-500 font-medium">Trung tâm điều hành kinh doanh & Phân tích dữ liệu lớn.</p>
        </div>
        <div className="flex gap-3">
             <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-end">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Tổng khách hàng</span>
                 <span className="text-xl font-black text-slate-900">{leads.length}</span>
             </div>
             <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 flex flex-col items-end">
                 <span className="text-[10px] font-bold text-indigo-200 uppercase">Leads Mới</span>
                 <span className="text-xl font-black">{leads.filter(l => l.status === 'new').length}</span>
             </div>
        </div>
      </div>

      {/* --- BUSINESS INTELLIGENCE SECTION --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          
          {/* 1. Market Radar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-visible group hover:shadow-lg transition-all duration-300">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Globe size={18} className="text-indigo-600" /> 
                    Ra-đa Thị Trường (AI)
                </h3>
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Live
                </span>
             </div>
             
             <div className="mb-6 relative">
                 <div className="flex justify-between items-end mb-2">
                     <span className="text-xs font-bold text-slate-500 uppercase">Chỉ số niềm tin</span>
                     <span className={`text-3xl font-black ${marketIntel ? getSentimentColor(marketIntel.sentimentScore) : 'text-slate-300'}`}>
                         {marketIntel ? marketIntel.sentimentScore : '--'}/100
                     </span>
                 </div>
                 <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                     <div 
                        className={`h-full ${marketIntel ? getSentimentBg(marketIntel.sentimentScore) : 'bg-slate-200'} relative transition-all duration-1000`} 
                        style={{width: `${marketIntel ? marketIntel.sentimentScore : 0}%`}}
                     >
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                     </div>
                 </div>
                 <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
                     <span>Hoảng loạn</span>
                     <span>Thận trọng</span>
                     <span>Hưng phấn</span>
                 </div>
             </div>

             {/* Trend Summary / Offline Notice */}
             {marketIntel?.trendSummary && (
                <div className={`mb-4 text-xs p-3 rounded-xl border ${marketIntel.trendSummary.includes('lưu trữ') || marketIntel.trendSummary.includes('Offline') ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                    <div className="flex gap-2">
                        <Info size={14} className="shrink-0 mt-0.5" />
                        <p>{marketIntel.trendSummary}</p>
                    </div>
                </div>
             )}

             <div className="space-y-3 pl-2 border-l-2 border-slate-100">
                {marketIntel?.topNews.slice(0, 3).map((news, i) => (
                    <a key={i} href={news.url} target="_blank" className="block group/news">
                        <h4 className="text-xs font-bold text-slate-700 group-hover/news:text-indigo-600 truncate transition-colors">{news.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex gap-2">
                            <span>{news.source}</span> • <span>{news.time}</span>
                        </p>
                    </a>
                )) || <div className="text-xs text-slate-400 italic">Đang cập nhật tin tức...</div>}
             </div>
          </div>

          {/* 2. Growth Analytics */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col hover:shadow-lg transition-all duration-300">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-600" /> 
                    Tăng trưởng Leads
                </h3>
             </div>
             {/* FIX: Use specific height (300px) instead of min-h/flex-1 to ensure Recharts can calculate dimensions */}
             <div className="w-full" style={{ height: 300 }}>
                {leadGrowthData.length > 0 && leads.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={leadGrowthData}>
                            <defs>
                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Tooltip 
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                                itemStyle={{fontSize: '11px', fontWeight: 'bold', color: '#1e293b'}}
                                labelStyle={{display: 'none'}}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10}/>
                            <Area type="monotone" dataKey="leads" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <BarChart3 size={32} className="mb-2 opacity-20" />
                        <span className="text-xs">Chưa có dữ liệu khách hàng</span>
                        <span className="text-[10px] mt-1">Dữ liệu sẽ hiển thị khi bạn có Lead đầu tiên.</span>
                    </div>
                )}
             </div>
          </div>

          {/* 3. Conversion Funnel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col hover:shadow-lg transition-all duration-300">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Target size={18} className="text-emerald-600" /> 
                    Phễu chuyển đổi
                </h3>
             </div>
             <div className="flex-1 w-full flex flex-col justify-center space-y-3">
                 {funnelData.map((item, idx) => (
                     <div key={idx} className="relative group cursor-pointer">
                         <div className="flex justify-between text-xs font-bold text-slate-600 mb-1 relative z-10">
                             <span>{item.name}</span>
                             <span>{item.value} khách</span>
                         </div>
                         <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                                className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-90" 
                                style={{
                                    width: `${item.value > 0 ? (item.value / funnelData[0].value) * 100 : 0}%`,
                                    backgroundColor: item.fill,
                                    minWidth: item.value > 0 ? '5%' : '0'
                                }}
                             ></div>
                         </div>
                         <div className="absolute right-0 top-6 text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Tỷ lệ: {funnelData[0].value > 0 ? Math.round((item.value / funnelData[0].value) * 100) : 0}%
                         </div>
                     </div>
                 ))}
             </div>
          </div>
      </div>

      {/* --- LEADS MANAGEMENT SECTION --- */}
      
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 sticky top-0 bg-slate-50/95 backdrop-blur z-10 py-4 border-b border-slate-200/50">
         <div className="relative w-full md:w-96 group">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm nhanh: Tên, SĐT, Dự án (VD: Huy 5 tỷ, Global City...)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none shadow-sm placeholder:text-slate-400"
            />
         </div>
         {/* REMOVED overflow-x-auto to prevent clipping of absolute children like Filter Dropdown */}
         <div className="flex flex-wrap gap-2 w-full md:w-auto relative justify-end">
            
            {/* Filter Toggle */}
            <div className="relative">
                <button 
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${showFilterMenu ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                   <Filter size={14} /> Bộ lọc
                   {(filterProject !== 'all' || filterBudget !== 'all' || statusFilter !== 'all') && (
                     <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                     </span>
                   )}
                </button>
                {showFilterMenu && (
                    <>
                        {/* Backdrop to click-away */}
                        <div className="fixed inset-0 z-[55]" onClick={() => setShowFilterMenu(false)}></div>
                        
                        {/* Dropdown Card */}
                        <div className="absolute top-full mt-2 right-0 md:left-auto w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 z-[60] animate-in fade-in slide-in-from-top-2 origin-top-right">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                  <Filter size={14} /> Lọc dữ liệu
                                </span>
                                <button 
                                  onClick={handleResetFilters} 
                                  className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold flex items-center gap-1 transition-colors"
                                >
                                    <RotateCcw size={10} /> Đặt lại
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Dự án quan tâm</label>
                                    <div className="relative">
                                      <select 
                                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-100 outline-none appearance-none"
                                          value={filterProject}
                                          onChange={(e) => setFilterProject(e.target.value)}
                                      >
                                          <option value="all">Tất cả dự án</option>
                                          <option value="Vinhomes">Vinhomes Grand Park</option>
                                          <option value="The Global City">The Global City</option>
                                          <option value="Empire City">Empire City</option>
                                      </select>
                                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Khoảng ngân sách</label>
                                    <div className="relative">
                                      <select 
                                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-100 outline-none appearance-none"
                                          value={filterBudget}
                                          onChange={(e) => setFilterBudget(e.target.value)}
                                      >
                                          <option value="all">Tất cả mức giá</option>
                                          <option value="<5">Dưới 5 Tỷ</option>
                                          <option value="5-10">5 - 10 Tỷ</option>
                                          <option value=">10">Trên 10 Tỷ</option>
                                      </select>
                                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Trạng thái xử lý</label>
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button 
                                          onClick={() => setStatusFilter('all')} 
                                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                          Tất cả
                                        </button>
                                        <button 
                                          onClick={() => setStatusFilter('new')} 
                                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${statusFilter === 'new' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                          Mới
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 pt-4 border-t border-slate-50">
                               <button 
                                 onClick={() => setShowFilterMenu(false)}
                                 className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-indigo-200"
                               >
                                 Áp dụng bộ lọc
                               </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <button 
                onClick={handleExportCSV} 
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all shadow-sm"
            >
               <Download size={14} /> Xuất Báo cáo
            </button>
            
            <button 
                onClick={() => setShowAddLeadModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
            >
               <Plus size={14} /> Thêm Lead
            </button>
         </div>
      </div>

      {/* Leads Grid - Enhanced Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-20">
        {filteredLeads.length === 0 ? (
          <div className="col-span-full py-20 text-center">
             {/* Empty State Illustration */}
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Search size={32} />
             </div>
             <p className="text-slate-500 font-medium">Không tìm thấy dữ liệu.</p>
             <p className="text-slate-400 text-xs">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const hasValidPhone = lead.phone && lead.phone.length > 8 && !isNaN(Number(lead.phone.replace(/\s/g, '')));
            
            return (
            <div key={lead.id} className="bg-white rounded-2xl p-0 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col relative overflow-hidden">
               
               {/* Card Header with Status Color */}
               <div className="p-5 border-b border-slate-50">
                   <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md ${
                            lead.status === 'new' ? 'bg-indigo-600 shadow-indigo-200' : 'bg-slate-400'
                         }`}>
                            {lead.name.charAt(0).toUpperCase()}
                         </div>
                         <div>
                            <h3 className="text-base font-bold text-slate-900 leading-tight">{lead.name}</h3>
                            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                               <Clock size={10} /> {timeAgo(lead.createdAt)}
                            </p>
                         </div>
                      </div>
                      {lead.status === 'new' && (
                          <span className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                              Mới
                          </span>
                      )}
                   </div>
               </div>

               {/* Card Body */}
               <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                     <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><Building2 size={10} /> Quan tâm</p>
                        <p className="text-xs font-bold text-indigo-700 truncate">{lead.projectInterest}</p>
                     </div>
                     <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><Target size={10} /> Nhu cầu</p>
                        <p className="text-xs font-bold text-slate-700 capitalize truncate">{lead.purpose}</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100 flex items-center gap-1.5">
                         <DollarSign size={12} /> {lead.budget}
                      </div>
                  </div>

                  {/* CONTACT ACTIONS - UPDATED */}
                  <div className="grid grid-cols-6 gap-2">
                      {hasValidPhone ? (
                          <>
                            <a 
                                href={`tel:${lead.phone}`}
                                className="col-span-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-green-200"
                            >
                                <Phone size={14} /> Gọi điện
                            </a>
                            <a 
                                href={`https://zalo.me/${lead.phone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="col-span-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-200"
                            >
                                <MessageCircle size={14} /> Zalo
                            </a>
                          </>
                      ) : (
                          <div className="col-span-5 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                              <AlertTriangle size={12} /> SĐT không hợp lệ
                          </div>
                      )}
                      
                      <button 
                        onClick={() => handleCopyLeadInfo(lead)}
                        className={`col-span-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${
                            copiedId === lead.id 
                            ? 'bg-slate-800 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Copy thông tin"
                      >
                        {copiedId === lead.id ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                      </button>
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="mt-auto p-5 pt-0 grid grid-cols-2 gap-3">
                   {lead.chatHistory && lead.chatHistory.length > 0 ? (
                       <button 
                          onClick={() => setSelectedLeadHistory(lead)}
                          className="py-2.5 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                       >
                          <MessageSquare size={14} /> Xem lịch sử Chat
                       </button>
                   ) : (
                       <div className="py-2.5 bg-slate-50 text-slate-400 rounded-xl text-xs font-bold text-center border border-slate-100 italic">
                           Không có lịch sử
                       </div>
                   )}
                   
                   <button 
                      onClick={() => handleGenerateScript(lead)}
                      className="py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 group/btn"
                   >
                      <Sparkles size={14} className="text-indigo-300 group-hover/btn:text-white transition-colors" /> 
                      AI Script
                   </button>
               </div>
            </div>
          )})
        )}
      </div>

      {/* --- ADD LEAD MODAL --- */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-black text-slate-900">Thêm Khách Hàng</h3>
                    <button onClick={() => setShowAddLeadModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên khách hàng</label>
                        <input 
                            type="text" 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none" 
                            placeholder="Nhập tên..."
                            value={newLeadData.name}
                            onChange={e => setNewLeadData({...newLeadData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số điện thoại</label>
                        <input 
                            type="tel" 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none" 
                            placeholder="09..."
                            value={newLeadData.phone}
                            onChange={e => setNewLeadData({...newLeadData, phone: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dự án quan tâm</label>
                            <select 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none"
                                value={newLeadData.projectInterest}
                                onChange={e => setNewLeadData({...newLeadData, projectInterest: e.target.value})}
                            >
                                <option value="">Chọn dự án...</option>
                                <option value="Vinhomes Grand Park">Vinhomes Grand Park</option>
                                <option value="The Global City">The Global City</option>
                                <option value="Empire City">Empire City</option>
                                <option value="Grand Marina Saigon">Grand Marina Saigon</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngân sách</label>
                            <input 
                                type="text" 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none" 
                                placeholder="VD: 5 Tỷ"
                                value={newLeadData.budget}
                                onChange={e => setNewLeadData({...newLeadData, budget: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mục đích mua</label>
                        <div className="flex gap-2">
                            {['ở', 'đầu tư', 'văn phòng'].map(type => (
                                <button 
                                    key={type}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${newLeadData.purpose === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                    onClick={() => setNewLeadData({...newLeadData, purpose: type as any})}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ghi chú nhu cầu</label>
                        <textarea 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none h-20 resize-none" 
                            placeholder="Ghi chú thêm..."
                            value={newLeadData.needs}
                            onChange={e => setNewLeadData({...newLeadData, needs: e.target.value})}
                        ></textarea>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <button 
                        onClick={handleSaveNewLead}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                        <Save size={16} /> Lưu Khách Hàng
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- CHAT HISTORY MODAL --- */}
      {selectedLeadHistory && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Lịch sử tư vấn</h3>
                            <p className="text-xs text-slate-500 font-medium">Khách hàng: <span className="text-indigo-600 font-bold">{selectedLeadHistory.name}</span></p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedLeadHistory(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar space-y-4">
                    {selectedLeadHistory.chatHistory && selectedLeadHistory.chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                                : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm'
                            }`}>
                                <div className="text-[10px] opacity-70 mb-1 font-bold uppercase">
                                    {msg.role === 'user' ? selectedLeadHistory.name : 'AI Advisor'}
                                </div>
                                <ReactMarkdown components={{
                                    p: ({children}) => <p className="mb-0 whitespace-pre-wrap">{children}</p>,
                                    strong: ({children}) => <span className="font-bold text-inherit">{children}</span>
                                }}>
                                    {msg.text}
                                </ReactMarkdown>
                                {msg.image && (
                                    <img src={msg.image} className="mt-2 rounded-lg max-h-40 w-auto object-cover border border-white/20" alt="uploaded" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-slate-100 bg-white">
                    <button onClick={() => setSelectedLeadHistory(null)} className="w-full py-3 bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 rounded-xl transition-colors">
                        Đóng cửa sổ
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Script Modal (UI Only) */}
      {selectedLeadForScript && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">AI Sales Coach</h3>
                            <p className="text-xs text-slate-500 font-medium">Chiến lược tiếp cận: <span className="text-indigo-600 font-bold">{selectedLeadForScript.name}</span></p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedLeadForScript(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                    {isGeneratingScript ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="relative w-16 h-16 mb-6">
                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <h4 className="text-base font-bold text-slate-800 mb-2">Đang phân tích hồ sơ khách hàng...</h4>
                            <p className="text-xs text-slate-400">AI đang tổng hợp dữ liệu thị trường để đưa ra lời khuyên tốt nhất.</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm prose-slate max-w-none">
                             <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mb-6">
                                 <h4 className="text-indigo-900 font-bold flex items-center gap-2 mb-2 text-sm">
                                     <Target size={16} /> Mục tiêu cuộc gọi
                                 </h4>
                                 <p className="text-slate-600 text-xs">Thuyết phục khách hàng tham quan dự án {selectedLeadForScript.projectInterest} dựa trên nhu cầu "{selectedLeadForScript.needs}".</p>
                             </div>
                             
                             <div className="pl-4 border-l-2 border-slate-200 space-y-4">
                                <ReactMarkdown components={{
                                    h1: ({children}) => <h3 className="text-slate-900 font-black text-base mt-6 mb-3 flex items-center gap-2">{children}</h3>,
                                    h2: ({children}) => <h4 className="text-indigo-700 font-bold text-sm mt-4 mb-2 uppercase tracking-wide">{children}</h4>,
                                    strong: ({children}) => <span className="text-slate-900 font-extrabold bg-yellow-100 px-1 rounded-sm">{children}</span>,
                                    ul: ({children}) => <ul className="space-y-3 my-2 list-none pl-0">{children}</ul>,
                                    li: ({children}) => <li className="flex items-start gap-3 text-slate-600 text-sm leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100"><div className="mt-1 w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0"></div><span>{children}</span></li>
                                }}>
                                    {generatedScript}
                                </ReactMarkdown>
                             </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-4">
                    <span className="text-[10px] text-slate-400 italic">Được tạo bởi Gemini 3 Flash Pro</span>
                    <div className="flex gap-3">
                        <button onClick={() => setSelectedLeadForScript(null)} className="px-6 py-3 text-slate-600 font-bold text-xs hover:bg-slate-200 rounded-xl transition-colors">Đóng</button>
                        <button 
                            onClick={() => { navigator.clipboard.writeText(generatedScript); }}
                            disabled={isGeneratingScript || !generatedScript}
                            className="px-6 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50 active:scale-95"
                        >
                            <Copy size={16} /> Sao chép kịch bản
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LeadDashboard;
