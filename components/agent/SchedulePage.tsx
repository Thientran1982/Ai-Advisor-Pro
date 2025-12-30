import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, User, Plus, X, Search, Check, Trash2, Ban, CheckCircle2, Pencil, CalendarDays, AlertCircle, Navigation, Map } from 'lucide-react';
import { Appointment, Lead } from '../../types';
import { dataService } from '../../services/dataService';

const SchedulePage = () => {
    // STATE
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]); // For Autocomplete
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null); 
    
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
    const [timeConflict, setTimeConflict] = useState<boolean>(false);

    // 1. DATA SYNC (REAL-TIME)
    useEffect(() => {
        const sync = () => {
            // Sort by date ascending
            setAppointments(dataService.getAppointments().sort((a,b) => a.date.getTime() - b.date.getTime()));
            setLeads(dataService.getAllLeadsRaw());
        };
        sync();
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    // 2. SMART GROUPING LOGIC (Group by Date)
    const groupedAppointments = useMemo(() => {
        const filtered = appointments.filter(a => filter === 'all' || a.status === filter);
        const groups: Record<string, Appointment[]> = {};
        
        filtered.forEach(apt => {
            const dateKey = apt.date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(apt);
        });

        return groups;
    }, [appointments, filter]);

    // 3. CONFLICT DETECTION LOGIC
    useEffect(() => {
        if (!formData.date || !isModalOpen) return;
        const selectedTime = new Date(formData.date).getTime();
        
        // Check conflict within 1 hour window, excluding current editing item
        const hasConflict = appointments.some(a => {
            if (editingId && a.id === editingId) return false;
            if (a.status === 'cancelled') return false;
            const existingTime = a.date.getTime();
            return Math.abs(existingTime - selectedTime) < 60 * 60 * 1000; // 1 Hour Buffer
        });

        setTimeConflict(hasConflict);
    }, [formData.date, appointments, editingId, isModalOpen]);

    // UTILS
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const handleOpenModal = (apt?: Appointment) => {
        if (apt) {
            setEditingId(apt.id);
            setFormData({ ...apt });
            setLeadSearch(apt.leadName);
        } else {
            setEditingId(null);
            // Default to next hour rounded
            const nextHour = new Date();
            nextHour.setMinutes(0, 0, 0);
            nextHour.setHours(nextHour.getHours() + 1);
            setFormData({ title: '', date: nextHour, location: '', note: '', leadId: '', leadName: '' });
            setLeadSearch('');
        }
        setTimeConflict(false);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.title || !formData.date || !formData.leadName) {
            showToast("Vui lòng điền đầy đủ thông tin", "error");
            return;
        }
        
        if (editingId) {
            const updatedApt: Appointment = {
                ...formData as Appointment,
                id: editingId,
                date: new Date(formData.date!) 
            };
            dataService.updateAppointment(updatedApt);
            showToast("Đã cập nhật lịch hẹn thành công");
        } else {
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

    const handleUpdateStatus = (e: React.MouseEvent, id: string, status: 'completed' | 'cancelled') => {
        e.stopPropagation();
        dataService.updateAppointmentStatus(id, status);
        showToast(status === 'completed' ? "Đã hoàn thành lịch hẹn" : "Đã hủy lịch hẹn", "info");
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Bạn có chắc chắn muốn xóa?")) {
            dataService.deleteAppointment(id);
            showToast("Đã xóa lịch hẹn", "error");
        }
    };

    const openMap = (e: React.MouseEvent, location: string) => {
        e.stopPropagation();
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
    };

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
            <div className="bg-white border-b border-slate-200 px-6 py-5 flex justify-between items-center shrink-0 z-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Lịch Trình <span className="text-sm font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{appointments.filter(a => a.status === 'upcoming').length} sắp tới</span>
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Quản lý cuộc hẹn và dẫn khách.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="px-5 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg active:scale-95 text-xs md:text-sm"
                >
                    <Plus size={18}/> Thêm Lịch
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

            {/* List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
                {Object.keys(groupedAppointments).length > 0 ? Object.entries(groupedAppointments).map(([dateKey, groupApts]) => (
                    <div key={dateKey} className="animate-in slide-in-from-bottom-2 duration-500">
                        {/* Date Header */}
                        <div className="flex items-center gap-3 mb-4 sticky top-0 bg-[#FAFAFA]/95 backdrop-blur py-2 z-10">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-100"></div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">{dateKey}</h3>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        {/* Appointments Grid */}
                        <div className="grid grid-cols-1 gap-4">
                            {(groupApts as Appointment[]).map((apt, index) => (
                                <div 
                                    key={apt.id} 
                                    onClick={() => handleOpenModal(apt)}
                                    className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    {/* Left Border Status Indicator */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${apt.status === 'upcoming' ? 'bg-indigo-500' : apt.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-3">
                                        
                                        {/* Time & Title */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                    <Clock size={14} className={apt.status === 'upcoming' ? "text-indigo-600" : "text-slate-400"}/>
                                                    <span className={`text-xs font-black ${apt.status === 'upcoming' ? 'text-indigo-700' : 'text-slate-500'}`}>
                                                        {new Date(apt.date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(apt.status)}`}>
                                                    {apt.status === 'upcoming' ? 'Sắp tới' : apt.status === 'completed' ? 'Xong' : 'Hủy'}
                                                </span>
                                            </div>
                                            <h4 className="text-base font-bold text-slate-900 truncate">{apt.title}</h4>
                                            
                                            <div className="flex flex-wrap gap-4 mt-2">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                    <User size={14} className="text-slate-400"/> {apt.leadName}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 group/loc" onClick={(e) => openMap(e, apt.location)}>
                                                    <MapPin size={14} className="text-slate-400 group-hover/loc:text-red-500 transition-colors"/> 
                                                    <span className="group-hover/loc:text-indigo-600 group-hover/loc:underline decoration-indigo-300 underline-offset-2 transition-all">{apt.location}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions (Desktop: Hover, Mobile: Always visible but smaller) */}
                                        <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            {apt.status === 'upcoming' && (
                                                <button 
                                                    onClick={(e) => handleUpdateStatus(e, apt.id, 'completed')}
                                                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-100" title="Hoàn thành"
                                                >
                                                    <CheckCircle2 size={18}/>
                                                </button>
                                            )}
                                            <button 
                                                onClick={(e) => openMap(e, apt.location)}
                                                className="p-2 bg-slate-50 text-slate-500 hover:bg-white hover:text-red-500 hover:shadow-sm rounded-xl transition-all border border-slate-100" title="Mở bản đồ"
                                            >
                                                <Map size={18}/>
                                            </button>
                                            <div className="w-px h-6 bg-slate-100 mx-1"></div>
                                            <button 
                                                onClick={(e) => handleDelete(e, apt.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Xóa"
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <CalendarDays size={40} className="text-slate-300"/>
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Chưa có lịch hẹn nào</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">Danh sách trống. Hãy lên lịch hẹn với khách hàng ngay.</p>
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
                                        className={`w-full p-3 bg-slate-50 border rounded-2xl font-bold text-sm outline-none focus:bg-white transition-colors ${timeConflict ? 'border-red-300 bg-red-50 text-red-900' : 'border-slate-200 focus:border-indigo-500'}`}
                                        value={formData.date ? new Date(formData.date.getTime() - (formData.date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''}
                                        onChange={e => setFormData({...formData, date: new Date(e.target.value)})}
                                    />
                                    {timeConflict && (
                                        <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle size={10}/> Cảnh báo: Trùng lịch hẹn khác!
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1 block">Địa điểm</label>
                                    <div className="relative">
                                        <input 
                                            className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-indigo-500 transition-colors" 
                                            placeholder="VD: Sales Gallery"
                                            value={formData.location}
                                            onChange={e => setFormData({...formData, location: e.target.value})}
                                        />
                                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                    </div>
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