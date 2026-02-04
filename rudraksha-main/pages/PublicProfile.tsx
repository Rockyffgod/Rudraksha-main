
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { UserProfile } from '../types';
import { Loader2, ArrowLeft, Trophy, Shield, Calendar, Users, MapPin, Briefcase, GraduationCap, UserPlus, CheckCircle, UserCheck, Quote } from 'lucide-react';
import { Button } from '../components/ui/Button';

// Reusing theme configs to apply them locally
const THEMES: Record<string, {
  colors: Record<string, string>;
  uiMode: 'light' | 'dark' | 'auto'; 
  bgPattern?: string;
  bgColor: string;
  darkBgColor?: string;
  darkBgPattern?: string;
}> = {
  'default': {
    uiMode: 'auto',
    bgColor: '#fdfbf7', 
    darkBgColor: '#09090b',
    bgPattern: "radial-gradient(circle at 0% 0%, rgba(255, 200, 150, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(255, 100, 100, 0.1) 0%, transparent 50%)",
    darkBgPattern: "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)",
    colors: {} 
  },
  'theme_royal': {
    uiMode: 'dark',
    bgColor: '#1a0b2e',
    bgPattern: "radial-gradient(circle at 50% 0%, #581c87 0%, transparent 70%), radial-gradient(circle at 100% 100%, #3b0764 0%, transparent 50%)", 
    colors: { '--color-red-600': '#c084fc', '--color-red-700': '#d8b4fe' },
  },
  'theme_nature': {
    uiMode: 'auto',
    bgColor: '#f0fdf4',
    darkBgColor: '#022c22',
    bgPattern: "radial-gradient(circle at 0% 100%, rgba(34, 197, 94, 0.1) 0%, transparent 40%), url('https://www.transparenttextures.com/patterns/leaves.png')",
    darkBgPattern: "radial-gradient(circle at 0% 100%, rgba(34, 197, 94, 0.05) 0%, transparent 40%)",
    colors: { '--color-red-600': '#16a34a' },
  },
  'theme_ocean': {
    uiMode: 'auto',
    bgColor: '#eff6ff',
    darkBgColor: '#0f172a',
    bgPattern: "radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.1) 0%, transparent 60%), url('https://www.transparenttextures.com/patterns/cubes.png')",
    darkBgPattern: "radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.05) 0%, transparent 60%)",
    colors: { '--color-red-600': '#2563eb' },
  },
  'theme_midnight': {
    uiMode: 'dark',
    bgColor: '#020617',
    bgPattern: "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 60%), radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px) 0 0/30px 30px",
    colors: { '--color-red-600': '#4f46e5' },
  },
  'theme_sky': {
    uiMode: 'light',
    bgColor: '#f0f9ff',
    bgPattern: "linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 100%)",
    colors: { '--color-red-600': '#0891b2' },
  },
};

const getFrameStyle = (id?: string) => {
  if (!id || id === 'none') return 'ring-4 ring-white/50';
  if (id === 'unicorn') return 'ring-4 ring-pink-400 shadow-[0_0_20px_#f472b6]';
  if (id === 'royal') return 'ring-4 ring-yellow-500 shadow-[0_0_20px_#eab308]';
  if (id === 'nature') return 'ring-4 ring-green-500';
  if (id === 'dark') return 'ring-4 ring-gray-800 shadow-[0_0_20px_#000]';
  return 'ring-4 ring-indigo-400';
};

const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<'none' | 'sent' | 'friends' | 'received'>('none');

  useEffect(() => {
    const fetchUser = async () => {
      if (userId) {
        const [targetUser, me] = await Promise.all([
            StorageService.getUserPublicProfile(userId),
            StorageService.getProfile()
        ]);
        setUser(targetUser);
        setCurrentUser(me);
        
        if (targetUser && me) {
            if (me.friends?.includes(targetUser.id)) setFriendStatus('friends');
            else if (me.sentRequests?.includes(targetUser.id)) setFriendStatus('sent');
            else if (me.friendRequests?.includes(targetUser.id)) setFriendStatus('received');
            else setFriendStatus('none');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [userId]);

  // Apply User's Theme Effect
  useEffect(() => {
    if (!user) return;

    const themeId = user.activeTheme || 'default';
    const themeConfig = THEMES[themeId] || THEMES['default'];
    const root = document.documentElement;
    const body = document.body;

    // Save previous state to restore
    const prevBgColor = body.style.backgroundColor;
    const prevBgImage = body.style.backgroundImage;
    const prevDataTheme = body.getAttribute('data-theme');
    
    // Apply new theme
    body.setAttribute('data-theme', themeId);
    body.setAttribute('data-theme-override', 'true'); // Flag to prevent Layout from overwriting immediately

    // Mode
    let isDark = false;
    if (themeConfig.uiMode !== 'auto') {
        isDark = themeConfig.uiMode === 'dark';
    } else {
        // Use system pref if auto
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');

    // Backgrounds
    const bgColor = (isDark && themeConfig.darkBgColor) ? themeConfig.darkBgColor : themeConfig.bgColor;
    const bgPattern = (isDark && themeConfig.darkBgPattern !== undefined) ? themeConfig.darkBgPattern : (themeConfig.bgPattern || 'none');
    
    body.style.backgroundColor = bgColor;
    body.style.backgroundImage = bgPattern;

    // Apply colors
    const appliedProps: string[] = [];
    Object.entries(themeConfig.colors).forEach(([key, value]) => {
        root.style.setProperty(key, value);
        appliedProps.push(key);
    });

    // Cleanup on Unmount
    return () => {
        body.removeAttribute('data-theme-override');
        // We trigger a global event to let Layout.tsx re-apply the logged-in user's theme
        window.dispatchEvent(new Event('rudraksha-profile-update'));
        
        // Clean up explicit props if needed, though Layout will likely overwrite them
        appliedProps.forEach(k => root.style.removeProperty(k));
    };
  }, [user]);

  const handleFriendRequest = async () => {
      if (!user) return;
      setFriendStatus('sent');
      await StorageService.sendFriendRequest(user.id);
  };

  const handleAcceptRequest = async () => {
      if (!user) return;
      setFriendStatus('friends');
      await StorageService.acceptFriendRequest(user.id);
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-white w-12 h-12"/></div>;
  if (!user) return <div className="flex flex-col items-center justify-center h-screen text-gray-500">User not found <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button></div>;

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700 relative">
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-50">
            <Button onClick={() => navigate(-1)} variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-md border-transparent text-white shadow-lg">
                <ArrowLeft size={20} className="mr-2"/> Back
            </Button>
        </div>

        {/* Hero Section */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
            {user.bannerUrl ? (
                <img src={user.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900 opacity-50"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                {/* Avatar */}
                <div className="relative">
                    <img 
                        src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                        className={`w-32 h-32 md:w-40 md:h-40 rounded-full object-cover bg-white ${getFrameStyle(user.frameId)}`}
                        alt={user.name}
                    />
                    <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-md border border-gray-200 dark:border-gray-700" title={user.activeTheme || "Default Theme"}>
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500"></div>
                    </div>
                </div>

                <div className="flex-1 mb-2">
                    <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-md">{user.name}</h1>
                    <p className="text-gray-200 font-medium text-lg">@{user.username || 'user'}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                        <span className="bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider border border-white/20">
                            {user.role}
                        </span>
                        {user.schoolName && (
                            <span className="bg-black/40 backdrop-blur-sm text-gray-200 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-white/20">
                                <GraduationCap size={14}/> {user.schoolName}
                            </span>
                        )}
                    </div>
                </div>

                {/* Friend Action */}
                <div className="mb-4">
                    {friendStatus === 'none' && currentUser && user.id !== currentUser.id ? (
                        <button 
                            onClick={handleFriendRequest}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95"
                        >
                            <UserPlus size={18}/> Connect
                        </button>
                    ) : friendStatus === 'sent' ? (
                        <button disabled className="bg-gray-600/80 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-xs cursor-default">
                            <CheckCircle size={18}/> Request Sent
                        </button>
                    ) : friendStatus === 'received' ? (
                        <button onClick={handleAcceptRequest} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95">
                            <UserPlus size={18}/> Accept Request
                        </button>
                    ) : friendStatus === 'friends' ? (
                        <button disabled className="bg-green-600/80 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-xs cursor-default shadow-lg">
                            <UserCheck size={18}/> Friend
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center md:justify-start gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 text-center min-w-[80px]">
                    <Trophy className="mx-auto text-yellow-400 mb-1" size={20}/>
                    <p className="text-xl font-bold text-white">{user.points}</p>
                    <p className="text-[10px] text-gray-300 uppercase">Karma</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 text-center min-w-[80px]">
                    <Shield className="mx-auto text-blue-400 mb-1" size={20}/>
                    <p className="text-xl font-bold text-white">{Math.floor((user.xp || 0) / 500) + 1}</p>
                    <p className="text-[10px] text-gray-300 uppercase">Level</p>
                </div>
            </div>

            {/* Content Body - Consolidated "About" with Bio */}
            <div className="mt-8">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl border border-white/50 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 pb-4">Personal Profile</h2>
                    
                    {user.bio && (
                        <div className="mb-8 relative pl-6">
                            <Quote size={24} className="absolute left-0 top-0 text-indigo-400/30 rotate-180" />
                            <p className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-200 italic leading-relaxed font-serif">
                                "{user.bio}"
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                <Briefcase size={20}/>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Role</p>
                                <p className="font-bold text-lg">{user.profession || user.role}</p>
                            </div>
                        </div>
                        {user.grade && (
                            <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                    <Users size={20}/>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Class</p>
                                    <p className="font-bold text-lg">{user.grade}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                <Calendar size={20}/>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Joined</p>
                                <p className="font-bold text-lg">2024</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default PublicProfile;
