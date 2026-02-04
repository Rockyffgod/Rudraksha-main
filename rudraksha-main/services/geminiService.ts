
import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { TriviaQuestion, FTLMission, ChatMessage } from '../types';
import { LOCAL_LEXICON } from '../ai-voice-model/ai';

// --- UNIFIED RUDRA AI SYSTEM INSTRUCTION ---
const RUDRA_SYSTEM_INSTRUCTION = `You are Rudra (रुद्र), a smart, witty, and helpful Nepali friend.

**CORE PERSONA:**
- **Tone:** Casual, warm, and human-like. Like texting a smart friend.
- **Style:** SHORT responses. Avoid long lectures. Use emojis occasionally (🙏, 🔥, 😊).
- **Identity:** You are fluent in English, Nepali, and Nepal Bhasa (Newari).

**CRITICAL OUTPUT PROTOCOL:**
You MUST respond in a strict JSON format for EVERY text-based interaction (unless using tools).
Structure:
{
  "en": "English response (Short, casual, texting style)",
  "ne": "Nepali response (Devanagari, casual, natural 'Sathi' tone)",
  "newa": "Newari/Nepal Bhasa response (Devanagari script, casual)",
  "type": "text" | "quiz"
}

**KNOWLEDGE BASE:**
${LOCAL_LEXICON}

**TRIVIA MODE:**
If asked for a quiz, set "type": "quiz" and provide valid JSON data. Focus heavily on Nepal's History, Geography, and Culture.
`;

export const createStudyChat = (): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: RUDRA_SYSTEM_INSTRUCTION,
      temperature: 0.8, // Slightly higher for more "human" variance
      responseMimeType: 'application/json'
    },
  });
};

export const getCookingChatSession = (): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are **Bhanse Dai (भान्से दाइ)**, an expert Nepali Chef.
      
      **CORE INSTRUCTIONS:**
      1. You are warm, encouraging, and passionate about Nepali heritage cuisine.
      2. You MUST provide responses in BOTH English and Nepali (Devanagari) for every turn.
      3. Use the following JSON format strictly:
      
      {
        "en": "English response here...",
        "ne": "नेपाली जवाफ यहाँ..."
      }

      **CONTENT GUIDELINES:**
      - If asked for a recipe, provide ingredients and brief steps in both languages within the JSON fields.
      - Use terms like "Mitho cha!" (Tasty!) or "Bhat pakauna garo chaina" (Cooking rice isn't hard).
      - Keep recipes concise.
      `,
      responseMimeType: 'application/json'
    }
  });
};

export const analyzeMedia = async (
  fileBase64: string | null,
  mimeType: string,
  textInput: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [];
  
  // Prompt
  parts.push({ text: textInput || "Analyze this media in detail. Identify objects, text, actions, and context." });

  // Media
  if (fileBase64) {
      // Remove header if present (e.g., "data:image/png;base64,")
      const data = fileBase64.split(',')[1] || fileBase64;
      parts.push({
          inlineData: {
              mimeType: mimeType,
              data: data
          }
      });
  }

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Advanced multimodal model
        contents: { parts },
        config: {
            systemInstruction: "You are an expert visual analyst. Analyze the image or video provided. Be precise, descriptive, and helpful.",
        }
    });
    return response.text || "Analysis complete.";
  } catch (e) {
      console.error("Media Analysis Error", e);
      return "I encountered an error analyzing that media. Please try again with a clear image or video.";
  }
};

export const generateSummary = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Summarize this text. Return JSON: { "en": "English summary", "ne": "Nepali summary" }.\n\n${text}`,
    config: { responseMimeType: 'application/json' }
  });
  const json = JSON.parse(response.text || '{}');
  return JSON.stringify(json);
};

export const translateText = async (text: string, targetLang: 'en' | 'ne'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Translate "${text}" to ${targetLang === 'en' ? 'English' : 'Nepali'}. Return plain text string.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  return response.text || text;
};

export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  // Redirect to new unified analyzer
  return analyzeMedia(base64Image, 'image/jpeg', prompt);
};

export const analyzeVideo = async (base64Video: string, mimeType: string, prompt: string): Promise<string> => {
  // Redirect to new unified analyzer
  return analyzeMedia(base64Video, mimeType, prompt);
};

export const generateTrivia = async (topic: string, language: 'en' | 'ne' = 'en'): Promise<TriviaQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const langInstruction = language === 'ne' ? 'Generate questions and options in Nepali language (Devanagari).' : 'Generate questions and options in English.';
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 5 multiple choice trivia questions about "${topic}". 
    ${langInstruction}
    Focus on Nepal context if possible (History, Geography, Culture, Nature).
    Return ONLY a JSON array with objects containing: 
    - question (string)
    - options (array of 4 strings)
    - correctAnswer (index 0-3, number)
    - explanation (short string in ${language === 'ne' ? 'Nepali' : 'English'})
    
    Ensure questions are interesting and not too easy.`,
    config: { responseMimeType: 'application/json' }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
};

export const generateExerciseGuide = async (exerciseName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Create a step-by-step exercise guide for: "${exerciseName}".
    Return a strict JSON object with these fields:
    {
      "id": "generated_${Date.now()}",
      "name": "English Name",
      "neName": "Nepali Name (Devanagari)",
      "benefits": "Short English benefits (max 10 words)",
      "neBenefits": "Short Nepali benefits (max 10 words)",
      "steps": "Summary of steps in English",
      "neSteps": "Summary of steps in Nepali",
      "detailedSteps": ["Step 1 English", "Step 2 English", ...],
      "detailedStepsNe": ["चरण १ नेपाली", "चरण २ नेपाली", ...],
      "stepDurations": [30, 45, ...] // Array of numbers (seconds) for each step. Estimate suitable duration based on web knowledge.
    }
    Keep steps clear, actionable and safe. Max 6 steps.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
};

export const explainHoliday = async (holidayName: string): Promise<{ en: string, ne: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Explain the significance of the Nepali festival/holiday "${holidayName}". 
        Provide a short explanation in English and Nepali.
        Return JSON: { "en": "string", "ne": "string" }`,
    config: { responseMimeType: 'application/json' }
  });
  try {
    return JSON.parse(response.text || '{"en": "Info unavailable", "ne": "विवरण उपलब्ध छैन"}');
  } catch {
    return { en: "AI Error", ne: "त्रुटि" };
  }
};

export const matchEmergencyReports = async (foundDescription: string, activeMissions: FTLMission[]) => {
  const lostMissions = activeMissions.filter(m => m.status === 'active' && m.isLost);
  if (lostMissions.length === 0) return { matchId: null, confidence: 0, reasoning: "No active lost reports." };

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    I have found an item/person with this description: "${foundDescription}".
    Here is a list of active "Lost" reports:
    ${JSON.stringify(lostMissions.map(m => ({ id: m.id, title: m.title, desc: m.description, type: m.type })))}

    Analyze if the found item matches any of the lost reports.
    Return JSON: { "matchId": "string or null", "confidence": number (0-100), "reasoning": "string" }
    `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch {
    return { matchId: null, confidence: 0 };
  }
};

export const interpretDream = async (dreamText: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Act as a mystical interpreter of dreams, combining Nepali folklore/superstition with modern psychology.
    Dream: "${dreamText}"
    
    Return JSON with both English (en) and Nepali (ne) translations:
    {
        "folklore": { 
            "en": "Traditional interpretation in English", 
            "ne": "Traditional interpretation in Nepali (Devanagari)" 
        },
        "psychology": { 
            "en": "Modern psychological view in English", 
            "ne": "Modern psychological view in Nepali (Devanagari)" 
        },
        "symbol": "One key symbol from the dream"
    }
    `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch {
    return { 
        folklore: { en: "The mists are too thick.", ne: "कुहिरो धेरै बाक्लो छ।" }, 
        psychology: { en: "Unclear data.", ne: "स्पष्ट डाटा छैन।" }, 
        symbol: "?" 
    };
  }
};

export const createHealthAssistant = (history: any[], isNepali: boolean) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are Prana AI (प्राण), a holistic health coach for a user in Nepal.
            Context: The user has provided their recent health logs: ${JSON.stringify(history)}.
            Style:
            - Language: ${isNepali ? 'Nepali' : 'English'}
            - Tone: Encouraging, knowledgeable about Ayurveda and modern science.
            - If data shows low water/sleep, gently remind them.
            - Keep responses conversational and short (under 50 words).`
    }
  });
};

export const searchPustakalaya = async (query: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `User is searching for "${query}" in the context of the Nepali National Library (pustakalaya.org) or CDC.
        Provide a helpful summary of what materials likely exist for this topic (e.g., Grade 10 Science textbooks, Munamadan, etc.).
        Then provide 3 plausible direct links (mock them as likely URLs on pustakalaya.org).
        
        Return JSON: { "text": "Summary string...", "links": [{ "title": "Book Title", "uri": "https://pustakalaya.org/..." }] }`,
    config: { responseMimeType: 'application/json' }
  });

  try {
    return JSON.parse(response.text || '{"text": "Search failed.", "links": []}');
  } catch {
    return { text: "Could not access library database.", links: [] };
  }
};

export const connectToGuruLive = (params: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.live.connect(params);
};

export const encodeAudio = (data: Uint8Array) => {
  let binary = '';
  const len = data.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
};

// Safe Base64 Encoder for Unicode Strings
export const safeBase64Encode = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};

export const decodeAudio = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const requestMicPermission = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch {
    return false;
  }
};
