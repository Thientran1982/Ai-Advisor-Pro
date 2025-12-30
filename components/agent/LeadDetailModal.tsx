
import React, { useState, useEffect } from 'react';
import { Lead, SwarmStep, AgentRole } from '../../types';
import { 
    X, Phone, MessageCircle, Tag, User, Sparkles, Copy, Check, Loader2, MessageSquare, 
    LineChart, BrainCircuit, PenTool, Calculator, Compass, TrendingUp, ShieldAlert, Handshake,
    Palette, MapPin, Target, Fingerprint, Coffee, Search, Landmark, Crown, Hourglass, Brain, Lightbulb,
    Gavel, DollarSign, GitBranch, Network, RefreshCw, Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { runLangGraphSwarm } from '../../services/langGraphService';
import { dataService } from '../../services/dataService';

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'transcript' | 'ai_script'>('transcript');
  const [script, setScript] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead>(lead);
  const [swarmSteps, setSwarmSteps] = useState<SwarmStep[]>([]);
  const [dataUpdated, setDataUpdated] = useState(false); // Visual Cue for Profile Update
  const [insightDetected, setInsightDetected] = useState(false); // Visual Cue for Psychology

  useEffect(() => { setCurrentLead(lead); }, [lead]);

  // 🔥 HOT RELOAD HELPER
  const refreshLeadData = () => {
      const freshLeads = dataService.getAllLeadsRaw();
      const freshData = freshLeads.find(l => l.id === currentLead.id);
      if (freshData) {
          setCurrentLead(freshData);
          setDataUpdated(true);
          setTimeout(() => setDataUpdated(false), 2000);
      }
  };

  const handleGenerateScript = async () => {
      setIsGenerating(true);
      setScript('');
      setSwarmSteps([]); 
      setDataUpdated(false);
      setInsightDetected(false);

      const result = await runLangGraphSwarm(currentLead, (step) => {
          setSwarmSteps(prev => {
              // Update existing thinking step to done/output
              const idx = prev.findIndex(s => s.agentName === step.agentName && s.status === 'thinking');
              if (idx !== -1 && step.status !== 'thinking') {
                  const newSteps = [...prev];
                  newSteps[idx] = step;
                  return newSteps;
              }
              // Add new step
              return [...prev, step];
          });

          // 🔥 REAL-TIME INTERCEPTOR: If Psychologist finishes, refresh profile immediately
          if (step.agentType === 'Psychologist' && step.status === 'done') {
              // Add a small delay to allow localStorage write in background
              setTimeout(() => {
                  refreshLeadData();
                  setInsightDetected(true);
                  setTimeout(() => setInsightDetected(false), 3000);
              }, 500);
          }
      });

      // Final refresh to ensure everything is synced
      refreshLeadData();
      
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
          case 'Manager': return <Network size={16} className="text-slate-700"/>;
          case 'WealthStructurer': return <Landmark size={16} className="text-emerald-600"/>;
          case 'RiskOfficer': return <ShieldAlert size={16} className="text-rose-500"/>; 
          case 'Storyteller': return <PenTool size={16} className="text-pink-600"/>;
          case 'MarketInsider': return <TrendingUp size={16} className="text-blue-600"/>;
          case 'Psychologist': return <Brain size={16} className="text-purple-600"/>;
          case 'ValuationExpert': return <Tag size={16} className="text-teal-600"/>;
          default: return <Sparkles size={16} className="text-indigo-500"/>;
      }
  };

  const AGENT_ROSTER = [
      { role: 'Psychologist', name: 'Tâm Lý', icon: Brain, color: 'bg-purple-100 text-purple-700' },
      { role: 'ValuationExpert', name: 'Định Giá', icon: Tag, color: 'bg-teal-100 text-teal-700' },
      { role: 'WealthStructurer', name: 'Tài Chính', icon: Landmark, color: 'bg-emerald-100 text-emerald-700' },
      { role: 'RiskOfficer', name: 'Pháp Lý', icon: ShieldAlert, color: 'bg-rose-100 text-rose-700' },
      { role: 'Manager', name: 'Supervisor', icon: Network, color: 'bg-slate-100 text-slate-700' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
                    {currentLead.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-900">{currentLead.name}</h2>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1"><Phone size={12}/> {currentLead.phone}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="flex items-center gap-1 text-indigo-600"><Tag size={12}/> {currentLead.status}</span>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X size={24}/></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* LEFT SIDEBAR: PROFILE - DYNAMIC UPDATE */}
            <div className={`w-80 border-r border-slate-100 bg-white p-6 overflow-y-auto hidden md:block transition-all duration-700 ${dataUpdated ? 'bg-indigo-50/30' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><User size={18}/> Hồ Sơ Khách Hàng</h3>
                    {dataUpdated && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1"><RefreshCw size={10} className="animate-spin"/> Sync</span>}
                </div>
                
                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-xl"><label className="text-[10px] font-bold text-slate-400 uppercase">Dự án quan tâm</label><p className="font-bold text-indigo-700">{currentLead.projectInterest}</p></div>
                    
                    {/* PSYCHOLOGY CARD - HIGHLIGHTED UPDATE */}
                    {currentLead.psychology ? (
                        <div className={`bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-xl border transition-all duration-500 ${insightDetected ? 'border-purple-400 ring-4 ring-purple-100 scale-105 shadow-xl' : 'border-purple-100'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-bold text-purple-600 uppercase flex items-center gap-1"><Brain size={10}/> Phân tích tâm lý</label>
                                {insightDetected && <Zap size={12} className="text-yellow-500 fill-yellow-500 animate-bounce"/>}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg font-black text-slate-800">DISC: {currentLead.psychology.discType}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentLead.psychology.riskTolerance === 'high' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {currentLead.psychology.riskTolerance === 'high' ? 'Thích rủi ro' : 'An toàn'}
                                </span>
                            </div>
                            {currentLead.psychology.painPoints && (
                                <ul className="space-y-1">
                                    {currentLead.psychology.painPoints.slice(0, 3).map((p, i) => (
                                        <li key={i} className="text-[10px] text-slate-600 flex items-start gap-1">
                                            <div className="w-1 h-1 bg-purple-400 rounded-full mt-1.5 shrink-0"></div> {p}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Brain size={10}/> Tâm lý hành vi</label>
                            <p className="text-[11px] text-slate-400 italic mt-1">AI đang phân tích...</p>
                        </div>
                    )}

                    <div className="bg-slate-50 p-3 rounded-xl"><label className="text-[10px] font-bold text-slate-400 uppercase">Nhu cầu / Ghi chú</label><p className="text-sm text-slate-700 line-clamp-3">{currentLead.needs || 'Chưa có ghi chú'}</p></div>
                    <div className="bg-slate-50 p-3 rounded-xl"><label className="text-[10px] font-bold text-slate-400 uppercase">Ngân sách dự kiến</label><p className="text-sm font-bold text-slate-900">{currentLead.budget || 'Chưa xác định'}</p></div>
                    
                    {currentLead.longTermMemory && currentLead.longTermMemory.length > 0 && (
                        <div className="bg-violet-50 p-3 rounded-xl border border-violet-100">
                            <label className="text-[10px] font-bold text-violet-500 uppercase flex items-center gap-1"><Fingerprint size={10}/> Ký ức (Memory)</label>
                            <ul className="mt-1 space-y-1">
                                {currentLead.longTermMemory.slice(0, 3).map((m, i) => (
                                    <li key={i} className="text-[11px] text-violet-800 font-medium list-disc list-inside truncate">{m.value}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-4"><a href={`tel:${currentLead.phone}`} className="py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"><Phone size={14}/> Gọi điện</a><a href={`https://zalo.me/${currentLead.phone}`} target="_blank" className="py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"><MessageCircle size={14}/> Zalo</a></div>
                </div>
            </div>

            {/* RIGHT MAIN: CHAT & SWARM */}
            <div className="flex-1 flex flex-col bg-slate-50/50">
                <div className="p-2 m-4 bg-slate-200/50 rounded-xl flex gap-1">
                    <button onClick={() => setActiveTab('transcript')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'transcript' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Nội Dung Chat</button>
                    <button onClick={() => setActiveTab('ai_script')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'ai_script' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Sparkles size={14}/> Hội Đồng Chuyên Gia (AI)
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                    {/* TRANSCRIPT TAB */}
                    {activeTab === 'transcript' && (
                        <div className="space-y-4">
                            {currentLead.chatHistory && currentLead.chatHistory.length > 0 ? (
                                currentLead.chatHistory.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                                <ReactMarkdown>{msg.text || (msg.toolPayload ? `[Sử dụng công cụ: ${msg.toolPayload.type}]` : '')}</ReactMarkdown>
                                            </div>
                                            <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                {msg.role === 'user' ? 'Khách' : 'Trợ lý chuyên gia'} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 mt-10">
                                    <MessageSquare size={48} className="mb-4 opacity-20"/>
                                    <p className="text-sm">Chưa có lịch sử hội thoại được ghi lại.</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* SWARM INTELLIGENCE TAB (NOW POWERED BY LANGGRAPH) */}
                    {activeTab === 'ai_script' && (
                        <div className="h-full flex flex-col">
                            {/* EMPTY STATE: READY TO SUMMON */}
                            {!script && !isGenerating && swarmSteps.length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                    <button onClick={handleGenerateScript} className="group relative px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3 overflow-hidden mb-8 hover:scale-105 active:scale-95">
                                        <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                                        <GitBranch size={20} className="text-yellow-400 animate-pulse"/> Triệu hồi LangGraph AI
                                    </button>
                                    
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Hierarchical Multi-Agent System (Graph)</p>
                                    
                                    {/* ROSTER GRID */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-lg mx-auto">
                                        {AGENT_ROSTER.map((agent, i) => (
                                            <div key={i} className={`flex flex-col items-center gap-2 p-2 rounded-xl border border-slate-100 bg-white shadow-sm hover:-translate-y-1 transition-transform`}>
                                                <div className={`p-2 rounded-lg ${agent.color}`}>
                                                    <agent.icon size={16}/>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-700 text-center">{agent.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AGENT STEPS VISUALIZATION (GRAPH FLOW) */}
                            {(isGenerating || swarmSteps.length > 0) && (
                                <div className="space-y-3 mb-6 relative">
                                    {/* Vertical Connector Line */}
                                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-200 z-0"></div>
                                    
                                    {swarmSteps.map((step, idx) => {
                                        // Indent Workers under Supervisor
                                        const isWorker = step.agentType !== 'Manager' && step.agentType !== 'Storyteller';
                                        return (
                                            <div key={idx} className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-bottom-2 fade-in relative z-10 ${isWorker ? 'ml-8 border-l-4 border-l-indigo-500' : 'ml-0'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded-lg ${step.status === 'thinking' ? 'bg-indigo-100 animate-pulse' : 'bg-slate-100'}`}>
                                                            {getAgentIcon(step.agentType)}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">{step.agentName}</h4>
                                                            <p className="text-[10px] text-slate-500 line-clamp-1">{step.agentRole}</p>
                                                        </div>
                                                    </div>
                                                    {step.status === 'thinking' && <Loader2 size={14} className="animate-spin text-indigo-600"/>}
                                                    {step.status === 'done' && <Check size={14} className="text-emerald-500"/>}
                                                </div>
                                                {step.output && (
                                                    <div className="pl-10 text-xs text-slate-700 italic border-l-2 border-indigo-100 py-1 line-clamp-3">
                                                        "{step.output}"
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* FINAL SCRIPT RESULT */}
                            {script && (
                                <div className="flex-1 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 delay-200">
                                    <div className="bg-indigo-50 p-4 rounded-t-2xl border border-indigo-100 flex justify-between items-start">
                                        <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
                                            <Lightbulb size={16} className="text-yellow-500 fill-yellow-500" /> Kết quả tổng hợp (Graph Output)
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
