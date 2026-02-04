
import { NepaliDate } from '../types';

// DATA FOR 2082 BS (2025-2026) extracted from Official Calendar PDF
export const NEPALI_MONTHS_DATA_2082 = [
  { id: 1, nameEn: 'Baishakh', nameNp: 'बैशाख', days: 31, startAdDate: '2025-04-14', startWeekday: 1 }, // Monday
  { id: 2, nameEn: 'Jestha', nameNp: 'जेठ', days: 32, startAdDate: '2025-05-15', startWeekday: 4 }, // Thursday
  { id: 3, nameEn: 'Ashadh', nameNp: 'असार', days: 32, startAdDate: '2025-06-16', startWeekday: 0 }, // Sunday
  { id: 4, nameEn: 'Shrawan', nameNp: 'साउन', days: 32, startAdDate: '2025-07-18', startWeekday: 4 }, // Thursday
  { id: 5, nameEn: 'Bhadra', nameNp: 'भदौ', days: 31, startAdDate: '2025-08-19', startWeekday: 0 }, // Sunday
  { id: 6, nameEn: 'Ashwin', nameNp: 'असोज', days: 30, startAdDate: '2025-09-19', startWeekday: 3 }, // Wednesday
  { id: 7, nameEn: 'Kartik', nameNp: 'कात्तिक', days: 30, startAdDate: '2025-10-19', startWeekday: 5 }, // Friday
  { id: 8, nameEn: 'Mangsir', nameNp: 'मंसिर', days: 29, startAdDate: '2025-11-18', startWeekday: 0 }, // Sunday
  { id: 9, nameEn: 'Poush', nameNp: 'पुष', days: 30, startAdDate: '2025-12-17', startWeekday: 1 }, // Monday
  { id: 10, nameEn: 'Magh', nameNp: 'माघ', days: 29, startAdDate: '2026-01-16', startWeekday: 3 }, // Wednesday
  { id: 11, nameEn: 'Falgun', nameNp: 'फागुन', days: 30, startAdDate: '2026-02-14', startWeekday: 4 }, // Thursday
  { id: 12, nameEn: 'Chaitra', nameNp: 'चैत', days: 30, startAdDate: '2026-03-16', startWeekday: 6 }, // Saturday
];

const HOLIDAYS_2082: Record<string, {en: string, ne: string}> = {
  // Baishakh
  "1-1": {en: "New Year 2082", ne: "नयाँ वर्ष २०८२"},
  "1-11": {en: "Loktantra Diwas", ne: "लोकतन्त्र दिवस"},
  "1-15": {en: "Matatirtha Aunsi (Mother's Day)", ne: "मातातीर्थ औंसी"},
  "1-18": {en: "Labour Day", ne: "विश्व मजदुर दिवस"},
  "1-25": {en: "Buddha Jayanti", ne: "बुद्ध जयन्ती"},
  
  // Jestha
  "2-15": {en: "Republic Day", ne: "गणतन्त्र दिवस"},
  
  // Ashadh
  "3-15": {en: "Dhan Diwas", ne: "धान दिवस"},
  "3-29": {en: "Bhanu Jayanti", ne: "भानु जयन्ती"},
  
  // Shrawan
  "4-15": {en: "Khir Khane Din", ne: "खिर खाने दिन"},
  "4-24": {en: "Janai Purnima", ne: "जनै पूर्णिमा"},
  "4-25": {en: "Gai Jatra", ne: "गाईजात्रा"},
  
  // Bhadra
  "5-7": {en: "Gaura Parva", ne: "गौरा पर्व"},
  "5-10": {en: "Haritalika Teej", ne: "हरितालिका तीज"},
  "5-24": {en: "Indra Jatra", ne: "इन्द्रजात्रा"},
  
  // Ashwin
  "6-3": {en: "Constitution Day", ne: "संविधान दिवस"},
  "6-28": {en: "Ghatasthapana", ne: "घटस्थापना"},
  
  // Kartik (Dashain & Tihar)
  "7-7": {en: "Vijaya Dashami", ne: "विजया दशमी"},
  "7-30": {en: "Laxmi Puja", ne: "लक्ष्मी पूजा"},
  
  // Mangsir
  "8-1": {en: "Mha Puja / Nepal Sambat", ne: "म्हपूजा / नेपाल संवत्"},
  "8-6": {en: "Chhath Parva", ne: "छठ पर्व"},
  
  // Poush
  "9-10": {en: "Christmas Day", ne: "क्रिसमस डे"},
  "9-15": {en: "Tamu Lhosar", ne: "तमु ल्होछार"},
  "9-27": {en: "Prithvi Jayanti", ne: "पृथ्वी जयन्ती"},
  
  // Magh
  "10-1": {en: "Maghe Sankranti", ne: "माघे संक्रान्ति"},
  "10-16": {en: "Martyrs Day", ne: "शहिद दिवस"},
  "10-28": {en: "Sonam Lhosar", ne: "सोनाम ल्होछार"},
  
  // Falgun
  "11-7": {en: "Democracy Day", ne: "प्रजातन्त्र दिवस"},
  "11-15": {en: "Maha Shivaratri", ne: "महा शिवरात्री"}, // Corrected Date
  "11-24": {en: "Women's Day", ne: "नारी दिवस"},
  "11-28": {en: "Gyalpo Lhosar", ne: "ग्याल्पो ल्होछार"},
  
  // Chaitra
  "12-13": {en: "Holi (Hilly)", ne: "फागु पूर्णिमा (पहाड)"},
  "12-14": {en: "Holi (Terai)", ne: "फागु पूर्णिमा (तराई)"},
  "12-25": {en: "Ghode Jatra", ne: "घोडेजात्रा"},
};

const HOLIDAY_CACHE_KEY = 'rudraksha_holiday_explanations';

export const CalendarService = {
  
  // Helper to calculate current Nepali date based on Anchor (April 14 2025 = 1/1/2082)
  getCurrentNepaliDate: (): { year: number, month: number, day: number } => {
      const anchorAd = new Date('2025-04-14');
      const now = new Date();
      
      // Difference in days
      const diffTime = Math.abs(now.getTime() - anchorAd.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      // If we are before the start of 2082 (unlikely in this simulation context, but handle it)
      if (now < anchorAd) return { year: 2081, month: 12, day: 30 }; // Fallback

      let remainingDays = diffDays;
      let currentMonthIndex = 0;
      
      // Iterate through months to find current
      while (remainingDays > 0 && currentMonthIndex < NEPALI_MONTHS_DATA_2082.length) {
          const daysInMonth = NEPALI_MONTHS_DATA_2082[currentMonthIndex].days;
          if (remainingDays <= daysInMonth) {
              return { 
                  year: 2082, 
                  month: currentMonthIndex + 1, 
                  day: remainingDays 
              };
          }
          remainingDays -= daysInMonth;
          currentMonthIndex++;
      }
      
      // Fallback if date is beyond the array
      return { year: 2082, month: 12, day: 30 }; 
  },

  getDatesForMonth: async (year: number, month: number): Promise<NepaliDate[]> => {
    // We are using the 2082 Calendar data explicitly
    const displayYear = 2082; 
    
    // Find month data, fallback to first month if not found
    const monthData = NEPALI_MONTHS_DATA_2082.find(m => m.id === month) || NEPALI_MONTHS_DATA_2082[0];
    
    const dates: NepaliDate[] = [];
    let currentWeekday = monthData.startWeekday; // 0=Sun, 1=Mon, etc.
    let adDate = new Date(monthData.startAdDate);

    for (let day = 1; day <= monthData.days; day++) {
      const dateKey = `${month}-${day}`;
      const holiday = HOLIDAYS_2082[dateKey];
      
      const weekdayEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentWeekday % 7];
      const weekdayNp = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि'][currentWeekday % 7];

      // Saturdays are always holidays in Nepal
      const isSaturday = currentWeekday % 7 === 6;

      dates.push({
        bs_year: displayYear,
        bs_month: month,
        bs_day: day,
        ad_year: adDate.getFullYear(),
        ad_month: adDate.getMonth() + 1,
        ad_day: adDate.getDate(),
        weekday_str_en: weekdayEn,
        weekday_str_np: weekdayNp,
        bs_month_str_en: monthData.nameEn,
        bs_month_str_np: monthData.nameNp,
        tithi_str_en: '',
        tithi_str_np: '',
        is_holiday: !!holiday || isSaturday,
        events: holiday ? [{
          strEn: holiday.en,
          strNp: holiday.ne,
          isHoliday: true
        }] : []
      });

      // Increment AD Date
      adDate.setDate(adDate.getDate() + 1);
      currentWeekday++;
    }

    return dates;
  },

  getHolidayExplanation: async (holidayName: string): Promise<{en: string, ne: string} | null> => {
    const cachedStr = localStorage.getItem(HOLIDAY_CACHE_KEY);
    if (cachedStr) {
      const cache = JSON.parse(cachedStr);
      if (cache[holidayName]) {
        return cache[holidayName];
      }
    }
    return null;
  },

  saveHolidayExplanation: async (holidayName: string, en: string, ne: string) => {
    const cachedStr = localStorage.getItem(HOLIDAY_CACHE_KEY);
    const cache = cachedStr ? JSON.parse(cachedStr) : {};
    cache[holidayName] = { en, ne };
    localStorage.setItem(HOLIDAY_CACHE_KEY, JSON.stringify(cache));
  }
};
