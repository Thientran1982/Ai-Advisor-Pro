
import React, { useState } from 'react';
import { Project } from '../types';
import { X, MapPin, DollarSign, Building, CheckCircle, ArrowRight, Star, Home, Maximize2, Image as ImageIcon, FileCheck, CalendarClock } from 'lucide-react';

interface ProjectDetailPanelProps {
  project: Project | null;
  onClose: () => void;
}

const ProjectDetailPanel: React.FC<ProjectDetailPanelProps> = ({ project, onClose }) => {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  
  if (!project) return null;

  // Combine main image and gallery for the preview list
  const allImages = [project.image, ...(project.gallery || [])];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-[480px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out border-l border-white/20">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full transition-all duration-300 border border-white/20"
        >
          <X size={20} />
        </button>

        {/* Hero Image Section */}
        <div className="h-[350px] shrink-0 relative group cursor-pointer" onClick={() => setActiveImage(project.image)}>
          <img 
            src={project.image} 
            alt={project.name} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-90" />
          
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/90 text-[10px] font-bold uppercase tracking-widest mb-4 backdrop-blur-md shadow-lg shadow-blue-900/20 border border-blue-500/50">
               <Building size={12} /> {project.developer}
            </div>
            <h2 className="text-3xl font-black leading-tight mb-2 tracking-tight">{project.name}</h2>
            <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
              <MapPin size={14} className="text-blue-400" /> {project.location}
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm p-3 rounded-full text-white">
             <Maximize2 size={24} />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
          <div className="p-8 space-y-8">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-blue-600">
                    <DollarSign size={16} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                     Mức giá
                  </p>
                  <p className="text-sm font-black text-slate-900">{project.priceRange}</p>
               </div>
               <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mb-3 text-green-600">
                    <CheckCircle size={16} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                     Tiến độ
                  </p>
                  <p className="text-sm font-black text-green-700">{project.status}</p>
               </div>
            </div>

            {/* Legal & Payment Info */}
            <div className="space-y-4">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <FileCheck size={16} className="text-purple-600" /> Pháp lý & Thanh toán
               </h3>
               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                       <FileCheck size={12} /> Tình trạng pháp lý
                     </p>
                     <p className="text-xs font-bold text-slate-700 leading-relaxed">
                       {project.legalStatus}
                     </p>
                  </div>
                  <div className="w-full h-px bg-slate-50"></div>
                  <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                       <CalendarClock size={12} /> Lịch thanh toán
                     </p>
                     <p className="text-xs font-bold text-slate-700 leading-relaxed">
                       {project.paymentSchedule}
                     </p>
                  </div>
               </div>
            </div>

            {/* Highlights */}
            <div className="relative">
               <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full"></div>
               <div className="pl-4">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                   <Star size={16} className="text-amber-500 fill-amber-500" /> Điểm nhấn đầu tư
                 </h3>
                 <p className="text-sm text-slate-600 leading-relaxed italic bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                   "{project.highlight}"
                 </p>
               </div>
            </div>

            {/* Gallery Section */}
            <div>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <ImageIcon size={16} /> Thư viện hình ảnh
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

            {/* Product Types */}
            <div>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Home size={16} /> Loại hình sản phẩm
               </h3>
               <div className="flex flex-wrap gap-2.5">
                 {project.type.map((t, idx) => (
                   <span key={idx} className="px-4 py-2 bg-white text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all cursor-default">
                     {t}
                   </span>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-white shrink-0 safe-area-bottom z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           <button 
             className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all duration-300 shadow-xl shadow-slate-200 hover:shadow-blue-200 flex items-center justify-center gap-3 group active:scale-[0.98]"
             onClick={onClose}
           >
             Đăng ký tham quan thực tế <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>

      </div>

      {/* Lightbox Modal for Image Inspection */}
      {activeImage && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setActiveImage(null)}>
           <button className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
              <X size={32} />
           </button>
           <img 
             src={activeImage} 
             className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
             alt="Full view" 
             onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
           />
        </div>
      )}

    </div>
  );
};

export default ProjectDetailPanel;
