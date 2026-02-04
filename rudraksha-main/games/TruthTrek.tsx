
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Play, RefreshCw, Trophy } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface GameProps {
  onExit: () => void;
}

export const TruthTrek: React.FC<GameProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const MASTER_QUESTIONS = [
    { question: "2 + 2 = 4", answer: true, trueLabel: "True", falseLabel: "False" },
    { question: "Nepal is in Europe", answer: false, trueLabel: "True", falseLabel: "False" },
    { question: "Water boils at 100°C", answer: true, trueLabel: "True", falseLabel: "False" },
    { question: "The Earth is flat", answer: false, trueLabel: "True", falseLabel: "False" },
    { question: "Sagarmatha is 8848m", answer: true, trueLabel: "True", falseLabel: "False" },
    { question: "Zebra is a fish", answer: false, trueLabel: "True", falseLabel: "False" }
  ];

  const gameState = useRef({
    lane: 0, gates: [] as any[], particles: [] as any[], torches: [] as any[],
    speed: 3, score: 0, frameCount: 0, isDying: false
  });

  const requestRef = useRef<number>(0);

  useEffect(() => {
    const loadHighScore = async () => {
        const profile = await StorageService.getProfile();
        if (profile?.highScores?.truth) {
            setHighScore(profile.highScores.truth);
        }
    };
    loadHighScore();
    
    for(let i=0; i<10; i++) gameState.current.torches.push({y: i*100, frame: Math.random()*100});
    
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const startGame = () => {
    cancelAnimationFrame(requestRef.current);
    setIsPlaying(true); setGameOver(false); setScore(0);
    gameState.current = {
      lane: 0, gates: [{y: -200, ...MASTER_QUESTIONS[0], passed: false}],
      particles: [], torches: gameState.current.torches,
      speed: difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7,
      score: 0, frameCount: 0, isDying: false
    };
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const switchLane = () => {
    if (gameState.current.isDying) return;
    gameState.current.lane = gameState.current.lane === 0 ? 1 : 0;
  };

  const gameLoop = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if(!ctx || !canvasRef.current) return;
    const W = 800; const H = 450;
    const S = gameState.current;

    if (!S.isDying) {
        S.frameCount++; S.gates.forEach(g => g.y += S.speed);
        S.torches.forEach(t => { t.y += S.speed; if(t.y > H) t.y = -50; t.frame++; });

        if (S.gates[S.gates.length - 1].y > 200) {
           const q = MASTER_QUESTIONS[Math.floor(Math.random() * MASTER_QUESTIONS.length)];
           S.gates.push({y: -250, ...q, passed: false});
        }
        if (S.gates[0].y > H) S.gates.shift();

        const pY = H - 80;
        S.gates.forEach(g => {
            if (!g.passed && g.y > pY - 30 && g.y < pY + 30) {
                const isCorrect = (S.lane === 0 && g.answer) || (S.lane === 1 && !g.answer);
                if (isCorrect) {
                    g.passed = true; S.score += 10; setScore(S.score);
                    for(let i=0; i<15; i++) S.particles.push({x: S.lane===0?W/4:W*0.75, y: pY, vx: Math.random()*6-3, vy: Math.random()*6-3, l: 20, c: '#4ade80'});
                } else {
                    S.isDying = true;
                    setTimeout(() => { 
                        setGameOver(true); setIsPlaying(false);
                        const finalScore = S.score;
                        if (finalScore > highScore) setHighScore(finalScore);
                        StorageService.saveHighScore('truth', finalScore); 
                        StorageService.addPoints(Math.floor(finalScore / 2), finalScore, 'game_reward', 'Truth Trek Expedition');
                    }, 1000);
                }
            }
        });
    }

    const grad = ctx.createLinearGradient(0,0,W,0); grad.addColorStop(0, '#1e1b4b'); grad.addColorStop(0.5, '#312e81'); grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
    
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
    
    S.torches.forEach(t => {
        const flicker = Math.sin(t.frame * 0.5) * 5;
        ctx.fillStyle = '#ea580c';
        ctx.beginPath(); ctx.arc(20, t.y, 5 + flicker/2, 0, Math.PI*2); ctx.fill(); 
        ctx.beginPath(); ctx.arc(W-20, t.y, 5 + flicker/2, 0, Math.PI*2); ctx.fill(); 
    });

    S.gates.forEach(g => {
        const scale = 1 + (g.y / H);
        const w = 180 * scale; const h = 100 * scale;
        
        ctx.fillStyle = 'rgba(17, 24, 39, 0.9)'; ctx.fillRect((W-w*2)/2, g.y - 80, w*2, 60);
        ctx.fillStyle = 'white'; ctx.font = `bold ${Math.max(12, 16*scale)}px sans-serif`; ctx.textAlign='center'; 
        ctx.fillText(g.question, W/2, g.y - 45);

        ctx.fillStyle = 'rgba(34, 197, 94, 0.2)'; ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 4;
        ctx.fillRect(W/2 - w - 10, g.y, w, h); ctx.strokeRect(W/2 - w - 10, g.y, w, h);
        ctx.fillStyle = '#4ade80'; ctx.fillText(g.trueLabel, W/2 - w/2 - 10, g.y + h/2);

        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; ctx.strokeStyle = '#ef4444';
        ctx.fillRect(W/2 + 10, g.y, w, h); ctx.strokeRect(W/2 + 10, g.y, w, h);
        ctx.fillStyle = '#f87171'; ctx.fillText(g.falseLabel, W/2 + w/2 + 10, g.y + h/2);
    });

    if (!S.isDying) {
        const px = S.lane === 0 ? W/4 : W*0.75;
        ctx.shadowBlur = 20; ctx.shadowColor = '#60a5fa';
        ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(px, H-80, 25, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(px-5, H-85, 8, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    } else {
        for(let i=0; i<5; i++) S.particles.push({x: S.lane===0?W/4:W*0.75, y: H-80, vx: Math.random()*10-5, vy: Math.random()*10-5, l: 30, c: '#ef4444'});
    }

    S.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.l--;
        ctx.fillStyle = p.c; ctx.globalAlpha = p.l/30; ctx.fillRect(p.x, p.y, 5, 5);
    });
    ctx.globalAlpha = 1;

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  return (
    <div className="fixed inset-0 z-50 bg-indigo-950/90 backdrop-blur-xl flex flex-col items-center justify-center relative overflow-hidden select-none" 
         onClick={switchLane}
         onKeyDown={(e) => {
             if (e.code === 'ArrowLeft') gameState.current.lane = 0;
             if (e.code === 'ArrowRight') gameState.current.lane = 1;
             if (e.code === 'Space') switchLane();
         }}
         tabIndex={0}
    >
      {/* Header HUD */}
      <div className="absolute top-6 w-full max-w-5xl px-6 z-50 flex justify-between items-start pointer-events-none">
            <button 
                onClick={onExit} 
                className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95 font-bold text-sm shadow-xl"
            >
                <ArrowLeft size={18} /> EXIT
            </button>
            
            {isPlaying && (
                 <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/10 text-white font-mono font-black text-4xl shadow-xl tracking-wider">
                        {score}
                    </div>
                    <div className="text-xs text-white/80 font-bold bg-black/20 px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">HI: {highScore}</div>
                 </div>
             )}
        </div>

      <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-500/20 border-8 border-indigo-900/50 w-full max-w-5xl aspect-video bg-black ring-1 ring-white/10">
           <canvas ref={canvasRef} width={800} height={450} className="w-full h-full block touch-none cursor-pointer"/>

           {!isPlaying && !gameOver && (
             <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in">
                <h2 className="text-6xl font-black mb-6 text-indigo-400 tracking-wider drop-shadow-md">TRUTH TREK</h2>
                <div className="mb-8 bg-white/10 px-6 py-3 rounded-full border border-white/20 flex items-center gap-3 backdrop-blur-md">
                    <Trophy size={18} className="text-yellow-400" />
                    <span className="text-sm font-bold text-yellow-100 uppercase tracking-widest">Personal Best: {highScore}</span>
                </div>
                
                <div className="flex gap-4 mb-10">
                   {['easy', 'medium', 'hard'].map((d) => (
                     <button 
                       key={d}
                       onClick={(e) => { e.stopPropagation(); setDifficulty(d as any); }}
                       className={`px-6 py-3 rounded-xl text-sm font-black uppercase transition-all border-2 ${
                         difficulty === d 
                           ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-110' 
                           : 'bg-black/40 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                       }`}
                     >
                       {d}
                     </button>
                   ))}
                </div>
                
                <Button onClick={(e) => { e.stopPropagation(); startGame(); }} className="bg-indigo-600 hover:bg-indigo-500 text-xl px-12 py-6 rounded-full font-black shadow-[0_0_30px_rgba(99,102,241,0.5)] transform hover:scale-105 active:scale-95 transition-all border border-white/10 group">
                  <Play size={28} className="mr-3 fill-white group-hover:scale-110 transition-transform"/> START MISSION
                </Button>
             </div>
           )}

           {gameOver && (
             <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center animate-in zoom-in duration-300">
                <h2 className="text-7xl font-black mb-4 tracking-tighter drop-shadow-lg">FAILED!</h2>
                
                <div className="flex flex-col items-center gap-1 mb-10 bg-black/30 px-8 py-4 rounded-3xl border border-red-500/30">
                    <span className="text-red-200 text-xs uppercase font-bold tracking-[0.2em]">Score</span>
                    <span className="text-6xl font-mono font-black text-yellow-400">{score}</span>
                </div>

                <div className="flex gap-4">
                  <Button onClick={(e) => { e.stopPropagation(); startGame(); }} className="bg-white text-indigo-900 hover:bg-gray-200 font-black px-10 py-5 text-xl rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                    <RefreshCw size={24} className="mr-2"/> RETRY
                  </Button>
                </div>
             </div>
           )}
      </div>
    </div>
  );
};
