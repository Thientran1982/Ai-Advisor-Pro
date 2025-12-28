
import React, { useState, useEffect } from 'react';
import { 
  Check, ArrowRight, MessageSquare, Globe, Users, Play, CreditCard, ChevronDown, ChevronUp, Scale, Compass, Tag, Star, HeartHandshake, Menu, X, Zap,
  Database, BrainCircuit, LineChart, ShieldCheck, Target
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: (plan: 'free' | 'pro') => void;
  onTryDemo: () => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
}

const TypewriterEffect = () => {
    // REFINED: Focus on Human Actions enabled by Data
    const words = ["Xây Dựng Niềm Tin", "Thấu Hiểu Khách Hàng", "Tư Vấn Có Cơ Sở", "Nâng Tầm Vị Thế"];
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [reverse, setReverse] = useState(false);
    const [blink, setBlink] = useState(true);

    useEffect(() => { const timeout2 = setTimeout(() => { setBlink((prev) => !prev); }, 500); return () => clearTimeout(timeout2); }, [blink]);
    useEffect(() => {
        if (subIndex === words[index].length + 1 && !reverse) { setTimeout(() => setReverse(true), 2500); return; }
        if (subIndex === 0 && reverse) { setReverse(false); setIndex((prev) => (prev + 1) % words.length); return; }
        const timeout = setTimeout(() => { setSubIndex((prev) => prev + (reverse ? -1 : 1)); }, Math.max(reverse ? 50 : subIndex === words[index].length ? 1000 : 100, Math.random() * 30));
        return () => clearTimeout(timeout);
    }, [subIndex, index, reverse, words]);

    return (
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 animate-gradient-x inline-block whitespace-nowrap leading-relaxed pb-3 align-bottom">
            {words[index] ? words[index].substring(0, subIndex) : ""}
            <span className={`text-indigo-600 ml-1 align-baseline ${blink ? 'opacity-100' : 'opacity-0'}`}>|</span>
        </span>
    );
};

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister, onTryDemo, onOpenLegal }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
  
  // DYNAMIC DATE CALCULATIONS FOR REAL-TIME FEEL
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentQuarter = Math.ceil(currentMonth / 3);
  const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  useEffect(() => { const handleScroll = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll); }, []);
  
  const toggleFaq = (index: number) => { setOpenFaq(openFaq === index ? null : index); };
  
  const scrollToSection = (id: string) => { 
      setMobileMenuOpen(false); 
      const element = document.getElementById(id); 
      if (element) { element.scrollIntoView({ behavior: 'smooth' }); } 
  };

  const FAQS = [
      { q: "Advisor Pro giúp gì cho công việc của tôi?", a: "Advisor đóng vai trò là trợ lý số liệu (Paraplanner) của bạn. Hệ thống xử lý các tính toán phức tạp, tra cứu pháp lý và tổng hợp tin tức, giúp bạn có thêm thời gian để tập trung vào việc chăm sóc và xây dựng mối quan hệ với khách hàng." },
      { q: "Dữ liệu của hệ thống có đáng tin cậy không?", a: "Hệ thống tổng hợp dữ liệu từ các nguồn chính thống và cập nhật Real-time. Tuy nhiên, vai trò của bạn là người kiểm chứng cuối cùng và truyền tải nó một cách khéo léo nhất đến khách hàng." },
      { q: "Tôi không rành công nghệ có dùng được không?", a: "Rất dễ dàng. Chúng tôi thiết kế Advisor như một người trợ lý biết lắng nghe. Bạn chỉ cần chat tự nhiên, hệ thống sẽ chuẩn bị các tài liệu cần thiết để bạn gửi cho khách." },
      { q: "Gói Pro mang lại lợi thế gì?", a: "Gói Pro cung cấp 'Góc Nhìn Chiến Lược'. Thay vì chỉ cung cấp thông tin thô, AI sẽ gợi ý các góc nhìn phân tích sâu sắc để bạn tham khảo, từ đó đưa ra lời khuyên đắt giá cho khách hàng." }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-indigo-500 selection:text-white overflow-x-hidden w-full">
      {/* --- NAVBAR --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm py-3' : 'bg-transparent py-5 md:py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          
          {/* Logo */}
          <div className="cursor-pointer active:scale-95 transition-transform shrink-0 relative z-50" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
             <BrandLogo size="md" />
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1 p-1.5 bg-slate-100/80 rounded-full border border-slate-200/50 backdrop-blur-md shadow-inner">
            {['Tính năng', 'Demo', 'Bảng giá', 'Hỏi đáp'].map((item, idx) => {
                const mapId = ['features', '', 'pricing', 'faq'][idx];
                return (
                    <button 
                        key={idx}
                        onClick={() => mapId ? scrollToSection(mapId) : onTryDemo()} 
                        className="px-5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-full transition-all duration-300"
                    >
                        {item}
                    </button>
                )
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 md:gap-3 shrink-0">
            <button onClick={onLogin} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors whitespace-nowrap">
                Đăng nhập
            </button>
            <button 
                onClick={() => onRegister('free')} 
                className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-slate-900/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 flex items-center gap-2 active:scale-95 border border-slate-800 whitespace-nowrap"
            >
              <span>Tạo tài khoản (Free)</span> <ArrowRight size={14} strokeWidth={3} />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden relative z-50 p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* MOBILE MENU DRAWER */}
        <div className={`fixed inset-0 bg-white z-40 flex flex-col pt-24 px-6 transition-all duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
            <div className="flex flex-col gap-6 text-lg font-bold text-slate-800">
                <button onClick={() => scrollToSection('features')} className="py-2 border-b border-slate-100 text-left">Tính năng nổi bật</button>
                <button onClick={() => { onTryDemo(); setMobileMenuOpen(false); }} className="py-2 border-b border-slate-100 text-left">Xem Demo Trực tiếp</button>
                <button onClick={() => scrollToSection('pricing')} className="py-2 border-b border-slate-100 text-left">Bảng giá</button>
                <button onClick={() => scrollToSection('faq')} className="py-2 border-b border-slate-100 text-left">Hỏi đáp</button>
            </div>
            
            <div className="mt-auto mb-8 flex flex-col gap-4">
                <button onClick={() => { onRegister('free'); setMobileMenuOpen(false); }} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-center shadow-lg shadow-indigo-200">
                    Bắt đầu miễn phí
                </button>
                <button onClick={() => { onLogin(); setMobileMenuOpen(false); }} className="w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-center">
                    Đăng nhập
                </button>
            </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="pt-28 md:pt-40 pb-16 md:pb-32 px-4 md:px-6 relative overflow-hidden w-full">
        {/* Subtle Aurora Background */}
        <div className="absolute top-[-30%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/50 rounded-full blur-[120px] mix-blend-multiply opacity-60 animate-in fade-in duration-1000"></div>
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-[100px] mix-blend-multiply opacity-60 animate-in fade-in duration-1000 delay-300"></div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center relative z-10">
           <div className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-8 duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/80 rounded-full shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-default max-w-full">
                 <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                 <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide truncate">
                     AI Advisor 5.5 - Trợ lý của Chuyên gia
                 </span>
              </div>
              
              {/* HEADLINE: Human-Centric */}
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.15] tracking-tight text-slate-900 break-words">
                Nâng Tầm Vị Thế <br/>
                Nhà Môi Giới Với<br/>
                <div className="min-h-[1.3em] mt-2"><TypewriterEffect /></div>
              </h1>
              
              <p className="text-base md:text-xl text-slate-500 leading-relaxed max-w-lg font-medium">
                Công cụ hỗ trợ toàn diện giúp bạn xử lý số liệu, pháp lý và thị trường trong tích tắc. <strong>Để bạn có thời gian làm điều quan trọng nhất: Thấu hiểu Khách hàng.</strong>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                 {/* PRIMARY CTA */}
                 <button 
                    onClick={() => onRegister('free')} 
                    className="group relative px-8 py-4 bg-slate-900 text-white rounded-2xl text-base font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-300/50 hover:shadow-indigo-500/30 hover:-translate-y-1 active:scale-95 w-full sm:w-auto overflow-hidden"
                 >
                    {/* Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        Trải nghiệm Trợ lý Ảo <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform"/>
                    </span>
                 </button>

                 {/* SECONDARY CTA */}
                 <button 
                    onClick={onTryDemo} 
                    className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl text-base font-bold hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm hover:shadow-md w-full sm:w-auto"
                 >
                    <Play size={18} className="fill-current" /> Xem Demo
                 </button>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 text-sm font-semibold text-slate-500 pt-8 border-t border-slate-200/60 max-w-md">
                 <div className="flex -space-x-3">
                    {["https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"].map((src, i) => (
                        <img key={i} src={src} className="w-10 h-10 rounded-full border-[3px] border-white object-cover shadow-md" alt="User"/>
                    ))}
                 </div>
                 <div>
                    <div className="flex items-center gap-1 text-amber-500 mb-1">
                        {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor"/>)}
                    </div>
                    <p className="text-slate-600">Được tin dùng bởi <strong>5,000+</strong> Chuyên gia tại VN</p>
                 </div>
              </div>
           </div>
           
           {/* Modern Glass UI Mockup - 3D Perspective */}
           <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200 hidden lg:block perspective-[2000px] group h-full min-h-[500px] flex items-center">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-[40px] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
              <div className="relative w-full bg-white/60 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/50 p-6 transform rotate-y-[-8deg] rotate-x-[5deg] group-hover:rotate-0 transition-all duration-700 ease-out">
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-inner">
                      <div className="bg-slate-50/80 border-b border-slate-100 p-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <BrandLogo size="sm" variant="icon" />
                            <div>
                               <div className="font-bold text-slate-900 text-sm">Hệ Thống Cố Vấn AI</div>
                               {/* DYNAMIC SYSTEM STATUS */}
                               <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                   <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> 
                                   Trực tiếp: {timeString}
                               </div>
                            </div>
                         </div>
                      </div>
                      <div className="p-6 space-y-6">
                          <div className="flex gap-4">
                             <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-sm text-sm text-slate-600 max-w-[85%] shadow-sm leading-relaxed">
                                Khách hàng Nam đang phân vân: "Liệu Eaton Park có bị ngáo giá không? So với Global City thì sao?"
                             </div>
                          </div>
                          <div className="flex gap-4 flex-row-reverse">
                             <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-5 rounded-2xl rounded-tr-sm shadow-xl shadow-indigo-200/50 text-sm text-white max-w-[95%] leading-relaxed">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
                                    <Database size={14} className="text-blue-300"/> 
                                    {/* DYNAMIC DATE LABEL - REPLACES "Q1/2024" */}
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                                        Phân tích thời gian thực (T{currentMonth}/{currentYear})
                                    </span>
                                </div>
                                Em đã tổng hợp số liệu mới nhất để anh Nam tham khảo ạ:<br/>
                                1. <strong>Giá Eaton Park:</strong> 125tr/m² (Lịch thanh toán 3 năm giúp giảm áp lực dòng tiền).<br/>
                                2. <strong>So sánh:</strong> Global City 380tr/m² (Phân khúc thấp tầng).<br/>
                                ➡ <em><strong>Gợi ý tư vấn:</strong> Nếu anh Nam ưu tiên <strong>tích sản nhẹ nhàng</strong>, Eaton Park là lựa chọn phù hợp. Global City dành cho nhu cầu <strong>trú ẩn tài sản</strong> lâu dài.</em>
                             </div>
                          </div>
                      </div>
                  </div>
              </div>
           </div>
        </div>
      </header>

      {/* --- FEATURES GRID - THE "WHY" SECTION --- */}
      <section id="features" className="py-24 md:py-32 bg-white relative scroll-mt-20">
         <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-16 md:mb-24">
               <span className="text-indigo-600 font-bold text-xs uppercase tracking-[0.2em] mb-4 block">Hỗ trợ đắc lực</span>
               <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Công Cụ Sắc Bén Cho <br/>Nhà Môi Giới Hiện Đại</h2>
               <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">Kết hợp sự am hiểu của bạn với tốc độ của công nghệ.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* PILLAR 1: CONTEXT */}
               <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-blue-900/5 hover:border-slate-200 transition-all duration-300 group">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-200 group-hover:scale-110 transition-transform duration-300">
                      <Database size={32} className="text-blue-600"/>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">CRM Trợ Lực</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                      Giúp bạn ghi nhớ mọi chi tiết nhỏ về khách hàng. Hệ thống tự động nhắc lịch chăm sóc, để bạn luôn xuất hiện đúng lúc khách hàng cần.
                  </p>
               </div>

               {/* PILLAR 2: TOOLS */}
               <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-emerald-900/5 hover:border-slate-200 transition-all duration-300 group">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-200 group-hover:scale-110 transition-transform duration-300">
                      <LineChart size={32} className="text-emerald-600"/>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Bộ Công Cụ Tư Vấn</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                      Dễ dàng tạo bảng tính dòng tiền, so sánh dự án và tra cứu pháp lý trong 3 giây. Giúp lời tư vấn của bạn trở nên trực quan và thuyết phục hơn.
                  </p>
               </div>

               {/* PILLAR 3: PROACTIVE */}
               <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-indigo-900/5 hover:border-slate-200 transition-all duration-300 group">
                  <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-200 group-hover:scale-110 transition-transform duration-300">
                      <BrainCircuit size={32} className="text-indigo-600"/>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Tham Mưu Chiến Lược</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                      Hệ thống liên tục cập nhật tin tức thị trường để cung cấp cho bạn những góc nhìn mới, giúp bạn luôn dẫn đầu trong các cuộc thảo luận với nhà đầu tư.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-24 md:py-32 bg-slate-900 relative overflow-hidden scroll-mt-20">
         {/* Background Elements */}
         <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
         <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50"></div>
         
         <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
            <div className="text-center mb-16 md:mb-24 text-white">
               <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Đầu Tư Cho Sự Nghiệp Của Bạn</h2>
               <p className="text-slate-400 max-w-2xl mx-auto text-lg">Chỉ bằng một ly cà phê mỗi ngày để sở hữu trợ lý đắc lực.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
               {/* FREE PLAN */}
               <div className="p-10 rounded-[40px] bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-all backdrop-blur-sm flex flex-col">
                  <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-2">Gói Trải Nghiệm</h3>
                      <p className="text-slate-400 text-sm">Dành cho người mới bắt đầu.</p>
                  </div>
                  <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-5xl font-black text-white tracking-tight">0đ</span>
                      <span className="text-base font-medium text-slate-500">/tháng</span>
                  </div>
                  
                  <ul className="space-y-4 mb-10 flex-1">
                     {["1 Dự án (Demo)", "50 Cuộc hội thoại/tháng", "Tính năng cơ bản"].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium"><Check size={18} className="text-slate-500 shrink-0"/> {item}</li>
                     ))}
                  </ul>

                  <button onClick={() => onRegister('free')} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-2xl font-bold transition-all text-sm uppercase tracking-wide">
                     Đăng ký Miễn phí
                  </button>
               </div>

               {/* PRO PLAN */}
               <div className="p-10 rounded-[40px] bg-gradient-to-b from-indigo-900/90 to-slate-900 border border-indigo-500/50 relative shadow-2xl shadow-indigo-900/50 overflow-hidden group flex flex-col">
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50"></div>
                  <div className="absolute top-6 right-8 bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase shadow-lg shadow-indigo-500/30">PHỔ BIẾN</div>
                  
                  <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-2">Gói Chuyên Gia (Pro)</h3>
                      <p className="text-indigo-200 text-sm">Dành cho Môi giới Chuyên nghiệp.</p>
                  </div>
                  <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-5xl font-black text-white tracking-tight">499k</span>
                      <span className="text-base font-medium text-indigo-200">/tháng</span>
                  </div>
                  
                  <ul className="space-y-4 mb-10 flex-1">
                     {[
                         "Không giới hạn dự án & Hội thoại", 
                         "Xây dựng Thương hiệu Cá nhân (Profile)", 
                         "Bộ công cụ: Định giá, Phong thủy, Pháp lý 5.5", 
                         "Campaign (Chăm sóc tự động hàng loạt)",
                         "Cảnh báo rủi ro & Cơ hội thị trường"
                     ].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 text-sm text-white font-medium"><div className="p-1 bg-indigo-500 rounded-full shrink-0"><Check size={12} className="text-white"/></div> {item}</li>
                     ))}
                  </ul>

                  <button onClick={() => onRegister('pro')} className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-500/25 text-sm uppercase tracking-wide hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                     <Zap size={16} fill="currentColor" className="text-yellow-500"/> Nâng cấp Pro
                  </button>
               </div>
            </div>
         </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section id="faq" className="py-24 md:py-32 bg-white relative scroll-mt-20">
         <div className="max-w-3xl mx-auto px-4 md:px-6">
            <div className="text-center mb-16 md:mb-20">
               <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Thắc mắc thường gặp</h2>
               <p className="text-slate-500 text-lg">Chúng tôi ở đây để hỗ trợ sự nghiệp của bạn.</p>
            </div>

            <div className="space-y-4">
               {FAQS.map((item, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-3xl overflow-hidden transition-all duration-300 hover:border-indigo-200">
                     <button 
                        onClick={() => toggleFaq(idx)}
                        className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-slate-50 transition-colors"
                     >
                        <span className="font-bold text-slate-900 text-lg pr-8 leading-snug">{item.q}</span>
                        {openFaq === idx ? <ChevronUp className="text-indigo-600 shrink-0" /> : <ChevronDown className="text-slate-400 shrink-0" />}
                     </button>
                     <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-6 pt-0 text-slate-600 leading-relaxed bg-white text-base">
                           {item.a}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      <footer className="bg-white text-slate-900 py-16 md:py-24 text-sm border-t border-slate-200">
         <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
             <div className="col-span-1 md:col-span-2 space-y-8">
                 <BrandLogo size="lg" />
                 <p className="max-w-sm text-slate-500 leading-relaxed text-base font-medium">Nền tảng công nghệ hỗ trợ Môi giới Bất động sản Việt Nam. Tôn vinh giá trị con người, nâng tầm hiệu suất công việc.</p>
                 <div className="flex gap-4">
                     <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all cursor-pointer border border-slate-200 hover:border-indigo-600 hover:-translate-y-1 shadow-sm"><Globe size={20}/></div>
                     <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all cursor-pointer border border-slate-200 hover:border-indigo-600 hover:-translate-y-1 shadow-sm"><Users size={20}/></div>
                 </div>
             </div>
             <div>
                 <h4 className="font-black text-slate-900 mb-6 text-base uppercase tracking-wide">Sản phẩm</h4>
                 <ul className="space-y-4">
                     <li><button onClick={() => scrollToSection('features')} className="text-slate-500 hover:text-indigo-600 transition-colors font-medium">Tính năng</button></li>
                     <li><button onClick={onTryDemo} className="text-slate-500 hover:text-indigo-600 transition-colors font-medium">Live Demo</button></li>
                     <li><button onClick={() => scrollToSection('pricing')} className="text-slate-500 hover:text-indigo-600 transition-colors font-medium">Bảng giá</button></li>
                 </ul>
             </div>
             <div>
                 <h4 className="font-black text-slate-900 mb-6 text-base uppercase tracking-wide">Pháp lý</h4>
                 <ul className="space-y-4">
                     <li><button onClick={() => onOpenLegal('terms')} className="text-slate-500 hover:text-indigo-600 transition-colors font-medium">Điều khoản</button></li>
                     <li><button onClick={() => onOpenLegal('privacy')} className="text-slate-500 hover:text-indigo-600 transition-colors font-medium">Bảo mật</button></li>
                 </ul>
             </div>
         </div>
      </footer>
      
      <style>{`
        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
