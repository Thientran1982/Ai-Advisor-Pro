
import React, { useState, useEffect, useMemo } from 'react';
import { Campaign } from '../../types';
import { 
    Plus, Search, Mail, MessageCircle, 
    Smartphone, Send, BarChart3, Clock, 
    Zap, X, Trash2, Play, AlertCircle, CheckCircle2, User, RefreshCw
} from 'lucide-react';
import { dataService } from '../../services/dataService';

const CampaignDashboard = () => {
    // STATE: Fetch from DataService
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // MODAL STATES
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [isSending, setIsSending] = useState(false); // Simulating send progress

    // FORM STATE
    const [newCampaign, setNewCampaign] = useState<{name: string, channel: Campaign['channel'], content: string}>({ name: '', channel: 'zalo', content: '' });

    // 1. SYNC DATA (REAL-TIME)
    useEffect(() => {
        const sync = () => setCampaigns(dataService.getCampaigns());
        sync();
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    // 2. REAL-TIME STATS (CALCULATED FROM DATA)
    const stats = useMemo(() => {
        const totalSent = campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
        
        // Avg Open Rate (Weighted by audience size would be better, but simple avg for now)
        const completedCampaigns = campaigns.filter(c => c.status === 'completed' || c.status === 'sending');
        const avgOpenRate = completedCampaigns.length 
            ? (completedCampaigns.reduce((acc, c) => acc + (c.openRate || 0), 0) / completedCampaigns.length).toFixed(1)
            : "0.0";

        // Count Leads Re-engaged (Mock metric based on clicks)
        const leadsReEngaged = campaigns.reduce((acc, c) => acc + Math.floor((c.clickRate || 0) * (c.sentCount || 0) / 100), 0);

        return { totalSent, avgOpenRate, leadsReEngaged };
    }, [campaigns]);

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

    // --- ACTIONS ---

    const handleCreate = () => {
        if(!newCampaign.name || !newCampaign.content) return alert("Vui lòng nhập tên và nội dung chiến dịch.");
        
        const campaign: Campaign = {
            id: `camp_${Date.now()}`, 
            name: newCampaign.name, 
            channel: newCampaign.channel, 
            content: newCampaign.content,
            status: 'scheduled', 
            audienceSize: Math.floor(Math.random() * 200) + 50, // Mock audience size based on leads
            sentCount: 0, 
            openRate: 0, 
            clickRate: 0,
            createdAt: new Date(), 
            scheduledDate: new Date(Date.now() + 86400000) // Tomorrow
        };
        
        dataService.addCampaign(campaign);
        setShowCreateModal(false); 
        setNewCampaign({name: '', channel: 'zalo', content: ''});
        
        dataService.addNotification({
            id: `notif_${Date.now()}`,
            type: 'campaign',
            title: 'Chiến dịch mới',
            message: `Chiến dịch "${campaign.name}" đã được lên lịch gửi.`,
            time: new Date(),
            read: false
        });
    };

    const handleDelete = (id: string) => {
        if(confirm("Bạn có chắc chắn muốn xóa chiến dịch này không?")) {
            dataService.deleteCampaign(id);
            setSelectedCampaign(null);
        }
    };

    const handleStartSending = (campaign: Campaign) => {
        setIsSending(true);
        // Step 1: Update status to sending
        const sendingCamp = { ...campaign, status: 'sending' as const };
        dataService.updateCampaign(sendingCamp);
        setSelectedCampaign(sendingCamp);

        // Step 2: Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (progress >= 100) {
                clearInterval(interval);
                // Step 3: Complete
                const completedCamp = { 
                    ...sendingCamp, 
                    status: 'completed' as const,
                    sentCount: campaign.audienceSize,
                    openRate: Math.floor(Math.random() * 40) + 20, // Mock result
                    clickRate: Math.floor(Math.random() * 10) + 1
                };
                dataService.updateCampaign(completedCamp);
                setSelectedCampaign(completedCamp);
                setIsSending(false);
                alert(`Chiến dịch "${campaign.name}" đã gửi xong!`);
            } else {
                // Update interim progress (mocking sent count)
                const currentSent = Math.floor((progress / 100) * campaign.audienceSize);
                const updating = { ...sendingCamp, sentCount: currentSent };
                dataService.updateCampaign(updating);
                setSelectedCampaign(updating);
            }
        }, 300); // Fast simulation
    };

    const filteredCampaigns = campaigns.filter(c => {
        return (filterStatus === 'all' || c.status === filterStatus) && c.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-8 font-sans bg-[#FAFAFA]">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Chiến Dịch <span className="text-sm font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">{campaigns.length}</span>
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">Tiếp cận hàng loạt khách hàng tự động.</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95">
                    <Plus size={18} /> Tạo Mới
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
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {['all', 'sending', 'scheduled', 'completed'].map(status => (
                        <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${filterStatus === status ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
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
                    <div key={campaign.id} onClick={() => setSelectedCampaign(campaign)} className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer group flex items-center gap-6">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-110 transition-transform">
                            {getChannelIcon(campaign.channel)}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-base font-bold text-slate-900 truncate mb-1">{campaign.name}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="font-medium bg-slate-50 px-2 py-0.5 rounded-md capitalize">{campaign.channel}</span>
                                <span>•</span>
                                <span>{campaign.scheduledDate?.toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="hidden md:block w-48">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                                <span>Tiến độ</span>
                                <span>{campaign.audienceSize > 0 ? Math.round((campaign.sentCount / campaign.audienceSize) * 100) : 0}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-1000 ${campaign.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${campaign.audienceSize > 0 ? (campaign.sentCount / campaign.audienceSize) * 100 : 0}%`}}></div>
                            </div>
                        </div>

                        {/* Metrics */}
                        <div className="hidden md:flex flex-col items-end w-24">
                            <span className="text-lg font-black text-slate-900">{campaign.openRate}%</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Tỷ lệ mở</span>
                        </div>

                        {/* Status */}
                        <div className="w-28 text-right">
                             <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border ${getStatusStyle(campaign.status)}`}>
                                {campaign.status === 'sending' ? 'Đang gửi...' : campaign.status}
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

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95">
                    <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-black text-2xl text-slate-900">Chiến dịch mới</h3>
                                <p className="text-sm text-slate-500">Thiết lập gửi tin nhắn tự động.</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)}><X size={24} className="text-slate-400 hover:text-slate-600"/></button>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Tên chiến dịch</label>
                                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-colors" placeholder="VD: Chúc Tết Khách VIP" value={newCampaign.name} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Kênh gửi</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['zalo', 'sms', 'email'] as const).map(ch => (
                                        <button key={ch} onClick={() => setNewCampaign({...newCampaign, channel: ch})} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${newCampaign.channel === ch ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                            {getChannelIcon(ch)} 
                                            <span className="text-xs font-bold capitalize">{ch}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Nội dung tin nhắn</label>
                                <textarea 
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm focus:bg-white focus:border-indigo-500 outline-none transition-colors h-32 resize-none" 
                                    placeholder="Nhập nội dung tin nhắn gửi khách hàng..."
                                    value={newCampaign.content}
                                    onChange={e => setNewCampaign({...newCampaign, content: e.target.value})}
                                />
                            </div>

                            <button onClick={handleCreate} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-300 mt-2 flex items-center justify-center gap-2">
                                <Clock size={20}/> Lên Lịch Gửi
                            </button>
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
                                        {selectedCampaign.status === 'sending' ? 'Đang gửi...' : selectedCampaign.status}
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
                                    <span>{Math.round((selectedCampaign.sentCount / selectedCampaign.audienceSize) * 100)}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-300 relative overflow-hidden" 
                                        style={{width: `${(selectedCampaign.sentCount / selectedCampaign.audienceSize) * 100}%`}}
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
            
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default CampaignDashboard;
