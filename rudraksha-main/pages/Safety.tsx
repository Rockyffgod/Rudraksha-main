
import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Radio, AlertTriangle, CheckCircle, MapPin, Eye, 
  Activity, ClipboardCheck, History, Search, Zap, OctagonX, 
  Check as CheckIcon, Image as ImageIcon, X, Sparkles, Coins, Trash2, Clock, QrCode, Download, Share2, ShieldCheck, Printer, Camera, Upload, ArrowUpRight, Loader2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';
import { matchEmergencyReports } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { FTLStorageService } from '../services/ftl/storage';
import { FTLMission, Sighting, UserProfile } from '../types';
import confetti from 'canvas-confetti';

const FTLLogo = () => (
  <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
    <div className="absolute inset-0 bg-red-600/10 rounded-full animate-ping [animation-duration:3s]"></div>
    <div className="absolute inset-4 border-2 border-red-500/20 rounded-full animate-pulse"></div>
    <div className="absolute inset-8 border-4 border-red-500/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
    <div className="relative w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-red-600 to-red-900 rounded-full shadow-[0_0_50px_rgba(220,38,38,0.5)] border-4 border-white/20 flex flex-col items-center justify-center transform transition-transform hover:scale-110 duration-500 cursor-pointer group">
      <span className="text-4xl md:text-5xl font-black tracking-tighter text-white group-hover:tracking-widest transition-all duration-500">FTL</span>
      <div className="flex gap-1 mt-1">
        <div className="w-1 h-1 bg-red-200 rounded-full animate-bounce"></div>
        <div className="w-1 h-1 bg-red-200 rounded-full animate-bounce [animation-delay:0.2s]"></div>
        <div className="w-1 h-1 bg-red-200 rounded-full animate-bounce [animation-delay:0.4s]"></div>
      </div>
    </div>
  </div>
);

const QRGenerator = ({ onClose }: { onClose: () => void }) => {
    const [qrData, setQrData] = useState({ name: '', contact: '', info: '', photo: '' });
    const [step, setStep] = useState(1); 
    const [isGenerating, setIsGenerating] = useState(false);

    // Using a public API for QR generation to ensure we have a valid image source for canvas
    const getQRUrl = (data: string) => `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}&bgcolor=ffffff`;

    const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setQrData(p => ({ ...p, photo: ev.target?.result as string }));
            reader.readAsDataURL(file);
        }
    };

    const generateSmartTag = async () => {
        setIsGenerating(true);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Card Dimensions
        const width = 600;
        const height = 900;
        canvas.width = width;
        canvas.height = height;

        // 1. Background
        const grd = ctx.createLinearGradient(0, 0, 0, height);
        grd.addColorStop(0, '#ffffff');
        grd.addColorStop(1, '#f8fafc');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);

        // 2. Header Color (Red)
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 0, width, 20);

        // 3. User Photo (Circular)
        if (qrData.photo) {
            const img = new Image();
            img.src = qrData.photo;
            await new Promise((resolve) => { img.onload = resolve; });
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(width/2, 200, 120, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, width/2 - 120, 80, 240, 240);
            
            // Border
            ctx.lineWidth = 10;
            ctx.strokeStyle = '#dc2626';
            ctx.stroke();
            ctx.restore();
        }

        // 4. Text Info
        ctx.textAlign = 'center';
        
        // Name
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 50px Inter, sans-serif';
        ctx.fillText(qrData.name.toUpperCase(), width/2, 380);

        // Label
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillText('EMERGENCY RESCUE TAG', width/2, 420);

        // Info Box
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.roundRect(50, 450, 500, 100, 20);
        ctx.fill();
        
        ctx.fillStyle = '#475569';
        ctx.font = 'italic 24px Inter, sans-serif';
        // Simple text wrapping for info (first line only for simplicity in this demo)
        const infoText = qrData.info.length > 35 ? qrData.info.substring(0, 35) + '...' : qrData.info;
        ctx.fillText(`"${infoText}"`, width/2, 510);

        // 5. QR Code
        const qrJson = JSON.stringify({
            n: qrData.name,
            c: qrData.contact,
            i: qrData.info,
            app: 'Rudraksha'
        });
        const qrImg = new Image();
        qrImg.crossOrigin = "Anonymous"; // Crucial for external images on canvas
        qrImg.src = getQRUrl(qrJson);
        await new Promise((resolve, reject) => { 
            qrImg.onload = resolve; 
            qrImg.onerror = resolve; // Continue even if QR fails (though it shouldn't)
        });

        ctx.drawImage(qrImg, width/2 - 100, 600, 200, 200);

        // 6. Footer
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 30px Inter, sans-serif';
        ctx.fillText(qrData.contact, width/2, 850);
        
        // Convert to Download
        const link = document.createElement('a');
        link.download = `Rudraksha-Tag-${qrData.name}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        setIsGenerating(false);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden border-4 border-gray-100 dark:border-gray-800 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                <header className="p-8 border-b dark:border-gray-800 flex justify-between items-center shrink-0 bg-gray-50 dark:bg-gray-950">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-600 text-white rounded-2xl shadow-xl"><QrCode size={28}/></div>
                        <div>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">Rescue Tag Studio</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol: QR Identification Generator</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"><X size={32}/></button>
                </header>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                    {step === 1 ? (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="bg-gray-50 dark:bg-gray-900 border-4 border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem] h-56 flex flex-col items-center justify-center relative group overflow-hidden transition-all hover:border-red-500/50">
                                {qrData.photo ? (
                                    <>
                                        <img src={qrData.photo} className="w-full h-full object-cover" alt="" />
                                        <button onClick={() => setQrData(p => ({...p, photo: ''}))} className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full"><X size={16}/></button>
                                    </>
                                ) : (
                                    <label className="flex flex-col items-center gap-4 cursor-pointer text-gray-400 hover:text-red-500 transition-colors">
                                        <Camera size={48}/>
                                        <span className="font-black uppercase text-xs tracking-widest">Upload Subject Photo</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handlePhoto}/>
                                    </label>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Name / Identity</label>
                                    <input className="w-full h-14 px-6 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-red-500 rounded-2xl outline-none font-bold dark:text-white" value={qrData.name} onChange={e => setQrData(p => ({...p, name: e.target.value}))} placeholder="e.g. Bruno (Dog)" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Secure Contact</label>
                                    <input className="w-full h-14 px-6 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-red-500 rounded-2xl outline-none font-bold dark:text-white" value={qrData.contact} onChange={e => setQrData(p => ({...p, contact: e.target.value}))} placeholder="Phone or Username" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-2">Critical Info / Medical</label>
                                <textarea className="w-full h-32 p-6 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-red-500 rounded-2xl outline-none font-medium dark:text-white resize-none" value={qrData.info} onChange={e => setQrData(p => ({...p, info: e.target.value}))} placeholder="Allergies, rewards, or specific behavioral traits..." />
                            </div>

                            <Button onClick={() => setStep(2)} disabled={!qrData.name || !qrData.photo} className="w-full h-18 bg-red-600 hover:bg-red-700 text-lg font-black uppercase italic shadow-2xl shadow-red-600/30">
                                Generate Digital Tag
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-10 animate-in zoom-in duration-500">
                             <div className="w-full max-w-sm bg-white dark:bg-black rounded-[3rem] border-[12px] border-red-600 p-8 shadow-[0_30px_90px_rgba(220,38,38,0.4)] flex flex-col items-center relative group overflow-hidden" id="tag-preview">
                                <div className="absolute top-0 right-0 p-6 opacity-5"><QrCode size={120}/></div>
                                <div className="w-32 h-32 rounded-3xl overflow-hidden mb-6 shadow-xl border-4 border-gray-100 dark:border-gray-800 shrink-0">
                                    <img src={qrData.photo} className="w-full h-full object-cover" alt="" />
                                </div>
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900 dark:text-white leading-none text-center mb-2">{qrData.name}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-8 bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-full">Secure Rescue ID</p>
                                
                                <div className="w-full space-y-4 border-y border-gray-100 dark:border-gray-700 py-6 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500"><Activity size={16}/></div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 line-clamp-2 italic">"{qrData.info}"</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500"><ShieldCheck size={16}/></div>
                                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">{qrData.contact}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-3xl border-2 border-gray-100 dark:border-gray-700 flex flex-col items-center gap-2">
                                    <img 
                                        src={getQRUrl(JSON.stringify({n: qrData.name, c: qrData.contact, i: qrData.info}))} 
                                        alt="QR" 
                                        className="w-24 h-24 mix-blend-multiply dark:mix-blend-normal"
                                    />
                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.4em]">SCAN VIA RUDRAKSHA</span>
                                </div>
                             </div>

                             <div className="flex gap-4 w-full">
                                <Button onClick={generateSmartTag} disabled={isGenerating} className="flex-1 h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2">
                                    {isGenerating ? <Loader2 className="animate-spin"/> : <Download size={18}/>}
                                    Download Tag
                                </Button>
                             </div>
                             <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors">Modify Identification</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Safety: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'feed' | 'my-logs' | 'vault'>('feed');
  const [showFTLModal, setShowFTLModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [missions, setMissions] = useState<FTLMission[]>([]);
  const [selectedMission, setSelectedMission] = useState<FTLMission | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [reportMode, setReportMode] = useState<'lost' | 'found' | 'sighting'>('lost');
  const [reportType, setReportType] = useState<'pet' | 'person' | 'object' | 'ai' | null>(null);
  const [targetMissionId, setTargetMissionId] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', location: '', contact: '' });
  
  const [bountyAmount, setBountyAmount] = useState<string>(''); 
  const [potentialMatch, setPotentialMatch] = useState<{ mission: FTLMission, reasoning: string } | null>(null);
  const [isCheckingMatch, setIsCheckingMatch] = useState(false);

  useEffect(() => { 
      loadData(); 
      const handleUpdate = () => loadData();
      
      const handleDraft = (e: any) => {
          const { status, category, description, location } = e.detail;
          setReportMode(status);
          setReportType(category); 
          setFormData(prev => ({ 
              ...prev, 
              description: description || '',
              location: location || '',
              name: description ? description.split(' ').slice(0, 2).join(' ') : '' 
          }));
          setShowFTLModal(true);
      };

      window.addEventListener('rudraksha-ftl-update', handleUpdate);
      window.addEventListener('rudraksha-ftl-draft', handleDraft);
      
      return () => {
          window.removeEventListener('rudraksha-ftl-update', handleUpdate);
          window.removeEventListener('rudraksha-ftl-draft', handleDraft);
      };
  }, []);

  const loadData = async () => {
    const m = await FTLStorageService.getMissions();
    const p = await StorageService.getProfile();
    setMissions(m.sort((a, b) => b.timestamp - a.timestamp));
    setProfile(p);
  };

  const handleFTLClick = (mode: 'lost' | 'found' | 'sighting' = 'lost', missionId?: string) => {
    setReportMode(mode);
    setReportType(null);
    setTargetMissionId(missionId || null);
    setIsSubmitted(false);
    setIsBroadcasting(false);
    setSelectedPhoto(null);
    setPotentialMatch(null);
    setFormData({ name: '', description: '', location: '', contact: '' });
    setBountyAmount('');
    setShowFTLModal(true);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const numericBounty = parseInt(bountyAmount) || 0;
    if (reportMode === 'lost' && numericBounty > profile.points) {
        alert("Insufficient Karma points for this reward.");
        return;
    }

    setIsBroadcasting(true);
    
    setTimeout(async () => {
      if (reportMode === 'found') {
        setIsCheckingMatch(true);
        const matchResult = await matchEmergencyReports(formData.description, missions);
        if (matchResult.matchId && matchResult.confidence > 60) {
            const matched = missions.find(m => m.id === matchResult.matchId);
            if (matched) setPotentialMatch({ mission: matched, reasoning: matchResult.reasoning });
        }
        setIsCheckingMatch(false);
      }

      if (reportMode === 'sighting' && targetMissionId) {
        const sighting: Sighting = { 
          id: 's' + Date.now(),
          userId: profile.id,
          userName: profile.name,
          time: 'Just now', 
          location: formData.location, 
          info: formData.description, 
          image: selectedPhoto || undefined,
          timestamp: Date.now() 
        };
        await FTLStorageService.addSighting(targetMissionId, sighting);
        await StorageService.addPoints(50, 250, 'reward', `Valid FTL Sighting Logged`); 
        confetti({ particleCount: 80, origin: { y: 0.7 }, colors: ['#3b82f6'] });
      } else {
        const newMission: FTLMission = {
          id: 'm' + Date.now(),
          type: reportType === 'ai' ? 'person' : (reportType || 'pet'),
          title: `${reportMode === 'lost' ? 'Lost' : 'Found'}: ${formData.name}`,
          location: formData.location,
          time: 'Just now',
          status: 'active',
          bounty: reportMode === 'lost' ? numericBounty : 0,
          description: formData.description,
          sightings: [],
          image: selectedPhoto || 'https://images.unsplash.com/photo-1541339907198-e08756eaa539?q=80&w=400&auto=format&fit=crop',
          userId: profile.id,
          isLost: reportMode === 'lost',
          timestamp: Date.now()
        };
        
        await FTLStorageService.saveMission(newMission);
        if (newMission.bounty > 0) {
            await StorageService.updateProfile({ points: profile.points - newMission.bounty });
        }

        if (reportMode === 'found') {
          await StorageService.addPoints(100, 500, 'reward', `Reported Found Item: ${formData.name}`);
          confetti({ particleCount: 150, origin: { y: 0.7 }, colors: ['#10b981', '#facc15'] });
        }
      }
      await loadData();
      setIsBroadcasting(false);
      setIsSubmitted(true);
    }, 2000);
  };

  const handleVerifySighting = async (missionId: string, sightingId: string, verified: boolean) => {
    if (verified && selectedMission?.bounty && selectedMission.bounty > 0) {
        if (confirm(`Confirm ${selectedMission.bounty} Karma Bounty to this finder? Action is irreversible.`)) {
            const sighterId = selectedMission.sightings.find(s => s.id === sightingId)?.userId;
            await FTLStorageService.verifySighting(missionId, sightingId, true);
            await FTLStorageService.resolveMission(missionId);
            if (sighterId) {
                await StorageService.rewardUser(sighterId, selectedMission.bounty);
            }
            
            confetti({ particleCount: 150, spread: 100, colors: ['#fbbf24'] });
            window.dispatchEvent(new Event('rudraksha-profile-update'));
            alert("Reward Issued! Neural Ledger Updated.");
            setSelectedMission(null);
            await loadData();
            return;
        }
    } else {
        await FTLStorageService.verifySighting(missionId, sightingId, verified);
    }
    
    await loadData();
    if (verified) {
      confetti({ particleCount: 40, colors: ['#10b981'] });
      setTimeout(async () => {
          const reloaded = await FTLStorageService.getMissions();
          const fresh = reloaded.find(m => m.id === missionId);
          if (fresh) setSelectedMission({ ...fresh });
      }, 200);
    }
  };

  const handleResolveMission = async (missionId: string) => {
    if (confirm("Confirm recovery? This mission will be marked as resolved.")) {
      await FTLStorageService.resolveMission(missionId);
      confetti({ particleCount: 150, origin: { y: 0.6 }, colors: ['#fbbf24', '#ef4444'] });
      setSelectedMission(null);
      await loadData();
    }
  };

  const handleDeleteMission = async (mission: FTLMission) => {
      if (confirm("Delete this listing? If you set a bounty, it will be refunded.")) {
          await FTLStorageService.deleteMission(mission.id);
          setSelectedMission(null);
          await loadData();
      }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 pb-20 font-sans">
      <section className="relative rounded-[3rem] overflow-hidden bg-black text-white shadow-2xl border-4 border-gray-900 group">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-indigo-600/10"></div>
        <div className="relative z-10 p-8 md:p-14 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-red-400 animate-pulse">
              <Radio size={14} className="animate-bounce" /> Emergency Network Active
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none italic">
              FIND THE <br/> <span className="text-red-600">LOST</span>
            </h1>
            <p className="max-w-xl text-gray-400 text-lg font-medium leading-relaxed">
              {t("Rudraksha's specialized neighborhood response protocol. Support your community, report sightings, and earn Karma rewards for every verified recovery.", "Rudraksha's specialized neighborhood response protocol. Support your community, report sightings, and earn Karma rewards for every verified recovery.")}
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <Button onClick={() => handleFTLClick('lost')} className="bg-red-600 hover:bg-red-700 h-16 px-10 rounded-2xl text-xl font-black shadow-2xl shadow-red-600/40">
                <Search size={24} className="mr-2"/> {t("Report Loss", "Report Loss")}
              </Button>
              <button onClick={() => setShowQRModal(true)} className="h-16 px-10 rounded-2xl border-2 border-indigo-600/30 bg-indigo-50/5 hover:bg-indigo-500/10 text-indigo-400 font-black text-lg transition-all flex items-center gap-3 group">
                <QrCode size={22} className="group-hover:rotate-90 transition-transform" />
                {t("Generate Rescue Tag", "Generate Rescue Tag")}
              </button>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-4" onClick={() => handleFTLClick('sighting')}>
            <FTLLogo />
            <p className="text-xs font-black uppercase tracking-[0.4em] text-red-500 animate-pulse">Tap Radar to Log Sighting</p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap justify-center md:justify-start gap-2 p-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-gray-700 w-fit">
        {[
          { id: 'feed', label: 'Active Feed', icon: Activity, color: 'text-red-500' },
          { id: 'my-logs', label: 'My Rescue Logs', icon: ClipboardCheck, color: 'text-indigo-500' },
          { id: 'vault', label: 'Community Vault', icon: History, color: 'text-amber-500' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-3 rounded-full text-sm font-black transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 shadow-xl text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <tab.icon size={18} className={tab.color} /> {t(tab.label, tab.label)}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-4 duration-500">
             {missions.filter(m => m.status === 'active').map(mission => (
               <div key={mission.id} className="group bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border-2 border-gray-50 dark:border-gray-700 hover:border-red-500 shadow-sm hover:shadow-2xl transition-all flex flex-col gap-6 relative overflow-hidden">
                  <div onClick={() => setSelectedMission(mission)} className="w-full h-64 rounded-[2rem] overflow-hidden shrink-0 shadow-lg relative cursor-pointer">
                    <img src={mission.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={mission.title}/>
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">Live Mission</div>
                    {mission.bounty > 0 && (
                        <div className="absolute bottom-4 right-4 bg-yellow-400 text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-xl flex items-center gap-2">
                            <Coins size={14}/> Bounty: {mission.bounty}
                        </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${mission.type === 'pet' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>{mission.type}</span>
                          <span className="text-xs text-gray-400 font-bold flex items-center gap-1"><Clock size={12}/> {mission.time}</span>
                        </div>
                        <button onClick={() => handleFTLClick('sighting', mission.id)} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 px-4">
                           <Eye size={18} /> <span className="text-xs font-black uppercase">Log Sighting</span>
                        </button>
                     </div>
                     <h3 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white leading-none cursor-pointer" onClick={() => setSelectedMission(mission)}>{mission.title}</h3>
                     <p className="text-gray-500 dark:text-gray-400 line-clamp-2 text-lg leading-relaxed">{mission.description}</p>
                  </div>
               </div>
             ))}
          </div>
        )}
        
        {activeTab === 'my-logs' && (
           <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
               <div className="p-10 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-950/30">
                   <h2 className="text-xl font-black uppercase tracking-widest italic">My Broadcast History</h2>
                   <span className="text-xs font-bold text-gray-400">{missions.filter(m => m.userId === profile?.id).length} Entries</span>
               </div>
               <div className="divide-y divide-gray-100 dark:divide-gray-700">
                   {missions.filter(m => m.userId === profile?.id).length === 0 ? (
                       <div className="p-20 text-center text-gray-400">
                           <ClipboardCheck size={48} className="mx-auto mb-4 opacity-20"/>
                           <p className="font-bold uppercase">No loss reports broadcasted by you.</p>
                       </div>
                   ) : (
                       missions.filter(m => m.userId === profile?.id).map(mission => (
                           <div key={mission.id} className="p-8 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer" onClick={() => setSelectedMission(mission)}>
                               <div className="flex items-center gap-6">
                                   <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white dark:border-gray-700 shadow-md">
                                       <img src={mission.image} className="w-full h-full object-cover" />
                                   </div>
                                   <div>
                                       <h3 className="font-black uppercase italic tracking-tighter text-lg">{mission.title}</h3>
                                       <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{mission.status} • {mission.sightings.length} Sightings</p>
                                   </div>
                               </div>
                               <button className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all"><ArrowUpRight size={20}/></button>
                           </div>
                       ))
                   )}
               </div>
           </div>
        )}
      </div>

      {selectedMission && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedMission(null)}></div>
           <div className="relative w-full max-w-4xl bg-white dark:bg-gray-950 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col md:flex-row max-h-[90vh]">
              <div className="md:w-1/2 relative h-64 md:h-auto">
                 <img src={selectedMission.image} className="w-full h-full object-cover" alt="" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                 <div className="absolute bottom-8 left-8 right-8 text-white">
                    {selectedMission.bounty > 0 && (
                        <div className="inline-flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-xl font-black uppercase text-xs tracking-widest mb-4 shadow-lg animate-pulse">
                            <Coins size={16}/> Reward: {selectedMission.bounty} Karma
                        </div>
                    )}
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter drop-shadow-lg">{selectedMission.title}</h2>
                    <p className="text-lg opacity-80 mt-2 flex items-center gap-2"><MapPin size={18}/> {selectedMission.location}</p>
                 </div>
              </div>
              <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto flex flex-col">
                 <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                       <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-2xl text-red-600"><AlertTriangle size={24}/></div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Mission Status</p>
                          <p className="text-xl font-black uppercase tracking-tighter text-red-600 italic">{selectedMission.status}</p>
                       </div>
                    </div>
                    <button onClick={() => setSelectedMission(null)} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={24}/></button>
                 </div>
                 
                 <div className="flex-1 space-y-8">
                    <section>
                       <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Detailed Protocol</h3>
                       <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium italic">"{selectedMission.description}"</p>
                    </section>

                    <section>
                       <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Community Sightings</h3>
                          <div className="flex gap-2">
                              <button onClick={() => handleFTLClick('sighting', selectedMission.id)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition-colors">
                                + Add Info
                              </button>
                              <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-[10px] font-black flex items-center">{selectedMission.sightings.length}</span>
                          </div>
                       </div>
                       <div className="space-y-4">
                          {selectedMission.sightings.map(s => (
                             <div key={s.id} className={`p-5 rounded-2xl border transition-all ${(s as any).isVerified ? 'bg-green-50 dark:bg-green-900/10 border-green-200 shadow-lg' : 'bg-gray-50 dark:bg-gray-900 border-gray-100'}`}>
                                <div className="flex justify-between items-start mb-2">
                                   <div>
                                       <p className="text-sm font-black dark:text-white flex items-center gap-2">
                                         <MapPin size={14} className="text-blue-500"/> {s.location}
                                       </p>
                                       <p className="text-[10px] text-gray-400 font-bold mt-0.5">By {s.userName || 'Anonymous'}</p>
                                   </div>
                                   {(s as any).isVerified && <span className="flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase"><CheckIcon size={10}/> Verified</span>}
                                </div>
                                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{s.info}</p>
                                <div className="flex justify-between items-center text-[9px] font-bold text-gray-400">
                                   <span>{s.time}</span>
                                   {selectedMission.userId === profile?.id && !(s as any).isVerified && (
                                      <div className="flex gap-3">
                                         <button onClick={() => handleVerifySighting(selectedMission.id, s.id, true)} className="flex items-center gap-1 text-green-500 hover:text-green-600 font-black uppercase tracking-widest bg-green-50 dark:bg-green-950 p-2 rounded-xl border border-green-200 transition-all active:scale-95">
                                           {selectedMission.bounty > 0 ? "Confirm & Reward" : "Confirm"} <CheckCircle size={12}/>
                                         </button>
                                      </div>
                                   )}
                                </div>
                             </div>
                          ))}
                       </div>
                    </section>
                 </div>

                 {selectedMission.userId === profile?.id && (
                    <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 flex gap-4">
                        {selectedMission.status === 'active' && (
                            <Button onClick={() => handleResolveMission(selectedMission.id)} className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-lg font-black uppercase italic shadow-2xl shadow-green-600/30">
                                Mark Resolved
                            </Button>
                        )}
                        <Button onClick={() => handleDeleteMission(selectedMission)} variant="ghost" className="h-14 w-14 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600">
                            <Trash2 size={24}/>
                        </Button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {showFTLModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowFTLModal(false)}></div>
          <div className="relative w-full max-w-3xl bg-[#0a0a0a] text-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-800 animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
            <header className="p-8 md:p-10 border-b border-gray-800 flex justify-between items-center bg-[#111]">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl ${reportMode === 'lost' ? 'bg-red-600/20 text-red-500 border border-red-500/30' : reportMode === 'found' ? 'bg-green-600/20 text-green-500 border border-green-500/30' : 'bg-blue-600/20 text-blue-500 border border-blue-500/30'}`}>
                    {reportMode === 'lost' ? <AlertTriangle size={32} /> : reportMode === 'found' ? <CheckCircle size={32}/> : <Eye size={32}/>}
                </div>
                <div>
                   <h2 className="text-3xl font-black uppercase italic tracking-tighter">MISSION COMMAND</h2>
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest opacity-70">Protocol: {reportMode} entry</p>
                </div>
              </div>
              <button onClick={() => setShowFTLModal(false)} className="p-3 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-full transition-all active:scale-95"><X size={32}/></button>
            </header>
            <div className="flex-1 overflow-y-auto p-8 md:p-14 custom-scrollbar">
               {!reportType && reportMode !== 'sighting' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['person', 'pet', 'object', 'ai'].map(type => (
                      <button key={type} onClick={() => setReportType(type as any)} className="bg-[#1a1a1a] p-10 rounded-[2.5rem] border-2 border-gray-800 hover:border-blue-600 transition-all text-left">
                        <span className="text-3xl font-black uppercase italic mb-2 block">{type}</span>
                        <p className="text-sm text-gray-500">Report {reportMode} {type}.</p>
                      </button>
                    ))}
                 </div>
               ) : isBroadcasting ? (
                 <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-40 h-40 border-8 border-red-600 border-t-transparent rounded-full animate-spin mb-10"></div>
                    <h3 className="text-5xl font-black uppercase tracking-tighter italic">BROADCASTING...</h3>
                 </div>
               ) : isCheckingMatch ? (
                 <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-32 h-32 bg-blue-500/10 rounded-full flex items-center justify-center mb-10 animate-pulse">
                        <Sparkles size={64} className="text-blue-500"/>
                    </div>
                    <h3 className="text-4xl font-black uppercase italic text-blue-500">AI GUARDIAN SCANNING...</h3>
                    <p className="text-gray-500 mt-4">Comparing your description with existing lost reports.</p>
                 </div>
               ) : isSubmitted ? (
                 <div className="text-center py-20">
                    {potentialMatch ? (
                        <div className="space-y-8 animate-in zoom-in duration-500">
                             <div className="p-8 bg-blue-500/10 border-4 border-blue-500 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={100}/></div>
                                <h3 className="text-4xl font-black uppercase italic text-blue-500 mb-6 flex items-center justify-center gap-3">
                                   <Zap className="animate-bounce" /> Match Detected!
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                   <div className="p-5 bg-white/5 rounded-2xl">
                                      <p className="text-[10px] uppercase font-black text-gray-500 mb-2">Your Found Item</p>
                                      <p className="text-lg font-bold leading-tight">"{formData.description}"</p>
                                   </div>
                                   <div className="p-5 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                                      <p className="text-[10px] uppercase font-black text-blue-300 mb-2">Matched Lost Report</p>
                                      <p className="text-lg font-black text-white italic">"{potentialMatch.mission.title}"</p>
                                      <p className="text-sm text-gray-300 mt-2 line-clamp-2">"{potentialMatch.mission.description}"</p>
                                   </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/10">
                                   <p className="text-sm font-bold text-blue-300 italic mb-6">"AI Logic: {potentialMatch.reasoning}"</p>
                                   <Button className="w-full h-16 text-xl bg-blue-600" onClick={() => setSelectedMission(potentialMatch.mission)}>Contact Owner Immediately</Button>
                                </div>
                             </div>
                        </div>
                    ) : (
                        <div className="animate-in zoom-in duration-300">
                           <CheckCircle size={80} className="text-green-500 mx-auto mb-10" />
                           <h3 className="text-6xl font-black uppercase italic mb-4">LOGGED</h3>
                           <Button onClick={() => setShowFTLModal(false)} className="w-full h-20 text-2xl font-black">RETURN</Button>
                        </div>
                    )}
                 </div>
               ) : (
                 <form onSubmit={handleReportSubmit} className="space-y-8">
                   <div className="bg-[#1a1a1a] border-4 border-dashed border-gray-800 rounded-[2.5rem] p-8 text-center group hover:border-red-600/40 transition-colors mb-4">
                      {!selectedPhoto ? (
                        <label className="flex flex-col items-center justify-center cursor-pointer">
                          <ImageIcon size={48} className="text-gray-500 mb-4" />
                          <h3 className="font-black text-xl mb-1 uppercase italic">Attach Photo</h3>
                          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                        </label>
                      ) : (
                        <div className="relative">
                           <img src={selectedPhoto} className="w-full h-48 object-cover rounded-2xl" />
                           <button type="button" onClick={() => setSelectedPhoto(null)} className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full"><X size={16}/></button>
                        </div>
                      )}
                   </div>
                   {reportMode === 'sighting' ? (
                       <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-2xl text-center mb-4">
                           <p className="text-sm font-bold text-blue-400 uppercase tracking-wide">Logging Sighting for Mission</p>
                       </div>
                   ) : (
                       <input required className="w-full bg-[#111] border-2 border-gray-800 p-5 rounded-[1.5rem] focus:border-red-600 outline-none font-bold text-lg text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Title / Subject Name" />
                   )}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input required className="w-full bg-[#111] border-2 border-gray-800 p-5 rounded-[1.5rem] focus:border-red-600 outline-none font-bold text-lg text-white" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Location (e.g. Biratnagar Center)" />
                        <input className="w-full bg-[#111] border-2 border-gray-800 p-5 rounded-[1.5rem] focus:border-red-600 outline-none font-bold text-lg text-white" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="Contact Info (Optional)" />
                   </div>
                   
                   {reportMode === 'lost' && (
                       <div className="bg-[#111] border-2 border-gray-800 p-6 rounded-[2rem] space-y-3">
                           <div className="flex justify-between items-center">
                               <label className="font-black uppercase tracking-widest text-xs text-yellow-500 flex items-center gap-2"><Coins size={14}/> Bounty Reward</label>
                               <span className="text-xs font-bold text-gray-500 uppercase">Avail: {profile?.points || 0} pts</span>
                           </div>
                           <input 
                               type="number" 
                               min="0" 
                               max={profile?.points || 0} 
                               step="1"
                               value={bountyAmount}
                               onChange={(e) => setBountyAmount(e.target.value)}
                               className="w-full bg-gray-900 border border-gray-700 p-4 rounded-xl text-yellow-400 font-mono font-bold text-2xl focus:border-yellow-500 outline-none placeholder-gray-700"
                               placeholder="0"
                           />
                           <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">Bounty is deducted immediately and held in escrow until verification.</p>
                       </div>
                   )}

                   <textarea required rows={5} className="w-full bg-[#111] border-2 border-gray-800 p-6 rounded-[2.5rem] focus:border-red-600 outline-none resize-none font-medium text-lg text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe details (color, size, unique marks)..."></textarea>
                   <Button type="submit" className="w-full h-20 text-2xl bg-red-600">INITIATE BROADCAST</Button>
                 </form>
               )}
            </div>
          </div>
        </div>
      )}

      {showQRModal && <QRGenerator onClose={() => setShowQRModal(false)} />}
    </div>
  );
};

export default Safety;
