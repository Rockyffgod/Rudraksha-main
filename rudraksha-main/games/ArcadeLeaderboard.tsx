
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Trophy, Coins, Brain, Sparkles, Loader2, RefreshCw, User, Crown, BarChart3, Zap, TrendingUp, Hexagon } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { UserProfile } from '../types';

interface ArcadeLeaderboardProps {
  onExit: () => void;
}

export const ArcadeLeaderboard: React.FC<ArcadeLeaderboardProps> = ({ onExit }) => {
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'points' | 'speed' | 'memory' | 'danphe' | 'flexibility' | 'truth' | 'mandala'>('points');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allUsers, profile] = await Promise.all([
        StorageService.getLeaderboard(50, activeTab as any),
        StorageService.getProfile()
      ]);
      setLeaders(allUsers || []); // Ensure array
      setCurrentUser(profile);
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const getRankStyle = (index: number) => {
    switch(index) {
      case 0: return "bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)] ring-1 ring-yellow-500/50"; // Gold
      case 1: return "bg-slate-400/20 border-slate-400 text-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.3)]"; // Silver
      case 2: return "bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]"; // Bronze
      default: return "bg-gray-800/50 border-gray-700 text-gray-400";
    }
  };

  const getScoreDisplay = (user: UserProfile) => {
      if (activeTab === 'points') return user.points || 0;
      return (user.highScores as any)?.[activeTab] || 0;
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#0f172a] flex flex-col overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px]"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]"></div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6 md:px-10 bg-gray-900/60 border-b border-white/5 backdrop-blur-xl shrink-0">
         {/* Back Button on Left with margin */}
         <Button variant="ghost" onClick={onExit} className="ml-4 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 rounded-xl px-6 py-2 transition-all font-black uppercase text-xs tracking-widest flex-shrink-0">
            <ArrowLeft size={16} className="mr-2"/> Back
         </Button>

         {/* Title Centered but slightly right */}
         <div className="flex-1 flex justify-center pl-10">
            <div className="text-center">
                <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 flex items-center justify-center gap-3 drop-shadow-md">
                <BarChart3 size={32} className="text-yellow-500" />
                RANKINGS
                </h1>
                <p className="text-xs text-white/40 uppercase tracking-widest font-bold ml-1">Global Hall of Fame</p>
            </div>
         </div>
         
         <div className="flex gap-4">
             <Button variant="ghost" onClick={fetchData} className="text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-full transition-all border border-transparent hover:border-white/10" title="Refresh">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
             </Button>
         </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
         <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Tabs */}
            <div className="flex justify-center md:justify-start overflow-x-auto pb-4 scrollbar-none">
                <div className="flex gap-2 p-1 bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
                    {[
                        { id: 'points', label: 'Global Karma', icon: Coins, color: 'text-yellow-400' },
                        { id: 'speed', label: 'Speed Zone', icon: Zap, color: 'text-red-400' },
                        { id: 'memory', label: 'Memory Shore', icon: Brain, color: 'text-cyan-400' },
                        { id: 'danphe', label: 'Danphe Rush', icon: TrendingUp, color: 'text-emerald-400' },
                        { id: 'flexibility', label: 'Mental Agility', icon: RefreshCw, color: 'text-pink-400' },
                        { id: 'truth', label: 'Logic Fuses', icon: Sparkles, color: 'text-amber-400' },
                        { id: 'mandala', label: 'Mandala Mind', icon: Hexagon, color: 'text-purple-400' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                relative px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap text-sm
                                ${activeTab === tab.id 
                                    ? 'bg-gray-800 text-white shadow-lg ring-1 ring-white/10' 
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
                            `}
                        >
                            {/* @ts-ignore */}
                            <tab.icon size={16} className={activeTab === tab.id ? tab.color : 'opacity-50'}/> 
                            {tab.label}
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-white/20 rounded-t-full"></span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
               <div className="flex flex-col justify-center items-center h-64 gap-4 opacity-70">
                  <Loader2 className="animate-spin text-white w-12 h-12" />
                  <p className="text-white/50 text-sm uppercase tracking-widest font-bold">Syncing Records...</p>
               </div>
            ) : (
               <div className="bg-gray-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="grid grid-cols-12 gap-4 p-4 bg-black/20 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-white/5">
                        <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                        <div className="col-span-7 md:col-span-6">Player</div>
                        <div className="hidden md:col-span-2 md:block text-center">Role</div>
                        <div className="col-span-3 md:col-span-3 text-right pr-4">Score</div>
                    </div>
                    
                    <div className="divide-y divide-white/5">
                        {leaders.length === 0 && (
                            <div className="p-16 text-center text-gray-500 flex flex-col items-center">
                                <Trophy size={48} className="mb-4 opacity-20" />
                                <p className="font-bold text-lg">No records found yet.</p>
                                <p className="text-sm mt-1 opacity-60">Be the first to claim the throne!</p>
                            </div>
                        )}
                        {leaders.map((user, index) => {
                          const isMe = currentUser?.id === user.id;
                          return (
                            <div 
                              key={user.id} 
                              className={`
                                grid grid-cols-12 gap-4 items-center p-4 transition-all duration-200 group
                                ${isMe ? 'bg-indigo-600/10 border-l-4 border-indigo-500' : 'hover:bg-white/5 border-l-4 border-transparent'}
                              `}
                            >
                              {/* Rank */}
                              <div className="col-span-2 md:col-span-1 flex justify-center">
                                <div className={`
                                    w-10 h-10 flex items-center justify-center rounded-full font-black text-sm border-2 shadow-inner
                                    ${getRankStyle(index)}
                                `}>
                                  {index < 3 ? <Crown size={14} className="mr-0.5"/> : '#'}
                                  {index + 1}
                                </div>
                              </div>

                              {/* Player */}
                              <div className="col-span-7 md:col-span-6 flex items-center gap-4">
                                <div className="relative">
                                    <img 
                                      src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                                      className={`w-12 h-12 rounded-2xl object-cover bg-gray-800 shadow-md ${index === 0 ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-gray-900' : ''}`}
                                      alt={user.name}
                                    />
                                    {isMe && <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-1 border border-gray-900"><User size={8}/></div>}
                                </div>
                                <div className="min-w-0">
                                    <p className={`font-bold text-base truncate ${isMe ? 'text-indigo-400' : 'text-gray-100 group-hover:text-white'}`}>
                                      {user.name}
                                    </p>
                                    {isMe && <p className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-wider">You</p>}
                                </div>
                              </div>

                              {/* Role */}
                              <div className="hidden md:col-span-2 md:flex justify-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/5 text-gray-400 border border-white/5 uppercase tracking-wide">
                                  {user.role}
                                </span>
                              </div>

                              {/* Score */}
                              <div className="col-span-3 md:col-span-3 text-right pr-4">
                                <span className={`font-mono font-black text-xl md:text-2xl ${index === 0 ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-200'}`}>
                                    {getScoreDisplay(user).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};
