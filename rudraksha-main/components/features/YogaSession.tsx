
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { StorageService } from '../../services/storageService';
import { Button } from '../ui/Button';
import { X, Mic, Play, Pause, ChevronRight, CheckCircle, RotateCcw, Timer, Volume2, AudioWaveform, Loader2, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { connectToGuruLive, encodeAudio, decodeAudio, decodeAudioData, safeBase64Encode } from '../../services/geminiService';
import { Modality, LiveServerMessage, Blob, FunctionDeclaration, Type } from '@google/genai';

interface YogaSessionProps {
  pose: any;
  onClose: () => void;
}

export const YogaSession: React.FC<YogaSessionProps> = ({ pose, onClose }) => {
    const { t } = useLanguage();
    
    // Session State
    const [stepIndex, setStepIndex] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [sessionLang, setSessionLang] = useState<'en' | 'ne' | null>(null);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [awardMessage, setAwardMessage] = useState<string>('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState<'Listening' | 'Speaking' | 'Processing'>('Listening');
    
    // Audio Refs
    const liveSessionRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const stepRef = useRef(0); // Track step index in ref for Live callbacks
    const timerRef = useRef<any>(null);

    const steps = sessionLang === 'ne' ? (pose.detailedStepsNe || pose.detailedSteps) : pose.detailedSteps;
    const recommendedDuration = pose.stepDurations ? (pose.stepDurations[stepIndex] || 30) : 30;

    // --- PERMISSION & SETUP ---

    const handleLanguageSelect = (lang: 'en' | 'ne') => {
        setSessionLang(lang);
        // Permission check UI will render next
    };

    const grantPermissionAndStart = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = stream;
            setPermissionGranted(true);
            startLiveSession(stream);
        } catch (e) {
            console.error("Mic Permission Denied", e);
            alert(t("Microphone access is required for the Voice Coach feature.", "Microphone access is required for the Voice Coach feature."));
            setSessionLang(null); // Reset to language selection
        }
    };

    // --- GEMINI LIVE SETUP ---
    
    const startLiveSession = async (stream: MediaStream) => {
        if (!sessionLang) return;
        setIsConnecting(true);
        
        // Lock Global Rudra
        window.dispatchEvent(new CustomEvent('rudraksha-mic-lock', { detail: { state: true } }));

        try {
            // 1. Audio Context Setup
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            await inputAudioContextRef.current.resume();
            await outputAudioContextRef.current.resume();

            // 2. Define Tools for Voice Control
            const SESSION_TOOLS: FunctionDeclaration[] = [
                {
                    name: 'control_step',
                    parameters: {
                        type: Type.OBJECT,
                        description: 'Navigate the session steps based on user command.',
                        properties: {
                            action: { type: Type.STRING, enum: ['next', 'prev', 'exit', 'repeat'] }
                        },
                        required: ['action']
                    }
                }
            ];

            // 3. System Prompt - ENHANCED for Conversation & Controls
            const langInstruction = sessionLang === 'ne' 
                ? "Speak in Nepali (Devanagari). Use respectful tone (Hajur, Tapai). You are a local instructor." 
                : "Speak in English. You are a professional coach.";
            
            const systemPrompt = `
                You are Rudra, an expert Yoga and Fitness Instructor. 
                ACTIVE SESSION: ${pose.name}.
                ${langInstruction}

                ROLE & BEHAVIOR:
                1. **Guide**: I will send you the text for the current step via a system message. You must narrate it clearly, pacing yourself like a coach.
                2. **Conversationalist**: The user might talk to you while doing the exercise (e.g., "This is hard", "What muscles does this work?", "Am I doing it right?"). 
                   - You MUST answer these questions briefly and encouragingly without losing track of the session.
                   - After answering, gently remind them to continue or say "Next" when ready.
                3. **Controller**: Listen for navigation keywords to control the flow.

                NAVIGATION TRIGGERS (Call 'control_step' tool immediately if heard):
                - **NEXT**: "Next", "Okay done", "Ready", "Finished", "Arko", "Aagadi", "Sakincha", "Go". -> action="next"
                - **PREVIOUS**: "Back", "Previous", "Wait", "Pachhi", "Farka". -> action="prev"
                - **REPEAT**: "Repeat", "Say again", "What?", "Feri bhana", "Arko choti". -> action="repeat"
                - **EXIT**: "Stop", "Exit", "End", "Quit", "Banda gara", "Pugyo". -> action="exit"

                TONE: Motivational, calm, and attentive.
            `;

            // 4. Connect
            const sessionPromise = connectToGuruLive({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: systemPrompt,
                    tools: [{ functionDeclarations: SESSION_TOOLS }],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } }
                },
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        setIsLive(true);
                        streamAudioInput(stream);
                        // Trigger first step after a brief connection delay
                        setTimeout(() => {
                            sendStepToModel(0, sessionLang);
                        }, 800);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Handle Audio Output
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            setVoiceStatus('Speaking');
                            playAudioChunk(audioData);
                        }

                        // Handle Tool Calls (Voice Commands)
                        if (msg.toolCall) {
                            for (const fc of msg.toolCall.functionCalls) {
                                const action = fc.args['action'] as string;
                                handleCommand(action);
                                
                                sessionPromise.then(s => s.sendToolResponse({
                                    functionResponses: { id: fc.id, name: fc.name, response: { result: "OK" } }
                                }));
                            }
                        }
                    },
                    onclose: () => cleanupSession()
                }
            });
            liveSessionRef.current = sessionPromise;

        } catch (e) {
            console.error("Session Error", e);
            cleanupSession();
            alert("Connection failed. Please check your internet.");
        }
    };

    const streamAudioInput = (stream: MediaStream) => {
        if (!inputAudioContextRef.current) return;
        const source = inputAudioContextRef.current.createMediaStreamSource(stream);
        const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createPcmBlob(inputData);
            liveSessionRef.current?.then(s => s.sendRealtimeInput({ media: pcmBlob }));
        };
        
        source.connect(processor);
        processor.connect(inputAudioContextRef.current.destination);
    };

    const createPcmBlob = (data: Float32Array): Blob => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
        return {
            data: encodeAudio(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    };

    const playAudioChunk = async (base64: string) => {
        if (!outputAudioContextRef.current) return;
        
        const ctx = outputAudioContextRef.current;
        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
        
        const buffer = await decodeAudioData(decodeAudio(base64), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => {
            audioSourcesRef.current.delete(source);
            if (audioSourcesRef.current.size === 0) setVoiceStatus('Listening');
        };
        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += buffer.duration;
        audioSourcesRef.current.add(source);
    };

    const cleanupSession = () => {
        setIsLive(false);
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(t => t.stop());
        }
        liveSessionRef.current?.then(s => { try { s.close() } catch(e){} });
        
        // Fixed AudioContext check
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(() => {});
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(() => {});
        }
        
        window.dispatchEvent(new CustomEvent('rudraksha-mic-lock', { detail: { state: false } }));
    };

    // --- GAME LOGIC ---

    const sendStepToModel = (idx: number, lang: string) => {
        const text = steps[idx];
        const prefix = lang === 'ne' ? `चरण ${idx + 1}` : `Step ${idx + 1}`;
        // Updated Prompt to force explanation
        const prompt = `[SYSTEM EVENT]: User is now at ${prefix}. 
        INSTRUCTION: "${text}"
        
        TASK: Explain this movement clearly and guide them through it. Do not just read the text. Give a helpful tip.`;
        
        // Use safeBase64Encode to handle Nepali/Unicode text correctly
        liveSessionRef.current?.then(s => s.sendRealtimeInput({
            media: { mimeType: 'text/plain', data: safeBase64Encode(prompt) }
        }));
    };

    const handleCommand = (action: string) => {
        if (action === 'next') {
            if (stepRef.current < steps.length - 1) {
                stepRef.current += 1;
                setStepIndex(stepRef.current);
                setTimer(0); // Reset timer for new step
                sendStepToModel(stepRef.current, sessionLang!);
            } else {
                finishSession();
            }
        } else if (action === 'prev') {
            if (stepRef.current > 0) {
                stepRef.current -= 1;
                setStepIndex(stepRef.current);
                setTimer(0); // Reset timer for prev step
                sendStepToModel(stepRef.current, sessionLang!);
            }
        } else if (action === 'repeat') {
            sendStepToModel(stepRef.current, sessionLang!);
        } else if (action === 'exit') {
            onClose();
        }
    };

    // Helper wrapper for button clicks to also trigger model speech
    const manualStep = (delta: number) => {
        const newIdx = stepIndex + delta;
        if (newIdx >= 0 && newIdx < steps.length) {
            stepRef.current = newIdx;
            setStepIndex(newIdx);
            setTimer(0); // Reset timer on manual step
            sendStepToModel(newIdx, sessionLang!);
        } else if (newIdx >= steps.length) {
            finishSession();
        }
    };

    const finishSession = async () => {
        setIsFinished(true);
        liveSessionRef.current?.then(s => s.sendRealtimeInput({
            media: { mimeType: 'text/plain', data: safeBase64Encode("Say: Session Complete. Great job! Namaste.") }
        }));
        
        const result = await StorageService.trackYogaSession(pose.id);
        setAwardMessage(result.message);
        if (result.awarded) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        
        setTimeout(cleanupSession, 4000);
    };

    // Timer Tick
    useEffect(() => {
        if (isLive && !isFinished) {
            timerRef.current = setInterval(() => setTimer(prev => prev + 1), 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [isLive, isFinished]);

    // Cleanup on unmount
    useEffect(() => {
        return () => cleanupSession();
    }, []);

    const formatTimer = (t: number) => {
        const m = Math.floor(t / 60);
        const s = t % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // 1. Language Selection Screen
    if (!sessionLang) {
        return (
            <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
                <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2rem] p-8 text-center space-y-8 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500"><X size={24}/></button>
                    <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Mic size={32} className="text-indigo-600"/>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Voice Coach</h2>
                    <p className="text-gray-500 text-sm">Rudra will guide you step-by-step. Select language to begin.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <Button onClick={() => handleLanguageSelect('en')} className="h-16 text-lg font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl">
                            English
                        </Button>
                        <Button onClick={() => handleLanguageSelect('ne')} className="h-16 text-lg font-black bg-red-600 hover:bg-red-700 text-white rounded-2xl">
                            नेपाली
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Permission Request Screen
    if (!permissionGranted) {
        return (
            <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-6 animate-in zoom-in duration-300">
                <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2rem] p-10 text-center space-y-8 border-4 border-indigo-600/20">
                    <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(79,70,229,0.3)] animate-pulse">
                        <ShieldCheck size={40} className="text-indigo-600"/>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">{t("Access Required", "Access Required")}</h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {t("To provide real-time guidance and feedback, Rudra needs access to your microphone.", "To provide real-time guidance and feedback, Rudra needs access to your microphone.")}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button onClick={grantPermissionAndStart} className="w-full h-16 text-lg font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl">
                            {t("Grant Access & Start", "Grant Access & Start")}
                        </Button>
                        <button onClick={() => setSessionLang(null)} className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest py-2">
                            {t("Cancel", "Cancel")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isConnecting) {
        return (
            <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-6 text-white text-center">
                <Loader2 className="w-16 h-16 animate-spin text-indigo-500 mb-6"/>
                <h2 className="text-xl font-black uppercase tracking-widest animate-pulse">Connecting to Rudra Core...</h2>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <button onClick={() => { cleanupSession(); onClose(); }} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full hover:bg-red-500 hover:text-white transition-all text-white"><X size={24}/></button>
            
            {!isFinished ? (
                <div className="w-full max-w-2xl text-center space-y-12">
                    <div className="space-y-4">
                        <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto border-4 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                            <pose.icon size={48} className="text-indigo-400"/>
                        </div>
                        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">{sessionLang === 'ne' ? (pose.neName || pose.name) : pose.name}</h2>
                        <div className="flex items-center justify-center gap-3">
                            <span className="px-4 py-1 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest text-indigo-300">
                                {sessionLang === 'ne' ? `चरण ${stepIndex + 1} / ${steps.length}` : `Step ${stepIndex + 1} / ${steps.length}`}
                            </span>
                            <span className="px-4 py-1 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest text-green-400 flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${voiceStatus === 'Listening' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                {voiceStatus === 'Listening' ? 'Listening...' : 'Speaking...'}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] relative overflow-hidden min-h-[300px] flex flex-col justify-center">
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}></div>
                        </div>
                        
                        {/* Audio Wave Visualizer */}
                        <div className="flex justify-center items-center h-12 gap-1 mb-6 opacity-50">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className={`w-1 bg-indigo-500 rounded-full transition-all duration-100 ${voiceStatus === 'Speaking' ? 'animate-wave h-8' : 'h-2'}`} style={{animationDelay: `${i*0.1}s`}}></div>
                            ))}
                        </div>

                        <p className="text-2xl md:text-3xl font-medium text-white leading-relaxed font-serif animate-in slide-in-from-right-4 fade-in">
                            "{steps[stepIndex]}"
                        </p>
                        <div className="mt-12 flex justify-center items-center gap-2 text-indigo-400 font-mono text-xl">
                            <Timer size={20} className="animate-spin-slow"/> 
                            <span>{formatTimer(timer)} / {formatTimer(recommendedDuration)}</span>
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 text-center opacity-40">
                             <p className="text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                <Mic size={12} /> 
                                {sessionLang === 'ne' ? "भन्नुहोस्: 'अर्को', 'फर्क', 'प्रश्न सोध्नुहोस्'" : 'Say "Next", "Back", or ask a question'}
                             </p>
                        </div>
                    </div>

                    <div className="flex justify-center gap-6">
                        <Button onClick={() => manualStep(-1)} disabled={stepIndex === 0} variant="secondary" className="w-16 h-16 rounded-full flex items-center justify-center bg-white/10 text-white border-none hover:bg-white/20"><ChevronRight size={24} className="rotate-180"/></Button>
                        <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl bg-red-600 text-white animate-pulse">
                            <AudioWaveform size={32} />
                        </div>
                        <Button onClick={() => manualStep(1)} variant="secondary" className="w-16 h-16 rounded-full flex items-center justify-center bg-white/10 text-white border-none hover:bg-white/20"><ChevronRight size={24}/></Button>
                    </div>
                </div>
            ) : (
                <div className="text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/40">
                        <CheckCircle size={64} className="text-white"/>
                    </div>
                    <div>
                        <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-2">{sessionLang === 'ne' ? "नमस्ते" : "Namaste"}</h2>
                        <p className="text-gray-400 text-lg">{sessionLang === 'ne' ? "अभ्यास सम्पन्न भयो।" : "Workout Complete."}</p>
                    </div>
                    <div className="bg-white/10 p-6 rounded-3xl border border-white/10">
                        <div className="text-sm font-black text-yellow-400 uppercase tracking-widest mb-1">Rewards</div>
                        <div className="text-xl font-bold text-white">{awardMessage || "Progress Logged"}</div>
                    </div>
                    <Button onClick={onClose} className="bg-white text-black font-black w-full h-16 rounded-2xl text-lg uppercase tracking-widest">
                        Return to Studio
                    </Button>
                </div>
            )}
        </div>
    );
};
