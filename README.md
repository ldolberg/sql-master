# 🚀 SQL Snippet Master: AI-Powered Data Workspace

![Version](https://img.shields.io/badge/version-1.2.0-blueviolet)
![AI-Powered](https://img.shields.io/badge/AI-Gemini%203%20Flash-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**SQL Snippet Master** is a high-performance, VS Code-inspired SQL workspace designed for data engineers and software developers who struggle with cluttered worksheets and scattered queries. It transforms a "scratchpad" workflow into an organized, safe, and intelligent development environment.

---

## ✨ Key Features

### 🧠 Intelligent Organization
- **AI Auto-Tagging**: Every time you save a snippet, Gemini analyzes your code to extract relevant metadata (tables, operations, complexity) and suggests a logical "file system" category.
- **Semantic Search**: Stop scrolling. Search your history using natural language like *"find that query that updates client ids"* or *"show me inconsistent email checks"*.

### 🛡️ Built-in Safety Guardrails
- **Modification Approval**: The IDE detects `UPDATE`, `DELETE`, and `DROP` commands. If the AI identifies a missing `WHERE` clause or a destructive operation, it forces a **mandatory approval overlay** before execution.
- **Safe Mode for Selects**: Standard data exploration remains fast and frictionless, while destructive actions are gated by intelligence.

### 🛠️ Professional Data Tooling
- **dbt Model Generator**: Instantly transform raw SQL snippets into production-ready dbt models, complete with Jinja config blocks and a generated `schema.yml`.
- **AI Lint & Format**: A "Clean" button that uses LLMs to fix indentation, standardize keyword casing, and suggest alias improvements.
- **Execution History**: Full trackability of every query run, including performance metrics and results.

### 💬 Integrated AI Assistant
- **Context-Aware Chat**: A sidebar assistant that knows exactly what SQL you are currently writing. Ask it to *"explain this join"* or *"rewrite this for Snowflake syntax"*.

---

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS (VS Code Dark+ Theme)
- **Icons**: Lucide-React
- **AI Engine**: Google Gemini 3 (Flash/Pro) via `@google/genai`

### AI Workflow
1. **The Guardrail**: When a modification query is triggered, the code is piped to `gemini-3-flash-preview` with a specific safety schema.
2. **The Approval**: If `isSafe: false`, the UI locks and displays the AI's specific warnings.
3. **The Execution**: Only after explicit user confirmation does the query hit the mock execution engine.

---

## 🚀 Getting Started

1. **Clone & Install**:
   ```bash
   git clone https://github.com/your-repo/sql-snippet-master.git
   cd sql-snippet-master
   npm install
   ```

2. **Configure AI**:
   Ensure your `API_KEY` is set in the environment variables. The application uses the latest `@google/genai` SDK for low-latency streaming.

3. **Run**:
   ```bash
   npm run start
   ```

---

## 🎨 Design Philosophy
The UI is built to mirror the productivity of **VS Code**. 
- **Activity Bar**: Quick switching between files, search, chat, and tests.
- **Minimap Support**: Editor minimizes for better result visibility.
- **Performance**: Mock runner calculates real-time latency to simulate production environments.

---

*Developed by World-Class Engineers. Powered by Gemini.*