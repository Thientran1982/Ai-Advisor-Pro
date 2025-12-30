
import React, { useState, useEffect, useMemo } from 'react';
import { Campaign, Lead } from '../../types';
import { 
    Plus, Search, Mail, MessageCircle, 
    Smartphone, Send, BarChart3, Clock, 
    Zap, X, Trash2, Play, AlertCircle, CheckCircle2, User, RefreshCw,
    Users, Sparkles, Filter, ChevronRight, Check
} from 'lucide-react';
import { dataService } from '../../services/dataService';

// --- MOCK AI TEMPLATES ---
const AI_TEMPLATES: Record<string, string[]> = {
    'chúc': [
        "Chào anh/chị [Ten_Khach], nhân dịp năm mới, em chúc anh/chị và gia đình vạn sự như ý, an khang thịnh vượng! Cảm ơn anh/chị đã đồng hành cùng em trong suốt thời gian qua. ❤️",
        "Chúc mừng sinh nhật anh/chị [Ten_Khach]! 🎂 Chúc anh/chị tuổi mới gặt hái nhiều thành công rực rỡ và luôn hạnh phúc bên gia đình."
    ],
    'đầu tư': [
        "🔥 CƠ HỘI ĐẦU TƯ F0: Dự án [Ten_Du_An] vừa ra mắt bảng hàng đợt 1. Chiết khấu ngay 5% cho 30 khách hàng đầu tiên. Dòng tiền cho thuê ước tính 8%/năm. Inbox em gửi bảng tính chi tiết nhé!",
        "Thị trường đang ấm dần lên! 📈 Em vừa lọc được 5 căn giá tốt nhất khu vực Quận 9, tiềm năng tăng giá 20% khi đường Vành Đai 3 thông xe. Anh/chị quan tâm nhắn em nhé."
    ],
    'lãi suất': [
        "📉 CẬP NHẬT LÃI SUẤT THÁNG NÀY: Các ngân hàng Big4 vừa giảm lãi suất vay mua nhà xuống dưới 6%. Đây là thời điểm vàng để sử dụng đòn bẩy. Anh/chị cần tư vấn gói vay tối ưu nhắn em hỗ trợ nhé!",
    ],
    'default': [
        "Chào anh/chị [Ten_Khach], em là [Ten_Ban] đây ạ. Lâu rồi không thấy anh/chị tương tác, không biết anh/chị còn quan tâm dự án khu Đông không ạ? Em có vài thông tin mới khá hay muốn chia sẻ."
    ]
};

const CampaignDashboard = () => {
    // STATE: Fetch from DataService
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]); // FETCH REAL LEADS
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // MODAL STATES
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [isSending, setIsSending] = useState(false); 
    
    // TOAST STATE
    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'success' });

    // FORM STATE
    const [newCampaign, setNewCampaign] = useState<{
        name: string, 
        channel: Campaign['channel'], 
        content: string,
        targetSegment: 'all' | 'vip' | 'new' | 'investor'
    }>({ name: '', channel: 'zalo', content: '', targetSegment: 'all' });
    
    // Form Validation State
    const [formErrors, setFormErrors] = useState<{ name?: string, content?: string }>({});

    // 1. SYNC DATA (REAL-TIME)
    useEffect(() => {
        const sync = () => {
            setCampaigns(dataService.getCampaigns());
            setLeads(dataService.getAllLeadsRaw());
        };
        sync();
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    // 2. REAL-TIME STATS
    const stats = useMemo(() => {
        const totalSent = campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
        const completedCampaigns = campaigns.filter(c => c.status === 'completed' || c.status === 'sending');
        const avgOpenRate = completedCampaigns.length 
            ? (completedCampaigns.reduce((acc, c) => acc + (c.openRate || 0), 0) / completedCampaigns.length).toFixed(1)
            : "0.0";
        const leadsReEngaged = campaigns.reduce((acc, c) => acc + Math.floor((c.clickRate || 0) * (c.sentCount || 0) / 100), 0);
        return { totalSent, avgOpenRate, leadsReEngaged };
    }, [campaigns]);

    // 3. AUDIENCE CALCULATION
    const targetAudienceCount = useMemo(() => {
        switch (newCampaign.targetSegment) {
            case 'vip': return leads.filter(l => l.priority === 'urgent' || l.priority === 'high').length;
            case 'new': return leads.filter(l => l.status === 'new').length;
            case 'investor': return leads.filter(l => l.purpose === 'đầu tư' || l.userType === 'enterprise').length;
            default: return leads.length;
        }
    }, [leads, newCampaign.targetSegment]);

    // --- UTILS ---
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    // --- ACTIONS ---

    const handleAIWrite = () => {
        const keyword = newCampaign.name.toLowerCase();
        let template = AI_TEMPLATES['default'][0];
        
        if (keyword.includes('chúc') || keyword.includes('tết') || keyword.includes('lễ')) template = AI_TEMPLATES['chúc'][Math.floor(Math.random() * AI_TEMPLATES['chúc'].length)];
        else if (keyword.includes('đầu tư') || keyword.includes('bán') || keyword.includes('hot')) template = AI_TEMPLATES['đầu tư'][Math.floor(Math.random() * AI_TEMPLATES['đầu tư'].length)];
        else if (keyword.includes('lãi') || keyword.includes('vay') || keyword.includes('ngân hàng')) template = AI_TEMPLATES['lãi suất'][0];

        // Typing effect simulation
        let i = 0;
        setNewCampaign(prev => ({...prev, content: ''}));
        const interval = setInterval(() => {
            setNewCampaign(prev => ({...prev, content: template.slice(0, i)}));
            i++;
            if (i > template.length) clearInterval(interval);
        }, 10);
    };

    const handleCreate = () => {
        // Strict Validation
        const errors: any = {};
        if (!newCampaign.name.trim()) errors.name = "Vui lòng nhập tên chiến dịch";
        if (!newCampaign.content.trim()) errors.content = "Nội dung không được để trống";
        
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) return;
        
        const campaign: Campaign = {
            id: `camp_${Date.now()}`, 
            name: newCampaign.name, 
            channel: newCampaign.channel, 
            content: newCampaign.content,
            status: 'scheduled', 
            audienceSize: targetAudienceCount, // REAL DATA
            sentCount: 0, 
            openRate: 0, 
            clickRate: 0,
            createdAt: new Date(), 
            scheduledDate: new Date(Date.now() + 86400000) 
        };
        
        dataService.addCampaign(campaign);
        setShowCreateModal(false); 
        setNewCampaign({name: '', channel: 'zalo', content: '', targetSegment: 'all'});
        setFormErrors({});
        
        dataService.addNotification({
            id: `notif_${Date.now()}`, type: 'campaign', title: 'Chiến dịch mới',
            message: `Chiến dịch "${campaign.name}" đã được lên lịch gửi cho ${campaign.audienceSize} khách.`,
            time: new Date(), read: false
        });
        
        showToast("Đã lên lịch chiến dịch thành công!", "success");
    };

    const handleDelete = (id: string) => {
        // Non-blocking delete (Optimistic UI)
        dataService.deleteCampaign(id);
        setSelectedCampaign(null);
        showToast("Đã xóa chiến dịch", "info");
    };

    const handleStartSending = (campaign: Campaign) => {
        setIsSending(true);
        const sendingCamp = { ...campaign, status: 'sending' as const };
        dataService.updateCampaign(sendingCamp);
        setSelectedCampaign(sendingCamp);

        let progress = 0;
        const interval = setInterval(() => {
            progress += 5; // Slower simulation
            if (progress >= 100) {
                clearInterval(interval);
                const completedCamp = { 
                    ...sendingCamp, 
                    status: 'completed' as const,
                    sentCount: campaign.audienceSize,
                    openRate: Math.floor(Math.random() * 40) + 20,
                    clickRate: Math.floor(Math.random() * 10) + 1
                };
                dataService.updateCampaign(completedCamp);
                setSelectedCampaign(completedCamp);
                setIsSending(false);
                showToast("Chiến dịch đã gửi hoàn tất!", "success");
            } else {
                const currentSent = Math.floor((progress / 100) * campaign.audienceSize);
                const updating = { ...sendingCamp, sentCount: currentSent };
                dataService.updateCampaign(updating);
                setSelectedCampaign(updating);
            }
        }, 200); 
    };

    const filteredCampaigns = campaigns.filter(c => {
        return (filterStatus === 'all' || c.status === filterStatus) && c.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'sending': return 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse';
            case 'scheduled': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getChannelIcon = (channel: string) => {
        switch(channel) {
            case 'zalo': return <MessageCircle size={16} className="text-blue-600" />;
            case 'email': return <Mail size={16} className="text-red-500" />;
            case 'sms': return <Smartphone size={16} className="text-slate-600" />;
            default: return <MessageCircle size={16} />;
        }
    };

    // Helper to get localized status text
    const getStatusText = (status: string) => {
        switch (status) {
            case 'sending': return 'Đang gửi...';
            case 'completed': return 'Hoàn thành';
            case 'scheduled': return 'Đã lên lịch';
            case 'draft': return 'Bản nháp';
            default: return status;
        }
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-8 font-sans bg-[#FAFAFA] relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Chiến Dịch <span className="text-sm font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">{campaigns.length}</span>
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">Tiếp cận hàng loạt khách hàng tự động.</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95">
                    <Plus size={18} /> <span className="hidden md:inline">Tạo Mới</span>
                </button>
            </div>

            {/* Real-time Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-[24px] text-white shadow-lg shadow-blue-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-xl"><Send size={24}/></div>
                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">Tổng gửi</span>
                    </div>
                    <p className="text-4xl font-black">{stats.totalSent.toLocaleString()}</p>
                    <p className="text-sm font-medium opacity-80">Tin nhắn đã được gửi đi</p>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl"><BarChart3 size={24}/></div>
                    </div>
                    <p className="text-4xl font-black text-slate-900">{stats.avgOpenRate}%</p>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Tỷ lệ mở trung bình</p>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Zap size={24}/></div>
                    </div>
                    <p className="text-4xl font-black text-slate-900">{stats.leadsReEngaged}</p>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Khách Tương Tác Lại</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 sticky top-0 z-10 bg-[#FAFAFA]/95 backdrop-blur py-2">
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto overflow-x-auto">
                    {['all', 'sending', 'scheduled', 'completed'].map(status => (
                        <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${filterStatus === status ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                            {status === 'all' ? 'Tất cả' : status === 'sending' ? 'Đang gửi' : status === 'scheduled' ? 'Đã lên lịch' : 'Hoàn thành'}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-80">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Tìm tên chiến dịch..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" />
                </div>
            </div>

            {/* Clean List View */}
            <div className="space-y-3 pb-20">
                {filteredCampaigns.map((campaign) => (
                    <div key={campaign.id} onClick={() => setSelectedCampaign(campaign)} className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer group flex items-center gap-3 md:gap-6">
                        {/* Icon */}
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-110 transition-transform">
                            {getChannelIcon(campaign.channel)}
                        </div>
                        
                        {/* Info - Responsive Stack */}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm md:text-base font-bold text-slate-900 truncate mb-1">{campaign.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-xs text-slate-500">
                                <span className="font-medium bg-slate-50 px-2 py-0.5 rounded-md capitalize">{campaign.channel}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="flex items-center gap-1"><Users size={12}/> {campaign.audienceSize} <span className="hidden sm:inline">khách</span></span>
                                <span className="hidden sm:inline">•</span>
                                <span>{campaign.scheduledDate?.toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>

                        {/* Progress - Hidden on Mobile */}
                        <div className="hidden md:block w-48">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                                <span>Tiến độ</span>
                                <span>{campaign.audienceSize > 0 ? Math.round((campaign.sentCount / campaign.audienceSize) * 100) : 0}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-1000 ${campaign.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${campaign.audienceSize > 0 ? (campaign.sentCount / campaign.audienceSize) * 100 : 0}%`}}></div>
                            </div>
                        </div>

                        {/* Status - Compact on Mobile */}
                        <div className="w-auto md:w-28 text-right shrink-0">
                             <span className={`inline-block px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wide border ${getStatusStyle(campaign.status)}`}>
                                {getStatusText(campaign.status)}
                            </span>
                        </div>
                    </div>
                ))}
                {filteredCampaigns.length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                        <MessageCircle size={48} className="mx-auto mb-4 opacity-30"/>
                        <p>Không tìm thấy chiến dịch nào.</p>
                    </div>
                )}
            </div>

            {/* CREATE MODAL - UPGRADED */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95">
                    <div className="bg-white rounded-[32px] w-full max-w-4xl p-0 shadow-2xl flex overflow-hidden max-h-[90vh]">
                        {/* LEFT: FORM */}
                        <div className="w-full md:w-1/2 p-8 overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-2xl text-slate-900">Chiến dịch mới</h3>
                                <button onClick={() => setShowCreateModal(false)}><X size={24} className="text-slate-400 hover:text-slate-600"/></button>
                            </div>
                            
                            <div className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-2">Tên chiến dịch</label>
                                    <input 
                                        className={`w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm focus:bg-white outline-none transition-colors ${formErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-500'}`} 
                                        placeholder="VD: Chúc Tết Khách VIP" 
                                        value={newCampaign.name} 
                                        onChange={e => { setNewCampaign({...newCampaign, name: e.target.value}); setFormErrors(p => ({...p, name: ''})); }} 
                                    />
                                    {formErrors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.name}</p>}
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-2">Kênh gửi</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['zalo', 'sms', 'email'] as const).map(ch => (
                                            <button key={ch} onClick={() => setNewCampaign({...newCampaign, channel: ch})} className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${newCampaign.channel === ch ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                                {getChannelIcon(ch)} 
                                                <span className="text-xs font-bold capitalize">{ch}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-2">Đối tượng (Data Leads)</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none appearance-none"
                                            value={newCampaign.targetSegment}
                                            onChange={e => setNewCampaign({...newCampaign, targetSegment: e.target.value as any})}
                                        >
                                            <option value="all">Tất cả khách hàng</option>
                                            <option value="vip">Khách VIP / Gấp</option>
                                            <option value="new">Khách mới (New)</option>
                                            <option value="investor">Nhà đầu tư</option>
                                        </select>
                                        <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                    </div>
                                    <p className="text-xs font-bold text-indigo-600 mt-2 flex items-center gap-1 ml-1">
                                        <Users size={12}/> Đã tìm thấy {targetAudienceCount} khách hàng phù hợp.
                                    </p>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nội dung tin nhắn</label>
                                        <button onClick={handleAIWrite} className="text-[10px] font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-500 px-2 py-1 rounded-md flex items-center gap-1 hover:shadow-md transition-shadow">
                                            <Sparkles size={10}/> AI Viết Mẫu
                                        </button>
                                    </div>
                                    <textarea 
                                        className={`w-full p-4 bg-slate-50 border rounded-2xl font-medium text-sm focus:bg-white outline-none transition-colors h-40 resize-none leading-relaxed ${formErrors.content ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-500'}`} 
                                        placeholder="Nhập nội dung hoặc bấm nút AI..."
                                        value={newCampaign.content}
                                        onChange={e => { setNewCampaign({...newCampaign, content: e.target.value}); setFormErrors(p => ({...p, content: ''})); }}
                                    />
                                    {formErrors.content && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.content}</p>}
                                    <p className="text-[10px] text-slate-400 text-right mt-1">{newCampaign.content.length} ký tự</p>
                                </div>

                                <button onClick={handleCreate} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-300 mt-2 flex items-center justify-center gap-2 active:scale-95">
                                    <Clock size={20}/> Lên Lịch Gửi
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: MOBILE PREVIEW */}
                        <div className="hidden md:flex w-1/2 bg-slate-100 p-8 items-center justify-center border-l border-slate-200 relative overflow-hidden">
                            <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none"></div>
                            
                            {/* Phone Mockup */}
                            <div className="w-[300px] h-[580px] bg-white rounded-[40px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
                                {/* Phone Header */}
                                <div className="h-14 bg-slate-50 border-b border-slate-100 flex items-center px-4 justify-between shrink-0">
                                    <div className="text-[10px] font-bold text-slate-900">9:41</div>
                                    <div className="flex gap-1">
                                        <div className="w-3 h-3 bg-slate-900 rounded-full opacity-20"></div>
                                        <div className="w-3 h-3 bg-slate-900 rounded-full opacity-20"></div>
                                    </div>
                                </div>
                                
                                {/* Phone Body */}
                                <div className="flex-1 bg-[#E2E8F0] p-3 overflow-y-auto">
                                    <div className="text-[10px] text-slate-400 text-center mb-4">Hôm nay</div>
                                    {/* Message Bubble */}
                                    <div className="flex flex-col gap-1 items-end animate-in slide-in-from-bottom-2">
                                        <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-tr-sm text-xs leading-relaxed shadow-sm max-w-[90%] break-words">
                                            {newCampaign.content || <span className="opacity-50 italic">Nội dung tin nhắn sẽ hiển thị tại đây...</span>}
                                        </div>
                                        <span className="text-[9px] text-slate-400 mr-1">Đã xem</span>
                                    </div>
                                </div>

                                {/* Phone Footer */}
                                <div className="h-16 bg-white border-t border-slate-100 flex items-center px-4 shrink-0">
                                    <div className="h-8 bg-slate-100 rounded-full w-full"></div>
                                </div>
                            </div>
                            
                            <div className="absolute bottom-6 text-slate-400 text-xs font-medium">
                                Xem trước hiển thị trên điện thoại
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign Detail Modal */}
            {selectedCampaign && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl p-0 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                                        {getChannelIcon(selectedCampaign.channel)}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${getStatusStyle(selectedCampaign.status)}`}>
                                        {getStatusText(selectedCampaign.status)}
                                    </span>
                                </div>
                                <h3 className="font-black text-2xl text-slate-900 leading-tight">{selectedCampaign.name}</h3>
                                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wide">
                                    Tạo ngày: {new Date(selectedCampaign.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                            <button onClick={() => setSelectedCampaign(null)} className="p-2 bg-white hover:bg-slate-200 rounded-full transition-colors text-slate-500 shadow-sm border border-slate-200">
                                <X size={20}/>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                    <User size={20} className="mx-auto text-slate-400 mb-2"/>
                                    <div className="text-2xl font-black text-slate-900">{selectedCampaign.audienceSize}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Đối tượng</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                    <Send size={20} className="mx-auto text-blue-500 mb-2"/>
                                    <div className="text-2xl font-black text-slate-900">{selectedCampaign.sentCount}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Đã gửi</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                    <BarChart3 size={20} className="mx-auto text-emerald-500 mb-2"/>
                                    <div className="text-2xl font-black text-slate-900">{selectedCampaign.openRate}%</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Tỷ lệ mở</div>
                                </div>
                            </div>

                            {/* Content Preview */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 uppercase mb-3 flex items-center gap-2">
                                    <MessageCircle size={14}/> Nội dung tin nhắn
                                </h4>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                                    {selectedCampaign.content || "Không có nội dung."}
                                </div>
                            </div>

                            {/* Progress Bar (If sending/completed) */}
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                    <span>Tiến độ gửi</span>
                                    <span>{selectedCampaign.audienceSize > 0 ? Math.round((selectedCampaign.sentCount / selectedCampaign.audienceSize) * 100) : 0}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-300 relative overflow-hidden" 
                                        style={{width: `${selectedCampaign.audienceSize > 0 ? (selectedCampaign.sentCount / selectedCampaign.audienceSize) * 100 : 0}%`}}
                                    >
                                        {selectedCampaign.status === 'sending' && (
                                            <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_1s_infinite] -translate-x-full"></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center gap-4">
                            <button 
                                onClick={() => handleDelete(selectedCampaign.id)}
                                className="px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                            >
                                <Trash2 size={16}/> Xóa chiến dịch
                            </button>

                            {selectedCampaign.status === 'scheduled' ? (
                                <button 
                                    onClick={() => handleStartSending(selectedCampaign)}
                                    disabled={isSending}
                                    className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-70"
                                >
                                    {isSending ? <RefreshCw size={18} className="animate-spin"/> : <Play size={18} fill="currentColor"/>}
                                    {isSending ? 'Đang khởi chạy...' : 'Kích hoạt Gửi ngay'}
                                </button>
                            ) : selectedCampaign.status === 'sending' ? (
                                <button className="flex-1 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 cursor-default">
                                    <RefreshCw size={18} className="animate-spin"/> Hệ thống đang gửi...
                                </button>
                            ) : (
                                <button className="flex-1 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold flex items-center justify-center gap-2 cursor-default">
                                    <CheckCircle2 size={18}/> Hoàn tất
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Toast Overlay */}
            {toast.show && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[150] animate-in fade-in slide-in-from-bottom-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : toast.type === 'info' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18}/> : toast.type === 'info' ? <AlertCircle size={18}/> : <AlertCircle size={18}/>}
                    <span className="text-sm font-bold">{toast.message}</span>
                </div>
            )}

            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default CampaignDashboard;
