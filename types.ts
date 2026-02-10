
export type SqlDialect = 'PostgreSQL' | 'MySQL' | 'SQLite' | 'Snowflake' | 'BigQuery' | 'Redshift';

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

export interface LintResult {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
  formattedCode: string;
}

export interface ExecutionHistory {
  id: string;
  snippetId: string | null;
  name: string;
  code: string;
  timestamp: number;
  executionTime: number;
}

// Testing Types
export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'AI' | 'Execution' | 'Logic';
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
  duration?: number;
}
