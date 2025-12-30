
import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, UserPlus, TrendingUp, Sparkles, Trash2, Mail, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { AppNotification } from '../../types';
import { dataService } from '../../services/dataService';

// Add navigation prop
interface NotificationCenterProps {
    onNavigate?: (view: 'dashboard' | 'schedule' | 'campaigns' | 'knowledge' | 'notifications' | 'settings' | 'guide') => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        // Initial load
        setNotifications(dataService.getNotifications());

        // Listen for live updates
        const handleStorageChange = () => {
            setNotifications(dataService.getNotifications());
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const markAllRead = () => {
        dataService.markNotificationsRead();
        setNotifications(prev => prev.map(n => ({...n, read: true})));
    };

    // 🔥 NEW: Delete All Logic
    const deleteAll = () => {
        if (!confirm("Bạn có chắc muốn xóa toàn bộ thông báo?")) return;
        // In a real app, this would be a bulk API call. 
        // For local storage mock, we just filter everything out manually in UI then update Service if needed
        // Since dataService doesn't have deleteAll, we iterate (inefficient but works for mock)
        // Ideally dataService needs a `clearNotifications` method. 
        // For now, let's simulate visual clear and lazy delete or just keep it simple:
        const ids = notifications.map(n => n.id);
        ids.forEach(id => dataService.deleteNotification(id));
        setNotifications([]);
    };

    // 🔥 NEW: Navigation Logic
    const handleItemClick = (n: AppNotification) => {
        if (!n.read) {
            dataService.markOneNotificationRead(n.id);
            // Optimistic update
            setNotifications(prev => prev.map(item => item.id === n.id ? {...item, read: true} : item));
        }
        
        // Navigation Routing
        if (onNavigate) {
            switch(n.type) {
                case 'lead': 
                    onNavigate('dashboard'); 
                    break;
                case 'campaign': 
                    onNavigate('campaigns'); 
                    break;
                case 'schedule': 
                    onNavigate('schedule'); 
                    break;
                default: 
                    break; // System notifications might just stay here
            }
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        dataService.deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // 🔥 NEW: Relative Time Formatter
    const formatTimeAgo = (dateStr: Date) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        if (diffInSeconds < 259200) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    const getIcon = (type: string) => {
        switch(type) {
            case 'lead': return <div className="p-2.5 bg-blue-100 text-blue-600 rounded-full ring-4 ring-blue-50 shadow-sm"><UserPlus size={18}/></div>;
            case 'campaign': return <div className="p-2.5 bg-purple-100 text-purple-600 rounded-full ring-4 ring-purple-50 shadow-sm"><Mail size={18}/></div>;
            case 'schedule': return <div className="p-2.5 bg-orange-100 text-orange-600 rounded-full ring-4 ring-orange-50 shadow-sm"><Calendar size={18}/></div>;
            case 'system': return <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-full ring-4 ring-emerald-50 shadow-sm"><Sparkles size={18}/></div>;
            default: return <div className="p-2.5 bg-slate-100 text-slate-600 rounded-full ring-4 ring-slate-50 shadow-sm"><Bell size={18}/></div>;
        }
    };

    const filteredList = notifications.filter(n => filter === 'all' || !n.read);
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="h-full bg-[#FAFAFA] flex flex-col font-sans">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 md:px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-sm z-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Thông Báo <span className="text-sm font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{unreadCount} mới</span>
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Cập nhật hoạt động kinh doanh của bạn.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button 
                            onClick={() => setFilter('all')} 
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tất cả
                        </button>
                        <button 
                            onClick={() => setFilter('unread')} 
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'unread' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Chưa đọc
                        </button>
                    </div>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 border border-indigo-100/50 hover:border-indigo-100">
                            <CheckCircle2 size={16}/> Đọc tất cả
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button onClick={deleteAll} className="text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5" title="Xóa toàn bộ">
                            <Trash2 size={16}/>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                <div className="max-w-3xl mx-auto space-y-3">
                    {filteredList.length > 0 ? filteredList.map((n, index) => (
                        <div 
                            key={n.id} 
                            onClick={() => handleItemClick(n)}
                            className={`
                                group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer animate-in slide-in-from-bottom-2 select-none
                                ${n.read 
                                    ? 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md' 
                                    : 'bg-white border-indigo-200 shadow-lg shadow-indigo-100/30 hover:shadow-xl hover:-translate-y-0.5'
                                }
                            `}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Unread Dot */}
                            {!n.read && (
                                <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse shadow-sm ring-4 ring-indigo-50"></div>
                            )}
                            
                            <div className="flex gap-5">
                                <div className="shrink-0 pt-1">{getIcon(n.type)}</div>
                                <div className="flex-1 min-w-0 pr-6">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-sm font-bold truncate pr-4 ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</h4>
                                    </div>
                                    <p className={`text-xs leading-relaxed line-clamp-2 ${n.read ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>{n.message}</p>
                                    <div className="mt-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md">
                                                <Clock size={10}/> {formatTimeAgo(n.time)}
                                            </span>
                                            {/* Action Prompt */}
                                            {!n.read && n.type !== 'system' && (
                                                <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Xem ngay <ArrowRight size={10}/>
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Delete Button: Visible on Mobile, Hover on Desktop */}
                                        <button 
                                            onClick={(e) => handleDelete(e, n.id)}
                                            className="md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg active:scale-95"
                                            title="Xóa thông báo"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-200">
                                <Bell size={40} className="text-slate-300"/>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Không có thông báo nào</h3>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                                {filter === 'unread' ? "Tuyệt vời! Bạn đã đọc hết tất cả thông báo quan trọng." : "Hệ thống sẽ gửi thông báo khi có khách hàng mới hoặc lịch hẹn sắp tới."}
                            </p>
                            {filter === 'unread' && (
                                <button onClick={() => setFilter('all')} className="mt-6 text-indigo-600 font-bold text-sm hover:underline">Xem tất cả lịch sử</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
