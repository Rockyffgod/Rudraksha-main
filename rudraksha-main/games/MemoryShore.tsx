import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '../components/ui/GameShell';
import { HelpCircle } from 'lucide-react';

interface GameProps {
  onExit: () => void;
}

// Extended Item Pool
const ALL_ITEMS = [
  '🐚', '🦀', '🐠', '🐙', '🐢', 
  '🐳', '🐬', '🐡', '🦈', '🦐', 
  '🦑', '🦞', '🐋', '🐊', '🦆', 
  '⚓', '⛵', '🏝️', '🥥', '🍹', 
  '🌊', '🏄', '🏊', '🛟', '🗺️',
  '🐟', '🏖️', '🌋', '🛶', '🚤',
  '🐡', '🦠', '🪸', '🪼', '🧂'
];

const WIN_CONDITION = 30;

interface ClickEffect {
  id: number;
  x: number;
  y: number;
  val: string;
}

export const MemoryShore: React.FC<GameProps> = ({ onExit }) => {
  return (
    <GameShell
      gameId="memory"
      title="Memory Shore"
      onExit={onExit}
    >
      {({ onGameOver }) => (
        <MemoryShoreGame onGameOver={onGameOver} />
      )}
    </GameShell>
  );
};

const MemoryShoreGame = ({ onGameOver }: { onGameOver: (score: number) => void }) => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [collectedItems, setCollectedItems] = useState<Set<string>>(new Set());
  const [currentPool, setCurrentPool] = useState<string[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  
  // Visual FX State
  const [tideActive, setTideActive] = useState(false);
  const [clickEffects, setClickEffects] = useState<ClickEffect[]>([]);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    // Start game: Pick 2 random items
    const shuffled = [...ALL_ITEMS].sort(() => 0.5 - Math.random());
    setCurrentPool(shuffled.slice(0, 2));
  }, []);

  const addClickEffect = (e: React.MouseEvent) => {
    const newEffect = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY,
      val: "+100"
    };
    setClickEffects(prev => [...prev, newEffect]);
    setTimeout(() => {
      setClickEffects(prev => prev.filter(ef => ef.id !== newEffect.id));
    }, 800);
  };

  const proceedToNextRound = (currentCollected: Set<string>, triggerTide: boolean) => {
    setIsShuffling(true);
    
    // Prepare next pool
    const uncollected = ALL_ITEMS.filter(i => !currentCollected.has(i));
    let nextPool = [...currentPool];

    if (uncollected.length > 0) {
        const newItem = uncollected[Math.floor(Math.random() * uncollected.length)];
        nextPool.push(newItem);
        
        // Shuffle
        for (let i = nextPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nextPool[i], nextPool[j]] = [nextPool[j], nextPool[i]];
        }
    }

    if (triggerTide) {
        setTideActive(true);
        setTimeout(() => {
            setCurrentPool(nextPool);
        }, 600);
        setTimeout(() => {
            setTideActive(false);
            setIsShuffling(false);
        }, 1200);
    } else {
        setTimeout(() => {
            setCurrentPool(nextPool);
            setIsShuffling(false);
        }, 300);
    }
  };

  const handleItemClick = (item: string, e: React.MouseEvent) => {
    if (isShuffling) return;

    if (collectedItems.has(item)) {
      setShake(true);
      setTimeout(() => onGameOver(score), 500); 
    } else {
      addClickEffect(e);
      const newCollected = new Set<string>(collectedItems);
      newCollected.add(item);
      setCollectedItems(newCollected);
      
      const newScore = newCollected.size;
      setScore(newScore);
      setLevel(Math.floor(newScore / 5) + 1);

      if (newScore >= WIN_CONDITION) {
        onGameOver(newScore);
      } else {
        const triggerTide = newScore % 3 === 0;
        proceedToNextRound(newCollected, triggerTide);
      }
    }
  };

  const getGridSizeClass = (count: number) => {
      if (count <= 4) return "w-28 h-28 md:w-32 md:h-32 text-5xl";
      if (count <= 9) return "w-20 h-20 md:w-24 md:h-24 text-4xl";
      return "w-16 h-16 md:w-20 md:h-20 text-3xl";
  };

  const renderBubbles = () => {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5 animate-float"
            style={{
              width: Math.random() * 60 + 20 + 'px',
              height: Math.random() * 60 + 20 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDuration: Math.random() * 10 + 10 + 's',
              animationDelay: Math.random() * 5 + 's',
            }}
          />
        ))}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-40px); }
          }
          .animate-float { animation: float linear infinite; }
          .shake-screen { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
          @keyframes shake {
            10%, 90% { transform: translate3d(-2px, 0, 0); }
            20%, 80% { transform: translate3d(4px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
            40%, 60% { transform: translate3d(8px, 0, 0); }
          }
        `}</style>
      </div>
    );
  };

  return (
      <div className={`relative w-full h-full flex flex-col items-center justify-center p-4 overflow-hidden transition-colors duration-500 ${shake ? 'bg-red-900/80 shake-screen' : 'bg-gradient-to-b from-cyan-900 to-blue-950'}`}>
        
        {renderBubbles()}

        {/* Tide Wave Overlay */}
        <AnimatePresence>
            {tideActive && (
                <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    exit={{ x: '100%' }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="absolute inset-0 z-30 pointer-events-none"
                >
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent backdrop-blur-md skew-x-12"></div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Click Feedback Particles */}
        {clickEffects.map(ef => (
            <motion.div
                key={ef.id}
                initial={{ opacity: 1, y: 0, scale: 0.5 }}
                animate={{ opacity: 0, y: -100, scale: 1.5 }}
                className="fixed z-50 text-yellow-300 font-black text-2xl drop-shadow-md pointer-events-none"
                style={{ left: ef.x, top: ef.y }}
            >
                {ef.val}
            </motion.div>
        ))}

        {/* Game Area */}
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center h-full justify-center">
            
            {/* Header Info */}
            <div className="flex justify-between items-center w-full mb-6 px-4 absolute top-0 pt-4">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
                        <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest mr-2">Collection</span>
                        <span className="text-xl font-bold text-white">{score} / {WIN_CONDITION}</span>
                    </div>
                    <div className="bg-blue-500/20 px-4 py-2 rounded-full border border-blue-400/30 text-white font-bold text-sm">
                        Lvl {level}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 w-full flex items-center justify-center p-4">
                <motion.div 
                    layout 
                    className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-4xl content-center"
                >
                    <AnimatePresence mode="popLayout">
                        {currentPool.map((item) => (
                            <motion.button
                                layoutId={item}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                whileHover={{ 
                                    scale: 1.1, 
                                    y: [0, -5, 0],
                                    transition: { repeat: Infinity, duration: 2 } 
                                }}
                                whileTap={{ scale: 0.9 }}
                                key={item}
                                onClick={(e) => handleItemClick(item, e)}
                                className={`${getGridSizeClass(currentPool.length)} bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/20 cursor-pointer hover:bg-white/20 transition-colors relative group`}
                            >
                                <span className="drop-shadow-lg filter pointer-events-none">{item}</span>
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                    <div className="absolute inset-0 bg-cyan-400/30 opacity-0 group-active:opacity-100 transition-opacity"></div>
                                </div>
                                <div className="absolute inset-0 rounded-full bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity blur-md pointer-events-none"></div>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            <div className="absolute bottom-8 text-center animate-pulse pointer-events-none">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300/60 flex items-center gap-2">
                    <HelpCircle size={12} /> Don't click duplicates
                </p>
            </div>
        </div>
      </div>
  );
};