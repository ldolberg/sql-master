import { SQLSnippet, SafetyCheck, LintResult, SqlDialect } from "../types";

const DEFAULT_MODEL = "gemini-2.0-flash";

export const MISSING_API_KEY_MESSAGE =
  "Gemini API key is not set. Set GEMINI_API_KEY or API_KEY in your environment (e.g. .env file or when running the build), then rebuild the webview.";

const API_KEY: string = process.env.GEMINI_API_KEY || process.env.API_KEY || "";

function getApiKey(): string {
  return API_KEY;
}

async function geminiGenerateContent(prompt: string, jsonMode = false, model = DEFAULT_MODEL): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey || !apiKey.trim()) {
    throw new Error(MISSING_API_KEY_MESSAGE);
  }
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
  };
  if (jsonMode) {
    (body as Record<string, unknown>).generationConfig = {
      responseMimeType: "application/json",
    };
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errBody}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text != null ? String(text) : "";
}

export const autoTagSnippet = async (code: string, dialect: SqlDialect, model?: string): Promise<{ tags: string[]; category: string }> => {
  try {
    const prompt = `Analyze this ${dialect} SQL snippet and provide relevant technical tags (e.g., table names, operations, complexity) and a logical grouping category. Respond with only valid JSON: {"tags": ["tag1","tag2"], "category": "Category Name"}.\n\nSQL:\n${code}`;
    const raw = await geminiGenerateContent(prompt, true, model);
    return JSON.parse(raw || '{"tags": [], "category": "General"}') as { tags: string[]; category: string };
  } catch (error) {
    console.error("Auto-tagging failed", error);
    return { tags: [dialect], category: "Uncategorized" };
  }
};

export const semanticSearch = async (query: string, snippets: SQLSnippet[], model?: string): Promise<string[]> => {
  try {
    const context = snippets.map((s) => `ID: ${s.id}\nCode: ${s.code}\nTags: ${s.tags.join(",")}`).join("\n---\n");
    const prompt = `Given the following SQL snippets, find the ones that best match the natural language query: "${query}". Return a JSON array of matched IDs in order of relevance, e.g. ["id1","id2"].\n\nSnippets:\n${context}`;
    const raw = await geminiGenerateContent(prompt, true, model);
    return JSON.parse(raw || "[]") as string[];
  } catch (error) {
    console.error("Semantic search failed", error);
    return [];
  }
};

export const checkSqlSafety = async (code: string, dialect: SqlDialect, model?: string): Promise<SafetyCheck> => {
  try {
    const prompt = `Analyze this ${dialect} SQL for risks (missing WHERE in UPDATE/DELETE, dangerous DROP, dialect-specific hazards). Respond with only valid JSON: {"isSafe": true|false, "warnings": ["..."], "suggestions": "..."}.\n\nSQL:\n${code}`;
    const raw = await geminiGenerateContent(prompt, true, model);
    return JSON.parse(raw || '{"isSafe": true, "warnings": [], "suggestions": "Looks good."}') as SafetyCheck;
  } catch (error) {
    console.error("Safety check failed", error);
    return { isSafe: true, warnings: [], suggestions: "Could not analyze safety." };
  }
};

export const generateDbtModel = async (
  name: string,
  sql: string,
  dialect: SqlDialect,
  model?: string
): Promise<{ modelSql: string; schemaYaml: string }> => {
  try {
    const prompt = `Transform this ${dialect} SQL into a production-ready dbt model. Model name: "${name}". Provide: 1) .sql model (Jinja, config block, CTEs). 2) schema.yml with model definition, column descriptions, tests (unique, not_null). Respond with only valid JSON: {"modelSql": "...", "schemaYaml": "..."}.\n\nSQL:\n${sql}`;
    const raw = await geminiGenerateContent(prompt, true, model);
    return JSON.parse(raw || '{"modelSql": "", "schemaYaml": ""}') as { modelSql: string; schemaYaml: string };
  } catch (error) {
    console.error("Dbt generation failed", error);
    return { modelSql: "-- Error generating dbt model", schemaYaml: "# Error generating schema.yml" };
  }
};

export const lintAndFormatSql = async (sql: string, dialect: SqlDialect, model?: string): Promise<LintResult> => {
  try {
    const prompt = `You are a ${dialect} SQL expert. On the input SQL: 1) Syntax check. 2) Linting suggestions (uppercase keywords, indentation, aliases). 3) Formatted version. Respond with only valid JSON: {"isValid": true|false, "errors": ["..."], "suggestions": ["..."], "formattedCode": "..."}.\n\nSQL:\n${sql}`;
    const raw = await geminiGenerateContent(prompt, true, model);
    return JSON.parse(raw || '{"isValid": true, "errors": [], "suggestions": [], "formattedCode": ""}') as LintResult;
  } catch (error) {
    console.error("Linting failed", error);
    return {
      isValid: true,
      errors: [],
      suggestions: ["Could not perform AI linting."],
      formattedCode: sql,
    };
  }
};

let _chatDialect: SqlDialect = "PostgreSQL";
let _chatModel: string = DEFAULT_MODEL;

export const initializeChat = (dialect: SqlDialect, model?: string) => {
  _chatDialect = dialect;
  if (model) _chatModel = model;
};

export const sendChatMessage = (
  message: string,
  currentSqlContext?: string
): AsyncGenerator<{ text: string }, void, unknown> => {
  const prompt = currentSqlContext
    ? `CONTEXT SQL SNIPPET:\n\`\`\`sql\n${currentSqlContext}\n\`\`\`\n\nUSER QUESTION: ${message}`
    : message;
  const systemInstruction = `You are an expert Data Engineer and SQL architect specializing in ${_chatDialect}. Help users write, optimize, and debug SQL. Format code blocks with the SQL language tag. Be concise and technical.`;

  return (async function* () {
    try {
      const fullPrompt = `${systemInstruction}\n\n---\n\n${prompt}`;
      const text = await geminiGenerateContent(fullPrompt, false, _chatModel);
      yield { text };
    } catch (err) {
      console.error("Chat error", err);
    }
  })();
};
