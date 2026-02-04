
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { UserProfile, Task, TaskStatus, Priority, FTLMission } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  ArrowRight, CheckSquare, Loader2, 
  Calendar as CalendarIcon, Zap, 
  Coins, 
  Library as LibraryIcon, MessageCircle, MapPin, Activity, 
  Gamepad2, CheckCircle2, Camera,
  ListTodo, Siren, Utensils, Bot, Shield, ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- COMPONENTS ---

const XPToast = ({ amount, onComplete }: { amount: number, onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute top-4 right-4 z-[100] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2 bg-yellow-500 text-black px-3 py-1.5 rounded-full shadow-lg font-black text-xs uppercase tracking-widest">
        <Zap size={12} className="fill-black" />
        <span>+{amount} XP</span>
      </div>
    </div>
  );
};

const CountUp = ({ end, duration = 1500 }: { end: number, duration?: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const update = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * end));
      if (progress < 1) animationFrame = requestAnimationFrame(update);
    };
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  return <>{count}</>;
};

const getFrameStyle = (id?: string) => {
  if (!id || id === 'none') return 'ring-2 ring-white/30';
  if (id === 'unicorn') return 'ring-2 ring-pink-400 shadow-[0_0_10px_#f472b6]';
  if (id === 'bunny') return 'ring-2 ring-white shadow-sm';
  if (id === 'royal') return 'ring-2 ring-yellow-500 shadow-[0_0_10px_#eab308]';
  if (id === 'dreamy') return 'ring-2 ring-sky-300 border-dashed';
  if (id === 'witch') return 'ring-2 ring-purple-600 shadow-[0_0_10px_#9333ea]';
  if (id === 'fox') return 'ring-2 ring-orange-500';
  if (id === 'fairy') return 'ring-2 ring-teal-300 shadow-[0_0_10px_#5eead4]';
  if (id === 'nature') return 'ring-2 ring-green-500 border-green-300';
  if (id === 'dark') return 'ring-2 ring-gray-800 shadow-[0_0_10px_#000]';
  if (id === 'moon') return 'ring-2 ring-slate-300 shadow-[0_0_10px_#cbd5e1]';
  if (id === 'cyber') return 'ring-2 ring-cyan-400 shadow-[0_0_10px_#22d3ee]';
  if (id === 'vintage') return 'ring-4 ring-amber-700 border-double';
  if (id === 'neon') return 'ring-2 ring-lime-400 shadow-[0_0_10px_#a3e635] animate-pulse';
  if (id === 'frame_gold') return 'ring-2 ring-yellow-400 border-2 border-yellow-600 shadow-[0_0_15px_#eab308]';
  return 'ring-2 ring-white/30';
};

// --- DATA ---

const SLOGANS = [
  { en: "Small Country, Big Thinking", ne: "सानो देश, ठूलो सोच" },
  { en: "Heritage is Identity", ne: "सम्पदा नै पहिचान हो" },
  { en: "Unity in Diversity", ne: "विविधतामा एकता" },
  { en: "Digital Nepal, Smart Future", ne: "डिजिटल नेपाल, स्मार्ट भविष्य" },
];

// --- RENDERERS ---

interface TaskItemProps {
  task: Task;
  onComplete: (task: Task) => void | Promise<void>;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onComplete }) => (
  <div className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${task.priority === Priority.HIGH ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`} />
          <div className="min-w-0">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider truncate">{task.subject}</p>
              <p className="text-sm font-bold text-gray-200 truncate">{task.title}</p>
          </div>
      </div>
      <button onClick={(e) => { e.preventDefault(); onComplete(task); }} className="p-2 text-gray-500 hover:text-green-400 transition-colors">
          <CheckCircle2 size={18} />
      </button>
  </div>
);

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  // Data State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [missions, setMissions] = useState<FTLMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // UI State
  const [xpGain, setXpGain] = useState<number | null>(null);
  const [sloganIndex, setSloganIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    const sloganTimer = setInterval(() => setSloganIndex(prev => (prev + 1) % SLOGANS.length), 4000);

    const fetchData = async () => {
      setLoading(true);
      const [p, t_data, m] = await Promise.all([
        StorageService.getProfile(),
        StorageService.getTasks(),
        StorageService.getMissions()
      ]);
      setProfile(p);
      setTasks(t_data);
      setMissions(m);
      setLoading(false);
    };
    fetchData();

    const handleUpdate = async () => {
        const [p, t_data, m] = await Promise.all([
          StorageService.getProfile(),
          StorageService.getTasks(),
          StorageService.getMissions()
        ]);
        if (p && profile && p.xp > profile.xp) {
            setXpGain(p.xp - profile.xp);
        }
        setProfile(p);
        setTasks(t_data);
        setMissions(m);
    };

    window.addEventListener('rudraksha-profile-update', handleUpdate);
    return () => {
        clearInterval(timer);
        clearInterval(sloganTimer);
        window.removeEventListener('rudraksha-profile-update', handleUpdate);
    };
  }, [profile?.xp]);

  const handleQuickCompleteTask = async (task: Task) => {
    const updatedStatus = TaskStatus.COMPLETED;
    await StorageService.saveTask({ ...task, status: updatedStatus });
    await StorageService.addPoints(10, 50); 
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    window.dispatchEvent(new Event('rudraksha-profile-update'));
  };

  if (loading && !profile) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="animate-spin text-red-600 w-12 h-12" /></div>;

  const dateString = currentDate.toLocaleDateString(language === 'ne' ? 'ne-NP' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const currentXP = profile?.xp || 0;
  const userLevel = Math.floor(currentXP / 500) + 1;
  const xpProgress = Math.min(100, Math.round(((currentXP - ((userLevel - 1) * 500)) / 500) * 100));
  const pendingTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED).slice(0, 3);
  const activeFTL = missions.filter(m => m.status === 'active');
  const currentSlogan = SLOGANS[sloganIndex];

  // Define Sections Logic
  const SECTIONS = [
    {
      title: t('ACADEMIC', 'ACADEMIC'),
      color: 'text-indigo-500',
      items: [
        { to: '/study-buddy', label: t('Rudra AI', 'Rudra AI'), icon: Bot, color: 'text-indigo-400', bg: 'bg-indigo-500/10', desc: t('Your Personal AI Tutor', 'Your Personal AI Tutor') },
        { to: '/planner', label: t('Planner', 'Planner'), icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10', desc: `${pendingTasks.length} ${t('Pending Tasks', 'Pending Tasks')}` },
        { to: '/library', label: t('Library', 'Library'), icon: LibraryIcon, color: 'text-amber-400', bg: 'bg-amber-500/10', desc: t('Curriculum Resources', 'Curriculum Resources') },
      ]
    },
    {
      title: t('CULTURE', 'CULTURE') + ' & ' + t('LIFESTYLE', 'LIFESTYLE'),
      color: 'text-rose-500',
      items: [
        { to: '/culture', label: t('Calendar', 'Calendar'), icon: CalendarIcon, color: 'text-rose-400', bg: 'bg-rose-500/10', desc: dateString },
        { to: '/map', label: t('Heritage Map', 'Heritage Map'), icon: MapPin, color: 'text-red-400', bg: 'bg-red-500/10', desc: t('Explore Nepal', 'Explore Nepal') },
        { to: '/recipes', label: t('Kitchen', 'Kitchen'), icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-500/10', desc: t('Traditional Recipes', 'Traditional Recipes') },
      ]
    },
    {
      title: t('COMMUNITY', 'COMMUNITY') + ' & ' + t('UTILITIES', 'UTILITIES'),
      color: 'text-blue-500',
      items: [
        { to: '/community-chat', label: t('Community', 'Community'), icon: MessageCircle, color: 'text-blue-400', bg: 'bg-blue-500/10', desc: t('Global Chat', 'Global Chat') },
        { to: '/safety', label: t('Safety', 'Safety'), icon: Siren, color: 'text-red-500', bg: 'bg-red-500/10', desc: activeFTL.length > 0 ? `${activeFTL.length} ${t('Active Alerts', 'Active Alerts')}` : t('System Secure', 'System Secure') },
        { to: '/health', label: t('Wellness', 'Wellness'), icon: Activity, color: 'text-teal-400', bg: 'bg-teal-500/10', desc: t('Health Tracker', 'Health Tracker') },
        { to: '/arcade', label: t('Arcade', 'Arcade'), icon: Gamepad2, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', desc: t('Play & Earn', 'Play & Earn') },
        { to: '/rewards', label: t('Karma Bazaar', 'Karma Bazaar'), icon: Coins, color: 'text-yellow-400', bg: 'bg-yellow-500/10', desc: t('Redeem Points', 'Redeem Points') },
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-8 pb-24">
      
      {/* 1. HERO SECTION */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="absolute right-0 top-0 p-32 bg-red-600/20 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-6">
                  <div onClick={() => navigate('/profile', { state: { action: 'avatar' } })} className="relative cursor-pointer group/avatar">
                      <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] overflow-hidden border-2 border-white/20 shadow-2xl ${getFrameStyle(profile?.frameId)}`}>
                          <img src={profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name}`} className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110 duration-700"/>
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-black/80 backdrop-blur text-white p-1.5 rounded-lg border border-white/10">
                          <Camera size={12} />
                      </div>
                  </div>
                  <div>
                      <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded text-gray-300 uppercase tracking-[0.2em] border border-white/5">{dateString}</span>
                          <span className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1"><Shield size={10}/> {t("ID Verified", "ID Verified")}</span>
                      </div>
                      <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-[0.9]">
                          {t("Namaste", "Namaste")}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">{profile?.name.split(' ')[0]}</span>
                      </h1>
                      <p className="text-gray-400 font-medium mt-2 text-sm max-w-md line-clamp-1 min-h-[1.5em]">{language === 'ne' ? currentSlogan.ne : currentSlogan.en}</p>
                  </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center flex-1 md:flex-none">
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{t("Level", "Level")}</p>
                      <p className="text-3xl font-black text-white leading-none">{userLevel}</p>
                  </div>
                  <div className="bg-yellow-500/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-yellow-500/20 text-center flex-1 md:flex-none">
                      <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-1">{t("Karma", "Karma")}</p>
                      <p className="text-3xl font-black text-yellow-400 leading-none"><CountUp end={profile?.points || 0}/></p>
                  </div>
              </div>
          </div>

          <div className="relative z-10 w-full mt-8">
              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  <span>{t("Progress to Level", "Progress to Level")} {userLevel + 1}</span>
                  <span>{currentXP} / {userLevel * 500} XP</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                      className="h-full bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-1000 ease-out" 
                      style={{ width: `${xpProgress}%` }}
                  ></div>
              </div>
              {xpGain && <XPToast amount={xpGain} onComplete={() => setXpGain(null)} />}
          </div>
      </div>

      {/* 2. DYNAMIC SECTIONS GRID */}
      {SECTIONS.map((section, idx) => (
        <div key={idx} className="space-y-4">
           <div className="flex items-center gap-4 px-2">
              <h3 className={`text-xs font-black uppercase tracking-[0.25em] ${section.color}`}>{section.title}</h3>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.items.map((item, i) => (
                 <Link 
                    key={i} 
                    to={item.to}
                    className="bg-white dark:bg-gray-800 p-4 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex items-center gap-4"
                 >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                       <item.icon size={24} />
                    </div>
                    <div>
                       <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm">{item.label}</h4>
                       <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-0.5">{item.desc}</p>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-gray-300 group-hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100"/>
                 </Link>
              ))}
           </div>
        </div>
      ))}

      {/* 3. WIDGETS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Priority Tasks */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-700 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <ListTodo size={16} className="text-indigo-500"/> {t("Priority Queue", "Priority Queue")}
                  </h3>
                  <Link to="/planner" className="text-[10px] font-bold text-gray-400 uppercase hover:text-indigo-500">{t("View All", "View All")}</Link>
              </div>
              <div className="space-y-3">
                  {pendingTasks.length > 0 ? pendingTasks.map(t => <TaskItem key={t.id} task={t} onComplete={handleQuickCompleteTask} />) : (
                      <div className="text-center py-8 text-gray-400">
                          <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50"/>
                          <span className="text-xs font-bold uppercase">{t("All Clear", "All Clear")}</span>
                      </div>
                  )}
              </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-700 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <Siren size={16} className="text-red-500"/> {t("FTL Network", "FTL Network")}
                  </h3>
                  <Link to="/safety" className="text-[10px] font-bold text-gray-400 uppercase hover:text-red-500">{t("View Map", "View Map")}</Link>
              </div>
              <div className="space-y-3">
                  {activeFTL.length > 0 ? activeFTL.slice(0, 3).map(m => (
                      <div key={m.id} className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center text-red-600 shrink-0">
                              <Siren size={18} />
                          </div>
                          <div className="min-w-0">
                              <p className="text-xs font-black text-red-700 dark:text-red-400 truncate uppercase">{m.type} ALERT</p>
                              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate">{m.location}</p>
                          </div>
                      </div>
                  )) : (
                      <div className="text-center py-8 text-gray-400">
                          <Shield size={32} className="mx-auto mb-2 opacity-50"/>
                          <span className="text-xs font-bold uppercase">{t("Sector Secure", "Sector Secure")}</span>
                      </div>
                  )}
              </div>
          </div>
      </div>

    </div>
  );
};

export default Dashboard;
