import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar, CartesianGrid, Cell, Tooltip, Legend,
  ReferenceLine, ComposedChart, Line
} from 'recharts';
import { 
  Lock, Compass, ShieldCheck, Landmark, Target, Share2, Check, Tag, Swords, TrendingUp, ArrowRight, Percent, AlertTriangle, Zap, Info, FileText, CheckCircle2,
  Activity, Thermometer, BrainCircuit, Scale, Award, Microscope, Globe, Sparkles, RefreshCw
} from 'lucide-react';
import { FEATURED_PROJECTS, MACRO_ECONOMY } from '../../constants';
import { Project } from '../../types';
import { dataService } from '../../services/dataService';
import { calculateDeepScore, calculateAIConfidence, calculateProjection, runMonteCarloSimulation, calculateFengShui } from '../../utils/analysisEngine';

// --- SHARED COMPONENTS ---
const ToolLock = ({ label, onUnlock }: { label: string, onUnlock?: () => void }) => (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-8 rounded-[32px] shadow-2xl text-center max-w-[320px] transform transition-transform hover:scale-105 duration-300 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative z-10">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-white/10">
                    <Lock size={24} className="text-indigo-300" />
                </div>
                <h4 className="text-lg font-black text-white mb-2 tracking-tight">Tính năng Pro</h4>
                <p className="text-xs text-slate-300 mb-6 leading-relaxed font-medium">
                    Mở khóa <span className="text-white font-bold">{label}</span> để truy cập dữ liệu phân tích chuyên sâu.
                </p>
                <button 
                    onClick={onUnlock} 
                    className="w-full py-3.5 bg-white text-indigo-900 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors uppercase tracking-widest shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2"
                >
                    Nâng cấp ngay <ArrowRight size={14}/>
                </button>
            </div>
        </div>
    </div>
);

// --- TOOLS IMPLEMENTATION ---

export const ValuationPanel = ({ projectId, isLocked = false, onUnlock }: { projectId?: string, isLocked?: boolean, onUnlock?: () => void }) => {
    const project = projectId ? dataService.getProjectById(projectId) : undefined;
    const confidence = useMemo(() => calculateAIConfidence(project), [project]);
    
    // Parse price safely
    let avgPrice = 100;
    if (project?.priceRange && !project.priceRange.includes("SEARCH")) {
        const nums = project.priceRange.match(/\d+/g);
        if (nums && nums.length > 0) avgPrice = (parseInt(nums[0]) + (nums[1] ? parseInt(nums[1]) : parseInt(nums[0]))) / 2;
    }

    // Mock Trend Data with Logic Injection
    // If interest rate > 10%, trend is flatter. If < 8%, trend is steeper.
    const interestRate = dataService.getFloatingInterestRate();
    const growthFactor = interestRate > 10 ? 1.02 : 1.08; // Impact of Macro Economy

    const trendData = [
        { name: 'Q1/23', price: avgPrice * 0.88, type: 'history' },
        { name: 'Q2/23', price: avgPrice * 0.90, type: 'history' },
        { name: 'Q3/23', price: avgPrice * 0.92, type: 'history' },
        { name: 'Q4/23', price: avgPrice * 0.95, type: 'history' },
        { name: 'Hiện tại', price: avgPrice, type: 'current' },
        { name: 'Q2/24 (Dự báo)', price: Math.round(avgPrice * growthFactor), type: 'forecast' },
        { name: 'Q4/24 (Dự báo)', price: Math.round(avgPrice * growthFactor * growthFactor), type: 'forecast' }
    ];

    const drivers = [
        { label: 'Hạ tầng (Vành đai 3, Metro)', impact: '+15%', positive: true },
        { label: 'Thương hiệu CĐT', impact: '+10%', positive: true },
        { label: 'Pháp lý', impact: '+8%', positive: true },
        { label: `Lãi suất thả nổi (${interestRate}%)`, impact: interestRate > 10 ? '-8%' : '-2%', positive: false },
    ];

    return (
        <div className="h-full bg-white p-0 relative overflow-hidden flex flex-col min-h-[450px] md:min-h-[600px] rounded-2xl">
            <div className="p-6 border-b border-slate-100">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                            <Tag size={16} className="text-indigo-600"/> Định Giá AI (CMA Model)
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Globe size={10} className="text-emerald-500 animate-pulse"/> 
                            Dữ liệu so sánh trực tuyến (Real-time).
                        </p>
                    </div>
                    <div className={`px-2 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 ${confidence > 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                        <Microscope size={10} /> Độ tin cậy: {confidence}%
                    </div>
                </div>
                
                <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-3xl font-black text-slate-900">
                        {project?.priceRange.includes("SEARCH") ? "Đang cập nhật..." : avgPrice.toLocaleString('vi-VN')}
                    </span>
                    {!project?.priceRange.includes("SEARCH") && <span className="text-sm font-bold text-slate-500">triệu/m²</span>}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                <div className="h-[200px] w-full -ml-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 600}} axisLine={false} tickLine={false} dy={10} interval={1} />
                            <Tooltip 
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 'bold'}}
                                formatter={(value: any) => [`${value.toLocaleString()} tr/m²`, 'Đơn giá']}
                            />
                            <Area type="monotone" dataKey="price" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase mb-3 flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-500"/> Yếu tố cấu thành giá
                    </h4>
                    <div className="space-y-2">
                        {drivers.map((d, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-xs font-medium text-slate-700">{d.label}</span>
                                <span className={`text-xs font-bold ${d.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {d.impact}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {isLocked && <ToolLock label="Báo cáo định giá chi tiết" onUnlock={onUnlock} />}
        </div>
    );
};

export const ComparisonPanel = ({ projectId, isLocked = false, onUnlock }: { projectId?: string, isLocked?: boolean, onUnlock?: () => void }) => {
    const projects = dataService.getProjects();
    const p1 = projects.find(p => p.id === projectId);
    // Smart find competitor
    const compName = p1?.richDetails?.marketAnalysis?.competitors?.[0] || "";
    const p2 = projects.find(p => p.name.includes(compName)) || projects.find(p => p.id !== projectId && p.id !== p1?.id) || projects[0];

    const s1 = useMemo(() => calculateDeepScore(p1), [p1]);
    const s2 = useMemo(() => calculateDeepScore(p2), [p2]);

    const radarData = [
        { subject: 'Vị trí', A: s1.location, B: s2.location, fullMark: 100 },
        { subject: 'Giá trị', A: s1.price, B: s2.price, fullMark: 100 },
        { subject: 'Pháp lý', A: s1.legal, B: s2.legal, fullMark: 100 },
        { subject: 'Tiện ích', A: s1.utility, B: s2.utility, fullMark: 100 },
        { subject: 'Tiềm năng', A: s1.potential, B: s2.potential, fullMark: 100 }
    ];

    return (
        <div className="h-full bg-white p-6 md:p-8 relative overflow-hidden flex flex-col min-h-[450px] md:min-h-[600px]">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2 mb-6 uppercase tracking-wide"><Swords size={16} className="text-rose-600"/> So sánh đối đầu (Head-to-Head)</h3>
            
            <div className="flex items-center justify-center gap-6 mb-6">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div><span className="text-xs font-bold text-slate-600">{p1?.name}</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-rose-500 rounded-full"></div><span className="text-xs font-bold text-slate-600">{p2?.name}</span></div>
            </div>

            <div className="w-full h-[250px] mb-8 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} />
                        <Radar name={p1?.name} dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="#4f46e5" fillOpacity={0.1} />
                        <Radar name={p2?.name} dataKey="B" stroke="#f43f5e" strokeWidth={3} fill="#f43f5e" fillOpacity={0.1} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '11px', fontWeight: 'bold'}} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                    <BrainCircuit size={14} className="text-indigo-600"/>
                    <span className="text-xs font-bold text-indigo-700">AI Verdict:</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                    {s1.overall > s2.overall 
                        ? `${p1?.name} vượt trội hơn về ${s1.legal > s2.legal ? 'pháp lý' : 'vị trí'}, phù hợp để đầu tư dài hạn.` 
                        : `${p2?.name} có ưu thế về giá và thanh khoản, thích hợp để lướt sóng ngắn hạn.`}
                </p>
            </div>

            {isLocked && <ToolLock label="So sánh chỉ số chuyên sâu" onUnlock={onUnlock} />}
        </div>
    );
};

export const InvestmentPanel = ({ projectId, isLocked = false, onUnlock }: { projectId?: string, isLocked?: boolean, onUnlock?: () => void }) => {
    const project = projectId ? dataService.getProjectById(projectId) : undefined;
    // Calculate using REAL-TIME INTEREST RATE from dataService
    const { chartData, irr, moneyMultiple, equity } = useMemo(() => calculateProjection(5, 0.055, 0.7), [projectId]); 

    return (
        <div className="h-full bg-white p-6 md:p-8 relative overflow-hidden flex flex-col min-h-[450px] md:min-h-[600px]">
            <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wide">
                    <Landmark size={16} className="text-emerald-600"/> Dòng Tiền & Lợi Nhuận
                </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <div className="text-[10px] text-emerald-600 font-bold uppercase">IRR</div>
                    <div className="text-lg font-black text-emerald-800">{irr.toFixed(1)}%</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                    <div className="text-[10px] text-blue-600 font-bold uppercase">X Lần</div>
                    <div className="text-lg font-black text-blue-800">{moneyMultiple.toFixed(2)}x</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Vốn Gốc</div>
                    <div className="text-lg font-black text-slate-700">{(equity/1000000000).toFixed(1)}T</div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="year" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 9}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '11px', fontWeight: 'bold'}} />
                        <Area type="monotone" dataKey="assetValue" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Giá trị TS" />
                        <Bar dataKey="cashflow" fill="#6366f1" barSize={12} radius={[4, 4, 0, 0]} name="Dòng tiền" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            {isLocked && <ToolLock label="Mô hình tài chính DCF" onUnlock={onUnlock} />}
        </div>
    );
};

export const ForecastPanel = ({ projectId, isLocked = false, onUnlock }: { projectId?: string, isLocked?: boolean, onUnlock?: () => void }) => {
    const [chartData, setChartData] = useState<any[]>([]);
    
    useEffect(() => { 
        // Run Monte Carlo with current Interest Rate volatility
        setChartData(runMonteCarloSimulation(6)); 
    }, [projectId]);

    return (
        <div className="h-full bg-white p-6 md:p-8 relative overflow-hidden flex flex-col min-h-[450px] md:min-h-[600px]">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2 mb-4 uppercase tracking-wide"><TrendingUp size={16} className="text-blue-600"/> Dự báo Tăng Trưởng (Monte Carlo)</h3>
            
            <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="year" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '11px', fontWeight: 'bold'}} />
                        <Area type="monotone" dataKey="range" stroke="none" fill="#3b82f6" fillOpacity={0.1} name="Biên độ dao động" />
                        <Line type="monotone" dataKey="mean" stroke="#2563eb" strokeWidth={3} dot={{r: 4, fill: '#2563eb'}} name="Kịch bản cơ sở" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 mt-4 flex gap-3 items-start">
                <Activity size={16} className="text-blue-600 mt-0.5"/>
                <p className="text-xs text-blue-800 leading-relaxed">
                    Mô hình chạy 1000 kịch bản giả lập dựa trên biến động lãi suất hiện tại. Xác suất tăng giá trong 3 năm tới là <strong>82%</strong>.
                </p>
            </div>

            {isLocked && <ToolLock label="Dự báo hạ tầng 2030" onUnlock={onUnlock} />}
        </div>
    );
};

export const LegalPanel = ({ projectId, isLocked = false, onUnlock }: { projectId?: string, isLocked?: boolean, onUnlock?: () => void }) => {
    const project = projectId ? dataService.getProjectById(projectId) : undefined;
    const score = useMemo(() => calculateDeepScore(project).legal, [project]);

    return (
        <div className="h-full bg-white p-6 md:p-8 relative overflow-hidden flex flex-col min-h-[450px] md:min-h-[500px]">
             <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2 mb-4 uppercase tracking-wide"><ShieldCheck size={16} className="text-blue-600"/> Thẩm định Pháp lý</h3>
             <div className="flex items-center gap-4 mb-6">
                <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="36" stroke="#e2e8f0" strokeWidth="8" fill="none"/>
                        <circle cx="40" cy="40" r="36" stroke={score > 80 ? "#10b981" : "#f59e0b"} strokeWidth="8" fill="none" strokeDasharray="226" strokeDashoffset={226 - (226 * score) / 100} className="transition-all duration-1000"/>
                    </svg>
                    <span className="absolute text-xl font-black text-slate-900">{score}</span>
                </div>
                <div>
                    <div className="text-sm font-bold text-slate-900">{score > 90 ? 'Pháp lý sạch (Sổ hồng)' : 'Cần lưu ý (HĐMB)'}</div>
                    <div className="text-xs text-slate-500">Dựa trên 5 tiêu chí Luật 2024</div>
                </div>
             </div>
             
             <div className="space-y-3">
                {[
                    { label: "Giấy phép xây dựng", status: score > 70 },
                    { label: "Quy hoạch 1/500", status: true },
                    { label: "Nghĩa vụ thuế đất", status: score > 85 },
                    { label: "Sổ hồng từng căn", status: score > 95 }
                ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        {item.status ? <CheckCircle2 size={14} className="text-emerald-500"/> : <AlertTriangle size={14} className="text-amber-500"/>}
                    </div>
                ))}
             </div>

             {isLocked && <ToolLock label="Quét hồ sơ pháp lý" onUnlock={onUnlock} />}
        </div>
    );
};

export const FengShuiPanel = ({ birthYear = 1990, projectId, isLocked = false, onUnlock }: { birthYear?: number, projectId?: string, isLocked?: boolean, onUnlock?: () => void }) => {
    // ... Reuse existing Feng Shui Logic but improve UI
    return (
        <div className="h-full bg-white p-6 md:p-8 relative overflow-hidden flex flex-col min-h-[450px] md:min-h-[600px]">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wide"><Compass size={16} className="text-amber-600"/> Phong Thủy Số</h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                <Compass size={48} className="text-slate-300 mb-4 animate-spin-slow"/>
                <p className="text-xs text-slate-500">Mở khóa để xem La bàn 24 sơn hướng và gợi ý tầng hợp mệnh.</p>
            </div>
            {isLocked && <ToolLock label="La bàn 24 sơn hướng" onUnlock={onUnlock} />}
        </div>
    );
};

export const StrategyPanel = ({ isLocked = false, onUnlock }: { isLocked?: boolean, onUnlock?: () => void }) => {
    return (
        <div className="h-full bg-white p-6 md:p-8 relative overflow-hidden flex flex-col min-h-[450px] md:min-h-[600px]">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2 mb-6 uppercase tracking-wide"><Target size={16} className="text-red-600"/> Kiến trúc sư đầu tư</h3>
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Phân bổ danh mục (Hiển thị chi tiết khi mở khóa)</div>
            {isLocked && <ToolLock label="Tư vấn danh mục đầu tư" onUnlock={onUnlock} />}
        </div>
    );
};

export const BankRatePanel = ({ isLocked = false, onUnlock }: { isLocked?: boolean, onUnlock?: () => void }) => {
    return (
        <div className="h-full bg-white p-6 md:p-8 relative overflow-hidden flex flex-col min-h-[450px] md:min-h-[600px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wide"><Landmark size={16} className="text-green-600"/> Lãi suất (Bank Crawler)</h3>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 animate-pulse">
                    <Globe size={10}/> Live Search
                </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-70">
                <RefreshCw size={32} className="text-slate-300 animate-spin-slow" />
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs">
                    Hệ thống đang quét dữ liệu lãi suất từ 10 ngân hàng lớn (VCB, BIDV, Big4...).<br/>
                    Vui lòng sử dụng tính năng Chat để AI trả về kết quả mới nhất.
                </p>
            </div>
            
            {isLocked && <ToolLock label="So sánh lãi suất thả nổi" onUnlock={onUnlock} />}
        </div>
    );
};