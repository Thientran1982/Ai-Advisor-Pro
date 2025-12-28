
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, User, Plus, ArrowRight, X, Search, Check, Trash2, Ban, CheckCircle2, Pencil, CalendarDays, AlertCircle } from 'lucide-react';
import { Appointment, Lead } from '../../types';
import { dataService } from '../../services/dataService';

const SchedulePage = () => {
    // STATE
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]); // For Autocomplete
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null); // Track editing state
    
    // Toast Notification State
    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'success' });

    // FORM STATE
    const [formData, setFormData] = useState<Partial<Appointment>>({
        title: '',
        date: new Date(),
        location: '',
        note: '',
        leadId: '',
        leadName: ''
    });
    const [leadSearch, setLeadSearch] = useState('');
    const [showLeadSuggestions, setShowLeadSuggestions] = useState(false);

    // 1. DATA SYNC (REAL-TIME)
    useEffect(() => {
        const sync = () => {
            setAppointments(dataService.getAppointments().sort((a,b) => a.date.getTime() - b.date.getTime()));
            setLeads(dataService.getAllLeadsRaw());
        };
        sync();
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    // UTILS
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    // 2. HANDLERS
    const handleOpenModal = (apt?: Appointment) => {
        if (apt) {
            // Edit Mode
            setEditingId(apt.id);
            setFormData({ ...apt });
            setLeadSearch(apt.leadName);
        } else {
            // Create Mode
            setEditingId(null);
            setFormData({ title: '', date: new Date(), location: '', note: '', leadId: '', leadName: '' });
            setLeadSearch('');
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.title || !formData.date || !formData.leadName) {
            showToast("Vui lòng điền đầy đủ thông tin", "error");
            return;
        }
        
        if (editingId) {
            // UPDATE EXISTING
            const updatedApt: Appointment = {
                ...formData as Appointment,
                id: editingId, // Keep ID
                date: new Date(formData.date!) // Ensure Date object
            };
            dataService.updateAppointment(updatedApt);
            showToast("Đã cập nhật lịch hẹn thành công");
        } else {
            // CREATE NEW
            const newApt: Appointment = {
                id: `apt_${Date.now()}`,
                leadId: formData.leadId || 'guest',
                leadName: formData.leadName,
                title: formData.title,
                date: new Date(formData.date!),
                location: formData.location || 'TBC',
                status: 'upcoming',
                note: formData.note
            };
            dataService.addAppointment(newApt);
            
            // Trigger notification
            dataService.addNotification({
                id: `notif_${Date.now()}`,
                type: 'schedule',
                title: 'Lịch hẹn mới',
                message: `Bạn có lịch hẹn "${newApt.title}" vào ${newApt.date.toLocaleTimeString('vi-VN')}.`,
                time: new Date(),
                read: false
            });
            showToast("Đã thêm lịch hẹn mới");
        }

        setIsModalOpen(false);
    };

    const handleUpdateStatus = (id: string, status: 'completed' | 'cancelled') => {
        dataService.updateAppointmentStatus(id, status);
        showToast(status === 'completed' ? "Đã hoàn thành lịch hẹn" : "Đã hủy lịch hẹn", "info");
    };

    const handleDelete = (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa?")) { // Still keep confirm for delete as safety
            dataService.deleteAppointment(id);
            showToast("Đã xóa lịch hẹn", "error");
        }
    };

    const filtered = appointments.filter(a => filter === 'all' || a.status === filter);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'upcoming': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'cancelled': return 'bg-slate-50 text-slate-500 border-slate-100';
            default: return 'bg-slate-50 text-slate-700';
        }
    };

    return (
        <div className="h-full bg-[#FAFAFA] flex flex-col font-sans relative">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-5 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Lịch Trình <span className="text-sm font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{filtered.length}</span>
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Quản lý cuộc hẹn và dẫn khách.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="px-5 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg active:scale-95 text-xs md:text-sm"
                >
                    <Plus size={18}/> Thêm Lịch Hẹn
                </button>
            </div>

            {/* Filter */}
            <div className="px-6 pt-6 pb-2">
                <div className="inline-flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {['upcoming', 'completed', 'all'].map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            {f === 'upcoming' ? 'Sắp diễn ra' : f === 'completed' ? 'Hoàn thành' : 'Tất cả'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 relative">
                {/* Timeline Line */}
                {filtered.length > 0 && (
                    <div className="absolute left-[38px] top-6 bottom-6 w-0.5 bg-slate-200 z-0 hidden md:block"></div>
                )}

                {filtered.length > 0 ? filtered.map((apt, index) => (
                    <div key={apt.id} className="relative z-10 flex gap-6 group animate-in slide-in-from-bottom-2 duration-300" style={{animationDelay: `${index * 50}ms`}}>
                        {/* Time Column (Desktop) */}
                        <div className="hidden md:flex flex-col items-center w-16 pt-2 shrink-0">
                            <div className={`w-3 h-3 rounded-full ring-4 ring-[#FAFAFA] transition-all mb-2 ${apt.status === 'upcoming' ? 'bg-indigo-500 group-hover:bg-indigo-600' : apt.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            <span className="text-xs font-bold text-slate-500">{new Date(apt.date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>

                        {/* Card */}
                        <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all hover:border-indigo-200 group-hover:-translate-y-0.5 relative overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border ${getStatusColor(apt.status)}`}>
                                            {apt.status === 'upcoming' ? 'Sắp diễn ra' : apt.status === 'completed' ? 'Đã xong' : 'Đã hủy'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 md:hidden">
                                            <Clock size={12}/> {new Date(apt.date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-lg font-black text-slate-900 mb-1 leading-tight group-hover:text-indigo-700 transition-colors cursor-pointer" onClick={() => handleOpenModal(apt)}>
                                        {apt.title}
                                    </h3>
                                    
                                    <div className="flex flex-col gap-1.5 mt-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                            <MapPin size={16} className="text-indigo-500"/> {apt.location}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <User size={16} className="text-indigo-500"/> {apt.leadName}
                                        </div>
                                    </div>

                                    {apt.note && (
                                        <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 italic border border-slate-100">
                                            "{apt.note}"
                                        </div>
                                    )}
                                </div>

                                {/* Date Box (Mobile/Desktop) */}
                                <div className="flex flex-row md:flex-col items-center md:justify-center justify-between gap-4 pt-4 md:pt-0 md:pl-6 md:border-l border-slate-100 shrink-0">
                                    <div className="text-center">
                                        <span className="block text-xs font-bold text-slate-400 uppercase">{new Date(apt.date).toLocaleDateString('vi-VN', {weekday: 'short'})}</span>
                                        <span className="block text-3xl font-black text-slate-900">{new Date(apt.date).getDate()}</span>
                                        <span className="block text-xs font-bold text-slate-400 uppercase">Tháng {new Date(apt.date).getMonth() + 1}</span>
                                    </div>
                                </div>
                            </div>

                            {/* HOVER ACTIONS */}
                            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur rounded-xl p-1 shadow-sm border border-slate-100 z-20">
                                <button 
                                    onClick={() => handleOpenModal(apt)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Chỉnh sửa"
                                >
                                    <Pencil size={18}/>
                                </button>
                                {apt.status === 'upcoming' && (
                                    <>
                                        <button 
                                            onClick={() => handleUpdateStatus(apt.id, 'completed')}
                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                                            title="Hoàn thành"
                                        >
                                            <CheckCircle2 size={18}/>
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                                            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" 
                                            title="Hủy lịch"
                                        >
                                            <Ban size={18}/>
                                        </button>
                                    </>
                                )}
                                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                <button 
                                    onClick={() => handleDelete(apt.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                    title="Xóa"
                                >
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center h-96 text-center">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <CalendarDays size={40} className="text-slate-300"/>
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Không có lịch hẹn</h3>
                        <p className="text-slate-500 text-sm">Bạn chưa có lịch hẹn nào trong danh sách này.</p>
                        <button onClick={() => handleOpenModal()} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">Tạo lịch hẹn ngay</button>
                    </div>
                )}
            </div>

            {/* CREATE/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95">
                    <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl relative overflow-visible">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-2xl text-slate-900">{editingId ? 'Cập Nhật Lịch Hẹn' : 'Tạo Lịch Hẹn Mới'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                                <X size={24}/>
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Lead Autocomplete */}
                            <div className="relative">
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1 block">Khách hàng</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={leadSearch || ''}
                                        onChange={(e) => { 
                                            setLeadSearch(e.target.value); 
                                            setShowLeadSuggestions(true); 
                                            if (e.target.value === '') {
                                                setFormData({...formData, leadId: '', leadName: ''});
                                            }
                                        }}
                                        onFocus={() => setShowLeadSuggestions(true)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500 outline-none transition-colors"
                                        placeholder="Nhập tên khách hàng..."
                                    />
                                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                                </div>
                                {showLeadSuggestions && leadSearch && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                        {leads.filter(l => l.name.toLowerCase().includes(leadSearch.toLowerCase())).map(lead => (
                                            <div 
                                                key={lead.id} 
                                                className="p-3 hover:bg-indigo-50 cursor-pointer flex items-center gap-3 transition-colors"
                                                onClick={() => {
                                                    setFormData({ ...formData, leadId: lead.id, leadName: lead.name });
                                                    setLeadSearch(lead.name);
                                                    setShowLeadSuggestions(false);
                                                }}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                    {lead.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                                                    <p className="text-[10px] text-slate-500">{lead.phone}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {leads.filter(l => l.name.toLowerCase().includes(leadSearch.toLowerCase())).length === 0 && (
                                            <div className="p-4 text-center text-xs text-slate-400">Không tìm thấy khách hàng. <br/>Vui lòng thêm khách mới ở Dashboard.</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1 block">Tiêu đề</label>
                                <input 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-indigo-500 transition-colors" 
                                    placeholder="VD: Dẫn đi xem Eaton Park"
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1 block">Thời gian</label>
                                    <input 
                                        type="datetime-local"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                                        // Handle safe date parsing
                                        value={formData.date ? new Date(formData.date.getTime() - (formData.date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''}
                                        onChange={e => setFormData({...formData, date: new Date(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1 block">Địa điểm</label>
                                    <input 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-indigo-500 transition-colors" 
                                        placeholder="VD: Sales Gallery"
                                        value={formData.location}
                                        onChange={e => setFormData({...formData, location: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1 block">Ghi chú</label>
                                <textarea 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:bg-white focus:border-indigo-500 transition-colors h-24 resize-none" 
                                    placeholder="Ghi chú thêm về khách hàng..."
                                    value={formData.note}
                                    onChange={e => setFormData({...formData, note: e.target.value})}
                                />
                            </div>

                            <button 
                                onClick={handleSave}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-95"
                            >
                                {editingId ? <Check size={20}/> : <Plus size={20}/>} {editingId ? 'Cập Nhật' : 'Tạo Lịch Hẹn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATION */}
            {toast.show && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[110] animate-in fade-in slide-in-from-bottom-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
                    {toast.type === 'success' && <CheckCircle2 size={18}/>}
                    {toast.type === 'error' && <AlertCircle size={18}/>}
                    {toast.type === 'info' && <Clock size={18}/>}
                    <span className="text-sm font-bold">{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default SchedulePage;
