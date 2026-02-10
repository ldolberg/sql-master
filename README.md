# 🚀 SQL Snippet Master: AI-Powered VS Code Extension

![Version](https://img.shields.io/badge/version-1.2.0-blueviolet)
![AI-Powered](https://img.shields.io/badge/AI-Gemini%203%20Flash-blue)
![Platform](https://img.shields.io/badge/platform-VS%20Code-007acc)

**SQL Snippet Master** is a high-performance VS Code extension designed for data engineers who need to organize scattered queries and run them safely. It turns your sidebar into a mission control for SQL development.

---

## 🛠 Installation (VS Code Extension)

### From Source
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/sql-snippet-master.git
   cd sql-snippet-master
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Compile the extension**:
   ```bash
   npm run build
   ```
4. **Launch Extension Development Host**:
   Press `F5` in VS Code to open a new window with the extension loaded.

### Packing for Distribution
To create a `.vsix` file that you can share and install manually:
1. Install the vsce tool: `npm install -g @vscode/vsce`
2. Run the package command:
   ```bash
   vsce package
   ```
3. Install the resulting `.vsix` via the VS Code Extensions view (triple dot menu -> Install from VSIX).

---

## ✨ Key Features

### 🧠 Intelligent Organization
- **AI Auto-Tagging**: Gemini analyzes saved snippets to suggest logical grouping and technical tags.
- **Semantic Search**: Use natural language to find past queries in your history.

### 🛡️ Built-in Safety Guardrails
- **Destructive Action Review**: The extension automatically identifies `DELETE` or `UPDATE` queries without `WHERE` clauses and prompts for mandatory approval.
- **Lint & Format**: Clean up your SQL logic with one click using LLM-based refactoring.

### 💬 Integrated AI Assistant
- **Context-Aware Sidebar Chat**: Ask questions about your active snippet directly in the sidebar. The AI knows your code and your dialect.

---

## 🏗️ Project Structure
- `extension.ts`: VS Code entry point and Webview Provider.
- `App.tsx`: The primary React-based IDE UI.
- `services/geminiService.ts`: Integration with Google Gemini API.
- `services/testRunner.ts`: Automated test suite for CI/CD and manual validation.

---

*Developed by World-Class Engineers. Powered by Gemini.*