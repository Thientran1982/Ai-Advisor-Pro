
import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import { X, MapPin, DollarSign, CheckCircle, ArrowRight, Star, Home, Maximize2, Image as ImageIcon, FileCheck, CalendarClock, Building, TrendingUp, AlertTriangle, Lightbulb, LineChart, ChevronDown } from 'lucide-react';

interface ProjectDetailPanelProps {
  project: Project | null;
  onClose: () => void;
}

const ProjectDetailPanel: React.FC<ProjectDetailPanelProps> = ({ project, onClose }) => {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
      if (project) {
          setMounted(true);
          setIsClosing(false);
      } else {
          const timer = setTimeout(() => setMounted(false), 300);
          return () => clearTimeout(timer);
      }
  }, [project]);

  const handleClose = () => {
      setIsClosing(true);
      setTimeout(onClose, 300); 
  };
  
  if (!mounted && !project) return null;

  const displayProject = project; 
  if (!displayProject) return null;

  const allImages = [displayProject.image, ...(displayProject.gallery || [])];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end items-end md:items-stretch">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div 
        className={`
            relative w-full md:max-w-[480px] bg-white shadow-2xl flex flex-col 
            md:h-full h-[90dvh] rounded-t-[32px] md:rounded-none md:rounded-l-[32px]
            transform transition-transform duration-300 ease-out border-l border-white/10
            ${isClosing 
                ? 'translate-y-full md:translate-y-0 md:translate-x-full' // Exit
                : 'translate-y-0 md:translate-x-0 animate-in slide-in-from-bottom md:slide-in-from-right' // Enter
            }
        `}
        onClick={(e) => e.stopPropagation()} 
      >
        
        <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full z-30 pointer-events-none" />

        <button 
          onClick={handleClose}
          className="absolute top-6 right-6 z-30 p-2 bg-white/90 md:bg-black/20 hover:bg-white md:hover:bg-black/40 backdrop-blur-md text-slate-900 md:text-white rounded-full transition-all duration-300 shadow-sm group"
        >
          <X size={20} className="group-hover:scale-110 transition-transform"/>
        </button>

        {/* 1. HERO IMAGE */}
        <div className="h-[240px] md:h-[350px] shrink-0 relative group cursor-pointer overflow-hidden rounded-t-[32px] md:rounded-t-none md:rounded-tl-[32px]" onClick={() => setActiveImage(displayProject.image)}>
          <img 
            src={displayProject.image} 
            alt={displayProject.name} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-90" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/90 text-[10px] font-bold uppercase tracking-widest mb-3 backdrop-blur-md shadow-lg shadow-blue-900/20 border border-blue-500/50">
               <Building size={12} /> {displayProject.developer}
            </div>
            <h2 className="text-2xl md:text-3xl font-black leading-tight mb-2 tracking-tight">{displayProject.name}</h2>
            <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
              <MapPin size={14} className="text-blue-400" /> {displayProject.location}
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm p-3 rounded-full text-white scale-75 group-hover:scale-100 duration-300 pointer-events-none">
             <Maximize2 size={24} />
          </div>
        </div>

        {/* 2. SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 overscroll-contain">
          <div className="p-6 md:p-8 space-y-8 pb-32"> {/* Increased padding bottom for safe scroll */}
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 md:p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3 text-blue-600 group-hover:scale-110 transition-transform">
                    <DollarSign size={20} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                     Mức giá
                  </p>
                  {/* FIX: Removed truncate, added leading-tight for multi-line price */}
                  <p className="text-sm font-black text-slate-900 leading-tight">{displayProject.priceRange}</p>
               </div>
               <div className="p-4 md:p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3 text-green-600 group-hover:scale-110 transition-transform">
                    <CheckCircle size={20} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                     Tiến độ
                  </p>
                  <p className="text-sm font-black text-green-700 truncate">{displayProject.status}</p>
               </div>
            </div>

            {/* AI Deep Analysis Section */}
            {displayProject.richDetails?.marketAnalysis && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                        <LineChart size={14} className="text-indigo-600" /> Phân tích Chuyên sâu
                    </h3>
                    
                    {/* Opportunities */}
                    {displayProject.richDetails.marketAnalysis.opportunities && (
                        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-full blur-2xl opacity-50 -mr-8 -mt-8 pointer-events-none"></div>
                            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-3 flex items-center gap-2 relative z-10">
                                <Lightbulb size={14} /> Cơ hội đầu tư
                            </h4>
                            <ul className="space-y-2 relative z-10">
                                {displayProject.richDetails.marketAnalysis.opportunities.map((item, i) => (
                                    <li key={i} className="flex gap-2 text-xs text-emerald-700 font-medium items-start">
                                        <CheckCircle size={14} className="shrink-0 mt-0.5" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Risks */}
                    {displayProject.richDetails.marketAnalysis.risks && (
                        <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100/50">
                            <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <AlertTriangle size={14} /> Rủi ro cần cân nhắc
                            </h4>
                            <ul className="space-y-2">
                                {displayProject.richDetails.marketAnalysis.risks.map((item, i) => (
                                    <li key={i} className="flex gap-2 text-xs text-orange-700 font-medium items-start">
                                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 shrink-0" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Forecast */}
                    {displayProject.richDetails.marketAnalysis.forecast && (
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative">
                             <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                                <TrendingUp size={14} className="text-blue-600" /> Dự báo AI
                            </h4>
                            <div className="flex gap-3">
                                <div className="w-1 bg-blue-500 rounded-full"></div>
                                <p className="text-xs text-slate-600 italic leading-relaxed">
                                    "{displayProject.richDetails.marketAnalysis.forecast}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Highlights */}
            <div className="relative">
               <div className="pl-0">
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                   <Star size={14} className="text-amber-500 fill-amber-500" /> Điểm nhấn dự án
                 </h3>
                 <p className="text-sm text-slate-600 leading-relaxed italic bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                   <span className="text-6xl text-slate-100 absolute -top-2 -left-2 font-serif">“</span>
                   <span className="relative z-10">{displayProject.highlight}</span>
                 </p>
               </div>
            </div>

            {/* Gallery Section */}
            <div>
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                  <ImageIcon size={14} /> Thư viện hình ảnh
               </h3>
               <div className="grid grid-cols-3 gap-2">
                 {allImages.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer border border-slate-200"
                      onClick={() => setActiveImage(img)}
                    >
                       <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={`Gallery ${idx}`} />
                       <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 size={16} />
                       </div>
                    </div>
                 ))}
               </div>
               <p className="text-[10px] text-slate-400 mt-2 italic text-center">Bấm vào ảnh để xem kích thước lớn</p>
            </div>

            {/* Legal & Payment Info */}
            <div className="space-y-4">
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                  <FileCheck size={14} className="text-purple-600" /> Pháp lý & Thanh toán
               </h3>
               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                       <FileCheck size={12} /> Tình trạng pháp lý
                     </p>
                     <p className="text-xs font-bold text-slate-700 leading-relaxed">
                       {displayProject.legalStatus}
                     </p>
                  </div>
                  <div className="w-full h-px bg-slate-50"></div>
                  <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                       <CalendarClock size={12} /> Lịch thanh toán
                     </p>
                     <p className="text-xs font-bold text-slate-700 leading-relaxed">
                       {displayProject.paymentSchedule}
                     </p>
                  </div>
               </div>
            </div>

            {/* Product Types */}
            <div className="pb-10">
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                  <Home size={14} /> Loại hình sản phẩm
               </h3>
               <div className="flex flex-wrap gap-2.5">
                 {displayProject.type.map((t, idx) => (
                   <span key={idx} className="px-4 py-2 bg-white text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all cursor-default">
                     {t}
                   </span>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* 3. STICKY FOOTER ACTIONS - SAFE AREA OPTIMIZED */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 border-t border-slate-200 bg-white shrink-0 pb-safe z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-b-none md:rounded-bl-[32px]">
           <button 
             className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all duration-300 shadow-xl shadow-slate-200 hover:shadow-indigo-200 flex items-center justify-center gap-3 group active:scale-[0.98]"
             onClick={handleClose}
           >
             Đăng ký tham quan thực tế <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>

      </div>

      {activeImage && (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setActiveImage(null)}>
           <button className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-2 bg-white/10 rounded-full">
              <X size={24} />
           </button>
           <img 
             src={activeImage} 
             className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
             alt="Full view" 
             onClick={(e) => e.stopPropagation()} 
           />
        </div>
      )}

    </div>
  );
};

export default ProjectDetailPanel;
