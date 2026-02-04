
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TypewriterLoop } from '../components/animations/TextReveal';
import { ArrowRight, Sparkles, MousePointer2 } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black relative overflow-hidden font-sans text-white selection:bg-red-500/30 p-6">
       
       {/* High-Resolution Dynamic Background Decor - Mountain Night (Same as Greeting) */}
       <div 
         className="absolute inset-0 bg-cover bg-center opacity-70"
         style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=2400&auto=format&fit=crop')" }}
       ></div>
       
       {/* Overlays - Darker for text legibility without boxes */}
       <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90"></div>
       <div className="absolute inset-0 bg-black/20"></div>

       {/* Massive Background Logo Watermark */}
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.05]">
          <Logo className="w-[120vh] h-[120vh] animate-bg-pulse" />
       </div>

       {/* Main Content */}
       <div className="z-10 flex flex-col items-center justify-center w-full max-w-5xl relative pb-20">
        
        <div className="mb-12 animate-in zoom-in duration-1000 flex flex-col items-center gap-6">
           {/* Interactive Logo Container */}
           <div 
             onClick={handleStart}
             className="w-40 h-40 md:w-56 md:h-56 flex items-center justify-center relative group cursor-pointer active:scale-95 transition-all duration-500"
           >
             <div className="absolute inset-0 bg-red-600 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all animate-pulse"></div>
             <Logo className="w-full h-full relative z-10 drop-shadow-[0_0_50px_rgba(220,38,38,0.6)] group-hover:drop-shadow-[0_0_80px_rgba(220,38,38,0.9)] transition-all" />
             
             {/* Visual Cue for interaction */}
             <div className="absolute -bottom-6 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 shadow-xl">
                <MousePointer2 size={14} className="text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Tap to Start</span>
             </div>
           </div>
           
           <p className="text-red-500 font-black text-xs md:text-sm tracking-[0.6em] uppercase animate-in fade-in slide-in-from-top-4 duration-1000 flex items-center justify-center gap-3">
                <Sparkles size={16} /> Heritage in High Definition
           </p>
        </div>

        <div className="text-center w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-1000 mb-12">
            {/* Clean Typography without glassy box */}
            <h1 className="text-6xl md:text-[7rem] font-black tracking-tighter text-white text-center flex items-center justify-center drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] uppercase leading-none min-h-[1.2em]">
                <TypewriterLoop 
                words={[
                    "नमस्ते",       
                    "Welcome",      
                    "ज्वजलपा",      
                    "सेवारो",       
                    "टाशी देलेक",    
                    "लसकुस"        
                ]} 
                typingSpeed={80}
                deletingSpeed={40}
                className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400"
                />
            </h1>
            <p className="text-gray-300 text-lg md:text-2xl font-bold text-center mt-6 leading-relaxed drop-shadow-md tracking-wide">
              The Ultimate Nepali Companion for <span className="text-red-500 font-black uppercase">Culture</span>, <span className="text-blue-400 font-black uppercase">Health</span>, and <span className="text-white font-black uppercase">Excellence</span>.
            </p>
        </div>

        <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 flex flex-col items-center gap-8">
            <button 
            onClick={handleStart} 
            className="group relative w-full h-20 md:h-24 bg-white text-black rounded-[4rem] flex items-center justify-center gap-8 overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_60px_rgba(255,255,255,0.2)] border-4 border-transparent hover:border-red-600"
            >
                {/* Visual Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent -translate-x-full group-hover:animate-shine transition-all duration-1000"></div>
                
                <span className="relative z-10 text-3xl md:text-4xl font-black uppercase tracking-[0.2em] italic">Enter</span> 
                
                <div className="relative z-10 w-12 h-12 md:w-16 md:h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:rotate-12 transition-all shadow-xl">
                    <ArrowRight size={32} className="text-white group-hover:scale-125 transition-transform" />
                </div>
            </button>
            
            <div className="flex flex-col items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">
                    PROJECT RUDRAKSHA • v3.0
                </p>
            </div>
        </div>

       </div>

       <style>{`
         @keyframes shine {
           0% { transform: translateX(-100%); }
           100% { transform: translateX(100%); }
         }
         @keyframes bg-pulse {
           0%, 100% { opacity: 0.05; transform: scale(1); }
           50% { opacity: 0.1; transform: scale(1.05); }
         }
         .animate-bg-pulse {
           animation: bg-pulse 12s ease-in-out infinite;
         }
       `}</style>
    </div>
  );
};

export default Welcome;
