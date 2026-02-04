
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Play, RefreshCw, Trophy, Sparkles, Hexagon, Volume2, VolumeX } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface GameProps {
  onExit: () => void;
}

export const MandalaMind: React.FC<GameProps> = ({ onExit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [message, setMessage] = useState("Watch & Remember");
  const [audioEnabled, setAudioEnabled] = useState(true);

  const colors = [
    { 
        id: 0, 
        baseColor: 'bg-red-600', 
        glowColor: 'shadow-[0_0_60px_rgba(239,68,68,0.9)] ring-4 ring-red-400/50', 
        activeColor: 'bg-red-400',
        shape: 'rounded-tl-[100px] rounded-br-[20px] rounded-tr-[20px] rounded-bl-[20px]',
        note: 261.63 
    },
    { 
        id: 1, 
        baseColor: 'bg-blue-600', 
        glowColor: 'shadow-[0_0_60px_rgba(59,130,246,0.9)] ring-4 ring-blue-400/50', 
        activeColor: 'bg-blue-400',
        shape: 'rounded-tr-[100px] rounded-bl-[20px] rounded-tl-[20px] rounded-br-[20px]',
        note: 329.63 
    },
    { 
        id: 2, 
        baseColor: 'bg-green-600', 
        glowColor: 'shadow-[0_0_60px_rgba(34,197,94,0.9)] ring-4 ring-green-400/50', 
        activeColor: 'bg-green-400',
        shape: 'rounded-bl-[100px] rounded-tr-[20px] rounded-tl-[20px] rounded-br-[20px]',
        note: 392.00 
    },
    { 
        id: 3, 
        baseColor: 'bg-yellow-500', 
        glowColor: 'shadow-[0_0_60px_rgba(234,179,8,0.9)] ring-4 ring-yellow-400/50', 
        activeColor: 'bg-yellow-300',
        shape: 'rounded-br-[100px] rounded-tl-[20px] rounded-tr-[20px] rounded-bl-[20px]',
        note: 523.25 
    },
  ];

  useEffect(() => {
    const loadHighScore = async () => {
        const profile = await StorageService.getProfile();
        if (profile?.highScores?.mandala) {
            setHighScore(profile.highScores.mandala);
        }
    };
    loadHighScore();
  }, []);

  const playTone = (freq: number) => {
    if (!audioEnabled) return;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio error", e);
    }
  };

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setSequence([]);
    setUserSequence([]);
    setMessage("Watch closely...");
    addToSequence([]);
  };

  const addToSequence = (currentSeq: number[]) => {
    const nextColor = Math.floor(Math.random() * 4);
    const newSeq = [...currentSeq, nextColor];
    setSequence(newSeq);
    setUserSequence([]);
    setIsShowingSequence(true);
    
    const baseSpeed = 800;
    const speed = Math.max(300, baseSpeed - (newSeq.length * 40));
    
    setTimeout(() => playSequence(newSeq, speed), 1000);
  };

  const playSequence = async (seq: number[], speed: number) => {
    for (let i = 0; i < seq.length; i++) {
      setActiveSegment(seq[i]);
      playTone(colors[seq[i]].note);
      await new Promise(r => setTimeout(r, speed * 0.6));
      setActiveSegment(null);
      await new Promise(r => setTimeout(r, speed * 0.4));
    }
    setIsShowingSequence(false);
    setMessage("Repeat the pattern!");
  };

  const handleSegmentClick = (id: number) => {
    if (!isPlaying || isShowingSequence || gameOver) return;

    setActiveSegment(id);
    playTone(colors[id].note);
    setTimeout(() => setActiveSegment(null), 200);

    const newUserSeq = [...userSequence, id];
    setUserSequence(newUserSeq);

    if (newUserSeq[newUserSeq.length - 1] !== sequence[newUserSeq.length - 1]) {
      playTone(150);
      setGameOver(true);
      setIsPlaying(false);
      
      if (score > highScore) {
          setHighScore(score);
      }
      StorageService.saveHighScore('mandala', score);
      StorageService.addPoints(Math.floor(score / 2), score * 2, 'game_reward', 'Mandala Mind Synchronization');
      return;
    }

    if (newUserSeq.length === sequence.length) {
      const newScore = score + 1;
      setScore(newScore);
      setMessage("Correct!");
      setIsShowingSequence(true);
      setTimeout(() => {
        addToSequence(sequence);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center overflow-hidden select-none font-sans">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0f172a] to-[#0f172a]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-10 animate-pulse-slow"></div>
        <div className={`absolute inset-0 bg-red-500/10 mix-blend-overlay transition-opacity duration-300 ${gameOver ? 'opacity-100' : 'opacity-0'}`}></div>
        
        {/* Top Controls */}
        <div className="absolute top-6 left-6 z-20 flex gap-4 w-full px-6 justify-between items-start pointer-events-none">
            <button 
                onClick={onExit} 
                className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95 font-bold text-sm shadow-xl group"
            >
                <div className="bg-white/20 p-1 rounded-full group-hover:bg-purple-500 transition-colors">
                    <ArrowLeft size={16} />
                </div>
                EXIT
            </button>
            <button 
              onClick={() => setAudioEnabled(!audioEnabled)} 
              className="pointer-events-auto p-3 rounded-full bg-black/40 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10"
            >
                {audioEnabled ? <Volume2 size={20}/> : <VolumeX size={20}/>}
            </button>
        </div>

        <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
            <div className="mb-10 text-center animate-in slide-in-from-top-8 duration-700">
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 mb-2 filter drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] tracking-tighter">MANDALA</h1>
                <p className="text-indigo-200/60 font-mono text-xs tracking-[0.3em] uppercase">Memory Synchronization</p>
            </div>

            <div className="relative w-80 h-80 sm:w-[420px] sm:h-[420px] perspective-1000">
                {/* Rotating Rings */}
                <div className={`absolute inset-[-60px] rounded-full border border-indigo-500/10 border-dashed animate-[spin_60s_linear_infinite] pointer-events-none ${isPlaying ? 'opacity-100' : 'opacity-20'}`}></div>
                <div className={`absolute inset-[-30px] rounded-full border-2 border-purple-500/20 animate-[spin_40s_linear_infinite_reverse] pointer-events-none ${isPlaying ? 'opacity-100' : 'opacity-20'}`}></div>
                
                {/* The Flower Grid */}
                <div className="absolute inset-0 grid grid-cols-2 gap-6 p-4 rotate-45 transform transition-transform duration-700">
                    {colors.map((c) => (
                        <button
                            key={c.id}
                            onMouseDown={() => handleSegmentClick(c.id)}
                            onTouchStart={(e) => { e.preventDefault(); handleSegmentClick(c.id); }}
                            className={`
                                relative transition-all duration-150 transform
                                ${c.shape}
                                ${activeSegment === c.id 
                                    ? `${c.activeColor} ${c.glowColor} scale-105 z-10 brightness-110` 
                                    : `${c.baseColor} opacity-80 hover:opacity-100 hover:brightness-110 hover:scale-[1.02]`}
                                ${!isPlaying && !gameOver ? 'cursor-default opacity-30 grayscale' : ''}
                                shadow-2xl border-b-4 border-black/20 overflow-hidden
                            `}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
                            {activeSegment === c.id && <div className="absolute inset-0 bg-white/40 animate-ping"></div>}
                        </button>
                    ))}
                </div>

                {/* Center Hub */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="w-28 h-28 bg-gray-900 rounded-full border-[8px] border-gray-800 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-black"></div>
                        {isPlaying && <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-pulse"></div>}
                        
                        {isPlaying ? (
                            <div className="text-center animate-in zoom-in relative z-10">
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-[-2px]">Score</p>
                                <p className="text-4xl font-mono text-white font-black tracking-tighter">{score}</p>
                            </div>
                        ) : (
                            <div className="text-gray-700 animate-pulse relative z-10">
                                <Hexagon size={48} strokeWidth={1} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-16 h-32 flex flex-col items-center justify-center w-full">
                {!isPlaying && !gameOver && (
                    <Button onClick={startGame} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-12 py-5 rounded-full text-xl font-black tracking-wide shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all hover:scale-105 active:scale-95 group border border-white/10">
                        <Play size={24} className="mr-3 fill-white group-hover:scale-110 transition-transform" /> START GAME
                    </Button>
                )}
                
                {isPlaying && (
                    <div className="text-center">
                        <p className={`text-2xl font-bold tracking-widest transition-all duration-300 uppercase ${isShowingSequence ? 'text-indigo-300 animate-pulse' : 'text-green-400 scale-110'}`}>
                            {message}
                        </p>
                        <div className="flex gap-2 justify-center mt-4">
                            {[0,1,2].map(i => (
                                <span key={i} className={`w-2 h-2 rounded-full ${isShowingSequence ? 'bg-indigo-500 animate-bounce' : 'bg-gray-800'}`} style={{ animationDelay: `${i*100}ms` }}></span>
                            ))}
                        </div>
                    </div>
                )}

                {gameOver && (
                    <div className="text-center animate-in zoom-in duration-300 w-full max-w-sm bg-gray-900/90 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <p className="text-red-500 font-black text-5xl mb-2 drop-shadow-md tracking-tighter">GAME OVER</p>
                        
                        <div className="flex justify-between items-center my-6 px-6 py-3 bg-black/40 rounded-2xl border border-white/5">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Final Score</span>
                            <span className="text-white font-mono text-3xl font-black">{score}</span>
                        </div>
                        
                        <Button onClick={startGame} className="w-full bg-white text-gray-900 hover:bg-gray-200 font-black py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform">
                            <RefreshCw size={20} className="mr-2"/> TRY AGAIN
                        </Button>
                    </div>
                )}
            </div>
            
            {!isPlaying && !gameOver && (
                <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 shadow-lg">
                    <Trophy size={18} className="text-yellow-500" />
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Personal Best</span>
                    <span className="text-xl font-mono text-white font-black">{highScore}</span>
                </div>
            )}
        </div>
    </div>
  );
};
