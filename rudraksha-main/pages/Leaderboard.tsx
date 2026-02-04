
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { UserProfile } from '../types';
import { Trophy, Medal, User, GraduationCap, Briefcase, BookOpen, Crown, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Leaderboard: React.FC = () => {
  const { t } = useLanguage();
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [allUsers, profile] = await Promise.all([
        StorageService.getLeaderboard(50),
        StorageService.getProfile()
      ]);
      setLeaders(allUsers);
      setCurrentUser(profile);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getRankStyle = (index: number) => {
    switch(index) {
      case 0: return "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-400"; // Gold
      case 1: return "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"; // Silver
      case 2: return "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-400"; // Bronze
      default: return "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'student': return <GraduationCap size={14} />;
      case 'teacher': return <BookOpen size={14} />;
      default: return <Briefcase size={14} />;
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <Loader2 className="animate-spin text-yellow-500 w-12 h-12" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="text-center md:text-left">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center justify-center md:justify-start gap-3">
          <Trophy className="text-yellow-500 fill-yellow-400" size={32} /> {t("Leaderboard", "Leaderboard")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{t("Top achievers in the Rudraksha community.", "Top achievers in the Rudraksha community.")}</p>
      </header>

      {/* Podium Section (Top 3) */}
      {leaders.length >= 3 && (
        <div className="flex flex-wrap justify-center items-end gap-4 md:gap-8 mb-12 pt-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-100 order-1 md:order-none">
            <div className="relative">
               <img 
                 src={leaders[1].avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${leaders[1].name}`} 
                 alt={leaders[1].name} 
                 className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-gray-300 shadow-xl object-cover"
               />
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-800 font-bold px-3 py-1 rounded-full text-sm shadow-md border-2 border-white">2nd</div>
            </div>
            <div className="mt-4 text-center">
               <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate w-32">{leaders[1].name}</h3>
               <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{leaders[1].points} pts</p>
            </div>
            <div className="h-24 w-24 md:w-32 bg-gradient-to-t from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg mt-2 opacity-50"></div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 -mt-8 order-2 md:order-none z-10">
            <div className="relative">
               <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-500 fill-yellow-400 animate-bounce" size={32} />
               <img 
                 src={leaders[0].avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${leaders[0].name}`} 
                 alt={leaders[0].name} 
                 className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-yellow-400 shadow-2xl object-cover ring-4 ring-yellow-400/30"
               />
               <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 font-black px-4 py-1 rounded-full text-base shadow-lg border-2 border-white">1st</div>
            </div>
            <div className="mt-5 text-center">
               <h3 className="font-bold text-gray-900 dark:text-white text-xl truncate w-40">{leaders[0].name}</h3>
               <p className="text-yellow-600 dark:text-yellow-400 font-bold uppercase tracking-wider">{leaders[0].points} pts</p>
            </div>
            <div className="h-32 w-28 md:w-40 bg-gradient-to-t from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/10 rounded-t-lg mt-2 opacity-60"></div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-200 order-3 md:order-none">
            <div className="relative">
               <img 
                 src={leaders[2].avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${leaders[2].name}`} 
                 alt={leaders[2].name} 
                 className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-orange-300 shadow-xl object-cover"
               />
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-300 text-orange-900 font-bold px-3 py-1 rounded-full text-sm shadow-md border-2 border-white">3rd</div>
            </div>
            <div className="mt-4 text-center">
               <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate w-32">{leaders[2].name}</h3>
               <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{leaders[2].points} pts</p>
            </div>
            <div className="h-16 w-24 md:w-32 bg-gradient-to-t from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/10 rounded-t-lg mt-2 opacity-50"></div>
          </div>
        </div>
      )}

      {/* List Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4 w-16 text-center">Rank</th>
                <th className="p-4">User</th>
                <th className="p-4 hidden sm:table-cell">Role</th>
                <th className="p-4 text-right">Karma Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {leaders.map((user, index) => {
                const isMe = currentUser?.id === user.id;
                return (
                  <tr 
                    key={user.id} 
                    className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isMe ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${index < 3 ? 'font-medium' : ''}`}
                  >
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${index < 3 ? getRankStyle(index) : 'text-gray-500'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                          className="w-10 h-10 rounded-full bg-gray-200 object-cover border border-gray-100 dark:border-gray-600"
                          alt={user.name}
                        />
                        <div>
                          <p className={`font-bold text-sm ${isMe ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                            {user.name} {isMe && "(You)"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden capitalize">
                            {user.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 capitalize border border-gray-200 dark:border-gray-600">
                        {getRoleIcon(user.role)} {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono font-bold text-gray-900 dark:text-white">{user.points.toLocaleString()}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
