
import React, { useState, useEffect, useMemo } from 'react';
import { Tent, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Info, Languages, Sparkles, Clock, MapPin, CalendarDays, ExternalLink } from 'lucide-react';
import { CalendarService, NEPALI_MONTHS_DATA_2082 } from '../services/calendarService';
import { explainHoliday } from '../services/geminiService';
import { NepaliDate } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';

// Mock data for holidays to simulate functional next festival logic
// Now aligned with correct 2082 dates from service
const HOLIDAYS_2082: Record<string, {en: string, ne: string}> = {
  "1-1": {en: "New Year 2082", ne: "नयाँ वर्ष २०८२"},
  "1-11": {en: "Loktantra Diwas", ne: "लोकतन्त्र दिवस"},
  "1-15": {en: "Matatirtha Aunsi", ne: "मातातीर्थ औंसी"},
  "1-25": {en: "Buddha Jayanti", ne: "बुद्ध जयन्ती"},
  "3-15": {en: "Dhan Diwas", ne: "धान दिवस"},
  "6-3": {en: "Constitution Day", ne: "संविधान दिवस"},
  "7-7": {en: "Vijaya Dashami", ne: "विजया दशमी"},
  "7-30": {en: "Laxmi Puja", ne: "लक्ष्मी पूजा"},
  "9-10": {en: "Christmas Day", ne: "क्रिसमस डे"},
  "10-1": {en: "Maghe Sankranti", ne: "माघे संक्रान्ति"},
  "11-15": {en: "Maha Shivaratri", ne: "महा शिवरात्री"},
  "12-13": {en: "Holi", ne: "फागु पूर्णिमा"}
};

const Culture: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  
  // Real-time Date Tracking
  const today = CalendarService.getCurrentNepaliDate();
  
  // Calendar State
  const [currentYear, setCurrentYear] = useState(2082); 
  const [currentMonth, setCurrentMonth] = useState(today.month); 
  const [dates, setDates] = useState<NepaliDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [monthHolidays, setMonthHolidays] = useState<NepaliDate[]>([]);
  
  // Holiday Info State
  const [selectedHoliday, setSelectedHoliday] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<{en: string, ne: string} | null>(null);
  const [explaining, setExplaining] = useState(false);

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true);
      const data = await CalendarService.getDatesForMonth(currentYear, currentMonth);
      setDates(data);
      
      // Filter holidays for the side list
      const holidays = data.filter(d => d.events.length > 0);
      setMonthHolidays(holidays);
      
      setLoading(false);
    };
    fetchCalendar();
  }, [currentYear, currentMonth]);

  const changeMonth = (delta: number) => {
    let nextMonth = currentMonth + delta;
    if (nextMonth > 12) {
        nextMonth = 1; 
    } else if (nextMonth < 1) {
        nextMonth = 12;
    }
    setCurrentMonth(nextMonth);
  };

  const jumpToToday = () => {
      setCurrentMonth(today.month); 
  };

  const handleHolidayClick = async (holidayName: string) => {
    setSelectedHoliday(holidayName);
    setExplanation(null);
    setExplaining(true);

    const cached = await CalendarService.getHolidayExplanation(holidayName);
    if (cached) {
      setExplanation(cached);
    } else {
      const aiResult = await explainHoliday(holidayName);
      setExplanation(aiResult);
      await CalendarService.saveHolidayExplanation(holidayName, aiResult.en, aiResult.ne);
    }
    setExplaining(false);
  };

  const currentMonthNameEn = dates[0]?.bs_month_str_en || 'Loading...';
  const currentMonthNameNp = dates[0]?.bs_month_str_np || '';

  // Helper to localize numeric strings
  const convertToNepaliDigits = (value: number | string): string => {
    const str = value.toString();
    const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return str.replace(/[0-9]/g, (match) => devanagariDigits[parseInt(match)]);
  };

  const translateWeekday = (day: string): string => {
    const map: Record<string, string> = {
      'Sun': 'आइत', 'Mon': 'सोम', 'Tue': 'मंगल', 'Wed': 'बुध', 'Thu': 'बिही', 'Fri': 'शुक्र', 'Sat': 'शनि'
    };
    return map[day] || day;
  };

  // Functional Next Festival Calculation
  const nextFestival = useMemo(() => {
      const currentSimulatedMonth = today.month;
      const currentSimulatedDay = today.day;
      
      let nearestHoliday = null;
      let minDiff = Infinity;

      Object.entries(HOLIDAYS_2082).forEach(([key, val]) => {
          const [m, d] = key.split('-').map(Number);
          
          // Calculate approximate days distance from "today"
          let diff = (m - currentSimulatedMonth) * 30 + (d - currentSimulatedDay);
          
          // Handle wrap around year
          if (diff < 0) diff += 365;

          if (diff >= 0 && diff < minDiff) {
              minDiff = diff;
              nearestHoliday = {
                  nameEn: val.en,
                  nameNe: val.ne,
                  month: m,
                  day: d,
                  daysLeft: diff
              };
          }
      });
      return nearestHoliday;
  }, [today]);

  return (
    <div className="space-y-8 pb-24 font-sans animate-in fade-in duration-700 bg-slate-950 text-slate-100 min-h-screen p-4 md:p-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3 italic tracking-tighter uppercase">
            <div className="p-3 bg-red-600 rounded-2xl text-white shadow-xl shadow-red-600/20">
                <Tent size={32} />
            </div>
            {t("Culture Hub", "Culture Hub")}
          </h1>
          <p className="text-slate-400 font-medium text-lg mt-2 ml-1">
            {t("Celebrate our rich heritage, festivals, and traditions.", "Celebrate our rich heritage, festivals, and traditions.")}
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-800">
            <button 
                onClick={jumpToToday}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
            >
                {t("Today", "Today")}
            </button>
            <div className="w-px h-6 bg-slate-800"></div>
            <button 
                onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-900/40 transition-colors"
            >
                <Languages size={14} />
                {language === 'en' ? 'NE' : 'EN'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* MAIN CALENDAR */}
            <div className="xl:col-span-2 space-y-6">
                <div className="bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-800 overflow-hidden flex flex-col">
                    {/* Calendar Header */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex justify-between items-center border-b border-slate-800">
                        <button onClick={() => changeMonth(-1)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 shadow-sm transition-all active:scale-90 border border-slate-700">
                            <ChevronLeft size={24} />
                        </button>
                        
                        <div className="text-center animate-in zoom-in duration-300" key={currentMonth}>
                            <div className="flex items-baseline justify-center gap-2">
                                <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                                    {language === 'en' ? currentMonthNameEn : currentMonthNameNp}
                                </h2>
                                <span className="text-xl font-bold text-red-500">
                                    {language === 'en' ? currentYear : convertToNepaliDigits(currentYear)}
                                </span>
                            </div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mt-1">
                                {language === 'en' ? `${currentMonthNameNp} • Nepal Sambat 1146` : `${currentMonthNameEn} • Nepal Sambat 1146`}
                            </p>
                        </div>
                        
                        <button onClick={() => changeMonth(1)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 shadow-sm transition-all active:scale-90 border border-slate-700">
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="p-4 md:p-6 flex-1 bg-slate-950/50">
                        {loading ? (
                            <div className="h-96 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="animate-spin text-red-600 w-10 h-10"/>
                                <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Consulting Patro...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 gap-2 md:gap-3">
                                {/* Weekday Headers */}
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="text-center text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest py-3">
                                        {language === 'ne' ? translateWeekday(d) : d}
                                    </div>
                                ))}
                                
                                {/* Days */}
                                {dates.map((date, idx) => {
                                    const holidayEvent = date.events?.find(e => e.isHoliday);
                                    const isToday = date.bs_month === today.month && date.bs_day === today.day;
                                    
                                    // Calculate grid column start for first day
                                    const colStart = idx === 0 ? (date.weekday_str_en === 'Sun' ? 1 : date.weekday_str_en === 'Mon' ? 2 : date.weekday_str_en === 'Tue' ? 3 : date.weekday_str_en === 'Wed' ? 4 : date.weekday_str_en === 'Thu' ? 5 : date.weekday_str_en === 'Fri' ? 6 : 7) : undefined;
                                    
                                    return (
                                        <div 
                                            key={`${date.bs_day}-${idx}`}
                                            style={colStart ? { gridColumnStart: colStart } : {}}
                                            className={`
                                                min-h-[80px] md:min-h-[100px] border rounded-2xl p-2 relative hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between overflow-hidden animate-in zoom-in duration-300 group
                                                ${isToday ? 'ring-2 ring-blue-500 bg-blue-900/10' : ''}
                                                ${date.is_holiday 
                                                    ? 'bg-red-900/10 border-red-900/30' 
                                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'}
                                            `}
                                            onClick={() => holidayEvent && handleHolidayClick(language === 'en' ? holidayEvent.strEn : holidayEvent.strNp)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={`text-lg md:text-2xl font-black ${date.is_holiday ? 'text-red-500' : 'text-slate-200'} ${isToday ? 'text-blue-400' : ''}`}>
                                                    {language === 'ne' ? convertToNepaliDigits(date.bs_day) : date.bs_day}
                                                </span>
                                                <span className="text-[10px] font-mono font-bold text-slate-600 group-hover:text-slate-400 transition-colors">
                                                    {date.ad_day}
                                                </span>
                                            </div>
                                            
                                            {holidayEvent && (
                                                <div className="mt-1">
                                                    <div className="text-[9px] md:text-[10px] font-bold text-red-300 leading-tight line-clamp-2 bg-black/20 rounded-lg px-1.5 py-1 backdrop-blur-sm">
                                                        {language === 'en' ? holidayEvent.strEn : holidayEvent.strNp}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {date.tithi_str_en && (
                                                <div className="hidden group-hover:block absolute bottom-1 right-2 text-[8px] text-slate-500 font-medium">
                                                    {language === 'ne' ? date.tithi_str_np : date.tithi_str_en}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Insights Panel - COMPACTED */}
                <div className="bg-slate-900 rounded-3xl shadow-lg border border-slate-800 overflow-hidden">
                    <div className="bg-indigo-900/30 px-4 py-3 text-white flex justify-between items-center border-b border-indigo-500/20">
                        <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2 text-indigo-300">
                            <Info size={14} /> {t("Holiday Insights", "Holiday Insights")}
                        </h3>
                        {selectedHoliday && (
                            <span className="text-[9px] font-bold bg-white/10 px-2 py-0.5 rounded-full">Guru Ba AI</span>
                        )}
                    </div>
                    <div className="p-6 min-h-[100px] flex items-center justify-center">
                        {!selectedHoliday ? (
                            <div className="flex items-center justify-center text-slate-600 text-center gap-2">
                                <Sparkles size={16} className="opacity-50" />
                                <p className="font-medium text-xs">{t("Tap a holiday for details.", "Tap a holiday for details.")}</p>
                            </div>
                        ) : (
                            <div className="w-full animate-in fade-in slide-in-from-bottom-2">
                                <h3 className="text-lg font-black text-white mb-2 uppercase italic">{selectedHoliday}</h3>
                                {explaining ? (
                                    <div className="flex items-center gap-2 text-indigo-500">
                                        <Loader2 className="animate-spin" size={16} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Consulting ancient texts...</p>
                                    </div>
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <p className="leading-relaxed text-slate-300 font-medium text-sm">
                                            "{language === 'en' ? explanation?.en : explanation?.ne}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SIDEBAR WIDGETS */}
            <div className="space-y-6">
                
                {/* Next Festival (Google Calendar Style) */}
                {nextFestival && (
                    <div className="bg-white text-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group border-4 border-white">
                        <div className="absolute top-6 right-6">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/1024px-Google_Calendar_icon_%282020%29.svg.png" className="w-8 h-8 opacity-80" alt="Calendar"/>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 opacity-60">
                                <Clock size={16} className="text-blue-600"/>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Up Next</span>
                            </div>
                            <h3 className="text-3xl font-black tracking-tight mb-6 leading-tight max-w-[80%]">
                                {language === 'en' ? nextFestival.nameEn : nextFestival.nameNe}
                            </h3>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                                    <span className="text-xs font-black text-blue-600 uppercase">
                                        {/* Use NEPALI_MONTHS_DATA for name */}
                                        {NEPALI_MONTHS_DATA_2082[nextFestival.month-1].nameEn.slice(0,3)}
                                    </span>
                                    <span className="text-3xl font-black text-slate-900">{nextFestival.day}</span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">In {nextFestival.daysLeft} Days</span>
                                    <button className="text-[10px] font-black text-blue-600 flex items-center gap-1 mt-1 hover:underline uppercase tracking-wide">
                                        Add to Calendar <ExternalLink size={10}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Updated Title: Month's Holidays */}
                <div className="bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                        <h3 className="font-black text-white uppercase tracking-widest text-xs flex items-center gap-2">
                            <CalendarDays size={16} className="text-orange-500"/> {t("Month's Holidays", "Month's Holidays")}
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {monthHolidays.map((date, i) => (
                            <div 
                                key={i} 
                                className="p-5 flex gap-4 hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                onClick={() => handleHolidayClick(language === 'en' ? date.events[0].strEn : date.events[0].strNp)}
                            >
                                <div className="flex flex-col items-center justify-center bg-red-900/20 w-14 h-14 rounded-2xl text-red-400 shrink-0 border border-red-900/30">
                                    <span className="text-[10px] font-black uppercase">{date.bs_month_str_en.slice(0, 3)}</span>
                                    <span className="text-xl font-black leading-none">{date.bs_day}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm leading-tight group-hover:text-red-400 transition-colors">
                                        {language === 'en' ? date.events[0].strEn : date.events[0].strNp}
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                                        {date.weekday_str_en} • Public Holiday
                                    </p>
                                </div>
                            </div>
                        ))}
                        {monthHolidays.length === 0 && (
                            <div className="p-8 text-center text-slate-600 text-xs font-bold uppercase tracking-widest">
                                No holidays in {currentMonthNameEn}.
                            </div>
                        )}
                    </div>
                </div>

            </div>
      </div>
    </div>
  );
};

export default Culture;
