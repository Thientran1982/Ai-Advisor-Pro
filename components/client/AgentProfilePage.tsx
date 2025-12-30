
import React, { useState, useEffect, useMemo } from 'react';
import { TenantProfile, Project } from '../../types';
import { dataService } from '../../services/dataService'; 
import { 
    Phone, MessageCircle, Star, Award, MapPin, 
    CheckCircle2, ArrowRight, Building2, Share2, ShieldCheck, Loader2,
    Check, Copy, Link as LinkIcon, AlertCircle, Sparkles, QrCode, Home, Mail, CalendarDays, Globe,
    TrendingUp, School, Heart, Leaf, Wallet, ChevronDown, ChevronUp, X, Download
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo';
import ProjectDetailPanel from './ProjectDetailPanel'; 

interface AgentProfilePageProps {
    agent: TenantProfile;
    onStartChat: () => void;
    onSignUp?: () => void;
    onBackToLanding?: () => void; 
}

// --- NEW COMPONENT: SHARE MODAL (DIGITAL NAME CARD) ---
const ShareProfileModal = ({ isOpen, onClose, agent, url }: { isOpen: boolean, onClose: () => void, agent: TenantProfile, url: string }) => {
    // Local state for copy feedback inside modal
    const [copyFeedback, setCopyFeedback] = useState(false);

    if (!isOpen) return null;
    
    // Generate QR Code URL (High Quality)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=312e81&bgcolor=ffffff&margin=10`;

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    const handleDownloadQR = async () => {
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `QR-HoSo-${agent.name}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            // Silently fail or log to console in dev, but avoid alert()
            console.error("QR Download failed", e);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Decoration */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900"></div>
                <div className="absolute top-4 right-4 z-10">
                    <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"><X size={18}/></button>
                </div>

                <div className="relative pt-12 pb-8 px-6 text-center">
                    {/* Avatar Badge */}
                    <div className="w-24 h-24 mx-auto bg-white rounded-full p-1.5 shadow-xl relative z-10 mb-4">
                        <img src={agent.avatar} className="w-full h-full rounded-full object-cover border border-slate-100" alt="Avatar"/>
                        <div className="absolute bottom-1 right-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white"></div>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-1">{agent.name}</h3>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-6">Chuyên gia tư vấn BĐS</p>

                    {/* QR Code Container */}
                    <div className="bg-white p-4 rounded-2xl border-2 border-indigo-50 shadow-inner inline-block mb-6 relative group">
                        <img src={qrUrl} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/90">
                            <button onClick={handleDownloadQR} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform">
                                <Download size={14}/> Tải xuống
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 font-medium mb-4 px-8">Quét mã để truy cập hồ sơ năng lực và các dự án phân phối.</p>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleCopy} className="py-3 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200">
                            {copyFeedback ? <Check size={16} className="text-green-600"/> : <Copy size={16}/>} 
                            {copyFeedback ? 'Đã chép' : 'Sao chép Link'}
                        </button>
                        <button onClick={onClose} className="py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200">
                            <Check size={16}/> Hoàn tất
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AgentProfilePage: React.FC<AgentProfilePageProps> = ({ agent, onStartChat, onSignUp, onBackToLanding }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isBioExpanded, setIsBioExpanded] = useState(false); 
    const isDemo = agent.id === 'demo_agent'; 
    
    // SHARE STATE
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    
    // Toast Notification State
    const [toast, setToast] = useState<{ show: boolean, message: string, icon?: React.ReactNode }>({ show: false, message: '', icon: undefined });

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const allProjects = dataService.getProjects(); 
                const filtered = allProjects.filter(p => (agent.assignedProjects || []).includes(p.id));
                await new Promise(r => setTimeout(r, 400));
                setProjects(filtered);
            } catch (e) {
                console.error("Failed to load agent projects", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [agent.id, agent.assignedProjects]);

    // --- SMART ACTIONS ---
    const showToast = (msg: string, icon?: React.ReactNode) => {
        setToast({ show: true, message: msg, icon });
        setTimeout(() => setToast({ show: false, message: '', icon: undefined }), 3000);
    };

    const handleShare = async () => {
        const shareData = {
            title: `Hồ sơ chuyên gia: ${agent.name}`,
            text: `Tôi muốn giới thiệu chuyên gia BĐS ${agent.name} - ${agent.phone}`,
            url: window.location.href
        };

        // Logic: Mobile -> Native Share | Desktop -> QR Modal
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (isMobile && navigator.share) {
            try { 
                await navigator.share(shareData); 
                return; 
            } catch (err) { 
                // Fallback if user cancels or share fails
            }
        }

        // Open Digital Name Card Modal
        setIsShareModalOpen(true);
    };

    const handleCopyProjectLink = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        const url = new URL(window.location.href);
        url.searchParams.set('project', projectId);
        navigator.clipboard.writeText(url.toString());
        showToast('Đã tạo Link Chiến Dịch cho dự án này!', <QrCode size={16}/>);
    };

    const handleCallAction = () => {
        if (window.innerWidth >= 768) {
            navigator.clipboard.writeText(agent.phone);
            showToast(`Đã sao chép SĐT: ${agent.phone}`, <Phone size={16}/>);
        }
    };

    const handleHome = () => {
        if (onBackToLanding) {
            onBackToLanding();
        } else {
            window.location.href = "/";
        }
    };

    const getWelcomeMessage = () => {
        if (agent.welcomeMessage) return agent.welcomeMessage;
        
        const focus = agent.aiConfig?.focus || 'neutral';
        const tone = agent.aiConfig?.tone || 'professional';

        if (focus === 'investment') {
            return `Chào mừng quý nhà đầu tư. Tôi chuyên sâu phân tích Dòng tiền & Lãi vốn tại các dự án trọng điểm. Hãy chat với Trợ lý AI của tôi để nhận bảng tính ROI chi tiết ngay lập tức.`;
        }
        if (focus === 'residence') {
            return `Hân hạnh được đồng hành cùng anh/chị tìm kiếm tổ ấm hoàn hảo. Tôi tập trung vào trải nghiệm sống, tiện ích giáo dục và cộng đồng. Trợ lý AI sẽ giúp anh/chị lọc căn phù hợp nhất.`;
        }
        if (tone === 'friendly') {
            return `Chào bạn! Mình là ${agent.name}. Rất vui được hỗ trợ bạn tìm hiểu thị trường BĐS. Cứ thoải mái chat với trợ lý ảo của mình nhé, 24/7 luôn!`;
        }
        
        return "Chào mừng bạn đến với trang tư vấn của tôi. Tôi sẵn sàng hỗ trợ bạn 24/7 với sự hỗ trợ của AI Advisor để tìm ra giải pháp đầu tư và an cư tốt nhất.";
    };

    const dynamicSpecialties = useMemo(() => {
        const focus = agent.aiConfig?.focus || 'neutral';
        
        if (focus === 'investment') {
            return [
                { label: 'Định giá tài sản', desc: 'Dữ liệu thị trường 5 năm', icon: TrendingUp },
                { label: 'Đầu tư dòng tiền', desc: 'ROI > 8%/năm', icon: Wallet },
                { label: 'Pháp lý dự án', desc: 'Thẩm định rủi ro HĐMB', icon: ShieldCheck },
                { label: 'Cấu trúc vốn', desc: 'Tối ưu đòn bẩy ngân hàng', icon: Building2 }
            ];
        } 
        
        if (focus === 'residence') {
            return [
                { label: 'Tổ ấm an cư', desc: 'Không gian sống lý tưởng', icon: Heart },
                { label: 'Tiện ích giáo dục', desc: 'Gần trường quốc tế', icon: School },
                { label: 'Sống xanh', desc: 'Môi trường trong lành', icon: Leaf },
                { label: 'Phong thủy', desc: 'Tư vấn hướng hợp mệnh', icon: Sparkles }
            ];
        }

        return [
            { label: 'Pháp lý dự án', desc: 'Thẩm định rủi ro HĐMB', icon: ShieldCheck },
            { label: 'Định giá tài sản', desc: 'Dữ liệu thị trường 5 năm', icon: TrendingUp },
            { label: 'Đầu tư dòng tiền', desc: 'ROI > 8%/năm', icon: Wallet },
            { label: 'Phong thủy nhà ở', desc: 'Tư vấn hướng hợp mệnh', icon: Sparkles }
        ];
    }, [agent.aiConfig?.focus]);

    const welcomeMsg = getWelcomeMessage();
    const isLongBio = welcomeMsg.length > 150;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans pb-40 relative"> 
            {/* 1. COVER & HEADER */}
            <div className="bg-slate-900 h-56 md:h-96 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 opacity-90"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[120px] opacity-20 mix-blend-screen group-hover:opacity-30 transition-opacity duration-1000"></div>
                <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[100px] opacity-10 mix-blend-screen"></div>
                
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
                    <div className="text-white/90 hover:text-white cursor-pointer transition-colors" onClick={handleHome}>
                        <BrandLogo variant="text-only" size="sm" lightMode />
                    </div>
                    
                    <button 
                        onClick={handleHome}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold backdrop-blur-md transition-all border border-white/10"
                    >
                        <Home size={14}/> <span className="hidden sm:inline">Trang chủ</span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-24 md:-mt-36 relative z-10">
                
                {/* PROFILE CARD */}
                <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 md:p-10 flex flex-col md:flex-row gap-8 md:items-start animate-in slide-in-from-bottom-4 duration-500 relative z-20">
                    
                    {/* AVATAR */}
                    <div className="flex flex-col items-center md:items-center shrink-0 md:w-[280px] relative">
                        <div className="w-32 h-32 md:w-56 md:h-56 rounded-full p-2 bg-white shadow-2xl -mt-16 md:-mt-44 relative group transition-transform duration-300 hover:scale-[1.02]">
                            <img 
                                src={agent.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=random`} 
                                className="w-full h-full rounded-full object-cover border border-slate-100"
                                alt={agent.name}
                            />
                            <div className="absolute bottom-4 right-4 bg-white p-1.5 rounded-full shadow-md">
                                <div className="bg-emerald-500 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center" title="Online">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 flex gap-3 w-full">
                            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 flex-1 hover:border-indigo-100 transition-colors">
                                <span className="text-2xl font-black text-slate-900 tracking-tight">4.9</span>
                                <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Star size={10} className="fill-amber-400 text-amber-400"/> Rating</span>
                            </div>
                            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 flex-1 hover:border-indigo-100 transition-colors">
                                <span className="text-2xl font-black text-slate-900 tracking-tight">5+</span>
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Năm KN</span>
                            </div>
                        </div>
                    </div>

                    {/* INFO */}
                    <div className="flex-1 text-center md:text-left space-y-6 pt-2 relative">
                        <div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{agent.name}</h1>
                                {agent.subscription === 'pro_agent' && (
                                    <span className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider">
                                        <ShieldCheck size={12}/> Pro Agent
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500 text-sm font-medium mt-3">
                                <span className="flex items-center gap-2">
                                    <Building2 size={16} className="text-indigo-500"/> {agent.type === 'agency' ? 'Sàn Bất Động Sản Cao Cấp' : 'Chuyên Gia Tư Vấn BĐS'}
                                </span>
                                <span className="hidden md:inline text-slate-300">|</span>
                                <span className="flex items-center gap-2">
                                    <MapPin size={16} className="text-indigo-500"/> TP. Hồ Chí Minh
                                </span>
                                <span className="hidden md:inline text-slate-300">|</span>
                                <span className="flex items-center gap-2">
                                    <CalendarDays size={16} className="text-indigo-500"/> Gia nhập 2024
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 w-fit mx-auto md:mx-0">
                            {agent.email && (
                                <div className="flex items-center gap-2 text-slate-600 px-2">
                                    <Mail size={14} className="text-slate-400"/> {agent.email}
                                </div>
                            )}
                            <div className="hidden md:block w-px h-4 bg-slate-200"></div>
                            {agent.phone && (
                                <div className="flex items-center gap-2 text-slate-600 px-2">
                                    <Phone size={14} className="text-slate-400"/> {agent.phone}
                                </div>
                            )}
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl text-slate-600 leading-relaxed border border-slate-100 relative group hover:shadow-sm transition-all text-left">
                            <span className="absolute top-4 left-4 text-5xl text-indigo-100 font-serif leading-none select-none -z-10">“</span>
                            <div className={`relative z-10 italic transition-all duration-300 ${!isBioExpanded ? 'line-clamp-3 md:line-clamp-none' : ''}`}>
                                {welcomeMsg}
                            </div>
                            {isLongBio && (
                                <button 
                                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                                    className="md:hidden mt-2 text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
                                >
                                    {isBioExpanded ? 'Thu gọn' : 'Xem thêm'} 
                                    {isBioExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <button 
                                onClick={onStartChat}
                                className="flex-[2] py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-slate-200 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95 group text-base"
                            >
                                <MessageCircle size={22} className="group-hover:animate-bounce"/> Chat với Trợ lý AI (24/7)
                            </button>
                            <div className="flex gap-3 flex-1">
                                <a 
                                    href={`tel:${agent.phone}`} 
                                    onClick={handleCallAction}
                                    className="flex-1 px-4 py-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 hover:-translate-y-0.5"
                                    title="Gọi ngay"
                                >
                                    <Phone size={22}/>
                                </a>
                                <button 
                                    onClick={handleShare}
                                    className="flex-1 px-4 py-4 bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 hover:-translate-y-0.5 shadow-sm relative group"
                                    title="Chia sẻ hồ sơ (QR Code)"
                                >
                                    <Share2 size={22}/>
                                    {/* Tooltip for Desktop */}
                                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        Lấy mã QR
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. LOWER SECTION: GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
                    
                    {/* LEFT COLUMN: SPECIALTIES */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative lg:sticky lg:top-28 z-10 lg:z-0">
                            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase text-xs tracking-wider">
                                <Award size={16} className="text-indigo-600"/> Lĩnh vực chuyên sâu
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                {dynamicSpecialties.map((skill, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            {React.createElement(skill.icon, { size: 18 })}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">{skill.label}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{skill.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <div className="p-5 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl border border-indigo-100/50 text-center">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Chứng nhận bởi</p>
                                    <div className="flex justify-center">
                                        <BrandLogo variant="text-only" size="md" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: FEATURED PROJECTS */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 uppercase text-xs tracking-wider px-1">
                                <Building2 size={16} className="text-indigo-600"/> Dự án phân phối chiến lược
                            </h3>
                            <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                                {projects.length} dự án
                            </span>
                        </div>
                        
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2].map(i => (
                                    <div key={i} className="bg-white rounded-2xl border border-slate-100 h-80 animate-pulse flex flex-col overflow-hidden">
                                        <div className="bg-slate-200 h-48 w-full"></div>
                                        <div className="p-6 flex-1 space-y-3">
                                            <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                                            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                                            <div className="mt-auto h-10 bg-slate-100 rounded-xl w-full"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {projects.length > 0 ? projects.map((project, idx) => (
                                    <div 
                                        key={project.id} 
                                        className="group bg-white rounded-[24px] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-indigo-900/10 hover:border-indigo-100 transition-all duration-500 cursor-pointer animate-in slide-in-from-bottom-4 flex flex-col relative"
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                        onClick={() => setSelectedProject(project)} 
                                    >
                                        <div className="h-48 sm:h-60 overflow-hidden relative">
                                            <img src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"/>
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                                            
                                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <ShieldCheck size={12} className="text-emerald-600"/> AI Verified
                                            </div>

                                            <button 
                                                onClick={(e) => handleCopyProjectLink(e, project.id)}
                                                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white text-white hover:text-indigo-600 rounded-xl backdrop-blur-md transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 scale-90 lg:group-hover:scale-100 z-10 border border-white/20 shadow-lg"
                                                title="Lấy link chạy quảng cáo cho dự án này"
                                            >
                                                <QrCode size={18}/>
                                            </button>

                                            <div className="absolute bottom-4 left-4 right-4">
                                                <div className="inline-flex px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide mb-2 shadow-sm">
                                                    {project.developer}
                                                </div>
                                                <div className="flex items-center gap-1 text-white/90 text-xs font-medium truncate">
                                                    <MapPin size={12} className="shrink-0"/> <span className="truncate">{project.location}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-6 flex-1 flex flex-col">
                                            <h4 className="font-black text-lg md:text-xl text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug mb-2 line-clamp-2 min-h-[3.5rem]" title={project.name}>{project.name}</h4>
                                            
                                            <div className="flex gap-2 mb-6 flex-wrap">
                                                {project.type.slice(0, 2).map((t, i) => (
                                                    <span key={i} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 whitespace-nowrap">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                            
                                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Giá tham khảo</p>
                                                    {/* FIX: Changed from truncate to line-clamp-2 / break-words for better mobile visibility */}
                                                    <p className="text-base md:text-lg font-black text-indigo-600 leading-tight break-words" title={project.priceRange}>
                                                        {project.priceRange}
                                                    </p>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1 shadow-sm shrink-0">
                                                    <ArrowRight size={18} strokeWidth={2.5}/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-2 text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                            <Building2 size={32} className="text-slate-300"/>
                                        </div>
                                        <h4 className="text-slate-900 font-bold text-lg mb-1">Chưa có dự án hiển thị</h4>
                                        <p className="text-slate-500 text-sm font-medium">Vui lòng quay lại sau hoặc liên hệ trực tiếp.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* DEMO CONVERSION CTA */}
            {isDemo && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom-2 pb-safe">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hidden md:block">
                                <BrandLogo variant="icon" size="sm" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-base">Bạn là nhà môi giới?</p>
                                <p className="text-sm text-slate-500 font-medium">Tạo trang hồ sơ AI chuyên nghiệp như thế này miễn phí trong 30s.</p>
                            </div>
                        </div>
                        <button 
                            onClick={onSignUp}
                            className="w-full md:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95"
                        >
                            Tạo Hồ Sơ Ngay <ArrowRight size={16}/>
                        </button>
                    </div>
                </div>
            )}

            <ProjectDetailPanel project={selectedProject} onClose={() => setSelectedProject(null)} />
            
            {/* DIGITAL NAME CARD MODAL */}
            <ShareProfileModal 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)} 
                agent={agent} 
                url={window.location.href}
            />

            {toast.show && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[110] animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                        {toast.icon || <Check size={14} strokeWidth={3} className="text-white"/>}
                    </div>
                    <span className="text-sm font-bold pr-1">{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default AgentProfilePage;
