
import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storageService';
import { RewardService } from '../services/rewardService';
import { CommunityMessage, UserProfile, ChatGroup, DirectMessage } from '../types';
import { Button } from '../components/ui/Button';
import { Send, MessageCircle, Loader2, Image as ImageIcon, Smile, Plus, Hash, Users, X, Search, ChevronLeft, Gift, Coins, Cpu, Bot, UserPlus, Check, UserCheck, Upload, School } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '🙏', '🇳🇵', '👋', '😊', '🤔'];

const CommunityChat: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'community' | 'dm'>('community');
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<UserProfile[]>([]);
  
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
  const [activeDmUser, setActiveDmUser] = useState<UserProfile | null>(null);
  
  const [input, setInput] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftAmount, setGiftAmount] = useState<number>(10);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Image Preview State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [activeGroup, activeDmUser, activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, directMessages, activeTab]);

  useEffect(() => {
      if (searchUserQuery.trim().length > 1) {
          StorageService.searchUsers(searchUserQuery).then(setSearchResults);
      } else {
          setSearchResults([]);
      }
  }, [searchUserQuery]);

  const loadInitialData = async () => {
      setLoading(true);
      await refreshData();
      const p = await StorageService.getProfile();
      setProfile(p);
      setLoading(false);
  };

  const isDemoUser = (email?: string) => {
      return email === 'admin@gmail.com' || email?.endsWith('@demo.com');
  };

  const refreshData = async () => {
      const p = await StorageService.getProfile();
      if (!p) return;
      setProfile(p);

      if (activeTab === 'community') {
          // Pass schoolCode to filter global messages
          const msgs = await StorageService.getCommunityMessages(activeGroup?.id, p.schoolCode);
          const grps = await StorageService.getGroups();
          setMessages(msgs);
          setGroups(grps);
      } else {
          // Fetch all users to filter friends
          const allUsers = await StorageService.getAvailableUsers();
          
          const currentUserIsDemo = isDemoUser(p.email);

          // Filter Friends & Rudra for DM List
          // Also allow demo accounts to see each other
          const friendsList = allUsers.filter(u => {
              if (u.id === 'rudra-ai-system') return true;
              if (p.friends && p.friends.includes(u.id)) return true;
              if (currentUserIsDemo && isDemoUser(u.email)) return true;
              return false;
          });
          
          setAvailableUsers(friendsList);

          // Get Friend Requests
          if (p.friendRequests && p.friendRequests.length > 0) {
              const requests = allUsers.filter(u => p.friendRequests!.includes(u.id));
              setFriendRequests(requests);
          } else {
              setFriendRequests([]);
          }

          if (activeDmUser) {
              const dms = await StorageService.getDirectMessages(activeDmUser.id);
              setDirectMessages(dms);
          }
      }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !profile) return;

    if (activeTab === 'community') {
        // Send message with schoolCode embedded
        await StorageService.sendCommunityMessage(input.trim(), 'text', undefined, activeGroup?.id);
        const msgs = await StorageService.getCommunityMessages(activeGroup?.id, profile.schoolCode);
        setMessages(msgs);
    } else {
        if (activeDmUser) {
            await StorageService.sendDirectMessage(activeDmUser.id, input.trim());
            const dms = await StorageService.getDirectMessages(activeDmUser.id);
            setDirectMessages(dms);
        }
    }
    setInput('');
    setShowEmojiPicker(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && profile) {
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              if (activeTab === 'community') {
                  await StorageService.sendCommunityMessage('', 'image', base64, activeGroup?.id);
                  refreshData();
              } else if (activeDmUser) {
                  await StorageService.sendDirectMessage(activeDmUser.id, '', 'image', { imageUrl: base64 });
                  refreshData();
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleGiftKarma = async () => {
      if (!activeDmUser || !profile) return;
      const result = await RewardService.transferKarma(profile.id, activeDmUser.id, giftAmount);
      
      if (result.success) {
          await StorageService.sendDirectMessage(activeDmUser.id, `Sent ${giftAmount} Karma Points`, 'karma', { amount: giftAmount });
          const dms = await StorageService.getDirectMessages(activeDmUser.id);
          setDirectMessages(dms);
          const updatedProfile = await StorageService.getProfile();
          setProfile(updatedProfile);
          setShowGiftModal(false);
      } else {
          alert(result.message);
      }
  };

  const handleCreateGroup = async () => {
      if (!newGroupName.trim()) return;
      const res = await StorageService.createGroup(newGroupName, selectedMembers);
      if (res.success && res.groupId) {
          setShowCreateGroup(false);
          setNewGroupName('');
          setSelectedMembers([]);
          setSearchUserQuery('');
          const grps = await StorageService.getGroups();
          setGroups(grps);
          const newGrp = grps.find(g => g.id === res.groupId);
          if (newGrp) setActiveGroup(newGrp);
      }
  };

  const toggleMember = (username: string) => {
      if (selectedMembers.includes(username)) setSelectedMembers(prev => prev.filter(u => u !== username));
      else setSelectedMembers(prev => [...prev, username]);
  };

  const handleAcceptRequest = async (userId: string) => {
      await StorageService.acceptFriendRequest(userId);
      refreshData();
  };

  const handleRejectRequest = async (userId: string) => {
      await StorageService.rejectFriendRequest(userId);
      refreshData();
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[calc(100vh-200px)]">
      <Loader2 className="animate-spin text-red-600 w-12 h-12" />
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-7rem)] bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative font-sans">
      
      {/* Sidebar */}
      <div className={`
        absolute inset-y-0 left-0 z-20 w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
         <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex gap-1">
             <button onClick={() => setActiveTab('community')} className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'community' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                 <Users size={16}/> Community
             </button>
             <button onClick={() => setActiveTab('dm')} className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'dm' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                 <MessageCircle size={16}/> Messages
             </button>
         </div>
         
         <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
             {activeTab === 'community' ? (
                 <>
                    <button onClick={() => { setActiveGroup(null); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${!activeGroup ? 'bg-white dark:bg-gray-800 border-2 border-red-500 shadow-md' : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                        <div className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 rounded-full"><School size={20}/></div>
                        <div>
                            <p className="text-sm font-bold dark:text-white truncate max-w-[150px]">{profile?.schoolName ? `${profile.schoolName.split(' ')[0]} Chat` : "School Hub"}</p>
                            <p className="text-[10px] font-medium opacity-60 uppercase tracking-wider">{profile?.schoolCode || "General"} Feed</p>
                        </div>
                    </button>
                    <div className="pt-6 pb-2 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between items-center">
                        <span>Your Groups</span>
                        <button onClick={() => setShowCreateGroup(true)} className="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-lg"><Plus size={14}/></button>
                    </div>
                    {groups.map(group => (
                        <button key={group.id} onClick={() => { setActiveGroup(group); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeGroup?.id === group.id ? 'bg-white dark:bg-gray-800 border-2 border-blue-500 shadow-md' : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-full"><Hash size={20}/></div>
                            <div className="min-w-0"><p className="text-sm font-bold dark:text-white truncate">{group.name}</p><p className="text-[10px] font-medium opacity-60">{group.members.length} members</p></div>
                        </button>
                    ))}
                 </>
             ) : (
                 <>
                    {friendRequests.length > 0 && (
                        <div className="mb-4">
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 px-2">Friend Requests</p>
                            <div className="space-y-2">
                                {friendRequests.map(req => (
                                    <div key={req.id} className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-200 dark:border-orange-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <img src={req.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${req.name}`} className="w-8 h-8 rounded-full bg-white" />
                                            <p className="text-xs font-bold dark:text-white truncate">{req.name}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAcceptRequest(req.id)} className="flex-1 bg-green-500 text-white text-[10px] font-bold py-1.5 rounded-lg hover:bg-green-600 transition-colors">Accept</button>
                                            <button onClick={() => handleRejectRequest(req.id)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold py-1.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Decline</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="px-2 py-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Direct Messages</p>
                        <div className="space-y-2">
                            {availableUsers.map(user => {
                                const isAI = user.id === 'rudra-ai-system';
                                return (
                                <button key={user.id} onClick={() => { setActiveDmUser(user); setIsSidebarOpen(false); }} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeDmUser?.id === user.id ? 'bg-white dark:bg-gray-800 border-2 border-indigo-500 shadow-md' : 'hover:bg-gray-200 dark:hover:bg-gray-800 border-2 border-transparent'}`}>
                                    <div className="relative">
                                        <img src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} className={`w-10 h-10 rounded-full bg-gray-200 ${isAI ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`} alt={user.name} />
                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white dark:border-gray-900 rounded-full ${isAI ? 'bg-red-600 animate-pulse' : 'bg-green-500'}`}></div>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold dark:text-white truncate flex items-center gap-1.5">{user.name} {isAI && <Cpu size={12} className="text-red-500" />}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate font-medium">@{user.username || 'user'}</p>
                                    </div>
                                </button>
                                );
                            })}
                            {availableUsers.length === 0 && (
                                <div className="text-center py-4 px-2">
                                    <p className="text-xs text-gray-400">No friends yet.</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Connect with people in Community Chat to DM them.</p>
                                </div>
                            )}
                        </div>
                    </div>
                 </>
             )}
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-800 relative">
        <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 flex items-center justify-between shadow-sm z-10 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300"><ChevronLeft/></button>
                {activeTab === 'community' ? (
                    <>
                        <div className={`p-2 rounded-xl ${activeGroup ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                            {activeGroup ? <Hash size={20}/> : <School size={20}/>}
                        </div>
                        <div>
                            <h1 className="font-black text-gray-900 dark:text-white leading-tight uppercase italic tracking-tight">{activeGroup ? activeGroup.name : (profile?.schoolName || "School Chat")}</h1>
                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{activeGroup ? `${activeGroup.members.length} MEMBERS` : "SCHOOL FEED"}</p>
                        </div>
                    </>
                ) : activeDmUser ? (
                    <>
                        <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${activeDmUser.id}`)}>
                            <img src={activeDmUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${activeDmUser.name}`} className="w-10 h-10 rounded-full border-2 border-indigo-100" />
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${activeDmUser.id === 'rudra-ai-system' ? 'bg-red-600' : 'bg-green-500'}`}></div>
                        </div>
                        <div><h1 className="font-bold dark:text-white cursor-pointer hover:underline" onClick={() => navigate(`/profile/${activeDmUser.id}`)}>{activeDmUser.name}</h1><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">@{activeDmUser.username || 'user'} • {activeDmUser.role}</p></div>
                    </>
                ) : (
                    <div className="flex items-center gap-2 text-gray-400"><MessageCircle size={24}/><span className="font-bold">Select a friend to message</span></div>
                )}
            </div>
            {activeTab === 'dm' && activeDmUser && activeDmUser.id !== 'rudra-ai-system' && (
                <Button onClick={() => setShowGiftModal(true)} size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl shadow-lg shadow-yellow-500/20 font-black uppercase text-[10px] tracking-widest px-4">
                    <Gift size={16} className="mr-2"/> Gift Karma
                </Button>
            )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-black/20">
            {(activeTab === 'community' ? messages : directMessages).map((msg: any) => {
                const isMe = profile?.id === (msg.userId || msg.senderId);
                const isRudra = (msg.userId || msg.senderId) === 'rudra-ai-system';
                const isKarma = msg.type === 'karma';
                
                return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} group animate-in slide-in-from-bottom-2 duration-300`}>
                        {activeTab === 'community' && (
                            <button onClick={() => navigate(`/profile/${msg.userId}`)} className="flex-shrink-0 transition-transform active:scale-95">
                                {msg.avatarUrl ? <img src={msg.avatarUrl} alt={msg.userName} className="w-8 h-8 rounded-full object-cover shadow-sm" /> : <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${isMe ? 'bg-red-500' : 'bg-gray-400'}`}>{msg.userName?.charAt(0)}</div>}
                            </button>
                        )}
                        <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                            {activeTab === 'community' && (
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 cursor-pointer hover:underline" onClick={() => navigate(`/profile/${msg.userId}`)}>{isMe ? 'You' : msg.userName}</span>
                                    <span className="text-[8px] text-gray-400 dark:text-gray-500 uppercase tracking-wider border border-gray-200 dark:border-gray-600 px-1 rounded-sm">{msg.userRole}</span>
                                </div>
                            )}
                            {isKarma ? (
                                <div className="bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400/50 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
                                    <div className="p-2 bg-yellow-400 text-white rounded-full"><Gift size={16}/></div>
                                    <div><p className="text-xs font-black uppercase tracking-wide">Karma Gift</p><p className="font-bold text-lg flex items-center gap-1"><Coins size={16}/> {msg.amount}</p></div>
                                </div>
                            ) : (
                                <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm overflow-hidden ${isMe ? 'bg-red-600 text-white rounded-tr-none' : isRudra ? 'bg-gray-950 text-red-500 border border-red-900/50 rounded-tl-none font-mono italic shadow-[0_0_15px_rgba(220,38,38,0.1)]' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-600'}`}>
                                    {isRudra && <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black uppercase tracking-widest text-red-600"><Cpu size={10}/> Rudra System</div>}
                                    {msg.type === 'image' && msg.imageUrl ? <img src={msg.imageUrl} alt="Shared" className="max-w-full rounded-lg mb-1 cursor-pointer hover:opacity-90" onClick={() => setPreviewImage(msg.imageUrl)} /> : null}
                                    {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                                </div>
                            )}
                            <span className="text-[9px] text-gray-400 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium uppercase tracking-widest">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0 relative">
            {showEmojiPicker && (
                <div className="absolute bottom-full left-4 mb-2 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 grid grid-cols-6 gap-2 z-30 animate-in zoom-in-95 duration-200">{EMOJIS.map(emoji => (<button key={emoji} onClick={() => { setInput(prev => prev + emoji); setShowEmojiPicker(false); }} className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">{emoji}</button>))}</div>
            )}
            <form onSubmit={handleSend} className="flex gap-2 items-end">
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-3 rounded-xl transition-colors ${showEmojiPicker ? 'bg-yellow-100 text-yellow-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><Smile size={20}/></button>
                <label className="p-3 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    <ImageIcon size={20}/>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center"><textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Type a message...", "Type a message...")} className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 max-h-32 min-h-[44px] resize-none text-sm dark:text-white" rows={1} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} /></div>
                <Button type="submit" disabled={!input.trim()} className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none p-0 flex-shrink-0"><Send size={18} className={input.trim() ? "ml-0.5" : ""} /></Button>
            </form>
        </div>
      </div>

      {showCreateGroup && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80%] animate-in zoom-in duration-200">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900"><h3 className="font-bold dark:text-white">Create New Group</h3><button onClick={() => setShowCreateGroup(false)}><X size={20} className="text-gray-500 hover:text-red-500"/></button></div>
                  <div className="p-4 space-y-4 overflow-y-auto">
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Group Name</label><input className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="e.g. Science Project" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}/></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase">Add Members</label><div className="relative mt-1"><Search size={16} className="absolute left-3 top-2.5 text-gray-400"/><input className="w-full pl-9 p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="Search by username..." value={searchUserQuery} onChange={e => setSearchUserQuery(e.target.value)}/></div>
                          {searchResults.length > 0 && (<div className="mt-2 border rounded-lg max-h-32 overflow-y-auto dark:border-gray-600">{searchResults.map(user => (<button key={user.id} onClick={() => toggleMember(user.username || '')} className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"><div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedMembers.includes(user.username || '') ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-400'}`}></div><span className="text-sm dark:text-gray-200">{user.username} ({user.name})</span></button>))}</div>)}
                          <div className="flex flex-wrap gap-2 mt-3">{selectedMembers.map(m => (<span key={m} className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">{m} <button onClick={() => toggleMember(m)}><X size={12}/></button></span>))}</div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"><Button onClick={handleCreateGroup} disabled={!newGroupName || selectedMembers.length === 0} className="w-full">Create Group</Button></div>
              </div>
          </div>
      )}

      {showGiftModal && activeDmUser && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 w-full max-w-xs rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in duration-200 border-4 border-yellow-400">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600 shadow-inner"><Gift size={32} /></div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 dark:text-white mb-1">Gift Karma</h3><p className="text-xs text-gray-500 mb-6 font-bold uppercase tracking-widest">To {activeDmUser.name}</p>
                  <div className="flex justify-center items-center gap-4 mb-6"><button onClick={() => setGiftAmount(Math.max(10, giftAmount - 10))} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold hover:bg-gray-200">-</button><div className="text-3xl font-mono font-black text-yellow-500">{giftAmount}</div><button onClick={() => setGiftAmount(Math.min((profile?.points || 0), giftAmount + 10))} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold hover:bg-gray-200">+</button></div>
                  <p className="text-[10px] text-gray-400 mb-6 uppercase tracking-widest">Available: {profile?.points || 0}</p>
                  <div className="flex gap-2"><Button variant="ghost" onClick={() => setShowGiftModal(false)} className="flex-1">Cancel</Button><Button onClick={handleGiftKarma} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/20">Send</Button></div>
              </div>
          </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in" onClick={() => setPreviewImage(null)}>
            <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-red-600 transition-colors"><X size={24}/></button>
            <img src={previewImage} className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} alt="Preview" />
        </div>
      )}
    </div>
  );
};

export default CommunityChat;
