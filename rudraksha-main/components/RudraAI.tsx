
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, MessageSquare, Mic, Send, 
  Loader2, AudioWaveform, StopCircle, 
  Radio, Cpu, AlertCircle, RefreshCw, ShieldCheck,
  GripVertical, MapPin, Navigation, Sparkles, Globe, Brain
} from 'lucide-react';
import { Logo } from './ui/Logo';
import { StorageService } from '../services/storageService';
import { connectToGuruLive, encodeAudio, decodeAudio, decodeAudioData, requestMicPermission, translateText } from '../services/geminiService';
import { ChatMessage, TaskStatus } from '../types';
import { Modality, LiveServerMessage, Blob, GoogleGenAI } from '@google/genai';
import { useNavigate } from 'react-router-dom';
import { GET_ROBOTIC_SYSTEM_INSTRUCTION } from '../ai-voice-model/ai';
import { AI_LANGUAGES } from '../ai-voice-model/languages';
import { ALL_RUDRA_TOOLS, executeRudraTool } from '../ai-voice-model/tool-registry';
import { useLanguage } from '../contexts/LanguageContext';

const RudraAI: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'voice'>('voice');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);

  // Position & Drag State - Responsive defaults
  const [pos, setPos] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 140 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Voice Session State
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const hasMicPermissionRef = useRef<boolean | null>(null); 
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'Idle' | 'Connecting' | 'Listening' | 'Speaking' | 'Error'>('Idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  
  // Navigation Overlay State
  const [navOverlay, setNavOverlay] = useState<{destination: string, mode: string} | null>(null);

  // Refs
  const liveSessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const micStreamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Background Wake Word Engine
  const wakeWordRecognitionRef = useRef<any>(null);
  const isMicLockedRef = useRef(false);
  
  // State Refs for Event Handlers
  const isLiveActiveRef = useRef(isLiveActive);
  useEffect(() => { isLiveActiveRef.current = isLiveActive; }, [isLiveActive]);
  
  useEffect(() => { hasMicPermissionRef.current = hasMicPermission; }, [hasMicPermission]);

  // Load Persistence
  useEffect(() => {
    const history = StorageService.getGlobalChatHistory();
    if (history && history.length > 0) {
      setMessages(history);
    }
  }, []);

  // Save Persistence
  useEffect(() => {
    if (messages.length > 0) {
      StorageService.saveGlobalChatHistory(messages);
    }
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, isTranslating]);

  // Auto-Translate Logic on Language Toggle
  useEffect(() => {
    const handleLanguageSwitch = async () => {
        if (messages.length === 0 || isTyping || isLiveActive) return;
        
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'model' && !lastMsg.text.startsWith('[SYSTEM')) {
            setIsTranslating(true);
            try {
                const translated = await translateText(lastMsg.text, language);
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = { ...lastMsg, text: translated };
                    return newMsgs;
                });
            } catch (e) {
                console.error("Translation failed", e);
            } finally {
                setIsTranslating(false);
            }
        }
    };
    handleLanguageSwitch();
  }, [language]); 

  useEffect(() => {
    const checkPermissions = async () => {
        const settings = await StorageService.getSettings();
        if (settings.permissions.microphone) {
             if (navigator.permissions && (navigator.permissions as any).query) {
                (navigator.permissions as any).query({ name: 'microphone' }).then((result: any) => {
                    if (result.state === 'granted') {
                        setHasMicPermission(true);
                        initWakeWord();
                    } else if (result.state === 'denied') {
                        setHasMicPermission(false);
                    }
                });
            } else {
                setHasMicPermission(true); 
                initWakeWord();
            }
        } else {
            setHasMicPermission(false);
        }
    };
    checkPermissions();

    const handleResize = () => {
        setPos(prev => ({
            x: Math.min(prev.x, window.innerWidth - 70),
            y: Math.min(prev.y, window.innerHeight - 120)
        }));
    };
    window.addEventListener('resize', handleResize);
    
    const handleNavStart = (e: any) => {
        setNavOverlay(e.detail);
        setIsOpen(true);
    };
    window.addEventListener('rudraksha-nav-start', handleNavStart);

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('rudraksha-nav-start', handleNavStart);
    };
  }, []);

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragOffset.current = { x: clientX - pos.x, y: clientY - pos.y };
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      hasMovedRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const newX = Math.max(10, Math.min(window.innerWidth - 60, clientX - dragOffset.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 110, clientY - dragOffset.current.y));
      setPos({ x: newX, y: newY });
    };
    const onMouseUp = () => setDragging(false);
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onMouseMove);
      window.addEventListener('touchend', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [dragging]);

  // --- WAKE WORD LOGIC ---
  const startLiveConversationRef = useRef<(context?: string) => Promise<void>>(async () => {});

  const stopWakeWord = useCallback(() => {
    if (wakeWordRecognitionRef.current) {
        try {
            wakeWordRecognitionRef.current.onend = null; 
            wakeWordRecognitionRef.current.stop();
            wakeWordRecognitionRef.current = null;
        } catch (e) {}
    }
  }, []);

  const initWakeWord = useCallback(() => {
    if (isMicLockedRef.current || isLiveActiveRef.current) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (wakeWordRecognitionRef.current) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        if (isLiveActiveRef.current || isMicLockedRef.current) return;
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const text = event.results[i][0].transcript.toLowerCase().trim();
            const isSecretTrigger = text.includes("oi baiman baccha") || text.includes("oi baiman bacha") || text.includes("ओई बेईमान बच्चा");
            const isStandardTrigger = text.includes("hey rudra") || text.includes("rudra") || text.includes("ai babu");
            
            if (isSecretTrigger || isStandardTrigger) {
                stopWakeWord(); 
                setIsOpen(true);
                setMode('voice');
                
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {});

                const triggerContext = isSecretTrigger 
                    ? " [SYSTEM EVENT: User activated via secret phrase 'Oi Baiman Baccha'. Respond ONLY with 'Jwajalapa Ama!' immediately.]" 
                    : undefined;
                
                setTimeout(() => {
                    if (startLiveConversationRef.current) {
                        startLiveConversationRef.current(triggerContext);
                    }
                }, 50); // Faster trigger response
                return;
            }
        }
      };

      recognition.onend = () => {
        wakeWordRecognitionRef.current = null;
        if (!isLiveActiveRef.current && !isMicLockedRef.current) {
          try { setTimeout(() => initWakeWord(), 300); } catch (e) {} // Fast wake word restart
        }
      };
      
      recognition.start();
      wakeWordRecognitionRef.current = recognition;
    } catch (e) { }
  }, []);

  useEffect(() => {
    const handleMicLock = (e: any) => {
        const { state } = e.detail;
        isMicLockedRef.current = state;
        if (state) {
            stopWakeWord();
        } else {
            setTimeout(() => initWakeWord(), 800);
        }
    };

    window.addEventListener('rudraksha-mic-lock', handleMicLock);
    
    return () => {
      stopWakeWord();
      window.removeEventListener('rudraksha-mic-lock', handleMicLock);
    };
  }, [initWakeWord, stopWakeWord]);

  const handleGrantPermission = async () => {
      const settings = await StorageService.getSettings();
      await StorageService.saveSettings({ 
          ...settings, 
          permissions: { ...settings.permissions, microphone: true } 
      });

      const success = await requestMicPermission();
      setHasMicPermission(success);
      if (success) {
          setErrorMsg(null);
          initWakeWord();
      } else {
          setErrorMsg("Microphone access is required for voice features.");
      }
      return success;
  };

  // --- GEMINI LIVE LOGIC ---

  const startLiveConversation = async (initialContext?: string) => {
    if (isLiveActive) return;
    
    const settings = await StorageService.getSettings();
    if (!settings.permissions.microphone) {
        setHasMicPermission(false);
        setErrorMsg("Privacy Mode Active. Microphone access disabled in Settings.");
        return;
    }

    if (!hasMicPermissionRef.current) {
        const granted = await handleGrantPermission();
        if (!granted) return;
    }
    
    stopWakeWord();
    window.dispatchEvent(new CustomEvent('rudraksha-mic-lock', { detail: { state: true } }));

    setLiveStatus('Connecting');
    setIsLiveActive(true);
    setUserTranscript('');
    setAiTranscript('');
    setErrorMsg(null);

    // Minimized aesthetic delay for snappier feel
    await new Promise(r => setTimeout(r, 100));

    try {
      let stream: MediaStream | null = null;
      for (let i = 0; i < 3; i++) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          break;
        } catch (err) {
          if (i === 2) throw new Error("Microphone busy.");
          await new Promise(r => setTimeout(r, 500)); // Faster retries
        }
      }
      micStreamRef.current = stream;

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      await inputAudioContextRef.current.resume();
      await outputAudioContextRef.current.resume();

      const today = new Date().toISOString().split('T')[0];
      const healthLog = await StorageService.getHealthLog(today);
      const moodContext = healthLog ? `[USER CONTEXT: Current recorded mood is ${healthLog.mood}. Adjust tone accordingly.]` : "";

      const systemInstructionWithContext = GET_ROBOTIC_SYSTEM_INSTRUCTION(language) + moodContext + (initialContext || "");

      const sessionPromise = connectToGuruLive({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemInstructionWithContext,
          tools: ALL_RUDRA_TOOLS,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: AI_LANGUAGES[language].voiceName } } 
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            if (!inputAudioContextRef.current || !micStreamRef.current) return;
            const source = inputAudioContextRef.current.createMediaStreamSource(micStreamRef.current);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => { 
                if (session) session.sendRealtimeInput({ media: pcmBlob }); 
              }).catch(() => {});
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
            setLiveStatus('Listening');
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
                for (const fc of message.toolCall.functionCalls) {
                    try {
                        // Execute tool directly
                        const result = await executeRudraTool(fc.name, fc.args, navigate);
                        
                        // Handle special UI signals
                        if (result === "TERMINATE_SIGNAL") {
                            stopLiveConversation();
                            return;
                        }
                        if (result === "LOGOUT_SIGNAL") {
                            stopLiveConversation();
                            await StorageService.logout();
                            navigate('/auth');
                            return;
                        }
                        if (result === "HANDOFF_TO_CHEF") {
                            stopLiveConversation();
                            setIsOpen(false);
                            return;
                        }

                        sessionPromise.then(session => {
                            if (session) {
                                session.sendToolResponse({
                                    functionResponses: {
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: result }
                                    }
                                });
                            }
                        });
                        setMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'model',
                            text: `[SYSTEM ACTION] ${result}`,
                            timestamp: Date.now()
                        }]);
                    } catch (toolError) {
                        console.error("Tool execution failed:", toolError);
                    }
                }
            }
            
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              setLiveStatus('Speaking');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
              const buffer = await decodeAudioData(decodeAudio(audioData), outputAudioContextRef.current, 24000, 1);
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioContextRef.current.destination);
              source.onended = () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) setLiveStatus('Listening');
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text || '';
                setUserTranscript(text);
            }
            if (message.serverContent?.outputTranscription) {
                setAiTranscript(prev => `${prev}${message.serverContent?.outputTranscription?.text}`);
            }
            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setLiveStatus('Listening');
            }
          },
          onerror: (e) => {
              console.error("Neural Voice Error:", e);
              setErrorMsg("Hardware link interrupted.");
              stopLiveConversation();
          },
          onclose: () => stopLiveConversation(),
        }
      });
      liveSessionPromiseRef.current = sessionPromise;
    } catch (err: any) {
      console.error("Neural Voice Link Failure:", err);
      setLiveStatus('Error');
      setErrorMsg(err.message || "Network Error.");
      setTimeout(() => stopLiveConversation(), 3000);
    }
  };

  useEffect(() => {
      startLiveConversationRef.current = startLiveConversation;
  });

  const stopLiveConversation = () => {
    setIsLiveActive(false);
    setLiveStatus('Idle');
    liveSessionPromiseRef.current?.then(s => { try { s.close(); } catch(e) {} });
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    audioSourcesRef.current.clear();
    
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close().catch(() => {});
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close().catch(() => {});
    }
    
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    nextStartTimeRef.current = 0;
    
    window.dispatchEvent(new CustomEvent('rudraksha-mic-lock', { detail: { state: false } }));
    
    // IMPORTANT: Fast restart of wake word listening after session ends
    setTimeout(() => initWakeWord(), 500);
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

  const onTriggerStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.type === 'mousedown' && (e as React.MouseEvent).button !== 0) return;
    setDragging(true);
    hasMovedRef.current = false;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStartPos.current = { x: clientX, y: clientY };
    dragOffset.current = { x: clientX - pos.x, y: clientY - pos.y };
  };

  const handleOpen = () => {
    if (!hasMovedRef.current) {
      setIsOpen(!isOpen);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isTyping) return;
      
      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
      setMessages(prev => [...prev, userMsg]);
      const currentInput = input;
      setInput('');
      setIsTyping(true);
      
      try {
        const aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let modelName = 'gemini-3-flash-preview';
        let generationConfig: any = {
            systemInstruction: GET_ROBOTIC_SYSTEM_INSTRUCTION(language),
            tools: ALL_RUDRA_TOOLS
        };

        if (isThinkingMode) {
            modelName = 'gemini-3-pro-preview';
            generationConfig.thinkingConfig = { thinkingBudget: 32768 };
        }

        const res = await aiClient.models.generateContent({
          model: modelName,
          contents: currentInput,
          config: generationConfig
        });

        if (res.functionCalls) {
            for (const fc of res.functionCalls) {
                const result = await executeRudraTool(fc.name, fc.args, navigate);
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `Action Taken: ${result}`, timestamp: Date.now() }]);
            }
        } else {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: res.text || "Command accepted.", timestamp: Date.now() }]);
        }
      } catch {
        setMessages(prev => [...prev, { id: 'err', role: 'model', text: "Signal Interrupted.", timestamp: Date.now() }]);
      } finally { setIsTyping(false); }
  };

  const getMapEmbedUrl = (dest: string, mode: string) => {
      const m = mode.toLowerCase();
      return `https://www.google.com/maps?saddr=Current+Location&daddr=${encodeURIComponent(dest)}&dirflg=${m.charAt(0)}&output=embed`;
  };

  return (
    <div className="fixed z-[9999] flex flex-col items-end touch-none select-none" style={{ left: pos.x, top: pos.y }}>
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-[90vw] md:w-[340px] h-[520px] bg-gray-950/95 backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-2 border-red-900/30 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300 mr-2 md:mr-0" onMouseDown={e => e.stopPropagation()}>
          {/* HEADER */}
          <header className="p-5 bg-gradient-to-b from-red-950/50 to-transparent flex justify-between items-center shrink-0 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-600 to-red-800 p-2 rounded-xl shadow-lg shadow-red-900/50">
                <Cpu size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-[0.2em] text-[12px] leading-none italic text-white flex items-center gap-2">
                    Rudra <span className="text-red-500">Core</span>
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                   <div className={`w-1.5 h-1.5 rounded-full ${isLiveActive ? (liveStatus === 'Error' ? 'bg-red-500' : 'bg-green-500 animate-pulse') : 'bg-gray-500'}`}></div>
                   <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{isLiveActive ? liveStatus : 'System Ready'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
                <button 
                    onClick={() => setIsThinkingMode(!isThinkingMode)}
                    className={`p-2 rounded-lg transition-colors ${isThinkingMode ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                    title="Deep Think Mode"
                >
                    <Brain size={16} className={isThinkingMode ? "animate-pulse" : ""} />
                </button>
               <button onClick={() => { setMode(mode === 'chat' ? 'voice' : 'chat'); setNavOverlay(null); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                  {mode === 'chat' ? <Mic size={16}/> : <MessageSquare size={16}/>}
               </button>
               <button onClick={() => { setIsOpen(false); setNavOverlay(null); }} className="p-2 hover:bg-red-900/50 rounded-lg transition-colors text-gray-400 hover:text-red-500"><X size={16}/></button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden relative flex flex-col">
            
            {navOverlay ? (
                <div className="flex flex-col h-full bg-gray-900 relative animate-in fade-in">
                    <div className="p-3 bg-indigo-900/50 flex justify-between items-center border-b border-white/10">
                        <div className="flex items-center gap-2 text-white">
                            <Navigation size={16} className="text-indigo-400"/>
                            <span className="text-xs font-bold uppercase tracking-wide truncate max-w-[180px]">{navOverlay.destination}</span>
                        </div>
                        <span className="text-[10px] font-black bg-indigo-600 px-2 py-0.5 rounded uppercase">{navOverlay.mode}</span>
                    </div>
                    <iframe 
                        src={getMapEmbedUrl(navOverlay.destination, navOverlay.mode)} 
                        className="flex-1 w-full border-0 bg-gray-800"
                        title="Navigation"
                        loading="lazy"
                    />
                    <button onClick={() => setNavOverlay(null)} className="absolute bottom-4 right-4 bg-red-600 text-white p-2 rounded-full shadow-lg z-10 hover:scale-110 transition-transform"><X size={20}/></button>
                </div>
            ) : mode === 'chat' ? (
              <div className="flex flex-col h-full bg-gradient-to-b from-black/20 to-black/60">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar scroll-smooth">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] border relative ${
                          m.role === 'user' 
                          ? 'bg-gradient-to-br from-red-600 to-red-800 text-white border-red-500 rounded-tr-none shadow-lg' 
                          : 'bg-gray-800/80 backdrop-blur-md border-gray-700 text-gray-200 rounded-tl-none shadow-sm'
                      }`}>
                        <p className="whitespace-pre-wrap font-medium leading-relaxed font-sans">
                          {m.text}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                      <div className="flex justify-start animate-in fade-in">
                          <div className="flex gap-1.5 p-3 bg-gray-800/50 rounded-2xl rounded-tl-none border border-gray-700/50 items-center">
                              {isThinkingMode ? (
                                  <>
                                    <Brain size={14} className="text-indigo-400 animate-pulse mr-1"/>
                                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Thinking...</span>
                                  </>
                              ) : (
                                  <>
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-200"></div>
                                  </>
                              )}
                          </div>
                      </div>
                  )}

                  {isTranslating && (
                      <div className="flex justify-center animate-in fade-in">
                          <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/30 rounded-full border border-blue-500/30 text-[10px] text-blue-300 uppercase font-black tracking-widest">
                              <Globe size={12} className="animate-spin-slow"/> Translating...
                          </div>
                      </div>
                  )}
                </div>
                
                <form onSubmit={handleChatSubmit} className="p-3 bg-black/40 border-t border-white/5 flex gap-2 items-end backdrop-blur-md">
                  <input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    placeholder={isThinkingMode ? "Ask complex query..." : t("Enter command...", "Enter command...")}
                    className={`flex-1 px-4 py-3 text-xs bg-gray-900/80 border rounded-2xl outline-none focus:border-red-600 text-white placeholder-gray-500 transition-all font-medium ${isThinkingMode ? 'border-indigo-500/50 focus:border-indigo-500' : 'border-gray-700'}`} 
                  />
                  <button type="submit" disabled={!input.trim()} className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 mb-0.5 ${isThinkingMode ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20' : 'bg-red-600 hover:bg-red-500 shadow-red-600/20'}`}>
                    <Send size={16}/>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col h-full bg-gradient-to-b from-transparent to-black/40">
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
                  <div className="relative">
                      {/* Ambient Glow */}
                      <div className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-1000 ${isLiveActive ? (liveStatus === 'Error' ? 'bg-red-500/40' : 'bg-red-600/30 scale-150 animate-pulse') : 'bg-red-900/10'}`}></div>
                      
                      {hasMicPermission === false ? (
                          <div className="relative z-10 flex flex-col items-center gap-6 animate-in zoom-in">
                             <div className="w-32 h-32 bg-gray-900 rounded-full border-2 border-gray-800 flex items-center justify-center text-gray-600 shadow-2xl">
                                <ShieldCheck size={40} className="opacity-50" />
                             </div>
                             <div className="text-center space-y-3">
                                <p className="text-xs font-black text-white uppercase tracking-widest leading-tight">Access Locked</p>
                                <button onClick={handleGrantPermission} className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-full shadow-lg transition-all border border-red-400/20">Grant Access</button>
                             </div>
                          </div>
                      ) : (
                        <button 
                            onClick={isLiveActive ? stopLiveConversation : () => startLiveConversation()} 
                            className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-500 z-10 border-[6px] ${isLiveActive ? (liveStatus === 'Error' ? 'bg-red-950 border-red-500' : 'bg-gradient-to-b from-red-600 to-red-800 border-red-400 shadow-[0_0_80px_rgba(220,38,38,0.4)]') : 'bg-gray-900 border-gray-800 shadow-2xl hover:border-gray-700 hover:scale-105'}`}
                        >
                            {liveStatus === 'Connecting' ? <Loader2 size={48} className="text-white animate-spin" /> : (liveStatus === 'Error' ? <AlertCircle size={48} className="text-red-400" /> : (isLiveActive ? <AudioWaveform size={48} className="text-white animate-pulse" /> : <Mic size={40} className="text-gray-500 group-hover:text-white transition-colors" />))}
                            <span className={`text-[9px] font-black tracking-[0.2em] uppercase mt-3 ${isLiveActive ? 'text-white/80' : 'text-gray-600'}`}>{isLiveActive ? liveStatus : 'Tap to Link'}</span>
                        </button>
                      )}
                  </div>
                  
                  {isLiveActive && liveStatus !== 'Error' && (
                      <button onClick={stopLiveConversation} className="bg-black/40 text-red-400 border border-red-900/50 rounded-full px-8 py-3 uppercase text-[10px] font-black tracking-[0.2em] hover:bg-red-900/20 hover:text-red-300 transition-all animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2 backdrop-blur-md">
                        <StopCircle size={14} /> Terminate
                      </button>
                  )}

                  {liveStatus === 'Error' && errorMsg && (
                      <div className="bg-red-950/50 border border-red-900/50 p-4 rounded-2xl text-center animate-in zoom-in duration-300 backdrop-blur-md max-w-[200px]">
                          <p className="text-red-300 text-xs font-bold leading-tight">{errorMsg}</p>
                          <button onClick={() => startLiveConversation()} className="mt-3 text-[9px] font-black text-white bg-red-600 px-4 py-1.5 rounded-full uppercase flex items-center gap-1 mx-auto hover:bg-red-500 transition-colors">
                            <RefreshCw size={10} /> Retry
                          </button>
                      </div>
                  )}
                </div>

                <div className="p-6 bg-black/40 border-t border-white/5 h-28 overflow-hidden flex flex-col justify-center shrink-0 backdrop-blur-lg">
                   <div className="flex items-center gap-2 mb-2">
                      <Radio size={12} className={`text-red-500 ${isLiveActive && liveStatus !== 'Error' ? 'animate-pulse' : ''}`} />
                      <span className="text-[9px] font-black text-red-500/80 uppercase tracking-[0.3em]">Neural Interface</span>
                   </div>
                   {/* Fallback Pulse Visualization instead of text */}
                   <div className="flex justify-center items-center h-10 gap-1">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className={`w-1 bg-red-600 rounded-full transition-all duration-300 ${isLiveActive && (liveStatus === 'Listening' || liveStatus === 'Speaking') ? 'animate-wave h-6' : 'h-1 opacity-20'}`} style={{animationDelay: `${i*0.1}s`}}></div>
                        ))}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <div 
        className={`group relative cursor-grab active:cursor-grabbing transition-transform duration-300 ${dragging ? 'scale-110' : 'hover:scale-105'}`} 
        onMouseDown={onTriggerStart} 
        onTouchStart={onTriggerStart}
      >
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 whitespace-nowrap shadow-xl border border-white/10">
           <GripVertical size={8} /> RUDRA CORE
        </div>
        <button 
            onClick={handleOpen} 
            className={`w-14 h-14 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-500 border-2 ${isOpen ? 'bg-red-600 border-red-400 rotate-90 scale-90' : 'bg-gray-900/90 border-gray-700 hover:border-red-500/50 hover:bg-gray-800 backdrop-blur-sm'}`}
        >
          {isOpen ? <X size={24} className="text-white"/> : <Logo className="w-9 h-9 drop-shadow-lg" />}
        </button>
        {!isOpen && !dragging && <div className="absolute inset-0 rounded-2xl bg-red-600 animate-ping opacity-10 pointer-events-none duration-1000"></div>}
      </div>
    </div>
  );
};

export default RudraAI;
