import React from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface LegalModalProps { type: 'privacy' | 'terms' | null; onClose: () => void; }

const LegalModals: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;
  const content = type === 'privacy' ? (<div className="space-y-4"><h3 className="font-bold text-lg">1. Thu thập dữ liệu</h3><p>Advisor Pro thu thập thông tin cá nhân (Tên, Email, SĐT) chỉ nhằm mục đích cung cấp dịch vụ tư vấn Bất động sản và quản lý khách hàng (CRM).</p></div>) : (<div className="space-y-4"><h3 className="font-bold text-lg">1. Chấp thuận</h3><p>Bằng việc đăng ký tài khoản, bạn đồng ý với mọi điều khoản được nêu tại đây.</p></div>);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center"><div className="flex items-center gap-2 text-indigo-900">{type === 'privacy' ? <Shield size={24} className="text-indigo-600"/> : <FileText size={24} className="text-indigo-600"/>}<h2 className="text-xl font-bold">{type === 'privacy' ? 'Chính Sách Bảo Mật' : 'Điều Khoản Sử Dụng'}</h2></div><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button></div>
        <div className="p-6 overflow-y-auto custom-scrollbar text-slate-600 leading-relaxed text-sm">{content}</div>
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl text-right"><button onClick={onClose} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">Đã Hiểu</button></div>
      </div>
    </div>
  );
};

export default LegalModals;