
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { PlatformService } from '../services/platformService';
import { useNavigate } from 'react-router-dom';
import { UserProfile, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Loader2, Eye, EyeOff, GraduationCap, Users, BookOpen, Sun, Moon, KeyRound, ChevronLeft, AtSign, ArrowLeft, CheckSquare, Square, AlertCircle, ShieldCheck, X, Facebook, Globe, School, Lock } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

// School Code Registry
const SCHOOL_CODES: Record<string, string> = {
    'SSS05': 'Shivapuri Secondary School',
    'DHS01': 'Durbar High School'
};

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme === 'dark';
        return true; 
    }
    return true;
  });
  
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
    schoolCode: '',
    birthCertificateId: '',
    studentId: '',
    guardianName: '',
    grade: '',
    subjects: '',
    profession: ''
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState<string[]>([]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const validatePassword = (pass: string) => {
    const feedback = [];
    let score = 0;
    if (pass.length >= 8) score++; else feedback.push("At least 8 characters");
    if (/[A-Z]/.test(pass)) score++; else feedback.push("One uppercase letter");
    if (/[0-9]/.test(pass)) score++; else feedback.push("One number");
    if (/[^A-Za-z0-9]/.test(pass)) score++; else feedback.push("One special character");
    if (pass.length > 12) score++; 
    
    setPasswordStrength(score);
    setPasswordFeedback(feedback);
    return score;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'password') {
      validatePassword(e.target.value);
    }
  };

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleDemoLogin = async (type: 'student' | 'teacher') => {
    setLoading(true);
    let email = '';
    const password = 'demo123';

    switch (type) {
      case 'student': email = 'student@demo.com'; break;
      case 'teacher': email = 'teacher@demo.com'; break;
    }

    try {
        const { success, error } = await StorageService.login(email, password, true);
        if (success) {
          navigate('/greeting');
        } else {
          setError(error || "Demo login failed.");
          setLoading(false);
        }
    } catch (e) {
        setError("Login error");
        setLoading(false);
    }
  };

  // Social Login logic kept for future enablement
  const handleSocialLogin = async (provider: 'facebook' | 'google') => {
      setLoading(true);
      // Simulate API delay
      await new Promise(r => setTimeout(r, 1500));
      
      // Simulate account linking
      PlatformService.connect(provider, { username: provider === 'facebook' ? 'fb_user' : 'goog_user' });
      
      // Login with a demo account to proceed to app
      // In a real app, this would get a token and create/fetch a user
      const { success } = await StorageService.login('student@demo.com', 'demo123', true);
      
      if (success) {
          navigate('/greeting');
      } else {
          setError("Social Auth Failed");
          setLoading(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(formData.email)) {
        setError("Please enter a valid email address.");
        return;
    }

    if (!isLogin) {
        if (passwordStrength < 3) {
            setError("Password is too weak. Please meet the requirements.");
            return;
        }
        
        // Validate School Code
        if (!formData.schoolCode || !SCHOOL_CODES[formData.schoolCode]) {
            setError("Invalid School Code. Please contact your institution.");
            return;
        }
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        const { success, error } = await StorageService.login(formData.email, formData.password, rememberMe);
        if (success) {
          navigate('/greeting');
        } else {
          setError(error || "Invalid credentials.");
        }
      } else {
        const schoolName = SCHOOL_CODES[formData.schoolCode];
        
        const newProfile: UserProfile = {
          id: '',
          email: formData.email,
          name: formData.name,
          username: formData.username || formData.email.split('@')[0],
          role: role,
          schoolCode: formData.schoolCode,
          schoolName: schoolName,
          // Only map school-specific fields if applicable
          studentId: role === 'student' ? formData.studentId : undefined,
          grade: role === 'student' ? formData.grade : undefined,
          subjects: (role === 'student' || role === 'teacher') && formData.subjects ? formData.subjects.split(',').map(s => s.trim()) : undefined,
          profession: role === 'teacher' ? 'Teacher' : undefined,
          points: 0,
          xp: 0
        };
        
        const { success, error } = await StorageService.register(newProfile, formData.password, true);
        if (success) {
           navigate('/greeting');
        } else {
          setError(error || "Registration failed.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black transition-colors duration-500 font-sans">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=2400&auto=format&fit=crop')" }}
      ></div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90"></div>
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="fixed top-6 left-6 z-50">
         <button onClick={() => navigate('/welcome')} className="p-3 rounded-full bg-white/10 dark:bg-gray-900/40 backdrop-blur-md text-white shadow-xl border border-white/20 hover:scale-110 transition-all">
            <ArrowLeft size={20}/>
         </button>
      </div>
      <div className="fixed top-6 right-6 z-50">
        <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 rounded-full bg-white/10 dark:bg-gray-900/40 backdrop-blur-md text-white dark:text-yellow-400 shadow-xl border border-white/20 hover:scale-110 transition-all"
        >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-lg px-4 flex flex-col items-center">
        
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
           <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
              Welcome to <span className="text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">Rudraksha</span>
           </h1>
           <p className="text-gray-200 text-sm md:text-base font-bold uppercase tracking-[0.4em] mt-4 opacity-80 drop-shadow-md">
              Secure Digital Portal
           </p>
        </div>

        <div className="bg-white/10 dark:bg-black/40 backdrop-blur-3xl p-8 md:p-12 rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] w-full border border-white/20 animate-in zoom-in duration-700">
          
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-20 h-20 mb-6 transform hover:scale-110 transition-transform duration-500">
              <Logo className="w-full h-full drop-shadow-xl" />
            </div>
            <p className="text-white font-bold uppercase tracking-widest text-xs opacity-60">
              {isLogin ? "Authenticate to Access World" : "Create your digital identity"}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 text-red-100 p-4 rounded-2xl text-sm mb-6 border border-red-500/30 font-bold flex items-center gap-2 animate-in shake">
              <AlertCircle size={18} className="text-red-400" /> {error}
            </div>
          )}
          
          {!isLogin && (
            <div className="flex p-1.5 bg-white/10 dark:bg-black/30 rounded-2xl mb-8 gap-1 border border-white/10">
              {[{id: 'student', icon: GraduationCap, label: 'Student'}, {id: 'teacher', icon: BookOpen, label: 'Teacher'}].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id as UserRole)}
                  className={`flex-1 py-3 text-xs font-black rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all ${
                    role === r.id 
                      ? 'bg-red-600 text-white shadow-lg scale-105' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <r.icon size={18} /> {r.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="relative group">
                 <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={20}/>
                 <input 
                  name="email" type="email" required
                  value={formData.email}
                  className="w-full pl-14 pr-5 py-4 rounded-2xl border-2 border-white/10 bg-black/20 text-white focus:border-red-500 outline-none transition-all font-bold text-sm placeholder-gray-500"
                  placeholder="Email Address"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <div className="relative group">
                  <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={20}/>
                  <input 
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  className="w-full pl-14 pr-12 py-4 rounded-2xl border-2 border-white/10 bg-black/20 text-white focus:border-red-500 outline-none transition-all font-bold text-sm placeholder-gray-500"
                  placeholder="Password"
                  onChange={handleChange}
                  />
                  <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
              </div>
              
              {!isLogin && formData.password && (
                  <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                          <div 
                              key={i} 
                              className={`flex-1 rounded-full h-full transition-all duration-500 ${
                              passwordStrength >= i 
                                  ? (passwordStrength < 3 ? 'bg-red-500' : (passwordStrength < 4 ? 'bg-yellow-500' : 'bg-green-500'))
                                  : 'opacity-0'
                              }`} 
                          />
                          ))}
                      </div>
                  </div>
              )}
            </div>

            {isLogin && (
                <div className="flex items-center justify-between px-2">
                    <button type="button" onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                        {rememberMe ? <CheckSquare size={18} className="text-red-500" /> : <Square size={18} />}
                        Remember Me
                    </button>
                    <button type="button" className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-wide">Forgot Pass?</button>
                </div>
            )}

            {!isLogin && (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-4 pt-2">
                <div className="grid grid-cols-1 gap-5">
                  <input 
                    name="name" type="text" required
                    className="w-full px-6 py-4 rounded-2xl border-2 border-white/10 bg-black/20 text-white focus:border-red-500 outline-none transition-all font-bold text-sm"
                    placeholder="Full Name"
                    onChange={handleChange}
                  />
                  <div className="relative group">
                     <School className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={20}/>
                     <input 
                      name="schoolCode" type="text" required
                      value={formData.schoolCode}
                      className="w-full pl-14 pr-5 py-4 rounded-2xl border-2 border-white/10 bg-black/20 text-white focus:border-red-500 outline-none transition-all font-bold text-sm placeholder-gray-500 uppercase tracking-widest"
                      placeholder="SCHOOL CODE (e.g. SSS05)"
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-[0_15px_40px_rgba(220,38,38,0.3)] rounded-2xl bg-red-600 hover:bg-red-700 transform hover:scale-[1.02] active:scale-95 transition-all text-white border-none" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? "Enter Portal" : "Create Account")}
            </Button>

            {isLogin && (
              <div className="space-y-3 pt-2">
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-500 text-[10px] font-black uppercase tracking-widest">Or Continue With</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <button type="button" disabled className="flex items-center justify-center gap-2 bg-gray-800/50 text-gray-500 border border-gray-700 p-3 rounded-2xl cursor-not-allowed relative overflow-hidden group">
                        <Facebook size={18} /> <span className="text-xs font-bold">Facebook</span>
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white flex items-center gap-1"><Lock size={10}/> Locked</span>
                        </div>
                    </button>
                    <button type="button" disabled className="flex items-center justify-center gap-2 bg-gray-800/50 text-gray-500 border border-gray-700 p-3 rounded-2xl cursor-not-allowed relative overflow-hidden group">
                        <Globe size={18} /> <span className="text-xs font-bold">Google</span>
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white flex items-center gap-1"><Lock size={10}/> Locked</span>
                        </div>
                    </button>
                </div>

                {!showDemoMenu ? (
                  <button 
                    type="button"
                    onClick={() => setShowDemoMenu(true)}
                    className="w-full py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors border-2 border-dashed border-white/10 rounded-2xl hover:bg-white/5 mt-4"
                  >
                    <KeyRound size={16} /> Quick Demo Access
                  </button>
                ) : (
                  <div className="bg-black/40 p-5 rounded-3xl border border-white/10 animate-in zoom-in-95 duration-200 mt-2">
                     <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Select Role</span>
                        <button type="button" onClick={() => setShowDemoMenu(false)} className="text-gray-500 hover:text-white">
                          <X size={16} />
                        </button>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => handleDemoLogin('student')} className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-wide transition-all group">
                           <GraduationCap size={24} className="mb-2 text-blue-400"/> Student
                        </button>
                        <button type="button" onClick={() => handleDemoLogin('teacher')} className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-wide transition-all group">
                           <BookOpen size={24} className="mb-2 text-purple-400"/> Teacher
                        </button>
                     </div>
                  </div>
                )}
              </div>
            )}
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
            >
              {isLogin ? "New User? Create Account" : "Existing User? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
