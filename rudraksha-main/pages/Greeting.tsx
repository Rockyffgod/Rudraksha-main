
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { UserProfile } from '../types';
import { Logo } from '../components/ui/Logo';
import { TypewriterLoop, TextReveal } from '../components/animations/TextReveal';
import { ArrowRight, Activity, Zap } from 'lucide-react';

const Greeting: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [showWish, setShowWish] = useState(false);

  useEffect(() => {
    const init = async () => {
      const p = await StorageService.getProfile();
      if (!p) {
        navigate('/auth');
        return;
      }
      setProfile(p);
      
      // Accelerated entrance sequence for better UX
      setTimeout(() => setShowContent(true), 100);

      // Trigger wish text
      setTimeout(() => {
        setShowWish(true);
      }, 1000);

      // Reveal the button much faster so it's not "missed"
      setTimeout(() => {
        setShowInteraction(true);
      }, 2000);
    };
    init();
  }, [navigate]);

  const handleEnter = () => {
    navigate('/');
  };

  if (!profile) return null;

  const firstName = profile.name.split(' ')[0];
  
  // Time-based wish logic
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const wishText = `Wishing you a productive ${timeOfDay}.`;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black relative overflow-hidden font-sans text-white selection:bg-red-500/30 p-6">
       
       {/* High-Resolution Dynamic Background Decor - Updated to Mountain Night */}
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

       <div className={`z-10 flex flex-col items-center justify-center w-full max-w-5xl relative transition-all duration-1000 transform pb-20 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Top Status Indicators */}
          <div className="flex items-center gap-6 mb-16 px-8 py-3 rounded-full border border-white/5 animate-in fade-in slide-in-from-top-4 duration-1000">
             <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Identity Verified</span>
             </div>
             <div className="w-px h-3 bg-white/20"></div>
             <div className="flex items-center gap-2.5">
                <Activity size={12} className="text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">System Ready</span>
             </div>
          </div>

          {/* Logo Section */}
          <div className="relative mb-12 transform hover:scale-110 transition-transform duration-700 animate-in zoom-in duration-1000">
             <div className="absolute inset-0 bg-red-600 blur-[80px] opacity-20 animate-pulse"></div>
             <Logo className="w-28 h-28 md:w-48 md:h-48 relative z-10 drop-shadow-[0_0_50px_rgba(220,38,38,0.8)]" />
          </div>

          {/* Main Welcome Title */}
          <h1 className="text-4xl md:text-[5rem] font-black text-white uppercase italic tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500 text-center leading-[0.9] drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
             Welcome to <span className="text-red-500 drop-shadow-[0_0_30px_rgba(220,38,38,0.6)]">Rudraksha</span>
          </h1>

          {/* Dynamic Greeting Text - Clean (No Box) */}
          <div className="text-center w-full max-w-4xl animate-in zoom-in duration-700 mb-10">
              <div className="text-3xl md:text-6xl font-black tracking-tighter leading-tight text-white drop-shadow-[0_5px_15px_rgba(0,0,0,1)]">
                <TypewriterLoop 
                  words={[
                    `Namaste, ${firstName}`,
                    `नमस्ते, ${firstName}`,       // Nepali
                    `ज्वजलपा, ${firstName}`,      // Newari
                    `सेवारो, ${firstName}`,       // Limbu
                    `टाशी देलेक, ${firstName}`,    // Sherpa/Tibetan
                    `लसकुस, ${firstName}`,        // Newari (Welcome)
                    "Success awaits.",
                    "Let's begin."
                  ]} 
                  className="inline-block"
                  typingSpeed={70}
                  deletingSpeed={35}
                  pauseDuration={1800}
                />
              </div>
          </div>

          {/* Wish text */}
          <div className={`transition-all duration-1000 absolute bottom-36 ${showWish ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            {showWish && (
              <div className="text-lg md:text-xl font-medium text-gray-300 tracking-[0.2em] uppercase drop-shadow-md">
                  <TextReveal text={wishText} delay={0} type="stagger" className="justify-center" />
              </div>
            )}
          </div>

          {/* Interaction Button - "START DAY" */}
          <div className={`mt-8 transition-all duration-1000 transform ${showInteraction ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-16 scale-90 pointer-events-none'}`}>
             <button 
                onClick={handleEnter}
                className="group relative px-12 py-6 md:px-20 md:py-10 bg-white text-black rounded-[4rem] flex items-center gap-8 transition-all hover:scale-105 active:scale-95 shadow-[0_0_60px_rgba(255,255,255,0.3)] overflow-hidden border-4 border-transparent hover:border-red-600"
             >
                {/* Visual Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent -translate-x-full group-hover:animate-shine transition-all duration-1000"></div>
                
                <span className="relative z-10 text-2xl md:text-4xl font-black tracking-[0.3em] uppercase italic">Start Day</span>
                
                <div className="relative z-10 w-12 h-12 md:w-16 md:h-16 bg-black rounded-full flex items-center justify-center group-hover:rotate-12 transition-all shadow-xl">
                    <ArrowRight size={32} className="text-white group-hover:scale-125 transition-transform" />
                </div>
             </button>
             
             {/* Interaction Hint */}
             <div className="flex flex-col items-center mt-8 gap-3 opacity-50 animate-bounce">
                <Zap size={16} className="fill-white text-white" />
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
         .group:hover .animate-shine {
           animation: shine 1.2s infinite;
         }
       `}</style>
    </div>
  );
};

export default Greeting;
