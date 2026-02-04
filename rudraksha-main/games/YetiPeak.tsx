
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Play, RefreshCw, Trophy, Mountain } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface GameProps {
  onExit: () => void;
}

export const YetiPeak: React.FC<GameProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const gameState = useRef({
    player: { x: 400, y: 300, w: 40, h: 40, vy: 0 },
    platforms: [] as any[],
    particles: [] as any[],
    frame: 0,
    cameraY: 0,
    score: 0,
    lastPlatformY: 450
  });

  const requestRef = useRef<number>(0);
  const GRAVITY = 0.3;
  const JUMP_FORCE = -11;
  const WIDTH = 800;
  const HEIGHT = 450;

  useEffect(() => {
    const loadHighScore = async () => {
      const profile = await StorageService.getProfile();
      if (profile?.highScores?.truth) setHighScore(profile.highScores.truth); // Reusing slot or assume new one
    };
    loadHighScore();
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    gameState.current = {
      player: { x: WIDTH / 2, y: HEIGHT - 100, w: 50, h: 60, vy: JUMP_FORCE },
      platforms: [],
      particles: [],
      frame: 0,
      cameraY: 0,
      score: 0,
      lastPlatformY: HEIGHT
    };
    // Initial platforms
    for (let i = 0; i < 10; i++) {
      spawnPlatform();
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const spawnPlatform = () => {
    const S = gameState.current;
    const w = 100 + Math.random() * 50;
    const x = Math.random() * (WIDTH - w);
    const y = S.lastPlatformY - (80 + Math.random() * 40);
    S.platforms.push({ x, y, w, h: 15 });
    S.lastPlatformY = y;
  };

  const handleInput = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlaying) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    gameState.current.player.x = (x / rect.width) * WIDTH - 25;
  };

  const gameLoop = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    const S = gameState.current;

    if (isPlaying && !gameOver) {
      S.frame++;
      
      // Physics
      S.player.vy += GRAVITY;
      S.player.y += S.player.vy;

      // Wrap horizontal
      if (S.player.x < -25) S.player.x = WIDTH + 25;
      if (S.player.x > WIDTH + 25) S.player.x = -25;

      // Platform Collisions (only when falling)
      if (S.player.vy > 0) {
        S.platforms.forEach(p => {
          if (S.player.x + S.player.w > p.x && S.player.x < p.x + p.w &&
              S.player.y + S.player.h > p.y && S.player.y + S.player.h < p.y + p.h + 10) {
            S.player.vy = JUMP_FORCE;
            // Particles
            for(let i=0; i<5; i++) S.particles.push({x: S.player.x + 25, y: p.y, vx: Math.random()*4-2, vy: -Math.random()*2, l: 15});
          }
        });
      }

      // Camera Follow & Score
      if (S.player.y < HEIGHT / 2) {
        const diff = HEIGHT / 2 - S.player.y;
        S.cameraY += diff;
        S.player.y = HEIGHT / 2;
        S.platforms.forEach(p => p.y += diff);
        S.lastPlatformY += diff;
        S.score += Math.floor(diff / 10);
        setScore(S.score);
      }

      // Cleanup & Spawn new platforms
      S.platforms = S.platforms.filter(p => p.y < HEIGHT + 50);
      while (S.platforms.length < 15) {
        spawnPlatform();
      }

      // Death
      if (S.player.y > HEIGHT + 100) {
        setGameOver(true);
        if (S.score > highScore) {
            setHighScore(S.score);
            StorageService.saveHighScore('truth', S.score); // Reuse or assume new
        }
      }

      S.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.l--; });
      S.particles = S.particles.filter(p => p.l > 0);
    }

    // DRAWING
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(1, '#334155');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Grid lines for motion feel
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for(let y = S.cameraY % 50; y < HEIGHT; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
    }

    // Platforms
    S.platforms.forEach(p => {
      ctx.fillStyle = '#f8fafc';
      ctx.shadowBlur = 10; ctx.shadowColor = '#60a5fa';
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 8);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Ice crack detail
      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath(); ctx.moveTo(p.x + 20, p.y + 5); ctx.lineTo(p.x + 40, p.y + 10); ctx.stroke();
    });

    // Player (Yeti)
    ctx.save();
    ctx.translate(S.player.x, S.player.y);
    // Body (fluffy white)
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.roundRect(0, 0, S.player.w, S.player.h, 20); ctx.fill();
    // Face (blueish)
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath(); ctx.arc(25, 20, 15, 0, Math.PI*2); ctx.fill();
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(20, 18, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(30, 18, 2, 0, Math.PI*2); ctx.fill();
    // Horns/Ears
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.moveTo(5, 5); ctx.lineTo(0, -10); ctx.lineTo(15, 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(45, 5); ctx.lineTo(50, -10); ctx.lineTo(35, 5); ctx.fill();
    ctx.restore();

    // Particles
    S.particles.forEach(p => {
        ctx.globalAlpha = p.l / 15;
        ctx.fillStyle = '#fff';
        ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1;

    if (isPlaying && !gameOver) {
        requestRef.current = requestAnimationFrame(gameLoop);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center select-none overflow-hidden font-sans" 
         onMouseMove={handleInput} onTouchMove={handleInput}>
        
        <div className="absolute top-6 w-full max-w-2xl px-6 z-50 flex justify-between items-center pointer-events-none">
            <button onClick={onExit} className="pointer-events-auto flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md border border-white/10 transition-all font-black text-xs tracking-widest shadow-2xl">
                <ArrowLeft size={18} /> EXIT
            </button>
            {isPlaying && (
                <div className="bg-black/60 backdrop-blur-xl px-8 py-3 rounded-2xl border border-white/10 text-white font-mono font-black text-3xl shadow-2xl tabular-nums">
                    {score}m
                </div>
            )}
        </div>

        <div className="relative rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.1)] border-[12px] border-gray-900 w-full max-w-2xl aspect-[3/4] bg-slate-900">
             <canvas ref={canvasRef} width={800} height={450 * (4/3)} className="w-full h-full block touch-none cursor-none"/>
             
             {!isPlaying && !gameOver && (
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in">
                  <h2 className="text-7xl font-black italic tracking-tighter text-white mb-6 uppercase">YETI PEAK</h2>
                  <div className="mb-10 p-6 bg-white/10 rounded-[2rem] border border-white/20 backdrop-blur-md">
                     <p className="text-sm font-medium text-gray-300">Move your mouse or touch to guide the Yeti to the highest peak. Don't fall into the abyss!</p>
                  </div>
                  <Button onClick={startGame} className="bg-blue-600 hover:bg-blue-700 text-2xl px-16 py-7 rounded-[2rem] font-black shadow-2xl">
                      ASCEND MOUNTAIN
                  </Button>
               </div>
             )}

             {gameOver && (
               <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-white p-6 text-center animate-in zoom-in duration-300">
                  <h2 className="text-8xl font-black text-blue-400 tracking-tighter mb-4 italic uppercase">FROZEN!</h2>
                  <p className="text-gray-400 text-xl font-bold uppercase tracking-widest mb-10">Altitude: {score}m</p>
                  <Button onClick={startGame} className="bg-white text-slate-900 font-black px-12 py-6 text-2xl rounded-[2rem] shadow-2xl flex items-center gap-3">
                      <RefreshCw size={28}/> RETRY CLIMB
                  </Button>
               </div>
             )}
        </div>
    </div>
  );
};
