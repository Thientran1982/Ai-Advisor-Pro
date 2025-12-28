
import React, { useState } from 'react';
import { Lead, SwarmStep, AgentRole } from '../../types';
import { 
    X, Phone, MessageCircle, Tag, User, Sparkles, Copy, Check, Loader2, MessageSquare, 
    LineChart, BrainCircuit, PenTool, Calculator, Compass, TrendingUp, ShieldAlert, Handshake,
    Palette, MapPin, Target, Fingerprint, Coffee, Search, Landmark, Crown, Hourglass // NEW ICONS
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { runAgentSwarm } from '../../services/geminiService';

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'transcript' | 'ai_script'>('transcript');
  const [script, setScript] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // SWARM STATE
  const [swarmSteps, setSwarmSteps] = useState<SwarmStep[]>([]);

  const handleGenerateScript = async () => {
      setIsGenerating(true);
      setScript('');
      setSwarmSteps([]); // Reset steps

      // Execute the Swarm (Dynamic Orchestration)
      const result = await runAgentSwarm(lead, (step) => {
          setSwarmSteps(prev => {
              // Update existing step or add new one
              const idx = prev.findIndex(s => s.agentName === step.agentName);
              if (idx !== -1) {
                  const newSteps = [...prev];
                  newSteps[idx] = step;
                  return newSteps;
              }
              return [...prev, step];
          });
      });

      setScript(result);
      setIsGenerating(false);
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const getAgentIcon = (type: AgentRole) => {
      switch(type) {
          case 'Strategist': return <LineChart size={16} className="text-blue-500"/>; 
          case 'Psychologist': return <BrainCircuit size={16} className="text-purple-500"/>; 
          case 'Copywriter': return <PenTool size={16} className="text-orange-500"/>; 
          case 'Valuation': return <Tag size={16} className="text-emerald-500"/>; 
          case 'RiskOfficer': return <ShieldAlert size={16} className="text-rose-500"/>; 
          case 'Negotiator': return <Handshake size={16} className="text-amber-500"/>; 
          case 'Stylist': return <Palette size={16} className="text-pink-500"/>; 
          case 'Insider': return <MapPin size={16} className="text-cyan-500"/>; 
          case 'Closer': return <Target size={16} className="text-red-600"/>; 
          case 'Manager': return <BrainCircuit size={16} className="text-indigo-600"/>;
          // NEW AGENTS
          case 'Profiler': return <Fingerprint size={16} className="text-violet-600"/>;
          case 'Lifestyle': return <Coffee size={16} className="text-orange-600"/>;
          case 'Skeptic': return <Search size={16} className="text-slate-600"/>;
          // SUPER AGENTS
          case 'WealthStructurer': return <Landmark size={16} className="text-emerald-700"/>;
          case 'Curator': return <Crown size={16} className="text-yellow-600"/>;
          case 'TimingArchitect': return <Hourglass size={16} className="text-blue-600"/>;
          // STORYTELLER
          case 'Storyteller': return <PenTool size={16} className="text-pink-600"/>;
          default: return <Sparkles size={16} className="text-indigo-500"/>;
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">{lead.name.charAt(0).toUpperCase()}</div><div><h2 className="text-xl font-black text-slate-900">{lead.name}</h2><div className="flex items-center gap-2 text-xs font-bold text-slate-500"><span className="flex items-center gap-1"><Phone size={12}/> {lead.phone}</span><span className="w-1 h-1 rounded-full bg-slate-300"></span><span className="flex items-center gap-1 text-indigo-600"><Tag size={12}/> {lead.status}</span></div></div></div><button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X size={24}/></button></div>
        <div className="flex-1 flex overflow-hidden">
            <div className="w-80 border-r border-slate-100 bg-white p-6 overflow-y-auto hidden md:block">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><User size={18}/> Hồ Sơ Khách Hàng</h3>
                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-xl"><label className="text-[10px] font-bold text-slate-400 uppercase">Dự án quan tâm</label><p className="font-bold text-indigo-700">{lead.projectInterest}</p></div>
                    <div className="bg-slate-50 p-3 rounded-xl"><label className="text-[10px] font-bold text-slate-400 uppercase">Nhu cầu / Ghi chú</label><p className="text-sm text-slate-700">{lead.needs || 'Chưa có ghi chú'}</p></div>
                    <div className="bg-slate-50 p-3 rounded-xl"><label className="text-[10px] font-bold text-slate-400 uppercase">Ngân sách dự kiến</label><p className="text-sm font-bold text-slate-900">{lead.budget || 'Chưa xác định'}</p></div>
                    
                    {/* MEMORY PREVIEW */}
                    {lead.longTermMemory && lead.longTermMemory.length > 0 && (
                        <div className="bg-violet-50 p-3 rounded-xl border border-violet-100">
                            <label className="text-[10px] font-bold text-violet-500 uppercase flex items-center gap-1"><Fingerprint size={10}/> Ký ức (Memory)</label>
                            <ul className="mt-1 space-y-1">
                                {lead.longTermMemory.map((m, i) => (
                                    <li key={i} className="text-[11px] text-violet-800 font-medium list-disc list-inside">{m.value}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-4"><a href={`tel:${lead.phone}`} className="py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"><Phone size={14}/> Gọi điện</a><a href={`https://zalo.me/${lead.phone}`} target="_blank" className="py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"><MessageCircle size={14}/> Zalo</a></div>
                </div>
            </div>
            <div className="flex-1 flex flex-col bg-slate-50/50">
                <div className="p-2 m-4 bg-slate-200/50 rounded-xl flex gap-1"><button onClick={() => setActiveTab('transcript')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'transcript' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Nội Dung Chat</button><button onClick={() => setActiveTab('ai_script')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'ai_script' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}><Sparkles size={14}/> Đội Ngũ AI (Agent Swarm)</button></div>
                <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                    {activeTab === 'transcript' && (<div className="space-y-4">{lead.chatHistory && lead.chatHistory.length > 0 ? (lead.chatHistory.map((msg, idx) => (<div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}><div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}><ReactMarkdown>{msg.text || (msg.toolPayload ? `[Sử dụng công cụ: ${msg.toolPayload.type}]` : '')}</ReactMarkdown></div><span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">{msg.role === 'user' ? 'Khách' : 'Trợ lý chuyên gia'} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div></div>))) : (<div className="h-full flex flex-col items-center justify-center text-slate-400 mt-10"><MessageSquare size={48} className="mb-4 opacity-20"/><p className="text-sm">Chưa có lịch sử hội thoại được ghi lại.</p></div>)}</div>)}
                    
                    {/* SWARM INTELLIGENCE TAB */}
                    {activeTab === 'ai_script' && (
                        <div className="h-full flex flex-col">
                            {!script && !isGenerating && swarmSteps.length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                                    <button onClick={handleGenerateScript} className="group relative px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3 overflow-hidden">
                                        <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                                        <Sparkles size={20} className="text-yellow-400 animate-pulse"/> Kích hoạt AI Swarm
                                    </button>
                                    <p className="text-xs text-slate-500 font-medium max-w-xs">
                                        Kích hoạt "Hội Đồng Chuyên Gia" (Kết hợp Cảm Xúc & Logic). Hệ thống sẽ gọi thêm <b>Profiler (Ký ức)</b> & <b>Lifestyle (Cảm xúc)</b> để cá nhân hóa kịch bản.
                                    </p>
                                </div>
                            )}

                            {/* AGENT STEPS VISUALIZATION */}
                            {(isGenerating || swarmSteps.length > 0) && (
                                <div className="space-y-3 mb-6">
                                    {swarmSteps.map((step, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-bottom-2 fade-in">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-lg ${step.status === 'thinking' ? 'bg-indigo-100 animate-pulse' : 'bg-slate-100'}`}>
                                                        {getAgentIcon(step.agentType)}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">{step.agentName}</h4>
                                                        <p className="text-[10px] text-slate-500">{step.agentRole}</p>
                                                    </div>
                                                </div>
                                                {step.status === 'thinking' && <Loader2 size={14} className="animate-spin text-indigo-600"/>}
                                                {step.status === 'done' && <Check size={14} className="text-emerald-500"/>}
                                            </div>
                                            {step.output && (
                                                <div className="pl-9 text-xs text-slate-700 italic border-l-2 border-indigo-100 py-1">
                                                    "{step.output}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* FINAL SCRIPT RESULT */}
                            {script && (
                                <div className="flex-1 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 delay-200">
                                    <div className="bg-indigo-50 p-4 rounded-t-2xl border border-indigo-100 flex justify-between items-start">
                                        <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
                                            <Sparkles size={16} /> Kết quả tổng hợp
                                        </div>
                                        <button onClick={handleCopy} className="text-xs font-bold flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors">
                                            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Đã sao chép' : 'Sao chép'}
                                        </button>
                                    </div>
                                    <div className="bg-white p-6 rounded-b-2xl border border-t-0 border-slate-200 shadow-sm text-sm text-slate-700 leading-relaxed overflow-y-auto custom-scrollbar">
                                        <ReactMarkdown>{script}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;
