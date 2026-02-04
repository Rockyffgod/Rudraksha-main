
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, BarChart3, Settings, Flame, Zap, Brain, Target, 
  RefreshCw, Cpu, Gamepad2, ArrowRight, Loader2, 
  ArrowLeft, Volume2, VolumeX, Monitor, Smartphone, X, Power,
  Trophy, Star, Activity, Shield, Info, Search, Filter,
  TrendingUp, Award, Clock, ChevronRight, Mountain, CheckCircle2, Hexagon,
  Dice5, Crown, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Services & Types
import { StorageService } from '../services/storageService';
import { UserProfile, AppSettings } from '../types';

// UI Components
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { GameShell } from '../components/ui/GameShell';

// Games
import { SpeedZone } from '../games/SpeedZone';
import { MemoryShore } from '../games/MemoryShore';
import { AttentionTracks } from '../games/AttentionTracks';
import { MentalAgility } from '../games/MentalAgility';
import { LogicFuses } from '../games/LogicFuses';
import { DanpheRush } from '../games/DanpheRush';
import { ArcadeLeaderboard } from '../games/ArcadeLeaderboard';
import { Ludo } from '../games/Ludo';
import { Chess } from '../games/Chess';
import { MandalaMind } from '../games/MandalaMind';

// --- CONSTANTS & DATA ---
const CATEGORIES = [
  { id: 'all', label: 'All Protocols', icon: GridIcon },
  { id: 'speed', label: 'Reflex', icon: Zap },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'focus', label: 'Focus', icon: Target },
  { id: 'logic', label: 'Logic', icon: Cpu },
  { id: 'classic', label: 'Retro', icon: Gamepad2 },
];

const GAMES = [
  {
    id: 'speed',
    title: 'Speed Zone',
    desc: 'Calibrate your neural response time in a high-velocity environment.',
    icon: Zap,
    color: 'red',
    category: 'speed',
    difficulty: 'Advanced',
    time: '2m',
    points: '500+',
    featured: true
  },
  {
    id: 'mandala',
    title: 'Mandala Mind',
    desc: 'Synchronize your memory with complex audio-visual patterns.',
    icon: Hexagon,
    color: 'purple',
    category: 'memory',
    difficulty: 'Intermediate',
    time: '∞',
    points: 'VAR'
  },
  {
    id: 'ludo',
    title: 'Ludo King',
    desc: 'Strategic board simulation for multiple neural networks.',
    icon: Dice5,
    color: 'purple',
    category: 'classic',
    difficulty: 'Easy',
    time: '15m',
    points: '1000+',
    comingSoon: true // Changed to Coming Soon
  },
  {
    id: 'chess',
    title: 'Royal Chess',
    desc: 'Grandmaster tactical evaluation protocol.',
    icon: Crown,
    color: 'white',
    category: 'logic',
    difficulty: 'Master',
    time: '∞',
    points: 'VAR',
    comingSoon: true // Changed to Coming Soon
  },
  {
    id: 'danphe',
    title: 'Danphe Rush',
    desc: 'Navigate the national bird through high-altitude obstacles.',
    icon:  TrendingUp, 
    color: 'emerald',
    category: 'classic',
    difficulty: 'Hard',
    time: '∞',
    points: 'VAR',
    comingSoon: false // Active
  },
  {
    id: 'memory',
    title: 'Memory Shore',
    desc: 'Identify and reconstruct complex visual patterns from short-term data.',
    icon: Brain,
    color: 'cyan',
    category: 'memory',
    difficulty: 'Intermediate',
    time: '3m',
    points: '400+'
  },
  // AttentionTracks (Focus Tracks) Removed as requested
  {
    id: 'flexibility',
    title: 'Mental Agility',
    desc: 'Switch between conflicting logic protocols without losing sync.',
    icon: RefreshCw,
    color: 'pink',
    category: 'focus',
    difficulty: 'Intermediate',
    time: '3m',
    points: '350+'
  },
  {
    id: 'problem',
    title: 'Logic Circuits',
    desc: 'Debug and complete sequential energy paths to restore system flow.',
    icon: Cpu,
    color: 'emerald',
    category: 'logic',
    difficulty: 'Advanced',
    time: '4m',
    points: '600+'
  }
];

// --- HELPER COMPONENTS ---

function GridIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

const EnhancedNeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    const particleCount = 60;
    const connectionDistance = 150;

    class Particle {
      x: number; y: number; vx: number; vy: number; size: number; baseSize: number;
      constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.baseSize = Math.random() * 2 + 1;
        this.size = this.baseSize;
      }
      update(width: number, height: number) {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        const dx = this.x - mouseRef.current.x;
        const dy = this.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          this.size = this.baseSize * 2;
        } else {
          this.size = this.baseSize;
        }
      }
      draw() {
        if (!ctx) return;
        ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas.width, canvas.height));
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(canvas.width, canvas.height);
        particles[i].draw();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.15;
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    resize();
    animate();
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
};

const ArcadeSettingsModal = ({ onClose }: { onClose: () => void }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    StorageService.getSettings().then(setSettings);
  }, []);

  const toggleSetting = async (key: keyof AppSettings) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: !settings[key as keyof AppSettings] };
    setSettings(newSettings);
    await StorageService.saveSettings(newSettings);
  };

  if (!settings) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
            <Settings size={20} className="text-indigo-500"/> System Config
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20}/>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <SettingToggle label="Audio FX" active={settings.soundEnabled} icon={Volume2} onClick={() => toggleSetting('soundEnabled')} />
          <SettingToggle label="Haptics" active={settings.hapticFeedback} icon={Smartphone} onClick={() => toggleSetting('hapticFeedback')} color="bg-emerald-500" />
          <SettingToggle label="High Perf" active={!settings.dataSaver} icon={Monitor} onClick={() => toggleSetting('dataSaver')} color="bg-purple-500" />
        </div>
      </motion.div>
    </div>
  );
};

const SettingToggle = ({ label, active, icon: Icon, onClick, color = "bg-indigo-500" }: any) => (
  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
    <div className="flex items-center gap-3 text-slate-300">
      <Icon size={20} />
      <span className="font-bold text-sm uppercase tracking-wide">{label}</span>
    </div>
    <button onClick={onClick} className={`w-12 h-6 rounded-full p-1 transition-colors ${active ? color : 'bg-slate-700'}`}>
      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

const SidebarIcon = ({ icon: Icon, active = false, label, onClick }: any) => (
  <motion.div 
    onClick={onClick}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    className="group relative flex items-center justify-center w-full py-4 cursor-pointer"
  >
    <div className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-[0_0_15px_#4f46e5]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
      <Icon size={24} />
    </div>
    <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[110] border border-white/10 shadow-2xl hidden md:block">
      {label}
    </div>
  </motion.div>
);

const GameCard = ({ game, onClick }: any) => {
  const { title, desc, icon: Icon, color, difficulty, time, points, comingSoon } = game;
  
  const styles: any = {
    red: { text: 'text-red-400', border: 'hover:border-red-500', shadow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]', bg: 'from-red-500/10' },
    cyan: { text: 'text-cyan-400', border: 'hover:border-cyan-500', shadow: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]', bg: 'from-cyan-500/20' },
    amber: { text: 'text-amber-400', border: 'hover:border-amber-500', shadow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]', bg: 'from-amber-500/10' },
    purple: { text: 'text-purple-400', border: 'hover:border-purple-500', shadow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]', bg: 'from-purple-500/10' },
    emerald: { text: 'text-emerald-400', border: 'hover:border-emerald-500', shadow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]', bg: 'from-emerald-500/10' },
    pink: { text: 'text-pink-400', border: 'hover:border-pink-500', shadow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]', bg: 'from-pink-500/10' },
    blue: { text: 'text-blue-400', border: 'hover:border-blue-500', shadow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]', bg: 'from-blue-500/10' },
    white: { text: 'text-gray-200', border: 'hover:border-gray-200', shadow: 'hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]', bg: 'from-gray-500/10' }
  }[color];

  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: comingSoon ? 0 : -5 }}
      whileTap={{ scale: comingSoon ? 1 : 0.98 }}
      onClick={() => !comingSoon && onClick(game.id)}
      className={`group relative h-80 md:h-96 rounded-[2rem] md:rounded-[2.5rem] bg-slate-900/40 backdrop-blur-md border border-white/10 overflow-hidden transition-all duration-500 ${comingSoon ? 'opacity-70 cursor-not-allowed' : `cursor-pointer ${styles.border} ${styles.shadow}`}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.bg} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      {comingSoon && (
          <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center pointer-events-none">
              <Lock size={48} className="text-white/50 mb-2"/>
              <span className="text-white/80 font-black uppercase tracking-widest text-xs">Coming Soon</span>
          </div>
      )}

      <div className="relative z-10 p-6 md:p-10 h-full flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-6">
            <div className={`p-3 md:p-4 bg-black/40 rounded-2xl border border-white/5 ${styles.text} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
              <Icon size={28} className="md:w-8 md:h-8" />
            </div>
            <div className="flex flex-col items-end gap-1">
               <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 bg-black/30 px-2 py-1 rounded-md border border-white/5">{difficulty}</span>
               <span className="text-[9px] md:text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10}/> {time}</span>
            </div>
          </div>
          
          <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none">{title}</h3>
          <p className="text-slate-400 font-medium text-xs md:text-sm leading-relaxed line-clamp-2">{desc}</p>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="text-slate-500">Max Potential</span>
            <span className={styles.text}>{points} Pts</span>
          </div>
          <div className="w-full h-1 md:h-1.5 bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               whileInView={{ width: '100%' }}
               className={`h-full bg-gradient-to-r ${styles.bg.replace('from-', 'bg-')}`} 
             />
          </div>
          <Button disabled={comingSoon} className={`w-full bg-white/5 border-white/10 ${!comingSoon ? 'group-hover:bg-white group-hover:text-black' : ''} transition-all duration-500 rounded-xl h-10 md:h-12 uppercase text-[10px] md:text-xs font-black tracking-widest`}>
            {comingSoon ? 'Locked' : 'Initiate Link'}
          </Button>
        </div>
      </div>
      
      <Icon size={180} className={`absolute -right-12 -bottom-12 opacity-[0.03] transition-all duration-1000 group-hover:opacity-[0.1] group-hover:rotate-12 ${styles.text}`} />
    </motion.div>
  );
};

// --- MAIN HUB COMPONENT ---

const Game: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeScreen, setActiveScreen] = useState('hub');
  const [activeCategory, setActiveCategory] = useState('all');
  
  const [profile, setProfile] = useState<UserProfile | null>(() => {
      try {
          const stored = localStorage.getItem('rudraksha_profile');
          return stored ? JSON.parse(stored) : null;
      } catch { return null; }
  });
  const [loading, setLoading] = useState(!profile);
  
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Weekly Stats Data
  const [weeklyStats, setWeeklyStats] = useState<number[]>([]);

  useEffect(() => {
    // Background refresh of profile & sessions
    const init = async () => {
        const [p, sessions] = await Promise.all([
            StorageService.getProfile(),
            StorageService.getGameSessions()
        ]);
        setProfile(p);
        
        // Calculate Weekly Stats (Last 7 Days)
        const stats = new Array(7).fill(0);
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        sessions.forEach(s => {
            const date = new Date(s.timestamp);
            if (date > oneWeekAgo) {
                // Calculate days difference (0 = today, 6 = 7 days ago)
                // We want to map it to the 7 bars
                // Simplified: Calculate day index relative to today
                // Actually, let's just create a map for last 7 days strings
                // For this visualization, let's map sessions to the last 7 calendar days
                
                const dayDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                if (dayDiff >= 0 && dayDiff < 7) {
                    // Store play time in minutes
                    stats[6 - dayDiff] += Math.ceil(s.durationSeconds / 60);
                }
            }
        });
        setWeeklyStats(stats);
        
        setLoading(false);
    };
    init();

    if (location.state && (location.state as any).autoLaunch) {
        setActiveScreen((location.state as any).autoLaunch);
        navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, activeScreen]); // Refresh stats when returning to hub

  const filteredGames = useMemo(() => {
    return GAMES.filter(g => {
      const matchesCategory = activeCategory === 'all' || g.category === activeCategory;
      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
        // Sort: Active games first, Coming Soon last
        if (a.comingSoon === b.comingSoon) return 0;
        return a.comingSoon ? 1 : -1;
    });
  }, [activeCategory, searchQuery]);

  const isGameActive = !['hub', 'leaderboard'].includes(activeScreen);

  if (loading) return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center">
      <div className="relative">
        <Loader2 className="animate-spin text-indigo-500 w-16 h-16" />
        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
      </div>
      <p className="mt-8 text-slate-500 font-black uppercase tracking-[0.5em] text-[10px]">Syncing Neural Data</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex overflow-hidden font-sans">
      
      {!isGameActive && <EnhancedNeuralBackground />}

      <div className="relative z-10 flex w-full h-full flex-col md:flex-row">
        
        {/* SIDEBAR */}
        {!isGameActive && (
          <aside className="w-full md:w-24 flex flex-row md:flex-col items-center justify-between md:justify-start px-4 md:px-0 py-3 md:py-8 bg-black/40 backdrop-blur-3xl border-b md:border-b-0 md:border-r border-white/5 shrink-0 z-[100] fixed bottom-0 md:relative md:bottom-auto">
            <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="hidden md:block mb-12">
               <Logo className="w-12 h-12" />
            </motion.div>
            
            <nav className="flex md:flex-col items-center justify-around w-full md:space-y-4 md:px-2">
              <SidebarIcon icon={Home} active={activeScreen === 'hub'} label="Main Hub" onClick={() => setActiveScreen('hub')} />
              <SidebarIcon icon={BarChart3} active={activeScreen === 'leaderboard'} label="Rankings" onClick={() => setActiveScreen('leaderboard')} />
              <SidebarIcon icon={Settings} active={showSettings} label="System" onClick={() => setShowSettings(true)} />
            </nav>

            <div className="hidden md:flex mt-auto space-y-6 flex-col items-center">
               <div className="p-1 bg-white/5 rounded-full border border-white/10">
                 <img src={profile?.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=Felix"} className="w-10 h-10 rounded-full" alt="avatar" />
               </div>
               <button 
                onClick={() => navigate('/')}
                className="group relative w-12 h-12 flex items-center justify-center bg-red-600/10 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300"
               >
                 <Power size={20} />
                 <span className="absolute left-full ml-4 px-2 py-1 bg-red-900 text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">Logout</span>
               </button>
            </div>
          </aside>
        )}

        {/* MAIN VIEW */}
        <main className={`flex-1 h-full overflow-y-auto no-scrollbar relative ${isGameActive ? 'bg-black' : ''} pb-20 md:pb-0`}>
          <AnimatePresence mode="wait">
            {activeScreen === 'hub' ? (
              <motion.div 
                key="hub" 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-16 py-8 md:py-12 pb-32"
              >
                {/* HEADER SECTION */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 md:mb-12 gap-6 md:gap-8">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-3">
                       <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full">System v4.2.0</span>
                       <span className="flex items-center gap-1 text-emerald-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                          <Activity size={12} /> Neural Link: Stable
                       </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-black italic tracking-tighter uppercase text-white leading-[0.9]">
                      Neural <span className="text-indigo-500">Arcade</span>
                    </h1>
                    <p className="text-base md:text-xl text-slate-400 font-medium">
                      Welcome back, <span className="text-white font-bold">{profile?.name?.split(' ')[0] || 'Operator'}</span>. Cognitive load is 12%.
                    </p>
                  </div>

                  <div className="flex gap-4 w-full md:w-auto">
                     <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-6 flex items-center gap-4 md:gap-6 shadow-2xl w-full md:w-auto">
                        <div className="flex flex-col">
                           <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Rank</span>
                           <span className="text-xl md:text-2xl font-black text-white italic">#1,402</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col">
                           <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Score</span>
                           <div className="flex items-center gap-2">
                              <Flame size={16} className="text-orange-500 fill-orange-500 md:w-5 md:h-5" />
                              <span className="text-xl md:text-2xl font-mono font-black text-white">{profile?.points?.toLocaleString() || '0'}</span>
                           </div>
                        </div>
                     </div>
                  </div>
                </header>

                {/* SEARCH & FILTER BAR */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 md:mb-12 sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-white/5">
                   <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text" 
                        placeholder="SEARCH PROTOCOLS..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 md:py-4 text-xs font-black tracking-widest focus:outline-none focus:border-indigo-500 transition-colors uppercase"
                      />
                   </div>
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id)}
                          className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                            activeCategory === cat.id 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          <cat.icon size={14} /> {cat.label}
                        </button>
                      ))}
                   </div>
                </div>

                {/* GAMES GRID */}
                <motion.div 
                  initial="hidden" animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                >
                  {filteredGames.length > 0 ? (
                    filteredGames.map(game => (
                      <GameCard key={game.id} game={game} onClick={setActiveScreen} />
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center">
                       <Info size={48} className="mx-auto text-slate-700 mb-4" />
                       <h3 className="text-slate-500 font-black uppercase tracking-widest">No Protocols Found</h3>
                    </div>
                  )}
                </motion.div>

                {/* DASHBOARD WIDGETS */}
                <section className="mt-12 md:mt-20 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                   <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900/20 to-slate-900/40 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-white/5 relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex justify-between items-center mb-6 md:mb-8">
                           <h2 className="text-xl md:text-2xl font-black italic uppercase text-white flex items-center gap-2">
                             <TrendingUp className="text-indigo-400" /> Neural Performance (Minutes)
                           </h2>
                           <button className="text-[9px] md:text-[10px] font-black text-indigo-400 hover:text-white transition-colors uppercase tracking-widest">Weekly Report</button>
                        </div>
                        <div className="h-32 md:h-48 flex items-end justify-between gap-2 px-2 md:px-4">
                           {weeklyStats.length > 0 ? weeklyStats.map((mins, i) => (
                             <div key={i} className="flex-1 flex flex-col items-center gap-2 md:gap-4 group">
                                <div className="text-[8px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity absolute mb-36">{mins}m</div>
                                <motion.div 
                                  initial={{ height: 0 }} whileInView={{ height: `${Math.min(100, (mins / 60) * 100)}%` }}
                                  className={`w-full rounded-t-lg md:rounded-t-xl transition-all cursor-help ${mins > 0 ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-400 group-hover:to-white' : 'bg-white/5 h-1'}`}
                                />
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">D-{6-i}</span>
                             </div>
                           )) : (
                               <div className="w-full text-center text-slate-600 font-bold uppercase tracking-widest text-xs">No data recorded yet</div>
                           )}
                        </div>
                      </div>
                      <div className="absolute top-1/2 right-0 -translate-x-1/2 opacity-10 pointer-events-none">
                         <Activity size={200} strokeWidth={1} className="md:w-[300px] md:h-[300px]" />
                      </div>
                   </div>

                   <div className="bg-slate-900/40 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-white/5">
                      <h2 className="text-xl md:text-2xl font-black italic uppercase text-white mb-6 md:mb-8 flex items-center gap-2">
                        <Award className="text-amber-400" /> Medals
                      </h2>
                      <div className="space-y-4">
                         {[
                           { label: 'Reflex Master', desc: 'Reach 0.2s reaction time', icon: Zap, color: 'text-red-400' },
                           { label: 'Focus Guru', desc: '5min session in focus tracks', icon: Target, color: 'text-amber-400' },
                           { label: 'Grandmaster', desc: 'Reach level 50 in logic', icon: Shield, color: 'text-indigo-400' }
                         ].map((item, i) => (
                           <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                              <div className={`p-3 bg-black/40 rounded-xl ${item.color}`}>
                                 <item.icon size={20} />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-white uppercase tracking-widest">{item.label}</p>
                                 <p className="text-[9px] md:text-[10px] text-slate-500 font-medium">{item.desc}</p>
                              </div>
                              <ChevronRight size={14} className="ml-auto text-slate-700" />
                           </div>
                         ))}
                      </div>
                   </div>
                </section>
              </motion.div>
            ) : activeScreen === 'leaderboard' ? (
                <ArcadeLeaderboard onExit={() => setActiveScreen('hub')} />
            ) : (
              /* --- GAME SHELL WRAPPER --- */
              <motion.div key="game-view" className="h-full w-full">
                {activeScreen === 'speed' && (
                  <SpeedZone onExit={() => setActiveScreen('hub')} />
                )}
                {activeScreen === 'memory' && (
                  <MemoryShore onExit={() => setActiveScreen('hub')} />
                )}
                {activeScreen === 'attention' && (
                  <GameShell gameId="attention" title="Focus Tracks" onExit={() => setActiveScreen('hub')}>
                    {({ onGameOver }) => <AttentionTracks onExit={() => setActiveScreen('hub')} />}
                  </GameShell>
                )}
                {activeScreen === 'flexibility' && (
                  <MentalAgility onExit={() => setActiveScreen('hub')} />
                )}
                {activeScreen === 'problem' && (
                  <GameShell gameId="logic" title="Logic Circuits" onExit={() => setActiveScreen('hub')}>
                    {({ onGameOver }) => <LogicFuses onExit={() => setActiveScreen('hub')} />}
                  </GameShell>
                )}
                {activeScreen === 'danphe' && (
                  <DanpheRush onExit={() => setActiveScreen('hub')} />
                )}
                {activeScreen === 'ludo' && (
                  <Ludo onExit={() => setActiveScreen('hub')} />
                )}
                {activeScreen === 'chess' && (
                  <Chess onExit={() => setActiveScreen('hub')} />
                )}
                {activeScreen === 'mandala' && (
                  <MandalaMind onExit={() => setActiveScreen('hub')} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {showSettings && <ArcadeSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default Game;
