
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowLeft, RefreshCw, Trophy, Zap, Check, X, Timer, Activity, Flame, RotateCcw, LogOut, Award, MousePointer2, Palette } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { getRandomChallenge, Challenge } from './mentalAgilityLogic';

interface GameProps {
  onExit: () => void;
}

export const MentalAgility: React.FC<GameProps> = ({ onExit }) => {
  const [gameState, setGameState] = useState<'START' | 'PLAY' | 'OVER'>('START');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // Total game time
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [scorePulse, setScorePulse] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [shake, setShake] = useState(false);

  // Stats Tracking
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const startTimeRef = useRef<number>(0);
  const endTimeRef = useRef<number>(0);

  // Difficulty States
  const [wordRotation, setWordRotation] = useState(0);
  const [wordBlur, setWordBlur] = useState(false);

  // Timer ref for the main countdown
  const timerRef = useRef<any>(null);

  useEffect(() => {
    StorageService.getProfile().then(p => {
        if (p?.highScores?.['flexibility' as any]) setHighScore(p.highScores['flexibility' as any]);
    });
  }, []);

  // Blur clearing effect
  useEffect(() => {
    if (wordBlur) {
        const t = setTimeout(() => setWordBlur(false), 50);
        return () => clearTimeout(t);
    }
  }, [currentChallenge]);

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

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setCorrectAnswers(0);
    setTotalAttempts(0);
    setTimeLeft(60);
    setGameState('PLAY');
    setFeedback(null);
    setWordRotation(0);
    setWordBlur(false);
    setCurrentChallenge(getRandomChallenge());
    startTimeRef.current = Date.now();
  };

  // Level based on score (0-999: Lvl 0, 1000-1999: Lvl 1, etc.)
  const level = Math.floor(score / 1000);

  // Main Game Timer with Dynamic Speed
  useEffect(() => {
    if (gameState === 'PLAY') {
      // Decrease interval time as level increases (faster ticks)
      // Level 0: 1000ms, Level 1: 900ms, ... Min: 200ms
      const intervalSpeed = Math.max(200, 1000 - (level * 100));

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, intervalSpeed);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, level]);

  const handleGameOver = async () => {
    endTimeRef.current = Date.now();
    setGameState('OVER');
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Save Score
    if (score > highScore) {
        setHighScore(score);
        const p = await StorageService.getProfile();
        if (p) {
            const newScores = { ...(p.highScores || {}), flexibility: score };
            await StorageService.updateProfile({ ...p, highScores: newScores });
        }
    }
    // Update addPoints with description
    await StorageService.addPoints(Math.floor(score / 5), score, 'game_reward', 'Mental Agility Training');
  };

  const handleInput = (userSaysMatch: boolean) => {
    if (gameState !== 'PLAY' || !currentChallenge) return;

    setTotalAttempts(prev => prev + 1);
    const isCorrect = userSaysMatch === currentChallenge.isMatch;
    let newScore = score;

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      // Audio: High pitch 'blip'
      playTone(800, 'sine');

      // Visual: Green Flash (100ms)
      setFeedback('correct');
      setTimeout(() => setFeedback(null), 100);

      // Scoring: Streak Multiplier
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      const multiplier = Math.floor(newStreak / 5) + 1;
      newScore = score + (100 * multiplier);
      setScore(newScore);
      
      setScorePulse(true);
      setTimeout(() => setScorePulse(false), 300);
    } else {
      // Audio: Low pitch buzz
      playTone(150, 'sawtooth');

      // Visual: Red Flash & Shake
      setFeedback('wrong');
      setShake(true);
      setTimeout(() => {
          setFeedback(null);
          setShake(false);
      }, 400);

      // Penalties
      setStreak(0);
      newScore = Math.max(0, score - 50);
      setScore(newScore);
      setTimeLeft(prev => Math.max(0, prev - 2));
    }

    // Prepare next round visuals based on NEW score
    setTimeout(() => {
        const nextLevel = Math.floor(newScore / 1000);
        
        // Rotation (Level 1+)
        if (nextLevel >= 1) {
            setWordRotation(Math.random() * 30 - 15); // -15 to 15 degrees
        } else {
            setWordRotation(0);
        }

        // Blur (Level 2+, 30% chance)
        if (nextLevel >= 2 && Math.random() > 0.7) {
            setWordBlur(true);
        } else {
            setWordBlur(false);
        }

        setCurrentChallenge(getRandomChallenge());
    }, 150);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (gameState !== 'PLAY') return;
        if (e.key === 'ArrowLeft') handleInput(true); // Left for Match
        if (e.key === 'ArrowRight') handleInput(false); // Right for No Match
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentChallenge, score, streak]);

  // Dynamic Border Class based on feedback
  const borderClass = feedback === 'correct' 
    ? 'border-[12px] border-green-500' 
    : feedback === 'wrong' 
        ? 'border-[12px] border-red-500' 
        : 'border-0';

  const multiplier = Math.floor(streak / 5) + 1;
  const tickDuration = Math.max(200, 1000 - (level * 100)); // Sync bar transition with tick rate

  // Calculate End Stats
  const calculateStats = () => {
    const duration = (endTimeRef.current - startTimeRef.current) / 1000;
    const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
    const avgSpeed = correctAnswers > 0 ? (duration / correctAnswers).toFixed(2) : "0.00";
    
    let rank = "Novice";
    let rankColor = "text-gray-400";
    if (score >= 5000) { rank = "Grandmaster"; rankColor = "text-purple-400"; }
    else if (score >= 2500) { rank = "Master"; rankColor = "text-yellow-400"; }
    else if (score >= 1000) { rank = "Sharp"; rankColor = "text-blue-400"; }

    return { accuracy, avgSpeed, rank, rankColor };
  };

  return (
    <div className={`fixed inset-0 z-50 bg-[#121212] flex flex-col items-center justify-center select-none overflow-hidden font-sans text-white transition-all duration-75 ${borderClass}`}>
      
      {/* --- Top Bar: Countdown & Score --- */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-start z-20">
        <div className="flex flex-col gap-2 w-1/3">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
                <Timer size={14} /> Time Left
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <div 
                    className={`h-full rounded-full transition-all duration-100 ease-linear ${timeLeft < 10 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'}`} 
                    style={{ 
                        width: `${(timeLeft / 60) * 100}%`,
                        transition: `width ${tickDuration}ms linear`
                    }}
                ></div>
            </div>
        </div>

        <div className="flex flex-col items-center">
            <div className={`flex flex-col items-center transition-transform duration-100 ${scorePulse ? 'scale-125 text-yellow-400' : 'scale-100'}`}>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Score</span>
                <span className="text-4xl font-mono font-black tracking-tighter drop-shadow-lg">{score}</span>
            </div>
            {multiplier > 1 && (
                <div className="mt-1 flex items-center gap-1 text-orange-400 animate-bounce">
                    <Flame size={12} fill="currentColor" />
                    <span className="text-xs font-black uppercase tracking-widest">{multiplier}x Streak</span>
                </div>
            )}
        </div>

        <div className="w-1/3 flex justify-end">
            <button 
                onClick={onExit}
                className="bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all border border-white/10"
            >
                <X size={20} />
            </button>
        </div>
      </div>

      {/* --- Main Game Area --- */}
      <main className="w-full max-w-lg px-6 flex flex-col items-center justify-center gap-12 z-10">
        
        {gameState === 'START' && (
            <div className="bg-[#1e1e1e] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl text-center animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-purple-500/20 rounded-3xl flex items-center justify-center text-purple-400 mx-auto mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                    <Activity size={40} />
                </div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Mental Agility</h1>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                    Does the <span className="text-white font-bold">Meaning</span> match the <span className="text-white font-bold">Ink Color</span>?
                    <br/>Think fast. Don't get tricked.
                </p>
                <Button onClick={startGame} className="w-full h-16 text-xl font-black uppercase tracking-widest bg-purple-600 hover:bg-purple-700 shadow-[0_0_20px_rgba(147,51,234,0.5)] rounded-2xl">
                    Start Challenge
                </Button>
            </div>
        )}

        {gameState === 'PLAY' && currentChallenge && (
            <>
                {/* Challenge Card */}
                <div className={`relative w-full aspect-square max-w-sm bg-[#1e1e1e] rounded-[3rem] border border-white/10 flex flex-col items-center justify-center shadow-2xl transition-transform ${shake ? 'animate-shake border-red-500/50' : ''}`}>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-8">Does this match?</span>
                    
                    {/* The Word with Dynamic Scaling Effects */}
                    <div 
                        className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase"
                        style={{ 
                            color: currentChallenge.displayColor,
                            textShadow: `0 0 30px ${currentChallenge.displayColor}66`,
                            transform: `rotate(${wordRotation}deg)`,
                            filter: wordBlur ? 'blur(8px)' : 'blur(0px)',
                            transition: 'filter 0.5s ease-out, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                    >
                        {currentChallenge.displayText}
                    </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-6 w-full">
                    <button 
                        onClick={() => handleInput(true)}
                        className="group relative h-24 rounded-2xl bg-green-500/10 border-2 border-green-500 hover:bg-green-500/20 transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                    >
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-black text-green-400 uppercase italic tracking-tighter group-hover:text-green-300">MATCH</span>
                            <span className="text-[10px] font-bold text-green-600/60 uppercase tracking-widest">[ LEFT ARROW ]</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => handleInput(false)}
                        className="group relative h-24 rounded-2xl bg-red-500/10 border-2 border-red-500 hover:bg-red-500/20 transition-all active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                    >
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-black text-red-400 uppercase italic tracking-tighter group-hover:text-red-300">NOT A MATCH</span>
                            <span className="text-[10px] font-bold text-red-600/60 uppercase tracking-widest">[ RIGHT ARROW ]</span>
                        </div>
                    </button>
                </div>
            </>
        )}

        {gameState === 'OVER' && (
            <div className="bg-[#1e1e1e]/95 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/10 shadow-2xl text-center w-full max-w-md animate-in zoom-in duration-300 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-purple-600/20 blur-[60px]"></div>

                <div className="mb-8">
                    <Trophy size={64} className="text-yellow-500 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">Session Report</h2>
                </div>

                {(() => {
                    const stats = calculateStats();
                    return (
                        <div className="space-y-6 mb-10">
                            {/* Score Card */}
                            <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Total Points</span>
                                <div className="text-6xl font-mono font-black text-white mt-1">{score}</div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <MousePointer2 size={12} className="text-blue-400"/>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Accuracy</span>
                                    </div>
                                    <div className="text-2xl font-black text-blue-400">{stats.accuracy}%</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Zap size={12} className="text-green-400"/>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Top Speed</span>
                                    </div>
                                    <div className="text-2xl font-black text-green-400">{stats.avgSpeed}s</div>
                                </div>
                            </div>

                            {/* Rank */}
                            <div className="flex items-center justify-center gap-3 bg-white/5 py-3 rounded-full border border-white/10">
                                <Award size={16} className={stats.rankColor} />
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Brain Rank:</span>
                                <span className={`text-sm font-black uppercase ${stats.rankColor}`}>{stats.rank}</span>
                            </div>
                        </div>
                    );
                })()}

                <div className="flex flex-col gap-3">
                    <Button onClick={startGame} className="w-full h-16 bg-white text-black font-black uppercase text-lg rounded-[1.5rem] hover:scale-[1.02] transition-transform shadow-xl">
                        <RotateCcw size={20} className="mr-2"/> Replay
                    </Button>
                    <Button onClick={onExit} variant="ghost" className="w-full h-14 text-white/50 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-xs rounded-xl">
                        <LogOut size={16} className="mr-2"/> Return to Arcade
                    </Button>
                </div>
            </div>
        )}

      </main>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};
