
export interface LanguageConfig {
  code: string;
  label: string;
  nativeName: string;
  voiceName: string;
  systemPrompt: string;
}

export const AI_LANGUAGES: Record<'en' | 'ne', LanguageConfig> = {
  en: {
    code: 'en-US',
    label: 'English',
    nativeName: 'English',
    voiceName: 'Fenrir',
    systemPrompt: "Respond in English. Keep it concise, warm, and helpful."
  },
  ne: {
    code: 'ne-NP',
    label: 'Nepali',
    nativeName: 'नेपाली',
    voiceName: 'Fenrir',
    systemPrompt: "Respond in Nepali (Devanagari). Speak naturally like a Nepali local (Dai/Didi). Use 'Hajur', 'Namaste'. Keep it short and sweet."
  }
};
