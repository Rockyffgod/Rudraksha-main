
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, ArrowLeft, RefreshCw, Zap, Target, 
  Activity, ShieldCheck, Share2 
} from 'lucide-react';
import { Button } from './Button'; 
import { StorageService } from '../../services/storageService';

interface GameShellProps {
  gameId: string;
  title: string;
  onExit: () => void;
  children: (props: { onGameOver: (score: number, stats?: any) => void }) => React.ReactNode;
}

type GameState = 'intro' | 'countdown' | 'playing' | 'results';

export const GameShell: React.FC<GameShellProps> = ({ gameId, title, onExit, children }) => {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [countdown, setCountdown] = useState(3);
  const [finalScore, setFinalScore] = useState(0);
  const [gameStats, setGameStats] = useState<any>(null);
  
  // Timer Refs
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
      // Capture start time when component mounts (or effectively when game starts playing)
      // We'll set the actual start time when state changes to 'playing'
      return () => {
          // Cleanup: save duration if exiting abruptly while playing
          // Note: React's strict mode might double trigger, but storage append is safe-ish
      };
  }, []);

  // --- START SEQUENCER ---
  const startCountdown = () => {
    setGameState('countdown');
    let timer = 3;
    const interval = setInterval(() => {
      timer--;
      if (timer === 0) {
        clearInterval(interval);
        setGameState('playing');
        startTimeRef.current = Date.now();
      } else {
        setCountdown(timer);
      }
    }, 800);
  };

  const saveSessionDuration = () => {
      if (startTimeRef.current > 0) {
          const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
          if (duration > 0) {
              StorageService.saveGameSession(gameId, duration);
          }
          startTimeRef.current = 0; // Reset
      }
  };

  const handleExit = () => {
      if (gameState === 'playing') {
          saveSessionDuration();
      }
      onExit();
  };

  // --- SCORE HANDLER ---
  const handleGameOver = async (score: number, stats?: any) => {
    saveSessionDuration(); // Save time immediately on game over
    setFinalScore(score);
    setGameStats(stats);
    setGameState('results');

    try {
      const profile = await StorageService.getProfile();
      if (profile) {
        // Log transaction properly using addPoints
        await StorageService.addPoints(score, score * 2, 'game_reward', `Arcade: ${title}`);
        
        // Track high score for specific game
        const highScores = profile.highScores || {};
        if (!highScores[gameId] || score > highScores[gameId]) {
          // Manually update high score field as addPoints only handles karma/xp
          const newHighScores = { ...highScores, [gameId]: score };
          await StorageService.updateProfile({ highScores: newHighScores });
        }
      }
    } catch (err) {
      console.error("Failed to sync neural data:", err);
    }
  };

  const restartGame = () => {
    setCountdown(3);
    setFinalScore(0);
    setGameStats(null);
    startCountdown();
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden z-[100] font-sans selection:bg-indigo-500/30">
      <AnimatePresence mode="wait">
        
        {/* --- STATE: INTRO SCREEN --- */}
        {gameState === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50" />
            
            <motion.div 
              initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="relative z-10 space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">Initializing Protocol</h2>
                <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase text-white drop-shadow-2xl">
                  {title}
                </h1>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  onClick={startCountdown}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-8 rounded-2xl text-xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all hover:scale-105 active:scale-95"
                >
                  Initiate Link
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleExit}
                  className="text-slate-400 hover:text-white px-10 py-8 text-sm font-bold uppercase tracking-widest"
                >
                  Return to Hub
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* --- STATE: COUNTDOWN --- */}
        {gameState === 'countdown' && (
          <motion.div 
            key="countdown"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center bg-slate-950 z-[200]"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-9xl font-black italic text-indigo-500"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}

        {/* --- STATE: PLAYING --- */}
        {gameState === 'playing' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 relative"
          >
            {/* Inject the Game Component here */}
            {children({ onGameOver: handleGameOver })}
          </motion.div>
        )}

        {/* --- STATE: RESULTS --- */}
        {gameState === 'results' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl z-[300]"
          >
            <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl">
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
              
              <div className="text-center space-y-10 relative z-10">
                <div className="space-y-2">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-indigo-500/20 rounded-full text-indigo-400 animate-bounce">
                      <Trophy size={48} />
                    </div>
                  </div>
                  <h2 className="text-indigo-400 font-black uppercase tracking-[0.3em] text-sm">Session Complete</h2>
                  <h1 className="text-5xl font-black text-white italic tracking-tight uppercase">Performance Synced</h1>
                </div>

                {/* Score Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Neural Points</p>
                    <p className="text-4xl font-mono font-black text-white">{finalScore.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-3xl p-6 border border-white/5 text-left">
                     <div className="flex items-center gap-2 text-indigo-400 mb-1">
                        <Activity size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Precision</span>
                     </div>
                     <p className="text-2xl font-mono font-black text-white">{gameStats?.accuracy || '98'}%</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button 
                    onClick={restartGame}
                    className="flex-1 bg-white text-black hover:bg-slate-200 py-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={20} /> Re-Calibrate
                  </Button>
                  <Button 
                    onClick={handleExit}
                    variant="ghost"
                    className="flex-1 bg-white/5 text-white hover:bg-white/10 py-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={20} /> Hub
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
