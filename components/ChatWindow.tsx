import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, Project, Lead, UserProfile } from '../types';
import { 
  Send, User, Bot, Loader2, PhoneCall, ShieldCheck, Sparkles, 
  MapPin, ExternalLink, Image as ImageIcon, ArrowRight, Mic, 
  Volume2, VolumeX, Filter, Calendar, ArrowUp, ArrowDown, X,
  Maximize2, Settings2, WifiOff, Search, Link as LinkIcon, BrainCircuit,
  Copy, Check, Share2, CheckCircle2, TrendingUp, Scale, Gavel, Wallet, Trash2, Crown, Headphones, Zap, Activity, Calculator
} from 'lucide-react';
import { QUICK_PROMPTS, FEATURED_PROJECTS } from '../constants';
import ReactMarkdown from 'react-markdown';
import { generateSpeech } from '../services/geminiService';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string, imageFile?: File | null) => void;
  isLoading: boolean;
  isHandoffTriggered: boolean;
  groundingSources: any[];
  onViewProject?: (project: Project) => void;
  onSmartAction?: (toolId: string) => void; // Callback to open tool
  userProfile?: UserProfile | null;
  onResetProfile?: () => void;
}

// Helper to decode Base64 string
const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper to strip markdown and stage directions for better TTS
const stripMarkdown = (text: string) => {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold: **text** -> text
    .replace(/\*(.*?)\*/g, '$1')     // Italic: *text* -> text
    .replace(/#{1,6}\s/g, '')         // Headers: ### Text -> Text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links: [text](url) -> text
    // Remove specific stage directions like (nghỉ 0.5s), (cười nhẹ), (giọng trầm)
    // Looking for parentheses containing specific keywords
    .replace(/\((.*?)(nghỉ|cười|giọng|thở|im lặng|chân thành)(.*?)\)/gi, '')
    .replace(/\[.*?\]/g, '') // Remove [stage directions] in brackets if any
    .replace(/`/g, '') // Remove code ticks
    .replace(/[-*]\s/g, ', ') // Bullets -> commas
    .replace(/\n+/g, '. ') // Newlines -> periods
    .replace(/\s+/g, ' ') // Collapse spaces
    .trim();
};

const splitIntoSentences = (text: string) => {
    const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g);
    return sentences ? sentences.map(s => s.trim()).filter(s => s.length > 0) : [text];
};

const formatPrice = (price: string) => {
  return price
    .replace(' triệu/m²', ' Tr')
    .replace(' tỷ/căn', ' Tỷ')
    .replace(/ \(.*\)/, '');
};

// --- Sub-Components ---

const MessageActions = ({ text, timestamp, onReplay, isPlaying }: { text: string, timestamp: Date, onReplay: () => void, isPlaying: boolean }) => {
  const [actionStatus, setActionStatus] = useState<'idle' | 'copied' | 'shared'>('idle');

  // Reset status after 2 seconds
  useEffect(() => {
    if (actionStatus !== 'idle') {
      const timer = setTimeout(() => setActionStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [actionStatus]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setActionStatus('copied');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShare = async () => {
    // Tạo nội dung chia sẻ chuyên nghiệp kèm Link
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://bds-advisor.ai';
    const shareContent = `${text}\n\n------------------\n🤖 Được phân tích bởi BDS Advisor AI\n👉 Trải nghiệm miễn phí tại: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tư vấn từ BDS Advisor AI',
          text: shareContent,
        });
        setActionStatus('shared');
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      // Fallback cho Desktop: Copy nội dung kèm Link vào clipboard
      try {
        await navigator.clipboard.writeText(shareContent);
        setActionStatus('copied'); // Hiển thị trạng thái đã copy để người dùng biết paste
      } catch (err) {
        console.error('Failed to copy fallback share: ', err);
      }
    }
  };

  return (
    <div className="flex items-center gap-3 mt-2 ml-2 select-none">
      <span className="text-[10px] text-slate-300 font-medium">
        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
      
      <div className="flex items-center gap-1 bg-white/50 backdrop-blur rounded-full px-2 py-0.5 border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative">
        
        {/* Feedback Tooltip */}
        {actionStatus !== 'idle' && (
           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded-md whitespace-nowrap animate-in zoom-in duration-200">
              {actionStatus === 'copied' ? 'Đã sao chép!' : 'Đã chia sẻ!'}
              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800"></div>
           </div>
        )}

        <button 
          onClick={handleCopy}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
          title="Sao chép văn bản"
        >
          {actionStatus === 'copied' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
        </button>
        
        <div className="w-px h-3 bg-slate-200"></div>

        <button 
          onClick={handleShare}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
          title="Chia sẻ kèm Link"
        >
          <Share2 size={12} />
        </button>

        <div className="w-px h-3 bg-slate-200"></div>

        <button 
          onClick={onReplay}
          className={`p-1.5 rounded-full transition-all ${isPlaying ? 'text-indigo-600 bg-indigo-50 animate-pulse' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
          title="Đọc lại bằng giọng nói"
        >
          {isPlaying ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
        </button>
      </div>
    </div>
  );
};

const MiniProjectCard = ({ projectName, onViewProject }: { projectName: string, onViewProject?: (project: Project) => void }) => {
  const project = FEATURED_PROJECTS.find(p => 
    projectName.toLowerCase().includes(p.name.toLowerCase()) || 
    p.name.toLowerCase().includes(projectName.toLowerCase())
  );

  if (!project) return null;

  return (
    <div className="mt-3 mb-2 group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 w-full max-w-[280px] md:max-w-[320px]">
      <div className="h-32 overflow-hidden relative">
        <img src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
          {formatPrice(project.priceRange)}
        </div>
      </div>
      <div className="p-3">
        <h4 className="font-bold text-slate-900 text-sm truncate">{project.name}</h4>
        <div className="flex items-center gap-1 text-slate-500 mb-3">
          <MapPin size={10} />
          <p className="text-[10px] truncate">{project.location}</p>
        </div>
        <button 
          onClick={() => onViewProject && onViewProject(project)}
          className="w-full py-2 bg-slate-50 text-slate-700 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2"
        >
          Xem chi tiết <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

const LeadSuccessCard = ({ lead }: { lead: Lead }) => {
  return (
    <div className="mt-3 mb-2 w-full max-w-sm bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-4 shadow-sm animate-in zoom-in-95 duration-300">
       <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
             <CheckCircle2 size={20} />
          </div>
          <div>
             <h4 className="text-sm font-bold text-green-800">Đã tiếp nhận yêu cầu!</h4>
             <p className="text-[11px] text-green-700 mt-1">
               Thông tin của anh/chị đã được chuyển đến bộ phận kinh doanh.
             </p>
          </div>
       </div>
       <div className="mt-3 bg-white/60 rounded-xl p-3 border border-green-100/50 space-y-2">
          <div className="flex justify-between items-center text-xs">
             <span className="text-slate-500 font-medium">Khách hàng:</span>
             <span className="font-bold text-slate-800">{lead.name}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
             <span className="text-slate-500 font-medium">SĐT:</span>
             <span className="font-bold text-slate-800">{lead.phone}</span>
          </div>
          {lead.projectInterest && (
             <div className="flex justify-between items-center text-xs">
               <span className="text-slate-500 font-medium">Quan tâm:</span>
               <span className="font-bold text-blue-600">{lead.projectInterest}</span>
            </div>
          )}
       </div>
       <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-green-600 font-medium opacity-80">
          <PhoneCall size={10} /> Chuyên viên sẽ gọi trong 5 phút
       </div>
    </div>
  )
}

// --- Main Component ---

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading, isHandoffTriggered, groundingSources, onViewProject, onSmartAction, userProfile, onResetProfile }) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // DEFAULT FALSE to save tokens
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const [isUsingFallbackVoice, setIsUsingFallbackVoice] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Aoede');
  
  // Filter & Sort State
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'model'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterDate, setFilterDate] = useState<string>('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const currentPlaybackIdRef = useRef<number>(0);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const VOICES = [
    { id: 'Aoede', name: 'Nữ - Miền Nam', gender: 'female' },
    { id: 'Kore', name: 'Nữ - Miền Bắc', gender: 'female' },
    { id: 'Fenrir', name: 'Nam - Miền Nam', gender: 'male' },
    { id: 'Puck', name: 'Nam - Miền Bắc', gender: 'male' },
  ];

  // --- SMART SUGGESTIONS LOGIC ---
  const smartSuggestions = useMemo(() => {
     if (messages.length === 0) return [];
     const lastMsg = messages[messages.length - 1];
     const text = lastMsg.text.toLowerCase();
     const suggestions: any[] = [];

     // PERSONALIZATION: If returning user, suggest previous interest update
     if (userProfile?.lastInterest) {
        suggestions.push({ 
             id: 'check_price_personalized', 
             label: `Cập nhật giá ${userProfile.lastInterest}?`, 
             icon: TrendingUp, 
             color: 'text-pink-600 bg-pink-50 border-pink-100 ring-1 ring-pink-200',
             isAction: true,
             prompt: `Cho tôi biết giá và chính sách mới nhất của dự án ${userProfile.lastInterest} hôm nay.`
         });
     }

     if (text.includes('so sánh') || text.includes('khác biệt')) {
         suggestions.push({ id: 'comparison', label: 'So sánh dự án', icon: Scale, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' });
     }
     if (text.includes('thuê') || text.includes('mua') || text.includes('ở đâu')) {
        suggestions.push({ id: 'rent_vs_buy', label: 'Mua hay Thuê?', icon: ArrowRight, color: 'text-orange-600 bg-orange-50 border-orange-100' });
     }

     return suggestions.slice(0, 3); // Return top 3 relevant suggestions
  }, [messages, userProfile]);

  const processedMessages = useMemo(() => {
    let res = [...messages];
    if (filterRole !== 'all') res = res.filter(m => m.role === filterRole);
    if (filterDate) {
      res = res.filter(m => {
        const d = new Date(m.timestamp);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return dateStr === filterDate;
      });
    }
    res.sort((a, b) => {
      const tA = new Date(a.timestamp).getTime();
      const tB = new Date(b.timestamp).getTime();
      return sortOrder === 'asc' ? tA - tB : tB - tA;
    });
    return res;
  }, [messages, filterRole, filterDate, sortOrder]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'vi-VN';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          onSendMessage(transcript);
          setIsListening(false);
        };
        recognitionRef.current.onerror = (event: any) => setIsListening(false);
        recognitionRef.current.onend = () => setIsListening(false);
      }
    }
    
    return () => {
      stopAudioPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, [onSendMessage]);

  // Clean up object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const stopAudioPlayback = () => {
    currentPlaybackIdRef.current += 1; 
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    setPlayingMessageIndex(null);
  };

  const playEncodedAudio = (base64String: string): Promise<void> => {
    return new Promise(async (resolve) => {
        try {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            if (audioContextRef.current.state === 'suspended') {
                try { await audioContextRef.current.resume(); } catch (e) { resolve(); return; }
            }
            const audioData = decodeBase64(base64String);
            const buffer = audioData.buffer;
            const dataInt16 = new Int16Array(buffer, audioData.byteOffset, audioData.length / 2);
            const audioBuffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
            const channelData = audioBuffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) {
                channelData[i] = dataInt16[i] / 32768.0;
            }
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => resolve();
            audioSourceRef.current = source;
            source.start();
        } catch (error) { resolve(); }
    });
  };

  const speakNative = (text: string): Promise<void> => {
    setIsUsingFallbackVoice(true);
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return; }
        const speak = () => {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'vi-VN';
            const voices = window.speechSynthesis.getVoices();
            let selectedViVoice = viVoices.find(v => v.name.includes('Google Tiếng Việt'));
            if (!selectedViVoice) selectedViVoice = viVoices.find(v => v.name.includes('Hoai My'));
            if (selectedViVoice) utterance.voice = selectedViVoice;
            utterance.onend = () => resolve();
            utterance.onerror = (e) => resolve();
            window.speechSynthesis.speak(utterance);
        };
        const viVoices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('vi'));
        if (viVoices.length === 0) {
             window.speechSynthesis.addEventListener('voiceschanged', () => speak(), { once: true });
        } else { speak(); }
    });
  };

  const speakTextSequentially = async (text: string, msgIndex: number) => {
    stopAudioPlayback();
    setPlayingMessageIndex(msgIndex);
    const playbackId = currentPlaybackIdRef.current;
    
    setIsUsingFallbackVoice(false); 

    const cleanText = stripMarkdown(text);
    if (!cleanText) { setPlayingMessageIndex(null); return; }
    
    const sentences = splitIntoSentences(cleanText);

    for (let i = 0; i < sentences.length; i++) {
        if (currentPlaybackIdRef.current !== playbackId) break;
        const sentence = sentences[i];
        if (sentence.length < 2) continue;

        const cacheKey = `${selectedVoice}:${sentence}`;
        let audioBase64 = audioCacheRef.current.get(cacheKey);

        if (!audioBase64) {
             audioBase64 = await generateSpeech(sentence, selectedVoice);
             if (audioBase64) audioCacheRef.current.set(cacheKey, audioBase64);
        }

        if (currentPlaybackIdRef.current !== playbackId) break;

        if (audioBase64) await playEncodedAudio(audioBase64);
        else await speakNative(sentence);
    }
    if (currentPlaybackIdRef.current === playbackId) {
        setPlayingMessageIndex(null);
        setIsUsingFallbackVoice(false);
    }
  };

  // Removed auto-play useEffect. Only triggers on click now.

  useEffect(() => {
    if (scrollRef.current && sortOrder === 'asc') {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [processedMessages.length, isLoading, sortOrder]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || selectedImage) && !isLoading) {
      stopAudioPlayback();
      onSendMessage(input, selectedImage);
      setInput('');
      setSelectedImage(null);
      setPreviewUrl(null);
      setFilterRole('all');
      setSortOrder('asc');
      setFilterDate('');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        alert('Vui lòng chọn file hình ảnh (JPG, PNG, WebP).');
      }
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleListening = () => {
    stopAudioPlayback();
    if (isListening) recognitionRef.current?.stop();
    else { setIsListening(true); recognitionRef.current?.start(); }
  };

  const toggleSpeaking = () => {
    const nextState = !isSpeaking;
    setIsSpeaking(nextState);
    if (!nextState) stopAudioPlayback();
  };

  const handleManualReplay = async (text: string, index: number) => {
      if (playingMessageIndex === index) {
          stopAudioPlayback();
      } else {
          speakTextSequentially(text, index);
      }
  };

  const detectProjectInText = (text: string) => {
    const foundProject = FEATURED_PROJECTS.find(p => text.includes(p.name));
    return foundProject ? foundProject.name : null;
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Mini Status Bar (Instead of full header) */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 py-3 bg-gradient-to-b from-white to-white/0 flex justify-between items-center gap-2 pointer-events-none">
         {/* Identity Bar (Left) */}
         <div className="pointer-events-auto flex items-center gap-3">
             {userProfile ? (
                 <div className="flex items-center gap-2 bg-white/90 backdrop-blur border border-indigo-100 px-3 py-1.5 rounded-full shadow-sm animate-in slide-in-from-left-4 fade-in duration-500">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold shadow-sm">
                       {userProfile.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                           Chào, {userProfile.name} 
                           <span className="text-amber-500"><Crown size={10} fill="currentColor" /></span>
                        </p>
                    </div>
                 </div>
             ) : (
                <div className="h-8"></div> // Spacer
             )}
         </div>

         {/* Settings & Controls (Right) */}
         <div className="pointer-events-auto flex items-center gap-2 bg-white/80 backdrop-blur border border-slate-100 p-1.5 rounded-full shadow-sm">
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${showSettings ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                title="Cài đặt"
            >
                <Settings2 size={14} />
            </button>
            <button 
                onClick={toggleSpeaking}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isSpeaking ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 animate-pulse' : 'text-slate-400 hover:bg-slate-100'}`}
                title={isSpeaking ? "Tắt chế độ Rảnh tay (Tự động đọc)" : "Bật chế độ Rảnh tay (Tự động đọc)"}
            >
                <Headphones size={14} />
            </button>
         </div>
      </div>

      {/* Settings / Voice Toolbar */}
      {showSettings && (
         <div className="absolute top-14 right-6 bg-white border border-slate-100 px-4 py-3 rounded-2xl shadow-xl animate-in slide-in-from-top-2 duration-200 z-20 w-64">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Giọng đọc AI</h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
                {VOICES.map((voice) => (
                    <button
                        key={voice.id}
                        onClick={() => { setSelectedVoice(voice.id); stopAudioPlayback(); }}
                        className={`px-2 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                            selectedVoice === voice.id 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
                        }`}
                    >
                        {voice.name}
                    </button>
                ))}
            </div>
            
            {userProfile && onResetProfile && (
                <div className="pt-3 border-t border-slate-50">
                    <button 
                        onClick={() => { onResetProfile(); setShowSettings(false); }}
                        className="w-full py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                    >
                        <Trash2 size={12} /> Xóa thông tin cá nhân
                    </button>
                </div>
            )}

            {isUsingFallbackVoice && (
                <div className="mt-3 flex items-center gap-2 text-orange-600 text-[10px] font-bold bg-orange-50 px-2 py-1.5 rounded-lg">
                   <WifiOff size={10} /> Chế độ cơ bản (Offline)
                </div>
            )}
         </div>
      )}

      {/* Messages List - Spacing adjusted: pb-32 (was pb-44) */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 pt-16 pb-32 space-y-8 custom-scrollbar">
        {messages.length === 1 && processedMessages.length > 0 && (
          <div className="flex flex-col items-center justify-center py-10 opacity-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards" style={{animationDelay: '0.2s'}}>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm ring-1 ring-slate-100">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                  <path d="M12 3C12 3 14 9 20 11C21 11.33 21 12.66 20 13C14 15 12 21 12 21C12 21 10 15 4 13C3 12.66 3 11.33 4 11C10 9 12 3 12 3Z" fill="url(#empty-state-gradient)" />
                  <defs>
                    <linearGradient id="empty-state-gradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#2563EB" />
                      <stop offset="1" stopColor="#9333EA" />
                    </linearGradient>
                  </defs>
              </svg>
            </div>
            <h3 className="text-slate-900 font-bold text-xl mb-2 text-center tracking-tight">Trợ lý đầu tư cá nhân</h3>
            <p className="text-slate-500 text-sm text-center max-w-sm mb-8 leading-relaxed">
              Tôi có thể giúp bạn phân tích thị trường, so sánh giá và tìm kiếm cơ hội đầu tư tốt nhất hôm nay.
            </p>
            
            <p className="text-slate-400 text-xs mt-0 mb-6">
                Cần tư vấn trực tiếp? <a href="tel:0971132378" className="text-indigo-600 font-bold hover:underline">Gọi ngay</a>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="text-left px-5 py-3.5 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-md rounded-2xl text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-all duration-300"
                >
                    {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {processedMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex gap-4 max-w-[90%] lg:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white border border-slate-100'
              }`}>
                {msg.role === 'user' ? <User size={14} /> : (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                    <path d="M12 3C12 3 14 9 20 11C21 11.33 21 12.66 20 13C14 15 12 21 12 21C12 21 10 15 4 13C3 12.66 3 11.33 4 11C10 9 12 3 12 3Z" fill="url(#avatar-gradient)" />
                    <defs>
                      <linearGradient id="avatar-gradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#2563EB" />
                        <stop offset="1" stopColor="#9333EA" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <div className={`px-5 py-4 text-[14px] leading-7 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-[24px] rounded-tr-sm' 
                    : 'bg-white text-slate-700 rounded-[24px] rounded-tl-sm border border-slate-100'
                }`}>
                   {msg.image && (
                      <div className="mb-3 rounded-xl overflow-hidden max-w-[200px] border border-white/20">
                          <img src={msg.image} alt="User uploaded" className="w-full h-auto object-cover" />
                      </div>
                   )}
                  <ReactMarkdown 
                    components={{
                      p: ({children}) => <p className="mb-3 last:mb-0 whitespace-pre-wrap">{children}</p>,
                      strong: ({children}) => <span className="font-bold text-inherit">{children}</span>,
                      ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                      li: ({children}) => <li className="pl-1">{children}</li>,
                      code: ({children}) => <code className={`px-1.5 py-0.5 rounded font-mono text-xs ${msg.role === 'user' ? 'bg-slate-800' : 'bg-slate-100 text-pink-600'}`}>{children}</code>,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>

                  {/* Render Lead Success Card inside the message bubble if data exists */}
                  {msg.leadData && <LeadSuccessCard lead={msg.leadData} />}

                </div>
                
                {msg.role === 'model' && (
                  <MessageActions 
                    text={msg.text} 
                    timestamp={msg.timestamp} 
                    onReplay={() => handleManualReplay(msg.text, i)} 
                    isPlaying={playingMessageIndex === i}
                  />
                )}
                
                {msg.role === 'model' && detectProjectInText(msg.text) && (
                  <MiniProjectCard 
                    projectName={detectProjectInText(msg.text)!} 
                    onViewProject={onViewProject}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-300">
             <div className="flex gap-4 max-w-[75%]">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                   <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 animate-pulse">
                      <path d="M12 3C12 3 14 9 20 11C21 11.33 21 12.66 20 13C14 15 12 21 12 21C12 21 10 15 4 13C3 12.66 3 11.33 4 11C10 9 12 3 12 3Z" fill="url(#loading-gradient)" />
                      <defs>
                        <linearGradient id="loading-gradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#2563EB" />
                          <stop offset="1" stopColor="#9333EA" />
                        </linearGradient>
                      </defs>
                   </svg>
                </div>
                <div className="bg-white border border-slate-100 px-5 py-4 rounded-[24px] rounded-tl-sm shadow-sm flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
             </div>
          </div>
        )}

        {/* Enhanced Grounding Sources Display */}
        {groundingSources.length > 0 && !isLoading && (
           <div className="flex justify-start ml-12 animate-in fade-in slide-in-from-bottom-2 mt-2">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 max-w-sm w-full shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-slate-400 border-b border-slate-50 pb-2">
                   <ShieldCheck size={14} className="text-green-500" />
                   <span className="text-[10px] font-bold uppercase tracking-wider">Nguồn dữ liệu xác thực</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {groundingSources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.web?.uri || source.maps?.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                         {source.web ? <Search size={14} /> : <MapPin size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                            {source.web?.title || "Vị trí bản đồ"}
                         </p>
                         <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                            <LinkIcon size={8} />
                            {source.web?.uri ? new URL(source.web.uri).hostname : "Google Maps"}
                         </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
           </div>
        )}
      </div>

      {/* SMART ACTION SUGGESTIONS (Moved back to bottom-20) */}
      {smartSuggestions.length > 0 && !isLoading && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 px-4 z-20 animate-in fade-in slide-in-from-bottom-4 pointer-events-none">
            {smartSuggestions.map((suggestion) => (
                <button
                    key={suggestion.id}
                    onClick={() => {
                        if (suggestion.isAction && suggestion.prompt) {
                            onSendMessage(suggestion.prompt);
                        } else if (onSmartAction) {
                            onSmartAction(suggestion.id);
                        }
                    }}
                    className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-md text-xs font-bold transition-all hover:scale-105 active:scale-95 border ${suggestion.color}`}
                >
                    <suggestion.icon size={14} />
                    {suggestion.label}
                </button>
            ))}
        </div>
      )}

      <div className="absolute bottom-6 left-0 right-0 px-4 md:px-8 z-30 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          {/* Image Preview Container */}
          {previewUrl && (
            <div className="absolute bottom-full mb-2 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-2">
                <div className="relative bg-white p-2 rounded-2xl shadow-xl border border-slate-100 inline-block">
                    <img src={previewUrl} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
                    <button 
                        onClick={removeSelectedImage}
                        className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 shadow-md hover:bg-red-500 transition-colors"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative flex items-center gap-2 group shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-full bg-white p-2 transition-all duration-300 ring-1 ring-slate-100 focus-within:ring-2 focus-within:ring-indigo-100">
            <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
            />
            <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-full transition-colors shrink-0 ${selectedImage ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                title="Gửi hình ảnh"
            >
               <ImageIcon size={20} />
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Đang nghe bạn nói..." : "Hỏi về giá, chính sách, hoặc gửi ảnh..."}
              className={`flex-1 py-3 px-2 bg-transparent border-none focus:outline-none text-base text-slate-800 placeholder:text-slate-400 font-medium ${isListening ? 'placeholder:text-indigo-500 placeholder:animate-pulse' : ''}`}
            />
            
            {typeof window !== 'undefined' && 'webkitSpeechRecognition' in window && (
               <button 
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-full transition-all shrink-0 ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
               >
                 <Mic size={20} />
               </button>
            )}
            
            <button 
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage && !isListening)}
              className="p-3 bg-slate-900 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-slate-900 transition-all shadow-md transform hover:scale-105 active:scale-95 shrink-0"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </form>

          <div className="text-center mt-2">
             <p className="text-[10px] text-slate-300 font-medium">BDS Advisor Pro có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
