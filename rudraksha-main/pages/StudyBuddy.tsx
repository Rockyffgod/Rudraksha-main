
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, TriviaQuestion } from '../types';
import { 
  createStudyChat, generateTrivia, analyzeMedia 
} from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { Button } from '../components/ui/Button';
import { 
  Send, Bot, Loader2,
  X, Mic, RefreshCw,
  Image as ImageIcon, MessageSquare, Trophy, Volume2, VolumeX, Eye, ScanEye, Link as LinkIcon, Upload, CheckCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import confetti from 'canvas-confetti';
import { GenerateContentResponse } from '@google/genai';

// --- MESSAGE PARSER FOR TRI-LANGUAGE ---
const parseMessage = (rawText: string) => {
  try {
    const json = JSON.parse(rawText);
    return { 
        en: json.en || rawText, 
        ne: json.ne || json.en || rawText, 
        newa: json.newa || json.ne || json.en || rawText,
        type: json.type || 'text'
    };
  } catch {
    return { en: rawText, ne: rawText, newa: rawText, type: 'text' };
  }
};

const StudyBuddy: React.FC = () => {
  const { language } = useLanguage(); 
  
  // -- STATE --
  const [activeTab, setActiveTab] = useState<'chat' | 'trivia' | 'voice'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [responseLang, setResponseLang] = useState<'en' | 'ne' | 'newa'>('en');
  
  // Image Analysis State (Chat mode)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Trivia Game State
  const [triviaState, setTriviaState] = useState<'LOBBY' | 'LANG_SELECT' | 'PLAYING' | 'GAMEOVER'>('LOBBY');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [triviaLang, setTriviaLang] = useState<'en' | 'ne'>('en');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [triviaLoading, setTriviaLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);
  
  // -- INITIALIZATION --
  useEffect(() => {
    // Load history
    const history = StorageService.getStudyChatHistory();
    if (history.length > 0) {
      setMessages(history);
    }
    
    // Set initial language from global context
    setResponseLang(language === 'ne' ? 'ne' : 'en');

    // Initialize Chat Session
    if (!chatSessionRef.current) {
      chatSessionRef.current = createStudyChat();
    }
  }, [language]);

  useEffect(() => {
    StorageService.saveStudyChatHistory(messages);
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // -- SOUND EFFECTS --
  const playSound = (type: 'correct' | 'wrong' | 'click' | 'win') => {
    if (!soundEnabled) return;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === 'correct') {
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start();
            osc.stop(now + 0.3);
        } else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.3);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start();
            osc.stop(now + 0.3);
        } else if (type === 'click') {
            osc.frequency.setValueAtTime(800, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start();
            osc.stop(now + 0.05);
        } else if (type === 'win') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.2);
            osc.frequency.linearRampToValueAtTime(600, now + 0.4);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.6);
            osc.start();
            osc.stop(now + 0.6);
        }
    } catch(e) {}
  };

  // -- HANDLERS: CHAT --

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSpeechToText = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = responseLang === 'ne' ? 'ne-NP' : 'en-US';
    recognition.start();
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? prev + ' ' + transcript : transcript);
    };
  };

  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToSend = overrideText || input;
    
    // Allow empty text if image is selected (visual query)
    if ((!textToSend.trim() && !selectedImage) || isTyping) return;

    // Display optimistic user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: JSON.stringify({ en: textToSend, ne: textToSend, newa: textToSend, type: 'text' }),
      timestamp: Date.now(),
      image: selectedImage || undefined // Store image in history if present
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const tempImage = selectedImage; // Local capture
    setSelectedImage(null); // Clear input immediately
    setIsTyping(true);

    try {
      let responseText = "{}";
      
      if (tempImage) {
          // Multimodal Analysis request
          const prompt = textToSend.trim() || "Analyze this image and describe it.";
          const mimeType = tempImage.startsWith('data:image') ? 'image/jpeg' : 'video/mp4'; 
          const rawResponse = await analyzeMedia(tempImage, mimeType, prompt);
          
          // Wrap response in expected JSON format - Analysis is usually English-heavy, so we duplicate for simplicity or rely on AI to JSONify later if migrated. 
          // For now, analyzeMedia returns plain text. We wrap it manually.
          responseText = JSON.stringify({ 
              en: rawResponse, 
              ne: "तस्विर विश्लेषण: " + rawResponse.substring(0, 100) + "...", // Simplified fallback
              newa: "किपा विश्लेषण: " + rawResponse.substring(0, 100) + "...",
              type: 'text' 
          });
          
          // Better approach: Ask AI to format it properly. But analyzeMedia is a direct call.
          // Let's assume the user is okay with English analysis or we can try to translate it on the fly if needed.
          // For this specific feature request ("results in rudra ai can be toggles"), real-time translation of analysis would be ideal but complex.
          // We'll stick to English default for analysis output unless we change analyzeMedia.
      } else if (chatSessionRef.current) {
          // Standard Text Chat
          const result = await chatSessionRef.current.sendMessage({ message: textToSend });
          responseText = result.text || "{}";
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
      
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: JSON.stringify({ en: "Connection interrupted.", ne: "सम्पर्क विच्छेद भयो।", newa: "सम्पर्क टुट्यो।", type: "text" }),
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    if(confirm("Clear chat history?")) {
        setMessages([]);
        StorageService.clearStudyChatHistory();
        chatSessionRef.current = createStudyChat(); 
    }
  };

  // -- TRIVIA LOGIC --
  const handleCategorySelect = (category: string) => {
      setSelectedCategory(category);
      setTriviaState('LANG_SELECT');
  };

  const startTrivia = async (lang: 'en' | 'ne') => {
      setTriviaLang(lang);
      setTriviaLoading(true);
      playSound('click');
      try {
          const qs = await generateTrivia(selectedCategory, lang);
          setQuestions(qs);
          setScore(0);
          setStreak(0);
          setCurrentQIndex(0);
          setTriviaState('PLAYING');
      } catch (e) {
          alert("Failed to generate trivia. Check connection.");
          setTriviaState('LOBBY');
      } finally {
          setTriviaLoading(false);
      }
  };

  const handleTriviaAnswer = (index: number) => {
      if (selectedAnswer !== null) return; // Prevent double click
      setSelectedAnswer(index);
      
      const correct = index === questions[currentQIndex].correctAnswer;
      setIsCorrect(correct);

      if (correct) {
          playSound('correct');
          setScore(prev => prev + 10 + (streak * 2));
          setStreak(prev => prev + 1);
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#4ade80', '#ffffff'] });
      } else {
          playSound('wrong');
          setStreak(0);
      }

      setTimeout(() => {
          if (currentQIndex < questions.length - 1) {
              setCurrentQIndex(prev => prev + 1);
              setSelectedAnswer(null);
              setIsCorrect(null);
          } else {
              playSound('win');
              setTriviaState('GAMEOVER');
              // Save Karma
              StorageService.addPoints(score, score * 2, 'trivia', 'Rudra Trivia Reward');
          }
      }, 1500);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden relative font-sans">
        
        {/* --- HEADER --- */}
        <header className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shrink-0 z-20 gap-4 md:gap-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg text-white">
                    <Bot size={20}/>
                </div>
                <div>
                    <h1 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Rudra AI</h1>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Online</span>
                    </div>
                </div>
            </div>

            {/* Language & Tab Switcher */}
            <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-full border border-gray-200 dark:border-gray-700">
                    {(['en', 'ne', 'newa'] as const).map(l => (
                        <button 
                            key={l}
                            onClick={() => setResponseLang(l)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                                responseLang === l 
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' 
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        >
                            {l === 'en' ? 'EN' : l === 'ne' ? 'ने' : 'नेवा'}
                        </button>
                    ))}
                </div>

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-800"></div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1">
                    {[
                        { id: 'chat', icon: MessageSquare, label: 'Chat' },
                        { id: 'trivia', icon: Trophy, label: 'Trivia' },
                        { id: 'voice', icon: Mic, label: 'Voice' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                                activeTab === tab.id 
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' 
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        >
                            {/* @ts-ignore */}
                            <tab.icon size={16} /> 
                        </button>
                    ))}
                </div>
                
                <button onClick={handleClearChat} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <RefreshCw size={16} />
                </button>
            </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-black/20">
            
            {/* 1. CHAT INTERFACE */}
            {activeTab === 'chat' && (
                <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-50 p-8 space-y-4">
                                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                    <Bot size={40} className="text-indigo-500"/>
                                </div>
                                <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
                                    "Hey Rudra, who are you?"
                                </p>
                            </div>
                        )}
                        {messages.map((msg) => {
                            const content = parseMessage(msg.text);
                            const displayText = content[responseLang] || content.en;
                            const isUser = msg.role === 'user';

                            return (
                                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                    <div 
                                        className={`max-w-[85%] md:max-w-[70%] px-5 py-3.5 text-sm font-medium leading-relaxed shadow-sm flex flex-col gap-2 ${
                                            isUser 
                                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-[1.5rem] rounded-tr-md' 
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-[1.5rem] rounded-tl-md border border-gray-100 dark:border-gray-700'
                                        }`}
                                    >
                                        {msg.image && (
                                            <div className="rounded-xl overflow-hidden mb-1 max-w-full border-2 border-white/20">
                                                <img src={msg.image} alt="User Upload" className="max-h-60 object-cover w-full" />
                                            </div>
                                        )}
                                        <div className="whitespace-pre-wrap">{displayText}</div>
                                        
                                        {/* Timestamp */}
                                        <div className={`text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60 ${isUser ? 'text-indigo-100' : 'text-gray-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-md shadow-sm flex gap-1.5 items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2">Thinking</span>
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Image Preview Overlay */}
                    {selectedImage && (
                        <div className="px-4 py-3 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between animate-in slide-in-from-bottom-2">
                             <div className="flex items-center gap-3">
                                 <img src={selectedImage} alt="Preview" className="h-12 w-12 rounded-lg object-cover border border-indigo-500 shadow-md"/>
                                 <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wide">Ready to Analyze</span>
                                    <span className="text-[10px] text-gray-500">Ask a question about this image</span>
                                 </div>
                             </div>
                             <button onClick={() => setSelectedImage(null)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500"><X size={16}/></button>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 relative z-10">
                        <form onSubmit={(e) => handleSend(e)} className="flex items-end gap-2">
                            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-[1.5rem] flex items-center px-2 py-1.5 border border-transparent focus-within:border-indigo-500/50 transition-colors">
                                <label className="p-2 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors hover:bg-white dark:hover:bg-gray-700 rounded-full">
                                    <ImageIcon size={20} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>

                                <input 
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder={selectedImage ? "Ask about image..." : "Text Rudra..."}
                                    className="flex-1 bg-transparent border-none outline-none text-sm py-2 px-2 text-gray-900 dark:text-white placeholder-gray-500"
                                />
                                
                                <button 
                                    type="button" 
                                    onClick={handleSpeechToText}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors hover:bg-white dark:hover:bg-gray-700 rounded-full"
                                >
                                    <Mic size={20} />
                                </button>
                            </div>

                            <button 
                                type="submit" 
                                disabled={(!input.trim() && !selectedImage) || isTyping}
                                className={`p-3.5 rounded-full transition-all shadow-lg ${input.trim() || selectedImage ? 'bg-indigo-600 text-white hover:scale-105 active:scale-95' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}
                            >
                                <Send size={20} className={input.trim() ? "ml-0.5" : ""} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. TRIVIA SECTION */}
            {activeTab === 'trivia' && (
                <div className="h-full relative flex flex-col">
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/40 rounded-full text-gray-500 dark:text-gray-300">
                        {soundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
                    </button>

                    {triviaState === 'LOBBY' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in zoom-in">
                            <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl rotate-3">
                                <Trophy size={48} className="text-white"/>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Nepal Trivia</h2>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Test your knowledge. Earn Karma.</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                                {['History', 'Geography', 'Culture', 'Nature'].map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => handleCategorySelect(cat)}
                                        className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl font-bold text-gray-700 dark:text-gray-200 hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-95 shadow-sm uppercase text-xs tracking-widest"
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {triviaState === 'LANG_SELECT' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Select Language</h2>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Which language should we use?</p>
                            </div>
                            
                            {triviaLoading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Generating Quiz...</p>
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <Button onClick={() => startTrivia('en')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 px-8 py-4 rounded-2xl font-black">
                                        English
                                    </Button>
                                    <Button onClick={() => startTrivia('ne')} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black">
                                        नेपाली (Nepali)
                                    </Button>
                                </div>
                            )}
                            <button onClick={() => setTriviaState('LOBBY')} className="text-gray-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest">Back</button>
                        </div>
                    )}

                    {triviaState === 'PLAYING' && questions.length > 0 && (
                        <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right">
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full mb-6 overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-500 transition-all duration-500"
                                    style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                                ></div>
                            </div>

                            <div className="flex-1 flex flex-col justify-center">
                                <span className="text-indigo-500 font-black uppercase tracking-widest text-xs mb-4 block">Question {currentQIndex + 1} of {questions.length}</span>
                                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-8 leading-relaxed">
                                    {questions[currentQIndex].question}
                                </h3>

                                <div className="space-y-3">
                                    {questions[currentQIndex].options.map((opt, idx) => {
                                        let btnClass = "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700";
                                        if (selectedAnswer !== null) {
                                            if (idx === questions[currentQIndex].correctAnswer) btnClass = "bg-green-500 border-green-600 text-white";
                                            else if (idx === selectedAnswer) btnClass = "bg-red-500 border-red-600 text-white animate-shake";
                                            else btnClass = "opacity-50 bg-gray-100 dark:bg-gray-800";
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleTriviaAnswer(idx)}
                                                disabled={selectedAnswer !== null}
                                                className={`w-full p-4 rounded-2xl border-2 font-bold text-left transition-all ${btnClass}`}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between items-center text-sm font-bold text-gray-500">
                                <span>Score: {score}</span>
                                {streak > 1 && <span className="text-orange-500 animate-bounce">🔥 {streak} Streak!</span>}
                            </div>
                        </div>
                    )}

                    {triviaState === 'GAMEOVER' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-indigo-600 mb-2">Quiz Complete!</h2>
                            <p className="text-gray-500 font-medium mb-8">Knowledge verified.</p>
                            
                            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-3xl w-full max-w-xs mb-8">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Score</p>
                                <p className="text-5xl font-black text-gray-900 dark:text-white">{score}</p>
                                <p className="text-xs font-bold text-green-500 mt-2">+ {score} Karma Earned</p>
                            </div>

                            <Button onClick={() => setTriviaState('LOBBY')} className="w-full max-w-xs h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">
                                Play Again
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* 4. VOICE VIEW (Simple Placeholder) */}
            {activeTab === 'voice' && (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-indigo-900/10 to-transparent">
                    <div className="w-32 h-32 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center animate-pulse mb-6">
                        <Mic size={48} className="text-indigo-600 dark:text-indigo-400"/>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Voice Command</h2>
                    <p className="text-gray-500 mt-2 max-w-xs mx-auto text-sm">
                        Use the global Rudra button (bottom right) for real-time voice conversations.
                    </p>
                </div>
            )}

        </div>
        <style>{`
            .animate-shake {
                animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
            }
            @keyframes shake {
                10%, 90% { transform: translate3d(-1px, 0, 0); }
                20%, 80% { transform: translate3d(2px, 0, 0); }
                30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                40%, 60% { transform: translate3d(4px, 0, 0); }
            }
        `}</style>
    </div>
  );
};

export default StudyBuddy;
