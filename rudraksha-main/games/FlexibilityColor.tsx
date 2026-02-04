
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../components/ui/Button';
// Fix: Added missing Palette and X imports from lucide-react
import { ArrowLeft, Play, RefreshCw, Trophy, Zap, AlertCircle, Sparkles, Timer, Palette, X } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface GameProps {
  onExit: () => void;
}

const COLOR_POOL = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'GREEN', hex: '#22c55e' },
  { name: 'YELLOW', hex: '#eab308' },
  { name: 'PURPLE', hex: '#a855f7' },
  { name: 'PINK', hex: '#ec4899' },
  { name: 'CYAN', hex: '#06b6d4' }
];

interface RoundData {
  leftWord: typeof COLOR_POOL[0];
  rightWordText: typeof COLOR_POOL[0];
  rightWordInk: typeof COLOR_POOL[0];
  isMatch: boolean;
}

export const FlexibilityColor: React.FC<GameProps> = ({ onExit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [timeLeft, setTimeLeft] = useState(2000); // 2 seconds in ms
  const timerRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const loadHighScore = async () => {
      const profile = await StorageService.getProfile();
      if (profile?.highScores?.truth) setHighScore(profile.highScores.truth);
    };
    loadHighScore();
    return () => cancelAnimationFrame(timerRef.current);
  }, []);

  const playTone = (freq: number, type: OscillatorType = 'sine') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  const generateRound = useCallback(() => {
    const leftColor = COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
    const rightText = COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
    
    // 50% chance of a match
    const shouldMatch = Math.random() > 0.5;
    let rightInk;
    
    if (shouldMatch) {
      rightInk = leftColor;
    } else {
      do {
        rightInk = COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
      } while (rightInk.hex === leftColor.hex);
    }

    setCurrentRound({
      leftWord: leftColor,
      rightWordText: rightText,
      rightWordInk: rightInk,
      isMatch: shouldMatch
    });
    
    setTimeLeft(2000);
    startTimeRef.current = Date.now();
  }, []);

  const handleGameOver = useCallback(() => {
    setIsPlaying(false);
    setGameOver(true);
    playTone(150, 'sawtooth');
    
    StorageService.addPoints(Math.floor(score / 5));
    if (score > highScore) {
      setHighScore(score);
      StorageService.saveHighScore('truth', score);
    }
  }, [score, highScore]);

  const handleAnswer = (answer: boolean) => {
    if (!isPlaying || !currentRound) return;

    if (answer === currentRound.isMatch) {
      const points = 10 * (Math.floor(streak / 5) + 1);
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      playTone(600 + streak * 20);
      generateRound();
    } else {
      handleGameOver();
    }
  };

  const updateTimer = useCallback(() => {
    if (!isPlaying) return;
    
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, 2000 - elapsed);
    setTimeLeft(remaining);

    if (remaining === 0) {
      handleGameOver();
    } else {
      timerRef.current = requestAnimationFrame(updateTimer);
    }
  }, [isPlaying, handleGameOver]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = requestAnimationFrame(updateTimer);
    } else {
      cancelAnimationFrame(timerRef.current);
    }
    return () => cancelAnimationFrame(timerRef.current);
  }, [isPlaying, updateTimer]);

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setGameOver(false);
    setIsPlaying(true);
    generateRound();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleAnswer(false);
      if (e.key === 'ArrowRight') handleAnswer(true);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying, currentRound, handleAnswer]);

  return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center select-none overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05]"></div>
      </div>

      <header className="absolute top-6 w-full max-w-5xl px-6 z-50 flex justify-between items-center pointer-events-auto">
        <button 
          onClick={onExit} 
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md border border-white/10 transition-all font-black text-xs tracking-widest shadow-2xl"
        >
          <ArrowLeft size={18} /> EXIT
        </button>

        {isPlaying && (
          <div className="flex gap-4">
              <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 text-white flex flex-col items-center min-w-[120px] shadow-2xl">
                <span className="text-[9px] font-black text-pink-400 uppercase tracking-[0.2em] mb-1">Score</span>
                <span className="font-mono font-black text-3xl tabular-nums">{score}</span>
              </div>
              <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 text-white flex flex-col items-center min-w-[100px] shadow-2xl">
                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-1">Streak</span>
                <span className="font-mono font-black text-3xl tabular-nums">x{streak}</span>
              </div>
          </div>
        )}
      </header>

      <main className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center justify-center">
        {!isPlaying && !gameOver && (
          <div className="bg-white/5 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/10 text-center max-w-lg shadow-2xl animate-in zoom-in duration-700">
            {/* Fix: Usage of Palette resolved by adding it to imports */}
            <div className="w-24 h-24 bg-pink-600/20 rounded-[2rem] flex items-center justify-center text-pink-500 mb-8 border border-pink-500/30 mx-auto">
              <Palette size={56} className="animate-pulse" />
            </div>
            <h2 className="text-6xl font-black italic tracking-tighter text-white mb-6 uppercase">Flexibility</h2>
            <p className="text-gray-400 text-lg font-medium mb-12 leading-relaxed">
              Does the <span className="text-white font-bold">Meaning</span> of the left word match the <span className="text-white font-bold">Ink Color</span> of the right word?
            </p>
            <Button onClick={startGame} className="bg-pink-600 hover:bg-pink-700 text-2xl px-16 py-8 rounded-[2rem] font-black shadow-2xl shadow-pink-600/40 w-full transition-transform active:scale-95">
              SYNC NEURONS
            </Button>
            <div className="mt-8 flex justify-center gap-6 opacity-40">
                <div className="flex items-center gap-2 text-xs font-black text-white uppercase"><Zap size={14}/> Fast</div>
                <div className="flex items-center gap-2 text-xs font-black text-white uppercase"><Timer size={14}/> 2.0s</div>
            </div>
          </div>
        )}

        {isPlaying && currentRound && (
          <div className="w-full flex flex-col items-center gap-12">
            {/* Timer Bar */}
            <div className="w-full max-w-2xl h-4 bg-gray-900 rounded-full overflow-hidden border border-white/10 p-1 shadow-inner">
                <div 
                    className={`h-full rounded-full transition-all duration-100 ease-linear ${timeLeft < 500 ? 'bg-red-500 shadow-[0_0_15px_#ef4444]' : 'bg-cyan-500 shadow-[0_0_15px_#06b6d4]'}`}
                    style={{ width: `${(timeLeft / 2000) * 100}%` }}
                ></div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-center">
              {/* Left Card: Meaning */}
              <div className="w-full max-w-[320px] h-64 bg-white/5 border-2 border-white/10 rounded-[3rem] flex flex-col items-center justify-center shadow-2xl group transition-all duration-300">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4">Literal Meaning</span>
                <div className="text-6xl font-black italic tracking-tighter text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  {currentRound.leftWord.name}
                </div>
              </div>

              <div className="hidden md:flex items-center justify-center w-12 h-12 bg-white/10 rounded-full border border-white/20">
                 <span className="text-white font-black">?</span>
              </div>

              {/* Right Card: Ink Color */}
              <div className="w-full max-w-[320px] h-64 bg-white/5 border-2 border-white/10 rounded-[3rem] flex flex-col items-center justify-center shadow-2xl group transition-all duration-300">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4">Ink Presentation</span>
                <div 
                  className="text-6xl font-black italic tracking-tighter uppercase transition-colors duration-200"
                  style={{ color: currentRound.rightWordInk.hex, filter: `drop-shadow(0 0 15px ${currentRound.rightWordInk.hex}88)` }}
                >
                  {currentRound.rightWordText.name}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full max-w-2xl mt-4">
                <button 
                    onClick={() => handleAnswer(false)}
                    className="group flex flex-col items-center gap-4 p-8 bg-red-600/10 border-2 border-red-500/30 rounded-[2.5rem] hover:bg-red-500/20 hover:border-red-500 transition-all active:scale-95 shadow-xl"
                >
                    {/* Fix: Usage of X resolved by adding it to imports */}
                    <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <X size={40} strokeWidth={3} />
                    </div>
                    <span className="font-black text-2xl text-white uppercase italic tracking-tighter">NO [←]</span>
                </button>

                <button 
                    onClick={() => handleAnswer(true)}
                    className="group flex flex-col items-center gap-4 p-8 bg-green-600/10 border-2 border-green-500/30 rounded-[2.5rem] hover:bg-green-500/20 hover:border-green-500 transition-all active:scale-95 shadow-xl"
                >
                    <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <Check size={40} strokeWidth={3} />
                    </div>
                    <span className="font-black text-2xl text-white uppercase italic tracking-tighter">YES [→]</span>
                </button>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="bg-red-950/90 backdrop-blur-xl p-12 rounded-[3.5rem] border border-red-500/30 text-center max-w-lg shadow-2xl animate-in zoom-in duration-300">
            <AlertCircle size={80} className="text-red-500 mb-8 mx-auto animate-bounce" />
            <h2 className="text-7xl font-black text-white tracking-tighter mb-4 italic uppercase">Mismatched</h2>
            <p className="text-red-200/60 font-black uppercase tracking-widest text-xs mb-8">Neural link severed due to logic error.</p>
            
            <div className="bg-black/40 px-12 py-8 rounded-[2.5rem] border border-white/10 mb-12">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Final Cognitive Score</p>
              <p className="text-7xl font-mono font-black text-yellow-400">{score}</p>
            </div>

            <div className="flex flex-col gap-4">
              <Button onClick={startGame} className="bg-white text-gray-900 font-black px-12 py-7 text-2xl rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 hover:scale-105 transition-transform">
                <RefreshCw size={28}/> REBOOT LOGIC
              </Button>
              <button onClick={onExit} className="text-white/40 hover:text-white text-xs font-black uppercase tracking-widest py-4">Return to Arcade</button>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 flex gap-8 pointer-events-none opacity-40">
        <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest">
           <Sparkles size={14} className="text-pink-400" /> Stroop Protocol
        </div>
        <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest">
           <Trophy size={14} className="text-yellow-500" /> Efficiency Rank
        </div>
      </footer>
    </div>
  );
};

// Helper Check icon (X is imported from Lucide)
const Check = ({ size, className, strokeWidth }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);
