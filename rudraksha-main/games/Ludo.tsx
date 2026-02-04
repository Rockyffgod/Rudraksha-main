
import React from 'react';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Dice5, Construction } from 'lucide-react';

interface GameProps {
  onExit: () => void;
}

export const Ludo: React.FC<GameProps> = ({ onExit }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center select-none overflow-hidden font-sans">
        
        <div className="absolute top-6 left-6 z-50">
            <button 
                onClick={onExit} 
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md border border-white/10 transition-all font-black text-xs tracking-widest shadow-2xl"
            >
                <ArrowLeft size={18} /> EXIT
            </button>
        </div>

        <div className="relative z-10 p-12 text-center max-w-2xl animate-in zoom-in duration-700">
            <div className="w-32 h-32 bg-yellow-500/20 rounded-[2.5rem] flex items-center justify-center text-yellow-500 mb-10 border border-yellow-500/30 mx-auto shadow-[0_0_60px_rgba(234,179,8,0.3)]">
              <Dice5 size={64} className="animate-spin-slow" />
            </div>
            
            <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-6 uppercase drop-shadow-2xl">
                LUDO KING
            </h2>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-full inline-flex items-center gap-3 mb-8">
                <Construction size={18} className="text-blue-400"/>
                <span className="text-sm font-black uppercase tracking-[0.2em] text-gray-300">Data Pending</span>
            </div>

            <p className="text-gray-400 text-xl font-medium leading-relaxed max-w-lg mx-auto">
                The classic board game is currently being digitized. Multiplayer protocols initializing...
            </p>
        </div>
    </div>
  );
};
