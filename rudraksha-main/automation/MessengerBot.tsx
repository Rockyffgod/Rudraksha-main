
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Terminal, Loader2, CheckCircle, AlertTriangle, User, MessageSquare, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PlatformService } from '../services/platformService';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';

// --- CONFIGURATION ---
const STATIC_FRIEND_DATABASE: Record<string, string> = {
  "rudra": "rudra.pall",
  "rudra pall": "rudra.pall",
  "aarav": "aarav.sharma.demo",
  "sita": "sita.teacher.demo",
  "ram": "ram.bahadur",
  "mom": "mom.profile.id",
  "dad": "dad.profile.id",
  "bhanse": "bhanse.dai"
};

interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'command';
  message: string;
}

const MessengerBot: React.FC = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'LISTENING' | 'PARSING' | 'EXECUTING'>('IDLE');
  const [friendDb, setFriendDb] = useState<Record<string, string>>(STATIC_FRIEND_DATABASE);
  
  // Parsed Data
  const [targetName, setTargetName] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Security Check: Redirect if not admin
    const initBot = async () => {
        const profile = await StorageService.getProfile();
        if (!profile || profile.email !== 'admin@gmail.com') {
            navigate('/');
            return;
        }

        addLog('info', 'Rudra Automator v1.0 Initialized.');
        addLog('info', 'Security Sandbox: Active. Using Deep-Link Protocol.');
        
        // Load connected friends
        if (PlatformService.isConnected('facebook')) {
            const connections = PlatformService.getConnections();
            const fbAccount = connections.find(c => c.provider === 'facebook');
            if (fbAccount && fbAccount.friends) {
                const dynamicFriends: Record<string, string> = {};
                fbAccount.friends.forEach(f => {
                    // Mock ID generation for demo
                    dynamicFriends[f.toLowerCase()] = f.toLowerCase().replace(/\s+/g, '.');
                });
                setFriendDb(prev => ({ ...prev, ...dynamicFriends }));
                addLog('success', `Synced ${fbAccount.friends.length} contacts from Facebook.`);
            }
        }
    };
    initBot();

    return () => stopListening();
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, { id: Date.now().toString() + Math.random(), timestamp: Date.now(), type, message }]);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      addLog('error', 'Browser does not support Web Speech API.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('LISTENING');
      addLog('info', 'Microphone active. Waiting for command...');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);
      
      if (event.results[current].isFinal) {
        handleCommand(transcriptText.toLowerCase());
      }
    };

    recognition.onerror = (event: any) => {
      addLog('error', `Speech Error: ${event.error}`);
      setStatus('IDLE');
      setIsListening(false);
    };

    recognition.onend = () => {
      if (status === 'LISTENING') {
          // Auto-restart if we didn't manually stop
          try { recognition.start(); } catch {}
      } else {
          setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setStatus('IDLE');
    addLog('info', 'Listening suspended.');
  };

  const handleCommand = (text: string) => {
    addLog('command', `>> "${text}"`);

    // Regex for: "Message [Name] saying [Message]"
    // Variants: "Text [Name] that [Message]", "Send to [Name] saying [Message]"
    const pattern = /(?:message|text|send to)\s+([a-zA-Z\s]+?)\s+(?:saying|that|:)\s+(.*)/i;
    const match = text.match(pattern);

    if (match) {
        const nameRaw = match[1].trim();
        const msgRaw = match[2].trim();
        
        setStatus('PARSING');
        setTargetName(nameRaw);
        setMessageBody(msgRaw);
        
        addLog('info', `Target Identified: ${nameRaw}`);
        addLog('info', `Payload: "${msgRaw}"`);
        
        findAndExecute(nameRaw, msgRaw);
    } else {
        // Simple Reset Command
        if (text.includes("reset") || text.includes("clear")) {
            setTargetName(null);
            setMessageBody(null);
            setTargetId(null);
            addLog('info', 'Buffer cleared.');
        }
    }
  };

  const findAndExecute = (name: string, message: string) => {
      // 1. Fuzzy Match Name from merged DB
      const keys = Object.keys(friendDb);
      const match = keys.find(k => name.toLowerCase().includes(k) || k.includes(name.toLowerCase()));

      if (match) {
          const id = friendDb[match];
          setTargetId(id);
          addLog('success', `Database Match: ${match} -> ID: ${id}`);
          executeAutomation(id, message);
      } else {
          addLog('error', `User "${name}" not found in registry. Try connecting Facebook in Settings.`);
          setStatus('LISTENING');
      }
  };

  const executeAutomation = async (id: string, message: string) => {
      setStatus('EXECUTING');
      
      // 1. Clipboard Hack (Browser security workaround)
      try {
          await navigator.clipboard.writeText(message);
          addLog('success', 'Message payload copied to clipboard.');
      } catch (e) {
          addLog('error', 'Clipboard access denied. You may need to type manually.');
      }

      // 2. Open Deep Link
      addLog('info', 'Injecting Deep Link Protocol...');
      
      setTimeout(() => {
          const url = `https://www.messenger.com/t/${id}`;
          window.open(url, '_blank');
          addLog('success', 'Messenger Tab Launched.');
          addLog('info', 'ACTION REQUIRED: Press Ctrl+V (Paste) and Enter in the new tab.');
          setStatus('IDLE');
          
          // Speak instruction
          const utterance = new SpeechSynthesisUtterance(`Opening Messenger for ${targetName}. I have copied the message. Please paste and send.`);
          window.speechSynthesis.speak(utterance);
      }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-100px)] p-4 md:p-8 flex flex-col md:flex-row gap-8 animate-in fade-in duration-500">
        
        {/* Left Control Panel */}
        <div className="w-full md:w-1/3 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 rounded-2xl ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                        {isListening ? <Mic size={32}/> : <MicOff size={32}/>}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900 dark:text-white">Bot Control</h2>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{status}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Button 
                        onClick={isListening ? stopListening : startListening}
                        className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest text-lg ${isListening ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'} shadow-xl`}
                    >
                        {isListening ? 'Deactivate' : 'Activate Bot'}
                    </Button>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Voice Command Format</p>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 italic">"Message [Name] saying [Text]"</p>
                    </div>
                </div>
            </div>

            {/* Parsed Data Visualization */}
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <Terminal size={16}/> Parsed Intents
                </h3>
                
                <div className="space-y-6">
                    <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="pl-6 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-gray-400">Target User</span>
                            <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                                <User size={18} className="text-indigo-500"/>
                                {targetName || <span className="text-gray-300 italic">Waiting...</span>}
                            </div>
                            {targetId && <span className="text-[10px] font-mono text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">ID: {targetId}</span>}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="pl-6 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-gray-400">Message Payload</span>
                            <div className="flex items-start gap-2 text-md font-medium text-gray-900 dark:text-white">
                                <MessageSquare size={18} className="text-indigo-500 mt-1 shrink-0"/>
                                <p className="leading-tight">{messageBody || <span className="text-gray-300 italic">Waiting for input...</span>}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Console Log */}
        <div className="flex-1 bg-gray-950 rounded-[2.5rem] p-8 shadow-2xl border-4 border-gray-900 flex flex-col font-mono text-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-12 bg-gray-900 flex items-center px-6 gap-2 border-b border-gray-800">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-4 text-gray-500 font-bold text-xs">bot_terminal.exe</span>
            </div>

            <div className="mt-8 flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {logs.length === 0 && (
                    <div className="text-gray-600 italic text-center mt-20">System Idle. Initialize to begin logging.</div>
                )}
                {logs.map(log => (
                    <div key={log.id} className="flex gap-3 animate-in slide-in-from-left-2 duration-200">
                        <span className="text-gray-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                        <span className={`${
                            log.type === 'error' ? 'text-red-400' : 
                            log.type === 'success' ? 'text-green-400' : 
                            log.type === 'command' ? 'text-yellow-400' : 'text-blue-300'
                        }`}>
                            {log.type === 'command' ? '$' : '>'} {log.message}
                        </span>
                    </div>
                ))}
                {isListening && (
                    <div className="flex gap-2 items-center text-gray-500 animate-pulse">
                        <span>></span> {transcript || "..."}
                    </div>
                )}
                <div ref={logsEndRef}></div>
            </div>

            {/* Manual Override Input */}
            <div className="mt-4 pt-4 border-t border-gray-800 flex gap-2">
                <input 
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-700 font-mono"
                    placeholder="Manual command override..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleCommand((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                        }
                    }}
                />
                <Send size={16} className="text-gray-500"/>
            </div>
        </div>

    </div>
  );
};

export default MessengerBot;
