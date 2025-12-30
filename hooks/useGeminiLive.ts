
import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { tools, getLiveSystemInstruction } from '../services/geminiService';
import { createBlob, decodeAudioData } from '../utils/audioHelpers';
import { dataService } from '../services/dataService';
import { UserProfile } from '../types';

export const useGeminiLive = () => {
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [isLiveConnecting, setIsLiveConnecting] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(0); // For visualizer
    const [liveError, setLiveError] = useState<string | null>(null); // NEW: Managed Error State

    const activeSessionRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    const analyserRef = useRef<AnalyserNode | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => { stopLiveSession(); };
    }, []);

    // Visualizer loop
    useEffect(() => {
        let animationFrame: number;
        const updateVolume = () => {
            if (isLiveActive && analyserRef.current) {
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setVolumeLevel(avg);
            } else {
                setVolumeLevel(0);
            }
            animationFrame = requestAnimationFrame(updateVolume);
        };
        updateVolume();
        return () => cancelAnimationFrame(animationFrame);
    }, [isLiveActive]);

    const stopLiveSession = () => {
        if (audioStreamRef.current) { 
            audioStreamRef.current.getTracks().forEach(track => track.stop()); 
            audioStreamRef.current = null; 
        }
        if (inputAudioContextRef.current) { 
            inputAudioContextRef.current.close(); 
            inputAudioContextRef.current = null; 
        }
        
        scheduledSourcesRef.current.forEach(source => { try { source.stop(); } catch(e){} });
        scheduledSourcesRef.current = [];
        
        if (outputAudioContextRef.current) { 
            outputAudioContextRef.current.close(); 
            outputAudioContextRef.current = null; 
        }
        
        setIsLiveActive(false); 
        setIsLiveConnecting(false); 
        nextStartTimeRef.current = 0;
        activeSessionRef.current = null;
        analyserRef.current = null;
        setLiveError(null); // Clear errors on stop
    };

    const startLiveSession = async () => {
        if (isLiveActive || isLiveConnecting) return;
        setIsLiveConnecting(true);
        setLiveError(null);
        
        try {
            // 1. Context Preparation
            const leads = dataService.getAllLeadsRaw();
            const currentLead = leads.length > 0 ? leads[0] : null;
            const userProfile: UserProfile | null = currentLead 
                ? { name: currentLead.name, phone: currentLead.phone, type: currentLead.userType, lastVisit: new Date() } 
                : null;

            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            inputAudioContextRef.current = inputCtx;
            outputAudioContextRef.current = outputCtx;

            // 2. Stream Setup
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;

            // 3. Analyzer Setup (Visualizer)
            const analyser = outputCtx.createAnalyser();
            analyser.fftSize = 32;
            analyserRef.current = analyser;

            // 4. AI Connection
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const dynamicInstruction = getLiveSystemInstruction(userProfile);

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: { 
                    responseModalities: [Modality.AUDIO], 
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }, 
                    systemInstruction: dynamicInstruction, 
                    tools: [{ functionDeclarations: tools }] 
                },
                callbacks: {
                    onopen: () => {
                        setIsLiveActive(true); 
                        setIsLiveConnecting(false);
                        
                        // Input Pipeline
                        const source = inputCtx.createMediaStreamSource(stream);
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessor.onaudioprocess = (e) => {
                            if (activeSessionRef.current) {
                                const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
                                sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                            }
                        };
                        
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Audio Output Handling
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const ctx = outputAudioContextRef.current;
                            const buffer = await decodeAudioData(Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)), ctx);
                            
                            const source = ctx.createBufferSource();
                            source.buffer = buffer;
                            
                            // Connect to Analyser then Destination
                            source.connect(analyser); 
                            analyser.connect(ctx.destination);

                            if (nextStartTimeRef.current < ctx.currentTime) nextStartTimeRef.current = ctx.currentTime;
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += buffer.duration;
                            
                            scheduledSourcesRef.current.push(source);
                            source.onended = () => { 
                                scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source); 
                            };
                        }

                        // Tool Call Handling
                        if (message.toolCall) {
                            const functionCalls = message.toolCall.functionCalls;
                            if (functionCalls && functionCalls.length > 0) {
                                for (const call of functionCalls) {
                                    if (call.name === 'remember_preference') {
                                        const { key, value, confidence } = call.args as any;
                                        const leads = dataService.getAllLeadsRaw();
                                        if (leads.length > 0) {
                                            dataService.addLeadMemory(leads[0].id, { 
                                                key, value, confidence: confidence || 1.0, extractedAt: new Date() 
                                            });
                                        }
                                        sessionPromise.then(session => session.sendToolResponse({ 
                                            functionResponses: [{ id: call.id, name: call.name, response: { result: "Success" } }] 
                                        }));
                                    }
                                }
                            }
                        }
                    },
                    onclose: () => stopLiveSession(),
                    onerror: (err) => { 
                        console.error("Voice Socket Error:", err); 
                        setLiveError("Mất kết nối máy chủ");
                        stopLiveSession(); 
                    }
                }
            });
            activeSessionRef.current = sessionPromise;

        } catch (error) {
            console.error("Voice Error:", error);
            setLiveError("Không thể truy cập Micro. Vui lòng cấp quyền.");
            stopLiveSession();
        }
    };

    return {
        isLiveActive,
        isLiveConnecting,
        volumeLevel,
        liveError, // Exposed for UI handling
        startLiveSession,
        stopLiveSession
    };
};
