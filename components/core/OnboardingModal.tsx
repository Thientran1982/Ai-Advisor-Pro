
import React, { useState } from 'react';
import { Check, ArrowRight, User } from 'lucide-react';
import { TenantProfile } from '../../types';
import BrandLogo from '../common/BrandLogo';

interface OnboardingModalProps {
    user: TenantProfile;
    onComplete: (data: Partial<TenantProfile>) => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ user, onComplete }) => {
    const [step, setStep] = useState(1);
    const [brandName, setBrandName] = useState(user.name);
    const [selectedFocus, setSelectedFocus] = useState<string[]>([]);

    const handleFinish = () => { onComplete({ name: brandName }); };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden relative border border-white/20">
                <div className="h-1.5 w-full bg-slate-100"><div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }}></div></div>
                <div className="p-8 md:p-10">
                    {step === 1 ? (
                        <div className="space-y-8 animate-in slide-in-from-right fade-in duration-500">
                            {/* BRAND LOGO REPLACEMENT */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="mb-6 scale-110">
                                    <BrandLogo size="xl" variant="icon" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 mb-2 text-center tracking-tight">Chào mừng đối tác!</h2>
                                <p className="text-slate-500 text-center font-medium max-w-xs mx-auto text-sm leading-relaxed">
                                    Hãy thiết lập hồ sơ để <span className="text-indigo-600 font-bold">Advisor Pro</span> hiểu phong cách tư vấn của bạn.
                                </p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-2 ml-1">Tên hiển thị với khách hàng</label>
                                <div className="relative group">
                                    <input 
                                        type="text" 
                                        value={brandName} 
                                        onChange={(e) => setBrandName(e.target.value)} 
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm group-hover:bg-white" 
                                        placeholder="VD: Tuấn Villas" 
                                        autoFocus
                                    />
                                    <User size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"/>
                                </div>
                            </div>
                            
                            <button onClick={() => setStep(2)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 group">
                                Tiếp tục <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-right fade-in duration-500">
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Bạn chuyên phân khúc nào?</h2>
                                <p className="text-slate-500 text-sm">Trợ lý sẽ ưu tiên tư vấn các dự án thuộc thế mạnh của bạn.</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {['Căn hộ cao cấp', 'Nhà phố/Biệt thự', 'Đất nền', 'Cho thuê'].map((type) => (
                                    <button 
                                        key={type} 
                                        onClick={() => setSelectedFocus(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])} 
                                        className={`p-4 rounded-2xl border text-sm font-bold transition-all h-24 flex items-center justify-center text-center leading-tight shadow-sm active:scale-95 ${selectedFocus.includes(type) ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-200'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            
                            <button onClick={handleFinish} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95">
                                <Check size={20} strokeWidth={3} /> Hoàn tất & Vào Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
