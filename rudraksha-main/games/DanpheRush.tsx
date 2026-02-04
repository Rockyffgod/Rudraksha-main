
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowLeft, RefreshCw, Volume2, VolumeX, Trophy, Play, Zap, Shield } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface GameProps {
  onExit: () => void;
}

export const DanpheRush: React.FC<GameProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'GAMEOVER'>('READY');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Boost State
  const [boostUnlocked, setBoostUnlocked] = useState(false);
  const [boostCharge, setBoostCharge] = useState(0); // 0 to 3
  const [isBoosting, setIsBoosting] = useState(false);

  // Constants
  const GRAVITY = 0.4;
  const JUMP_STRENGTH = -7.5;
  const BOOST_STRENGTH = -12;
  const BASE_SPEED = 3.5;
  const PIPE_WIDTH = 70;
  const PIPE_GAP = 170; 
  const LEVEL_THRESHOLD = 10; // Points per level
  const PIPES_FOR_BOOST = 3;
  const SPAWN_RATE = 120;

  const physics = useRef({
    birdY: 200,
    velocity: 0,
    rotation: 0,
    pipes: [] as { x: number; topHeight: number; passed: boolean; broken?: boolean }[],
    clouds: [] as { x: number; y: number; scale: number; speed: number }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    frame: 0,
    flashOpacity: 0,
    invincibleTimer: 0,
    speed: BASE_SPEED,
    pipesSinceBoost: 0
  });

  const requestRef = useRef<number>(0);

  useEffect(() => {
    const loadData = async () => {
        const profile = await StorageService.getProfile();
        if (profile?.highScores?.danphe) setHighScore(profile.highScores.danphe);
    };
    loadData();
    initClouds();
    
    // Global Key Listener
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            e.preventDefault(); // Prevent scrolling
            flap();
        }
        if (e.code === 'KeyE') {
            activateBoost();
        }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Start loop
    requestRef.current = requestAnimationFrame(loop);
    return () => {
        cancelAnimationFrame(requestRef.current);
        window.removeEventListener('keydown', handleKeyDown);
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {});
        }
    };
  }, [gameState, boostUnlocked, boostCharge]); // Dependencies for key listener state access

  const initAudio = () => {
      if (!audioCtxRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
              audioCtxRef.current = new AudioContext();
          }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
      }
  };

  const initClouds = () => {
      physics.current.clouds = Array.from({ length: 6 }, () => ({
          x: Math.random() * 800,
          y: Math.random() * 300,
          scale: 0.5 + Math.random() * 0.5,
          speed: 0.5 + Math.random() * 0.5
      }));
  };

  const playSound = (type: 'flap' | 'score' | 'hit' | 'boost') => {
    if (!audioEnabled) return;
    
    // Ensure context exists
    if (!audioCtxRef.current) initAudio();
    
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'flap') {
        // Snappy Jump Sound
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start();
        osc.stop(now + 0.1);
    } else if (type === 'score') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start();
        osc.stop(now + 0.1);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start();
        osc.stop(now + 0.3);
    } else if (type === 'boost') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start();
        osc.stop(now + 0.5);
    }
  };

  const resetGame = () => {
    setGameState('READY');
    setScore(0);
    setLevel(1);
    setBoostUnlocked(false);
    setBoostCharge(0);
    setIsBoosting(false);
    
    physics.current = {
      birdY: 250,
      velocity: 0,
      rotation: 0,
      pipes: [],
      clouds: physics.current.clouds,
      particles: [],
      frame: 0,
      flashOpacity: 0,
      invincibleTimer: 0,
      speed: BASE_SPEED,
      pipesSinceBoost: 0
    };
  };

  const flap = () => {
    // Resume audio context on user interaction
    initAudio();

    if (gameState === 'GAMEOVER') return;
    
    if (gameState === 'READY') {
        setGameState('PLAYING');
    }

    physics.current.velocity = JUMP_STRENGTH;
    spawnParticles(100, physics.current.birdY, 'white');
    playSound('flap');
  };

  const activateBoost = () => {
      // Resume audio context
      initAudio();

      const P = physics.current;
      if (gameState !== 'PLAYING') return;
      
      const currentLevel = Math.floor(score / LEVEL_THRESHOLD) + 1;
      
      // Boost is ready if unlocked (Lvl 3+) AND charge is full
      const canBoost = currentLevel > 3 && P.pipesSinceBoost >= PIPES_FOR_BOOST;

      if (canBoost) {
          P.velocity = BOOST_STRENGTH;
          P.invincibleTimer = 60; // 1 second (at 60fps)
          P.pipesSinceBoost = 0; // Reset charge
          setBoostCharge(0);
          setIsBoosting(true); 
          playSound('boost');
          
          // Explosion effect
          for(let i=0; i<20; i++) {
              physics.current.particles.push({
                  x: 100, y: P.birdY,
                  vx: (Math.random() - 0.5) * 10,
                  vy: (Math.random() - 0.5) * 10,
                  life: 1.0,
                  color: '#facc15'
              });
          }
      }
  };

  const spawnParticles = (x: number, y: number, color: string) => {
      for(let i=0; i<5; i++) {
          physics.current.particles.push({
              x, y,
              vx: (Math.random() - 0.5) * 3 - 2, // Move left mostly
              vy: (Math.random() - 0.5) * 3,
              life: 1.0,
              color
          });
      }
  };

  const gameOverLogic = () => {
    if (gameState === 'GAMEOVER') return;
    setGameState('GAMEOVER');
    playSound('hit');
    physics.current.flashOpacity = 1.0;
    
    if (score > highScore) {
        setHighScore(score);
        StorageService.saveHighScore('danphe', score);
    }
    // Updated addPoints
    StorageService.addPoints(score, score * 5, 'game_reward', 'Danphe Rush Score');
  };

  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const P = physics.current;

    // --- LOGIC ---
    
    // Level & Unlock Logic
    const currentLvl = Math.floor(score / LEVEL_THRESHOLD) + 1;
    if (currentLvl !== level) setLevel(currentLvl);
    
    const isUnlocked = currentLvl > 3;
    if (isUnlocked !== boostUnlocked) setBoostUnlocked(isUnlocked);
    
    // Sync React state for UI (limited updates to prevent lag)
    if (isUnlocked) {
        // Clamp charge visual
        const charge = Math.min(PIPES_FOR_BOOST, P.pipesSinceBoost);
        if (charge !== boostCharge) setBoostCharge(charge);
    }
    
    if (isBoosting && P.invincibleTimer <= 0) setIsBoosting(false);

    // Difficulty Scaling
    P.speed = BASE_SPEED + (currentLvl * 0.2);

    // Background movement (Clouds)
    if (gameState !== 'GAMEOVER') {
        P.clouds.forEach(c => {
            c.x -= c.speed * (gameState === 'PLAYING' ? 1 : 0.5);
            if (c.x < -100) c.x = WIDTH + 100;
        });
    }

    if (gameState === 'PLAYING') {
        P.frame++;
        if (P.invincibleTimer > 0) P.invincibleTimer--;

        // Physics
        P.velocity += GRAVITY;
        P.birdY += P.velocity;

        // Rotation logic
        if (P.velocity < 0) {
            P.rotation = Math.max(-0.5, P.rotation - 0.1);
        } else {
            P.rotation = Math.min(Math.PI / 2, P.rotation + 0.05);
        }

        // Pipe Spawning
        if (P.frame % SPAWN_RATE === 0) {
            const minHeight = 100;
            const maxHeight = HEIGHT - 150 - PIPE_GAP;
            const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
            P.pipes.push({ x: WIDTH, topHeight: height, passed: false });
        }

        // Pipe Movement & Collision
        P.pipes.forEach(pipe => {
            pipe.x -= P.speed;

            // Collision AABB
            const birdLeft = 100 - 15;
            const birdRight = 100 + 15;
            const birdTop = P.birdY - 12;
            const birdBottom = P.birdY + 12;

            const pipeLeft = pipe.x;
            const pipeRight = pipe.x + PIPE_WIDTH;
            
            // Hit Pipe
            if (!pipe.broken && birdRight > pipeLeft && birdLeft < pipeRight) {
                if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
                    if (P.invincibleTimer > 0) {
                        // Boost destroys pipe logic (visual only, we just mark it passed/broken)
                        pipe.broken = true;
                        spawnParticles(pipe.x, P.birdY, '#64748b'); // Stone debris
                        setScore(s => s + 2); // Bonus points for smashing
                        playSound('score');
                    } else {
                        gameOverLogic();
                    }
                }
            }

            // Score & Charge
            if (!pipe.passed && birdLeft > pipeRight) {
                pipe.passed = true;
                setScore(s => s + 1);
                // Increment boost charge
                if (P.pipesSinceBoost < PIPES_FOR_BOOST) {
                    P.pipesSinceBoost++;
                }
                playSound('score');
            }
        });

        // Cleanup pipes
        if (P.pipes.length > 0 && P.pipes[0].x < -PIPE_WIDTH) {
            P.pipes.shift();
        }

        // Ground/Ceiling Collision
        if (P.birdY >= HEIGHT - 40 || P.birdY < 0) {
            if (P.invincibleTimer > 0 && P.birdY < 0) {
                // Hitting ceiling while boosting is fine, just clamp
                P.birdY = 0;
                P.velocity = 0;
            } else {
                gameOverLogic();
            }
        }
    } else if (gameState === 'READY') {
        P.birdY = 250 + Math.sin(Date.now() / 300) * 10;
        P.rotation = 0;
    } else if (gameState === 'GAMEOVER') {
        if (P.birdY < HEIGHT - 40) {
            P.velocity += GRAVITY;
            P.birdY += P.velocity;
            P.rotation = Math.min(Math.PI / 2, P.rotation + 0.1);
        }
    }

    if (P.flashOpacity > 0) P.flashOpacity -= 0.05;

    // --- RENDER ---

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    skyGrad.addColorStop(0, '#38bdf8'); // Sky blue
    skyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Mountains
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(0, HEIGHT);
    ctx.lineTo(200, HEIGHT - 200);
    ctx.lineTo(400, HEIGHT - 100);
    ctx.lineTo(600, HEIGHT - 250);
    ctx.lineTo(800, HEIGHT);
    ctx.fill();

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    P.clouds.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 30 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 20 * c.scale, c.y - 10 * c.scale, 35 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 40 * c.scale, c.y, 30 * c.scale, 0, Math.PI * 2);
        ctx.fill();
    });

    // Pipes
    P.pipes.forEach(pipe => {
        if (pipe.broken) ctx.globalAlpha = 0.5;
        
        // Top Pillar
        const gradTop = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
        gradTop.addColorStop(0, '#475569');
        gradTop.addColorStop(0.5, '#64748b');
        gradTop.addColorStop(1, '#475569');
        ctx.fillStyle = gradTop;
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        
        // Cap Top
        ctx.fillStyle = '#334155';
        ctx.fillRect(pipe.x - 4, pipe.topHeight - 20, PIPE_WIDTH + 8, 20);

        // Bottom Pillar
        ctx.fillStyle = gradTop;
        ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, HEIGHT - (pipe.topHeight + PIPE_GAP));
        
        // Cap Bottom
        ctx.fillStyle = '#334155';
        ctx.fillRect(pipe.x - 4, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 8, 20);

        ctx.globalAlpha = 1.0;
    });

    // Ground
    ctx.fillStyle = '#166534'; 
    ctx.fillRect(0, HEIGHT - 40, WIDTH, 40);
    ctx.fillStyle = '#86efac'; 
    ctx.fillRect(0, HEIGHT - 40, WIDTH, 5);
    
    // Moving Ground Pattern
    ctx.fillStyle = '#14532d';
    const groundOffset = (Date.now() / 5 * (P.speed/3.5)) % 40;
    for(let i = -1; i < WIDTH/20; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 40 - groundOffset, HEIGHT - 35);
        ctx.lineTo(i * 40 + 20 - groundOffset, HEIGHT);
        ctx.lineTo(i * 40 + 10 - groundOffset, HEIGHT);
        ctx.lineTo(i * 40 - 10 - groundOffset, HEIGHT - 35);
        ctx.fill();
    }

    // Particles
    P.particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        if (p.life <= 0) P.particles.splice(i, 1);
    });
    ctx.globalAlpha = 1.0;

    // Bird
    ctx.save();
    ctx.translate(100, P.birdY);
    ctx.rotate(P.rotation);

    // Boost Aura
    if (P.invincibleTimer > 0) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#facc15';
        ctx.fillStyle = 'rgba(250, 204, 21, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Tail
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(-15, 0, 15, 8, 0, 0, Math.PI*2);
    ctx.fill();

    // Body
    const bodyGrad = ctx.createRadialGradient(-5, -5, 2, 0, 0, 15);
    bodyGrad.addColorStop(0, '#0ea5e9'); 
    bodyGrad.addColorStop(1, '#1e3a8a'); 
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI*2);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.ellipse(2, 4, 10, 6, 0.2, 0, Math.PI*2);
    ctx.fill();

    // Eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(10, -6, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(12, -6, 2, 0, Math.PI*2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(14, -4);
    ctx.lineTo(24, 0);
    ctx.lineTo(14, 4);
    ctx.fill();

    ctx.restore();

    // Flash Effect
    if (P.flashOpacity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${P.flashOpacity})`;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    requestRef.current = requestAnimationFrame(loop);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center select-none overflow-hidden font-sans" onMouseDown={flap} onTouchStart={flap} onKeyDown={(e) => { if (e.code === 'Space') flap(); }} tabIndex={0}>
        
        <div className="absolute top-6 w-full max-w-5xl px-6 z-50 flex justify-between items-start pointer-events-none">
            <button onClick={(e) => { e.stopPropagation(); onExit(); }} className="pointer-events-auto flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md border border-white/10 transition-all font-black text-xs tracking-widest shadow-2xl">
                <ArrowLeft size={18} /> EXIT
            </button>
            <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setAudioEnabled(!audioEnabled); }} className="pointer-events-auto p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md border border-white/10 transition-all shadow-2xl">
                    {audioEnabled ? <Volume2 size={20}/> : <VolumeX size={20}/>}
                </button>
            </div>
        </div>

        {/* Game Container */}
        <div className="relative rounded-[3rem] overflow-hidden shadow-[0_0_120px_rgba(14,165,233,0.3)] border-[14px] border-gray-900 w-full max-w-xl aspect-[9/16] md:aspect-[3/4] bg-sky-300">
             <canvas ref={canvasRef} width={600} height={800} className="w-full h-full block touch-none cursor-pointer"/>
             
             {/* HUD - Score & Level */}
             {gameState !== 'READY' && (
                 <div className="absolute top-10 w-full text-center pointer-events-none flex flex-col items-center gap-1">
                     <span className="text-6xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)] stroke-black leading-none">{score}</span>
                     <span className="text-xs font-black text-white/80 uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">Level {level}</span>
                 </div>
             )}

             {/* Boost Indicator */}
             {gameState === 'PLAYING' && boostUnlocked && (
                 <div className="absolute bottom-10 right-6 pointer-events-none flex flex-col items-center gap-2">
                     <div 
                        className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 relative overflow-hidden ${isBoosting ? 'bg-yellow-400 border-yellow-200 scale-110 shadow-[0_0_30px_#facc15]' : boostCharge >= PIPES_FOR_BOOST ? 'bg-yellow-500 border-white animate-pulse' : 'bg-gray-800 border-gray-600'}`}
                     >
                         {/* Charge Fill */}
                         {!isBoosting && (
                             <div 
                                className="absolute bottom-0 left-0 w-full bg-yellow-500/50 transition-all duration-500 ease-out"
                                style={{ height: `${(boostCharge / PIPES_FOR_BOOST) * 100}%` }}
                             />
                         )}
                         <div className="relative z-10">
                            {isBoosting ? <Shield size={32} className="text-white"/> : <Zap size={32} className={boostCharge >= PIPES_FOR_BOOST ? "text-white" : "text-gray-400"}/>}
                         </div>
                     </div>
                     <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/40 px-2 py-1 rounded">
                         {boostCharge >= PIPES_FOR_BOOST ? 'Press E' : `${boostCharge}/${PIPES_FOR_BOOST}`}
                     </span>
                 </div>
             )}

             {/* Ready Screen */}
             {gameState === 'READY' && (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
                  <div className="bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/20 text-center animate-in zoom-in duration-300">
                      <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200 drop-shadow-sm">Get Ready</h2>
                      <div className="w-24 h-24 mx-auto my-6 bg-white/10 rounded-full flex items-center justify-center animate-bounce border-2 border-white/30">
                          <Play size={40} className="ml-1 fill-white"/>
                      </div>
                      <div className="space-y-2">
                          <p className="font-bold text-lg uppercase tracking-widest opacity-90">Tap / Space to Fly</p>
                          <p className="text-xs font-medium text-yellow-300 uppercase tracking-wide opacity-80">Reach Lvl 4 to Unlock Boost [E]</p>
                      </div>
                  </div>
               </div>
             )}

             {/* Game Over Screen */}
             {gameState === 'GAMEOVER' && (
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center animate-in zoom-in duration-300 z-20">
                  <h2 className="text-6xl font-black text-white drop-shadow-[0_10px_0_#0f172a] tracking-tighter mb-8 uppercase italic">Game Over</h2>
                  
                  <div className="bg-white text-gray-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl mb-8 transform rotate-1">
                      <div className="flex justify-between items-center mb-4 border-b-2 border-gray-100 pb-4">
                          <div className="text-left">
                              <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Score</p>
                              <p className="text-4xl font-black">{score}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs font-black text-blue-500 uppercase tracking-widest">Level</p>
                              <p className="text-4xl font-black">{level}</p>
                          </div>
                      </div>
                      {score >= 10 && (
                          <div className="flex justify-center py-4">
                              <Trophy size={64} className="text-yellow-400 drop-shadow-md fill-yellow-200 animate-bounce" />
                          </div>
                      )}
                      <p className="text-gray-400 font-bold text-sm italic mt-2">Best Score: {highScore}</p>
                  </div>

                  <Button onClick={(e) => { e.stopPropagation(); resetGame(); }} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-black px-12 py-6 text-xl rounded-[2rem] shadow-xl flex items-center gap-3 active:scale-95 transition-transform pointer-events-auto">
                      <RefreshCw size={24} /> PLAY AGAIN
                  </Button>
               </div>
             )}
        </div>
    </div>
  );
};
