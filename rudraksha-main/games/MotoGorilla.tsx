
import React from 'react';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Rocket, Construction } from 'lucide-react';

interface GameProps {
  onExit: () => void;
}

export const MotoGorilla: React.FC<GameProps> = ({ onExit }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center select-none overflow-hidden font-sans">
        
        <div className="absolute top-6 left-6 z-50">
            <button 
                onClick={onExit} 
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md border border-white/10 transition-all font-black text-xs tracking-widest shadow-2xl"
            >
                <ArrowLeft size={18} /> EXIT
            </button>
        </div>

        <div className="relative z-10 p-12 text-center max-w-2xl animate-in zoom-in duration-700">
            <div className="w-32 h-32 bg-pink-500/20 rounded-[2.5rem] flex items-center justify-center text-pink-500 mb-10 border border-pink-500/30 mx-auto shadow-[0_0_60px_rgba(236,72,153,0.3)]">
              <Rocket size={64} className="animate-bounce" />
            </div>
            
            <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-6 uppercase drop-shadow-2xl">
                FUN GAME
            </h2>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-full inline-flex items-center gap-3 mb-8">
                <Construction size={18} className="text-yellow-400"/>
                <span className="text-sm font-black uppercase tracking-[0.2em] text-gray-300">Under Construction</span>
            </div>

            <p className="text-gray-400 text-xl font-medium leading-relaxed max-w-lg mx-auto">
                We are crafting a new experience. Check back soon for the ultimate fun protocol.
            </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-600/5 rounded-full blur-[150px] pointer-events-none"></div>
    </div>
  );
};
