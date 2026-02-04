import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, Check, Lock, Palette, Search, RefreshCw, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { THEME_REGISTRY, THEME_CATEGORIES } from '../config/themes';

const ThemeSelection: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTheme, setActiveTheme] = useState('default');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const p = await StorageService.getProfile();
      setProfile(p);
      if (p?.activeTheme) setActiveTheme(p.activeTheme);
    };
    loadData();
  }, []);

  const handleSelectTheme = async (themeId: string) => {
    if (!profile) return;
    const theme = THEME_REGISTRY[themeId];
    if (theme?.isPremium && !profile.unlockedItems?.includes(themeId)) return;

    setActiveTheme(themeId);
    await StorageService.updateProfile({ activeTheme: themeId });
    setProfile(prev => prev ? { ...prev, activeTheme: themeId } : null);
    window.dispatchEvent(new Event('rudraksha-profile-update'));
  };

  const handleRandomize = () => {
    const unlockedThemes = Object.values(THEME_REGISTRY).filter(theme => 
      !theme.isPremium || profile?.unlockedItems?.includes(theme.id)
    );
    const randomTheme = unlockedThemes[Math.floor(Math.random() * unlockedThemes.length)];
    handleSelectTheme(randomTheme.id);
  };

  const categoriesToRender = activeCategory === 'All' 
    ? THEME_CATEGORIES.filter(c => c !== 'All') 
    : [activeCategory];

  // Defined filteredThemes to solve the "Cannot find name 'filteredThemes'" error.
  const filteredThemes = Object.values(THEME_REGISTRY).filter(theme => 
    (activeCategory === 'All' || theme.category === activeCategory) &&
    theme.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/settings')} className="hover:bg-black/5 dark:hover:bg-white/5 rounded-xl">
             <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic tracking-tighter uppercase">
              <Palette className="text-red-600" /> {t("Theme Studio", "Theme Studio")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Customize your ritual environment.</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Find aesthetic..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-red-500 transition-all"
                />
            </div>
            <Button onClick={handleRandomize} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none whitespace-nowrap">
                <RefreshCw size={18} className="mr-2"/> Lucky Pick
            </Button>
        </div>
      </header>

      {/* Category Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar sticky top-0 z-30 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md py-4 -mx-4 px-4">
        {THEME_CATEGORIES.map(cat => (
            <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-red-600 text-white shadow-xl' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700 hover:border-red-200'}`}
            >
                {cat}
            </button>
        ))}
      </div>

      {/* Section Divisions */}
      {categoriesToRender.map(cat => {
        const catThemes = Object.values(THEME_REGISTRY).filter(theme => 
          theme.category === cat && 
          theme.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (catThemes.length === 0) return null;

        return (
          <div key={cat} className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 italic">{cat} Collection</h2>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {catThemes.map((theme) => {
                const isLocked = theme.isPremium && !profile?.unlockedItems?.includes(theme.id);
                const isActive = activeTheme === theme.id;
                const palette = Object.values(theme.colors);

                return (
                  <div 
                    key={theme.id}
                    onClick={() => !isLocked && handleSelectTheme(theme.id)}
                    className={`
                      relative overflow-hidden rounded-[2.5rem] border-4 transition-all cursor-pointer group h-72 flex flex-col
                      ${isActive ? 'border-red-500 shadow-2xl scale-[1.02] ring-4 ring-red-500/10' : 'border-white dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-600 shadow-lg'}
                      ${isLocked ? 'grayscale-[0.5] opacity-80' : ''}
                    `}
                  >
                    <div 
                      className="flex-1 relative p-6 flex flex-col justify-between overflow-hidden"
                      style={{ 
                          backgroundColor: theme.bgColor, 
                          backgroundImage: theme.bgPattern || 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                      }}
                    >
                      {theme.isAnimated && (
                        <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none"></div>
                      )}
                      
                      <div className="flex justify-between items-start relative z-10">
                          {isActive ? (
                              <div className="bg-white text-gray-900 text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border-2 border-red-500 animate-pop">
                                  <Check size={10} strokeWidth={4} /> ACTIVE
                              </div>
                          ) : isLocked ? (
                              <div className="bg-black/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                  <Lock size={10} /> BAZAAR
                              </div>
                          ) : (
                              <div className="bg-white/60 backdrop-blur-md text-gray-600 text-[8px] font-black px-2 py-0.5 rounded-lg border border-black/5 uppercase tracking-widest">{theme.category}</div>
                          )}
                          {theme.isAnimated && (
                            <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-lg">NEON FLOW</span>
                          )}
                      </div>

                      <div className="space-y-3 relative z-10">
                          <h3 className="font-black text-2xl italic tracking-tighter text-gray-900 dark:text-white uppercase drop-shadow-md">{theme.name}</h3>
                          <div className="flex gap-1">
                              {palette.map((c, i) => (
                                  <div key={i} className="w-6 h-1.5 rounded-full border border-black/5 shadow-inner" style={{ backgroundColor: c }}></div>
                              ))}
                          </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isLocked ? 'Premium' : 'Standard'}</span>
                         <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">{theme.uiMode} mode</span>
                      </div>
                      {isLocked ? (
                          <Link to="/rewards">
                              <button className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                                 <ChevronRight size={20}/>
                              </button>
                          </Link>
                      ) : (
                          <button 
                              onClick={(e) => { e.stopPropagation(); handleSelectTheme(theme.id); }}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-red-50 hover:text-red-600'}`}
                              disabled={isActive}
                          >
                              {isActive ? <Check size={20} strokeWidth={3}/> : <Palette size={20}/>}
                          </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {filteredThemes.length === 0 && (
          <div className="py-20 text-center text-gray-400">
              <Sparkles size={48} className="mx-auto mb-4 opacity-20"/>
              <p className="font-black text-xl uppercase tracking-widest">No matching aesthetic found</p>
              <Button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} variant="ghost" className="mt-4">Reset Studio</Button>
          </div>
      )}
    </div>
  );
};

export default ThemeSelection;