
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Bell, Moon, Globe, Shield, Smartphone, Trash2, LogOut, 
  Info, ChevronRight, Save, Database, Palette, Volume2, 
  VolumeX, Radio, Zap, Lock, Eye, EyeOff, ShieldCheck, 
  HelpCircle, User, MessageSquare, Headphones, Construction,
  Clock, Share2, Award, Heart, Mic, Camera, MapPin, Signal,
  Gamepad2, History, ArrowDownLeft, ArrowUpRight, Coins, BookOpen, Crown, Star,
  Facebook, Twitter // Added Twitter icon
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { PlatformService } from '../services/platformService'; // Added PlatformService
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AppSettings, UserProfile, Transaction } from '../types';
import { requestMicPermission } from '../services/geminiService';
import confetti from 'canvas-confetti';

const SettingSection = ({ title, icon: Icon, children, className = "" }: { title: string, icon?: any, children?: React.ReactNode, className?: string }) => {
  const { t } = useLanguage();
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8 animate-in slide-in-from-bottom-4 ${className}`}>
      <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-3">
        {Icon && <Icon size={20} className="text-indigo-500" />}
        <h3 className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-[0.3em]">{t(title, title)}</h3>
      </div>
      <div className="p-4 md:p-6 space-y-1">
        {children}
      </div>
    </div>
  );
};

const SettingItem = ({ 
  icon: Icon, 
  label, 
  description, 
  action,
  onClick,
  badge
}: { 
  icon: any, 
  label: string, 
  description?: string, 
  action?: React.ReactNode,
  onClick?: () => void,
  badge?: string
}) => {
  const { t } = useLanguage();
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-[1.5rem] transition-all group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-2xl text-gray-600 dark:text-gray-300 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
          <Icon size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{t(label, label)}</p>
            {badge && <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full shadow-sm ${badge.includes('Upcoming') ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400' : 'bg-yellow-400 text-yellow-900'}`}>{badge}</span>}
          </div>
          {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium leading-tight">{t(description, description)}</p>}
        </div>
      </div>
      <div className="shrink-0 ml-4">
        {action}
      </div>
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onChange(); }}
    className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ease-in-out relative ${checked ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-gray-300 dark:bg-gray-600'}`}
  >
    <div className={`bg-white w-5 h-5 rounded-full shadow-xl transform transition-transform duration-300 ${checked ? 'translate-x-7' : 'translate-x-0'}`} />
  </button>
);

const BadgeItem = ({ name, desc, icon: Icon, unlocked, color }: { name: string, desc: string, icon: any, unlocked: boolean, color: string }) => (
    <div className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all min-h-[160px] ${unlocked ? `bg-white dark:bg-gray-700/50 border-${color}-100 dark:border-${color}-900` : 'bg-gray-50 dark:bg-gray-800 border-dashed border-gray-200 dark:border-gray-700 opacity-50'}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${unlocked ? `bg-${color}-100 dark:bg-${color}-900/50 text-${color}-600 dark:text-${color}-400 shadow-sm` : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
            <Icon size={32} />
        </div>
        <h4 className={`text-sm font-black uppercase tracking-wider mb-2 text-center ${unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{name}</h4>
        <p className="text-[10px] text-center font-medium text-gray-500 leading-tight max-w-[120px]">{unlocked ? desc : 'Locked'}</p>
    </div>
);

const SubscriptionCard = ({ tier, price, karmaCost, perks, active, onBuy }: any) => (
    <div className={`relative p-6 rounded-[2.5rem] border-4 flex flex-col justify-between h-full ${active ? 'bg-indigo-600 text-white border-indigo-400 shadow-2xl' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700'}`}>
        {active && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Current Plan</div>}
        <div>
            <h3 className={`text-2xl font-black italic uppercase tracking-tighter mb-2 ${active ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{tier}</h3>
            <p className={`text-xs font-bold uppercase tracking-widest mb-6 ${active ? 'text-indigo-200' : 'text-gray-400'}`}>Support Us!!</p>
            <ul className="space-y-3 mb-8">
                {perks.map((p: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-medium">
                        <CheckCircle size={16} className={active ? 'text-white' : 'text-green-500'} /> {p}
                    </li>
                ))}
            </ul>
        </div>
        <div className="space-y-3">
            <button onClick={() => onBuy('karma')} disabled={active} className={`w-full py-3 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all ${active ? 'bg-white/20 cursor-default' : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg'}`}>
                <Coins size={14}/> {karmaCost} Karma
            </button>
            <button onClick={() => onBuy('money')} disabled={active} className={`w-full py-3 rounded-xl font-black uppercase text-xs transition-all ${active ? 'hidden' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {price} (Simulate)
            </button>
        </div>
    </div>
);

import { CheckCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'account' | 'privacy'>('general');
  const [fbConnected, setFbConnected] = useState(false);

  useEffect(() => {
    const init = async () => {
      const [p, s] = await Promise.all([
        StorageService.getProfile(),
        StorageService.getSettings()
      ]);
      setProfile(p);
      setSettings(s);
      
      if (p) {
          const txs = await StorageService.getTransactions(p.id);
          setTransactions(txs);
      }
      
      // Check Platform Connection
      setFbConnected(PlatformService.isConnected('facebook'));
      
      setLoading(false);
    };
    init();
  }, []);

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!settings) return;
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await StorageService.saveSettings(newSettings);
    if (updates.language) setLanguage(updates.language);
  };

  const updatePermission = async (key: keyof AppSettings['permissions']) => {
      if (!settings) return;
      const currentState = settings.permissions[key];
      if (!currentState) {
          if (key === 'microphone') await requestMicPermission();
      }
      const newPermissions = { ...settings.permissions, [key]: !currentState };
      await updateSettings({ permissions: newPermissions });
  };

  const handleLogout = async () => {
    if (confirm("Sign out of Rudraksha?")) {
      await StorageService.logout();
      navigate('/auth');
    }
  };

  const handleSubscription = async (tier: 'weekly' | 'monthly' | 'lifetime', cost: number, currency: 'karma' | 'money') => {
      const res = await StorageService.purchaseSubscription(tier, cost, currency);
      if (res.success) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          const p = await StorageService.getProfile();
          setProfile(p);
          alert(`Successfully subscribed to ${tier} plan!`);
      } else {
          alert(res.error || "Transaction Failed");
      }
  };

  const handleFbConnect = () => {
      const username = prompt("Enter Facebook Username (for automation):", "rudra_user");
      if (username) {
          PlatformService.connect('facebook', { username });
          setFbConnected(true);
          alert("Facebook linked! Messenger automation active.");
      }
  };

  const handleFbDisconnect = () => {
      if(confirm("Unlink Facebook account? Automation features will be limited.")) {
          PlatformService.disconnect('facebook');
          setFbConnected(false);
      }
  };

  const clearCache = () => {
    if (confirm("Clear local cache? This will reset some local preferences but keep your account data.")) {
        alert("Cache cleared successfully!");
    }
  };

  if (loading || !settings) return <div className="h-screen flex items-center justify-center"><Zap className="animate-spin text-red-600"/></div>;

  const hasScholarBadge = profile ? (profile.unlockedItems || []).some(item => item === 'badge_scholar') : false;
  const hasCustomTheme = profile ? (profile.unlockedItems || []).some(item => item.startsWith('theme_')) : false;
  const hasDonated = profile ? (profile.unlockedItems || []).some(item => item.startsWith('donate_')) : false;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-4 italic tracking-tighter uppercase">
            <div className="p-3 bg-red-600 rounded-2xl text-white shadow-xl shadow-red-600/20">
                <Smartphone size={32} />
            </div>
            {t("Control Room", "Control Room")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mt-1 ml-1">
            {t("Optimize your Nepali companion experience.", "Optimize your Nepali companion experience.")}
          </p>
        </div>

        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl p-1.5 rounded-[1.5rem] flex gap-1 shadow-inner border border-gray-100 dark:border-gray-700">
            {[
                { id: 'general', label: 'App', icon: Smartphone },
                { id: 'account', label: 'Account', icon: User },
                { id: 'privacy', label: 'Safety', icon: ShieldCheck }
            ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <tab.icon size={14}/> {tab.label}
                </button>
            ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-0">
        
        {activeTab === 'general' && (
            <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
                <SettingSection title="Visual Identity" icon={Palette}>
                    <SettingItem 
                        icon={Palette} 
                        label="Theme Studio" 
                        description="Access 50+ custom UI aesthetics"
                        action={<ChevronRight size={20} className="text-gray-400 group-hover:text-indigo-600" />}
                        onClick={() => navigate('/settings/themes')}
                    />
                    <SettingItem 
                        icon={Globe} 
                        label="Primary Language" 
                        description="Nepali (Devanagari) or English"
                        action={
                            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                                <button onClick={() => updateSettings({ language: 'en' })} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${settings.language === 'en' ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-md' : 'text-gray-400'}`}>EN</button>
                                <button onClick={() => updateSettings({ language: 'ne' })} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${settings.language === 'ne' ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-md' : 'text-gray-400'}`}>NE</button>
                            </div>
                        } 
                    />
                    <SettingItem 
                        icon={Smartphone} 
                        label="Data Saver" 
                        description="Limit high-res image loading on Terai/Mountain networks"
                        action={<Toggle checked={settings.dataSaver} onChange={() => updateSettings({ dataSaver: !settings.dataSaver })} />} 
                    />
                </SettingSection>

                <SettingSection title="Immersion" icon={Volume2}>
                    <SettingItem 
                        icon={settings.soundEnabled ? Volume2 : VolumeX} 
                        label="Arcade Sounds" 
                        description="Game audio and system feedback"
                        action={<Toggle checked={settings.soundEnabled} onChange={() => updateSettings({ soundEnabled: !settings.soundEnabled })} />} 
                    />
                    <SettingItem 
                        icon={Zap} 
                        label="Hardcore Focus" 
                        description="Auto-kick distraction apps (Culture, Social) during study"
                        action={<Toggle checked={settings.autoFocusMode} onChange={() => updateSettings({ autoFocusMode: !settings.autoFocusMode })} />} 
                    />
                </SettingSection>
                
                <SettingSection title="Intelligence" icon={Database}>
                    <SettingItem 
                        icon={Database} 
                        label="Clear App Cache" 
                        description="Frees up space (local images & AI logs)"
                        action={<Button size="sm" variant="ghost" onClick={clearCache} className="text-red-500 font-black">RESET</Button>} 
                    />
                </SettingSection>
            </div>
        )}

        {activeTab === 'account' && (
            <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
                {/* Profile Header */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center gap-10 mb-8">
                    <div className="relative group">
                        <img src={profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name}`} className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 shadow-xl" />
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => navigate('/profile')}>
                            <Palette size={24} className="text-white"/>
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic mb-1">{profile?.name}</h2>
                        <p className="text-gray-500 font-medium text-lg">{profile?.email}</p>
                        <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-100">{profile?.role}</span>
                            <span className="px-4 py-1.5 bg-yellow-50 text-yellow-600 rounded-xl text-xs font-black uppercase tracking-widest border border-yellow-100">Level {Math.floor((profile?.xp || 0)/500)+1}</span>
                        </div>
                    </div>
                    <Button onClick={() => navigate('/profile')} className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 rounded-2xl text-sm font-black uppercase tracking-widest">EDIT PROFILE</Button>
                </div>

                {/* Social Connections */}
                <SettingSection title="Connected Platforms" icon={Share2}>
                    {/* Facebook - Locked */}
                    <SettingItem 
                        icon={Facebook} 
                        label="Facebook" 
                        description="Connect to enable Messenger automation" 
                        badge="Upcoming Feature"
                        action={
                            <Button size="sm" disabled className="bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl font-bold cursor-not-allowed">
                                <Lock size={14} className="mr-2"/> Locked
                            </Button>
                        } 
                    />
                    {/* Google - Locked */}
                    <SettingItem 
                        icon={Globe} 
                        label="Google" 
                        description="Sync Calendar, Drive & Mail integration" 
                        badge="Upcoming Feature"
                        action={
                            <Button size="sm" disabled className="bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl font-bold cursor-not-allowed">
                                <Lock size={14} className="mr-2"/> Locked
                            </Button>
                        } 
                    />
                    {/* Twitter - Locked */}
                    <SettingItem 
                        icon={Twitter} 
                        label="X (Twitter)" 
                        description="Automated social broadcasting & news feed" 
                        badge="Upcoming Feature"
                        action={
                            <Button size="sm" disabled className="bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl font-bold cursor-not-allowed">
                                <Lock size={14} className="mr-2"/> Locked
                            </Button>
                        } 
                    />
                </SettingSection>

                {/* Membership Plans */}
                <div className="mb-12">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-6 flex items-center gap-2"><Crown size={24} className="text-yellow-500"/> Membership Tiers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SubscriptionCard 
                            tier="Supporter" 
                            price="$1" 
                            karmaCost={500} 
                            perks={['Supporter Badge', 'Weekly Bonus', 'Ad-Free (Simulated)']}
                            active={profile?.subscription?.tier === 'weekly'}
                            onBuy={(currency: any) => handleSubscription('weekly', 500, currency)}
                        />
                        <SubscriptionCard 
                            tier="Believer" 
                            price="$3" 
                            karmaCost={1500} 
                            perks={['Believer Badge', 'Monthly Bonus', 'Priority AI Response']}
                            active={profile?.subscription?.tier === 'monthly'}
                            onBuy={(currency: any) => handleSubscription('monthly', 1500, currency)}
                        />
                        <SubscriptionCard 
                            tier="Guardian" 
                            price="$20" 
                            karmaCost={10000} 
                            perks={['Golden Frame', 'Lifetime Access', 'Dev Support']}
                            active={profile?.subscription?.tier === 'lifetime'}
                            onBuy={(currency: any) => handleSubscription('lifetime', 10000, currency)}
                        />
                    </div>
                </div>

                <SettingSection title="Achievement Badges" icon={Award}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <BadgeItem name="Diligent Scholar" desc="Complete 3 Assignments" icon={BookOpen} unlocked={hasScholarBadge} color="blue" />
                        <BadgeItem name="Theme Enthusiast" desc="Acquired a custom theme" icon={Palette} unlocked={hasCustomTheme} color="pink" />
                        <BadgeItem name="Philanthropist" desc="Donated via Karma Bazaar" icon={Heart} unlocked={hasDonated} color="red" />
                    </div>
                </SettingSection>

                <SettingSection title="Karma History" icon={History}>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-700">
                        {transactions.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <History size={48} className="mx-auto mb-4 opacity-20"/>
                                <p className="text-sm font-bold uppercase tracking-widest">No recent activity</p>
                            </div>
                        ) : (
                            transactions.map(tx => (
                                <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {tx.amount > 0 ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-tight">{tx.description || tx.type}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{new Date(tx.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className={`text-right font-black italic tracking-tighter text-xl ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </SettingSection>

                <div className="bg-red-50 dark:bg-red-900/10 rounded-[2rem] p-10 border-2 border-red-100 dark:border-red-900/30">
                    <h4 className="text-red-600 dark:text-red-400 font-black uppercase text-xs tracking-widest mb-8 italic">Danger Zone</h4>
                    <div className="space-y-4">
                        <Button variant="secondary" onClick={handleLogout} className="w-full justify-between h-16 bg-white dark:bg-gray-800 text-red-600 border border-red-100 dark:border-red-800 rounded-2xl px-8">
                            <span className="font-black italic uppercase tracking-tighter text-lg">Exit Companion</span>
                            <LogOut size={24}/>
                        </Button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'privacy' && (
            <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
                <SettingSection title="Device Permissions" icon={ShieldCheck}>
                    <SettingItem icon={Mic} label="Microphone Access" description="Required for Rudra Voice & Study Buddy" action={<Toggle checked={settings.permissions.microphone} onChange={() => updatePermission('microphone')} />} />
                    <SettingItem icon={Camera} label="Camera Access" description="Required for AR scans and Profile photo" action={<Toggle checked={settings.permissions.camera} onChange={() => updatePermission('camera')} />} />
                    <SettingItem icon={MapPin} label="Location Access" description="Used for Weather & FTL Rescue radius" action={<Toggle checked={settings.permissions.location} onChange={() => updatePermission('location')} />} />
                </SettingSection>
            </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
