
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, CheckSquare, ShieldAlert, Tent, Utensils, 
  Map as MapIcon, LogOut, Sun, Moon, Loader2, Leaf, 
  ShoppingBag, Menu, X, BarChart2, Gamepad2, Settings, 
  Palette, Library, RefreshCw, Laptop, MessageCircle, 
  Lock, Zap, Calendar as CalendarIcon, Bot, ChevronRight, Award,
  Terminal // Import Terminal icon
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { THEME_REGISTRY } from '../config/themes';
import { Logo } from './ui/Logo';
import RudraAI from './RudraAI'; // Import from components folder
import confetti from 'canvas-confetti';

// ... (Existing getFrameStyle and BadgeOverlay components remain unchanged) ...
const getFrameStyle = (id?: string) => {
  if (!id || id === 'none') return 'ring-2 ring-white/50 dark:ring-white/20';
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
  return 'ring-2 ring-indigo-400';
};

const BadgeOverlay = () => {
  const [badge, setBadge] = useState<{title: string, icon: any} | null>(null);

  useEffect(() => {
    const handleUnlock = (e: any) => {
      const { title, icon } = e.detail;
      setBadge({ title, icon });
      
      // Trigger confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      // Auto dismiss
      setTimeout(() => setBadge(null), 4000);
    };

    window.addEventListener('rudraksha-badge-unlock', handleUnlock);
    return () => window.removeEventListener('rudraksha-badge-unlock', handleUnlock);
  }, []);

  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 px-4">
      <div className="bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900 dark:to-amber-800 p-1 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_0_100px_rgba(251,191,36,0.6)] animate-in zoom-in slide-in-from-bottom-10 duration-500 w-full max-w-sm md:max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-[2.3rem] md:rounded-[2.8rem] p-8 md:p-12 text-center border-4 border-yellow-400/50 relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
           <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-yellow-400 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                 <Award size={48} className="text-white fill-white md:w-16 md:h-16" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-[0.4em] mb-2">Achievement Unlocked</h3>
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white italic tracking-tighter uppercase">{badge.title}</h2>
              </div>
              <button onClick={() => setBadge(null)} className="mt-4 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform">
                Claim Reward
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const Layout: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(() => localStorage.getItem('rudraksha_focus_mode') === 'true');
  
  // Easter Egg State
  const [logoClicks, setLogoClicks] = useState(0);
  
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('themeMode');
        return (saved === 'light' || saved === 'dark' || saved === 'system') ? saved : 'dark';
    }
    return 'dark';
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    checkAuth();
    const handleUpdate = () => {
      checkAuth();
      setIsFocusMode(localStorage.getItem('rudraksha_focus_mode') === 'true');
    };
    window.addEventListener('rudraksha-profile-update', handleUpdate);
    window.addEventListener('rudraksha-focus-update', handleUpdate);
    return () => {
      window.removeEventListener('rudraksha-profile-update', handleUpdate);
      window.removeEventListener('rudraksha-focus-update', handleUpdate);
    };
  }, []);

  useEffect(() => { setIsSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const root = window.document.documentElement;
    const body = document.body;
    if (body.getAttribute('data-theme-override')) return;

    const currentThemeId = profile?.activeTheme || 'default';
    const themeConfig = THEME_REGISTRY[currentThemeId] || THEME_REGISTRY['default'];

    let isDark = false;
    if (themeConfig.uiMode !== 'auto') {
        isDark = themeConfig.uiMode === 'dark';
    } else {
        isDark = themeMode === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : themeMode === 'dark';
    }

    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');

    Object.entries(themeConfig.colors).forEach(([key, value]) => root.style.setProperty(key, value));
    body.setAttribute('data-theme', currentThemeId);
    
    const bgColor = (isDark && themeConfig.darkBgColor) ? themeConfig.darkBgColor : themeConfig.bgColor;
    const bgPattern = (isDark && themeConfig.darkBgPattern !== undefined) ? themeConfig.darkBgPattern : (themeConfig.bgPattern || 'none');

    body.style.backgroundColor = bgColor;
    body.style.backgroundImage = bgPattern;
    body.style.backgroundAttachment = 'fixed';
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = themeConfig.bgPosition || 'center';

    if (themeConfig.isAnimated) body.classList.add('animate-neon-flow');
    else body.classList.remove('animate-neon-flow');
    
    body.style.filter = isFocusMode ? 'saturate(0.7) contrast(1.1)' : 'none';
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode, profile?.activeTheme, location.pathname, isFocusMode]);

  const checkAuth = async () => {
    const auth = await StorageService.isAuthenticated();
    const user = await StorageService.getProfile();
    setIsAuthenticated(auth);
    setProfile(user);
    setLoading(false);
  };

  const cycleThemeMode = () => {
    const modes: ('system' | 'light' | 'dark')[] = ['system', 'light', 'dark'];
    const nextIndex = (modes.indexOf(themeMode) + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    window.dispatchEvent(new Event('rudraksha-profile-update'));
    await checkAuth();
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const toggleFocusMode = () => {
    const newState = !isFocusMode;
    localStorage.setItem('rudraksha_focus_mode', String(newState));
    setIsFocusMode(newState);
    window.dispatchEvent(new Event('rudraksha-focus-update'));
  };

  const handleLogoClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      // Only count clicks if authenticated
      if (!isAuthenticated || !profile) return;
      
      setLogoClicks(prev => prev + 1);
      
      // Easter Egg Trigger (5 clicks)
      if (logoClicks + 1 === 5) {
          // STRICT CHECK: Ensure profile data is loaded and badge isn't already owned
          if (profile.unlockedItems?.includes('badge_secret')) {
              console.log("Easter egg already claimed.");
              setLogoClicks(0);
              return;
          }

          // If valid claim:
          await StorageService.addPoints(500, 0, 'easter_egg', 'Secret Hunter');
          
          // Manually update unlock list in DB immediately
          const currentItems = profile.unlockedItems || [];
          const updatedProfile = await StorageService.updateProfile({ 
              unlockedItems: [...currentItems, 'badge_secret'] 
          });
          
          // Update local state to reflect change immediately (prevents double tap)
          if(updatedProfile) setProfile(updatedProfile);
          
          // Trigger Visuals
          window.dispatchEvent(new CustomEvent('rudraksha-badge-unlock', {
              detail: { title: 'Secret Hunter', icon: 'spy' }
          }));
          
          setLogoClicks(0);
      }
      
      // Reset after 2 seconds of no click
      setTimeout(() => setLogoClicks(0), 2000);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-600"/></div>;
  if (!isAuthenticated && location.pathname !== '/auth' && location.pathname !== '/welcome') return <Navigate to="/welcome" />;

  const isTeacher = profile?.role === 'teacher';
  const isStudent = profile?.role === 'student';
  const isAdmin = profile?.email === 'admin@gmail.com';

  const navGroups = [
    { items: [{ path: '/', label: t('Dashboard', 'Dashboard'), icon: LayoutDashboard }] },
    {
      title: t('ACADEMIC', 'ACADEMIC'),
      condition: isStudent || isTeacher,
      items: [
        { path: '/study-buddy', label: t('Rudra AI', 'Rudra AI'), icon: Bot },
        { path: '/planner', label: t('Assignments', 'Assignments'), icon: CheckSquare },
        { path: '/library', label: t('Library', 'Library'), icon: Library },
      ]
    },
    {
      title: 'CULTURE',
      condition: !isFocusMode,
      items: [
        { path: '/culture', label: t('Calendar', 'Calendar'), icon: CalendarIcon },
        { path: '/map', label: t('Map & Provinces', 'Map & Provinces'), icon: MapIcon },
        { path: '/recipes', label: t('Kitchen', 'Kitchen'), icon: Utensils },
      ]
    },
    {
      title: 'COMMUNITY',
      condition: !isFocusMode,
      items: [
        { path: '/community-chat', label: t('Network', 'Network'), icon: MessageCircle },
        ...(isAdmin ? [{ path: '/messenger-bot', label: 'Bot Console', icon: Terminal }] : []),
        { path: '/health', label: t('Wellness', 'Wellness'), icon: Leaf },
        { path: '/safety', label: t('FTL Rescue', 'FTL Rescue'), icon: ShieldAlert },
        { path: '/rewards', label: t('Karma Bazaar', 'Karma Bazaar'), icon: ShoppingBag },
        { path: '/arcade', label: t('Arcade', 'Arcade'), icon: Gamepad2 },
      ]
    }
  ];

  const NavContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="space-y-6 py-4">
      {navGroups.map((group, idx) => {
        if (group.condition === false) return null;
        return (
          <div key={idx}>
            {group.title && (
              <h3 className="px-6 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-3 opacity-70">
                {group.title}
              </h3>
            )}
            <div className="space-y-1 px-3">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onItemClick}
                  className={({ isActive }) => `
                    flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-black italic transition-all duration-300 group
                    ${isActive 
                      ? 'bg-white/80 dark:bg-white/10 text-indigo-700 dark:text-indigo-400 shadow-lg backdrop-blur-md translate-x-1 border border-indigo-100/50' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/5 hover:translate-x-1'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="transition-transform group-hover:scale-110" />
                    {item.label}
                  </div>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const UserProfileCard = () => (
    <div className="p-4 bg-white/30 dark:bg-black/20 backdrop-blur-xl shrink-0 border-t border-white/10 dark:border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={toggleFocusMode} className={`p-2 rounded-xl transition-all shadow-sm w-9 h-9 flex items-center justify-center ${isFocusMode ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white/50 dark:bg-gray-700/50 text-indigo-600 hover:scale-110'}`}>
            {isFocusMode ? <Lock size={18} /> : <Zap size={18} />}
          </button>
          <button onClick={cycleThemeMode} className="p-2 rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-yellow-400 hover:scale-105 transition-transform shadow-sm w-9 h-9 flex items-center justify-center">
            {themeMode === 'light' ? <Sun size={18} /> : themeMode === 'dark' ? <Moon size={18} /> : <Laptop size={18} />}
          </button>
          <button onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')} className="p-2 rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-blue-400 font-bold text-xs w-9 h-9 flex items-center justify-center">
            {language === 'en' ? 'NE' : 'EN'}
          </button>
          <Link to="/settings" className="p-2 rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 hover:scale-110 transition-transform shadow-sm w-9 h-9 flex items-center justify-center">
            <Settings size={18} />
          </Link>
        </div>
        <button onClick={() => { StorageService.logout(); navigate('/welcome'); }} className="p-2 rounded-xl bg-red-100/50 dark:bg-red-900/30 text-red-600 dark:text-red-400 w-9 h-9 flex items-center justify-center"><LogOut size={18}/></button>
      </div>
      <Link to="/profile" className="flex items-center gap-3 p-2 rounded-2xl bg-white/40 dark:bg-gray-800/40 hover:bg-white/60 transition-all shadow-sm group">
        <img src={profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name}`} className={`w-10 h-10 rounded-full object-cover transition-transform group-hover:scale-105 ${getFrameStyle(profile?.frameId)}`} alt="Avatar" />
        <div className="overflow-hidden">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate w-24">{profile?.name || 'User'}</p>
          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium">🏆 {profile?.points || 0} pts</div>
        </div>
      </Link>
    </div>
  );

  return (
    <div className={`flex h-screen w-full transition-all duration-700 overflow-hidden font-sans ${isFocusMode ? 'bg-indigo-50/10 dark:bg-[#020617]' : 'text-gray-900 dark:text-gray-100'}`}>
      
      <BadgeOverlay />

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col w-64 xl:w-72 bg-white/60 dark:bg-black/30 backdrop-blur-2xl shadow-2xl z-30 transition-all duration-500 shrink-0 ${isFocusMode ? 'border-r-2 border-indigo-500/30' : ''}`}>
        <div className="flex items-center justify-center h-24 px-6">
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-3 font-black text-2xl text-red-700 dark:text-red-500 hover:opacity-80 transition-opacity tracking-tighter uppercase italic select-none">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform transition-transform ${logoClicks > 0 ? 'scale-110' : ''} ${isFocusMode ? 'bg-indigo-600 animate-pulse' : ''}`}>
               {isFocusMode ? <Lock size={16} className="text-white"/> : <Logo className="w-10 h-10" />}
            </div>
            {isFocusMode ? <span className="text-indigo-600 dark:text-indigo-400">Deep Work</span> : 'Rudraksha'}
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto no-scrollbar"><NavContent /></nav>
        <UserProfileCard />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-transparent">
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative no-scrollbar">
          
          {/* Mobile Header - Visible only on mobile */}
          <div className="lg:hidden sticky top-0 z-30 px-4 py-3 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between transition-all duration-300">
             <div className="flex items-center gap-3" onClick={handleLogoClick}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md ${isFocusMode ? 'bg-indigo-600 text-white' : ''} ${logoClicks > 0 ? 'scale-110' : ''} transition-transform`}>
                   {isFocusMode ? <Lock size={16}/> : <Logo className="w-9 h-9"/>}
                </div>
                <span className="font-black text-lg tracking-tighter uppercase italic text-gray-900 dark:text-white">
                   {isFocusMode ? <span className="text-indigo-600 dark:text-indigo-400">Deep Work</span> : 'Rudraksha'}
                </span>
             </div>
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm"
             >
                <Menu size={22} />
             </button>
          </div>

          <div className="container mx-auto p-4 md:p-8 xl:p-12 pb-24 md:pb-20 max-w-[1920px]" key={`${refreshKey}-${isFocusMode}`}>
            <Outlet />
          </div>

          {!isFocusMode && (
            <button onClick={handleRefresh} disabled={isRefreshing} className="fixed bottom-24 right-4 md:bottom-8 md:right-8 p-3 bg-white/40 hover:bg-white/60 dark:bg-black/40 backdrop-blur-md text-red-600 rounded-full shadow-2xl z-40 transition-all hover:scale-110 active:scale-95 group border border-white/20">
              <RefreshCw size={20} className={isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
            </button>
          )}
        </main>
      </div>

      {/* Global Rudra AI Button - ALWAYS VISIBLE */}
      <RudraAI />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 z-[101] w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-2xl transform transition-transform duration-300 ease-out lg:hidden flex flex-col border-r border-gray-200 dark:border-gray-800 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
            <Link to="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 font-black text-xl text-red-700 dark:text-red-500 uppercase italic">
               <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg ${isFocusMode ? 'bg-indigo-600 text-white' : ''}`}>
                  {isFocusMode ? <Lock size={16}/> : <Logo className="w-9 h-9"/>}
               </div>
               Rudraksha
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
               <X size={24} className="text-gray-500"/>
            </button>
         </div>
         <nav className="flex-1 overflow-y-auto custom-scrollbar">
            <NavContent onItemClick={() => setIsSidebarOpen(false)} />
         </nav>
         <UserProfileCard />
      </div>
    </div>
  );
};

export default Layout;
