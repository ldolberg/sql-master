
import { QueryResult, SqlDialect } from "../types";

export const executeSql = async (sql: string, dialect: SqlDialect): Promise<QueryResult> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const lowerSql = sql.toLowerCase().trim();
  const startTime = performance.now();

  // Mock responses based on keywords and dialect
  let columns: string[] = [];
  let rows: any[] = [];
  let message = `Query executed successfully on ${dialect}.`;

  if (lowerSql.includes("select") && lowerSql.includes("user")) {
    columns = ["id", "username", "email", "created_at"];
    rows = [
      { id: 1, username: "jdoe", email: "john@example.com", created_at: "2023-01-01" },
      { id: 2, username: "asmith", email: "alice@example.com", created_at: "2023-01-05" },
      { id: 3, username: "bob_w", email: "bob@example.com", created_at: "2023-02-10" },
    ];
  } else if (lowerSql.includes("select") && lowerSql.includes("client")) {
    columns = ["client_id", "name", "plan", "status"];
    rows = [
      { client_id: "C-001", name: "Global Corp", plan: "Enterprise", status: "Active" },
      { client_id: "C-002", name: "Tech Solutions", plan: "Pro", status: "Inactive" },
    ];
  } else if (lowerSql.startsWith("update") || lowerSql.startsWith("delete")) {
    columns = ["affected_rows"];
    rows = [{ affected_rows: Math.floor(Math.random() * 10) + 1 }];
    message = `Modification applied via ${dialect}.`;
  } else if (dialect === 'BigQuery' && lowerSql.includes('dataset')) {
    columns = ["dataset_id", "creation_time"];
    rows = [{ dataset_id: "analytics_v1", creation_time: "2024-01-01T00:00:00Z" }];
  } else {
    columns = ["info"];
    rows = [{ info: `Command acknowledged by ${dialect} engine.` }];
  }

  const endTime = performance.now();

  return {
    columns,
    rows,
    executionTime: Math.round(endTime - startTime),
    status: 'success',
    message
  };
};
