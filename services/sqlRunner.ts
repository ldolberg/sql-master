
import { QueryResult } from "../types";

export const executeSql = async (sql: string): Promise<QueryResult> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const lowerSql = sql.toLowerCase().trim();
  const startTime = performance.now();

  // Mock responses based on keywords
  let columns: string[] = [];
  let rows: any[] = [];
  let message = "Query executed successfully.";

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
    message = "Modification applied.";
  } else {
    columns = ["info"];
    rows = [{ info: "Command acknowledged." }];
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
