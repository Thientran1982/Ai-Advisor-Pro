
import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2, ChevronLeft, KeyRound, Eye, EyeOff, AlertCircle, Crown, Zap, CreditCard, ShieldCheck, Calendar, Server, QrCode, Smartphone, Copy, Check, FileText } from 'lucide-react';
import { authService } from '../../services/authService';
import BrandLogo from '../common/BrandLogo';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: any) => void;
    initialMode?: 'login' | 'register';
    initialPlan?: 'free' | 'pro';
}

// --- PLATFORM BANKING CONFIGURATION (SAAS OWNER INFO) ---
const PLATFORM_BANK = {
    bankId: 'MB', // MBBank (Military Bank)
    bankName: 'MB Quân Đội',
    accountNo: '030098889999', // Dedicated Account for SaaS Subscription
    accountName: 'CTCP CONG NGHE ADVISOR AI', // Official Company Name
    template: 'compact2' // VietQR Template Style
};

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, initialMode = 'login', initialPlan = 'free' }) => {
    // VIEWS: 'forgot_email' -> 'forgot_otp' -> 'login'
    const [view, setView] = useState<'login' | 'register' | 'forgot_email' | 'forgot_otp' | 'payment'>(initialMode);
    const [isLoading, setIsLoading] = useState(false);
    
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'qr'>('qr'); 
    const [processingStage, setProcessingStage] = useState<string>(''); 
    const [qrCopied, setQrCopied] = useState<{acc: boolean, content: boolean}>({ acc: false, content: false });
    
    const [globalError, setGlobalError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        otp: '', // NEW: OTP Field
        newPassword: '', // NEW: New Pass Field
        termsAgreed: false // NEW: Terms Checkbox
    });

    const [cardData, setCardData] = useState({
        number: '',
        expiry: '',
        cvc: '',
        holder: ''
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setView(initialMode);
            setGlobalError('');
            setSuccessMsg('');
            setProcessingStage('');
            setPaymentMethod('qr'); 
            setFormData({ email: '', password: '', confirmPassword: '', fullName: '', phone: '', otp: '', newPassword: '', termsAgreed: false });
            setCardData({ number: '', expiry: '', cvc: '', holder: '' });
            setFieldErrors({});
        }
    }, [isOpen, initialMode]);

    if (!isOpen) return null;

    // --- VIETQR GENERATOR LOGIC ---
    const transferContent = `PRO ${formData.phone.replace(/\D/g, '').slice(-9)}`; 
    const qrUrl = `https://img.vietqr.io/image/${PLATFORM_BANK.bankId}-${PLATFORM_BANK.accountNo}-${PLATFORM_BANK.template}.png?amount=499000&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(PLATFORM_BANK.accountName)}`;

    // --- VALIDATION ENGINE ---
    const validateField = (name: string, value: any) => {
        let error = '';
        const strVal = String(value).trim();

        switch (name) {
            case 'email':
                if (!strVal) error = 'Vui lòng nhập Email.';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) error = 'Email không đúng định dạng.';
                break;
            case 'password':
                if (!value) error = 'Vui lòng nhập mật khẩu.';
                else if (view === 'register' && value.length < 6) error = 'Mật khẩu phải có ít nhất 6 ký tự.';
                break;
            case 'confirmPassword':
                if (view === 'register') {
                    if (!value) error = 'Vui lòng xác nhận mật khẩu.';
                    else if (value !== formData.password) error = 'Mật khẩu xác nhận không khớp.';
                }
                break;
            case 'fullName':
                if (view === 'register' && !strVal) error = 'Vui lòng nhập họ tên.';
                break;
            case 'phone':
                if (view === 'register') {
                    if (!strVal) error = 'Vui lòng nhập SĐT.';
                    else if (!/(84|0[3|5|7|8|9])+([0-9]{8})\b/g.test(strVal)) error = 'Số điện thoại không hợp lệ.';
                }
                break;
            case 'termsAgreed':
                if (view === 'register' && !value) error = 'Bạn cần đồng ý điều khoản.';
                break;
            case 'otp':
                if (view === 'forgot_otp' && (!strVal || strVal.length !== 6)) error = 'Mã OTP gồm 6 chữ số.';
                break;
            case 'newPassword':
                if (view === 'forgot_otp' && strVal.length < 6) error = 'Mật khẩu mới quá ngắn.';
                break;
        }

        setFieldErrors(prev => ({ ...prev, [name]: error }));
        return error;
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        validateField(e.target.name, e.target.value);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
    };

    // --- PAYMENT HELPERS ---
    const formatCardNumber = (val: string) => val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
    const formatExpiry = (val: string) => val.replace(/\D/g, '').replace(/(.{2})/, '$1/').slice(0, 5);

    const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === 'number') formattedValue = formatCardNumber(value);
        if (name === 'expiry') formattedValue = formatExpiry(value);
        if (name === 'holder') formattedValue = value.toUpperCase();
        
        setCardData(prev => ({ ...prev, [name]: formattedValue }));
    };

    const copyToClipboard = (text: string, type: 'acc' | 'content') => {
        navigator.clipboard.writeText(text);
        setQrCopied(prev => ({ ...prev, [type]: true }));
        setTimeout(() => setQrCopied(prev => ({ ...prev, [type]: false })), 2000);
    };

    // --- MAIN SUBMIT HANDLER ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGlobalError('');
        setSuccessMsg('');

        // 1. LOGIN FLOW
        if (view === 'login') {
            if (validateField('email', formData.email)) return;
            if (validateField('password', formData.password)) return;
            
            setIsLoading(true);
            await new Promise(r => setTimeout(r, 800));
            const res = authService.login(formData.email, formData.password);
            setIsLoading(false);
            
            if (res.success && res.user) {
                onLoginSuccess(res.user);
                onClose();
            } else {
                setGlobalError(res.message || 'Đăng nhập thất bại');
            }
            return;
        }

        // 2. REGISTRATION FLOW
        if (view === 'register') {
            const errors: Record<string, string> = {};
            if (validateField('fullName', formData.fullName)) errors.fullName = 'Error';
            if (validateField('phone', formData.phone)) errors.phone = 'Error';
            if (validateField('email', formData.email)) errors.email = 'Error';
            if (validateField('password', formData.password)) errors.password = 'Error';
            if (validateField('confirmPassword', formData.confirmPassword)) errors.confirmPassword = 'Error';
            if (validateField('termsAgreed', formData.termsAgreed)) errors.termsAgreed = 'Error';

            if (Object.keys(errors).length > 0) return;

            if (initialPlan === 'pro') {
                setView('payment'); 
                return;
            }

            setIsLoading(true);
            await new Promise(r => setTimeout(r, 800));
            const res = authService.register({
                email: formData.email,
                password: formData.password,
                name: formData.fullName,
                phone: formData.phone,
                subscription: 'free'
            });
            setIsLoading(false);

            if (res.success && res.user) {
                onLoginSuccess(res.user);
                onClose();
            } else {
                setGlobalError(res.message || 'Đăng ký thất bại');
            }
            return;
        }

        // 3. PAYMENT FLOW
        if (view === 'payment') {
            setIsLoading(true);

            if (paymentMethod === 'card') {
                if (cardData.number.length < 19 || cardData.cvc.length < 3 || !cardData.expiry) {
                    setGlobalError("Vui lòng kiểm tra lại thông tin thẻ.");
                    setIsLoading(false);
                    return;
                }
                setProcessingStage('Đang xác thực thẻ...');
                await new Promise(r => setTimeout(r, 1500));
                setProcessingStage('Kết nối Gateway...');
                await new Promise(r => setTimeout(r, 1500));
            } else {
                setProcessingStage('Đang tìm kiếm giao dịch...');
                await new Promise(r => setTimeout(r, 2000));
                setProcessingStage(`Đã nhận ${transferContent}...`);
                await new Promise(r => setTimeout(r, 1500));
            }

            setProcessingStage('Kích hoạt tài khoản Pro...');
            await new Promise(r => setTimeout(r, 800));

            const res = authService.register({
                email: formData.email,
                password: formData.password,
                name: formData.fullName,
                phone: formData.phone,
                subscription: 'pro_agent'
            });
            
            setIsLoading(false);
            setProcessingStage('');

            if (res.success && res.user) {
                setSuccessMsg("Thanh toán thành công! Đang chuyển hướng...");
                setTimeout(() => {
                    onLoginSuccess(res.user);
                    onClose();
                }, 1000);
            } else {
                setGlobalError("Giao dịch thất bại. Vui lòng thử lại.");
            }
            return;
        }

        // 4. FORGOT PASSWORD FLOW
        if (view === 'forgot_email') {
            if (validateField('email', formData.email)) return;
            setIsLoading(true);
            await new Promise(r => setTimeout(r, 800));
            const res = authService.requestPasswordReset(formData.email);
            setIsLoading(false);
            
            if (res.success) {
                setSuccessMsg(res.message);
                setTimeout(() => {
                    setSuccessMsg(''); // Clear success msg to not confuse user in next step
                    setView('forgot_otp');
                }, 2000);
            } else {
                setGlobalError(res.message);
            }
            return;
        }

        if (view === 'forgot_otp') {
            if (validateField('otp', formData.otp)) return;
            if (validateField('newPassword', formData.newPassword)) return;
            
            setIsLoading(true);
            await new Promise(r => setTimeout(r, 800));
            const res = authService.confirmPasswordReset(formData.email, formData.otp, formData.newPassword);
            setIsLoading(false);

            if (res.success) {
                setSuccessMsg(res.message);
                setTimeout(() => {
                    setView('login');
                    setSuccessMsg('Mật khẩu đã được đổi. Vui lòng đăng nhập.');
                }, 1500);
            } else {
                setGlobalError(res.message);
            }
            return;
        }
    };

    // Helper for Input Styling
    const getInputClass = (fieldName: string) => `
        w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-bold outline-none transition-all
        ${fieldErrors[fieldName] 
            ? 'bg-red-50 border-red-300 text-red-900 placeholder:text-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
            : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
        }
    `;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden relative flex flex-col transition-all duration-300 max-h-[90dvh]">
                
                {/* HEADER */}
                <div className="shrink-0 p-8 pb-2 text-center bg-white relative z-20">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10" disabled={isLoading}>
                        <X size={20} />
                    </button>

                    {(view === 'forgot_email' || view === 'forgot_otp' || view === 'payment') && !isLoading && (
                        <button onClick={() => { 
                            if (view === 'payment') setView('register');
                            else if (view === 'forgot_otp') setView('forgot_email');
                            else { setView('login'); setGlobalError(''); setSuccessMsg(''); setFieldErrors({}); }
                        }} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10 flex items-center gap-1 text-xs font-bold">
                            <ChevronLeft size={16} /> Quay lại
                        </button>
                    )}

                    <div className="flex justify-center mb-6">
                        <BrandLogo size="md" />
                    </div>
                    
                    {(view === 'register' || view === 'payment') && initialPlan === 'pro' && (
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-3 shadow-lg shadow-indigo-500/30 animate-in zoom-in-95">
                            <Crown size={12} fill="currentColor" className="text-yellow-300"/> Pro Agent
                        </div>
                    )}

                    <h2 className="text-2xl font-black text-slate-900 mb-2 animate-in slide-in-from-bottom-2">
                        {view === 'login' ? 'Chào mừng trở lại' : 
                         view === 'register' ? (initialPlan === 'pro' ? 'Đăng ký Gói Pro' : 'Tạo tài khoản Agent') :
                         view === 'payment' ? 'Thanh toán an toàn' : 
                         view === 'forgot_email' ? 'Khôi phục mật khẩu' : 'Đặt mật khẩu mới'}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium animate-in slide-in-from-bottom-2 delay-100 px-4 leading-relaxed">
                        {view === 'login' ? 'Đăng nhập để truy cập Dashboard quản lý.' : 
                         view === 'register' ? (initialPlan === 'pro' ? 'Bước 1/2: Thông tin tài khoản' : 'Bắt đầu hành trình miễn phí.') :
                         view === 'payment' ? 'Bước 2/2: Kích hoạt tài khoản Pro Agent.' : 
                         view === 'forgot_email' ? 'Nhập email để nhận mã xác thực.' : 'Nhập mã OTP và mật khẩu mới.'}
                    </p>
                </div>

                {/* FORM BODY - SCROLLABLE FOR KEYBOARD */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-4">
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        
                        {/* PAYMENT VIEW */}
                        {view === 'payment' && (
                            <div className="space-y-5 animate-in slide-in-from-right fade-in">
                                {isLoading ? (
                                    <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Server size={20} className="text-indigo-600 animate-pulse"/>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-900">{processingStage || 'Đang xử lý...'}</h4>
                                            <p className="text-xs text-slate-500 font-medium mt-1">Hệ thống đang xác thực giao dịch an toàn.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* PAYMENT METHOD TABS */}
                                        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                                            <button 
                                                type="button"
                                                onClick={() => setPaymentMethod('qr')}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'qr' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                <QrCode size={16}/> VietQR / Napas
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setPaymentMethod('card')}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${paymentMethod === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                <CreditCard size={16}/> Thẻ Quốc Tế
                                            </button>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-slate-500 uppercase">Gói đăng ký</span>
                                                <span className="text-xs font-black text-slate-900">PRO MONTHLY</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                        <Zap size={16} fill="currentColor"/>
                                                    </div>
                                                    <div className="text-xs text-slate-500 leading-tight">
                                                        Full tính năng AI<br/>Tự động gia hạn
                                                    </div>
                                                </div>
                                                <div className="text-xl font-black text-indigo-600">499.000đ</div>
                                            </div>
                                        </div>

                                        {/* VIETQR DISPLAY */}
                                        {paymentMethod === 'qr' && (
                                            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                                                <div className="bg-white border-2 border-indigo-100 rounded-2xl p-4 text-center relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg">24/7</div>
                                                    
                                                    {/* GENERATED QR IMAGE */}
                                                    <div className="mx-auto w-40 h-40 bg-white p-2 rounded-xl shadow-inner border border-slate-100 mb-3 relative">
                                                        <img 
                                                            src={qrUrl}
                                                            alt="VietQR Payment"
                                                            className="w-full h-full object-contain"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm">
                                                            <span className="text-xs font-bold text-indigo-700 flex items-center gap-1"><Smartphone size={14}/> Quét bằng App NH</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 text-left">
                                                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase pl-1">Số TK</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-black text-slate-900 tracking-wider">{PLATFORM_BANK.accountNo.replace(/(\d{4})(?=\d)/g, '$1 ')}</span>
                                                                <button type="button" onClick={() => copyToClipboard(PLATFORM_BANK.accountNo, 'acc')} className="text-slate-400 hover:text-indigo-600">
                                                                    {qrCopied.acc ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase pl-1">Nội dung</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-black text-indigo-600">{transferContent}</span>
                                                                <button type="button" onClick={() => copyToClipboard(transferContent, 'content')} className="text-slate-400 hover:text-indigo-600">
                                                                    {qrCopied.content ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 mt-2 text-center">{PLATFORM_BANK.bankName} - {PLATFORM_BANK.accountName}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* CREDIT CARD INPUTS */}
                                        {paymentMethod === 'card' && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Số thẻ</label>
                                                    <div className="relative">
                                                        <input 
                                                            name="number"
                                                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold focus:border-indigo-500 outline-none transition-colors"
                                                            placeholder="0000 0000 0000 0000"
                                                            value={cardData.number} onChange={handleCardChange} maxLength={19}
                                                        />
                                                        <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Hết hạn</label>
                                                        <div className="relative">
                                                            <input 
                                                                name="expiry"
                                                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold focus:border-indigo-500 outline-none transition-colors"
                                                                placeholder="MM/YY"
                                                                value={cardData.expiry} onChange={handleCardChange} maxLength={5}
                                                            />
                                                            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">CVC</label>
                                                        <div className="relative">
                                                            <input 
                                                                type="password" name="cvc"
                                                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold focus:border-indigo-500 outline-none transition-colors"
                                                                placeholder="123"
                                                                value={cardData.cvc} onChange={handleCardChange} maxLength={3}
                                                            />
                                                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Tên chủ thẻ</label>
                                                    <input 
                                                        name="holder"
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none transition-colors uppercase"
                                                        placeholder="NGUYEN VAN A"
                                                        value={cardData.holder} onChange={handleCardChange}
                                                    />
                                                </div>
                                                
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 justify-center pt-2">
                                                    <ShieldCheck size={12}/> Thông tin được mã hóa an toàn 256-bit SSL.
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* REGISTER FORM */}
                        {view === 'register' && (
                            <div className="space-y-4 animate-in slide-in-from-right fade-in">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Họ và tên</label>
                                    <div className="relative">
                                        <input 
                                            type="text" name="fullName"
                                            value={formData.fullName} onChange={handleChange} onBlur={handleBlur}
                                            className={getInputClass('fullName')} placeholder="Nguyễn Văn A" 
                                        />
                                        <User size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${fieldErrors.fullName ? 'text-red-400' : 'text-slate-400'}`} />
                                    </div>
                                    {fieldErrors.fullName && <p className="text-[10px] font-bold text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {fieldErrors.fullName}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Số điện thoại</label>
                                    <div className="relative">
                                        <input 
                                            type="tel" name="phone"
                                            value={formData.phone} onChange={handleChange} onBlur={handleBlur}
                                            className={getInputClass('phone')} placeholder="0909..." 
                                        />
                                        <User size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${fieldErrors.phone ? 'text-red-400' : 'text-slate-400'}`} />
                                    </div>
                                    {fieldErrors.phone && <p className="text-[10px] font-bold text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {fieldErrors.phone}</p>}
                                </div>
                            </div>
                        )}

                        {/* FORGOT PASS - OTP VIEW */}
                        {view === 'forgot_otp' && (
                            <div className="space-y-4 animate-in slide-in-from-right fade-in">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Mã xác nhận (OTP)</label>
                                    <div className="relative">
                                        <input 
                                            type="text" name="otp"
                                            value={formData.otp} onChange={handleChange} onBlur={handleBlur}
                                            className={getInputClass('otp')} placeholder="123456" maxLength={6}
                                        />
                                        <ShieldCheck size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${fieldErrors.otp ? 'text-red-400' : 'text-slate-400'}`} />
                                    </div>
                                    {fieldErrors.otp && <p className="text-[10px] font-bold text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {fieldErrors.otp}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Mật khẩu mới</label>
                                    <div className="relative">
                                        <input 
                                            type={showPass ? "text" : "password"} name="newPassword"
                                            value={formData.newPassword} onChange={handleChange} onBlur={handleBlur}
                                            className={getInputClass('newPassword')} placeholder="Mật khẩu mới..."
                                        />
                                        <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${fieldErrors.newPassword ? 'text-red-400' : 'text-slate-400'}`} />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                                        </button>
                                    </div>
                                    {fieldErrors.newPassword && <p className="text-[10px] font-bold text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {fieldErrors.newPassword}</p>}
                                </div>
                            </div>
                        )}

                        {/* COMMON FIELDS (Login / Register / Forgot Email) */}
                        {view !== 'payment' && view !== 'forgot_otp' && (
                            <>
                                <div className="space-y-1 animate-in fade-in">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email</label>
                                    <div className="relative">
                                        <input 
                                            type="email" name="email"
                                            value={formData.email} onChange={handleChange} onBlur={handleBlur}
                                            className={getInputClass('email')} placeholder="name@company.com" 
                                        />
                                        <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${fieldErrors.email ? 'text-red-400' : 'text-slate-400'}`} />
                                    </div>
                                    {fieldErrors.email && <p className="text-[10px] font-bold text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {fieldErrors.email}</p>}
                                </div>

                                {(view === 'login' || view === 'register') && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Mật khẩu</label>
                                                {view === 'login' && (
                                                    <button type="button" onClick={() => { setView('forgot_email'); setGlobalError(''); setSuccessMsg(''); }} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                                                        Quên mật khẩu?
                                                    </button>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <input 
                                                    type={showPass ? "text" : "password"} name="password"
                                                    value={formData.password} onChange={handleChange} onBlur={handleBlur}
                                                    className={`${getInputClass('password')} pr-10`}
                                                    placeholder="••••••••" 
                                                />
                                                <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${fieldErrors.password ? 'text-red-400' : 'text-slate-400'}`} />
                                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                                                </button>
                                            </div>
                                            {fieldErrors.password && <p className="text-[10px] font-bold text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {fieldErrors.password}</p>}
                                        </div>

                                        {view === 'register' && (
                                            <>
                                                <div className="space-y-1 animate-in slide-in-from-top-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Xác nhận mật khẩu</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="password" name="confirmPassword"
                                                            value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                                                            className={getInputClass('confirmPassword')}
                                                            placeholder="Nhập lại mật khẩu" 
                                                        />
                                                        <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${fieldErrors.confirmPassword ? 'text-red-400' : 'text-slate-400'}`} />
                                                    </div>
                                                    {fieldErrors.confirmPassword && <p className="text-[10px] font-bold text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {fieldErrors.confirmPassword}</p>}
                                                </div>
                                                
                                                {/* TERMS CHECKBOX */}
                                                <div className="flex items-start gap-2 pt-2 animate-in slide-in-from-top-2">
                                                    <div className="relative flex items-center">
                                                        <input 
                                                            type="checkbox" name="termsAgreed"
                                                            checked={formData.termsAgreed} onChange={handleChange}
                                                            className="peer h-4 w-4 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 transition-all"
                                                        />
                                                        <Check size={10} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" />
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-tight">
                                                        Tôi đồng ý với <a href="#" className="text-indigo-600 font-bold hover:underline">Điều khoản sử dụng</a> và <a href="#" className="text-indigo-600 font-bold hover:underline">Chính sách bảo mật</a>.
                                                    </p>
                                                </div>
                                                {fieldErrors.termsAgreed && <p className="text-[10px] font-bold text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={10}/> {fieldErrors.termsAgreed}</p>}
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* MESSAGES */}
                        {globalError && (
                            <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span> {globalError}
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-3 bg-green-50 text-green-600 text-xs font-bold rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2 leading-relaxed">
                                <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5"/> <span>{successMsg}</span>
                            </div>
                        )}

                        {/* BUTTON */}
                        {!isLoading && (
                            <button 
                                type="submit" 
                                className={`w-full py-3.5 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95 mt-4 ${view !== 'login' && initialPlan === 'pro' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-300' : 'bg-slate-900 shadow-slate-200'}`}
                            >
                                {view === 'payment' ? (paymentMethod === 'qr' ? <Smartphone size={18}/> : <CreditCard size={18}/>) : 
                                 view === 'forgot_email' ? <Mail size={18}/> : 
                                 view === 'forgot_otp' ? <KeyRound size={18}/> :
                                 (view === 'register' && initialPlan === 'pro' ? <ArrowRight size={18}/> : <ArrowRight size={18} />)}
                                
                                {view === 'login' ? 'Đăng Nhập' : 
                                 view === 'payment' ? (paymentMethod === 'qr' ? 'Đã Chuyển Khoản' : 'Thanh Toán Ngay') :
                                 view === 'register' ? (initialPlan === 'pro' ? 'Tiếp tục & Thanh toán' : 'Tạo Tài Khoản') : 
                                 view === 'forgot_email' ? 'Gửi mã xác nhận' : 'Đặt lại mật khẩu'}
                            </button>
                        )}
                    </form>
                </div>

                {/* FOOTER */}
                {(view === 'login' || view === 'register') && (
                    <div className="shrink-0 bg-slate-50 p-4 text-center border-t border-slate-100 z-20">
                        <p className="text-xs text-slate-500 font-medium">
                            {view === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                            <button 
                                onClick={() => { setView(view === 'login' ? 'register' : 'login'); setGlobalError(''); setSuccessMsg(''); setFieldErrors({}); }}
                                className="ml-1 text-indigo-600 font-bold hover:underline"
                            >
                                {view === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthModal;
