
import { GoogleGenAI } from '@google/genai';

export const YouTubeService = {
  /**
   * Uses Google Search Grounding to find a specific YouTube Watch URL for a given query.
   * Works for songs, tutorials, documentaries, and general video searches.
   */
  findVideoUrl: async (query: string): Promise<string | null> => {
    if (!query) return null;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find the most relevant specific YouTube watch URL for the request: "${query}".
        
        Rules:
        1. If it is a song, find the official music video or lyric video.
        2. If it is a general topic (e.g., "funny cats", "react tutorial", "nepal news"), find the most popular or relevant specific video.
        3. Do NOT return a channel URL or playlist URL, must be a single video (watch?v=...).
        
        Return ONLY a JSON object: { "url": "https://www.youtube.com/watch?v=..." }`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json'
        }
      });
      
      const text = response.text;
      if (!text) return null;
      
      const data = JSON.parse(text);
      if (data.url && data.url.includes('youtube.com/watch')) {
          return data.url;
      }
      return null;
    } catch (e) {
      console.warn("YouTube Service Error:", e);
      return null;
    }
  }
};
