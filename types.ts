
export interface SQLSnippet {
  id: string;
  name: string;
  code: string;
  tags: string[];
  category: string;
  usageCount: number;
  lastRunAt: number;
  createdAt: number;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  executionTime: number;
  status: 'success' | 'error';
  message?: string;
}

export interface SearchResult {
  snippetId: string;
  relevanceScore: number;
  explanation: string;
}

export interface SafetyCheck {
  isSafe: boolean;
  warnings: string[];
  suggestions: string;
}
