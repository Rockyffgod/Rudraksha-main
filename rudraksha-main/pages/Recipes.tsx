
import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storageService';
import { Recipe, ChatMessage, Review, UserProfile, RecipeCategory } from '../types';
import { getCookingChatSession } from '../services/geminiService';
import { Button } from '../components/ui/Button';
import { 
  Heart, Plus, Loader2, Upload, Image as ImageIcon, 
  X, History, ChefHat, Send, Star, 
  Clock, Utensils, Search, ChevronRight, User, Sparkles
} from 'lucide-react';
import { Chat, GenerateContentResponse } from '@google/genai';
import { useLanguage } from '../contexts/LanguageContext';

// Helper to parse dual-language JSON messages
const parseMessage = (rawText: string) => {
  try {
    const json = JSON.parse(rawText);
    if (json.en || json.ne) return json;
    return { en: rawText, ne: rawText };
  } catch {
    return { en: rawText, ne: rawText };
  }
};

const Recipes: React.FC = () => {
  const { t, language } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [likedRecipes, setLikedRecipes] = useState<Set<string>>(new Set());
  
  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // AI Chef State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New/Edit Recipe Form State
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({ 
    title: '', description: '', ingredients: [], instructions: '', imageUrl: '', prepTime: 20, tags: ['daily'] 
  });
  const [ingredientsText, setIngredientsText] = useState('');

  const loadRecipes = async () => {
    setLoading(true);
    const [data, profile] = await Promise.all([
        StorageService.getRecipes('recent'), 
        StorageService.getProfile()
    ]);
    
    setRecipes(data);
    setCurrentUser(profile);
    setLoading(false);
  };

  useEffect(() => { loadRecipes(); }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    if (!chatSessionRef.current) {
         chatSessionRef.current = getCookingChatSession();
    }

    const userMsg: ChatMessage = { 
        id: Date.now().toString(), 
        role: 'user', 
        text: JSON.stringify({ en: text, ne: text }), 
        timestamp: Date.now() 
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatTyping(true);

    try {
      const resultStream = await chatSessionRef.current.sendMessageStream({ message: text });
      let fullResponse = '';
      const modelMsgId = (Date.now() + 1).toString();
      
      setChatMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', timestamp: Date.now() }]);

      for await (const chunk of resultStream) {
        const textChunk = (chunk as GenerateContentResponse).text || '';
        fullResponse += textChunk;
        
        setChatMessages(prev => prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, text: fullResponse } : msg
        ));
      }
    } catch {
      setChatMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'model', 
          text: JSON.stringify({ en: "The kitchen is a bit smoky, try again!", ne: "भान्सामा अलिकति धुवाँ छ, फेरि प्रयास गर्नुहोस्!" }), 
          timestamp: Date.now() 
      }]);
    } finally { 
        setIsChatTyping(false); 
    }
  };

  useEffect(() => {
    const handleOpenRecipe = (e: any) => {
        const { recipeId } = e.detail;
        if (recipes.length > 0) {
            const found = recipes.find(r => r.id === recipeId);
            if (found) setSelectedRecipe(found);
        }
    };
    
    const handleDraftRecipe = (e: any) => {
        const { title, description } = e.detail;
        setNewRecipe(prev => ({ ...prev, title: title || '', description: description || '' }));
        setShowForm(true);
    };

    const handleConsultChef = (e: any) => {
        const { query } = e.detail;
        setIsChatOpen(true);

        if (!chatSessionRef.current) {
             const session = getCookingChatSession();
             chatSessionRef.current = session;
             setChatMessages([{
                id: 'init',
                role: 'model',
                text: JSON.stringify({
                    en: "Namaste! I am Bhanse Dai. I am here to share the secrets of Nepali heritage cooking. What are we cooking today?",
                    ne: "नमस्ते! म भान्से दाइ हुँ। म यहाँ नेपाली मौलिक खानाका रहस्यहरू बाँड्न आएको छु। आज हामी के पकाउने?"
                }),
                timestamp: Date.now()
             }]);
        }
        
        setTimeout(() => {
            sendMessage(`Please teach me how to cook ${query}. Provide a list of ingredients and step-by-step instructions.`);
        }, 600);
    };

    window.addEventListener('rudraksha-open-recipe', handleOpenRecipe);
    window.addEventListener('rudraksha-draft-recipe', handleDraftRecipe);
    window.addEventListener('rudraksha-consult-chef', handleConsultChef);
    
    return () => {
        window.removeEventListener('rudraksha-open-recipe', handleOpenRecipe);
        window.removeEventListener('rudraksha-draft-recipe', handleDraftRecipe);
        window.removeEventListener('rudraksha-consult-chef', handleConsultChef);
    };
  }, [recipes, t]); 

  useEffect(() => {
    let filtered = recipes;
    if (searchQuery.trim()) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredRecipes(filtered);
  }, [recipes, searchQuery]);

  const handleLike = async (e: React.MouseEvent, recipe: Recipe) => {
      e.stopPropagation();
      const isLiked = likedRecipes.has(recipe.id);
      const newLiked = new Set(likedRecipes);
      
      if (isLiked) {
          newLiked.delete(recipe.id);
          recipe.likes = Math.max(0, recipe.likes - 1);
      } else {
          newLiked.add(recipe.id);
          recipe.likes += 1;
      }
      
      setLikedRecipes(newLiked);
      await StorageService.saveRecipe(recipe);
      setRecipes([...recipes]);
  };

  useEffect(() => {
    if (selectedRecipe) {
      loadReviews(selectedRecipe.id);
    }
  }, [selectedRecipe]);

  const loadReviews = async (recipeId: string) => {
    const r = await StorageService.getReviews(recipeId);
    setReviews(r);
  };

  const handleStarClick = (selectedRating: number) => {
    if (rating === selectedRating) {
        setRating(0); 
    } else {
        setRating(selectedRating);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipe || rating === 0 || !comment.trim()) return;

    const profile = await StorageService.getProfile();
    const review: Review = {
      id: Date.now().toString(),
      targetId: selectedRecipe.id,
      userId: profile?.id || 'anon',
      userName: profile?.name || 'Anonymous',
      rating,
      comment,
      timestamp: Date.now()
    };
    await StorageService.addReview(review);
    setReviews([review, ...reviews]);
    setRating(0);
    setComment('');
  };

  useEffect(() => {
    if (isChatOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewRecipe(prev => ({ ...prev, imageUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const profile = await StorageService.getProfile();
    if (!profile) return;
    
    const recipeToSave: Recipe = {
      id: Date.now().toString(),
      title: newRecipe.title!,
      author: profile.name,
      description: newRecipe.description!,
      ingredients: ingredientsText.split('\n').filter(s => s.trim()),
      instructions: newRecipe.instructions!,
      isPublic: true,
      likes: newRecipe.likes || 0,
      imageUrl: newRecipe.imageUrl,
      history: newRecipe.history,
      prepTime: newRecipe.prepTime,
      tags: newRecipe.tags
    };

    await StorageService.saveRecipe(recipeToSave);
    await loadRecipes();
    setShowForm(false);
  };

  const toggleChat = () => {
    if (!isChatOpen) {
        if (!chatSessionRef.current) {
            const session = getCookingChatSession();
            chatSessionRef.current = session;
            if (chatMessages.length === 0) {
                 setChatMessages([{
                    id: 'init',
                    role: 'model',
                    text: JSON.stringify({
                        en: "Namaste! I am Bhanse Dai. I am here to share the secrets of Nepali heritage cooking. What are we cooking today?",
                        ne: "नमस्ते! म भान्से दाइ हुँ। म यहाँ नेपाली मौलिक खानाका रहस्यहरू बाँड्न आएको छु। आज हामी के पकाउने?"
                    }),
                    timestamp: Date.now()
                 }]);
            }
        }
    }
    setIsChatOpen(!isChatOpen);
  };

  const openNewForm = () => {
      setNewRecipe({ title: '', description: '', ingredients: [], instructions: '', imageUrl: '', prepTime: 20, tags: ['daily'] });
      setIngredientsText('');
      setShowForm(true);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-600 w-12 h-12" /></div>;

  return (
    <div className="space-y-8 pb-20 relative font-sans">
      <header className="relative bg-gray-950 rounded-[2.5rem] overflow-hidden p-8 md:p-12 shadow-2xl border-4 border-gray-900">
        <div className="absolute inset-0 opacity-70 bg-[url('https://rachelgouk.com/wp-content/uploads/2020/05/nepali-kitchen-nepalese-restaurant-shanghai-1.jpg')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/40 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
           <div className="text-center lg:text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-orange-400 text-xs font-black uppercase tracking-widest border border-white/10">
                <Utensils size={14} /> Culinary Rituals
              </div>
              <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white leading-none uppercase">
                BHANSE <br/> <span className="text-orange-500">KITCHEN</span>
              </h1>
              <p className="text-gray-100 text-lg font-medium max-w-xl">
                {t("From daily rituals to ancient ethnic delicacies, explore the flavors that define Nepal.", "From daily rituals to ancient ethnic delicacies, explore the flavors that define Nepal.")}
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
                  <Button onClick={toggleChat} className="bg-orange-600 hover:bg-orange-700 h-14 px-8 rounded-2xl text-lg font-black shadow-xl shadow-orange-600/30">
                    <ChefHat size={22} className="mr-2"/> {t("Ask Bhanse Dai", "Ask Bhanse Dai")}
                  </Button>
                  <Button onClick={openNewForm} variant="secondary" className="h-14 px-8 rounded-2xl text-lg font-black bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <Plus size={22} className="mr-2"/> {t("Add Recipe", "Add Recipe")}
                  </Button>
              </div>
           </div>
           
           <div className="relative w-48 h-48 md:w-64 md:h-64 shrink-0 pointer-events-none hidden md:block">
              <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
              <img src="https://img.freepik.com/free-photo/view-traditional-nepalese-food-dish_23-2151122718.jpg" className="w-full h-full object-cover rounded-full border-8 border-gray-900 shadow-2xl rotate-6" alt="Dal Bhat" />
           </div>
        </div>
      </header>

      {/* Main Flashcard Grid */}
      <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-700">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex-1 max-w-md relative w-full">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Find a dish..." 
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-orange-500 transition-all"
                  />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecipes.map((r) => (
                <div 
                    key={r.id} 
                    onClick={() => setSelectedRecipe(r)}
                    className="bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden border-2 border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer relative transition-transform hover:-translate-y-1"
                >
                    <div className="h-64 relative overflow-hidden">
                        {r.imageUrl ? (
                            <img src={r.imageUrl} className="w-full h-full object-cover" alt={r.title} loading="lazy" />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300"><ImageIcon size={64}/></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        
                        <div className="absolute top-4 left-4 flex gap-2">
                            <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Clock size={12} className="text-orange-500" /> {r.prepTime} MIN
                            </span>
                        </div>

                        <div className="absolute bottom-6 left-6 right-6 text-white flex justify-between items-end">
                            <div>
                                <h3 className="text-2xl font-black italic tracking-tighter leading-none mb-1 uppercase">{r.title}</h3>
                                <p className="text-xs font-bold text-gray-300 flex items-center gap-2">by {r.author}</p>
                            </div>
                            <button 
                                onClick={(e) => handleLike(e, r)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border transition-all ${likedRecipes.has(r.id) ? 'bg-red-500 border-red-500 text-white' : 'bg-black/20 border-white/20 text-white hover:bg-black/40'}`}
                            >
                                <Heart size={14} fill={likedRecipes.has(r.id) ? "currentColor" : "none"} />
                                <span className="text-xs font-black">{r.likes}</span>
                            </button>
                        </div>
                    </div>
                    <div className="p-8">
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-3 mb-6 font-medium italic">"{r.description}"</p>
                        <div className="flex justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-700">
                             <div className="flex -space-x-2">
                                {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">U</div>)}
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-2">
                                View Recipe <ChevronRight size={14} />
                             </span>
                        </div>
                    </div>
                </div>
            ))}
            {filteredRecipes.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400">
                    <Search size={48} className="mx-auto mb-4 opacity-20"/>
                    <p className="font-bold text-xl uppercase tracking-widest">No recipes matched your search</p>
                </div>
            )}
           </div>
      </div>

      {/* Floating Chat System */}
      {isChatOpen && (
          <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-[60] flex flex-col items-end w-full sm:w-auto p-4 sm:p-0">
             <div className="fixed inset-0 bg-black/40 sm:hidden z-[-1]" onClick={() => setIsChatOpen(false)}></div>
             <div className="bg-white dark:bg-gray-950 w-full sm:w-[450px] h-[85vh] sm:h-[650px] rounded-3xl shadow-[0_30px_90px_-15px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-500 border-4 border-gray-900">
                <header className="p-6 bg-gray-900 text-white flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/40 animate-bounce">
                         <ChefHat size={24} />
                      </div>
                      <div>
                         <h3 className="text-lg font-black tracking-tighter uppercase italic">Bhanse Dai</h3>
                         <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Heritage Specialist</span>
                         </div>
                      </div>
                   </div>
                   <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-black/20 custom-scrollbar">
                   {chatMessages.map((msg) => {
                      const content = parseMessage(msg.text);
                      const displayText = language === 'ne' ? (content.ne || content.en) : content.en;
                      const isUser = msg.role === 'user';
                      
                      return (
                          <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>
                             <div className={`max-w-[85%] p-5 rounded-3xl text-sm shadow-sm ${isUser ? 'bg-orange-600 text-white rounded-tr-none shadow-orange-600/20' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'}`}>
                                <p className="whitespace-pre-wrap font-medium leading-relaxed prose prose-sm dark:prose-invert">{displayText}</p>
                                <span className="text-[9px] uppercase font-bold opacity-40 mt-3 block">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                          </div>
                      );
                   })}
                   {isChatTyping && (
                      <div className="flex gap-2">
                         <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl flex items-center gap-2 shadow-sm">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-200"></div>
                         </div>
                      </div>
                   )}
                   <div ref={messagesEndRef} />
                </div>

                <form onSubmit={(e) => { e.preventDefault(); sendMessage(chatInput); }} className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-4">
                   <input 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder={t("Ask for heritage facts or basic tips...", "Ask for heritage facts or basic tips...")}
                      className="flex-1 px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-sm font-medium border-2 border-transparent focus:border-orange-500 outline-none transition-all dark:text-white"
                   />
                   <button type="submit" disabled={!chatInput.trim()} className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center hover:bg-orange-700 shadow-xl shadow-orange-600/30 transition-all active:scale-90">
                      <Send size={24} />
                   </button>
                </form>
             </div>
          </div>
      )}

      {selectedRecipe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedRecipe(null)}></div>
             <div className="bg-white dark:bg-gray-950 w-full max-w-6xl max-h-[95vh] rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300 border-4 border-gray-900">
                <button onClick={() => setSelectedRecipe(null)} className="absolute top-6 right-6 z-10 p-3 bg-black/40 text-white rounded-full hover:bg-red-600 transition-all backdrop-blur-md active:scale-90"><X size={28}/></button>
                
                <div className="md:w-1/2 relative h-80 md:h-auto shrink-0">
                   <img src={selectedRecipe.imageUrl} className="w-full h-full object-cover" alt={selectedRecipe.title} />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                   <div className="absolute bottom-12 left-12 right-12 text-white space-y-4">
                      <div className="flex gap-2">
                        {selectedRecipe.tags?.map(t => (
                            <span key={t} className="bg-orange-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{t}</span>
                        ))}
                      </div>
                      <h2 className="text-5xl font-black italic uppercase tracking-tighter drop-shadow-2xl">{selectedRecipe.title}</h2>
                      <div className="flex items-center gap-6 text-sm font-bold opacity-80">
                         <span className="flex items-center gap-2"><Clock size={18} className="text-orange-500"/> {selectedRecipe.prepTime} Min</span>
                         <span className="flex items-center gap-2"><User size={18} className="text-orange-500"/> {selectedRecipe.author}</span>
                      </div>
                   </div>
                </div>

                <div className="md:w-1/2 p-8 md:p-14 overflow-y-auto bg-white dark:bg-gray-950 custom-scrollbar">
                   <div className="space-y-12">
                      {selectedRecipe.history && (
                          <div className="p-8 bg-orange-50 dark:bg-orange-900/10 rounded-[2.5rem] border-2 border-orange-100 dark:border-orange-900/30">
                             <h4 className="text-xs font-black uppercase text-orange-600 mb-3 tracking-[0.3em] flex items-center gap-2"><History size={16}/> Heritage Protocol</h4>
                             <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed font-medium italic">"{selectedRecipe.history}"</p>
                          </div>
                      )}

                      <div className="grid grid-cols-1 gap-12">
                         <div className="space-y-6">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                               <div className="w-1.5 h-8 bg-orange-600 rounded-full"></div> Ingredients
                            </h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               {selectedRecipe.ingredients.map((ing, i) => (
                                   <li key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 font-bold text-gray-700 dark:text-gray-200 text-sm">
                                      <div className="w-3 h-3 rounded-full border-2 border-orange-500"></div> {ing}
                                   </li>
                               ))}
                            </ul>
                         </div>

                         <div className="space-y-6">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                               <div className="w-1.5 h-8 bg-orange-600 rounded-full"></div> Preparation
                            </h3>
                            <div className="space-y-3">
                               {selectedRecipe.instructions.split('\n').filter(s => s.trim()).map((step, i) => (
                                   // Regex handles numbering if present, otherwise just renders text
                                   <div key={i} className="flex gap-6 p-4 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                                      <span className="shrink-0 w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center font-black text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">{i+1}</span>
                                      <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed font-medium pt-1">{step.replace(/^\d+\.\s*/, '')}</p>
                                   </div>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div className="pt-12 border-t border-gray-100 dark:border-gray-800 space-y-8">
                         <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Community Feedback</h3>
                            <div className="flex items-center gap-2 bg-yellow-400/10 px-4 py-2 rounded-xl text-yellow-600 font-black">
                               <Star size={20} fill="currentColor"/> {reviews.length > 0 ? (reviews.reduce((a,b) => a+b.rating, 0)/reviews.length).toFixed(1) : "NEW"}
                            </div>
                         </div>

                         <div className="space-y-4">
                            {reviews.map(r => (
                                <div key={r.id} className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700">
                                   <div className="flex justify-between items-start mb-3">
                                      <p className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">{r.userName}</p>
                                      <div className="flex text-yellow-500">
                                         {[...Array(r.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                      </div>
                                   </div>
                                   <p className="text-gray-500 dark:text-gray-400 text-sm font-medium italic">"{r.comment}"</p>
                                </div>
                            ))}
                         </div>

                         <form onSubmit={submitReview} className="space-y-4 p-8 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem]">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 text-center">Share Your Thoughts</p>
                            <div className="flex justify-center gap-2">
                               {[1,2,3,4,5].map(s => (
                                   <button key={s} type="button" onClick={() => handleStarClick(s)} className={`transition-all hover:scale-125 ${s <= rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                                      <Star size={32} fill={s <= rating ? "currentColor" : "none"} />
                                   </button>
                               ))}
                            </div>
                            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="How did this turn out?" className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-5 text-sm font-medium outline-none focus:border-orange-500 transition-all dark:text-white h-24 resize-none"/>
                            <Button type="submit" disabled={!rating || !comment} className="w-full h-16 rounded-2xl font-black uppercase text-lg bg-orange-600 shadow-xl shadow-orange-600/30">Submit Review</Button>
                         </form>
                      </div>
                   </div>
                </div>
             </div>
          </div>
      )}

      {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowForm(false)}></div>
             <div className="relative w-full max-w-4xl bg-white dark:bg-gray-950 rounded-[3rem] shadow-2xl overflow-hidden border-4 border-gray-900 animate-in zoom-in duration-300">
                <header className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                   <div>
                      <h2 className="text-3xl font-black italic uppercase tracking-tighter">Add Ritual</h2>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Share heritage or daily tips</p>
                   </div>
                   <button onClick={() => setShowForm(false)} className="p-2 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-full transition-all"><X size={32}/></button>
                </header>
                
                <form onSubmit={handleSubmit} className="p-8 md:p-12 overflow-y-auto max-h-[75vh] custom-scrollbar">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-2">Recipe Title</label>
                            <input required className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 p-5 rounded-2xl focus:border-orange-600 outline-none transition-all font-black text-xl uppercase tracking-tighter italic" value={newRecipe.title} onChange={e => setNewRecipe({...newRecipe, title: e.target.value})} placeholder="e.g. Masala Oats" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-2">Summary/History</label>
                            <textarea required className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 p-5 rounded-2xl focus:border-orange-600 outline-none transition-all font-medium h-32 resize-none" value={newRecipe.description} onChange={e => setNewRecipe({...newRecipe, description: e.target.value})} placeholder="Short summary of the dish" />
                         </div>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-2">Prep Time (Min)</label>
                                <input type="number" required className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 p-5 rounded-2xl focus:border-orange-600 outline-none transition-all font-black" value={newRecipe.prepTime} onChange={e => setNewRecipe({...newRecipe, prepTime: parseInt(e.target.value)})} />
                            </div>
                         </div>
                      </div>
                      
                      <div className="space-y-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-2">Image URL</label>
                            <input 
                                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 p-5 rounded-2xl focus:border-orange-600 outline-none transition-all font-medium text-sm" 
                                value={newRecipe.imageUrl} 
                                onChange={e => setNewRecipe({...newRecipe, imageUrl: e.target.value})} 
                                placeholder="https://..."
                            />
                            <div className="mt-2 text-[9px] text-gray-500 uppercase text-center">OR</div>
                            <label className="block w-full h-32 border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-all overflow-hidden relative">
                                {newRecipe.imageUrl?.startsWith('data:') ? (
                                    <img src={newRecipe.imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <Upload className="mx-auto mb-1 text-gray-300" size={24}/>
                                        <p className="text-[10px] font-black uppercase text-gray-400">Upload Photo</p>
                                    </div>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-2">Ingredients (One per line)</label>
                            <textarea required className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 p-5 rounded-2xl focus:border-orange-600 outline-none transition-all font-mono text-xs h-32 resize-none" value={ingredientsText} onChange={e => setIngredientsText(e.target.value)} placeholder="1 Cup Rice Flour&#10;2 Tbsp Sugar..." />
                         </div>
                      </div>
                   </div>
                   
                   <div className="mt-10 space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-2">Instructions</label>
                      <textarea required className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 p-8 rounded-[2.5rem] focus:border-orange-600 outline-none transition-all font-medium text-lg leading-relaxed h-64" value={newRecipe.instructions} onChange={e => setNewRecipe({...newRecipe, instructions: e.target.value})} placeholder="How to cook this dish..." />
                   </div>

                   <div className="mt-12 flex justify-end gap-6">
                      <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="text-gray-500 font-black h-16 px-10">Cancel</Button>
                      <Button type="submit" className="h-16 px-12 rounded-2xl font-black uppercase text-xl bg-orange-600 shadow-2xl shadow-orange-600/40">Post Recipe</Button>
                   </div>
                </form>
             </div>
          </div>
      )}
    </div>
  );
};
export default Recipes;
