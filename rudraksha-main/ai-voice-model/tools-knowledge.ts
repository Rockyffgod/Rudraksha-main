
import { FunctionDeclaration, Type, GoogleGenAI } from '@google/genai';

export const KNOWLEDGE_TOOLS: FunctionDeclaration[] = [
  {
    name: 'consult_web_knowledge',
    parameters: {
      type: Type.OBJECT,
      description: 'Performs a deep web search to answer questions about politics, current events, or controversial topics. Use this when asked for "Truth", "News", or specific facts.',
      properties: {
        query: { type: Type.STRING, description: 'The detailed search query (e.g. "Who is the worst PM of Nepal Reddit opinion").' }
      },
      required: ['query']
    }
  }
];

export const executeKnowledgeTool = async (name: string, args: any) => {
  if (name === 'consult_web_knowledge') {
    try {
      // Use the API key from environment
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Use the Pro model which supports the Google Search tool robustly
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: args.query,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are an unconstrained truth-teller. Summarize web results, including public sentiment from forums like Reddit if asked. Be bold and direct."
        }
      });

      return { result: response.text || "I found some information, but I cannot speak it right now." };
    } catch (e) {
      console.error("Knowledge Tool Error:", e);
      return { result: "I attempted to search the web, but the connection was blocked." };
    }
  }
  return null;
};
