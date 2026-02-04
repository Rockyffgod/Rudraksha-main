
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { AirQualityService } from '../services/airQualityService';
import { interpretDream, generateExerciseGuide } from '../services/geminiService';
import { HealthLog, AQIData, WeatherData } from '../types';
import { 
  HeartPulse, Droplets, Moon, Plus, Minus, Loader2, Wind, 
  CloudFog, MapPin, Sun, CloudRain, CloudLightning, Activity, 
  Leaf, Dumbbell, Sparkles, CloudMoon, BookOpen, 
  Search, Play, Waves, Zap, BatteryMedium, ShieldCheck, Thermometer, Umbrella
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import confetti from 'canvas-confetti';
import { Button } from '../components/ui/Button';
import { YogaSession } from '../components/features/YogaSession';

// Updated QUOTES for Health
const QUOTES = [
  { en: "The earth does not belong to us: we belong to the earth.", ne: "पृथ्वी हाम्रो होइन, हामी पृथ्वीका हौं।" },
  { en: "A healthy body houses a healthy mind.", ne: "स्वस्थ शरीरमा नै स्वस्थ मनको बास हुन्छ।" },
  { en: "Movement is medicine.", ne: "चाल नै औषधि हो।" },
];

const INITIAL_EXERCISES = [
  {
    id: 'yoga_1',
    name: 'Surya Namaskar',
    neName: 'सूर्य नमस्कार',
    icon: Sun,
    benefits: 'Full body workout, improves blood circulation.',
    neBenefits: 'पूरा शरीरको व्यायाम, रक्तसञ्चारमा सुधार।',
    steps: '12 steps combining 7 different asanas.',
    neSteps: '७ विभिन्न आसनहरू मिलाएर १२ चरणहरू।',
    detailedSteps: [
        "Stand straight, palms folded in prayer pose. Breathe in.",
        "Raise arms overhead, arch back slightly. Breathe out.",
        "Bend forward, touch your feet. Keep knees straight.",
        "Step right leg back, look up (Equestrian Pose).",
        "Step left leg back into Plank pose. Keep body straight.",
        "Lower knees, chest, and chin to floor (Ashtanga Namaskar).",
        "Slide forward into Cobra pose. Look up.",
        "Lift hips into Inverted V (Mountain pose).",
        "Step right foot forward between hands.",
        "Step left foot forward, bend down.",
        "Raise arms overhead, stretch back.",
        "Return to standing prayer pose."
    ],
    detailedStepsNe: [
        "सीधा उभिनुहोस्, हातहरू जोडेर प्रार्थना मुद्रामा। सास लिनुहोस्।",
        "हातहरू टाउको माथि उठाउनुहोस्, अलिकति पछाडि ढल्किनुहोस्। सास छोड्नुहोस्।",
        "अगाडि झुक्नुहोस्, खुट्टा छुनुहोस्। घुँडाहरू सीधा राख्नुहोस्।",
        "दायाँ खुट्टा पछाडि सार्नुहोस्, माथि हेर्नुहोस् (अश्व सञ्चालन आसन)।",
        "बायाँ खुट्टा पछाडि सार्नुहोस् र प्ल्याङ्क पोजमा जानुहोस्। शरीर सीधा राख्नुहोस्।",
        "घुँडा, छाती र चिउँडो भुइँमा राख्नुहोस् (अष्टाङ्ग नमस्कार)।",
        "अगाडि सर्दै कोब्रा पोज (भुजङ्गासन) मा जानुहोस्। माथि हेर्नुहोस्।",
        "कम्मर माथि उठाउनुहोस् र उल्टो V आकार (पर्वतासन) बनाउनुहोस्।",
        "दायाँ खुट्टा हातहरूको बीचमा अगाडि ल्याउनुहोस्।",
        "बायाँ खुट्टा अगाडि ल्याउनुहोस्, तल झुक्नुहोस्।",
        "हातहरू माथि उठाउनुहोस्, पछाडि तन्किनुहोस्।",
        "प्रार्थना मुद्रामा फर्कनुहोस्।"
    ],
    stepDurations: [10, 10, 10, 10, 15, 10, 15, 10, 10, 10, 10, 10] // Seconds
  },
  {
    id: 'yoga_2',
    name: 'Pranayama',
    neName: 'प्राणायाम',
    icon: Wind,
    benefits: 'Reduces stress, improves lung capacity.',
    neBenefits: 'तनाव कम गर्छ, फोक्सोको क्षमता बढाउँछ।',
    steps: 'Breath awareness and controlled breathing.',
    neSteps: 'श्वासप्रश्वासको जागरूकता र नियन्त्रित श्वास।',
    detailedSteps: [
        "Sit in a comfortable cross-legged position.",
        "Close your eyes and relax your shoulders.",
        "Inhale deeply through your nose for 4 seconds.",
        "Hold your breath for 4 seconds.",
        "Exhale slowly through your nose for 6 seconds.",
        "Repeat this cycle for 5 minutes."
    ],
    detailedStepsNe: [
        "आरामदायी पलेँटी कसरे बस्नुहोस्।",
        "आँखा बन्द गर्नुहोस् र काँधहरूलाई खुकुलो छोड्नुहोस्।",
        "नाकबाट ४ सेकेन्डसम्म गहिरो सास लिनुहोस्।",
        "४ सेकेन्डसम्म सास रोक्नुहोस्।",
        "बिस्तारै ६ सेकेन्डसम्म नाकबाट सास छोड्नुहोस्।",
        "यो प्रक्रिया ५ मिनेटसम्म दोहोर्याउनुहोस्।"
    ],
    stepDurations: [15, 10, 5, 5, 10, 300] // Seconds
  }
];

const Health: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const { language, t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'climate' | 'personal' | 'fitness' | 'dream'>('climate');
  const [log, setLog] = useState<HealthLog | null>(null);
  const [aqiData, setAqiData] = useState<AQIData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loadingClimate, setLoadingClimate] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);

  // Dream Logic
  const [dreamInput, setDreamInput] = useState('');
  const [dreamResult, setDreamResult] = useState<{ folklore: { en: string, ne: string }, psychology: { en: string, ne: string }, symbol: string } | null>(null);
  const [isDreaming, setIsDreaming] = useState(false);

  // Fitness State
  const [exercises, setExercises] = useState<any[]>(INITIAL_EXERCISES);
  const [activeYogaPose, setActiveYogaPose] = useState<any>(null);
  const [customExerciseInput, setCustomExerciseInput] = useState('');
  const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);

  // Load Climate
  useEffect(() => {
    const fetchClimate = async () => {
      setLoadingClimate(true);
      try {
        const [aqi, weather] = await Promise.all([
          AirQualityService.getAQI(),
          AirQualityService.getWeather()
        ]);
        setAqiData(aqi);
        setWeatherData(weather);
      } catch (e) {
        console.error("Climate Fetch Error:", e);
      } finally {
        setLoadingClimate(false);
      }
    };
    fetchClimate();
  }, []);

  // Load Log
  useEffect(() => {
    if (activeTab === 'personal' && !log) {
      const fetchLog = async () => {
        setLoadingLog(true);
        try {
          const data = await StorageService.getHealthLog(today);
          setLog(data);
        } finally {
          setLoadingLog(false);
        }
      };
      fetchLog();
    }
  }, [activeTab, log, today]);

  // Handle Flashcard Generation from Voice or Text
  useEffect(() => {
      const handleGenerateRequest = (e: any) => {
          const { exerciseName } = e.detail;
          if (exerciseName) {
              setCustomExerciseInput(exerciseName);
              handleGenerateWorkout(exerciseName);
          }
      };
      window.addEventListener('rudraksha-generate-workout', handleGenerateRequest);
      return () => window.removeEventListener('rudraksha-generate-workout', handleGenerateRequest);
  }, [exercises]);

  const updateLog = async (newLog: HealthLog) => {
    setLog(newLog); 
    await StorageService.saveHealthLog(newLog);
    if (newLog.waterGlasses === 8) {
      StorageService.addPoints(10);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleDreamInterpret = async () => {
      if (!dreamInput.trim()) return;
      setIsDreaming(true);
      setDreamResult(null);
      try {
          const result = await interpretDream(dreamInput);
          setDreamResult(result);
      } catch (e) { console.error(e); } finally { setIsDreaming(false); }
  };

  const handleGenerateWorkout = async (name: string = customExerciseInput) => {
      if (!name.trim()) return;
      
      setActiveTab('fitness');
      
      // Check for existing exercise to prevent duplication
      const existing = exercises.find(e => 
          e.name.toLowerCase() === name.toLowerCase() || 
          e.neName?.toLowerCase() === name.toLowerCase()
      );
      
      if (existing) {
          setActiveYogaPose(existing);
          setCustomExerciseInput('');
          return;
      }

      setIsGeneratingExercise(true);
      const guide = await generateExerciseGuide(name);
      
      if (guide) {
          const newExercise = {
              id: guide.id,
              name: guide.name,
              neName: guide.neName,
              icon: Dumbbell,
              benefits: guide.benefits,
              neBenefits: guide.neBenefits,
              steps: guide.steps,
              neSteps: guide.neSteps,
              detailedSteps: guide.detailedSteps,
              detailedStepsNe: guide.detailedStepsNe,
              stepDurations: guide.stepDurations || [] // Store AI suggested times
          };
          setExercises(prev => [newExercise, ...prev]);
          setActiveYogaPose(newExercise); // Auto-open after generation
          setCustomExerciseInput('');
      } else {
          alert("Could not generate guide. Try a standard exercise name.");
      }
      setIsGeneratingExercise(false);
  };

  // Helper renderers
  const getWeatherIcon = (condition: string) => {
    switch(condition) {
      case 'Sunny': return <Sun size={64} className="text-yellow-400 animate-float"/>;
      case 'Rainy': return <CloudRain size={64} className="text-blue-400 animate-float"/>;
      case 'Stormy': return <CloudLightning size={64} className="text-purple-500 animate-float"/>;
      case 'Foggy': return <CloudFog size={64} className="text-gray-400 animate-float"/>;
      default: return <Sun size={64} className="text-orange-400 animate-float"/>;
    }
  };

  const isWaterOverflowing = log && log.waterGlasses >= 8;

  return (
    <div className="space-y-10 pb-20 relative font-sans">
       {/* Dedicated Voice Coach Component */}
       {activeYogaPose && <YogaSession pose={activeYogaPose} onClose={() => setActiveYogaPose(null)} />}

       <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
           <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic tracking-tighter">
             <HeartPulse className="text-teal-600 animate-pulse" size={36} /> {t("Wellness Centre", "Wellness Centre")}
           </h1>
           <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mt-1">
             {t("Harmonizing ancient wisdom with modern health analytics.", "Harmonizing ancient wisdom with modern health analytics.")}
           </p>
        </div>
        
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl p-2 rounded-[2rem] flex flex-wrap gap-2 shadow-xl border border-white dark:border-gray-700">
          {[
            { id: 'climate', icon: Wind, label: 'Environment', color: 'text-teal-500' },
            { id: 'personal', icon: BatteryMedium, label: 'Daily Log', color: 'text-red-500' },
            { id: 'fitness', icon: Dumbbell, label: 'Fitness Studio', color: 'text-indigo-500' },
            { id: 'dream', icon: CloudMoon, label: 'Sapana', color: 'text-purple-500' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-3 transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 shadow-xl scale-105 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <tab.icon size={20} className={tab.color}/> {t(tab.label, tab.label)}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-[400px]">
          {/* CLIMATE VIEW */}
          {activeTab === 'climate' && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
               {loadingClimate ? (
                 <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="animate-spin text-teal-600 w-12 h-12" />
                    <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Locating Environment...</p>
                 </div>
               ) : weatherData && aqiData ? (
                 <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Weather Card */}
                        <div className="relative overflow-hidden rounded-[3rem] p-8 text-white shadow-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex flex-col justify-between">
                            <div className="relative z-10 flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-lg font-black opacity-90 flex items-center gap-2 uppercase tracking-widest"><MapPin size={20}/> {weatherData.location}</h2>
                                    <p className="text-xs font-bold opacity-75 mt-1">{new Date().toDateString()}</p>
                                </div>
                                {getWeatherIcon(weatherData.condition)}
                            </div>
                            
                            <div className="relative z-10 flex items-end justify-between">
                                <div>
                                    <h1 className="text-8xl font-black tracking-tighter drop-shadow-lg leading-none">{weatherData.temp}°</h1>
                                    <p className="text-2xl font-bold mt-2 uppercase italic tracking-tighter opacity-90">{t(weatherData.condition, weatherData.condition)}</p>
                                </div>
                            </div>

                            {/* Detailed Metrics Grid */}
                            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                <div className="text-center">
                                    <Droplets size={20} className="mx-auto mb-1 opacity-80"/>
                                    <p className="text-xs font-bold">{weatherData.humidity}%</p>
                                    <p className="text-[9px] uppercase font-black opacity-60">Humidity</p>
                                </div>
                                <div className="text-center border-l border-white/20">
                                    <Wind size={20} className="mx-auto mb-1 opacity-80"/>
                                    <p className="text-xs font-bold">{weatherData.windSpeed}km/h</p>
                                    <p className="text-[9px] uppercase font-black opacity-60">Wind</p>
                                </div>
                                <div className="text-center border-l border-white/20">
                                    <Sun size={20} className="mx-auto mb-1 opacity-80"/>
                                    <p className="text-xs font-bold">{weatherData.uvIndex}</p>
                                    <p className="text-[9px] uppercase font-black opacity-60">UV Index</p>
                                </div>
                                <div className="text-center border-l border-white/20">
                                    <Thermometer size={20} className="mx-auto mb-1 opacity-80"/>
                                    <p className="text-xs font-bold">{weatherData.feelsLike}°</p>
                                    <p className="text-[9px] uppercase font-black opacity-60">Feels Like</p>
                                </div>
                            </div>
                        </div>

                        {/* AQI & Health Advice Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl border-4 border-gray-50 dark:border-gray-700 p-8 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.3em] text-xs mb-2">{t("Air Quality Index", "Air Quality Index")}</h3>
                                    <h2 className="text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-none" style={{color: aqiData.color}}>{aqiData.aqi}</h2>
                                    <span className="inline-block px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest mt-2 shadow-lg" style={{backgroundColor: aqiData.color}}>
                                        {t(aqiData.status, aqiData.status)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-gray-700 shadow-inner">
                                        <Wind className="text-teal-500" size={32}/>
                                    </div>
                                    <div className="text-[10px] font-black text-gray-400 text-center uppercase">PM2.5</div>
                                </div>
                            </div>

                            {/* Mask Recommendation */}
                            <div className={`p-5 rounded-2xl border-l-4 mb-4 ${aqiData.aqi > 100 ? 'bg-red-50 dark:bg-red-900/10 border-red-500 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/10 border-green-500 text-green-700 dark:text-green-400'}`}>
                                <div className="flex items-center gap-3 mb-1">
                                    <ShieldCheck size={20} />
                                    <h4 className="font-black uppercase text-xs tracking-widest">{t("Mask Advice", "Mask Advice")}</h4>
                                </div>
                                <p className="text-sm font-bold">{aqiData.maskAdvice}</p>
                            </div>

                            {/* General Advice */}
                            <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <h4 className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2"><Activity size={12}/> Health Protocol</h4>
                                <ul className="space-y-2">
                                    <li className="text-xs font-medium text-gray-600 dark:text-gray-300 flex gap-2">
                                        <span className="text-teal-500">•</span> {aqiData.activityAdvice}
                                    </li>
                                    <li className="text-xs font-medium text-gray-600 dark:text-gray-300 flex gap-2">
                                        <span className="text-teal-500">•</span> {aqiData.advice}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                 </div>
               ) : (
                 <div className="text-center py-32 opacity-40">
                    <MapPin size={48} className="mx-auto mb-4" />
                    <p className="font-bold">Weather data unavailable.</p>
                 </div>
               )}
            </div>
          )}

          {/* DREAM INTERPRETER VIEW */}
          {activeTab === 'dream' && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                  <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-[3.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden">
                      <div className="relative z-10 max-w-4xl mx-auto space-y-10">
                          <div className="text-center space-y-4">
                              <CloudMoon size={64} className="mx-auto text-purple-300 animate-float"/>
                              <h2 className="text-5xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
                                  {t("Sapana Interpreter", "Sapana Interpreter")}
                              </h2>
                          </div>

                          <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
                              <textarea 
                                  value={dreamInput}
                                  onChange={(e) => setDreamInput(e.target.value)}
                                  className="w-full h-32 bg-transparent text-white placeholder-purple-200/50 text-xl font-medium outline-none resize-none text-center"
                                  placeholder={t("Describe your dream here...", "Describe your dream here...")}
                              />
                              <div className="flex justify-center mt-6">
                                  <Button 
                                      onClick={handleDreamInterpret}
                                      disabled={!dreamInput.trim() || isDreaming}
                                      className="bg-white text-purple-900 hover:bg-purple-100 font-black px-12 py-6 rounded-[2rem] text-xl shadow-lg transition-all flex items-center gap-3"
                                  >
                                      {isDreaming ? <Loader2 className="animate-spin"/> : <Sparkles className="fill-purple-600"/>}
                                      {t("REVEAL MEANING", "REVEAL MEANING")}
                                  </Button>
                              </div>
                          </div>

                          {dreamResult && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700">
                                  <div className="bg-amber-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-amber-500/30">
                                      <h3 className="text-amber-400 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                          <BookOpen size={16}/> {t("Traditional Folklore", "Traditional Folklore")}
                                      </h3>
                                      <p className="text-amber-100 font-medium text-lg leading-relaxed italic">
                                          "{language === 'ne' ? dreamResult.folklore.ne : dreamResult.folklore.en}"
                                      </p>
                                  </div>
                                  <div className="bg-cyan-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-cyan-500/30">
                                      <h3 className="text-cyan-400 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                          <BookOpen size={16}/> {t("Psychological View", "Psychological View")}
                                      </h3>
                                      <p className="text-cyan-100 font-medium text-lg leading-relaxed italic">
                                          "{language === 'ne' ? dreamResult.psychology.ne : dreamResult.psychology.en}"
                                      </p>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {/* PERSONAL HEALTH VIEW */}
          {activeTab === 'personal' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
               {loadingLog ? (
                 <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="animate-spin text-red-600 w-12 h-12" />
                    <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Accessing Ritual Logs...</p>
                 </div>
               ) : log ? (
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-2xl border-2 border-blue-50 dark:border-blue-900/30 flex flex-col items-center group relative overflow-visible">
                            <h2 className="font-black text-gray-900 dark:text-white mb-6 text-xl uppercase tracking-tighter relative z-10">{t("Hydration Track", "Hydration Track")}</h2>
                            <div className="flex items-center gap-8 relative z-10">
                                <button onClick={() => updateLog({ ...log, waterGlasses: Math.max(0, log.waterGlasses - 1) })} className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 flex items-center justify-center transition-all active:scale-90 shadow-sm"><Minus size={28}/></button>
                                <div className="text-center">
                                <span className={`text-7xl font-black drop-shadow-sm transition-colors ${isWaterOverflowing ? 'text-blue-500' : 'text-blue-600 dark:text-blue-400'}`}>{log.waterGlasses}</span>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2">Glasses / 8</p>
                                </div>
                                <button onClick={() => updateLog({ ...log, waterGlasses: log.waterGlasses + 1 })} className="w-14 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-2xl active:scale-90 transition-all"><Plus size={28}/></button>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-2xl border-2 border-yellow-50 dark:border-yellow-900/30 flex flex-col items-center">
                            <h2 className="font-black text-gray-900 dark:text-white mb-8 text-xl uppercase tracking-tighter">{t("Mood Ritual", "Mood Ritual")}</h2>
                            <div className="grid grid-cols-2 gap-4 w-full">
                                {['Happy', 'Neutral', 'Stressed', 'Tired'].map((m: any) => (
                                <button key={m} onClick={() => updateLog({...log, mood: m})} className={`py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${log.mood === m ? 'bg-yellow-500 text-white shadow-xl scale-105' : 'bg-gray-50 dark:bg-gray-700 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>{t(m, m)}</button>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-2xl border-2 border-indigo-50 dark:border-indigo-900/30 flex flex-col items-center">
                            <h2 className="font-black text-gray-900 dark:text-white mb-6 text-xl uppercase tracking-tighter">{t("Recovery Sleep", "Recovery Sleep")}</h2>
                            <div className="flex items-center gap-8">
                                <button onClick={() => updateLog({ ...log, sleepHours: Math.max(0, log.sleepHours - 1) })} className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 flex items-center justify-center active:scale-90 transition-all shadow-sm"><Minus size={28}/></button>
                                <div className="text-center">
                                <span className="text-7xl font-black text-indigo-600 dark:text-indigo-400 drop-shadow-sm">{log.sleepHours}</span>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2">Hours / 8</p>
                                </div>
                                <button onClick={() => updateLog({ ...log, sleepHours: log.sleepHours + 1 })} className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl active:scale-90 transition-all"><Plus size={28}/></button>
                            </div>
                        </div>
                    </div>
                </div>
               ) : null}
            </div>
          )}

          {/* FITNESS STUDIO (RENOVATED YOG FLOW) */}
          {activeTab === 'fitness' && (
              <div className="animate-in fade-in slide-up duration-700 space-y-12">
                  
                  {/* GENERATOR HEADER */}
                  <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-800 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
                      <div className="relative z-10 max-w-2xl space-y-6">
                          <h2 className="text-5xl font-black italic mb-2 uppercase tracking-tighter">{t("Fitness Studio", "Fitness Studio")}</h2>
                          <p className="text-indigo-100 text-xl font-medium leading-relaxed opacity-90">
                              {t("Generate custom workout guides or follow classic Nepali yoga. Your AI Coach is ready.", "Generate custom workout guides or follow classic Nepali yoga. Your AI Coach is ready.")}
                          </p>
                          
                          <div className="bg-white/10 backdrop-blur-md p-2 pl-6 rounded-[2rem] flex items-center border border-white/20 max-w-lg shadow-xl">
                              <Search className="text-white/60 mr-3" size={24}/>
                              <input 
                                value={customExerciseInput}
                                onChange={(e) => setCustomExerciseInput(e.target.value)}
                                placeholder="Create guide for 'Pushups', 'Plank'..."
                                className="bg-transparent border-none outline-none text-white placeholder-white/50 text-lg font-bold flex-1"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerateWorkout()}
                              />
                              <Button onClick={() => handleGenerateWorkout()} disabled={isGeneratingExercise} className="rounded-[1.5rem] px-8 h-12 bg-white text-indigo-900 font-black uppercase text-sm hover:scale-105 transition-transform">
                                {isGeneratingExercise ? <Loader2 className="animate-spin"/> : <Sparkles size={18}/>}
                              </Button>
                          </div>
                      </div>
                      <Waves className="absolute -right-20 -bottom-20 text-white/5 w-[500px] h-[500px] rotate-12" />
                  </div>

                  {/* EXERCISE GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {exercises.map(pose => (
                          <div 
                            key={pose.id} 
                            onClick={() => setActiveYogaPose(pose)}
                            className={`bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-sm border-2 border-gray-50 dark:border-gray-700 hover:shadow-2xl transition-all group cursor-pointer hover:-translate-y-2 hover:border-indigo-500/50 relative overflow-hidden`}
                          >
                              {/* Flashcard Style Background */}
                              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 pointer-events-none"></div>
                              
                              <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2rem] flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:rotate-12 transition-all shadow-xl">
                                    {pose.icon ? <pose.icon size={40} /> : <Dumbbell size={40} />}
                                </div>
                                <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    Card
                                </div>
                              </div>
                              
                              <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-4 leading-none relative z-10">{language === 'en' ? pose.name : (pose.neName || pose.name)}</h3>
                              
                              <div className="space-y-4 relative z-10">
                                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border-l-4 border-indigo-500">
                                      <p className="text-[10px] uppercase font-black text-indigo-500 tracking-[0.3em] mb-2">{t("Benefits", "Benefits")}</p>
                                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-snug italic">{language === 'en' ? pose.benefits : (pose.neBenefits || pose.benefits)}</p>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-400 text-xs font-black uppercase tracking-widest group-hover:text-indigo-500 transition-colors">
                                      <Play size={14} className="fill-current"/> Open Session
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
export default Health;
