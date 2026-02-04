
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { Task, TaskStatus, Priority, Subtask, UserProfile, StudyNote } from '../types';
import { Button } from '../components/ui/Button';
import { Plus, Trash2, Calendar, Tag, CheckCircle, Circle, CheckSquare, Loader2, ChevronDown, ChevronRight, X, Clock, StickyNote, PenTool, Layout as LayoutIcon, GraduationCap, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../contexts/LanguageContext';

const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'General'];

const Planner: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'assignments' | 'vault'>('assignments');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  // Assignment State
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    subject: 'General',
    priority: Priority.MEDIUM,
    dueDate: new Date().toISOString().split('T')[0],
    description: '',
    subtasks: [],
    estimatedMinutes: 45,
    targetClass: '10' 
  });

  const [newNote, setNewNote] = useState<Partial<StudyNote>>({ 
    title: '', content: '', color: 'bg-yellow-100', textColor: 'text-gray-900', fontFamily: 'sans' 
  });

  const loadData = async () => {
    setLoading(true);
    const [t_list, p, n] = await Promise.all([
        StorageService.getTasks(),
        StorageService.getProfile(),
        StorageService.getNotes()
    ]);
    setTasks(t_list);
    setProfile(p);
    setNotes(n);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;

    const isTeacher = profile?.role === 'teacher';

    const taskToSave: Task = {
      id: Date.now().toString(), 
      userId: profile?.id || 'anon',
      title: newTask.title,
      subject: newTask.subject || 'General',
      priority: newTask.priority || Priority.MEDIUM,
      status: TaskStatus.TODO,
      dueDate: newTask.dueDate || new Date().toISOString(),
      description: newTask.description,
      subtasks: newTask.subtasks || [],
      estimatedMinutes: newTask.estimatedMinutes || 45,
      isAssignment: isTeacher,
      targetClass: isTeacher ? newTask.targetClass : profile?.grade
    };

    await StorageService.saveTask(taskToSave);
    await loadData();
    setIsTaskModalOpen(false);
    setNewTask({ title: '', subject: 'General', priority: Priority.MEDIUM, dueDate: new Date().toISOString().split('T')[0], description: '', subtasks: [], estimatedMinutes: 45, targetClass: '10' });
    if (isTeacher) confetti({ particleCount: 40, spread: 60 });
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title || !newNote.content) return;
    await StorageService.saveNote(newNote);
    await loadData();
    setIsNoteModalOpen(false);
    setNewNote({ title: '', content: '', color: 'bg-yellow-100', textColor: 'text-gray-900', fontFamily: 'sans' });
  };

  const deleteNote = async (id: string) => {
      if (confirm('Delete this note?')) {
          await StorageService.deleteNote(id);
          await loadData();
      }
  };

  const toggleStatus = async (task: Task) => {
    let updatedStatus: TaskStatus;
    if (task.status === TaskStatus.COMPLETED) {
        updatedStatus = TaskStatus.TODO;
    } else if (task.status === TaskStatus.SUBMITTED) {
        updatedStatus = TaskStatus.TODO; 
    } else {
        if (profile?.role === 'teacher') {
             updatedStatus = TaskStatus.COMPLETED;
             confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
             StorageService.addPoints(10, 50); 
        } else {
             updatedStatus = TaskStatus.SUBMITTED;
        }
    }
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: updatedStatus } : t);
    setTasks(updatedTasks);
    await StorageService.saveTask({ ...task, status: updatedStatus });
  };

  const deleteTask = async (id: string) => {
    if (confirm('Permanently remove this task?')) {
        setTasks(prev => prev.filter(t => t.id !== id));
        await StorageService.deleteTask(id);
    }
  };

  const handleToggleExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    setNewSubtaskInput('');
  };

  const addSubtask = async (taskId: string) => {
    if (!newSubtaskInput.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newS: Subtask = { id: Date.now().toString(), title: newSubtaskInput, completed: false };
    const updatedTask = { ...task, subtasks: [...(task.subtasks || []), newS] };
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    setNewSubtaskInput('');
    await StorageService.saveTask(updatedTask);
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedS = (task.subtasks || []).map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    const updatedTask = { ...task, subtasks: updatedS };
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    await StorageService.saveTask(updatedTask);
  };

  const getGroupedTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    const overdue: Task[] = [];
    const dueToday: Task[] = [];
    const upcoming: Task[] = [];
    const completed: Task[] = [];
    const submitted: Task[] = [];

    tasks.forEach(t => {
      if (t.status === TaskStatus.COMPLETED) completed.push(t);
      else if (t.status === TaskStatus.SUBMITTED) submitted.push(t);
      else {
        const tDate = t.dueDate.split('T')[0];
        if (tDate < today) overdue.push(t);
        else if (tDate === today) dueToday.push(t);
        else upcoming.push(t);
      }
    });
    return { overdue, dueToday, upcoming, completed, submitted };
  };

  const { overdue, dueToday, upcoming, completed, submitted } = getGroupedTasks();
  const isTeacher = profile?.role === 'teacher';

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic tracking-tighter uppercase">
                    <CheckSquare className="text-red-600"/> {activeTab === 'assignments' ? t("Assignments", "Assignments") : t("Personal Notes", "Personal Notes")}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg ml-1">
                    {activeTab === 'assignments' ? t("Distribute academic tasks and track progress.", "Distribute academic tasks and track progress.") : t("Archive intellectual sparks with custom aesthetics.", "Archive intellectual sparks with custom aesthetics.")}
                </p>
            </div>
            
            <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-md p-1.5 rounded-2xl flex gap-1 border border-white/20 shadow-lg">
                <button 
                    onClick={() => setActiveTab('assignments')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all uppercase tracking-widest ${activeTab === 'assignments' ? 'bg-white text-gray-900 shadow-xl' : 'text-white hover:bg-white/10'}`}
                >
                    <GraduationCap size={16}/> {t("Assignments", "Assignments")}
                </button>
                <button 
                    onClick={() => setActiveTab('vault')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all uppercase tracking-widest ${activeTab === 'vault' ? 'bg-white text-gray-900 shadow-xl' : 'text-white hover:bg-white/10'}`}
                >
                    <StickyNote size={16}/> {t("Notes", "Notes")}
                </button>
            </div>
        </div>

        <div className="flex justify-end gap-3">
            {activeTab === 'assignments' && isTeacher && (
                <Button onClick={() => setIsTaskModalOpen(true)} className="bg-red-600 hover:bg-red-700 rounded-2xl h-14 px-10 text-lg font-black italic shadow-xl shadow-red-200 dark:shadow-none">
                    <Plus size={22} className="mr-2" />
                    {t("Assign Homework", "Assign Homework")}
                </Button>
            )}
            {activeTab === 'vault' && (
                <Button onClick={() => setIsNoteModalOpen(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white border-transparent rounded-2xl h-14 px-10 text-lg font-black italic shadow-xl shadow-yellow-200 dark:shadow-none">
                    <PenTool size={22} className="mr-2" />
                    {t("Log Note", "Log Note")}
                </Button>
            )}
        </div>
      </div>

      {loading ? (
         <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-red-500 w-12 h-12" /></div>
      ) : activeTab === 'assignments' ? (
        tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-[3rem] border border-white/20 dark:border-gray-700">
            <div className="w-48 h-48 bg-emerald-100 dark:bg-gray-700 rounded-full flex items-center justify-center relative overflow-hidden shadow-inner border-4 border-emerald-50 dark:border-gray-800">
               <img src="https://img.freepik.com/free-vector/homework-concept-illustration_114360-1077.jpg" alt="" className="w-full h-full object-cover opacity-80" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-gray-800 dark:text-white uppercase italic tracking-tighter">{t("Zero Pending", "Zero Pending")}</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto font-medium text-lg leading-relaxed">
                {t("No homework assigned or goals set. Enjoy your leisure or set a new milestone.", "No homework assigned or goals set. Enjoy your leisure or set a new milestone.")}
              </p>
            </div>
          </div>
        ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {overdue.length > 0 && <TaskGroup title="Overdue" tasks={overdue} color="red" toggleStatus={toggleStatus} deleteTask={deleteTask} calculateProgress={p => Math.round(((p.subtasks?.filter(s => s.completed).length || 0) / (p.subtasks?.length || 1)) * 100)} expandedTaskId={expandedTaskId} onToggleExpand={handleToggleExpand} addSubtask={addSubtask} toggleSubtask={toggleSubtask} newSubtaskInput={newSubtaskInput} setNewSubtaskInput={setNewSubtaskInput} isTeacher={isTeacher}/>}
                {dueToday.length > 0 && <TaskGroup title="Due Today" tasks={dueToday} color="blue" toggleStatus={toggleStatus} deleteTask={deleteTask} calculateProgress={p => Math.round(((p.subtasks?.filter(s => s.completed).length || 0) / (p.subtasks?.length || 1)) * 100)} expandedTaskId={expandedTaskId} onToggleExpand={handleToggleExpand} addSubtask={addSubtask} toggleSubtask={toggleSubtask} newSubtaskInput={newSubtaskInput} setNewSubtaskInput={setNewSubtaskInput} isTeacher={isTeacher}/>}
                {upcoming.length > 0 && <TaskGroup title="Upcoming" tasks={upcoming} color="green" toggleStatus={toggleStatus} deleteTask={deleteTask} calculateProgress={p => Math.round(((p.subtasks?.filter(s => s.completed).length || 0) / (p.subtasks?.length || 1)) * 100)} expandedTaskId={expandedTaskId} onToggleExpand={handleToggleExpand} addSubtask={addSubtask} toggleSubtask={toggleSubtask} newSubtaskInput={newSubtaskInput} setNewSubtaskInput={setNewSubtaskInput} isTeacher={isTeacher}/>}
                {submitted.length > 0 && <TaskGroup title="Review Pending" tasks={submitted} color="yellow" toggleStatus={toggleStatus} deleteTask={deleteTask} calculateProgress={p => 100} expandedTaskId={expandedTaskId} onToggleExpand={handleToggleExpand} addSubtask={addSubtask} toggleSubtask={toggleSubtask} newSubtaskInput={newSubtaskInput} setNewSubtaskInput={setNewSubtaskInput} isTeacher={isTeacher}/>}
                {completed.length > 0 && <TaskGroup title="Completed" tasks={completed} color="gray" toggleStatus={toggleStatus} deleteTask={deleteTask} calculateProgress={p => 100} expandedTaskId={expandedTaskId} onToggleExpand={handleToggleExpand} addSubtask={addSubtask} toggleSubtask={toggleSubtask} newSubtaskInput={newSubtaskInput} setNewSubtaskInput={setNewSubtaskInput} isTeacher={isTeacher}/>}
            </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
            {notes.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                    <StickyNote size={64} className="mb-4 opacity-20"/>
                    <p className="text-xl font-black uppercase tracking-widest">No notes in the vault</p>
                </div>
            ) : (
                notes.map((note) => (
                    <div key={note.id} className={`relative p-8 rounded-[2.5rem] shadow-xl border border-black/5 transition-all hover:-translate-y-2 hover:shadow-2xl ${note.color || 'bg-yellow-100'} ${note.fontFamily === 'serif' ? 'font-serif' : note.fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`}>
                        <button onClick={() => deleteNote(note.id)} className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-red-500 hover:text-white rounded-full transition-colors text-gray-500 shadow-sm"><Trash2 size={16}/></button>
                        <h3 className={`font-black text-2xl mb-4 pr-10 uppercase italic tracking-tighter ${note.textColor || 'text-gray-900'}`}>{note.title}</h3>
                        <p className={`text-lg whitespace-pre-wrap leading-relaxed min-h-[120px] font-medium italic ${note.textColor || 'text-gray-700'}`}>"{note.content}"</p>
                        <div className="mt-8 pt-6 border-t border-black/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsTaskModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl max-w-xl w-full p-10 animate-in zoom-in duration-300 border-4 border-gray-900 flex flex-col max-h-[90vh]">
            <header className="flex justify-between items-center mb-8 shrink-0">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl text-red-600"><GraduationCap size={28}/></div>
                  <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter dark:text-white">{t("Assign Homework", "Assign Homework")}</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Class distribution Portal</p>
                  </div>
               </div>
               <button onClick={() => setIsTaskModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={32}/></button>
            </header>

            <form onSubmit={handleSaveTask} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Target Class</label>
                <div className="relative">
                    <Users size={20} className="absolute left-4 top-4 text-gray-400"/>
                    <select 
                      required 
                      className="w-full pl-12 pr-4 h-14 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:border-red-500 outline-none dark:text-white font-bold text-sm appearance-none"
                      value={newTask.targetClass}
                      onChange={e => setNewTask({...newTask, targetClass: e.target.value})}
                    >
                      {CLASSES.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                    </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Title</label>
                <input
                  type="text" required
                  className="w-full px-6 h-14 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:border-red-500 outline-none dark:text-white font-bold text-lg"
                  placeholder="e.g. History Chapter 4 Summary"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Subject</label>
                  <select
                    className="w-full px-6 h-14 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:border-red-500 outline-none dark:text-white font-bold text-sm"
                    value={newTask.subject}
                    onChange={e => setNewTask({...newTask, subject: e.target.value})}
                  >
                    {['Math', 'Physics', 'Chemistry', 'History', 'English', 'Nepali', 'Social', 'CS', 'General'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Priority</label>
                  <select
                    className="w-full px-6 h-14 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:border-red-500 outline-none dark:text-white font-bold text-sm"
                    value={newTask.priority}
                    onChange={e => setNewTask({...newTask, priority: e.target.value as Priority})}
                  >
                    <option value={Priority.LOW}>Standard</option>
                    <option value={Priority.MEDIUM}>Important</option>
                    <option value={Priority.HIGH}>Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Deadline</label>
                    <input
                    type="date"
                    className="w-full px-6 h-14 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:border-red-500 outline-none dark:text-white font-bold"
                    value={newTask.dueDate}
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Est. Mins</label>
                    <input
                    type="number"
                    className="w-full px-6 h-14 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:border-red-500 outline-none dark:text-white font-bold"
                    value={newTask.estimatedMinutes}
                    onChange={e => setNewTask({...newTask, estimatedMinutes: parseInt(e.target.value)})}
                    />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-6 shrink-0">
                <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black uppercase text-xl italic shadow-2xl shadow-red-600/40">Assign Homework</Button>
                <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)} className="h-12 font-bold uppercase text-[10px] tracking-[0.3em] opacity-40">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsNoteModalOpen(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 animate-in zoom-in duration-300 border-4 border-gray-900">
             <header className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Vault Entry</h2>
                <button onClick={() => setIsNoteModalOpen(false)}><X size={32} className="text-gray-400 hover:text-red-500 transition-colors"/></button>
             </header>
             <form onSubmit={handleSaveNote} className="space-y-6">
                <div className="space-y-2">
                   <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Note Aesthetic</label>
                   <div className="flex gap-2">
                      {['bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-red-100'].map(c => (
                        <button key={c} type="button" onClick={() => setNewNote({...newNote, color: c})} className={`w-8 h-8 rounded-full border-2 transition-all ${c} ${newNote.color === c ? 'border-black scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}></button>
                      ))}
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Typography</label>
                   <div className="flex gap-2">
                      {(['sans', 'serif', 'mono'] as const).map(f => (
                        <button key={f} type="button" onClick={() => setNewNote({...newNote, fontFamily: f})} className={`px-4 py-2 rounded-xl text-xs font-black uppercase border-2 transition-all ${newNote.fontFamily === f ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-200'}`}>
                           {f}
                        </button>
                      ))}
                   </div>
                </div>
                <input required className="w-full px-6 h-14 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-yellow-500 outline-none font-black text-xl italic uppercase tracking-tighter" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} placeholder="Title" />
                <textarea required rows={5} className={`w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-yellow-500 outline-none font-medium text-lg leading-relaxed resize-none ${newNote.fontFamily === 'serif' ? 'font-serif' : newNote.fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`} value={newNote.content} onChange={e => setNewNote({...newNote, content: e.target.value})} placeholder="Log your thoughts..."></textarea>
                <Button type="submit" className="w-full h-16 rounded-2xl bg-yellow-500 font-black uppercase text-lg">Save Note</Button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskGroup = ({ title, tasks, color, toggleStatus, deleteTask, calculateProgress, expandedTaskId, onToggleExpand, addSubtask, toggleSubtask, newSubtaskInput, setNewSubtaskInput, isTeacher }: any) => {
  const colorClasses: Record<string, string> = {
    red: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    green: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    gray: "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
  };

  return (
    <div className="space-y-6">
       <div className={`px-8 py-4 rounded-[1.5rem] border-l-[12px] font-black uppercase italic tracking-tighter flex justify-between items-center shadow-lg ${colorClasses[color]}`}>
          <span className="text-xl">{title}</span>
          <span className="text-sm bg-white dark:bg-gray-900 px-4 py-1 rounded-full border border-black/5 shadow-sm">{tasks.length}</span>
       </div>
       <div className="grid gap-6">
         {tasks.map((task: Task, idx: number) => {
           const prog = calculateProgress(task);
           return (
             <div key={task.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-2xl animate-in slide-in-from-left-4 fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
                <div className="p-8 flex items-start gap-6">
                  <button onClick={() => toggleStatus(task)} className={`mt-1 flex-shrink-0 transition-all hover:scale-110 active:scale-95 ${task.status === TaskStatus.COMPLETED ? 'text-green-500' : task.status === TaskStatus.SUBMITTED ? 'text-yellow-500' : 'text-gray-300 hover:text-red-500'}`}>
                    {task.status === TaskStatus.COMPLETED ? <CheckCircle size={40} /> : task.status === TaskStatus.SUBMITTED ? <Loader2 className="animate-spin" size={40}/> : <Circle size={40} />}
                  </button>

                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {task.targetClass && <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800 shadow-sm flex items-center gap-1.5"><GraduationCap size={10}/> Class: {task.targetClass}</span>}
                            <span className="px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-100 dark:border-red-800 shadow-sm flex items-center gap-1.5"><Tag size={10}/> {task.subject}</span>
                          </div>
                          <h3 className={`font-black text-2xl tracking-tighter uppercase italic leading-none transition-all ${task.status === TaskStatus.COMPLETED ? 'text-gray-300 dark:text-gray-600 line-through' : 'text-gray-900 dark:text-white'}`}>{task.title}</h3>
                        </div>
                        <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2"><Trash2 size={20}/></button>
                     </div>
                     
                     <div className="flex items-center gap-4 mt-6">
                        <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner relative">
                            <div className={`h-full transition-all duration-1000 ease-out rounded-full ${prog === 100 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]'}`} style={{width: `${prog}%`}}></div>
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-500 shrink-0">{prog}% COMPLETE</span>
                     </div>
                  </div>
                </div>

                <div className="px-8 pb-8 flex justify-between items-center">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700"><Calendar size={14} className="text-red-500"/> Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700"><Clock size={14} className="text-indigo-500"/> {task.estimatedMinutes} MIN</div>
                    </div>
                    <button onClick={() => onToggleExpand(task.id)} className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-500 hover:text-indigo-600 transition-all active:scale-95 px-6 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        {expandedTaskId === task.id ? <ChevronDown size={18}/> : <ChevronRight size={18}/>} Subtasks
                    </button>
                </div>

                {expandedTaskId === task.id && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-8 border-t-2 border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-4 duration-300">
                     <div className="space-y-4 mb-8">
                       {task.subtasks?.length === 0 && <p className="text-center py-6 text-gray-400 italic font-medium">No subtasks defined yet.</p>}
                       {task.subtasks?.map((sub: Subtask) => (
                         <div key={sub.id} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group/sub">
                            <button onClick={() => toggleSubtask(task.id, sub.id)} className={`transition-all active:scale-90 ${sub.completed ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}>
                               {sub.completed ? <CheckCircle size={24}/> : <Circle size={24}/>}
                            </button>
                            <span className={`text-base font-bold flex-1 transition-all ${sub.completed ? 'text-gray-300 dark:text-gray-600 line-through italic' : 'text-gray-700 dark:text-gray-200'}`}>{sub.title}</span>
                         </div>
                       ))}
                     </div>
                     {!isTeacher && (
                        <div className="flex gap-4">
                           <input className="flex-1 px-6 h-14 text-sm font-bold border-2 border-gray-100 rounded-2xl dark:bg-gray-800 dark:text-white dark:border-gray-700 outline-none focus:border-indigo-600 transition-all shadow-inner" placeholder="Add custom sub-task..." value={newSubtaskInput} onChange={(e: any) => setNewSubtaskInput(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && addSubtask(task.id)} />
                           <button onClick={() => addSubtask(task.id)} className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-xl active:scale-90 shrink-0"><Plus size={24}/></button>
                        </div>
                     )}
                  </div>
                )}
             </div>
           );
         })}
       </div>
    </div>
  );
};

export default Planner;
