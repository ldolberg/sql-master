import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const extensionUri = context.extensionUri;
    const provider = new SqlSnippetMasterProvider(extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('sqlSnippetMasterView', provider)
    );

    console.log('SQL Snippet Master is now active.');
}

export function deactivate() {}

interface MockQueryResult {
    columns: string[];
    rows: Record<string, unknown>[];
    executionTime: number;
    status: 'success' | 'error';
    message: string;
}

function runMockSql(sql: string): MockQueryResult {
    const start = Date.now();
    const lower = sql.toLowerCase().trim();
    let columns: string[] = [];
    let rows: Record<string, unknown>[] = [];
    let message = 'Query executed successfully.';

    if (lower.includes('select') && lower.includes('user')) {
        columns = ['id', 'username', 'email', 'created_at'];
        rows = [
            { id: 1, username: 'jdoe', email: 'john@example.com', created_at: '2023-01-01' },
            { id: 2, username: 'asmith', email: 'alice@example.com', created_at: '2023-01-05' },
        ];
    } else if (lower.includes('select') && lower.includes('client')) {
        columns = ['client_id', 'name', 'plan', 'status'];
        rows = [
            { client_id: 'C-001', name: 'Global Corp', plan: 'Enterprise', status: 'Active' },
        ];
    } else if (lower.startsWith('update') || lower.startsWith('delete')) {
        columns = ['affected_rows'];
        rows = [{ affected_rows: Math.floor(Math.random() * 10) + 1 }];
        message = 'Modification applied.';
    } else {
        columns = ['info'];
        rows = [{ info: 'Command acknowledged.' }];
    }

    const executionTime = Date.now() - start;
    return { columns, rows, executionTime, status: 'success', message };
}

class SqlSnippetMasterProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage((data: { type: string; sql?: string }) => {
            if (data.type === 'runSql' && typeof data.sql === 'string') {
                const result = runMockSql(data.sql);
                webviewView.webview.postMessage({
                    type: 'runResult',
                    columns: result.columns,
                    rows: result.rows,
                    executionTime: result.executionTime,
                    status: result.status,
                    message: result.message,
                });
            }
        });
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const csp = `default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource};`;
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <title>SQL Snippet Master</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        h1 { font-size: 1.1em; margin: 0 0 12px 0; }
        .editor-wrap { flex: 0 0 auto; margin-bottom: 8px; }
        .editor-wrap label { display: block; margin-bottom: 4px; font-size: 0.9em; opacity: 0.9; }
        #sql-editor {
            width: 100%;
            min-height: 100px;
            padding: 8px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            resize: vertical;
            box-sizing: border-box;
        }
        #run-btn {
            margin-bottom: 12px;
            padding: 6px 12px;
            cursor: pointer;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            font-size: 0.9em;
        }
        #run-btn:hover { opacity: 0.9; }
        .results-wrap { flex: 1; min-height: 80px; overflow: auto; }
        .results-wrap label { display: block; margin-bottom: 4px; font-size: 0.9em; opacity: 0.9; }
        #results {
            padding: 8px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
            font-size: 0.85em;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <h1>SQL Snippet Master</h1>
    <div class="editor-wrap">
        <label for="sql-editor">SQL</label>
        <textarea id="sql-editor" placeholder="SELECT * FROM ..."></textarea>
    </div>
    <button id="run-btn" type="button">Run</button>
    <div class="results-wrap">
        <label>Results</label>
        <pre id="results">No results yet.</pre>
    </div>
    <script>
        (function() {
            var vscode = acquireVsCodeApi();
            var editor = document.getElementById('sql-editor');
            var runBtn = document.getElementById('run-btn');
            var results = document.getElementById('results');
            runBtn.addEventListener('click', function() {
                var sql = editor.value.trim();
                results.textContent = 'Running...';
                runBtn.disabled = true;
                vscode.postMessage({ type: 'runSql', sql: sql || 'SELECT 1' });
            });
            window.addEventListener('message', function(e) {
                var msg = e.data;
                if (msg.type !== 'runResult') return;
                runBtn.disabled = false;
                var cols = msg.columns || [];
                var rows = msg.rows || [];
                var time = msg.executionTime || 0;
                var status = msg.message || '';
                if (rows.length === 0) {
                    results.textContent = status + ' (' + time + ' ms)';
                    return;
                }
                var lines = [status + ' (' + time + ' ms)', ''];
                lines.push(cols.join(' | '));
                lines.push(cols.map(function() { return '---'; }).join('-'));
                rows.forEach(function(r) {
                    lines.push(cols.map(function(c) { return String(r[c] != null ? r[c] : ''); }).join(' | '));
                });
                results.textContent = lines.join('\\n');
            });
        })();
    </script>
</body>
</html>`;
    }
}
