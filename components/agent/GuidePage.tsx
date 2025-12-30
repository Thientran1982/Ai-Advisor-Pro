
import React, { useState, useEffect, useMemo } from 'react';
import { 
    BookOpen, Copy, Check, Share2, QrCode, Megaphone, 
    ArrowRight, Zap, Lightbulb, MessageCircle, ExternalLink, Filter
} from 'lucide-react';
import { TenantProfile, Project } from '../../types';
import { dataService } from '../../services/dataService';

// --- DYNAMIC SCRIPT GENERATOR ---
const getDynamicScript = (
    type: 'profile' | 'project' | 'campaign', 
    agentName: string, 
    profileLink: string, 
    project?: { name: string, link: string }
) => {
    switch (type) {
        case 'profile':
            return `Dạ chào anh/chị [Tên Khách], để tiện cho anh chị tham khảo các dự án bên em đang phân phối, em gửi anh chị trang *Hồ sơ năng lực số* của em.\n\nĐặc biệt, em có tích hợp một *Trợ lý AI chuyên sâu* trong này. Anh chị có thể hỏi nó bất kỳ lúc nào về: *Bảng tính dòng tiền, Pháp lý dự án, hay So sánh giá*... AI sẽ trả lời ngay lập tức thay em 24/7 ạ.\n\n👉 Mời anh chị trải nghiệm: ${profileLink}`;
        
        case 'project':
            return `Anh [Tên] ơi, về dự án *${project?.name || '[Tên Dự Án]'}* anh đang quan tâm, em gửi anh đường link tra cứu đặc biệt này.\n\nEm đã cấu hình sẵn dữ liệu *Bảng giá & Chính sách mới nhất* vào đây. Anh bấm vào là AI sẽ tự động tính toán phương án vay và dòng tiền cho thuê cụ thể theo tài chính của anh luôn nhé.\n\n👉 Check chi tiết tại đây: ${project?.link || '[Link Dự Án]'}`;
        
        case 'campaign':
            return `Chào anh/chị, thị trường BĐS tháng này đang có biến động lớn về lãi suất thả nổi. Em có cập nhật số liệu mới nhất vào *Trợ lý AI* của em.\n\nAnh/chị có thể vào check thử lãi suất và định giá lại tài sản của mình miễn phí tại đây nhé: ${profileLink}\n\nChúc anh/chị tuần mới nhiều năng lượng! - ${agentName}`;
        
        default: return "";
    }
};

interface GuidePageProps {
    agent: TenantProfile | null;
}

const GuidePage: React.FC<GuidePageProps> = ({ agent }) => {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    
    // Scenario 2 State: Project Selection
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');

    // --- DATA PREPARATION ---
    useEffect(() => {
        setProjects(dataService.getProjects());
        // Default to first project if available
        const allProjects = dataService.getProjects();
        if (allProjects.length > 0) setSelectedProjectId(allProjects[0].id);
    }, []);

    // Helper: Construct Links
    const baseUrl = window.location.origin; // e.g. https://advisor-ai.com
    const agentId = agent?.id || 'demo_agent';
    const agentName = agent?.name || 'Chuyên gia';
    
    // Link Generators
    const profileLink = `${baseUrl}?agent=${agentId}&utm_source=profile_share`;
    
    const projectLink = useMemo(() => {
        if (!selectedProjectId) return '[Chọn dự án để tạo link]';
        return `${baseUrl}?project=${selectedProjectId}&agent=${agentId}&utm_source=project_share`;
    }, [selectedProjectId, agentId, baseUrl]);

    const selectedProjectName = projects.find(p => p.id === selectedProjectId)?.name || '[Tên Dự Án]';

    const handleCopy = (key: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const GuideSection = ({ 
        title, icon: Icon, desc, steps, scriptKey, generatedScript, color, extraControl 
    }: { 
        title: string, icon: any, desc: string, steps: string[], scriptKey: string, generatedScript: string, color: string, extraControl?: React.ReactNode 
    }) => (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden mb-6 md:mb-8 group hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
            {/* Header Section */}
            <div className={`p-5 md:p-8 border-b border-slate-100 flex flex-col md:flex-row gap-5 md:gap-6 ${color}`}>
                <div className="shrink-0">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl flex items-center justify-center shadow-md">
                        <Icon size={28} className="text-slate-800 md:w-8 md:h-8" />
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
                    
                    {extraControl && (
                        <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/50">
                            {extraControl}
                        </div>
                    )}

                    <div className="mt-6">
                        <h4 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quy trình (Workflow)</h4>
                        <div className="flex flex-wrap gap-2 md:gap-4">
                            {steps.map((step, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white/60 px-3 py-1.5 rounded-lg border border-slate-200/50 backdrop-blur-sm">
                                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</span>
                                    <span>{step}</span>
                                    {/* Hide arrow on mobile to prevent messy wrapping */}
                                    {idx < steps.length - 1 && <ArrowRight size={14} className="text-slate-400 ml-2 hidden md:block" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Script Section */}
            <div className="p-5 md:p-8 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                        <MessageCircle size={14}/> Kịch bản mẫu (Đã cá nhân hóa)
                    </h4>
                    <button 
                        onClick={() => handleCopy(scriptKey, generatedScript)}
                        className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm active:scale-95 w-full sm:w-auto justify-center"
                    >
                        {copiedKey === scriptKey ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                        {copiedKey === scriptKey ? 'Đã sao chép' : 'Sao chép nội dung'}
                    </button>
                </div>
                {/* Fixed: break-words to prevent URL overflow on mobile */}
                <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed font-medium relative group-hover:border-indigo-200 transition-colors shadow-inner whitespace-pre-wrap break-words">
                    {generatedScript}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full bg-[#FAFAFA] flex flex-col font-sans relative overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 md:px-8 py-6 flex justify-between items-center shrink-0 z-10 sticky top-0">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Playbook <span className="text-xs md:text-sm font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">Chiến Lược</span>
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Hướng dẫn & Kịch bản mẫu cho {agentName}.</p>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                    <Lightbulb size={14} className="text-amber-500 fill-amber-500"/> Mẹo: Link đã được tạo tự động cho bạn
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-[24px] p-6 md:p-8 text-white mb-8 md:mb-10 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-6">
                            <div className="p-3 md:p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                                <Zap size={28} className="text-yellow-400 fill-yellow-400 animate-pulse md:w-8 md:h-8"/>
                            </div>
                            <div>
                                <h3 className="text-lg md:text-xl font-bold mb-2">Bộ công cụ bán hàng của {agentName}</h3>
                                <p className="text-indigo-100 text-sm leading-relaxed max-w-xl">
                                    Hệ thống đã tự động tích hợp thông tin của bạn vào các kịch bản dưới đây. 
                                    Bạn chỉ cần chọn dự án, copy và gửi cho khách hàng để kích hoạt "Trợ lý AI" làm việc thay bạn.
                                </p>
                            </div>
                        </div>
                    </div>

                    <GuideSection 
                        title="Chiến thuật 1: Danh Thiếp Số (AI Profile)"
                        icon={Share2}
                        color="bg-gradient-to-br from-blue-50 to-indigo-50"
                        desc="Thay vì gửi file PDF nặng nề, hãy gửi đường link Hồ sơ năng lực của bạn. AI sẽ túc trực trong đó để trả lời mọi thắc mắc của khách hàng về bạn và các dự án."
                        steps={['Copy kịch bản bên dưới', 'Gửi qua Zalo/Mess cho khách mới', 'AI sẽ tự động chăm sóc khi khách vào link']}
                        scriptKey="profile"
                        generatedScript={getDynamicScript('profile', agentName, profileLink)}
                    />

                    <GuideSection 
                        title="Chiến thuật 2: Tên Lửa Dẫn Đường (Deep Link)"
                        icon={QrCode}
                        color="bg-gradient-to-br from-emerald-50 to-teal-50"
                        desc="Khi khách quan tâm 1 dự án cụ thể, đừng gửi trang chủ. Hãy dùng công cụ bên dưới để tạo Link đi thẳng vào dự án đó. AI sẽ đóng vai 'Chuyên gia dự án' để tư vấn sâu."
                        steps={['Chọn dự án trong danh sách', 'Link sẽ tự động được tạo', 'Copy kịch bản & Gửi']}
                        scriptKey="project"
                        generatedScript={getDynamicScript('project', agentName, profileLink, { name: selectedProjectName, link: projectLink })}
                        extraControl={
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Chọn dự án để tạo Link</label>
                                <div className="relative">
                                    <select 
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-500 appearance-none shadow-sm text-slate-900"
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                    >
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                </div>
                                <div className="mt-2 text-xs font-mono text-slate-500 bg-slate-100 p-2 rounded-lg border border-slate-200 truncate">
                                    {projectLink}
                                </div>
                            </div>
                        }
                    />

                    <GuideSection 
                        title="Chiến thuật 3: Nuôi Dưỡng (Re-marketing)"
                        icon={Megaphone}
                        color="bg-gradient-to-br from-orange-50 to-amber-50"
                        desc="Hâm nóng mối quan hệ với khách cũ bằng cách chia sẻ công cụ tính lãi suất/định giá miễn phí. Đây là cách tiếp cận nhẹ nhàng nhưng hiệu quả cao."
                        steps={['Copy kịch bản', 'Gửi Broadcast Zalo/SMS', 'Theo dõi ai click vào link ở Dashboard']}
                        scriptKey="campaign"
                        generatedScript={getDynamicScript('campaign', agentName, profileLink)}
                    />

                    {/* Pro Tip Box */}
                    <div className="border border-indigo-100 bg-indigo-50/50 rounded-2xl p-5 md:p-6 flex gap-4 items-start mb-20">
                        <div className="p-2 bg-indigo-100 rounded-full text-indigo-600 shrink-0">
                            <Lightbulb size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-indigo-900 mb-1 text-sm md:text-base">Mẹo Chuyên Gia (Offline Meeting)</h4>
                            <p className="text-xs md:text-sm text-indigo-800 leading-relaxed">
                                Khi gặp khách tại quán cafe, hãy mở điện thoại, vào phần <b>Cài đặt {'>'} Hồ sơ</b> và đưa mã QR cho khách quét. <br/>
                                <i>"Anh lưu lại trang này nhé. Tối về có thắc mắc gì anh cứ chat với AI của em trên này, nó tính lãi suất chuẩn như nhân viên ngân hàng luôn ạ."</i>
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default GuidePage;
