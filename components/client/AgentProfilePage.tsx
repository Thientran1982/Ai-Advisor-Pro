
import React, { useState, useEffect } from 'react';
import { TenantProfile, Project } from '../../types';
import { dataService } from '../../services/dataService'; 
import { 
    Phone, MessageCircle, Star, Award, MapPin, 
    CheckCircle2, ArrowRight, Building2, Share2, ShieldCheck, Loader2,
    Check, Copy, Link as LinkIcon, AlertCircle, Sparkles, QrCode, Home, Mail, CalendarDays, Globe
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo';
import ProjectDetailPanel from './ProjectDetailPanel'; 

interface AgentProfilePageProps {
    agent: TenantProfile;
    onStartChat: () => void;
    onSignUp?: () => void;
    onBackToLanding?: () => void; // NEW: Callback to return to landing page
}

const AgentProfilePage: React.FC<AgentProfilePageProps> = ({ agent, onStartChat, onSignUp, onBackToLanding }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const isDemo = agent.id === 'demo_agent'; 
    
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

        if (navigator.share) {
            try { await navigator.share(shareData); return; } catch (err) { }
        }

        try {
            await navigator.clipboard.writeText(window.location.href);
            showToast('Đã sao chép liên kết hồ sơ!', <LinkIcon size={16}/>);
        } catch (err) {
            showToast('Không thể sao chép liên kết', <AlertCircle size={16}/>);
        }
    };

    // --- TARGETED CAMPAIGN LOGIC ---
    const handleCopyProjectLink = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        // Generate Deep Link: domain.com/?project=abc
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

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans pb-32 relative">
            {/* 1. COVER & HEADER */}
            <div className="bg-slate-900 h-72 md:h-96 relative overflow-hidden group">
                {/* Dynamic Abstract Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 opacity-90"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[120px] opacity-20 mix-blend-screen group-hover:opacity-30 transition-opacity duration-1000"></div>
                <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[100px] opacity-10 mix-blend-screen"></div>
                
                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                {/* Navbar */}
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-36 relative z-10">
                
                {/* PROFILE CARD */}
                {/* Fixed: Removed overflow-hidden to allow avatar to pop out */}
                <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 md:p-10 flex flex-col md:flex-row gap-8 md:items-start animate-in slide-in-from-bottom-4 duration-500 relative z-20">
                    
                    {/* AVATAR COLUMN */}
                    <div className="flex flex-col items-center md:items-center shrink-0 md:w-[280px] relative">
                        <div className="w-40 h-40 md:w-56 md:h-56 rounded-full p-2 bg-white shadow-2xl -mt-24 md:-mt-44 relative group transition-transform duration-300 hover:scale-[1.02]">
                            <img 
                                src={agent.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=random`} 
                                className="w-full h-full rounded-full object-cover border border-slate-100"
                                alt={agent.name}
                            />
                            {/* Online Badge */}
                            <div className="absolute bottom-4 right-4 bg-white p-1.5 rounded-full shadow-md">
                                <div className="bg-emerald-500 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center" title="Online">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Stats Row */}
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

                    {/* INFO COLUMN */}
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

                        {/* Additional Contact Info (Desktop) */}
                        <div className="hidden md:flex flex-wrap gap-4 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 w-fit">
                            {agent.email && (
                                <div className="flex items-center gap-2 text-slate-600 px-2">
                                    <Mail size={14} className="text-slate-400"/> {agent.email}
                                </div>
                            )}
                            <div className="w-px h-4 bg-slate-200"></div>
                            {agent.phone && (
                                <div className="flex items-center gap-2 text-slate-600 px-2">
                                    <Phone size={14} className="text-slate-400"/> {agent.phone}
                                </div>
                            )}
                        </div>

                        {/* Bio / Welcome Message */}
                        <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl text-slate-600 leading-relaxed border border-slate-100 relative group hover:shadow-sm transition-all text-left">
                            <span className="absolute top-4 left-4 text-5xl text-indigo-100 font-serif leading-none select-none -z-10">“</span>
                            <p className="relative z-10 italic">
                                {agent.welcomeMessage || "Chào mừng bạn đến với trang tư vấn của tôi. Tôi sẵn sàng hỗ trợ bạn 24/7 với sự hỗ trợ của AI Advisor để tìm ra giải pháp đầu tư và an cư tốt nhất."}
                            </p>
                        </div>

                        {/* CTAs */}
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
                                    className="flex-1 px-4 py-4 bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 hover:-translate-y-0.5 shadow-sm"
                                    title="Chia sẻ hồ sơ"
                                >
                                    <Share2 size={22}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. LOWER SECTION: GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
                    
                    {/* LEFT COLUMN: SPECIALTIES (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm sticky top-28">
                            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase text-xs tracking-wider">
                                <Award size={16} className="text-indigo-600"/> Lĩnh vực chuyên sâu
                            </h3>
                            <div className="space-y-4">
                                {[
                                    {label: 'Pháp lý dự án', desc: 'Thẩm định rủi ro HĐMB'}, 
                                    {label: 'Định giá tài sản', desc: 'Dữ liệu thị trường 5 năm'}, 
                                    {label: 'Đầu tư dòng tiền', desc: 'ROI > 8%/năm'}, 
                                    {label: 'Phong thủy nhà ở', desc: 'Tư vấn hướng hợp mệnh'}
                                ].map((skill, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <CheckCircle2 size={18}/>
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

                    {/* RIGHT COLUMN: FEATURED PROJECTS (8 cols) */}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {projects.length > 0 ? projects.map((project, idx) => (
                                    <div 
                                        key={project.id} 
                                        className="group bg-white rounded-[24px] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-indigo-900/10 hover:border-indigo-100 transition-all duration-500 cursor-pointer animate-in slide-in-from-bottom-4 flex flex-col relative"
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                        onClick={() => setSelectedProject(project)} 
                                    >
                                        <div className="h-60 overflow-hidden relative">
                                            <img src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"/>
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                                            
                                            {/* AI VERIFIED BADGE */}
                                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <ShieldCheck size={12} className="text-emerald-600"/> AI Verified
                                            </div>

                                            {/* SHARE CAMPAIGN BUTTON */}
                                            <button 
                                                onClick={(e) => handleCopyProjectLink(e, project.id)}
                                                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white text-white hover:text-indigo-600 rounded-xl backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 z-10 border border-white/20 shadow-lg"
                                                title="Lấy link chạy quảng cáo cho dự án này"
                                            >
                                                <QrCode size={18}/>
                                            </button>

                                            <div className="absolute bottom-4 left-4 right-4">
                                                <div className="inline-flex px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide mb-2 shadow-sm">
                                                    {project.developer}
                                                </div>
                                                <div className="flex items-center gap-1 text-white/90 text-xs font-medium">
                                                    <MapPin size={12}/> {project.location}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-6 flex-1 flex flex-col">
                                            <h4 className="font-black text-xl text-slate-900 group-hover:text-indigo-700 transition-colors leading-tight mb-2 line-clamp-1">{project.name}</h4>
                                            
                                            <div className="flex gap-2 mb-6">
                                                {project.type.slice(0, 2).map((t, i) => (
                                                    <span key={i} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                            
                                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Giá tham khảo</p>
                                                    <p className="text-lg font-black text-indigo-600">{project.priceRange}</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1 shadow-sm">
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

            {/* DEMO CONVERSION CTA - Sticky Bottom */}
            {isDemo && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom-2">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {/* UPDATED: Use BrandLogo instead of generic Sparkles icon for better branding */}
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
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

            {/* INTEGRATED PROJECT DETAIL MODAL */}
            <ProjectDetailPanel project={selectedProject} onClose={() => setSelectedProject(null)} />

            {/* FEEDBACK TOAST */}
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
