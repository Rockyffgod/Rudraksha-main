
import React, { useState } from 'react';
import { Library as LibraryIcon, Lock, FileText, CheckCircle2, Bell, ShieldAlert, BookOpen, GraduationCap, Building2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';

const Library: React.FC = () => {
  const { t } = useLanguage();
  const [notified, setNotified] = useState(false);

  const handleNotify = () => {
    setNotified(true);
  };

  const timeline = [
    { title: "System Architecture", status: "completed", date: "Ready" },
    { title: "CDC Content Request", status: "current", date: "Pending Submission" },
    { title: "Government Approval", status: "waiting", date: "TBD" },
    { title: "Public Deployment", status: "waiting", date: "Q2 2025" }
  ];

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic tracking-tighter uppercase">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl shadow-sm">
              <LibraryIcon className="text-emerald-600" size={32} />
            </div>
            {t("Digital Library", "Digital Library")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mt-2 ml-1">
            {t("National Curriculum & Resources", "National Curriculum & Resources")}
          </p>
        </div>
        <div className="px-5 py-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-full text-xs font-black text-yellow-700 dark:text-yellow-500 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            Pending Approval
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Column: Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 border-2 border-gray-100 dark:border-gray-700 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                    <Lock size={40} className="text-gray-400" />
                </div>
                
                <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-4">
                    Content Locked
                </h2>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-6 rounded-r-2xl mb-8">
                    <h3 className="text-sm font-black text-yellow-700 dark:text-yellow-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Building2 size={16}/> CDC Compliance
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                        To ensure educational integrity, we are waiting for official API access from the <span className="font-bold">Curriculum Development Centre (CDC)</span>. This ensures all textbooks and materials are up-to-date with the National Syllabus.
                    </p>
                </div>

                <div className="space-y-6">
                    {timeline.map((step, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${step.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : step.status === 'current' ? 'bg-white dark:bg-gray-800 border-emerald-500 text-emerald-500' : 'border-gray-200 dark:border-gray-700 text-gray-300'}`}>
                                {step.status === 'completed' ? <CheckCircle2 size={16}/> : <div className={`w-2.5 h-2.5 rounded-full ${step.status === 'current' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>}
                            </div>
                            <div>
                                <p className={`text-sm font-bold uppercase tracking-wide ${step.status === 'waiting' ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>{step.title}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{step.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-12">
                {notified ? (
                    <div className="w-full h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">
                        <CheckCircle2 size={20} className="mr-2"/> You're on the list
                    </div>
                ) : (
                    <Button onClick={handleNotify} className="w-full h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-xl">
                        <Bell size={20} className="mr-2"/> Notify on Launch
                    </Button>
                )}
            </div>
        </div>

        {/* Right Column: Preview Placeholder */}
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <BookOpen size={180} className="absolute -bottom-10 -right-10 text-white opacity-10 rotate-12" />
                
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6 border border-white/20">
                        <GraduationCap size={12}/> Planned Features
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">The Future of Learning</h2>
                    <p className="text-indigo-100 font-medium leading-relaxed mb-8">
                        Once approved, Rudraksha will host the complete repository of Grade 1-12 textbooks, interactive video lessons, and AI-powered doubt resolution tailored to the Nepali curriculum.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h4 className="font-bold text-lg">500+</h4>
                            <p className="text-[10px] uppercase font-black opacity-70">Textbooks</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h4 className="font-bold text-lg">AI</h4>
                            <p className="text-[10px] uppercase font-black opacity-70">Tutor Support</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 flex items-center gap-6 opacity-60 grayscale cursor-not-allowed">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm">
                    <FileText size={32} className="text-gray-400"/>
                </div>
                <div>
                    <h3 className="font-black text-gray-900 dark:text-white uppercase">Model Question Sets</h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Locked</p>
                </div>
                <Lock size={20} className="ml-auto text-gray-400"/>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 flex items-center gap-6 opacity-60 grayscale cursor-not-allowed">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm">
                    <ShieldAlert size={32} className="text-gray-400"/>
                </div>
                <div>
                    <h3 className="font-black text-gray-900 dark:text-white uppercase">Exam Alerts</h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Locked</p>
                </div>
                <Lock size={20} className="ml-auto text-gray-400"/>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Library;
