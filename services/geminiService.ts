
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { SQLSnippet, SafetyCheck, LintResult, SqlDialect } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const autoTagSnippet = async (code: string, dialect: SqlDialect): Promise<{ tags: string[], category: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this ${dialect} SQL snippet and provide relevant technical tags (e.g., table names, operations, complexity) and a logical grouping category.\n\nSQL:\n${code}`,
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
    return { tags: [dialect], category: "Uncategorized" };
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

export const checkSqlSafety = async (code: string, dialect: SqlDialect): Promise<SafetyCheck> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this ${dialect} SQL for risks (like missing WHERE in UPDATE/DELETE, dangerous DROP commands, or dialect-specific hazards) and provide safety suggestions.\n\nSQL:\n${code}`,
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

export const generateDbtModel = async (name: string, sql: string, dialect: SqlDialect): Promise<{ modelSql: string, schemaYaml: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Transform this ${dialect} SQL query into a production-ready dbt model. 
      The model name is "${name}". 
      1. Provide the .sql model file using Jinja best practices (e.g. config block, CTEs). Use ${dialect} specific syntax where appropriate.
      2. Provide a corresponding schema.yml file with the model definition, column descriptions, and basic tests (unique, not_null).
      
      SQL Input:
      ${sql}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            modelSql: { type: Type.STRING },
            schemaYaml: { type: Type.STRING }
          },
          required: ["modelSql", "schemaYaml"]
        }
      }
    });

    return JSON.parse(response.text || '{"modelSql": "", "schemaYaml": ""}');
  } catch (error) {
    console.error("Dbt generation failed", error);
    return { modelSql: "-- Error generating dbt model", schemaYaml: "# Error generating schema.yml" };
  }
};

export const lintAndFormatSql = async (sql: string, dialect: SqlDialect): Promise<LintResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a ${dialect} SQL expert. Perform the following on the input SQL:
      1. Syntax check: Identify any invalid ${dialect} SQL syntax.
      2. Linting: Provide suggestions for better style (keywords in uppercase, indentation, use of aliases).
      3. Formatting: Provide a beautifully formatted version of the code respecting ${dialect} conventions.
      
      SQL:
      ${sql}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            errors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Critical syntax errors"
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Linting and style suggestions"
            },
            formattedCode: { type: Type.STRING }
          },
          required: ["isValid", "errors", "suggestions", "formattedCode"]
        }
      }
    });

    return JSON.parse(response.text || '{"isValid": true, "errors": [], "suggestions": [], "formattedCode": ""}');
  } catch (error) {
    console.error("Linting failed", error);
    return {
      isValid: true,
      errors: [],
      suggestions: ["Could not perform AI linting."],
      formattedCode: sql
    };
  }
};

// Chat Session Support
let activeChat: Chat | null = null;

export const initializeChat = (dialect: SqlDialect) => {
  activeChat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are an expert Data Engineer and SQL architect specializing in ${dialect}. 
      You help users write, optimize, and debug SQL snippets. 
      You have access to the user's currently active snippet if they provide it.
      Format all code blocks with the appropriate SQL language tag.
      Be concise, professional, and technical.`
    }
  });
  return activeChat;
};

export const sendChatMessage = async (message: string, currentSqlContext?: string) => {
  if (!activeChat) initializeChat('PostgreSQL');
  
  const prompt = currentSqlContext 
    ? `CONTEXT SQL SNIPPET:\n\`\`\`sql\n${currentSqlContext}\n\`\`\`\n\nUSER QUESTION: ${message}`
    : message;

  return activeChat!.sendMessageStream({ message: prompt });
};
