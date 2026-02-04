
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Play, RefreshCw, Trophy, Lightbulb, Zap, AlertTriangle, Cpu, Timer, ShieldAlert } from 'lucide-react';
import { StorageService } from '../services/storageService';
import confetti from 'canvas-confetti';

interface GameProps {
  onExit: () => void;
}

type LogicPattern = 'arithmetic' | 'geometric' | 'alternating' | 'squares';

interface SequenceData {
  sequence: (number | string)[];
  answer: number;
  options: number[];
  explanation: string;
}

export const LogicFuses: React.FC<GameProps> = ({ onExit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentRound, setCurrentRound] = useState<SequenceData | null>(null);
  const [timeLeft, setTimeLeft] = useState(15000); // 15 seconds
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
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

  const playTone = (freq: number, type: OscillatorType = 'sine', duration = 0.1) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const generateRound = useCallback(() => {
    const types: LogicPattern[] = ['arithmetic', 'geometric', 'alternating', 'squares'];
    const type = types[Math.floor(Math.random() * types.length)];
    let seq: number[] = [];
    let answer = 0;
    let explanation = "";

    if (type === 'arithmetic') {
      const start = Math.floor(Math.random() * 20);
      const diff = Math.floor(Math.random() * 10) + 2;
      seq = [0, 1, 2, 3, 4].map(i => start + i * diff);
      explanation = `Add ${diff} to each number.`;
    } else if (type === 'geometric') {
      const start = Math.floor(Math.random() * 5) + 1;
      const ratio = Math.floor(Math.random() * 2) + 2; // 2 or 3
      seq = [0, 1, 2, 3, 4].map(i => start * Math.pow(ratio, i));
      explanation = `Multiply by ${ratio} each time.`;
    } else if (type === 'alternating') {
      const start = Math.floor(Math.random() * 10);
      const d1 = Math.floor(Math.random() * 5) + 1;
      const d2 = Math.floor(Math.random() * 5) + 1;
      let curr = start;
      for (let i = 0; i < 5; i++) {
        seq.push(curr);
        curr += (i % 2 === 0) ? d1 : d2;
      }
      explanation = `Alternating additions of ${d1} and ${d2}.`;
    } else {
      const start = Math.floor(Math.random() * 5) + 1;
      seq = [0, 1, 2, 3, 4].map(i => Math.pow(start + i, 2));
      explanation = "Sequence of squares.";
    }

    const missingIdx = Math.floor(Math.random() * 3) + 1; // Don't hide first or last usually
    answer = seq[missingIdx];
    const displaySeq: (number | string)[] = [...seq];
    displaySeq[missingIdx] = "?";

    // Generate options
    const options = new Set<number>();
    options.add(answer);
    while (options.size < 4) {
      const offset = (Math.floor(Math.random() * 10) + 1) * (Math.random() > 0.5 ? 1 : -1);
      const fake = Math.max(0, answer + offset);
      if (fake !== answer) options.add(fake);
    }

    setCurrentRound({
      sequence: displaySeq,
      answer,
      options: Array.from(options).sort((a, b) => a - b),
      explanation
    });

    setIsCorrect(null);
    setTimeLeft(15000);
    startTimeRef.current = Date.now();
  }, []);

  const handleGameOver = useCallback(() => {
    setIsPlaying(false);
    setGameOver(true);
    playTone(100, 'sawtooth', 0.5);
    
    const karmaEarned = Math.floor(score / 50);
    // Add transaction description
    StorageService.addPoints(karmaEarned, score, 'game_reward', 'Logic Fuses Session');
    if (score > highScore) {
      setHighScore(score);
      StorageService.saveHighScore('truth', score); // Reusing truth slot
    }
  }, [score, highScore]);

  const handleAnswer = (val: number) => {
    if (!isPlaying || !currentRound || isCorrect !== null) return;

    if (val === currentRound.answer) {
      setIsCorrect(true);
      const timeBonus = Math.floor(timeLeft / 100);
      setScore(prev => prev + 100 + timeBonus);
      playTone(800, 'sine', 0.1);
      
      setTimeout(() => {
        generateRound();
      }, 600);
    } else {
      setIsCorrect(false);
      handleGameOver();
    }
  };

  const updateTimer = useCallback(() => {
    if (!isPlaying || isCorrect !== null) return;
    
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, 15000 - elapsed);
    setTimeLeft(remaining);

    if (remaining === 0) {
      handleGameOver();
    } else {
      timerRef.current = requestAnimationFrame(updateTimer);
    }
  }, [isPlaying, isCorrect, handleGameOver]);

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
    setGameOver(false);
    setIsPlaying(true);
    generateRound();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center select-none overflow-hidden font-sans">
      {/* Background Decor - Industrial Theme */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#334155,transparent)] opacity-30"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.1]"></div>
        {/* Animated Bolts/Grid */}
        <div className="grid grid-cols-6 grid-rows-6 w-full h-full opacity-10">
            {[...Array(36)].map((_, i) => (
                <div key={i} className="border border-white/10 flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
            ))}
        </div>
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
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em] mb-1">Score</span>
                <span className="font-mono font-black text-3xl tabular-nums text-amber-500">{score}</span>
              </div>
          </div>
        )}
      </header>

      <main className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center justify-center">
        {!isPlaying && !gameOver && (
          <div className="bg-slate-800/80 backdrop-blur-xl p-12 rounded-[3.5rem] border-4 border-slate-700 text-center max-w-lg shadow-2xl animate-in zoom-in duration-700">
            <div className="w-24 h-24 bg-amber-600/20 rounded-[2rem] flex items-center justify-center text-amber-500 mb-8 border border-amber-500/30 mx-auto">
              <Cpu size={56} className="animate-pulse" />
            </div>
            <h2 className="text-6xl font-black italic tracking-tighter text-white mb-6 uppercase">Logic Fuses</h2>
            <p className="text-gray-400 text-lg font-medium mb-12 leading-relaxed">
              Analyze the numerical current. Identify the pattern and <span className="text-amber-500 font-bold">replace the missing fuse</span> before the system overloads.
            </p>
            <Button onClick={startGame} className="bg-amber-600 hover:bg-amber-700 text-2xl px-16 py-8 rounded-[2rem] font-black shadow-2xl shadow-amber-600/40 w-full transition-transform active:scale-95">
              ENGAGE CIRCUITS
            </Button>
            <div className="mt-8 flex justify-center gap-6 opacity-40">
                <div className="flex items-center gap-2 text-xs font-black text-white uppercase"><Zap size={14}/> Pattern Recognition</div>
                <div className="flex items-center gap-2 text-xs font-black text-white uppercase"><Timer size={14}/> 15.0s</div>
            </div>
          </div>
        )}

        {isPlaying && currentRound && (
          <div className="w-full flex flex-col items-center gap-12">
            {/* Electrical Panel Container */}
            <div className="bg-slate-900 border-[10px] border-slate-800 rounded-[4rem] p-10 md:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.6)] w-full max-w-4xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] pointer-events-none"></div>
                
                {/* Timer LED Bar */}
                <div className="mb-12 space-y-3">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Zap size={12} className="animate-pulse"/> Voltage Stability</span>
                        <span className="font-mono text-sm font-black text-amber-500">{(timeLeft/1000).toFixed(1)}V</span>
                    </div>
                    <div className="w-full h-6 bg-black rounded-full overflow-hidden border-2 border-slate-700 p-1 flex gap-1">
                        {[...Array(20)].map((_, i) => {
                            const percentage = (timeLeft / 15000) * 100;
                            const isActive = (i / 20) * 100 < percentage;
                            return (
                                <div 
                                    key={i} 
                                    className={`h-full flex-1 rounded-sm transition-all duration-300 ${isActive ? (percentage < 30 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]') : 'bg-slate-900'}`}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Number Display Grid */}
                <div className="grid grid-cols-5 gap-4 md:gap-8 mb-16">
                    {currentRound.sequence.map((num, i) => (
                        <div 
                            key={i}
                            className={`
                                aspect-square rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center border-4 shadow-inner transition-all duration-500
                                ${num === '?' 
                                    ? 'bg-black border-amber-500/50 text-amber-500 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                                    : 'bg-slate-800 border-slate-700 text-white font-mono text-3xl md:text-5xl font-black'}
                                ${isCorrect === true && num === '?' ? 'bg-green-600/20 border-green-500 text-green-500' : ''}
                            `}
                        >
                            {num === '?' && isCorrect === true ? currentRound.answer : num}
                        </div>
                    ))}
                </div>

                {/* Option Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentRound.options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => handleAnswer(opt)}
                            disabled={isCorrect !== null}
                            className={`
                                h-24 rounded-3xl font-mono text-3xl font-black transition-all active:scale-95 border-b-8
                                ${isCorrect === null 
                                    ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-900 hover:-translate-y-1' 
                                    : opt === currentRound.answer 
                                        ? 'bg-green-600 text-white border-green-800' 
                                        : 'bg-red-600 text-white border-red-800 opacity-50'}
                            `}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                {/* Industrial Labels */}
                <div className="mt-10 flex justify-between items-center opacity-30 px-4">
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.5em]">System-ID: LOGIC_CORE_V3</span>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                </div>
            </div>
            
            <p className="text-gray-500 font-black uppercase tracking-[0.4em] animate-pulse">Select the Missing Key</p>
          </div>
        )}

        {gameOver && (
          <div className="bg-red-950/90 backdrop-blur-xl p-12 rounded-[3.5rem] border-4 border-red-500/30 text-center max-w-lg shadow-2xl animate-in zoom-in duration-300">
            <AlertTriangle size={80} className="text-red-500 mb-8 mx-auto animate-bounce" />
            <h2 className="text-7xl font-black text-white tracking-tighter mb-4 italic uppercase">Overload</h2>
            <p className="text-red-200/60 font-black uppercase tracking-widest text-xs mb-8">System synchronization failed due to pattern error.</p>
            
            <div className="bg-black/40 px-12 py-8 rounded-[2.5rem] border border-white/10 mb-8">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Last Valid Round Pattern</p>
                <p className="text-sm font-bold text-amber-500 uppercase tracking-widest">{currentRound?.explanation}</p>
            </div>

            <div className="bg-black/40 px-12 py-8 rounded-[2.5rem] border border-white/10 mb-12">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Final Intelligence Units</p>
              <p className="text-7xl font-mono font-black text-yellow-400">{score}</p>
            </div>

            <div className="flex flex-col gap-4">
              <Button onClick={startGame} className="bg-white text-slate-900 font-black px-12 py-7 text-2xl rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 hover:scale-105 transition-transform">
                <RefreshCw size={28}/> RESTORE POWER
              </Button>
              <button onClick={onExit} className="text-white/40 hover:text-white text-xs font-black uppercase tracking-widest py-4">Deactivate Terminal</button>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 flex gap-8 pointer-events-none opacity-40">
        <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest">
           <Cpu size={14} className="text-amber-500" /> Neural Processing
        </div>
        <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest">
           <ShieldAlert size={14} className="text-red-500" /> Core Stability
        </div>
      </footer>
    </div>
  );
};
