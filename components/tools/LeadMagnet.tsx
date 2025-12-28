
import React, { useState } from 'react';
import { Download, Mail, CheckCircle, FileText, Loader2 } from 'lucide-react';

interface LeadMagnetProps {
    title?: string;
    description?: string;
    onSuccess?: (data: { email: string }) => void;
}

const LeadMagnet: React.FC<LeadMagnetProps> = ({ title = "Tải Bảng Giá Chi Tiết & CSBH Mới Nhất", description = "Nhận file PDF phân tích dòng tiền và ưu đãi độc quyền tháng này.", onSuccess }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); if(!email) return; setStatus('loading');
        setTimeout(() => { setStatus('success'); if (onSuccess) { onSuccess({ email: email }); } }, 1000);
    };

    if (status === 'success') { return (<div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mt-2 max-w-sm animate-in zoom-in-95"><div className="flex flex-col items-center text-center"><div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3"><CheckCircle size={24} /></div><h4 className="font-bold text-emerald-800 text-sm mb-1">Đã gửi tài liệu thành công!</h4><p className="text-xs text-emerald-600">Hệ thống đã tự động lưu thông tin của bạn vào danh sách ưu tiên.</p></div></div>); }

    return (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-5 mt-2 max-w-sm text-white shadow-xl relative overflow-hidden group border border-indigo-500/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[50px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative z-10">
                <div className="flex items-start gap-3 mb-3"><div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10"><FileText size={20} className="text-indigo-300" /></div><div><h4 className="font-bold text-sm leading-tight mb-1">{title}</h4><p className="text-[11px] text-slate-300 leading-normal">{description}</p></div></div>
                <form onSubmit={handleSubmit} className="space-y-3"><div className="relative"><input type="email" required placeholder="Nhập Email của bạn..." value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/20 transition-all" /><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /></div><button type="submit" disabled={status === 'loading'} className="w-full py-2.5 bg-white text-indigo-900 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/20">{status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}{status === 'loading' ? 'Đang xử lý...' : 'Tải xuống ngay'}</button></form>
            </div>
        </div>
    );
};

export default LeadMagnet;
