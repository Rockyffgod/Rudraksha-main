
import React, { useState, useEffect, useRef, useReducer, useMemo } from 'react';
import { 
  Trophy, Zap, ShoppingBag, ArrowLeft, Shield, Star, 
  Settings, Activity, Cpu, Layers, HardDrive, 
  Flame, Crosshair, MapPin, Gauge, AlertOctagon, 
  ChevronRight, Lock, Unlock, Play, Pause, RotateCcw
} from 'lucide-react';
import { StorageService } from '../services/storageService';

/**
 * SPEEDZONE: OMEGA PROTOCOL (V3.1)
 * ================================
 * Removed in-game currency.
 * Progression is now based on Pilot Level (XP).
 * Game Over awards global Karma points.
 */

// --- 1. CONSTANTS & CONFIGURATION ---
const DB_KEY = 'SPEEDZONE_OMEGA_V2'; // Version bump for data migration
const FPS = 60;
const LANE_WIDTH = 140;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;

// Color Palettes for different Biomes
const BIOMES = [
  { 
    id: 'NEON_CITY', name: 'Neo-Tokyo', 
    road: '#1e293b', line: '#facc15', grid: 'rgba(250, 204, 21, 0.1)', 
    fog: 'rgba(30, 41, 59, 0)', sky: '#0f172a' 
  },
  { 
    id: 'WASTELAND', name: 'Mars Outpost', 
    road: '#2b1212', line: '#f97316', grid: 'rgba(249, 115, 22, 0.1)', 
    fog: 'rgba(43, 18, 18, 0)', sky: '#1a0505' 
  },
  { 
    id: 'VOID', name: 'The Null Zone', 
    road: '#000000', line: '#a855f7', grid: 'rgba(168, 85, 247, 0.15)', 
    fog: 'rgba(0,0,0,0)', sky: '#000000' 
  }
];

// Ships unlock at specific levels
const SHIPS = [
  { id: 'alpha', name: 'Yellow Cab', requiredLevel: 1, baseSpeed: 1.0, baseHandling: 1.0, baseNitro: 1.0, color: '#facc15' },
  { id: 'beta', name: 'Turbo Taxi', requiredLevel: 5, baseSpeed: 1.1, baseHandling: 0.8, baseNitro: 1.3, color: '#fbbf24' },
  { id: 'gamma', name: 'Crazy Cab', requiredLevel: 10, baseSpeed: 1.3, baseHandling: 1.4, baseNitro: 1.1, color: '#f59e0b' },
  { id: 'omega', name: 'King Cab', requiredLevel: 20, baseSpeed: 1.6, baseHandling: 1.5, baseNitro: 2.0, color: '#d97706' },
];

const POWERUPS = {
  SHIELD: { color: '#06b6d4', duration: 5000 },
  MAGNET: { color: '#eab308', duration: 8000 },
  DOUBLE: { color: '#8b5cf6', duration: 10000 },
};

// --- 2. TYPES & INTERFACES ---

type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'GARAGE';

interface Entity {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'PLAYER' | 'RIVAL' | 'HAZARD_STATIC' | 'COIN' | 'POWERUP';
  subtype?: string; // e.g., 'TRUCK', 'SHIELD'
  color: string;
  speed: number;
  lane: number;
  dead?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0.0 to 1.0
  decay: number;
  color: string;
  size: number;
  type: 'SPARK' | 'SMOKE' | 'GLOW' | 'TEXT' | 'FIRE';
  text?: string;
}

interface UserProfile {
  xp: number;
  level: number;
  highScore: number;
  activeShip: string;
  upgrades: {
    speed: number;   // Level 0-5
    handling: number; // Level 0-5
    nitro: number;    // Level 0-5
  };
}

// --- 3. UTILITY FUNCTIONS ---
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;
const checkRectCollision = (r1: Entity, r2: Entity, padding = 0) => {
  return (
    r1.x < r2.x + r2.w - padding &&
    r1.x + r1.w > r2.x + padding &&
    r1.y < r2.y + r2.h - padding &&
    r1.h + r1.y > r2.y + padding
  );
};

// --- 4. MAIN ENGINE COMPONENT ---
export const SpeedZone: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  // --- REACT STATE (UI) ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(DB_KEY);
      return saved ? JSON.parse(saved) : {
        xp: 0, level: 1, highScore: 0,
        activeShip: 'alpha',
        upgrades: { speed: 0, handling: 0, nitro: 0 }
      };
    } catch { return { xp: 0, level: 1, highScore: 0, activeShip: 'alpha', upgrades: { speed: 0, handling: 0, nitro: 0 } }; }
  });

  // Persistent Save
  useEffect(() => {
    localStorage.setItem(DB_KEY, JSON.stringify(profile));
  }, [profile]);

  // --- GAME ENGINE STATE (MUTABLE REFS) ---
  const engine = useRef({
    // Core
    lastTime: 0,
    deltaTime: 0,
    score: 0,
    distance: 0,
    speed: 0,
    targetSpeed: 0,
    
    // World
    biomeIdx: 0,
    roadOffset: 0,
    shake: 0,
    
    // Player
    lane: 1, // 0, 1, 2, 3
    x: 300,
    y: 600,
    nitro: 100, // FUEL: 0-100
    isNitro: false,
    shield: 0, // Time remaining
    magnet: 0,
    doublePoints: 0,
    
    // Entities
    entities: [] as Entity[],
    particles: [] as Particle[],
    
    // Timers
    lastSpawn: 0,
  });

  const requestRef = useRef<number>(0);

  const triggerShake = (amount: number) => {
    engine.current.shake = amount;
  };

  const spawnParticle = (x: number, y: number, type: Particle['type'], color: string, count = 1, text?: string) => {
    for (let i = 0; i < count; i++) {
      engine.current.particles.push({
        id: Math.random(),
        x, y,
        vx: (Math.random() - 0.5) * (type === 'SPARK' ? 10 : type === 'FIRE' ? 2 : 4),
        vy: (Math.random() - 0.5) * (type === 'SPARK' ? 10 : 4) + (type === 'SMOKE' ? 5 : type === 'FIRE' ? 10 : 0),
        life: 1.0,
        decay: type === 'TEXT' ? 0.015 : type === 'FIRE' ? 0.05 : randomRange(0.02, 0.05),
        color,
        size: randomRange(2, type === 'SMOKE' ? 15 : type === 'FIRE' ? 20 : 6),
        type,
        text
      });
    }
  };

  const spawnEntity = (currentSpeed: number) => {
    const lane = Math.floor(Math.random() * 4); // 4 Lanes
    const x = (lane * LANE_WIDTH) + (CANVAS_WIDTH - (4 * LANE_WIDTH)) / 2 + (LANE_WIDTH/2) - 35; // Centered
    const typeRoll = Math.random();
    
    let entity: Entity = {
      id: Math.random().toString(),
      x, y: -200, w: 70, h: 140,
      lane,
      speed: 0,
      type: 'HAZARD_STATIC',
      color: '#fff'
    };

    if (typeRoll > 0.95) {
      entity.type = 'POWERUP';
      entity.w = 40; entity.h = 40;
      entity.color = '#fff'; 
      const pType = Math.random();
      if (pType < 0.33) { entity.subtype = 'SHIELD'; entity.color = POWERUPS.SHIELD.color; }
      else if (pType < 0.66) { entity.subtype = 'MAGNET'; entity.color = POWERUPS.MAGNET.color; }
      else { entity.subtype = 'DOUBLE'; entity.color = POWERUPS.DOUBLE.color; }
    } 
    else if (typeRoll > 0.8) {
      // Coin acts as small XP boost
      entity.type = 'COIN';
      entity.w = 30; entity.h = 30;
      entity.color = '#fbbf24';
    }
    else if (typeRoll > 0.6) {
      entity.type = 'RIVAL';
      entity.w = 70; entity.h = 130;
      entity.color = '#1e293b'; 
      entity.speed = currentSpeed * 0.7; 
    }
    else {
      entity.type = 'HAZARD_STATIC';
      entity.w = 80; entity.h = 150;
      entity.color = '#64748b'; 
      entity.speed = currentSpeed * 0.4; 
    }

    engine.current.entities.push(entity);
  };

  const update = (time: number) => {
    if (gameState !== 'PLAYING') return;

    const S = engine.current;
    if (!S.lastTime) S.lastTime = time;
    const dt = (time - S.lastTime) / 16.67; 
    S.lastTime = time;
    S.deltaTime = dt;

    const activeShip = SHIPS.find(s => s.id === profile.activeShip) || SHIPS[0];
    const upgrades = profile.upgrades;
    
    const maxSpeed = (activeShip.baseSpeed + (upgrades.speed * 0.1)) * 20;
    const handling = (activeShip.baseHandling + (upgrades.handling * 0.1)) * 0.2;
    const nitroBurn = 0.5 - (upgrades.nitro * 0.05);

    if (S.isNitro && S.nitro > 0) {
      S.targetSpeed = maxSpeed * 2.0;
      S.nitro -= nitroBurn * dt;
      triggerShake(3);
      if (Math.random() > 0.3) {
          spawnParticle(S.x + 15, S.y + 130, 'FIRE', '#ef4444', 1);
          spawnParticle(S.x + 55, S.y + 130, 'FIRE', '#f59e0b', 1);
      }
    } else {
      S.targetSpeed = maxSpeed;
    }
    
    S.nitro = Math.max(0, Math.min(100, S.nitro));
    S.speed = lerp(S.speed, S.targetSpeed, 0.05 * dt);
    
    const oldDistanceBlock = Math.floor(S.distance / 100);
    S.distance += S.speed * dt;
    const newDistanceBlock = Math.floor(S.distance / 100);
    
    if (newDistanceBlock > oldDistanceBlock) {
        S.nitro = Math.min(100, S.nitro + 10);
    }

    S.score += Math.floor(S.speed * 0.1 * (S.doublePoints > 0 ? 2 : 1) * dt);

    const targetX = (S.lane * LANE_WIDTH) + (CANVAS_WIDTH - (4 * LANE_WIDTH)) / 2 + (LANE_WIDTH/2) - 35;
    S.x = lerp(S.x, targetX, handling * dt);
    S.x = Math.max(0, Math.min(CANVAS_WIDTH - 70, S.x));

    if (S.shield > 0) S.shield -= 16 * dt;
    if (S.magnet > 0) S.magnet -= 16 * dt;
    if (S.doublePoints > 0) S.doublePoints -= 16 * dt;

    const spawnRate = Math.max(400, 1500 - (S.speed * 20));
    if (time - S.lastSpawn > spawnRate) {
      spawnEntity(S.speed);
      S.lastSpawn = time;
    }

    S.entities.forEach((e) => {
      const relSpeed = S.speed - e.speed; 
      e.y += relSpeed * dt; 

      if (e.type === 'RIVAL') {
        e.speed += 0.01 * dt;
      }

      if (S.magnet > 0 && e.type === 'COIN') {
        e.x = lerp(e.x, S.x, 0.1 * dt);
        e.y = lerp(e.y, S.y, 0.1 * dt);
      }

      const playerRect: Entity = {
        id: 'player',
        x: S.x + 10,
        y: S.y + 10,
        w: 50,
        h: 110,
        type: 'PLAYER',
        lane: 0,
        speed: 0,
        color: ''
      };
      
      if (checkRectCollision(playerRect, e)) {
        if (e.type === 'COIN') {
          e.dead = true;
          // Coins act as small score/xp boosts now, no credits
          S.score += 50; 
          spawnParticle(e.x, e.y, 'TEXT', '#fbbf24', 1, '+50');
        } 
        else if (e.type === 'POWERUP') {
          e.dead = true;
          if (e.subtype === 'SHIELD') S.shield = POWERUPS.SHIELD.duration;
          if (e.subtype === 'MAGNET') S.magnet = POWERUPS.MAGNET.duration;
          if (e.subtype === 'DOUBLE') S.doublePoints = POWERUPS.DOUBLE.duration;
          spawnParticle(S.x, S.y, 'GLOW', e.color, 10);
        }
        else if (!e.dead) {
          if (S.shield > 0) {
            e.dead = true;
            S.shield = 0;
            triggerShake(10);
            spawnParticle(e.x, e.y, 'SPARK', '#06b6d4', 20);
          } else {
            handleGameOver();
          }
        }
      }

      if (e.y > CANVAS_HEIGHT + 100) e.dead = true;
    });

    S.entities = S.entities.filter(e => !e.dead);

    for (let i = S.particles.length - 1; i >= 0; i--) {
      const p = S.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) S.particles.splice(i, 1);
    }

    if (S.shake > 0) S.shake *= 0.9;

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const S = engine.current;
    const biome = BIOMES[S.biomeIdx];

    ctx.save();
    if (S.shake > 0.5) {
      ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, biome.sky);
    grad.addColorStop(1, biome.road);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = biome.grid;
    ctx.lineWidth = 2;
    const offsetX = (CANVAS_WIDTH - (4 * LANE_WIDTH)) / 2;
    
    for (let i = 0; i <= 4; i++) {
      const x = offsetX + (i * LANE_WIDTH);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    S.roadOffset = (S.roadOffset + S.speed * 0.5) % 100;
    ctx.strokeStyle = biome.grid;
    for (let i = 0; i < 20; i++) {
      const y = (i * 50 + S.roadOffset) % CANVAS_HEIGHT;
      ctx.beginPath();
      ctx.moveTo(offsetX, y);
      ctx.lineTo(CANVAS_WIDTH - offsetX, y);
      ctx.stroke();
    }

    S.entities.forEach(e => {
      ctx.save();
      ctx.translate(e.x + e.w/2, e.y + e.h/2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-e.w/2 + 10, -e.h/2 + 10, e.w, e.h);

      if (e.type === 'COIN') {
        ctx.fillStyle = e.color;
        ctx.beginPath(); ctx.arc(0, 0, e.w/2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '20px monospace'; ctx.textAlign = 'center'; ctx.fillText('★', 0, 6);
      } 
      else if (e.type === 'POWERUP') {
        ctx.fillStyle = e.color;
        ctx.rotate(Date.now() / 200);
        ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h);
      }
      else {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.roundRect(-e.w/2, -e.h/2, e.w, e.h, 10);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-e.w/2 + 5, e.h/2 - 10, 15, 5); 
        ctx.fillRect(e.w/2 - 20, e.h/2 - 10, 15, 5);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-e.w/2 + 5, -e.h/2 + 10, e.w - 10, 20);
      }
      ctx.restore();
    });

    const shipDef = SHIPS.find(s => s.id === profile.activeShip);
    ctx.save();
    ctx.translate(S.x + 35, S.y + 70); 
    
    const tilt = (S.lane * LANE_WIDTH + offsetX + LANE_WIDTH/2 - 35 - S.x) * -0.08;
    ctx.rotate(tilt * Math.PI / 180);

    if (S.shield > 0) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#06b6d4';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI*2); ctx.stroke();
    }

    ctx.fillStyle = shipDef?.color || '#facc15';
    ctx.shadowBlur = S.isNitro ? 20 : 5;
    ctx.shadowColor = shipDef?.color || '#facc15';
    ctx.beginPath();
    ctx.roundRect(-30, -60, 60, 120, 12);
    ctx.fill();

    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.roundRect(-25, -20, 50, 50, 8);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-22, -45, 44, 15, 4);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(-22, 35, 44, 10, 4);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.fillRect(-15, -5, 30, 10);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TAXI', 0, 3);

    ctx.fillStyle = '#000';
    for(let i=0; i<6; i++) {
        if (i%2===0) ctx.fillRect(-30, -50 + i*20, 5, 10);
        else ctx.fillRect(25, -50 + i*20, 5, 10);
    }

    ctx.fillStyle = '#fef08a'; 
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fef08a';
    ctx.beginPath();
    ctx.roundRect(-25, -62, 12, 6, 2);
    ctx.roundRect(13, -62, 12, 6, 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(-25, 58, 12, 4, 2);
    ctx.roundRect(13, 58, 12, 4, 2);
    ctx.fill();

    if (S.isNitro && S.nitro > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-18, 62);
      ctx.lineTo(-24, 62 + Math.random() * 40 + 20);
      ctx.lineTo(-12, 62);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(18, 62);
      ctx.lineTo(24, 62 + Math.random() * 40 + 20);
      ctx.lineTo(12, 62);
      ctx.fill();
      
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(-18, 62);
      ctx.lineTo(-22, 62 + Math.random() * 20 + 10);
      ctx.lineTo(-14, 62);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(18, 62);
      ctx.lineTo(22, 62 + Math.random() * 20 + 10);
      ctx.lineTo(14, 62);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    
    ctx.restore();

    S.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      if (p.type === 'TEXT') {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(p.text || '', p.x, p.y);
      } else if (p.type === 'FIRE') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.size/2, p.y + p.size);
        ctx.lineTo(p.x + p.size/2, p.y + p.size);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1.0;

    const gradV = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 200, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 500);
    gradV.addColorStop(0, 'transparent');
    gradV.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = gradV;
    ctx.fillRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.restore();
  };

  const handleGameOver = () => {
    setGameState('GAMEOVER');
    
    const finalScore = Math.floor(engine.current.score);
    // Award Karma to global profile with transaction log
    StorageService.addPoints(Math.floor(finalScore / 10), finalScore, 'game_reward', 'Speed Zone Completion');
    
    // Update Local Profile Level
    const xpEarned = finalScore;
    setProfile(prev => ({
      ...prev,
      xp: prev.xp + xpEarned,
      level: Math.floor((prev.xp + xpEarned) / 1000) + 1,
      highScore: Math.max(prev.highScore, finalScore)
    }));
  };

  const handleStart = () => {
    engine.current = {
      ...engine.current,
      score: 0, distance: 0, speed: 0, 
      entities: [], particles: [], 
      shield: 0, magnet: 0, doublePoints: 0,
      nitro: 100, lastTime: 0 
    };
    setGameState('PLAYING');
    requestRef.current = requestAnimationFrame(update);
  };

  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
      if (gameState !== 'PLAYING') return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const x = clientX - rect.left;
      const mid = rect.width / 2;
      
      if (x < mid && engine.current.lane > 0) engine.current.lane--;
      else if (x >= mid && engine.current.lane < 3) engine.current.lane++;
  };

  const handleInput = (e: KeyboardEvent) => {
    if (gameState !== 'PLAYING') return;
    if (e.key === 'ArrowLeft' && engine.current.lane > 0) engine.current.lane--;
    if (e.key === 'ArrowRight' && engine.current.lane < 3) engine.current.lane++;
    if (e.key === 'ArrowUp') engine.current.isNitro = true;
    if (e.key === 'Escape') setGameState(prev => prev === 'PAUSED' ? 'PLAYING' : 'PAUSED');
  };
  
  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') engine.current.isNitro = false;
  };

  useEffect(() => {
    window.addEventListener('keydown', handleInput);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      engine.current.lastTime = performance.now();
      requestRef.current = requestAnimationFrame(update);
    }
  }, [gameState]);

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden select-none">
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full max-w-xl aspect-[3/4] max-h-screen md:border-x-2 md:border-slate-800 shadow-2xl bg-black" onMouseDown={handleTouch} onTouchStart={handleTouch}>
          <canvas ref={canvasRef} width={600} height={800} className="w-full h-full object-cover block" />
          
          {gameState === 'PLAYING' && (
            <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                    {Math.floor(engine.current.speed * 6)} <span className="text-lg text-slate-500">MPH</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded text-xs font-bold border border-yellow-500/50">
                      SCORE: {Math.floor(engine.current.score)}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 items-end">
                  {engine.current.shield > 0 && <div className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500 rounded font-bold text-xs animate-pulse">SHIELD ACTIVE</div>}
                  {engine.current.magnet > 0 && <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500 rounded font-bold text-xs animate-pulse">MAGNET ACTIVE</div>}
                  {engine.current.doublePoints > 0 && <div className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500 rounded font-bold text-xs animate-pulse">2X SCORE</div>}
                </div>
              </div>

              <div className="w-full max-w-md mx-auto">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500 mb-1">
                  <span>Nitro Fuel</span>
                  <span className={engine.current.nitro < 20 ? "text-red-500 animate-bounce" : "text-cyan-500"}>{Math.floor(engine.current.nitro)}%</span>
                </div>
                <div className="h-4 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-full p-0.5">
                  <div 
                    className="h-full rounded-full transition-all duration-75 shadow-[0_0_15px_currentColor]"
                    style={{ 
                      width: `${engine.current.nitro}%`, 
                      backgroundColor: engine.current.nitro < 30 ? '#ef4444' : '#06b6d4',
                      color: engine.current.nitro < 30 ? '#ef4444' : '#06b6d4'
                    }} 
                  />
                </div>
                <p className="text-[9px] text-center mt-1 text-slate-500 uppercase tracking-widest">+10% Charge per 100m</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {gameState === 'MENU' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 p-4 md:p-8">
            <div className="flex flex-col justify-center text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest rounded">Omega Protocol</span>
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">V3.1.0</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.8] mb-8 text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-600">
                Speed<br/><span className="text-red-600">Zone</span>
              </h1>
              
              <div className="flex justify-center md:justify-start gap-4 mb-12">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Pilot Rank</div>
                  <div className="text-2xl font-black text-white">LVL {profile.level}</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 min-w-[120px]">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Best Score</div>
                  <div className="text-2xl font-black text-yellow-400">{profile.highScore.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button onClick={handleStart} className="flex-1 bg-white text-black h-16 rounded-xl font-black text-xl uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 group">
                  <Play size={24} className="group-hover:fill-current" /> Initialize
                </button>
                <div className="flex gap-4">
                    <button onClick={() => setGameState('GARAGE')} className="flex-1 md:w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 transition-all border border-slate-700">
                    <ShoppingBag size={24} className="text-slate-300" />
                    </button>
                    <button onClick={onExit} className="flex-1 md:w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-red-900/50 hover:border-red-500 transition-all border border-slate-700 group">
                    <ArrowLeft size={24} className="text-slate-300 group-hover:text-red-500" />
                    </button>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center relative">
              <div className="absolute inset-0 bg-red-600/20 blur-[100px] rounded-full" />
              <div className="relative w-64 h-96 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 flex flex-col items-center justify-center transform rotate-6 hover:rotate-0 transition-all duration-500">
                <div className="w-20 h-20 bg-red-500 rounded-2xl mb-8 shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-pulse" />
                <h3 className="text-2xl font-black uppercase italic text-center mb-2">Ready to Race</h3>
                <p className="text-slate-400 text-center text-xs font-medium leading-relaxed">
                  Earn Pilot XP to unlock advanced chassis prototypes. Global Karma awarded on completion.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- GARAGE UI --- */}
      {gameState === 'GARAGE' && (
        <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col">
          <div className="p-6 md:p-8 flex justify-between items-center border-b border-white/5 bg-slate-900/50 backdrop-blur">
            <div>
              <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">The Hangar</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Level Up to Unlock</p>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-right hidden md:block">
                <div className="text-[10px] text-slate-500 font-black uppercase">Current Level</div>
                <div className="text-2xl font-mono font-black text-white">{profile.level}</div>
              </div>
              <button onClick={() => setGameState('MENU')} className="bg-white/10 p-3 md:p-4 rounded-xl hover:bg-white text-white hover:text-black transition-all">
                <ArrowLeft size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase text-slate-500 mb-4">Chassis Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SHIPS.map(ship => {
                  const unlocked = profile.level >= ship.requiredLevel;
                  const active = profile.activeShip === ship.id;
                  return (
                    <button 
                      key={ship.id}
                      onClick={() => {
                        if (unlocked) setProfile(p => ({ ...p, activeShip: ship.id }));
                      }}
                      className={`relative p-6 rounded-3xl border-2 text-left transition-all group overflow-hidden ${active ? 'border-red-600 bg-red-600/10' : 'border-slate-800 bg-slate-900 hover:border-slate-600'} ${!unlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${active ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {unlocked ? <Unlock size={18}/> : <Lock size={18}/>}
                        </div>
                        {!unlocked && <span className="text-red-400 font-mono font-black text-sm">LVL {ship.requiredLevel}</span>}
                      </div>
                      <div className="relative z-10">
                        <div className="text-2xl font-black italic uppercase mb-1">{ship.name}</div>
                        <div className="flex gap-2">
                           <div className="h-1 w-8 bg-slate-700 rounded-full overflow-hidden"><div style={{width: `${ship.baseSpeed*50}%`}} className="h-full bg-white"/></div>
                           <div className="h-1 w-8 bg-slate-700 rounded-full overflow-hidden"><div style={{width: `${ship.baseNitro*50}%`}} className="h-full bg-blue-500"/></div>
                        </div>
                      </div>
                      <div className={`absolute -right-4 -bottom-4 w-32 h-32 blur-[40px] rounded-full opacity-20 transition-opacity`} style={{background: ship.color}} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-slate-800">
              <h3 className="text-lg font-black uppercase text-slate-500 mb-8">Performance Tuning</h3>
              
              <div className="space-y-6 md:space-y-8">
                {[
                  { id: 'speed', label: 'Engine Output', icon: Gauge, desc: 'Increases top speed cap.' },
                  { id: 'handling', label: 'Traction Control', icon: Activity, desc: 'Improves lane switching response.' },
                  { id: 'nitro', label: 'Reactor Efficiency', icon: Flame, desc: 'Reduces nitro fuel consumption.' }
                ].map((stat: any) => {
                  // Upgrades unlock every 5 levels for simplicity in this no-currency model
                  // Actually, let's just make upgrades tied to level. 
                  // Level 1 = 0 upgrades. Level 2 = 1 upgrade available to apply? 
                  // Simplest: Auto-scale upgrades with Level up to max 5.
                  const level = Math.min(5, Math.floor((profile.level - 1) / 2));
                  
                  return (
                    <div key={stat.id} className="bg-black/40 p-4 md:p-6 rounded-3xl border border-white/5">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                          <stat.icon size={18} />
                        </div>
                        <div>
                          <div className="font-black uppercase text-sm">{stat.label}</div>
                          <div className="text-xs text-slate-500">{stat.desc}</div>
                        </div>
                        <div className="ml-auto text-xl font-black italic text-slate-700">TIER {level}</div>
                      </div>
                      
                      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                        {[0,1,2,3,4].map(i => (
                          <div key={i} className={`flex-1 rounded-sm ${i < level ? 'bg-red-500' : 'bg-slate-700'}`} />
                        ))}
                      </div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-2">Auto-scales with Pilot Level</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 bg-red-950/90 backdrop-blur-xl flex items-center justify-center z-[100] animate-in zoom-in duration-300 p-4">
          <div className="text-center w-full max-w-lg">
            <AlertOctagon size={80} className="text-red-500 mb-6 mx-auto animate-bounce" />
            <h2 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none">Wrecked</h2>
            <p className="text-red-200 uppercase tracking-[0.5em] font-bold text-xs mb-12">Critical Hull Failure</p>
            
            <div className="bg-black/40 p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/10 mb-10 w-full">
              <div className="grid grid-cols-2 gap-8 text-left">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Distance</div>
                  <div className="text-3xl md:text-4xl font-mono font-black text-white">{Math.floor(engine.current.distance)}<span className="text-sm text-slate-500 ml-2">M</span></div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Score</div>
                  <div className="text-3xl md:text-4xl font-mono font-black text-yellow-400">{Math.floor(engine.current.score)}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button onClick={handleStart} className="bg-white text-black px-12 py-6 rounded-2xl font-black uppercase text-xl hover:scale-105 transition-transform flex items-center justify-center gap-3">
                <RotateCcw size={24}/> Retry
              </button>
              <button onClick={() => setGameState('MENU')} className="bg-black/40 text-white px-8 py-6 rounded-2xl font-black uppercase text-xl hover:bg-black/60 transition-colors">
                Menu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SpeedZone;
