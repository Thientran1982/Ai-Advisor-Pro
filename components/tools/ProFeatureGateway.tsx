
import React, { useState } from 'react';
import { 
  Scale, Compass, Tag, 
  Lock, X, Zap, Target, Swords, LineChart, ChevronLeft, Sparkles, Crown, ArrowRight, CheckCircle2, LayoutGrid
} from 'lucide-react';
import { ValuationPanel, ComparisonPanel, LegalPanel, FengShuiPanel, InvestmentPanel, StrategyPanel } from './AnalysisTools';

interface ProFeatureGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  userSubscription: string;
  onUpgrade: () => void;
  onExecute: (toolId: string, prompt: string) => void;
}

const ADVANCED_TOOLS = [
    { id: 'strategy', title: 'Tư Vấn Chiến Lược', icon: <Target size={24} className="text-red-500" />, desc: 'Hoạch định danh mục đầu tư & Khẩu vị rủi ro.', benefit: 'Thiết kế Danh mục Đầu tư (Portfolio) cá nhân hóa theo mục tiêu tài chính.', prompt: 'Tư vấn chiến lược đầu tư với ngân sách 10 tỷ, mục tiêu lãi vốn.' },
    { id: 'finance', title: 'Phân Tích Đầu Tư', icon: <LineChart size={24} className="text-indigo-500" />, desc: 'Ma trận độ nhạy (Sensitivity) & Dòng tiền DCF.', benefit: 'Dự báo lợi nhuận theo biến động lãi suất & tỷ lệ lấp đầy.', prompt: 'Phân tích độ nhạy lợi nhuận dự án Global City nếu lãi suất tăng lên 10%.' },
    { id: 'valuation', title: 'Định Giá AI 5.5', icon: <Tag size={24} className="text-emerald-500" />, desc: 'Định giá đa biến & Phân rã giá trị (Breakdown).', benefit: 'Xác định giá trị thực và biên độ an toàn (Confidence Interval).', prompt: 'Định giá căn 2PN tầng trung view sông tại Thủ Thiêm.' },
    { id: 'comparison', title: 'So Sánh Dự Án', icon: <Swords size={24} className="text-blue-500" />, desc: 'Biểu đồ Radar đối đầu trực tiếp & AI Kết Luận.', benefit: 'Chỉ rõ người thắng kẻ thua dựa trên 5 tiêu chí cốt lõi.', prompt: 'So sánh Empire City và Metropole: Ai thắng về tiềm năng tăng giá?' },
    { id: 'legal', title: 'Rà Soát Pháp Lý', icon: <Scale size={24} className="text-slate-500" />, desc: 'Rà soát (Scanner) rủi ro hợp đồng & Check quy hoạch.', benefit: 'Phát hiện "bẫy" câu chữ trong HĐMB.', prompt: 'Kiểm tra rủi ro pháp lý dự án này.' },
    { id: 'fengshui', title: 'Phong Thủy Số', icon: <Compass size={24} className="text-amber-500" />, desc: 'La bàn 24 sơn hướng & Bát trạch.', benefit: 'Tư vấn hướng nhà, màu sắc hợp mệnh gia chủ.', prompt: 'Xem phong thủy cho nam 1990 mua nhà hướng Đông Nam.' }
];

const ProFeatureGateway: React.FC<ProFeatureGatewayProps> = ({ isOpen, onClose, userSubscription, onUpgrade, onExecute }) => {
    const [selectedTool, setSelectedTool] = useState<typeof ADVANCED_TOOLS[0] | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    
    if (!isOpen) return null;
    
    const isPro = userSubscription === 'pro_agent' || userSubscription === 'enterprise';

    const handleExecute = (toolId: string, prompt: string) => {
        setIsExecuting(true);
        // Simulate "Thinking" delay for better UX
        setTimeout(() => {
            onExecute(toolId, prompt);
            setIsExecuting(false);
            onClose();
        }, 800);
    };

    const renderTool = (toolId: string) => {
        const isLocked = !isPro;
        switch (toolId) {
            case 'strategy': return <StrategyPanel isLocked={isLocked} onUnlock={onUpgrade} />;
            case 'finance': return <InvestmentPanel isLocked={isLocked} onUnlock={onUpgrade} />;
            case 'valuation': return <ValuationPanel isLocked={isLocked} onUnlock={onUpgrade} />;
            case 'comparison': return <ComparisonPanel isLocked={isLocked} onUnlock={onUpgrade} />;
            case 'legal': return <LegalPanel isLocked={isLocked} onUnlock={onUpgrade} />;
            case 'fengshui': return <FengShuiPanel isLocked={isLocked} onUnlock={onUpgrade} />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-lg flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-300 safe-area-bottom">
            {/* CONTAINER: Responsive Height (85vh on Desktop) for immersive feel */}
            <div className="bg-white md:rounded-[32px] w-full max-w-7xl h-[100dvh] md:h-[85vh] md:max-h-[900px] flex shadow-2xl overflow-hidden relative flex-col md:flex-row border border-white/10 ring-1 ring-slate-900/5">
                
                {/* CLOSE BUTTON */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur hover:bg-slate-100 rounded-full transition-all text-slate-500 hover:text-slate-900 shadow-sm border border-slate-200 group active:scale-95"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300"/>
                </button>

                {/* LEFT SIDE: MENU GRID */}
                <div className={`w-full md:w-[400px] p-5 md:p-0 bg-slate-50/80 backdrop-blur-sm overflow-hidden flex flex-col flex-shrink-0 border-r border-slate-200 ${selectedTool ? 'hidden md:flex' : 'flex h-full'}`}>
                    {/* Sidebar Header */}
                    <div className="px-6 pt-8 pb-6 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30 shrink-0">
                                <LayoutGrid size={22} strokeWidth={2.5}/>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Advisor 5.5</h2>
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full mt-1 inline-block">Bộ Công Cụ Pro</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Kích hoạt các Agent chuyên sâu để phân tích dữ liệu đa chiều.
                        </p>
                    </div>

                    {/* Tool List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                        {ADVANCED_TOOLS.map(tool => (
                            <div 
                                key={tool.id}
                                onClick={() => setSelectedTool(tool)}
                                className={`
                                    p-4 rounded-2xl border cursor-pointer transition-all duration-200 group relative overflow-hidden flex items-center gap-4
                                    ${selectedTool?.id === tool.id 
                                        ? 'bg-white border-indigo-600 shadow-md ring-1 ring-indigo-100' 
                                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm active:scale-[0.98] hover:bg-slate-50'}
                                `}
                            >
                                {/* Selection Indicator */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${selectedTool?.id === tool.id ? 'bg-indigo-600' : 'bg-transparent group-hover:bg-slate-200'}`}></div>

                                <div className={`p-3 rounded-xl flex-shrink-0 transition-all group-hover:scale-110 shadow-sm ${selectedTool?.id === tool.id ? 'bg-indigo-50 scale-110' : 'bg-slate-50'}`}>
                                    {tool.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className={`font-bold text-sm mb-0.5 truncate flex items-center gap-2 ${selectedTool?.id === tool.id ? 'text-indigo-700' : 'text-slate-800'}`}>
                                        {tool.title}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 line-clamp-1">{tool.desc}</p>
                                </div>
                                {!isPro ? (
                                    <Lock size={14} className="text-slate-300 shrink-0" />
                                ) : (
                                    <ChevronLeft className={`text-indigo-600 rotate-180 transition-opacity ${selectedTool?.id === tool.id ? 'opacity-100' : 'opacity-0'}`} size={16}/>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {/* Upgrade Banner (Sticky Bottom) */}
                    {!isPro && (
                        <div className="p-4 border-t border-slate-200 bg-white relative z-10">
                            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl shadow-slate-900/10 text-center relative overflow-hidden group cursor-pointer" onClick={onUpgrade}>
                                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500 rounded-full blur-[50px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-center mb-2">
                                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center ring-2 ring-indigo-900 shadow-inner">
                                            <Crown size={16} fill="currentColor" className="text-yellow-400"/>
                                        </div>
                                    </div>
                                    <p className="font-bold text-sm mb-0.5">Nâng cấp Pro Agent</p>
                                    <p className="text-[10px] text-slate-400 mb-3 px-2">Mở khóa toàn bộ 6 công cụ phân tích & Dữ liệu Real-time.</p>
                                    <button className="w-full py-2.5 bg-white text-indigo-900 rounded-xl text-[10px] font-black hover:bg-indigo-50 transition-colors shadow uppercase tracking-wider flex items-center justify-center gap-1">
                                        <Zap size={12} fill="currentColor" className="text-yellow-500"/> Mở khóa ngay
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDE: TOOL DISPLAY AREA */}
                <div className={`flex-1 bg-white relative flex-col overflow-hidden ${selectedTool ? 'flex h-full' : 'hidden md:flex'}`}>
                    {selectedTool ? (
                        <>
                            {/* MOBILE HEADER */}
                            <div className="md:hidden flex items-center p-4 border-b border-slate-100 bg-white/95 backdrop-blur sticky top-0 z-20 pt-12 md:pt-4 shadow-sm">
                                <button 
                                    onClick={() => setSelectedTool(null)} 
                                    className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 active:bg-slate-200 transition-colors"
                                >
                                    <ChevronLeft size={16}/> Menu
                                </button>
                                <span className="ml-3 font-bold text-slate-900 text-base truncate flex-1">{selectedTool.title}</span>
                            </div>

                            {/* TOOL HEADER (Desktop) */}
                            <div className="p-6 md:p-8 pb-6 shrink-0 border-b border-slate-100 bg-white z-10 hidden md:block">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-start gap-5">
                                        <div className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-2xl shrink-0 shadow-sm border border-slate-100">
                                            {React.cloneElement(selectedTool.icon as React.ReactElement, { size: 32 })}
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2">{selectedTool.title}</h2>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wide border border-indigo-100">Hỗ Trợ Bởi AI</span>
                                                <p className="text-sm text-slate-500 font-medium">{selectedTool.benefit}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Action Button */}
                                    {isPro && (
                                        <button 
                                            onClick={() => handleExecute(selectedTool.id, selectedTool.prompt)}
                                            disabled={isExecuting}
                                            className="group flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:scale-100 min-w-[200px]"
                                        >
                                            {isExecuting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Đang phân tích...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={18} className="text-yellow-400 group-hover:rotate-12 transition-transform"/> 
                                                    <span>Chạy phân tích ngay</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* TOOL BODY: Scrollable */}
                            <div className="flex-1 relative bg-slate-50/30 overflow-y-auto custom-scrollbar p-4 md:p-8">
                                <div className="max-w-5xl mx-auto h-full flex flex-col">
                                    <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm h-full overflow-hidden p-1 relative flex flex-col transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                                        {renderTool(selectedTool.id)}
                                    </div>
                                </div>
                                
                                {/* Mobile FAB */}
                                {isPro && (
                                    <div className="md:hidden sticky bottom-4 left-0 right-0 mt-6 px-2 z-30">
                                        <button 
                                            onClick={() => handleExecute(selectedTool.id, selectedTool.prompt)}
                                            disabled={isExecuting}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl shadow-slate-300 active:scale-95 transition-all disabled:opacity-80"
                                        >
                                            {isExecuting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Sparkles size={18} className="text-yellow-400"/>}
                                            {isExecuting ? 'Đang xử lý...' : 'Chạy phân tích'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 h-full relative overflow-hidden">
                            {/* Background Decoration */}
                            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

                            {/* Empty State Illustration */}
                            <div className="relative mb-10 group animate-in zoom-in-95 duration-700">
                                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity duration-1000"></div>
                                
                                {/* Orbiting Icons */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-4 animate-bounce delay-700">
                                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><Tag size={16} className="text-emerald-500"/></div>
                                </div>
                                <div className="absolute bottom-0 right-0 translate-y-full translate-x-1/2 mt-4 animate-bounce delay-1000">
                                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><LineChart size={16} className="text-blue-500"/></div>
                                </div>

                                <div className="w-32 h-32 bg-white rounded-[32px] flex items-center justify-center shadow-xl shadow-indigo-100 border border-slate-100 relative z-10">
                                    <Zap size={48} className="text-indigo-500 fill-indigo-50" />
                                </div>
                            </div>
                            
                            <h3 className="font-black text-slate-900 text-3xl mb-3 tracking-tight">Trung Tâm Chỉ Huy</h3>
                            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed mb-8 text-base">
                                Chọn một công cụ từ danh sách bên trái để kích hoạt sức mạnh của <span className="font-bold text-indigo-600">AI Advisor 5.5</span>.
                            </p>
                            
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                Hệ thống sẵn sàng
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProFeatureGateway;
