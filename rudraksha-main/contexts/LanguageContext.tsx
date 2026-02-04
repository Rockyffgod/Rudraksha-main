
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ne';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('rudraksha_lang') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('rudraksha_lang', language);
  }, [language]);

  const t = (key: string, defaultText: string) => {
    if (language === 'en') return defaultText;
    
    const dictionary: Record<string, string> = {
      // Navigation & Layout
      "Dashboard": "ड्यासबोर्ड",
      "ACADEMIC": "शैक्षिक",
      "Academic": "शैक्षिक",
      "Rudra AI": "रुद्र एआई",
      "Guru AI": "रुद्र एआई",
      "Assignments": "गृहकार्य",
      "Analytics": "तथ्याङ्क",
      "Culture": "संस्कृति",
      "LIFESTYLE": "जीवनशैली",
      "UTILITIES": "सुविधाहरू",
      "Calendar": "पात्रो",
      "Community": "समुदाय",
      "Network": "सञ्जाल",
      "Wellness": "कल्याण",
      "FTL Rescue": "उद्धार",
      "E-Library": "ई-पुस्तकालय",
      "Plan": "योजना",
      "Map & Provinces": "नक्सा र प्रदेश",
      "Kitchen": "भान्छा",
      "Health": "स्वास्थ्य",
      "Safety": "सुरक्षा",
      "Karma Bazaar": "कर्म बजार",
      "Arcade": "आर्केड",
      "Chat": "कुराकानी",
      "Settings": "सेटिङ्स",
      "Good Morning": "शुभ प्रभात",
      "Good Afternoon": "शुभ दिन",
      "Good Evening": "शुभ सन्ध्या",
      "Karma": "कर्म",
      "Level": "स्तर",
      "Heritage Map": "सम्पदा नक्सा",
      "Planner": "योजनाकार",
      "Pending Tasks": "बाँकी कार्यहरू",
      "Curriculum Resources": "पाठ्यक्रम स्रोतहरू",
      "Traditional Recipes": "परम्परागत परिकारहरू",
      "Global Chat": "विश्वव्यापी कुराकानी",
      "Active Alerts": "सक्रिय अलर्टहरू",
      "System Secure": "प्रणाली सुरक्षित",
      "Health Tracker": "स्वास्थ्य ट्रयाकर",
      "Play & Earn": "खेल्नुहोस् र कमाउनुहोस्",
      "Redeem Points": "अंक रिडिम गर्नुहोस्",
      "Priority Queue": "प्राथमिकता लाम",
      "All Clear": "सबै सफा",
      "FTL Network": "FTL सञ्जाल",
      "Sector Secure": "क्षेत्र सुरक्षित",
      "View Map": "नक्सा हेर्नुहोस्",
      "View All": "सबै हेर्नुहोस्",
      "Explore Nepal": "नेपाल अन्वेषण",

      // AI Guru Features
      "Text Chat": "पाठ कुराकानी",
      "Live Voice": "प्रत्यक्ष आवाज",
      "Video Insight": "भिडियो विश्लेषण",
      "Visual Scan": "दृष्टि स्क्यान",
      "Quiz Game": "हाजिरीजवाफ",
      "Voice Interface": "आवाज इन्टरफेस",
      "Conversational AI with Gemini 2.5 Native Audio.": "जेमिनी २.५ नेटिभ अडियोको साथ संवादात्मक एआई।",
      "Video Analyst": "भिडियो विश्लेषक",
      "Visual Scanner": "दृष्टि स्क्यानर",
      "Ask Rudra AI anything...": "रुद्र एआईलाई केहि सोध्नुहोस्...",
      "Ask Guru AI anything...": "रुद्र एआईलाई केहि सोध्नुहोस्...",
      "Extracting Wisdom...": "ज्ञान निकाल्दै...",
      "Insight Dossier": "अन्तर्दृष्टि डोसियर",
      "No Intel yet": "अझै कुनै जानकारी छैन",
      "Upload Lesson": "पाठ अपलोड गर्नुहोस्",
      "Upload Video": "भिडियो अपलोड गर्नुहोस्",
      "QUICK SCAN": "द्रुत स्क्यान",
      "Ask short questions about the video...": "भिडियोको बारेमा छोटो प्रश्नहरू सोध्नुहोस्...",
      "What should Guru AI focus on?": "रुद्र एआईले केमा ध्यान दिनुपर्छ?",
      "Paste text to summarize...": "सारांश गर्न पाठ टाँस्नुहोस्...",
      "SCAN & ANALYZE": "स्क्यान र विश्लेषण",
      "SUMMARIZE INTEL": "जानकारी सारांश",
      "Result Extraction": "परिणाम निष्कर्षण",
      "Cam": "क्यामेरा",
      "Library": "पुस्तकालय",
      "Clear": "स्पष्ट",
      "Clear Chat": "संवाद मेटाउनुहोस्",
      "Session Feed": "वर्तमान सत्र",
      "Test your heritage knowledge and earn karma points from Guru AI.": "आफ्नो सम्पदा ज्ञान परीक्षण गर्नुहोस् र रुद्र एआईबाट कर्म अंकहरू कमाउनुहोस्।",
      "ENTER CHALLENGE": "चुनौतीमा प्रवेश",
      "Syncing Intel...": "जानकारी सिंक गर्दै...",
      "Ritual Progress": "प्रगति",
      "Wisdom Note": "ज्ञान नोट",
      "CONTINUE": "जारी राख्नुहोस्",
      "Mission Cleared": "मिशन पुरा",
      "Final Score": "अन्तिम स्कोर",
      "RESTART RITUAL": "पुनः सुरु",
      "CONNECT TO": "जडान गर्नुहोस्",
      "Voice Persona Selection": "आवाज व्यक्तित्व चयन",
      "Voice Tuning": "आवाज ट्युनिङ",
      "Voice Speed": "आवाजको गति",
      "Voice Pitch": "आवाजको उतारचढाव",

      // Wellness & Health
      "Wellness Centre": "स्वास्थ्य केन्द्र",
      "Environment": "वातावरण",
      "Daily Log": "दैनिक लग",
      "Yoga Flow": "योग प्रवाह",
      "Yoga": "योग",
      "Wisdom": "ज्ञान",
      "Sapana": "सपना",
      "Climate Tracker": "जलवायु ट्रयाकर",
      "Personal Health": "व्यक्तिगत स्वास्थ्य",
      "Air Quality Index": "वायु गुणस्तर सूचकांक",
      "Mask Advice": "मास्क सुझाव",
      "Pollutants": "प्रदूषकहरू",
      "Feels Like": "महसुस हुने",
      "Humidity": "आर्द्रता",
      "Wind": "हावा",
      "Daily Wellness Wisdom": "दैनिक स्वास्थ्य ज्ञान",
      "Hydration Track": "पानीको ट्रयाक",
      "Mood Ritual": "मनस्थिति विधि",
      "Recovery Sleep": "निद्रा र आराम",
      "Happy": "खुसी",
      "Neutral": "सामान्य",
      "Stressed": "तनाव",
      "Tired": "थकित",
      "Yog Flow & Vitality": "योग र प्राण शक्ति",
      "Benefits": "फाइदाहरू",
      "Movement Guide": "अभ्यास मार्गदर्शक",
      "Ayurvedic Rituals": "आयुर्वेदिक विधिहरू",
      "Longevity Secrets": "दीर्घायुको रहस्य",
      "Active Lifestyle": "सक्रिय जीवनशैली",
      "Sattvic Diet": "सात्त्विक आहार",
      "Social Connection": "सामाजिक सम्बन्ध",
      "Consistent Sleep": "नियमित निद्रा",
      "Community Health Secret": "सामुदायिक स्वास्थ्य रहस्य",
      "Sapana Interpreter": "सपना व्याख्याता",
      "Unlock the hidden messages of your subconscious through the lens of ancient Nepali folklore and modern psychology.": "प्राचीन नेपाली लोककथा र आधुनिक मनोविज्ञानको माध्यमबाट आफ्नो अवचेतन मनका लुकेका सन्देशहरू बुझ्नुहोस्।",
      "Describe your dream here... (e.g. I saw a snake in a temple)": "तपाईंको सपना यहाँ वर्णन गर्नुहोस्... (जस्तै: मैले मन्दिरमा सर्प देखेँ)",
      "REVEAL MEANING": "अर्थ खोल्नुहोस्",
      "Traditional Folklore": "परम्परागत लोकविश्वास",
      "Psychological View": "मनोवैज्ञानिक दृष्टिकोण",

      // Safety & FTL
      "Find The Lost": "हराएकाको खोजी",
      "Report Loss": "हराएको जानकारी",
      "I Found Something": "मैले केहि भेट्टाएँ",
      "Report Eye-Witness": "प्रत्यक्षदर्शी जानकारी",
      "Active Feed": "प्रत्यक्ष अपडेट",
      "My Rescue Logs": "मेरा रिपोर्टहरू",
      "Rescue Tags": "सुरक्षा ट्यागहरू",
      "Community Vault": "सामुदायिक भल्ट",
      "Find My Item": "मेरो सामान खोजनुहोस्",
      "Nepal Police": "नेपाल प्रहरी",
      "Ambulance": "एम्बुलेन्स",
      "Fire Brigade": "दमकल",
      "MISSION COMMAND": "मिशन कमान्ड",

      // Common
      "Loading...": "लोड हुँदैछ...",
      "Save Changes": "परिवर्तनहरू सुरक्षित गर्नुहोस्",
      "Cancel": "रद्द गर्नुहोस्",
      "Close": "बन्द गर्नुहोस्",
      "Edit": "सम्पादन",
      "Delete": "हटाउनुहोस्",
      "Search": "खोज्नुहोस्",
    };
    return dictionary[key] || defaultText;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};
