/**
 * NEURAL RAILS: SINGULARITY EDITION
 * ------------------------------------------------
 * Architecture: Dual-Pass Neon Lighting / Director AI Scaling
 * Features: Light Cones / Neural Grid Background / Weather Physics
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, GitFork, AlertTriangle, Zap, Clock, 
  Activity, Brain, CloudRain, Snowflake, Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
type TrainColor = 'red' | 'blue' | 'green';
type Weather = 'CLEAR' | 'RAIN' | 'STORM';

interface Vec2 { x: number; y: number; }
interface Train {
  id: number;
  color: TrainColor;
  x: number; y: number;
  t: number; 
  targetIdx: number;
  state: 'APPROACH' | 'CROSSING';
  speed: number;
  angle: number;
  wagons: Vec2[];
}

export const AttentionTracks: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'START' | 'PLAYING' | 'OVER'>('START');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [weather, setWeather] = useState<Weather>('CLEAR');
  
  // High-Performance Refs
  const trains = useRef<Train[]>([]);
  const switchState = useRef(1); // 0: Top, 1: Mid, 2: Bot
  const lastSpawn = useRef(0);
  const intensity = useRef(1.0);
  const frame = useRef(0);

  // Constants
  const WIDTH = 1200;
  const HEIGHT = 800;
  const JUNCTION = { x: 400, y: 400 };
  const STATIONS = [
    { color: 'red' as TrainColor, pos: { x: 1100, y: 150 } },
    { color: 'blue' as TrainColor, pos: { x: 1100, y: 400 } },
    { color: 'green' as TrainColor, pos: { x: 1100, y: 650 } }
  ];

  // --- PHYSICS ENGINE ---
  const update = (time: number) => {
    if (status !== 'PLAYING') return;

    // Director AI Scaling
    intensity.current = 1.0 + (score / 10000);
    const spawnRate = Math.max(1200, 3500 - (score / 5));

    if (time - lastSpawn.current > spawnRate) {
      spawnTrain();
      lastSpawn.current = time;
    }

    // Weather Randomizer
    if (frame.current % 1200 === 0 && Math.random() > 0.8) {
      const modes: Weather[] = ['CLEAR', 'RAIN', 'STORM'];
      setWeather(modes[Math.floor(Math.random() * 3)]);
    }

    trains.current.forEach(t => {
      const prev = { x: t.x, y: t.y };
      const moveSpeed = weather === 'RAIN' ? t.speed * 1.3 : t.speed;

      if (t.state === 'APPROACH') {
        t.x += 4 * intensity.current;
        if (t.x >= JUNCTION.x) {
          t.state = 'CROSSING';
          t.targetIdx = switchState.current;
        }
      } else {
        t.t += moveSpeed * intensity.current;
        const p0 = JUNCTION;
        const p3 = STATIONS[t.targetIdx].pos;
        const p1 = { x: p0.x + 300, y: p0.y };
        const p2 = { x: p3.x - 300, y: p3.y };
        
        // Cubic Bezier
        const it = 1 - t.t;
        t.x = it**3 * p0.x + 3*it**2 * t.t * p1.x + 3*it * t.t**2 * p2.x + t.t**3 * p3.x;
        t.y = it**3 * p0.y + 3*it**2 * t.t * p1.y + 3*it * t.t**2 * p2.y + t.t**3 * p3.y;

        if (t.t >= 1) handleArrival(t);
      }

      t.angle = Math.atan2(t.y - prev.y, t.x - prev.x);
      
      // Wagon Constraint Physics
      t.wagons.forEach((w, i) => {
        const lead = i === 0 ? {x: t.x, y: t.y} : t.wagons[i-1];
        const d = Math.hypot(lead.x - w.x, lead.y - w.y);
        if (d > 45) {
          const a = Math.atan2(lead.y - w.y, lead.x - w.x);
          w.x = lead.x - Math.cos(a) * 45;
          w.y = lead.y - Math.sin(a) * 45;
        }
      });
    });

    trains.current = trains.current.filter(t => t.t < 1 && t.x < WIDTH + 50);
    frame.current++;
  };

  const handleArrival = (t: Train) => {
    if (STATIONS[t.targetIdx].color === t.color) {
      setScore(s => s + 100);
    } else {
      setLives(l => {
        if (l <= 1) setStatus('OVER');
        return l - 1;
      });
    }
  };

  const spawnTrain = () => {
    const colors: TrainColor[] = ['red', 'blue', 'green'];
    trains.current.push({
      id: Math.random(), color: colors[Math.floor(Math.random()*3)],
      x: -50, y: 400, t: 0, targetIdx: 0, state: 'APPROACH',
      speed: 0.006, angle: 0, wagons: Array(3).fill(0).map(() => ({x: -50, y: 400}))
    });
  };

  // --- RENDERING ENGINE ---
  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 1. Neural Grid Background
    ctx.strokeStyle = '#1e3a8a33';
    ctx.lineWidth = 1;
    for(let i=0; i<WIDTH; i+=60) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, HEIGHT); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(WIDTH, i); ctx.stroke();
    }

    // 2. Light Cone Pass (Additive)
    ctx.globalCompositeOperation = 'lighter';
    trains.current.forEach(t => {
      const color = t.color === 'red' ? '#ef4444' : t.color === 'blue' ? '#3b82f6' : '#22c55e';
      const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, 250);
      g.addColorStop(0, color + '44');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.arc(t.x, t.y, 250, t.angle - 0.5, t.angle + 0.5);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';

    // 3. Tracks & Nodes
    STATIONS.forEach((st, i) => {
      ctx.strokeStyle = switchState.current === i ? '#fbbf24' : '#1e293b';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(JUNCTION.x, JUNCTION.y);
      ctx.bezierCurveTo(JUNCTION.x+300, JUNCTION.y, st.pos.x-300, st.pos.y, st.pos.x, st.pos.y);
      ctx.stroke();
    });

    // 4. Trains & Wagons
    trains.current.forEach(t => {
      const color = t.color === 'red' ? '#ef4444' : t.color === 'blue' ? '#3b82f6' : '#22c55e';
      t.wagons.forEach(w => {
        ctx.fillStyle = '#0f172a'; ctx.strokeStyle = color;
        ctx.beginPath(); ctx.arc(w.x, w.y, 12, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = color;
      ctx.shadowBlur = 20; ctx.shadowColor = color;
      ctx.beginPath(); ctx.arc(t.x, t.y, 18, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    });
  };

  useEffect(() => {
    const loop = (t: number) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) { update(t); draw(ctx); }
      requestAnimationFrame(loop);
    };
    const anim = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(anim);
  }, [status, weather]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center select-none overflow-hidden font-sans">
      
      {/* HUD SINGULARITY */}
      <AnimatePresence>
        {status === 'PLAYING' && (
          <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className="absolute top-10 left-10 right-10 flex justify-between z-50 pointer-events-none">
            <div className="flex gap-4 pointer-events-auto">
              <div className="bg-slate-900/90 px-8 py-4 rounded-3xl border border-white/10 backdrop-blur-xl">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Quantum Score</span>
                <div className="text-4xl font-mono font-black text-white">{score}</div>
              </div>
              <div className="bg-slate-900/90 p-4 rounded-3xl border border-white/10 flex items-center gap-3 text-white">
                <Activity size={20} className="text-red-500 animate-pulse"/>
                <span className="font-mono">LOAD: {(intensity.current * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="flex items-center gap-6 pointer-events-auto">
               <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => <div key={i} className={`w-3 h-3 rounded-full ${i < lives ? 'bg-red-500 shadow-[0_0_15px_red]' : 'bg-white/10'}`}/>)}
                  </div>
                  <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest">
                    {weather === 'RAIN' ? <CloudRain size={14}/> : weather === 'STORM' ? <Zap size={14}/> : <Sun size={14}/>} {weather}
                  </div>
               </div>
               <button onClick={onExit} className="bg-white/5 p-4 rounded-2xl hover:bg-white/10 text-white"><ArrowLeft/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GAME VIEWPORT */}
      <div className="relative w-full max-w-6xl aspect-video rounded-[3rem] border-[10px] border-slate-900 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        <canvas 
          ref={canvasRef} 
          width={WIDTH} height={HEIGHT} 
          onClick={() => { if(status === 'PLAYING') switchState.current = (switchState.current + 1) % 3; }}
          className="w-full h-full cursor-crosshair"
        />

        {status === 'START' && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center text-center p-20 backdrop-blur-xl">
            <Brain size={100} className="text-blue-500 mb-8 animate-pulse" />
            <h1 className="text-9xl font-black italic uppercase text-white mb-4 tracking-tighter">Neural<br/><span className="text-blue-600">Rails</span></h1>
            <p className="text-slate-400 text-xl max-w-xl mb-16 italic">Synchronize with the Director AI. Manage the quantum sorting flow.</p>
            <button onClick={() => setStatus('PLAYING')} className="bg-blue-600 px-24 py-10 rounded-full text-4xl font-black text-white shadow-2xl hover:scale-105 active:scale-95 transition-all">INITIALIZE</button>
          </div>
        )}

        {status === 'OVER' && (
          <div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center p-20 text-center backdrop-blur-3xl">
             <AlertTriangle size={120} className="text-red-500 mb-8"/>
             <h2 className="text-8xl font-black text-white italic uppercase mb-12 leading-none">Neural<br/>Collapse</h2>
             <div className="bg-black/50 px-16 py-8 rounded-[2rem] border border-white/10 mb-12">
                <p className="text-7xl font-mono font-black text-yellow-500">{score}</p>
             </div>
             <button onClick={() => window.location.reload()} className="bg-white text-black px-16 py-8 rounded-full text-2xl font-black hover:scale-110 transition-all">REBOOT SYSTEM</button>
          </div>
        )}
      </div>

      <div className="mt-8 text-white/20 font-black uppercase tracking-[0.5em] text-[10px]">Singularity Protocol v4.0.2</div>
    </div>
  );
};