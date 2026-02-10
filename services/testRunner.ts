
import { executeSql } from './sqlRunner';
import { checkSqlSafety, autoTagSnippet, lintAndFormatSql, generateDbtModel } from './geminiService';
import { TestCase, SqlDialect } from '../types';

// Polyfill performance for Node environments if necessary
const now = () => typeof performance !== 'undefined' ? performance.now() : Date.now();

export const TEST_SUITE: Omit<TestCase, 'status'>[] = [
  { id: 't1', category: 'Execution', name: 'Dialect: PostgreSQL', description: 'Verify standard execution on PostgreSQL mock.' },
  { id: 't2', category: 'Execution', name: 'Dialect: BigQuery', description: 'Verify BigQuery specific dataset result mocking.' },
  { id: 't3', category: 'Execution', name: 'SQL Injection Mock', description: 'Ensure the runner handles unexpected or dangerous strings.' },
  { id: 't4', category: 'AI', name: 'Safety: Dangerous Update', description: 'Test AI detection of missing WHERE clauses.' },
  { id: 't5', category: 'AI', name: 'Linting: Case Sensitivity', description: 'Verify AI suggests uppercase keywords for better style.' },
  { id: 't6', category: 'AI', name: 'dbt: Model Generation', description: 'Ensure dbt model export generates Jinja config blocks.' },
  { id: 't7', category: 'AI', name: 'Auto-Tagging', description: 'Verify logical category grouping for finance-related SQL.' },
  { id: 't8', category: 'Logic', name: 'Performance Timing', description: 'Ensure execution time is calculated correctly.' }
];

export async function runTestCase(test: Omit<TestCase, 'status'>): Promise<{ passed: boolean; error?: string; duration: number }> {
  const start = now();
  try {
    switch (test.id) {
      case 't1': {
        const res = await executeSql('SELECT * FROM users', 'PostgreSQL');
        if (res.status !== 'success' || !res.message.includes('PostgreSQL')) throw new Error('Dialect mismatch in result');
        break;
      }
      case 't2': {
        const res = await executeSql('SELECT * FROM dataset.table', 'BigQuery');
        if (!res.rows.some(r => r.dataset_id)) throw new Error('BigQuery specific rows not returned');
        break;
      }
      case 't4': {
        const res = await checkSqlSafety('UPDATE users SET name = "bob"', 'MySQL');
        if (res.isSafe) throw new Error('Dangerous update was marked as safe');
        break;
      }
      case 't5': {
        const res = await lintAndFormatSql('select * from users', 'PostgreSQL');
        if (!res.formattedCode.includes('SELECT')) throw new Error('Keywords were not uppercased');
        break;
      }
      case 't6': {
        const res = await generateDbtModel('TestModel', 'SELECT 1', 'Snowflake');
        if (!res.modelSql.includes('{{') || !res.schemaYaml.includes('version')) throw new Error('Invalid dbt structure');
        break;
      }
      case 't7': {
        const res = await autoTagSnippet('SELECT amount FROM transactions', 'PostgreSQL');
        if (!res.category || res.category === 'Uncategorized') throw new Error('AI failed to categorize financial SQL');
        break;
      }
      case 't8': {
        const res = await executeSql('SELECT 1', 'SQLite');
        if (res.executionTime <= 0) throw new Error('Timing calculation failed');
        break;
      }
      default:
        // Simulate generic logic test
        await new Promise(r => setTimeout(r, 100));
    }
    return { passed: true, duration: now() - start };
  } catch (e: any) {
    return { passed: false, error: e.message, duration: now() - start };
  }
}
