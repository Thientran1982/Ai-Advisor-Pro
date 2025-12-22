
import React, { useState, useEffect, useRef } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
  ReferenceLine, Label, LabelList, LineChart as ReLineChart, Line
} from 'recharts';
import { 
  Calculator, AlertTriangle, CheckCircle2, FileText, 
  ShieldCheck, Wind, Users, Activity, TrendingUp, Building2,
  Scale, AlertCircle, ArrowRight, Home, Map, Train, Eye,
  Mic, Play, Square, Loader2, GitCompare, Wallet, PiggyBank, CreditCard, Coins, Sparkles, LineChart, Globe,
  Leaf, Info, Search, ArrowUp, ArrowDown, Star, Calendar, Check,
  X, ShieldAlert, Gavel, FileWarning, DollarSign, Percent, ArrowRightLeft,
  Briefcase, Target, Layers, Car, ThermometerSun, Umbrella, MessageCircle, ThumbsUp, ThumbsDown, PartyPopper, Smile, Heart,
  BookOpen, Coffee, ShoppingBag, Clapperboard, Bus, Dumbbell, Scissors, Dog, Landmark, MapPin, Upload, Grid, Wifi, Compass, ArrowRightCircle
} from 'lucide-react';
import { BANK_DATA, VALUATION_FACTORS, FEATURED_PROJECTS } from '../constants';
import { generateSpeech } from '../services/geminiService';
import { GoogleGenAI } from "@google/genai";

// --- HELPER: DECODE AUDIO ---
const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

// --- HELPER: OPTIMIZED IMAGE TO BASE64 (RESIZE) ---
const resizeImageToBase64 = (file: File, maxWidth = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = height * (maxWidth / width);
          width = maxWidth;
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = elem.toDataURL('image/jpeg', 0.6);
        const base64Data = dataUrl.split(',')[1];
        resolve(base64Data);
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

const MarketHeatmap = () => {
  const matrix = [
    { name: 'Quận 1', data: [95, 80, 40] },
    { name: 'Thủ Thiêm', data: [90, 85, 50] },
    { name: 'Quận 7', data: [70, 75, 45] },
    { name: 'Thủ Đức', data: [60, 70, 85] },
    { name: 'Bình Thạnh', data: [65, 80, 55] },
  ];
  const segments = ['Hạng sang', 'Trung cấp', 'Nhà phố'];
  
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-400';
    if (score >= 40) return 'bg-yellow-400';
    return 'bg-blue-300';
  };
  
  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 animate-in fade-in duration-300">
       <div className="grid grid-cols-4 gap-1 mb-2 border-b border-slate-200 pb-2">
          <div className="text-[9px] font-bold text-slate-400 uppercase flex items-end">Khu vực</div>
          {segments.map(s => <div key={s} className="text-[9px] font-bold text-center text-slate-500 uppercase">{s}</div>)}
       </div>
       <div className="space-y-1.5">
          {matrix.map((row, i) => (
             <div key={i} className="grid grid-cols-4 gap-1 items-center">
                <div className="text-[10px] font-bold text-slate-700">{row.name}</div>
                {row.data.map((score, j) => (
                   <div key={j} className={`h-7 rounded-md ${getColor(score)} flex items-center justify-center text-white text-[10px] font-bold shadow-sm hover:scale-105 transition-transform cursor-default relative group`}>
                      {score}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white p-1.5 rounded-lg text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                         Cầu: {score > 80 ? 'Rất cao' : score > 60 ? 'Cao' : 'TB'}
                      </div>
                   </div>
                ))}
             </div>
          ))}
       </div>
       <div className="mt-4 flex gap-3 justify-center border-t border-slate-200 pt-2">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[9px] text-slate-500">Sốt nóng</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div><span className="text-[9px] text-slate-500">Sôi động</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-300"></div><span className="text-[9px] text-slate-500">Trầm lắng</span></div>
       </div>
    </div>
  )
}

// --- FENG SHUI PANEL ---
export const FengShuiPanel = () => {
    const [birthYear, setBirthYear] = useState(1990);
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [viewDirection, setViewDirection] = useState('Đông Nam');

    const calculateKua = () => {
        let sum = 0;
        const yearStr = birthYear.toString();
        for (let i = 0; i < yearStr.length; i++) sum += parseInt(yearStr[i]);
        while (sum > 9) sum = Math.floor(sum / 10) + (sum % 10);
        
        let kua = 0;
        if (gender === 'male') {
            kua = 11 - sum;
        } else {
            kua = sum + 4;
        }
        
        while (kua > 9) kua = Math.floor(kua / 10) + (kua % 10);
        if (kua === 5) return gender === 'male' ? 2 : 8;
        return kua;
    };

    const kua = calculateKua();
    const isEastGroup = [1, 3, 4, 9].includes(kua);
    const groupName = isEastGroup ? 'Đông Tứ Trạch' : 'Tây Tứ Trạch';
    
    const goodDirections = isEastGroup
        ? ['Bắc (N)', 'Đông (E)', 'Nam (S)', 'Đông Nam (SE)'] 
        : ['Tây (W)', 'Tây Bắc (NW)', 'Tây Nam (SW)', 'Đông Bắc (NE)'];
        
    const badDirections = isEastGroup
        ? ['Tây Bắc', 'Đông Bắc', 'Tây Nam', 'Tây']
        : ['Bắc', 'Đông', 'Đông Nam', 'Nam'];

    const getRecommendation = () => {
        const simplifiedGood = isEastGroup ? ['Bắc', 'Đông', 'Nam', 'Đông Nam'] : ['Tây', 'Tây Bắc', 'Tây Nam', 'Đông Bắc'];
        const isGood = simplifiedGood.includes(viewDirection);
        
        if (isGood) return { text: "ĐẠI CÁT (Sinh Khí/Thiên Y)", color: "text-green-600", bg: "bg-green-100" };
        return { text: "KHÔNG HỢP (Tuyệt Mệnh/Ngũ Quỷ)", color: "text-red-600", bg: "bg-red-100" };
    };

    const rec = getRecommendation();

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Compass size={20} /></div>
                <div><h3 className="font-bold text-slate-900">La Bàn Phong Thuỷ 4.0</h3><p className="text-xs text-slate-500">Xem tuổi hợp hướng nhà</p></div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Năm sinh gia chủ</label>
                        <input type="number" value={birthYear} onChange={e => setBirthYear(Number(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 font-bold text-center" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Giới tính</label>
                        <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                            <button onClick={() => setGender('male')} className={`flex-1 py-1 rounded text-xs font-bold ${gender === 'male' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Nam</button>
                            <button onClick={() => setGender('female')} className={`flex-1 py-1 rounded text-xs font-bold ${gender === 'female' ? 'bg-pink-500 text-white' : 'text-slate-500'}`}>Nữ</button>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm text-center border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Cung mệnh</p>
                    <p className="text-2xl font-black text-slate-900 mb-1">Số {kua} - {groupName}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase ${isEastGroup ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        Nhóm: {isEastGroup ? 'Đông Tứ Mệnh' : 'Tây Tứ Mệnh'}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                        <h4 className="text-[10px] font-bold text-green-800 uppercase mb-2 flex items-center gap-1"><CheckCircle2 size={12} /> Hướng Tốt (Cát)</h4>
                        <ul className="space-y-1">
                            {goodDirections.map((d, i) => (
                                <li key={i} className="text-xs font-bold text-green-700 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {d}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                        <h4 className="text-[10px] font-bold text-red-800 uppercase mb-2 flex items-center gap-1"><ShieldAlert size={12} /> Hướng Xấu (Hung)</h4>
                        <ul className="space-y-1">
                            {badDirections.map((d, i) => (
                                <li key={i} className="text-xs font-bold text-red-700 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {d}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <label className="text-[10px] font-bold text-indigo-400 uppercase block mb-2">Kiểm tra Hướng Căn Hộ</label>
                    <select 
                        value={viewDirection} 
                        onChange={(e) => setViewDirection(e.target.value)}
                        className="w-full p-2 rounded-lg border border-indigo-200 text-sm font-bold text-indigo-900 mb-3 outline-none"
                    >
                        <option>Đông</option><option>Tây</option><option>Nam</option><option>Bắc</option>
                        <option>Đông Nam</option><option>Đông Bắc</option><option>Tây Nam</option><option>Tây Bắc</option>
                    </select>
                    <div className={`p-3 rounded-lg text-center font-bold text-sm ${rec.bg} ${rec.color} transition-colors duration-300`}>
                        {rec.text}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MarketForecastPanel = () => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'heatmap'>('forecast');
  const [gdp, setGdp] = useState(6.5);
  const [supplyChange, setSupplyChange] = useState(-30);
  const [basePrice, setBasePrice] = useState(3.8);

  const [isNarrating, setIsNarrating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => { return () => stopAudio(); }, []);

  const stopAudio = () => {
    if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch (e) {}
        audioSourceRef.current = null;
    }
    setIsNarrating(false);
  };

  const handleNarrate = async () => {
    if (isNarrating) { stopAudio(); return; }
    setIsGeneratingAudio(true);
    const generatedScript = `Dựa trên dữ liệu GDP tăng trưởng ${gdp}% và nguồn cung giảm ${Math.abs(supplyChange)}%, tôi dự báo giá BĐS sẽ tăng trưởng dương trong 12 tháng tới. Đây là thời điểm tốt để xuống tiền.`;
    
    try {
        const audioBase64 = await generateSpeech(generatedScript, 'Fenrir');
        if (audioBase64) {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

            const audioData = decodeBase64(audioBase64);
            const buffer = await audioContextRef.current.decodeAudioData(audioData.buffer);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => setIsNarrating(false);
            audioSourceRef.current = source;
            source.start();
            setIsNarrating(true);
        }
    } catch (error) { setIsGeneratingAudio(false); } finally { setIsGeneratingAudio(false); }
  };

  const optGrowthPct = 12 + (gdp - 6.5);
  const baseGrowthPctLow = 5 + (gdp - 6.5) * 0.5;
  const optRange = `${(basePrice * (1 + optGrowthPct/100)).toFixed(2)}`;
  const baseRange = `${(basePrice * (1 + baseGrowthPctLow/100)).toFixed(2)}`;

  return (
    <div className="space-y-4 h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><LineChart size={20} /></div>
            <div><h3 className="font-bold text-slate-900">Tổng quan</h3><p className="text-xs text-slate-500">Phân tích 12 khía cạnh</p></div>
        </div>
        <button onClick={handleNarrate} disabled={isGeneratingAudio} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm ${isNarrating ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {isGeneratingAudio ? <Loader2 size={12} className="animate-spin" /> : isNarrating ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            {isGeneratingAudio ? 'Đang tạo...' : isNarrating ? 'Dừng đọc' : 'AI Tổng kết'}
        </button>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl mb-1">
          <button onClick={() => setActiveTab('forecast')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'forecast' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Dự báo 12 tháng</button>
          <button onClick={() => setActiveTab('heatmap')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'heatmap' ? 'bg-white shadow text-red-600' : 'text-slate-500 hover:text-slate-700'}`}><Grid size={10} /> Heatmap</button>
      </div>

      {activeTab === 'heatmap' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1"><MarketHeatmap /></div>
      ) : (
        <>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm shrink-0">
                <div className="bg-slate-900 text-white p-3 text-center font-bold text-xs uppercase tracking-wider">Dự báo giá 12 tháng</div>
                <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                        <span className="text-slate-500 font-medium">Giá hiện tại</span>
                        <div className="flex items-center gap-2">
                            <input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} className="w-16 text-right font-black text-slate-900 text-base md:text-sm bg-slate-50 rounded border-none focus:ring-1 focus:ring-indigo-200 outline-none" />
                            <span className="font-bold text-slate-900 text-sm">Tỷ</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs"><span className="text-green-700 font-bold flex items-center gap-1"><ArrowUp size={12} /> Lạc quan</span><span className="font-bold text-slate-800">{optRange} Tỷ <span className="text-green-600 text-[10px]">({`+${optGrowthPct.toFixed(1)}%`})</span></span></div>
                        <div className="flex items-center justify-between text-xs bg-blue-50 p-1.5 rounded-lg border border-blue-100"><span className="text-blue-700 font-bold flex items-center gap-1"><Square size={10} fill="currentColor" /> Cơ sở</span><span className="font-bold text-slate-800">{baseRange} Tỷ <span className="text-blue-600 text-[10px]">({`+${baseGrowthPctLow.toFixed(1)}%`})</span></span></div>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-1">Tham số thị trường</p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Globe size={12} /> Kinh tế Vĩ mô</h4>
                    <div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-700">GDP Growth</span><span className="font-bold text-indigo-600">{gdp}%</span></div>
                    <input type="range" min="4" max="9" step="0.1" value={gdp} onChange={e => setGdp(Number(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Activity size={12} /> Cung & Cầu</h4>
                    <div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-700">Nguồn cung</span><span className="font-bold text-red-600">{supplyChange}%</span></div>
                    <input type="range" min="-50" max="50" step="5" value={supplyChange} onChange={e => setSupplyChange(Number(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export const FinancialPanel = () => {
  const [propertyPrice, setPropertyPrice] = useState(3.8); 
  const [rentalPrice, setRentalPrice] = useState(18); 
  const [loanPercent, setLoanPercent] = useState(50); 
  const [interestRate, setInterestRate] = useState(8.5); 
  const [appreciationRate, setAppreciationRate] = useState(7); 
  const [projectionYears, setProjectionYears] = useState(5);
  const [sellingFeePercent, setSellingFeePercent] = useState(3);
  const [incomeTaxPercent, setIncomeTaxPercent] = useState(2);

  const totalInvestmentCost = (propertyPrice * 1000) * 1.03;
  const loanAmount = totalInvestmentCost * (loanPercent / 100);
  const equity = totalInvestmentCost - loanAmount;
  
  const annualInterest = loanAmount * (interestRate / 100);
  const annualRent = rentalPrice * 11; 
  const netCashFlow = annualRent - annualInterest - (annualRent * 0.05);

  const futureValue = (propertyPrice * 1000) * Math.pow(1 + (appreciationRate / 100), projectionYears);
  const sellingCost = futureValue * ((sellingFeePercent + incomeTaxPercent) / 100);
  const netProceeds = futureValue - sellingCost - loanAmount;
  const totalProfit = netProceeds + (netCashFlow * projectionYears) - equity;
  const annualROI = (equity > 0) ? (totalProfit / equity / projectionYears) * 100 : 0;

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(val);

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
            <div><h3 className="font-bold text-slate-900">Hiệu quả Đầu tư (Net Profit)</h3><p className="text-xs text-slate-500">Đã trừ Thuế & Phí môi giới</p></div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
             <div className="flex justify-between items-center mb-3"><h4 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><DollarSign size={12} /> Thông số đầu vào</h4></div>
             <div className="grid grid-cols-2 gap-3">
                 <div><label className="text-[9px] font-bold text-slate-400 block mb-1">Giá Mua (Tỷ)</label><input type="number" step="0.1" value={propertyPrice} onChange={e=>setPropertyPrice(Number(e.target.value))} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none" /></div>
                 <div><label className="text-[9px] font-bold text-slate-400 block mb-1">Cho thuê (Tr/th)</label><input type="number" value={rentalPrice} onChange={e=>setRentalPrice(Number(e.target.value))} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none" /></div>
             </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
             <div className="flex justify-between items-center mb-2"><h4 className="text-[10px] font-bold text-slate-800 uppercase">Dòng tiền hàng năm</h4><span className={`text-sm font-black ${netCashFlow > 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(netCashFlow)} Tr</span></div>
             <div className="w-full h-px bg-slate-100 my-1"></div>
             <div className="flex justify-between text-[10px] text-slate-500">
                 <span>Thu nhập thuê: +{formatCurrency(annualRent)}</span>
                 <span>Lãi vay: -{formatCurrency(annualInterest)}</span>
             </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl text-white shadow-lg">
              <div className="flex justify-between items-center mb-3"><h4 className="text-[10px] font-bold text-slate-400 uppercase">Dự phóng 5 năm ({appreciationRate}%/năm)</h4><TrendingUp size={14} className="text-green-400" /></div>
              <div className="grid grid-cols-2 gap-4 mb-3 text-center">
                  <div><p className="text-[9px] text-slate-500 uppercase">Giá bán tương lai</p><p className="text-sm font-bold text-white">{formatCurrency(futureValue/1000)} Tỷ</p></div>
                  <div><p className="text-[9px] text-slate-500 uppercase">Lợi nhuận RÒNG</p><p className="text-sm font-bold text-green-400">+{formatCurrency(totalProfit/1000)} Tỷ</p></div>
              </div>
              <div className="bg-white/10 p-2 rounded-lg text-center border border-white/5"><p className="text-[9px] text-slate-300 mb-1">ROI Thực Tế (Net IRR)</p><p className="text-xl font-black text-yellow-400">{annualROI.toFixed(1)}% / năm</p></div>
              <p className="text-[9px] text-center text-slate-500 mt-2 italic">*Đã trừ: Phí môi giới bán ({sellingFeePercent}%) & Thuế TNCN ({incomeTaxPercent}%)</p>
          </div>
      </div>
    </div>
  );
};

export const LegalPanel = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const base64 = await resizeImageToBase64(file, 800);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64 } }, { text: "Phân tích rủi ro pháp lý của tài liệu này dựa trên Luật Đất Đai 2024..." }] }
      });
      setAnalysisResult(response.text || "Không thể phân tích.");
    } catch (error) { setAnalysisResult("Lỗi kết nối."); } finally { setAnalyzing(false); }
  };

  return (
    <div className="space-y-4 h-full flex flex-col relative">
       <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><div className="p-2 bg-red-100 text-red-600 rounded-lg"><ShieldCheck size={20} /></div><div><h3 className="font-bold text-slate-900">Rà soát Pháp lý (Luật 2024)</h3><p className="text-xs text-slate-500">AI Contract Scanner</p></div></div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
               <h4 className="text-[10px] font-bold text-red-800 uppercase mb-3 flex items-center gap-2">
                  <Gavel size={12} /> Tuân thủ Luật Mới (Hiệu lực 2024)
               </h4>
               <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-red-50">
                     <span className="text-xs font-bold text-slate-700">Đặt cọc tối đa 5%</span>
                     <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Luật KDBĐS</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-red-50">
                     <span className="text-xs font-bold text-slate-700">Công khai hồ sơ 1/500</span>
                     <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Bắt buộc</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-red-50">
                     <span className="text-xs font-bold text-slate-700">Bảo lãnh ngân hàng</span>
                     <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">An toàn vốn</span>
                  </div>
               </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-2 relative z-10"><h4 className="font-bold text-slate-700 text-sm">Điểm Pháp Lý Dự Án</h4><span className="text-xl font-black text-yellow-600">7/10</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2 relative z-10"><div className="bg-gradient-to-r from-green-400 to-yellow-500 h-2 rounded-full" style={{width: '70%'}}></div></div>
                <p className="text-xs text-slate-500 relative z-10"><span className="font-bold text-slate-700">Cơ bản ổn</span>, cần check kỹ điều khoản phạt chậm bàn giao.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed hover:border-indigo-300 transition-colors group">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Eye size={12} /> AI Soi Hợp Đồng</h5>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                <div onClick={() => fileInputRef.current?.click()} className={`cursor-pointer w-full py-6 flex flex-col items-center justify-center gap-2 rounded-xl transition-all ${analyzing ? 'bg-indigo-50 border border-indigo-200' : 'bg-white border border-slate-200 group-hover:bg-indigo-50/50'}`}>
                   {analyzing ? <Loader2 size={24} className="animate-spin text-indigo-600" /> : <><div className="p-2 bg-indigo-100 text-indigo-600 rounded-full mb-1 group-hover:scale-110 transition-transform"><Upload size={20} /></div><span className="text-xs font-bold text-slate-600">Tải ảnh Hợp đồng</span></>}
                </div>
                {analysisResult && <div className="mt-4 bg-white p-4 rounded-xl border border-red-100 shadow-sm"><div className="text-xs text-slate-700 whitespace-pre-line">{analysisResult}</div></div>}
            </div>
        </div>
    </div>
  )
}

// --- UPDATED: COMPARISON PANEL (FULLY FUNCTIONAL) ---
export const ComparisonPanel = () => {
    const [projectAId, setProjectAId] = useState(FEATURED_PROJECTS[0]?.id || '');
    const [projectBId, setProjectBId] = useState(FEATURED_PROJECTS[1]?.id || '');

    const projectA = FEATURED_PROJECTS.find(p => p.id === projectAId);
    const projectB = FEATURED_PROJECTS.find(p => p.id === projectBId);

    if (!projectA || !projectB) return <div className="p-4 text-center text-xs text-slate-500">Chưa có dữ liệu dự án.</div>;

    const ComparisonRow = ({ label, valA, valB, highlight = false }: any) => (
        <div className={`grid grid-cols-3 gap-2 py-3 border-b border-slate-100 last:border-0 ${highlight ? 'bg-indigo-50/50' : ''}`}>
             <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center">{label}</div>
             <div className="text-xs font-semibold text-slate-700">{valA}</div>
             <div className="text-xs font-semibold text-slate-700">{valB}</div>
        </div>
    );

    return (
        <div className="h-full flex flex-col space-y-4">
             <div className="flex items-center gap-2 mb-2"><div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><GitCompare size={20} /></div><div><h3 className="font-bold text-slate-900">So sánh Dự án</h3><p className="text-xs text-slate-500">Đối chiếu trực tiếp</p></div></div>
             
             {/* Selectors */}
             <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <select value={projectAId} onChange={(e) => setProjectAId(e.target.value)} className="w-full text-xs font-bold p-2 rounded-lg border border-slate-200 bg-white outline-none">
                    {FEATURED_PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={projectBId} onChange={(e) => setProjectBId(e.target.value)} className="w-full text-xs font-bold p-2 rounded-lg border border-slate-200 bg-white outline-none">
                     {FEATURED_PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-3 gap-2 bg-slate-900 text-white p-3 text-xs font-bold">
                        <div>TIÊU CHÍ</div>
                        <div className="truncate">{projectA.name}</div>
                        <div className="truncate">{projectB.name}</div>
                    </div>
                    <div className="p-3">
                        <ComparisonRow label="Giá bán" valA={projectA.priceRange} valB={projectB.priceRange} highlight />
                        <ComparisonRow label="Vị trí" valA={projectA.location} valB={projectB.location} />
                        <ComparisonRow label="Chủ đầu tư" valA={projectA.developer} valB={projectB.developer} />
                        <ComparisonRow label="Pháp lý" valA={projectA.legalStatus} valB={projectB.legalStatus} />
                        <ComparisonRow label="Thanh toán" valA={projectA.paymentSchedule} valB={projectB.paymentSchedule} />
                        <ComparisonRow label="Điểm nhấn" valA={projectA.highlight} valB={projectB.highlight} />
                    </div>
                </div>
                
                <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <h4 className="text-[10px] font-bold text-indigo-700 uppercase mb-2 flex items-center gap-2"><Sparkles size={12} /> Nhận định AI</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        Nếu ưu tiên <strong>dòng tiền</strong>, {projectA.name} có lợi thế về chính sách thanh toán. 
                        Tuy nhiên, {projectB.name} có <strong>vị trí</strong> đắc địa hơn cho việc tăng giá vốn dài hạn.
                    </p>
                </div>
             </div>
        </div>
    )
}

export const ValuationPanel = () => {
    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center gap-2 mb-2"><div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Home size={20} /></div><div><h3 className="font-bold text-slate-900">Định giá BĐS</h3><p className="text-xs text-slate-500">Ước tính giá trị thị trường</p></div></div>
            <div className="flex-1 overflow-y-auto custom-scrollbar"><div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center text-slate-400 text-xs">Tính năng đang được nâng cấp để kết nối với Big Data. Vui lòng quay lại sau.</div></div>
        </div>
    )
}

// --- UPDATED: LOAN ADVISORY (SORTED + INTERACTIVE) ---
export const LoanAdvisoryPanel = () => {
    const [sortMode, setSortMode] = useState<'rate' | 'ltv'>('rate');
    
    const sortedBanks = [...BANK_DATA].sort((a, b) => {
        if (sortMode === 'rate') return a.rateFirstYear - b.rateFirstYear;
        return b.maxLoanRatio - a.maxLoanRatio;
    });

    return (
        <div className="h-full flex flex-col space-y-4">
             <div className="flex items-center gap-2 mb-2"><div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Wallet size={20} /></div><div><h3 className="font-bold text-slate-900">Tư vấn Gói vay</h3><p className="text-xs text-slate-500">So sánh Lãi suất & Tỷ lệ vay</p></div></div>
             
             <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button onClick={() => setSortMode('rate')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${sortMode === 'rate' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>Lãi suất thấp nhất</button>
                 <button onClick={() => setSortMode('ltv')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${sortMode === 'ltv' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Vay cao nhất (LTV)</button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 p-1">
                {sortedBanks.map((bank, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all group relative overflow-hidden">
                         {index === 0 && sortMode === 'rate' && (
                             <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg">TOP 1</div>
                         )}
                         <div className="flex justify-between items-center mb-2">
                             <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><Landmark size={14} className="text-slate-400" /> {bank.bankName}</h4>
                             <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs font-black">{bank.rateFirstYear}%</span>
                         </div>
                         <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                             <div>Biên độ thả nổi: <span className="font-bold text-slate-700">{bank.rateFloating}</span></div>
                             <div>Vay tối đa: <span className="font-bold text-slate-700">{bank.maxLoanRatio}%</span></div>
                             <div>Thời hạn: <span className="font-bold text-slate-700">{bank.term} năm</span></div>
                             <div>Phạt trả sớm: <span className="font-bold text-slate-700">{bank.earlyFee}</span></div>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export const LifestylePanel = () => {
  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center gap-2 mb-2"><div className="p-2 bg-pink-100 text-pink-600 rounded-lg"><Leaf size={20} /></div><div><h3 className="font-bold text-slate-900">Phong cách sống</h3><p className="text-xs text-slate-500">Chỉ số hạnh phúc</p></div></div>
      <div className="flex-1 bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-400 text-xs">Chức năng đang cập nhật...</div>
    </div>
  );
};

// --- UPDATED: RENT VS BUY (FULLY FUNCTIONAL) ---
export const RentVsBuyPanel = () => {
    const [homePrice, setHomePrice] = useState(5); // Tỷ
    const [rentPrice, setRentPrice] = useState(15); // Triệu/tháng
    const [years, setYears] = useState(10);
    const [appreciation, setAppreciation] = useState(7); // % Growth
    const [investmentReturn, setInvestmentReturn] = useState(8); // % Stock/Bond return for cash

    // Simple Calculation
    // BUY: Equity = (Price * (1+growth)^n) - LoanBalance. (Simplified: Assume paid off or just Asset Value for comparison)
    // RENT: Portfolio = InitialDownpayment * (1+return)^n + MonthlySavings * FV_Factor
    
    // Detailed Simulation
    const data = [];
    let buyValue = homePrice * 1000; // In Millions
    let rentPortfolio = (homePrice * 1000 * 0.3); // Assume 30% Downpayment invested
    const monthlyMortgage = (homePrice * 1000 * 0.7 * 0.09) / 12; // Simple interest estimate
    const monthlyRent = rentPrice;
    const monthlyDiff = monthlyMortgage - monthlyRent; // If Buy costs more, Rent saves this

    for (let i = 0; i <= years; i++) {
        data.push({
            year: `Năm ${i}`,
            buy: Math.round(buyValue),
            rent: Math.round(rentPortfolio)
        });
        buyValue = buyValue * (1 + appreciation/100);
        rentPortfolio = rentPortfolio * (1 + investmentReturn/100);
        if (monthlyDiff > 0) {
            rentPortfolio += (monthlyDiff * 12); // Add savings to portfolio
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(val/1000) + ' Tỷ';

    return (
        <div className="h-full flex flex-col space-y-4">
             <div className="flex items-center gap-2 mb-2"><div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><ArrowRightLeft size={20} /></div><div><h3 className="font-bold text-slate-900">Mua hay Thuê?</h3><p className="text-xs text-slate-500">Phân tích {years} năm</p></div></div>
             
             <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                 <div><label className="text-[9px] font-bold text-slate-400 block mb-1">Giá nhà (Tỷ)</label><input type="number" value={homePrice} onChange={e=>setHomePrice(Number(e.target.value))} className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-bold" /></div>
                 <div><label className="text-[9px] font-bold text-slate-400 block mb-1">Giá thuê (Tr/th)</label><input type="number" value={rentPrice} onChange={e=>setRentPrice(Number(e.target.value))} className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-bold" /></div>
                 <div><label className="text-[9px] font-bold text-slate-400 block mb-1">BĐS Tăng (%)</label><input type="number" value={appreciation} onChange={e=>setAppreciation(Number(e.target.value))} className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-bold" /></div>
                 <div><label className="text-[9px] font-bold text-slate-400 block mb-1">Lãi đầu tư (%)</label><input type="number" value={investmentReturn} onChange={e=>setInvestmentReturn(Number(e.target.value))} className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-bold" /></div>
             </div>

             <div className="flex-1 w-full min-h-0 bg-white border border-slate-100 rounded-xl p-2">
                 <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                         <defs>
                             <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8}/>
                                 <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                             </linearGradient>
                             <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#F97316" stopOpacity={0.8}/>
                                 <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                             </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} />
                         <XAxis dataKey="year" tick={{fontSize: 10}} />
                         <YAxis tick={{fontSize: 10}} tickFormatter={(val) => (val/1000).toFixed(0) + 'T'} />
                         <ReTooltip contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                         <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                         <Area type="monotone" dataKey="buy" name="Tài sản Mua" stroke="#2563EB" fillOpacity={1} fill="url(#colorBuy)" />
                         <Area type="monotone" dataKey="rent" name="Tài sản Thuê" stroke="#F97316" fillOpacity={1} fill="url(#colorRent)" />
                     </AreaChart>
                 </ResponsiveContainer>
             </div>

             <div className="bg-slate-900 p-3 rounded-xl text-white shadow-lg flex justify-between items-center">
                 <div>
                     <p className="text-[10px] text-slate-400 uppercase">Sau {years} năm</p>
                     <p className="text-xs font-bold">Chênh lệch tài sản</p>
                 </div>
                 <div className="text-right">
                     <p className="text-lg font-black text-emerald-400">
                         {formatCurrency(Math.abs(data[data.length-1].buy - data[data.length-1].rent))}
                     </p>
                     <p className="text-[10px] text-slate-300">
                         Nghiêng về: <span className="font-bold text-white uppercase">{data[data.length-1].buy > data[data.length-1].rent ? 'MUA NHÀ' : 'ĐI THUÊ'}</span>
                     </p>
                 </div>
             </div>
        </div>
    )
}

export const FinancialPlanPanel = () => {
    return (
        <div className="h-full flex flex-col space-y-4">
             <div className="flex items-center gap-2 mb-2"><div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><PiggyBank size={20} /></div><div><h3 className="font-bold text-slate-900">Kế hoạch Tài chính</h3><p className="text-xs text-slate-500">Khả năng mua nhà</p></div></div>
             <div className="flex-1 bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-400 text-xs">Chức năng đang cập nhật...</div>
        </div>
    )
}
