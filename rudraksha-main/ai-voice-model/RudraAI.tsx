
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, MessageSquare, Mic, Send, 
  Loader2, AudioWaveform, StopCircle, 
  Radio, Cpu, AlertCircle, RefreshCw, ShieldCheck,
  GripVertical
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { StorageService } from '../services/storageService';
import { connectToGuruLive, encodeAudio, decodeAudio, decodeAudioData, requestMicPermission } from '../services/geminiService';
import { ChatMessage, TaskStatus } from '../types';
import { Modality, LiveServerMessage, Blob, GoogleGenAI } from '@google/genai';
import { useNavigate } from 'react-router-dom';
import { RUDRA_AI_TOOLS, ROBOTIC_SYSTEM_INSTRUCTION } from './ai';

const RudraAI: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'voice'>('voice');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Position & Drag State
  const [pos, setPos] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 140 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Voice Session State
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const hasMicPermissionRef = useRef<boolean | null>(null); // Ref to track permission in callbacks
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'Idle' | 'Connecting' | 'Listening' | 'Speaking' | 'Error'>('Idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  
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
  
  // Sync permission ref
  useEffect(() => { hasMicPermissionRef.current = hasMicPermission; }, [hasMicPermission]);

  useEffect(() => {
    StorageService.getProfile(); // Prefetch profile
    const handleResize = () => {
        setPos(prev => ({
            x: Math.min(prev.x, window.innerWidth - 60),
            y: Math.min(prev.y, window.innerHeight - 120)
        }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, userTranscript, aiTranscript]);

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
      const newX = Math.max(10, Math.min(window.innerWidth - 58, clientX - dragOffset.current.x));
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

  // Ref to hold the startLiveConversation function to avoid stale closures
  const startLiveConversationRef = useRef<() => Promise<void>>(async () => {});

  const stopWakeWord = useCallback(() => {
    if (wakeWordRecognitionRef.current) {
        try {
            wakeWordRecognitionRef.current.onend = null; // Prevent restart
            wakeWordRecognitionRef.current.stop();
            wakeWordRecognitionRef.current = null;
        } catch (e) {}
    }
  }, []);

  const initWakeWord = useCallback(() => {
    // Don't start if live session is active or mic is locked by other apps
    if (isMicLockedRef.current || isLiveActiveRef.current) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Prevent multiple instances
    if (wakeWordRecognitionRef.current) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true; // Enabled for faster response
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        // Double check state inside callback
        if (isLiveActiveRef.current || isMicLockedRef.current) return;
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const text = event.results[i][0].transcript.toLowerCase().trim();
            if (text.includes("hey rudra") || text.includes("rudra") || text.includes("ai babu")) {
                stopWakeWord(); // Stop listening so we can start Gemini Live
                setIsOpen(true);
                setMode('voice');
                
                // Play activation sound
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {});

                // Use the ref to call the latest version of startLiveConversation
                setTimeout(() => {
                    if (startLiveConversationRef.current) {
                        startLiveConversationRef.current();
                    }
                }, 100);
                return;
            }
        }
      };

      recognition.onend = () => {
        wakeWordRecognitionRef.current = null;
        // Restart if not locked/active. Removed !isOpen check to allow wake word when closed.
        if (!isLiveActiveRef.current && !isMicLockedRef.current) {
          try { setTimeout(() => initWakeWord(), 1000); } catch (e) {}
        }
      };
      
      recognition.start();
      wakeWordRecognitionRef.current = recognition;
    } catch (e) {
      // console.warn("Wake word engine failed to initialize.", e);
    }
  }, []); // Empty deps to avoid recreation, uses refs for state

  // Handle Global Mic Lock (for StudyBuddy compatibility)
  useEffect(() => {
    const handleMicLock = (e: any) => {
        const { state } = e.detail;
        isMicLockedRef.current = state;
        if (state) {
            stopWakeWord();
        } else {
            // Delay restart to allow other components to fully release
            setTimeout(() => initWakeWord(), 1500);
        }
    };

    window.addEventListener('rudraksha-mic-lock', handleMicLock);
    
    // Initial permission check
    if (navigator.permissions && (navigator.permissions as any).query) {
        (navigator.permissions as any).query({ name: 'microphone' }).then((result: any) => {
            if (result.state === 'granted') {
                setHasMicPermission(true);
                initWakeWord();
            } else if (result.state === 'denied') {
                setHasMicPermission(false);
            }
        });
    }

    return () => {
      stopWakeWord();
      window.removeEventListener('rudraksha-mic-lock', handleMicLock);
    };
  }, [initWakeWord, stopWakeWord]);

  const handleGrantPermission = async () => {
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

  const executeTool = async (name: string, args: any) => {
    // ... same as component version
    return { error: "Operation failed" };
  };

  const startLiveConversation = async () => {
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

    await new Promise(r => setTimeout(r, 800));

    try {
      let stream: MediaStream | null = null;
      for (let i = 0; i < 3; i++) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          break;
        } catch (err) {
          if (i === 2) throw new Error("Microphone busy.");
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      micStreamRef.current = stream;

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      await inputAudioContextRef.current.resume();
      await outputAudioContextRef.current.resume();

      const sessionPromise = connectToGuruLive({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: ROBOTIC_SYSTEM_INSTRUCTION,
          tools: RUDRA_AI_TOOLS,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } 
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
              sessionPromise.then(session => { session.sendRealtimeInput({ media: pcmBlob }); });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
            setLiveStatus('Listening');
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
                // Simplified tool execution for this file version
            }
            
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
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
                setUserTranscript(message.serverContent.inputTranscription.text || '');
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
      setErrorMsg(err.message || "Microphone unavailable.");
      setTimeout(() => stopLiveConversation(), 3000);
    }
  };

  // Update ref whenever function definition changes (on renders)
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
    setTimeout(() => initWakeWord(), 1500);
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

  // --- UI INTERACTION ---

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
        const res = await aiClient.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: currentInput,
          config: { systemInstruction: ROBOTIC_SYSTEM_INSTRUCTION, tools: RUDRA_AI_TOOLS }
        });

        // Simplified chat response handling
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: res.text || "Command accepted.", timestamp: Date.now() }]);
      } catch {
        setMessages(prev => [...prev, { id: 'err', role: 'model', text: "Signal Interrupted.", timestamp: Date.now() }]);
      } finally { setIsTyping(false); }
  };

  return (
    <div className="fixed z-[9999] flex flex-col items-end touch-none select-none" style={{ left: pos.x, top: pos.y }}>
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-[320px] h-[480px] bg-gray-950/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-2 border-red-900/50 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300" onMouseDown={e => e.stopPropagation()}>
          <header className="p-5 bg-black/40 text-white flex justify-between items-center shrink-0 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                <Cpu size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-widest text-[11px] leading-none italic">Rudra Core</h3>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className={`w-1.5 h-1.5 rounded-full ${isLiveActive ? (liveStatus === 'Error' ? 'bg-red-500' : 'bg-red-500 animate-pulse') : 'bg-green-500 opacity-50'}`}></div>
                   <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">{isLiveActive ? liveStatus : 'Ready'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
               <button onClick={() => setMode(mode === 'chat' ? 'voice' : 'chat')} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white">
                  {mode === 'chat' ? <Mic size={18}/> : <MessageSquare size={18}/>}
               </button>
               <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-600/20 rounded-xl transition-colors text-gray-400 hover:text-red-500"><X size={18}/></button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden relative flex flex-col">
            {mode === 'chat' ? (
              <div className="flex flex-col h-full bg-black/20">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] border ${m.role === 'user' ? 'bg-red-600 text-white border-red-500 rounded-tr-none' : 'bg-gray-900 border-gray-800 text-gray-200 rounded-tl-none shadow-xl'}`}>
                        <p className="whitespace-pre-wrap font-medium leading-relaxed font-mono italic">
                          {m.role === 'model' && "> "}{m.text}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && <div className="flex gap-2 p-3 bg-red-600/10 rounded-xl w-14 items-center justify-center border border-red-600/20"><Loader2 size={14} className="animate-spin text-red-600"/></div>}
                </div>
                <form onSubmit={handleChatSubmit} className="p-4 bg-black/40 border-t border-white/5 flex gap-3">
                  <input value={input} onChange={e => setInput(e.target.value)} placeholder="Enter command..." className="flex-1 px-4 py-2 text-xs bg-gray-900 border border-gray-800 rounded-xl outline-none focus:border-red-600 text-white font-mono" />
                  <button type="submit" disabled={!input.trim()} className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-90"><Send size={18}/></button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-10">
                  <div className="relative">
                      <div className={`absolute inset-0 rounded-full blur-[60px] transition-all duration-1000 ${isLiveActive ? (liveStatus === 'Error' ? 'bg-red-500/60' : 'bg-red-600/40 animate-pulse scale-150') : 'bg-red-600/5'}`}></div>
                      
                      {hasMicPermission === false ? (
                          <div className="relative z-10 flex flex-col items-center gap-6 animate-in zoom-in">
                             <div className="w-40 h-40 bg-gray-900 rounded-full border-4 border-gray-800 flex items-center justify-center text-gray-500 shadow-2xl">
                                <ShieldCheck size={56} className="opacity-30" />
                             </div>
                             <div className="text-center space-y-3">
                                <p className="text-xs font-black text-white uppercase tracking-widest leading-tight">Access Locked</p>
                                <p className="text-left text-[10px] text-gray-400 max-w-[140px] leading-relaxed">System requires microphone permission to engage voice link.</p>
                                <button onClick={handleGrantPermission} className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-full shadow-xl transition-all">Grant Access</button>
                             </div>
                          </div>
                      ) : (
                        <button onClick={isLiveActive ? stopLiveConversation : startLiveConversation} className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-700 z-10 border-8 ${isLiveActive ? (liveStatus === 'Error' ? 'bg-red-900 border-red-500' : 'bg-red-600 border-red-400 shadow-[0_0_60px_rgba(220,38,38,0.5)]') : 'bg-gray-900 border-gray-800 shadow-2xl opacity-60'}`}>
                            {liveStatus === 'Connecting' ? <Loader2 size={56} className="text-white animate-spin" /> : (liveStatus === 'Error' ? <AlertCircle size={56} className="text-white" /> : (isLiveActive ? <AudioWaveform size={56} className="text-white animate-pulse" /> : <Mic size={48} className="text-red-600" />))}
                            <span className={`text-[10px] font-black tracking-widest uppercase mt-4 ${isLiveActive ? 'text-white' : 'text-gray-500'}`}>{isLiveActive ? liveStatus : 'Initiate Link'}</span>
                        </button>
                      )}
                  </div>
                  
                  {isLiveActive && liveStatus !== 'Error' && (
                      <button onClick={stopLiveConversation} className="bg-red-600/10 text-red-500 border border-red-500/20 rounded-full px-8 py-3 uppercase text-[10px] font-black tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all animate-in fade-in slide-in-from-bottom-2">
                        <StopCircle size={14} className="inline mr-2 -mt-0.5"/> Terminate Link
                      </button>
                  )}

                  {liveStatus === 'Error' && errorMsg && (
                      <div className="bg-red-600/20 border border-red-500/30 p-4 rounded-2xl text-center animate-in zoom-in duration-300">
                          <p className="text-red-400 text-xs font-bold leading-tight">{errorMsg}</p>
                          <button onClick={startLiveConversation} className="mt-3 text-[10px] font-black text-white bg-red-600 px-4 py-1 rounded-full uppercase flex items-center gap-1 mx-auto">
                            <RefreshCw size={10} /> Retry Link
                          </button>
                      </div>
                  )}
                </div>

                <div className="p-6 bg-black/60 border-t border-white/5 h-24 overflow-hidden flex flex-col justify-center shrink-0">
                   <div className="flex items-center gap-2 mb-2">
                      <Radio size={12} className={`text-red-500 ${isLiveActive && liveStatus !== 'Error' ? 'animate-pulse' : ''}`} />
                      <span className="text-[9px] font-black text-red-500/80 uppercase tracking-[0.3em]">Neural Interface</span>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[12px] font-mono italic text-red-100/90 whitespace-nowrap overflow-hidden text-ellipsis">
                         {userTranscript ? `>> ${userTranscript}` : (errorMsg ? `ERROR: ${errorMsg}` : "Awaiting directives...")}
                      </p>
                      {aiTranscript && <p className="text-[10px] font-mono text-gray-500 truncate italic">{aiTranscript}</p>}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`group relative cursor-grab active:cursor-grabbing transition-transform ${dragging ? 'scale-110' : ''}`} onMouseDown={onTriggerStart} onTouchStart={onTriggerStart}>
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest flex items-center gap-1 whitespace-nowrap shadow-lg">
           <GripVertical size={8} /> RUDRA CORE
        </div>
        <button onClick={handleOpen} className={`w-12 h-12 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.4)] flex items-center justify-center transition-all border-2 ${isOpen ? 'bg-red-600 border-red-400 rotate-180' : 'bg-gray-900 border-gray-700'}`}>
          {isOpen ? <X size={20} className="text-white"/> : <Logo className="w-8 h-8 drop-shadow-lg" />}
        </button>
        {!isOpen && !dragging && <div className="absolute inset-0 rounded-2xl bg-red-600 animate-ping opacity-10 pointer-events-none"></div>}
      </div>
    </div>
  );
};

export default RudraAI;
