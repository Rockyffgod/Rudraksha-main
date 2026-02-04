import React, { useEffect, useState, useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { Task, TaskStatus, StudySession, Priority, UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, Zap, Target, 
  Brain, Info, 
  ArrowUpRight, 
  Loader2, 
  GraduationCap, Activity,
  CheckCircle2, Clock,
  Sparkles,
  PieChart as PieIcon,
  Zap as ZapIcon,
  Layout,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../contexts/LanguageContext';

const CountUp = ({ end, duration = 1500 }: { end: number, duration?: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const update = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * end));
      if (progress < 1) animationFrame = requestAnimationFrame(update);
    };
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  return <>{count}</>;
};

const EmptyMetricState = ({ 
  title, 
  message, 
  cta, 
  onCtaClick, 
  icon: Icon 
}: { 
  title: string, 
  message: string, 
  cta: string, 
  onCtaClick: () => void, 
  icon: any 
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gray-50/50 dark:bg-gray-900/30 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-500">
    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-400 mb-6 group-hover:scale-110 transition-transform">
      <Icon size={32} />
    </div>
    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium max-w-xs mb-8 leading-relaxed">"{message}"</p>
    <Button onClick={onCtaClick} variant="primary" className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20">
      {cta}
    </Button>
  </div>
);

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [tasksData, sessionsData, profileData] = await Promise.all([
        StorageService.getTasks(),
        StorageService.getStudySessions(),
        StorageService.getProfile()
      ]);
      setTasks(tasksData);
      setSessions(sessionsData);
      setProfile(profileData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    if (tasks.length === 0 && sessions.length === 0) {
      return { score: 0, trend: 'stable', focus: 0, deepWork: 0, curriculum: 0, consistency: 0, difficulty: 0 };
    }

    // 1. Focus Grade (30%): Completion percentage
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const focusGrade = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    // 2. Deep Work Hours (25%): Target 15 hours / week as 100%
    const totalFocusMinutes = sessions.filter(s => s.isFocusMode).reduce((sum, s) => sum + s.durationMinutes, 0);
    const deepWorkHours = totalFocusMinutes / 60;
    const deepWorkScore = Math.min(100, (deepWorkHours / 15) * 100);

    // 3. Curriculum Load Completion (20%): Percentage of tasks completed
    const curriculumScore = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    // 4. Consistency/Streaks (15%): Days active in the last 7 days
    const uniqueDays = new Set(sessions.map(s => new Date(s.timestamp).toLocaleDateString())).size;
    const consistencyScore = (uniqueDays / 7) * 100;

    // 5. Task Difficulty Handling (10%): Completion of High Priority tasks
    const highPriorityTasks = tasks.filter(t => t.priority === Priority.HIGH);
    const completedHighPriority = highPriorityTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const difficultyScore = highPriorityTasks.length > 0 ? (completedHighPriority / highPriorityTasks.length) * 100 : 50;

    const compositeScore = Math.round(
      (focusGrade * 0.30) + 
      (deepWorkScore * 0.25) + 
      (curriculumScore * 0.20) + 
      (consistencyScore * 0.15) + 
      (difficultyScore * 0.10)
    );

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (sessions.length > 2) {
        const mid = Math.floor(sessions.length / 2);
        const recent = sessions.slice(mid).reduce((a, b) => a + b.durationMinutes, 0);
        const older = sessions.slice(0, mid).reduce((a, b) => a + b.durationMinutes, 0);
        if (recent > older * 1.1) trend = 'up';
        else if (recent < older * 0.9) trend = 'down';
    }

    return { 
      score: compositeScore, 
      trend,
      focus: Math.round(focusGrade), 
      deepWork: Math.round(deepWorkHours * 10) / 10, 
      curriculum: Math.round(curriculumScore), 
      consistency: Math.round(consistencyScore), 
      difficulty: Math.round(difficultyScore) 
    };
  }, [tasks, sessions]);

  const intensityMapping = useMemo(() => {
    const days = 7;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString();
        const mins = sessions
            .filter(s => new Date(s.timestamp).toLocaleDateString() === dateStr)
            .reduce((sum, s) => sum + s.durationMinutes, 0);
        result.push({ name: d.toLocaleDateString(undefined, {weekday: 'short'}), mins });
    }
    return result;
  }, [sessions]);

  const velocityByDiscipline = useMemo(() => {
    const subs = Array.from(new Set(tasks.map(t => t.subject)));
    return subs.map(sub => {
        const subTasks = tasks.filter(t => t.subject === sub);
        const completed = subTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
        const subSessions = sessions.filter(s => s.subject === sub);
        const totalMins = subSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
        return {
            subject: sub,
            percent: Math.round((completed / subTasks.length) * 100),
            time: totalMins,
            tasks: subTasks.length
        };
    }).sort((a, b) => b.percent - a.percent);
  }, [tasks, sessions]);

  const curriculumLoad = useMemo(() => {
    const subjects = Array.from(new Set(tasks.map(t => t.subject)));
    return subjects.map((sub, i) => ({
      name: sub,
      value: tasks.filter(t => t.subject === sub).length,
      fill: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'][i % 6]
    }));
  }, [tasks]);

  const stateAnalysisData = useMemo(() => {
    const deepWork = sessions.filter(s => s.isFocusMode).reduce((sum, s) => sum + s.durationMinutes, 0);
    const standardWork = sessions.filter(s => !s.isFocusMode).reduce((sum, s) => sum + s.durationMinutes, 0);
    return [
      { name: 'Deep Work', value: deepWork, fill: '#4f46e5' },
      { name: 'Standard', value: standardWork, fill: '#94a3b8' }
    ].filter(v => v.value > 0);
  }, [sessions]);

  const nextBestAction = useMemo(() => {
      const pending = tasks.filter(t => t.status !== TaskStatus.COMPLETED);
      if (pending.length === 0) return { title: "Set New Goals", desc: "Your queue is empty. Ready for the next challenge?", subject: "General" };
      
      const highPriority = pending.find(t => t.priority === Priority.HIGH);
      if (highPriority) return { title: "High Priority Mission", desc: `Focus on ${highPriority.title}. It's critical for your curriculum progress.`, subject: highPriority.subject };
      
      return { title: "Momentum Builder", desc: `Keep the streak alive by finishing "${pending[0].title}".`, subject: pending[0].subject };
  }, [tasks]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="animate-spin text-red-600 w-12 h-12" />
      <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Processing Intelligence Command...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER & COMPOSITE SCORE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
            <div className="relative shrink-0">
                <svg className="w-44 h-44 transform -rotate-90">
                    <circle cx="88" cy="88" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100 dark:text-gray-700" />
                    <circle cx="88" cy="88" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={502} strokeDashoffset={502 - (502 * stats.score) / 100} className="text-red-600 transition-all duration-1000 ease-out" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1">
                        <span className="text-6xl font-black text-gray-900 dark:text-white leading-none tracking-tighter"><CountUp end={stats.score} /></span>
                        <div className="flex flex-col">
                            {stats.trend === 'up' && <ArrowUp size={24} className="text-emerald-500 animate-bounce" />}
                            {stats.trend === 'down' && <ArrowDown size={24} className="text-red-500 animate-bounce" />}
                            {stats.trend === 'stable' && <Minus size={24} className="text-gray-400" />}
                        </div>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Intelligence Score</span>
                </div>
            </div>
            <div className="flex-1 text-center md:text-left space-y-4">
                <div className="flex items-center justify-center md:justify-start gap-3">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Cognitive Profile</h1>
                    <div className="group relative">
                        <Info size={18} className="text-gray-300 hover:text-red-500 cursor-help transition-colors" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-gray-900 text-white text-[10px] font-bold rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center leading-relaxed">
                            This score reflects learning quality, not IQ.
                            Breakdown: Focus (30%), Deep Work (25%), Completion (20%), Consistency (15%), Difficulty (10%).
                        </div>
                    </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                    Efficiency at <span className="text-red-600 font-black">{stats.focus}%</span>. 
                    Deep work sessions are <span className="text-emerald-500 font-bold">{stats.trend === 'up' ? 'increasing' : 'stabilizing'}</span>.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-emerald-600 border border-emerald-100 dark:border-emerald-800 flex items-center gap-2">
                        <TrendingUp size={14}/> {stats.score > 70 ? 'Scholar Class' : 'Active Growth'}
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-blue-600 border border-blue-100 dark:border-blue-800 flex items-center gap-2">
                        <Zap size={14}/> Level {Math.floor((profile?.xp || 0)/500)+1}
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col justify-between group overflow-hidden relative">
            <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-6 flex items-center gap-2">
                    <Sparkles size={14}/> Recommendation
                </h3>
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 leading-none">{nextBestAction.title}</h2>
                <p className="text-indigo-100 font-medium text-sm leading-relaxed mb-8">"{nextBestAction.desc}"</p>
            </div>
            <Button onClick={() => navigate('/planner')} className="relative z-10 w-full h-14 bg-white text-indigo-900 font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] transition-all">
                Execute Mission <ArrowUpRight size={16} className="ml-2"/>
            </Button>
            <Brain size={180} className="absolute -right-16 -bottom-16 text-white opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000"/>
        </div>
      </div>

      {/* INTENSITY MAPPING (STUDY PULSE) */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                    <Activity className="text-red-600" /> Intensity Pulse
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Concentration Peaks (Last 7 Days)</p>
            </div>
            {sessions.length > 0 && (
              <div className="text-right">
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{(sessions.reduce((a,b) => a+b.durationMinutes,0)/60).toFixed(1)}h</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Energy Invested</p>
              </div>
            )}
        </div>
        
        {sessions.length === 0 ? (
          <EmptyMetricState 
            title="Pulse Flatlined"
            message="Intensity Pulse tracks your focus density over time. Start a session to map your power."
            cta="Initiate Deep Work"
            onCtaClick={() => navigate('/study-buddy')}
            icon={ZapIcon}
          />
        ) : (
          <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={intensityMapping}>
                      <RechartsTooltip 
                          cursor={{fill: 'rgba(0,0,0,0.05)'}} 
                          content={({active, payload}) => {
                              if (active && payload) return <div className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-black shadow-2xl border border-white/10">{payload[0].value} Minutes</div>;
                              return null;
                          }}
                      />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                      <Bar dataKey="mins" radius={[8, 8, 8, 8]} barSize={40}>
                          {intensityMapping.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.mins > 60 ? '#dc2626' : entry.mins > 0 ? '#4f46e5' : '#e2e8f0'} />
                          ))}
                      </Bar>
                  </BarChart>
              </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CURRICULUM LOAD BREAKDOWN */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3 mb-8">
                <PieIcon className="text-blue-500" /> Equilibrium Index
            </h3>
            {tasks.length === 0 ? (
              <EmptyMetricState 
                title="Load Balanced"
                message="Curriculum Load maps your subject distribution. Add tasks to see your focus areas."
                cta="Define Subject Goals"
                onCtaClick={() => navigate('/planner')}
                icon={Layout}
              />
            ) : (
              <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-between">
                <div className="h-full w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={curriculumLoad}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        animationDuration={1500}
                      >
                        {curriculumLoad.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0 max-h-48 overflow-y-auto no-scrollbar">
                  {curriculumLoad.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.fill}} />
                        <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400">{item.name}</span>
                      </div>
                      <span className="text-xs font-black text-gray-900 dark:text-white">{item.value} Units</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* STATE ANALYSIS */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3 mb-8">
                <Brain className="text-purple-500" /> Flow Ratio
            </h3>
            {sessions.length === 0 ? (
              <EmptyMetricState 
                title="State Undefined"
                message="Flow Analysis evaluates your cognitive performance and session depth."
                cta="Log Study Block"
                onCtaClick={() => navigate('/study-buddy')}
                icon={ZapIcon}
              />
            ) : (
              <div className="h-64 w-full flex flex-col items-center justify-center">
                <div className="w-full max-w-xs space-y-6">
                  {stateAnalysisData.map((item, i) => {
                    const total = stateAnalysisData.reduce((a,b) => a+b.value, 0);
                    const percent = Math.round((item.value / total) * 100);
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.name}</span>
                          <span className="text-xl font-black text-gray-900 dark:text-white">{percent}%</span>
                        </div>
                        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden p-0.5">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${percent}%`, backgroundColor: item.fill }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl mt-4 border border-indigo-100 dark:border-indigo-800">
                      <AlertCircle size={14} className="text-indigo-600" />
                      <p className="text-[9px] text-indigo-800 dark:text-indigo-300 font-bold uppercase leading-tight">Focus sessions yield 2x faster mastery conversion.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>

      {/* VELOCITY BY DISCIPLINE */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                <GraduationCap className="text-emerald-600" /> Subject Velocity
            </h3>
          </div>
          
          {velocityByDiscipline.length === 0 ? (
            <EmptyMetricState 
              title="Velocity Locked"
              message="Velocity measures how fast you convert effort into mastery. Plan missions to unlock."
              cta="Plan First Study Block"
              onCtaClick={() => navigate('/planner')}
              icon={TrendingUp}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {velocityByDiscipline.map((sub, i) => (
                  <div key={i} className="space-y-3 group">
                      <div className="flex justify-between items-end">
                          <div>
                              <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-red-600 transition-colors">{sub.subject}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{sub.time} Minutes Invested • {sub.tasks} Units</p>
                          </div>
                          <span className="text-lg font-black text-red-600">{sub.percent}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden p-0.5 border border-black/5">
                          <div 
                              className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(220,38,38,0.3)]" 
                              style={{ width: `${sub.percent}%` }}
                          />
                      </div>
                  </div>
              ))}
            </div>
          )}
      </div>

    </div>
  );
};

export default Analytics;