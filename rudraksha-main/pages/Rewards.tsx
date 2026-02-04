
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { UserProfile } from '../types';
import { Button } from '../components/ui/Button';
import { ShoppingBag, Star, Crown, Heart, TreePine, Dog, Sparkles, Lock, CheckCircle, Loader2, Coins, Palette, Compass, Flame, Zap, Calendar, Gift } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import confetti from 'canvas-confetti';
import { THEME_REGISTRY } from '../config/themes';

interface RewardItem {
  id: string;
  nameKey: string;
  cost: number;
  icon: React.FC<any>;
  color: string;
  category: 'digital' | 'impact' | 'theme' | 'spiritual';
  descriptionKey: string;
}

const ITEMS: RewardItem[] = [
  { id: 'frame_gold', nameKey: 'Golden Avatar Frame', cost: 200, icon: Crown, color: 'text-yellow-500', category: 'digital', descriptionKey: 'Stand out with a royal golden border.' },
  { id: 'pack_adventurer', nameKey: 'Adventurer Avatar Pack', cost: 500, icon: Compass, color: 'text-blue-600', category: 'digital', descriptionKey: 'Unlock the RPG-style Adventurer avatar collection.' },
  { id: 'theme_rudra', nameKey: 'Rudra Eternal', cost: 400, icon: Flame, color: 'text-orange-600', category: 'spiritual', descriptionKey: 'Premium dark theme dedicated to Lord Shiva.' },
  { id: 'theme_divine', nameKey: 'Divine Radiance', cost: 450, icon: SunIcon, color: 'text-yellow-400', category: 'spiritual', descriptionKey: 'Glow with celestial light and spiritual energy.' },
  { id: 'theme_buddha', nameKey: "Buddha's Path", cost: 350, icon: Sparkles, color: 'text-red-500', category: 'spiritual', descriptionKey: 'Serene heritage theme with a peaceful aesthetic.' },
  { id: 'theme_cyberpunk', nameKey: 'Cyber Protocol', cost: 400, icon: Zap, color: 'text-pink-500', category: 'theme', descriptionKey: 'Futuristic Tech aesthetic.' },
  { id: 'theme_royal', nameKey: 'Royal Palace', cost: 450, icon: Crown, color: 'text-purple-600', category: 'theme', descriptionKey: 'Gilded palace interior vibes.' },
  { id: 'theme_gold', nameKey: 'Golden Karma', cost: 600, icon: Coins, color: 'text-amber-500', category: 'theme', descriptionKey: 'Solid gold UI for the masters.' },
  { id: 'theme_obsidian', nameKey: 'Black Velvet', cost: 750, icon: Lock, color: 'text-gray-900', category: 'theme', descriptionKey: 'Absolute pitch black premium skin.' },
  { id: 'donate_dog', nameKey: 'Feed a Stray Dog', cost: 100, icon: Dog, color: 'text-orange-600', category: 'impact', descriptionKey: 'We donate Rs. 10 to a local shelter.' },
  { id: 'donate_tree', nameKey: 'Plant a Tree', cost: 250, icon: TreePine, color: 'text-green-600', category: 'impact', descriptionKey: 'Contribute to reforestation projects.' },
  { id: 'donate_orphan', nameKey: 'Donate to Orphanage', cost: 1000, icon: Heart, color: 'text-pink-600', category: 'impact', descriptionKey: 'Provide school supplies for a child.' },
];

function SunIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
    </svg>
  );
}

const Rewards: React.FC = () => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [claimingDaily, setClaimingDaily] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const p = await StorageService.getProfile();
    setProfile(p);
    setLoading(false);
  };

  const handleRedeem = async (item: RewardItem) => {
    if (!profile) return;
    setRedeeming(item.id);
    
    setTimeout(async () => {
      const { success, error } = await StorageService.redeemReward(item.id, item.cost);
      if (success) {
        setProfile(prev => prev ? { ...prev, points: prev.points - item.cost, unlockedItems: [...(prev.unlockedItems || []), item.id] } : null);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#FFD700', '#FFA500'] });
        window.dispatchEvent(new Event('rudraksha-profile-update'));
      } else {
        alert(error || t("Insufficient Karma", "Insufficient Karma"));
      }
      setRedeeming(null);
    }, 800);
  };

  const handleEquipTheme = async (themeId: string) => {
    if (!profile) return;
    setRedeeming(themeId); 
    const newTheme = profile.activeTheme === themeId ? 'default' : themeId;
    const updated = await StorageService.updateProfile({ activeTheme: newTheme });
    setProfile(updated);
    setRedeeming(null);
    window.dispatchEvent(new Event('rudraksha-profile-update'));
  };

  const handleDailyClaim = async () => {
      setClaimingDaily(true);
      const res = await StorageService.claimDailyBonus();
      if (res.success) {
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.3 } });
          const p = await StorageService.getProfile();
          setProfile(p);
          alert(res.message);
      } else {
          alert(res.message);
      }
      setClaimingDaily(false);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-red-600"/></div>;
  if (!profile) return null;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-tighter">
            <ShoppingBag className="text-red-600" /> {t("Karma Bazaar", "Karma Bazaar")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t("Redeem your hard-earned points for digital goods or social impact.", "Redeem your hard-earned points for digital goods or social impact.")}</p>
        </div>
        
        <div className="flex gap-3">
            <Button onClick={handleDailyClaim} disabled={claimingDaily} className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-2xl shadow-xl font-black uppercase text-xs tracking-widest px-6">
                {claimingDaily ? <Loader2 className="animate-spin" size={16}/> : <><Gift size={16} className="mr-2"/> Daily Bonus</>}
            </Button>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border-b-4 border-red-600 flex items-center gap-4">
               <div>
                 <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{t("Balance", "Balance")}</p>
                 <p className="text-3xl font-black text-red-600 dark:text-red-400 flex items-center gap-2">
                   <Coins className="fill-yellow-400 text-yellow-500" /> {profile.points}
                 </p>
               </div>
            </div>
        </div>
      </header>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-tighter italic">
            <Flame className="text-orange-500" /> Spiritual Aesthetics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ITEMS.filter(i => i.category === 'spiritual').map((item, idx) => (
              <div key={item.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <RewardCard item={item} profile={profile} onRedeem={handleRedeem} onEquip={handleEquipTheme} redeeming={redeeming} t={t} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-tighter italic">
            <Palette className="text-indigo-500" /> Premium Skins
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ITEMS.filter(i => i.category === 'theme').map((item, idx) => (
              <div key={item.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <RewardCard item={item} profile={profile} onRedeem={handleRedeem} onEquip={handleEquipTheme} redeeming={redeeming} t={t} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-tighter italic">
            <Sparkles className="text-purple-500" /> {t("Digital Goods", "Digital Goods")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ITEMS.filter(i => i.category === 'digital').map((item, idx) => (
              <div key={item.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <RewardCard item={item} profile={profile} onRedeem={handleRedeem} onEquip={handleEquipTheme} redeeming={redeeming} t={t} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-tighter italic">
            <Heart className="text-red-500" /> {t("Social Impact", "Social Impact")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ITEMS.filter(i => i.category === 'impact').map((item, idx) => (
              <div key={item.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <RewardCard item={item} profile={profile} onRedeem={handleRedeem} onEquip={handleEquipTheme} redeeming={redeeming} t={t} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const RewardCard: React.FC<{ item: RewardItem, profile: UserProfile, onRedeem: (i: RewardItem) => void, onEquip: (id: string) => void, redeeming: string | null, t: any }> = ({ item, profile, onRedeem, onEquip, redeeming, t }) => {
  const isOwned = profile.unlockedItems?.includes(item.id);
  const canAfford = profile.points >= item.cost;
  const isRedeeming = redeeming === item.id;
  const isTheme = item.category === 'theme' || item.category === 'spiritual';
  const isEquipped = profile.activeTheme === item.id;

  return (
    <div className={`
      relative bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-sm border-2 transition-all duration-300 group flex flex-col h-full
      ${isEquipped ? 'border-indigo-500 ring-4 ring-indigo-500/10' : (isOwned ? 'border-green-100 bg-green-50/20 dark:border-green-900/30' : 'border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:border-red-200 hover:-translate-y-1')}
    `}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${isOwned ? 'bg-green-100 text-green-600 shadow-lg' : 'bg-gray-50 dark:bg-gray-700 shadow-sm'} ${item.color}`}>
         {isOwned ? <CheckCircle size={28} /> : <item.icon size={28} />}
      </div>
      
      <div className="flex-1">
        <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2 tracking-tighter uppercase italic">{t(item.nameKey, item.nameKey)}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium leading-relaxed">{t(item.descriptionKey, item.descriptionKey)}</p>
      </div>
      
      <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50 dark:border-gray-700">
        <span className="font-black text-gray-900 dark:text-white flex items-center gap-1.5">
          <Coins size={18} className="text-yellow-500 fill-yellow-400" /> {item.cost}
        </span>
        
        {isOwned && isTheme ? (
           <Button onClick={() => onEquip(item.id)} disabled={isRedeeming} className={`px-6 rounded-xl font-black uppercase text-xs tracking-widest h-10 ${isEquipped ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg' : 'bg-gray-800 hover:bg-gray-900 text-white'}`} size="sm">
             {isRedeeming ? <Loader2 className="animate-spin" size={16}/> : (isEquipped ? "Applied" : "Equip")}
           </Button>
        ) : isOwned && item.category === 'digital' ? (
          <span className="text-xs font-black text-green-600 bg-green-100 px-4 py-2 rounded-xl uppercase tracking-widest">{t("Owned", "Owned")}</span>
        ) : (
          <Button onClick={() => onRedeem(item)} disabled={!canAfford || isRedeeming} className={`px-6 rounded-xl font-black uppercase text-xs tracking-widest h-10 ${isOwned ? 'bg-green-600 hover:bg-green-700' : (canAfford ? 'bg-red-600 hover:bg-red-700 shadow-lg' : 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-400')}`} size="sm">
            {isRedeeming ? <Loader2 className="animate-spin" size={16}/> : (isOwned ? t("Buy Again", "Buy Again") : t("Unlock", "Unlock"))}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Rewards;
