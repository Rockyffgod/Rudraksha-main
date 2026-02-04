
import { 
  UserProfile, Task, FTLMission, Sighting, StudyNote, AppSettings, 
  Recipe, Review, ChatMessage, HealthLog, ChatGroup, CommunityMessage, 
  Book, StudySession, TaskStatus, RescueTag, ArcadeTask, DirectMessage, Transaction
} from '../types';
import { INITIAL_RECIPES } from '../data/staticData';

// LOCAL STORAGE KEYS
const TASKS_KEY = 'rudraksha_tasks';
const PROFILE_KEY = 'rudraksha_profile'; 
const USERS_KEY = 'rudraksha_users';
const HEALTH_KEY = 'rudraksha_health';
const RECIPES_KEY = 'rudraksha_recipes';
const NOTES_KEY = 'rudraksha_notes';
const REVIEWS_KEY = 'rudraksha_reviews';
const SESSIONS_KEY = 'rudraksha_study_sessions';
const GAME_SESSIONS_KEY = 'rudraksha_game_sessions'; 
const BOOKS_KEY = 'rudraksha_books';
const CHAT_KEY = 'rudraksha_community_chat';
const DM_KEY = 'rudraksha_direct_messages';
const GROUPS_KEY = 'rudraksha_groups';
const MISSIONS_KEY = 'rudraksha_ftl_missions';
const TAGS_KEY = 'rudraksha_rescue_tags';
const ARCADE_TASKS_KEY = 'rudraksha_arcade_daily_tasks';
const SETTINGS_KEY = 'rudraksha_settings';
const AUTH_KEY = 'rudraksha_is_authenticated';
const STUDY_CHAT_HISTORY_KEY = 'rudraksha_study_chat_history';
const RUDRA_GLOBAL_CHAT_KEY = 'rudraksha_global_chat_history';
const TRANSACTIONS_KEY = 'rudraksha_transactions';
const YOGA_TRACKING_KEY = 'rudraksha_yoga_daily_tracking';

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  hapticFeedback: true,
  autoFocusMode: false,
  dataSaver: false,
  broadcastRadius: 5,
  language: 'en',
  gpsAccuracy: 'high',
  notifications: {
    studyReminders: true,
    communityAlerts: true,
    arcadeTasks: false
  },
  permissions: {
    camera: false,
    microphone: false,
    location: false
  }
};

const safeSetItem = (key: string, value: string, useSession: boolean = false) => {
  try {
    if (useSession) sessionStorage.setItem(key, value);
    else localStorage.setItem(key, value);
  } catch (e: any) {
    console.error("Storage Quota Exceeded.");
  }
};

const getItem = (key: string): string | null => {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

export const StorageService = {
  isAuthenticated: async (): Promise<boolean> => {
    return getItem(AUTH_KEY) === 'true';
  },

  login: async (email: string, password?: string, remember: boolean = true): Promise<{ success: boolean; error?: string }> => {
    const usersStr = localStorage.getItem(USERS_KEY);
    let users: any[] = usersStr ? JSON.parse(usersStr) : [];
    const localUser = users.find(u => u.email === email && u.password === password);
    
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(PROFILE_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(PROFILE_KEY);

    if (localUser) {
      safeSetItem(AUTH_KEY, 'true', !remember);
      safeSetItem(PROFILE_KEY, JSON.stringify(localUser), !remember);
      return { success: true };
    }

    let demoProfile: UserProfile | null = null;
    if (email === 'admin@gmail.com' && password === 'admin123@') {
       demoProfile = { 
           id: 'admin-test-id', 
           name: 'Super Admin', 
           username: 'admin', 
           email: 'admin@gmail.com', 
           role: 'teacher', 
           schoolName: 'Rudraksha HQ', 
           schoolCode: 'SYS00', 
           points: 9999, 
           xp: 50000, 
           createdAt: Date.now(), 
           avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=robot2&backgroundColor=transparent', 
           frameId: 'neon',
           profession: 'Teacher',
           bio: "Building the future of digital Nepal, one block at a time. System Administrator.",
           highScores: {} // Reset to 0
       };
    } else if (email === 'student@demo.com' && password === 'demo123') {
       demoProfile = { 
           id: 'student-demo-id', name: 'Aarav Sharma', username: 'aarav_sharma', email: 'student@demo.com', role: 'student', 
           schoolName: 'Shivapuri Secondary School', schoolCode: 'SSS05',
           grade: '10', points: 450, xp: 1200, createdAt: Date.now(), avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav', profession: 'Student',
           bio: "Science enthusiast and avid gamer. Dreaming of Space Exploration! 🚀",
           highScores: {} // Reset to 0
       };
    } else if (email === 'teacher@demo.com' && password === 'demo123') {
       demoProfile = { 
           id: 'teacher-demo-id', name: 'Sita Miss', username: 'sita_guru', email: 'teacher@demo.com', role: 'teacher', 
           schoolName: 'Shivapuri Secondary School', schoolCode: 'SSS05',
           points: 1200, xp: 2500, createdAt: Date.now(), avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unicorn&backgroundColor=transparent', profession: 'Teacher', frameId: 'unicorn',
           bio: "Teaching is the greatest act of optimism. Passionate about History and Nepali Literature.",
           highScores: {} // Reset to 0
       };
    }

    if (demoProfile) {
       const existingIndex = users.findIndex(u => u.id === demoProfile!.id);
       if (existingIndex === -1) { users.push({ ...demoProfile, password }); } 
       else { 
           // Preserve existing high scores if any, otherwise use empty object
           const existing = users[existingIndex];
           demoProfile = { ...existing, ...demoProfile, highScores: existing.highScores || {} }; 
           users[existingIndex] = demoProfile;
       }
       safeSetItem(USERS_KEY, JSON.stringify(users), false);
       safeSetItem(AUTH_KEY, 'true', !remember);
       safeSetItem(PROFILE_KEY, JSON.stringify(demoProfile), !remember);
       return { success: true };
    }
    return { success: false, error: "Invalid credentials." };
  },

  logout: async () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(PROFILE_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
  },

  register: async (profile: UserProfile, password?: string, remember: boolean = true): Promise<{ success: boolean; error?: string }> => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: any[] = usersStr ? JSON.parse(usersStr) : [];
    if (users.find(u => u.email === profile.email)) return { success: false, error: "Email exists." };
    const newProfile = { ...profile, id: Date.now().toString(), password, points: 0, xp: 0, createdAt: Date.now() };
    users.push(newProfile);
    safeSetItem(USERS_KEY, JSON.stringify(users), false);
    safeSetItem(AUTH_KEY, 'true', !remember);
    safeSetItem(PROFILE_KEY, JSON.stringify(newProfile), !remember);
    return { success: true };
  },

  getProfile: async (): Promise<UserProfile | null> => {
    const stored = getItem(PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  updateProfile: async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
    const current = await StorageService.getProfile();
    if (!current) return null;
    const updated = { ...current, ...updates };
    if (sessionStorage.getItem(PROFILE_KEY)) safeSetItem(PROFILE_KEY, JSON.stringify(updated), true);
    else safeSetItem(PROFILE_KEY, JSON.stringify(updated), false);
    const usersStr = localStorage.getItem(USERS_KEY);
    if (usersStr) {
        let users: any[] = JSON.parse(usersStr);
        const idx = users.findIndex(u => u.id === current.id);
        if (idx !== -1) { users[idx] = { ...users[idx], ...updates }; safeSetItem(USERS_KEY, JSON.stringify(users), false); }
    }
    return updated;
  },

  getSettings: async (): Promise<AppSettings> => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    safeSetItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  addPoints: async (amount: number, xpAmount: number = 0, type: string = 'achievement', description: string = 'Points earned'): Promise<void> => {
    const profile = await StorageService.getProfile();
    if (profile) {
        await StorageService.updateProfile({ 
          points: (profile.points || 0) + amount,
          xp: (profile.xp || 0) + (xpAmount || amount * 5)
        });
        
        // Log transaction
        const txsStr = localStorage.getItem(TRANSACTIONS_KEY);
        const txs: Transaction[] = txsStr ? JSON.parse(txsStr) : [];
        txs.push({ 
            id: Date.now(), 
            userId: profile.id, 
            amount, 
            type, 
            description, 
            timestamp: Date.now() 
        });
        safeSetItem(TRANSACTIONS_KEY, JSON.stringify(txs), false);
    }
  },

  // --- NEW YOGA TRACKING LOGIC ---
  trackYogaSession: async (poseId: string): Promise<{ awarded: boolean, points: number, message: string }> => {
      const today = new Date().toISOString().split('T')[0];
      const trackingStr = localStorage.getItem(YOGA_TRACKING_KEY);
      const trackingData = trackingStr ? JSON.parse(trackingStr) : {};
      
      // Initialize or retrieve today's record
      const todayLog = trackingData[today] || { totalPoints: 0, completedPoses: [] };
      
      const DAILY_LIMIT = 100;
      const POSE_REWARD = 50;

      // Check constraints
      if (todayLog.completedPoses.includes(poseId)) {
          return { awarded: false, points: 0, message: "Already completed this flow today." };
      }

      if (todayLog.totalPoints >= DAILY_LIMIT) {
          return { awarded: false, points: 0, message: "Daily Yoga Karma limit reached (100/100)." };
      }

      // Process Award
      await StorageService.addPoints(POSE_REWARD, 20, 'yoga_session', `Yoga Flow Completed`);
      
      // Update Log
      todayLog.totalPoints += POSE_REWARD;
      todayLog.completedPoses.push(poseId);
      trackingData[today] = todayLog;
      
      // Clean up old entries to save space (keep last 7 days)
      const keys = Object.keys(trackingData).sort();
      if (keys.length > 7) {
          delete trackingData[keys[0]];
      }

      safeSetItem(YOGA_TRACKING_KEY, JSON.stringify(trackingData), false);
      return { awarded: true, points: POSE_REWARD, message: "Flow Complete! Karma Awarded." };
  },
  // ------------------------------

  claimDailyBonus: async (): Promise<{ success: boolean; amount: number; message: string }> => {
      const profile = await StorageService.getProfile();
      if (!profile) return { success: false, amount: 0, message: "Not logged in" };

      const now = Date.now();
      const lastClaim = profile.lastDailyClaim || 0;
      const hoursSince = (now - lastClaim) / (1000 * 60 * 60);

      if (hoursSince < 24) {
          const hoursLeft = Math.ceil(24 - hoursSince);
          return { success: false, amount: 0, message: `Wait ${hoursLeft} hours` };
      }

      const bonus = 100;
      await StorageService.addPoints(bonus, 50, 'daily_bonus', 'Daily Login Reward');
      await StorageService.updateProfile({ lastDailyClaim: now });
      return { success: true, amount: bonus, message: "Daily Bonus Claimed!" };
  },

  purchaseSubscription: async (tier: 'weekly' | 'monthly' | 'lifetime', cost: number, currency: 'karma' | 'money'): Promise<{ success: boolean; error?: string }> => {
      const profile = await StorageService.getProfile();
      if (!profile) return { success: false, error: "Not logged in" };

      if (currency === 'karma') {
          if (profile.points < cost) return { success: false, error: "Insufficient Karma points." };
          
          // Deduct points
          await StorageService.updateProfile({ points: profile.points - cost });
          
          // Log Transaction
          const txs = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
          txs.push({ 
              id: Date.now(), 
              userId: profile.id, 
              amount: -cost, 
              type: 'subscription', 
              description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription`, 
              timestamp: Date.now() 
          });
          safeSetItem(TRANSACTIONS_KEY, JSON.stringify(txs), false);
      }

      // Update Subscription Status
      let expiry = Date.now();
      if (tier === 'weekly') expiry += 7 * 24 * 60 * 60 * 1000;
      else if (tier === 'monthly') expiry += 30 * 24 * 60 * 60 * 1000;
      else if (tier === 'lifetime') expiry = 9999999999999;

      await StorageService.updateProfile({ 
          subscription: { tier, expiry } 
      });

      return { success: true };
  },

  rewardUser: async (userId: string, amount: number): Promise<void> => {
    const usersStr = localStorage.getItem(USERS_KEY);
    if (usersStr) {
        const users: UserProfile[] = JSON.parse(usersStr);
        const idx = users.findIndex(u => u.id === userId);
        if (idx !== -1) {
            users[idx].points = (users[idx].points || 0) + amount;
            safeSetItem(USERS_KEY, JSON.stringify(users), false);
            const txs = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
            txs.push({ id: Date.now(), userId, amount, type: 'reward', timestamp: Date.now() });
            safeSetItem(TRANSACTIONS_KEY, JSON.stringify(txs), false);
            const current = await StorageService.getProfile();
            if (current && current.id === userId) await StorageService.updateProfile({ points: users[idx].points });
        }
    }
  },

  getTransactions: async (userId: string): Promise<Transaction[]> => {
    const txsStr = localStorage.getItem(TRANSACTIONS_KEY);
    const allTxs: Transaction[] = txsStr ? JSON.parse(txsStr) : [];
    return allTxs.filter(tx => tx.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
  },

  getAvailableUsers: async (): Promise<UserProfile[]> => {
    const current = await StorageService.getProfile();
    const usersStr = localStorage.getItem(USERS_KEY);
    const allUsers: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];
    
    // virtual Rudra Profile
    const rudra: UserProfile = {
        id: 'rudra-ai-system',
        name: 'Rudra Core',
        username: 'rudra',
        email: 'system@rudraksha.ai',
        role: 'teacher', // Using existing role
        points: 9999,
        xp: 9999,
        profession: 'System AI',
        schoolCode: 'SYS00',
        schoolName: 'Rudraksha System',
        bio: 'I am the core intelligence of Rudraksha. I help guide, protect, and educate.',
        avatarUrl: 'https://iili.io/fgyxLsn.md.png'
    };

    if (!current) return [rudra, ...allUsers];
    const filtered = allUsers.filter(u => u.id !== current.id);
    return [rudra, ...filtered];
  },

  getDirectMessages: async (otherUserId: string): Promise<DirectMessage[]> => {
    const current = await StorageService.getProfile();
    if (!current) return [];
    const stored = localStorage.getItem(DM_KEY);
    const allMsgs: DirectMessage[] = stored ? JSON.parse(stored) : [];
    return allMsgs.filter(m => 
      (m.senderId === current.id && m.receiverId === otherUserId) ||
      (m.senderId === otherUserId && m.receiverId === current.id)
    ).sort((a, b) => a.timestamp - b.timestamp);
  },

  sendDirectMessage: async (receiverId: string, text: string, type: 'text' | 'image' | 'karma' = 'text', meta?: { imageUrl?: string, amount?: number, senderOverride?: string }): Promise<void> => {
    const current = await StorageService.getProfile();
    if (!current && !meta?.senderOverride) return;

    const stored = localStorage.getItem(DM_KEY);
    const allMsgs: DirectMessage[] = stored ? JSON.parse(stored) : [];
    
    const newMsg: DirectMessage = {
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      senderId: meta?.senderOverride || current!.id,
      receiverId: receiverId,
      text: text,
      timestamp: Date.now(),
      read: false,
      type: type,
      imageUrl: meta?.imageUrl,
      amount: meta?.amount
    };

    allMsgs.push(newMsg);
    safeSetItem(DM_KEY, JSON.stringify(allMsgs));
  },

  sendFriendRequest: async (targetUserId: string): Promise<{ success: boolean; message: string }> => {
      const current = await StorageService.getProfile();
      if (!current) return { success: false, message: "Not logged in" };
      
      const usersStr = localStorage.getItem(USERS_KEY);
      if (!usersStr) return { success: false, message: "Error" };
      const users: UserProfile[] = JSON.parse(usersStr);
      
      const targetIndex = users.findIndex(u => u.id === targetUserId);
      const currentIndex = users.findIndex(u => u.id === current.id);
      
      if (targetIndex === -1 || currentIndex === -1) return { success: false, message: "User not found" };
      
      // Update Target's friendRequests
      const targetUser = users[targetIndex];
      const requests = targetUser.friendRequests || [];
      if (!requests.includes(current.id)) {
          targetUser.friendRequests = [...requests, current.id];
      }
      
      // Update Current's sentRequests
      const currentUser = users[currentIndex];
      const sent = currentUser.sentRequests || [];
      if (!sent.includes(targetUser.id)) {
          currentUser.sentRequests = [...sent, targetUser.id];
      }
      
      users[targetIndex] = targetUser;
      users[currentIndex] = currentUser;
      
      safeSetItem(USERS_KEY, JSON.stringify(users), false);
      await StorageService.updateProfile({ sentRequests: currentUser.sentRequests });
      
      return { success: true, message: "Friend request sent!" };
  },

  acceptFriendRequest: async (requesterId: string): Promise<{ success: boolean; message: string }> => {
      const current = await StorageService.getProfile();
      if (!current) return { success: false, message: "Not logged in" };
      
      const usersStr = localStorage.getItem(USERS_KEY);
      if (!usersStr) return { success: false, message: "Error" };
      const users: UserProfile[] = JSON.parse(usersStr);
      
      const requesterIndex = users.findIndex(u => u.id === requesterId);
      const currentIndex = users.findIndex(u => u.id === current.id);
      
      if (requesterIndex === -1 || currentIndex === -1) return { success: false, message: "User not found" };
      
      // Update Current User (Receiver)
      const currentUser = users[currentIndex];
      currentUser.friendRequests = (currentUser.friendRequests || []).filter(id => id !== requesterId);
      currentUser.friends = [...(currentUser.friends || []), requesterId];
      
      // Update Requester
      const requester = users[requesterIndex];
      requester.sentRequests = (requester.sentRequests || []).filter(id => id !== current.id);
      requester.friends = [...(requester.friends || []), current.id];
      
      users[currentIndex] = currentUser;
      users[requesterIndex] = requester;
      
      safeSetItem(USERS_KEY, JSON.stringify(users), false);
      await StorageService.updateProfile({ friendRequests: currentUser.friendRequests, friends: currentUser.friends });
      
      return { success: true, message: "Friend request accepted!" };
  },

  rejectFriendRequest: async (requesterId: string): Promise<{ success: boolean; message: string }> => {
      const current = await StorageService.getProfile();
      if (!current) return { success: false, message: "Not logged in" };
      
      const usersStr = localStorage.getItem(USERS_KEY);
      if (!usersStr) return { success: false, message: "Error" };
      const users: UserProfile[] = JSON.parse(usersStr);
      
      const requesterIndex = users.findIndex(u => u.id === requesterId);
      const currentIndex = users.findIndex(u => u.id === current.id);
      
      if (requesterIndex === -1 || currentIndex === -1) return { success: false, message: "User not found" };
      
      // Update Current User
      const currentUser = users[currentIndex];
      currentUser.friendRequests = (currentUser.friendRequests || []).filter(id => id !== requesterId);
      
      // Update Requester (remove sent request)
      const requester = users[requesterIndex];
      requester.sentRequests = (requester.sentRequests || []).filter(id => id !== current.id);
      
      users[currentIndex] = currentUser;
      users[requesterIndex] = requester;
      
      safeSetItem(USERS_KEY, JSON.stringify(users), false);
      await StorageService.updateProfile({ friendRequests: currentUser.friendRequests });
      
      return { success: true, message: "Request declined." };
  },

  getMissions: async (): Promise<FTLMission[]> => {
    const stored = localStorage.getItem(MISSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveMission: async (mission: FTLMission): Promise<void> => {
    const missions = await StorageService.getMissions();
    const idx = missions.findIndex(m => m.id === mission.id);
    if (idx >= 0) missions[idx] = mission;
    else missions.unshift(mission);
    safeSetItem(MISSIONS_KEY, JSON.stringify(missions));
  },

  addSighting: async (missionId: string, sighting: Sighting): Promise<void> => {
    const missions = await StorageService.getMissions();
    const idx = missions.findIndex(m => m.id === missionId);
    if (idx >= 0) {
      missions[idx].sightings.unshift(sighting);
      safeSetItem(MISSIONS_KEY, JSON.stringify(missions));
    }
  },

  verifySighting: async (missionId: string, sightingId: string, verified: boolean): Promise<void> => {
    const missions = await StorageService.getMissions();
    const mIdx = missions.findIndex(m => m.id === missionId);
    if (mIdx >= 0) {
      const sIdx = missions[mIdx].sightings.findIndex(s => s.id === sightingId);
      if (sIdx >= 0) {
        (missions[mIdx].sightings[sIdx] as any).isVerified = verified;
        safeSetItem(MISSIONS_KEY, JSON.stringify(missions));
      }
    }
  },

  resolveMission: async (missionId: string): Promise<void> => {
    const missions = await StorageService.getMissions();
    const idx = missions.findIndex(m => m.id === missionId);
    if (idx >= 0) {
      missions[idx].status = 'resolved';
      safeSetItem(MISSIONS_KEY, JSON.stringify(missions));
    }
  },

  getRescueTags: async (): Promise<RescueTag[]> => {
    const stored = localStorage.getItem(TAGS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveRescueTag: async (tag: RescueTag): Promise<void> => {
    const tags = await StorageService.getRescueTags();
    const idx = tags.findIndex(t => t.id === tag.id);
    if (idx >= 0) tags[idx] = tag;
    else tags.unshift(tag);
    safeSetItem(TAGS_KEY, JSON.stringify(tags));
  },

  deleteRescueTag: async (tagId: string): Promise<void> => {
    const tags = await StorageService.getRescueTags();
    safeSetItem(TAGS_KEY, JSON.stringify(tags.filter(t => t.id !== tagId)));
  },

  getArcadeTasks: async (): Promise<ArcadeTask[]> => {
      const stored = localStorage.getItem(ARCADE_TASKS_KEY);
      return stored ? JSON.parse(stored) : [];
  },

  completeArcadeTask: async (taskId: string): Promise<void> => {
      const tasks = await StorageService.getArcadeTasks();
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1 && !tasks[taskIndex].completed) {
          tasks[taskIndex].completed = true;
          safeSetItem(ARCADE_TASKS_KEY, JSON.stringify(tasks));
          await StorageService.addPoints(tasks[taskIndex].reward, 0, 'achievement', 'Arcade Task Complete');
      }
  },

  getTasks: async (): Promise<Task[]> => {
    const stored = localStorage.getItem(TASKS_KEY);
    const allTasks: Task[] = stored ? JSON.parse(stored) : [];
    const profile = await StorageService.getProfile();
    if (!profile) return [];
    return profile.role === 'teacher' ? allTasks : allTasks.filter(t => t.userId === profile.id || t.isAssignment);
  },

  saveTask: async (task: Task): Promise<void> => {
    const stored = localStorage.getItem(TASKS_KEY);
    const tasks: Task[] = stored ? JSON.parse(stored) : [];
    const idx = tasks.findIndex(t => t.id === task.id);
    const newTasks = idx >= 0 ? tasks.map((t, i) => i === idx ? task : t) : [task, ...tasks];
    safeSetItem(TASKS_KEY, JSON.stringify(newTasks));

    if (task.status === TaskStatus.COMPLETED) {
        const profile = await StorageService.getProfile();
        if (profile) {
            const completedCount = newTasks.filter(t => t.status === TaskStatus.COMPLETED && (t.userId === profile.id || t.isAssignment)).length;
            
            if (completedCount >= 3 && !profile.unlockedItems?.includes('badge_scholar')) {
                const newItems = [...(profile.unlockedItems || []), 'badge_scholar'];
                await StorageService.updateProfile({ unlockedItems: newItems });
                window.dispatchEvent(new CustomEvent('rudraksha-badge-unlock', {
                    detail: { title: 'Diligent Scholar', icon: 'graduation' }
                }));
            }
        }
    }
  },

  deleteTask: async (taskId: string): Promise<void> => {
    const stored = localStorage.getItem(TASKS_KEY);
    const tasks: Task[] = stored ? JSON.parse(stored) : [];
    safeSetItem(TASKS_KEY, JSON.stringify(tasks.filter(t => t.id !== taskId)));
  },

  saveStudySession: async (session: StudySession): Promise<void> => {
    const stored = localStorage.getItem(SESSIONS_KEY);
    const sessions = stored ? JSON.parse(stored) : [];
    sessions.push(session);
    safeSetItem(SESSIONS_KEY, JSON.stringify(sessions));
  },

  getStudySessions: async (): Promise<StudySession[]> => {
    const stored = localStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // --- NEW GAME SESSION TRACKING ---
  saveGameSession: async (gameId: string, durationSeconds: number): Promise<void> => {
    const profile = await StorageService.getProfile();
    if (!profile) return;
    
    const stored = localStorage.getItem(GAME_SESSIONS_KEY);
    const sessions = stored ? JSON.parse(stored) : [];
    
    sessions.push({
        id: Date.now().toString(),
        userId: profile.id,
        gameId,
        durationSeconds,
        timestamp: Date.now()
    });
    
    safeSetItem(GAME_SESSIONS_KEY, JSON.stringify(sessions));
  },

  getGameSessions: async (): Promise<{id: string, userId: string, gameId: string, durationSeconds: number, timestamp: number}[]> => {
    const stored = localStorage.getItem(GAME_SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  // --------------------------------

  getHealthLog: async (date: string): Promise<HealthLog> => {
    const stored = localStorage.getItem(HEALTH_KEY);
    const logs = stored ? JSON.parse(stored) : {};
    return logs[date] || { date, waterGlasses: 0, mood: 'Neutral', sleepHours: 7 };
  },

  saveHealthLog: async (log: HealthLog): Promise<void> => {
    const stored = localStorage.getItem(HEALTH_KEY);
    const logs = stored ? JSON.parse(stored) : {};
    logs[log.date] = log;
    safeSetItem(HEALTH_KEY, JSON.stringify(logs));
  },

  getRecipes: async (sort?: string): Promise<Recipe[]> => {
    const stored = localStorage.getItem(RECIPES_KEY);
    const recipes: Recipe[] = stored ? JSON.parse(stored) : INITIAL_RECIPES;
    if (sort === 'recent') return [...recipes].sort((a, b) => b.id.localeCompare(a.id));
    return recipes;
  },

  saveRecipe: async (recipe: Recipe): Promise<void> => {
    const recipes = await StorageService.getRecipes();
    const idx = recipes.findIndex(r => r.id === recipe.id);
    if (idx >= 0) recipes[idx] = recipe;
    else recipes.unshift(recipe);
    safeSetItem(RECIPES_KEY, JSON.stringify(recipes));
  },

  getNotes: async (): Promise<StudyNote[]> => {
    const profile = await StorageService.getProfile();
    if (!profile) return [];
    const notesStr = localStorage.getItem(NOTES_KEY);
    const allNotes: StudyNote[] = notesStr ? JSON.parse(notesStr) : [];
    return allNotes.filter(n => n.userId === profile.id);
  },

  saveNote: async (note: Partial<StudyNote>): Promise<void> => {
    const profile = await StorageService.getProfile();
    if (!profile) return;
    const notesStr = localStorage.getItem(NOTES_KEY);
    const notes: StudyNote[] = notesStr ? JSON.parse(notesStr) : [];
    if (note.id) {
        const idx = notes.findIndex(n => n.id === note.id);
        if (idx !== -1) notes[idx] = { ...notes[idx], ...note };
    } else {
        notes.push({ id: Date.now().toString(), userId: profile.id, title: note.title || 'Untitled', content: note.content || '', timestamp: Date.now(), color: note.color });
    }
    safeSetItem(NOTES_KEY, JSON.stringify(notes));
  },

  deleteNote: async (noteId: string): Promise<void> => {
    const notesStr = localStorage.getItem(NOTES_KEY);
    if (!notesStr) return;
    const notes: StudyNote[] = JSON.parse(notesStr);
    safeSetItem(NOTES_KEY, JSON.stringify(notes.filter(n => n.id !== noteId)));
  },

  getReviews: async (targetId: string): Promise<Review[]> => {
    const reviewsStr = localStorage.getItem(REVIEWS_KEY);
    if (!reviewsStr) return [];
    const allReviews: Review[] = JSON.parse(reviewsStr);
    return allReviews.filter(r => r.targetId === targetId).sort((a, b) => b.timestamp - a.timestamp);
  },

  addReview: async (review: Review): Promise<void> => {
    const reviewsStr = localStorage.getItem(REVIEWS_KEY);
    const allReviews: Review[] = reviewsStr ? JSON.parse(reviewsStr) : [];
    allReviews.push(review);
    safeSetItem(REVIEWS_KEY, JSON.stringify(allReviews));
  },

  getBooks: async (): Promise<Book[]> => {
    const stored = localStorage.getItem(BOOKS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveBook: async (book: Book): Promise<void> => {
    const books = await StorageService.getBooks();
    const idx = books.findIndex(b => b.id === book.id);
    if (idx >= 0) books[idx] = book;
    else books.unshift(book);
    safeSetItem(BOOKS_KEY, JSON.stringify(books));
  },

  deleteBook: async (bookId: string): Promise<void> => {
    const books = await StorageService.getBooks();
    safeSetItem(BOOKS_KEY, JSON.stringify(books.filter(b => b.id !== bookId)));
  },

  createGroup: async (name: string, memberUsernames: string[]): Promise<{success: boolean, groupId?: string, error?: string}> => {
      const profile = await StorageService.getProfile();
      if (!profile) return { success: false, error: "Not logged in" };
      const usersStr = localStorage.getItem(USERS_KEY);
      const users: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];
      const memberIds = [profile.id];
      for (const uname of memberUsernames) {
          const u = users.find(user => user.username === uname);
          if (u) memberIds.push(u.id);
      }
      const newGroup: ChatGroup = { id: Date.now().toString(), name, createdBy: profile.id, members: memberIds, createdAt: Date.now() };
      const groupsStr = localStorage.getItem(GROUPS_KEY);
      const groups: ChatGroup[] = groupsStr ? JSON.parse(groupsStr) : [];
      groups.push(newGroup);
      safeSetItem(GROUPS_KEY, JSON.stringify(groups));
      return { success: true, groupId: newGroup.id };
  },

  getGroups: async (): Promise<ChatGroup[]> => {
      const profile = await StorageService.getProfile();
      if (!profile) return [];
      const groupsStr = localStorage.getItem(GROUPS_KEY);
      const groups: ChatGroup[] = groupsStr ? JSON.parse(groupsStr) : [];
      return groups.filter(g => g.members.includes(profile.id));
  },

  // UPDATED: Added filtering by schoolCode for non-group (Global) messages
  getCommunityMessages: async (groupId?: string, userSchoolCode?: string): Promise<CommunityMessage[]> => {
    const stored = localStorage.getItem(CHAT_KEY);
    const allMessages: CommunityMessage[] = stored ? JSON.parse(stored) : [];
    
    if (groupId) {
        return allMessages.filter(m => m.groupId === groupId);
    } else {
        // "Global" chat is now School Chat. Filter by userSchoolCode.
        // If userSchoolCode is missing (legacy/admin), maybe show all or nothing. 
        // For now, filtering strictly by code.
        return allMessages.filter(m => !m.groupId && m.schoolCode === userSchoolCode);
    }
  },

  // UPDATED: Saves schoolCode with message
  sendCommunityMessage: async (text: string, type: 'text' | 'image' = 'text', imageUrl?: string, groupId?: string): Promise<CommunityMessage | null> => {
    const profile = await StorageService.getProfile();
    if (!profile) return null;
    const stored = localStorage.getItem(CHAT_KEY);
    const messages: CommunityMessage[] = stored ? JSON.parse(stored) : [];
    
    const newMessage: CommunityMessage = { 
        id: Date.now().toString(), 
        userId: profile.id, 
        userName: profile.name, 
        userRole: profile.role, 
        avatarUrl: profile.avatarUrl, 
        text, 
        type, 
        imageUrl, 
        groupId, 
        timestamp: Date.now(),
        schoolCode: profile.schoolCode // Persist school code
    };
    
    const updatedMessages = [...messages, newMessage];
    if (updatedMessages.length > 500) updatedMessages.shift();
    safeSetItem(CHAT_KEY, JSON.stringify(updatedMessages));
    return newMessage;
  },

  redeemReward: async (itemId: string, cost: number): Promise<{ success: boolean; error?: string }> => {
    const profile = await StorageService.getProfile();
    if (!profile) return { success: false, error: "Not logged in" };
    if (profile.points < cost) return { success: false, error: "Insufficient Karma" };
    const currentItems = profile.unlockedItems || [];
    if (currentItems.includes(itemId) && !itemId.startsWith('donate')) return { success: false, error: "Item owned" };
    
    // Log Transaction
    const txs = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
    txs.push({ 
        id: Date.now(), 
        userId: profile.id, 
        amount: -cost, 
        itemId, 
        type: 'redemption', 
        description: `Redeemed: ${itemId}`,
        timestamp: Date.now() 
    });
    safeSetItem(TRANSACTIONS_KEY, JSON.stringify(txs), false);
    
    const updatedProfile = await StorageService.updateProfile({ points: profile.points - cost, unlockedItems: [...currentItems, itemId] });
    return updatedProfile ? { success: true } : { success: false, error: "Transaction failed" };
  },

  searchUsers: async (query: string): Promise<UserProfile[]> => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];
    const lowerQ = query.toLowerCase();
    return users.filter(u => (u.username?.toLowerCase().includes(lowerQ)) || u.name.toLowerCase().includes(lowerQ)).slice(0, 10);
  },

  getUserPublicProfile: async (userId: string): Promise<UserProfile | null> => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];
    return users.find(u => u.id === userId) || null;
  },

  getLeaderboard: async (limit: number = 50, sortBy: 'points' | 'danphe' | 'gorilla' | 'truth' | 'mandala' = 'points'): Promise<UserProfile[]> => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: UserProfile[] = usersStr ? JSON.parse(usersStr) : [];
    return users.sort((a, b) => {
        if (sortBy === 'points') return (b.points || 0) - (a.points || 0);
        const scoreA = a.highScores?.[sortBy] || 0;
        const scoreB = b.highScores?.[sortBy] || 0;
        return scoreB - scoreA;
    }).slice(0, limit);
  },

  saveHighScore: async (game: 'danphe' | 'gorilla' | 'truth' | 'mandala', score: number): Promise<void> => {
      const profile = await StorageService.getProfile();
      if (!profile) return;
      const currentHigh = profile.highScores?.[game] || 0;
      if (score > currentHigh) await StorageService.updateProfile({ highScores: { ...(profile.highScores || {}), [game]: score } });
  },

  verifyTask: async (taskId: string, approved: boolean): Promise<boolean> => {
      const stored = localStorage.getItem(TASKS_KEY);
      const tasks: Task[] = stored ? JSON.parse(stored) : [];
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return false;
      const task = tasks[taskIndex];
      if (approved) {
          task.status = TaskStatus.COMPLETED;
          task.verificationStatus = 'approved';
          const usersStr = localStorage.getItem(USERS_KEY);
          if (usersStr) {
              const users: UserProfile[] = JSON.parse(usersStr);
              const studentIndex = users.findIndex(u => u.id === task.userId);
              if (studentIndex !== -1) {
                  users[studentIndex].xp = (users[studentIndex].xp || 0) + 50;
                  users[studentIndex].points = (users[studentIndex].points || 0) + 10;
                  safeSetItem(USERS_KEY, JSON.stringify(users), false);
              }
          }
      } else {
          task.status = TaskStatus.IN_PROGRESS;
          task.verificationStatus = 'rejected';
      }
      tasks[taskIndex] = task;
      safeSetItem(TASKS_KEY, JSON.stringify(tasks));
      return true;
  },

  getStudyChatHistory: (): ChatMessage[] => {
    const stored = localStorage.getItem(STUDY_CHAT_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveStudyChatHistory: (messages: ChatMessage[]) => {
    safeSetItem(STUDY_CHAT_HISTORY_KEY, JSON.stringify(messages));
  },

  clearStudyChatHistory: () => {
    localStorage.removeItem(STUDY_CHAT_HISTORY_KEY);
  },

  getGlobalChatHistory: (): ChatMessage[] => {
    const stored = localStorage.getItem(RUDRA_GLOBAL_CHAT_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveGlobalChatHistory: (messages: ChatMessage[]) => {
    safeSetItem(RUDRA_GLOBAL_CHAT_KEY, JSON.stringify(messages));
  },

  clearGlobalChatHistory: () => {
    localStorage.removeItem(RUDRA_GLOBAL_CHAT_KEY);
  }
};
