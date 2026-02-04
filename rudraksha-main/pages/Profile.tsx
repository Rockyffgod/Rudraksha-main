
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { UserProfile, Transaction } from '../types';
import { Button } from '../components/ui/Button';
import { User, Mail, Briefcase, GraduationCap, Upload, Check, Loader2, CheckCircle, X, Sparkles, Palette, Frame as FrameIcon, Image as ImageIcon, ImagePlus, AtSign, Compass, Lock, History, Coins, ArrowUpRight, ArrowDownLeft, ChevronRight, PenTool, PlayCircle, Lightbulb, Wallet, Shield, Camera, ShoppingBag } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';

const AVATAR_PRESETS = [
  { id: 'unicorn', name: 'Unicorn', seed: 'unicorn', bg: 'bg-pink-100', border: 'border-pink-300' },
  { id: 'bunny', name: 'Bunny', seed: 'bunny', bg: 'bg-rose-100', border: 'border-rose-300' },
  { id: 'royal', name: 'Royal', seed: 'king', bg: 'bg-amber-100', border: 'border-amber-300' },
  { id: 'dreamy', name: 'Dreamy', seed: 'sky', bg: 'bg-sky-100', border: 'border-sky-300' },
  { id: 'witch', name: 'Witch', seed: 'witch', bg: 'bg-purple-100', border: 'border-purple-300' },
  { id: 'fox', name: 'Fox', seed: 'fox', bg: 'bg-orange-100', border: 'border-orange-300' },
  { id: 'fairy', name: 'Fairy', seed: 'butterfly', bg: 'bg-indigo-100', border: 'border-indigo-300' },
  { id: 'nature', name: 'Nature', seed: 'garden', bg: 'bg-emerald-100', border: 'border-emerald-300' },
  { id: 'dark', name: 'Dark', seed: 'demon', bg: 'bg-slate-800', border: 'border-slate-600' },
  { id: 'moon', name: 'Moon', seed: 'luna', bg: 'bg-blue-900', border: 'border-blue-700' },
  { id: 'bear', name: 'Bear', seed: 'bear', bg: 'bg-stone-100', border: 'border-stone-300' },
  { id: 'cat', name: 'Cat', seed: 'cat', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'dog', name: 'Dog', seed: 'dog', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { id: 'panda', name: 'Panda', seed: 'panda', bg: 'bg-gray-100', border: 'border-gray-300' },
  { id: 'lion', name: 'Lion', seed: 'lion', bg: 'bg-amber-200', border: 'border-amber-400' },
  { id: 'tiger', name: 'Tiger', seed: 'tiger', bg: 'bg-orange-200', border: 'border-orange-400' },
  { id: 'koala', name: 'Koala', seed: 'koala', bg: 'bg-slate-200', border: 'border-slate-400' },
];

const ADVENTURER_PRESETS = [
  { id: 'hero', name: 'Hero', seed: 'hero', bg: 'bg-blue-100', border: 'border-blue-300' },
  { id: 'scout', name: 'Scout', seed: 'scout', bg: 'bg-green-100', border: 'border-green-300' },
  { id: 'mage', name: 'Mage', seed: 'mage', bg: 'bg-purple-100', border: 'border-purple-300' },
  { id: 'rogue', name: 'Rogue', seed: 'rogue', bg: 'bg-gray-100', border: 'border-gray-300' },
  { id: 'paladin', name: 'Paladin', seed: 'paladin', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  { id: 'hunter', name: 'Hunter', seed: 'hunter', bg: 'bg-orange-100', border: 'border-orange-300' },
  { id: 'cleric', name: 'Cleric', seed: 'cleric', bg: 'bg-teal-100', border: 'border-teal-300' },
  { id: 'bard', name: 'Bard', seed: 'bard', bg: 'bg-pink-100', border: 'border-pink-300' },
  { id: 'warrior', name: 'Warrior', seed: 'warrior', bg: 'bg-red-100', border: 'border-red-300' },
  { id: 'druid', name: 'Druid', seed: 'druid', bg: 'bg-emerald-200', border: 'border-emerald-400' },
  { id: 'necromancer', name: 'Necro', seed: 'necromancer', bg: 'bg-slate-800', border: 'border-slate-600' },
  { id: 'monk', name: 'Monk', seed: 'monk', bg: 'bg-orange-50', border: 'border-orange-200' },
];

const SCIFI_PRESETS = [
  { id: 'robot1', name: 'Unit 01', seed: 'robot1', bg: 'bg-slate-100', border: 'border-slate-300' },
  { id: 'robot2', name: 'Unit 02', seed: 'robot2', bg: 'bg-cyan-100', border: 'border-cyan-300' },
  { id: 'robot3', name: 'Unit 03', seed: 'robot3', bg: 'bg-emerald-100', border: 'border-emerald-300' },
  { id: 'robot4', name: 'Unit 04', seed: 'robot4', bg: 'bg-red-100', border: 'border-red-300' },
  { id: 'robot5', name: 'Unit 05', seed: 'robot5', bg: 'bg-purple-100', border: 'border-purple-300' },
  { id: 'robot6', name: 'Unit 06', seed: 'robot6', bg: 'bg-orange-100', border: 'border-orange-300' },
  { id: 'robot7', name: 'Unit 07', seed: 'robot7', bg: 'bg-indigo-100', border: 'border-indigo-300' },
  { id: 'robot8', name: 'Unit 08', seed: 'robot8', bg: 'bg-lime-100', border: 'border-lime-300' },
  { id: 'cyborg1', name: 'Cyborg A', seed: 'cyborg1', bg: 'bg-gray-800', border: 'border-gray-600' },
  { id: 'cyborg2', name: 'Cyborg B', seed: 'cyborg2', bg: 'bg-blue-900', border: 'border-blue-700' },
  { id: 'droid', name: 'Droid', seed: 'droid', bg: 'bg-yellow-100', border: 'border-yellow-400' },
  { id: 'mecha', name: 'Mecha', seed: 'mecha', bg: 'bg-red-50', border: 'border-red-200' },
];

const FRAMES = [
  { id: 'none', name: 'No Frame', css: 'border-4 border-transparent' },
  { id: 'unicorn', name: 'Unicorn', css: 'border-4 border-pink-400 ring-4 ring-pink-200 shadow-[0_0_15px_#f472b6]' },
  { id: 'bunny', name: 'Bunny', css: 'border-4 border-white ring-4 ring-rose-300 shadow-lg' },
  { id: 'royal', name: 'Royal', css: 'border-4 border-yellow-500 ring-4 ring-yellow-200 shadow-[0_0_20px_#eab308]' },
  { id: 'dreamy', name: 'Dreamy', css: 'border-4 border-sky-300 ring-4 ring-indigo-200 shadow-[0_0_15px_#7dd3fc] border-dashed' },
  { id: 'witch', name: 'Witch', css: 'border-4 border-purple-600 ring-4 ring-purple-900 shadow-[0_0_15px_#9333ea]' },
  { id: 'fox', name: 'Fox', css: 'border-4 border-orange-500 ring-4 ring-orange-200 shadow-md' },
  { id: 'fairy', name: 'Fairy', css: 'border-4 border-teal-300 ring-4 ring-emerald-100 shadow-[0_0_15px_#5eead4]' },
  { id: 'nature', name: 'Nature', css: 'border-8 border-green-500 border-double shadow-sm' },
  { id: 'dark', name: 'Dark', css: 'border-4 border-gray-800 ring-4 ring-red-900 shadow-[0_0_20px_#000]' },
  { id: 'moon', name: 'Moon', css: 'border-4 border-slate-300 ring-4 ring-blue-900 shadow-[0_0_15px_#cbd5e1]' },
  { id: 'cyber', name: 'Cyber', css: 'border-4 border-cyan-400 ring-4 ring-cyan-900 shadow-[0_0_20px_#22d3ee]' },
  { id: 'vintage', name: 'Vintage', css: 'border-8 border-amber-700 border-double shadow-inner' },
  { id: 'neon', name: 'Neon', css: 'border-4 border-lime-400 ring-4 ring-lime-900 shadow-[0_0_20px_#a3e635] animate-pulse' },
];

const TIPS = [
  "Drink a glass of warm water every morning to boost metabolism.",
  "Take a 5-minute break for every 25 minutes of study.",
  "Meditation for 10 minutes can reduce daily stress by 40%.",
  "Eating seasonal fruits supports local farmers and your health.",
  "A clutter-free workspace leads to a clutter-free mind.",
  "Kindness is the highest form of wisdom.",
  "Consistent sleep schedules improve memory retention.",
];

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'info' | 'ledger'>('info');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Avatar Studio State
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [studioTab, setStudioTab] = useState<'avatars' | 'frames'>('avatars');
  const [activeCollection, setActiveCollection] = useState<'avataaars' | 'adventurer' | 'scifi'>('avataaars');
  
  // Ad Simulation
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  
  // Temporary State for Studio
  const [tempAvatar, setTempAvatar] = useState('');
  const [tempFrame, setTempFrame] = useState('none');

  // Edit State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState(''); 
  const [previewBannerUrl, setPreviewBannerUrl] = useState('');
  const [frameId, setFrameId] = useState('none');
  const [profession, setProfession] = useState('');
  const [school, setSchool] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const p = await StorageService.getProfile();
      setProfile(p);
      if (p) {
        setName(p.name);
        setUsername(p.username || '');
        setBio(p.bio || '');
        setAvatarUrl(p.avatarUrl || '');
        setBannerUrl(p.bannerUrl || '');
        setFrameId(p.frameId || 'none');
        setProfession(p.profession || '');
        setSchool(p.schoolName || '');
        if (p.avatarUrl && p.avatarUrl.includes('/adventurer/')) {
            setActiveCollection('adventurer');
        } else if (p.avatarUrl && p.avatarUrl.includes('/bottts/')) {
            setActiveCollection('scifi');
        }
        const txs = await StorageService.getTransactions(p.id);
        setTransactions(txs);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // Handle Intent from Navigation
  useEffect(() => {
      if (location.state && !loading && profile) {
          const { action } = location.state as any;
          if (action === 'ledger') {
              setActiveTab('ledger');
          } else if (action === 'avatar') {
              openStudio();
          } else if (action === 'edit') {
              setActiveTab('info');
          }
          
          // Clear state to prevent re-triggering loops on profile update
          navigate(location.pathname, { replace: true, state: {} });
      }
  }, [location.state, loading, profile, navigate, location.pathname]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    if (username !== profile?.username) {
        const existing = await StorageService.searchUsers(username);
        const taken = existing.find(u => u.username === username && u.id !== profile?.id);
        if (taken) {
            alert("Username already taken!");
            setSaving(false);
            return;
        }
    }

    const finalAvatarUrl = previewUrl || avatarUrl;
    const finalBannerUrl = previewBannerUrl || bannerUrl;

    const updated = await StorageService.updateProfile({ 
      name, 
      username,
      bio,
      avatarUrl: finalAvatarUrl,
      bannerUrl: finalBannerUrl,
      frameId,
      profession: profile?.role === 'student' ? 'Student' : profession,
      schoolName: school 
    });
    
    setProfile(updated || null);
    if (updated) {
        setAvatarUrl(updated.avatarUrl || '');
        setBannerUrl(updated.bannerUrl || '');
        setPreviewUrl('');
        setPreviewBannerUrl('');
        setShowSuccess(true);
        window.dispatchEvent(new Event('rudraksha-profile-update'));
        setTimeout(() => { setShowSuccess(false); }, 3000);
    }
    setSaving(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewBannerUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const openStudio = () => {
    setTempAvatar(previewUrl || avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`);
    setTempFrame(frameId);
    setShowAvatarMenu(true);
  };

  const closeStudio = (apply: boolean) => {
    if (apply) {
      setPreviewUrl(tempAvatar);
      setFrameId(tempFrame);
    }
    setShowAvatarMenu(false);
  };

  const selectPresetAvatar = (seed: string) => {
    let url = '';
    if (activeCollection === 'adventurer') {
        url = `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=transparent`;
    } else if (activeCollection === 'scifi') {
        url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=transparent`;
    } else {
        url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=transparent`;
    }
    setTempAvatar(url);
  };

  const getFrameStyle = (id: string) => {
    return FRAMES.find(f => f.id === id)?.css || 'border-4 border-transparent';
  };

  const isAvatarSelected = (seed: string) => {
    return tempAvatar.includes(`seed=${seed}`);
  };

  // --- KARMA EARNING SIMULATIONS ---
  const handleWatchAd = () => {
      setIsWatchingAd(true);
      setTimeout(async () => {
          setIsWatchingAd(false);
          await StorageService.addPoints(50, 0, 'ad_reward', 'Watched Advertisement');
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#facc15', '#eab308'] });
          // Refresh profile
          const p = await StorageService.getProfile();
          setProfile(p);
          if (p) {
              const txs = await StorageService.getTransactions(p.id);
              setTransactions(txs);
          }
      }, 3000); // 3 second simulation
  };

  const handleGetTip = () => {
      const STORAGE_KEY_START = 'rudraksha_wisdom_start';
      const STORAGE_KEY_AMOUNT = 'rudraksha_wisdom_amount';
      const LIMIT = 50; // Daily limit 50 points
      const REWARD = 10;
      const DURATION = 24 * 60 * 60 * 1000;

      const now = Date.now();
      let startTime = parseInt(localStorage.getItem(STORAGE_KEY_START) || '0');
      let amount = parseInt(localStorage.getItem(STORAGE_KEY_AMOUNT) || '0');

      // Check if 24 hours have passed since the start of the current cycle
      if (now - startTime > DURATION || startTime === 0) {
          startTime = now;
          amount = 0;
          localStorage.setItem(STORAGE_KEY_START, startTime.toString());
          localStorage.setItem(STORAGE_KEY_AMOUNT, '0');
      }

      if (amount >= LIMIT) {
          const timeLeft = DURATION - (now - startTime);
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          alert(`Daily Wisdom limit reached (${LIMIT} Karma). Timer resets in ${hours}h ${minutes}m.`);
          return;
      }

      const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
      setCurrentTip(tip);
      setShowTipModal(true);
      
      StorageService.addPoints(REWARD, 0, 'tip_reward', 'Daily Wisdom');
      
      amount += REWARD;
      localStorage.setItem(STORAGE_KEY_AMOUNT, amount.toString());

      // Refresh profile background
      StorageService.getProfile().then(p => {
          setProfile(p);
          if (p) StorageService.getTransactions(p.id).then(setTransactions);
      });
  };

  const isAdventurerLocked = !profile?.unlockedItems?.includes('pack_adventurer');

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-red-600"/></div>;
  if (!profile) return null;

  const currentBanner = previewBannerUrl || bannerUrl;
  const isStudent = profile.role === 'student';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 relative animate-fade-in px-4">
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] bg-green-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center justify-center gap-3 animate-slide-up">
           <CheckCircle size={24} />
           <span className="font-bold text-lg">Changes Saved Successfully!</span>
        </div>
      )}

      {/* Modern Header Switcher */}
      <div className="flex justify-center">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-1.5 rounded-full shadow-lg border border-white/20 inline-flex gap-2">
            <button 
                onClick={() => setActiveTab('info')}
                className={`px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'info' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
                <User size={16}/> Identity
            </button>
            <button 
                onClick={() => setActiveTab('ledger')}
                className={`px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'ledger' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
                <Wallet size={16}/> Ledger
            </button>
          </div>
      </div>

      {activeTab === 'info' ? (
          <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl border-4 border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-500 relative">
            
            {/* Banner Area */}
            <div className="h-64 relative group">
              {currentBanner ? (
                 <img src={currentBanner} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                 <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
              
              <label className="absolute top-6 right-6 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-3 rounded-2xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg border border-white/30">
                 <ImagePlus size={24} />
                 <input type="file" className="hidden" accept="image/*" onChange={handleBannerChange}/>
              </label>
            </div>
    
            {/* Avatar & Key Info Overlay */}
            <div className="px-8 md:px-12 relative -mt-20 z-10 flex flex-col md:flex-row items-end md:items-end gap-6">
                <div className="relative group">
                  <div className={`w-40 h-40 rounded-[2.5rem] overflow-hidden bg-white dark:bg-gray-800 relative shadow-2xl transition-transform transform group-hover:scale-[1.02] ${getFrameStyle(frameId)}`}>
                     <img 
                      src={previewUrl || avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                    {/* Custom Avatar Upload Overlay */}
                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20 backdrop-blur-sm">
                       <Camera className="text-white w-8 h-8 mb-1" />
                       <span className="text-[8px] font-black uppercase text-white tracking-widest">Change Photo</span>
                       <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                  
                  <div className="absolute -bottom-4 -right-4 flex gap-2 z-30">
                    <button 
                      type="button"
                      onClick={openStudio}
                      className="p-3 bg-indigo-600 rounded-2xl border-4 border-white dark:border-gray-900 shadow-xl text-white transition-all hover:scale-110 active:scale-95 hover:rotate-12"
                      title="Open Avatar Studio"
                    >
                      <Palette size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 pb-4 text-center md:text-left">
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">{name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-bold">@{username}</p>
                </div>
            </div>
    
            <form onSubmit={handleSave} className="p-8 md:p-12 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Display Name</label>
                  <div className="relative group">
                    <User size={20} className="absolute left-5 top-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
                    <input 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-bold text-lg"
                    />
                  </div>
                </div>
    
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Username</label>
                  <div className="relative group">
                    <AtSign size={20} className="absolute left-5 top-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
                    <input 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-bold text-lg"
                    />
                  </div>
                </div>
    
                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Bio / Manifesto</label>
                  <div className="relative group">
                    <PenTool size={20} className="absolute left-5 top-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
                    <textarea 
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Share your digital essence..."
                      rows={3}
                      className="w-full pl-14 pr-6 py-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-medium text-lg resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Role</label>
                  <div className="relative group">
                    <Briefcase size={20} className="absolute left-5 top-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
                    <input 
                      value={isStudent ? 'Student' : profession}
                      disabled={isStudent}
                      onChange={e => setProfession(e.target.value)}
                      className={`w-full pl-14 pr-6 py-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-bold text-lg ${isStudent ? 'opacity-60 cursor-not-allowed italic' : ''}`}
                    />
                  </div>
                </div>
    
                {(profile.role === 'student' || profile.role === 'teacher') && (
                  <div className="space-y-3">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Institution</label>
                     <div className="relative group">
                      <GraduationCap size={20} className="absolute left-5 top-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors"/>
                      <input 
                        value={school}
                        onChange={e => setSchool(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-bold text-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <Button type="submit" disabled={saving} className="w-full md:w-auto h-16 px-12 text-xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 rounded-2xl font-black uppercase tracking-widest">
                  {saving ? <Loader2 className="animate-spin mr-2"/> : <Check className="mr-2" size={24}/>}
                  Save Identity
                </Button>
              </div>
            </form>
          </div>
      ) : (
          /* LEDGER VIEW */
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              
              {/* Wallet Card */}
              <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                  <div className="absolute -right-20 -top-20 w-80 h-80 bg-yellow-500/20 rounded-full blur-[100px] group-hover:bg-yellow-500/30 transition-colors"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                      <div className="flex items-center gap-8">
                          <div className="w-24 h-24 bg-yellow-500 rounded-3xl flex items-center justify-center text-black shadow-[0_0_40px_rgba(234,179,8,0.6)] rotate-3 group-hover:rotate-12 transition-transform duration-500">
                            <Coins size={48} />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase text-gray-400 tracking-[0.4em] mb-2">Karma Balance</p>
                            <h2 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 drop-shadow-sm">{profile.points}</h2>
                          </div>
                      </div>
                      <div className="flex gap-4">
                        <Link to="/rewards">
                            <Button className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-xs bg-white text-black hover:bg-gray-200 shadow-xl">
                                Spend <ArrowUpRight className="ml-2" size={18}/>
                            </Button>
                        </Link>
                      </div>
                  </div>
              </div>

              {/* Earn Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={handleWatchAd}
                    disabled={isWatchingAd}
                    className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border-2 border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl hover:border-blue-500/50 transition-all group text-left relative overflow-hidden"
                  >
                      {isWatchingAd && (
                          <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                              <Loader2 className="animate-spin mb-4" size={48} />
                              <p className="font-black uppercase tracking-widest text-xs">Simulating Ad...</p>
                          </div>
                      )}
                      <div className="p-4 bg-blue-100 dark:bg-blue-900/30 w-fit rounded-2xl text-blue-600 mb-6 group-hover:scale-110 transition-transform"><PlayCircle size={32}/></div>
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900 dark:text-white mb-2">Watch Ad</h3>
                      <p className="text-gray-500 text-sm font-medium">Support the platform and earn instant +50 Karma.</p>
                  </button>

                  <button 
                    onClick={handleGetTip}
                    className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border-2 border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl hover:border-yellow-500/50 transition-all group text-left"
                  >
                      <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 w-fit rounded-2xl text-yellow-600 mb-6 group-hover:scale-110 transition-transform"><Lightbulb size={32}/></div>
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900 dark:text-white mb-2">Daily Wisdom</h3>
                      <p className="text-gray-500 text-sm font-medium">Read a health or study tip for +10 Karma.</p>
                  </button>
              </div>

              {/* Transactions */}
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-10 py-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-4">
                      <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg"><History size={20} className="text-gray-500"/></div>
                      <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-[0.2em]">Transaction Protocol</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto custom-scrollbar">
                      {transactions.length === 0 ? (
                          <div className="p-20 text-center text-gray-400">
                              <History size={64} className="mx-auto mb-6 opacity-20"/>
                              <p className="font-bold uppercase tracking-widest text-sm">No recent activity detected</p>
                          </div>
                      ) : (
                          transactions.map(tx => (
                              <div key={tx.id} className="p-8 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                  <div className="flex items-center gap-6">
                                      <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                          {tx.amount > 0 ? <ArrowDownLeft size={24}/> : <ArrowUpRight size={24}/>}
                                      </div>
                                      <div>
                                          <p className="font-black text-gray-900 dark:text-white text-lg uppercase italic tracking-tight">{tx.description || tx.type}</p>
                                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{new Date(tx.timestamp).toLocaleDateString()} • {new Date(tx.timestamp).toLocaleTimeString()}</p>
                                      </div>
                                  </div>
                                  <div className={`text-right font-black italic tracking-tighter text-2xl ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* MODALS */}
      
      {/* Avatar Studio */}
      {showAvatarMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl w-full max-w-[95vw] lg:max-w-7xl h-[90vh] overflow-hidden border-4 border-gray-200 dark:border-gray-800 flex flex-col animate-pop">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950 shrink-0">
              <h2 className="text-3xl font-black flex items-center gap-3 text-gray-900 dark:text-white tracking-tighter italic uppercase">
                <Sparkles className="text-indigo-500" size={32} /> Avatar Studio
              </h2>
              <button onClick={() => closeStudio(false)} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 hover:text-red-500">
                <X size={28} />
              </button>
            </div>

            <div className="p-6 bg-white dark:bg-gray-900 shrink-0 space-y-6">
               <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                 <button onClick={() => setStudioTab('avatars')} className={`flex-1 py-3 text-sm font-black uppercase tracking-wide rounded-xl transition-all ${studioTab === 'avatars' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
                   Avatar Base
                 </button>
                 <button onClick={() => setStudioTab('frames')} className={`flex-1 py-3 text-sm font-black uppercase tracking-wide rounded-xl transition-all ${studioTab === 'frames' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
                   Frames
                 </button>
               </div>
               {studioTab === 'avatars' && (
                   <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                       {['avataaars', 'adventurer', 'scifi'].map((col) => (
                           <button 
                            key={col}
                            onClick={() => setActiveCollection(col as any)}
                            className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 transition-all flex items-center gap-2 ${activeCollection === col ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'}`}
                           >
                               {col}
                               {col === 'adventurer' && isAdventurerLocked && <Lock size={12} />}
                           </button>
                       ))}
                   </div>
               )}
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-gray-50 dark:bg-black/20 custom-scrollbar relative">
              {studioTab === 'avatars' ? (
                // Locked Collection View
                activeCollection === 'adventurer' && isAdventurerLocked ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-sm z-10 p-8 text-center animate-in zoom-in">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-gray-300 dark:border-gray-700">
                            <Lock size={48} className="text-gray-400" />
                        </div>
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-gray-800 dark:text-white mb-2">Locked Collection</h3>
                        <p className="text-gray-500 max-w-sm mb-8 font-medium">
                            The Adventurer Pack is a premium set available in the Karma Bazaar. Unlock it to access these exclusive RPG-style avatars.
                        </p>
                        <div className="mt-6 p-4 bg-gray-200 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-400 dark:border-gray-600">
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Pack Not Purchased</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 animate-in fade-in">
                    {(activeCollection === 'adventurer' ? ADVENTURER_PRESETS : (activeCollection === 'scifi' ? SCIFI_PRESETS : AVATAR_PRESETS)).map((preset) => (
                        <button 
                        key={preset.id}
                        onClick={() => selectPresetAvatar(preset.seed)}
                        className={`group relative flex flex-col items-center gap-4 p-6 rounded-[2rem] transition-all duration-200 border-4 ${isAvatarSelected(preset.seed) ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-xl' : 'bg-white dark:bg-gray-800 border-transparent hover:border-indigo-200 hover:shadow-lg'}`}
                        >
                        <div className={`w-24 h-24 rounded-full ${preset.bg} p-1 border-4 ${preset.border} overflow-hidden shadow-sm group-hover:scale-110 transition-transform`}>
                            <img 
                            src={activeCollection === 'adventurer' ? `https://api.dicebear.com/9.x/adventurer/svg?seed=${preset.seed}&backgroundColor=transparent` : (activeCollection === 'scifi' ? `https://api.dicebear.com/7.x/bottts/svg?seed=${preset.seed}&backgroundColor=transparent` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${preset.seed}&backgroundColor=transparent`)} 
                            alt={preset.name}
                            className="w-full h-full object-cover rounded-full"
                            />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">{preset.name}</span>
                        </button>
                    ))}
                    </div>
                )
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {FRAMES.map((frame) => (
                    <button 
                      key={frame.id}
                      onClick={() => setTempFrame(frame.id)}
                      className={`group relative flex flex-col items-center gap-4 p-6 rounded-[2rem] transition-all border-4 ${tempFrame === frame.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-xl' : 'bg-white dark:bg-gray-800 border-transparent hover:border-indigo-200 hover:shadow-lg'}`}
                    >
                      <div className={`w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 p-1 overflow-hidden ${frame.css} group-hover:scale-105 transition-transform`}>
                        <img 
                          src={tempAvatar || avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`} 
                          alt={frame.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">{frame.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 shrink-0">
               <Button variant="ghost" onClick={() => closeStudio(false)} className="h-14 px-8 rounded-2xl font-bold">Cancel</Button>
               <Button onClick={() => closeStudio(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-xl">Apply Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Tip Modal */}
      {showTipModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] p-8 text-center shadow-2xl border-4 border-yellow-400 relative overflow-hidden animate-pop">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Lightbulb size={120}/></div>
                  
                  <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 mx-auto mb-6 shadow-lg">
                      <Lightbulb size={40}/>
                  </div>
                  
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-4">Daily Wisdom</h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 font-medium italic mb-8 leading-relaxed">"{currentTip}"</p>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-2xl mb-8 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs font-black uppercase tracking-widest text-yellow-600 flex items-center justify-center gap-2">
                          <CheckCircle size={16}/> Reward Added
                      </p>
                      <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">+10 Karma</p>
                  </div>

                  <Button onClick={() => setShowTipModal(false)} className="w-full h-16 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg text-lg">
                      Awesome
                  </Button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Profile;
