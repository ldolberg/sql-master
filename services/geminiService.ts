
import { GoogleGenAI, Type } from "@google/genai";
import { SQLSnippet, SafetyCheck } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const autoTagSnippet = async (code: string): Promise<{ tags: string[], category: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this SQL snippet and provide relevant technical tags (e.g., table names, operations like SELECT/UPDATE, complexity) and a logical grouping category.\n\nSQL:\n${code}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            category: {
              type: Type.STRING,
              description: "A logical file-like grouping name, e.g., 'User Management', 'Financial Reports'"
            }
          },
          required: ["tags", "category"]
        }
      }
    });

    return JSON.parse(response.text || '{"tags": [], "category": "General"}');
  } catch (error) {
    console.error("Auto-tagging failed", error);
    return { tags: ["SQL"], category: "Uncategorized" };
  }
};

export const semanticSearch = async (query: string, snippets: SQLSnippet[]): Promise<string[]> => {
  try {
    const context = snippets.map(s => `ID: ${s.id}\nCode: ${s.code}\nTags: ${s.tags.join(',')}`).join('\n---\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Given the following SQL snippets, find the ones that best match the natural language query: "${query}". Return a list of matched IDs in order of relevance.\n\nSnippets:\n${context}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Semantic search failed", error);
    return [];
  }
};

export const checkSqlSafety = async (code: string): Promise<SafetyCheck> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this SQL for risks (like missing WHERE in UPDATE/DELETE, dangerous DROP commands) and provide safety suggestions.\n\nSQL:\n${code}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: { type: Type.BOOLEAN },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestions: { type: Type.STRING }
          },
          required: ["isSafe", "warnings", "suggestions"]
        }
      }
    });

    return JSON.parse(response.text || '{"isSafe": true, "warnings": [], "suggestions": "Looks good."}');
  } catch (error) {
    console.error("Safety check failed", error);
    return { isSafe: true, warnings: [], suggestions: "Could not analyze safety." };
  }
};
