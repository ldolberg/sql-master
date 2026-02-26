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

interface Snippet {
    id: string;
    name: string;
    code: string;
    tags: string[];
}

const DEFAULT_SNIPPETS: Snippet[] = [
    { id: '1', name: 'Users list', code: 'SELECT id, username, email FROM user;', tags: ['select', 'user'] },
    { id: '2', name: 'Clients', code: 'SELECT client_id, name, plan FROM client;', tags: ['select', 'client'] },
    { id: '3', name: 'Count', code: 'SELECT COUNT(*) AS total FROM user;', tags: ['aggregate'] },
];

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
    private _snippets: Snippet[] = [...DEFAULT_SNIPPETS];

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

        webviewView.webview.onDidReceiveMessage((data: { type: string; sql?: string; id?: string }) => {
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
                return;
            }
            if (data.type === 'getSnippetList') {
                webviewView.webview.postMessage({
                    type: 'snippetList',
                    snippets: this._snippets.map((s) => ({ id: s.id, name: s.name, tags: s.tags })),
                });
                return;
            }
            if (data.type === 'loadSnippet' && typeof data.id === 'string') {
                const snip = this._snippets.find((s) => s.id === data.id);
                if (snip) {
                    webviewView.webview.postMessage({
                        type: 'snippet',
                        id: snip.id,
                        name: snip.name,
                        code: snip.code,
                        tags: snip.tags,
                    });
                }
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
        .snippets-wrap { margin-bottom: 12px; }
        .snippets-wrap label { display: block; margin-bottom: 4px; font-size: 0.9em; opacity: 0.9; }
        #snippet-list { list-style: none; margin: 0; padding: 0; max-height: 120px; overflow-y: auto; }
        #snippet-list li {
            padding: 4px 8px; margin: 2px 0; cursor: pointer; border-radius: 4px;
            background: var(--vscode-list-inactiveSelectionBackground);
            font-size: 0.9em;
        }
        #snippet-list li:hover { background: var(--vscode-list-hoverBackground); }
    </style>
</head>
<body>
    <h1>SQL Snippet Master</h1>
    <div class="snippets-wrap">
        <label>Snippets</label>
        <ul id="snippet-list"></ul>
    </div>
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
            var snippetList = document.getElementById('snippet-list');
            vscode.postMessage({ type: 'getSnippetList' });
            runBtn.addEventListener('click', function() {
                var sql = editor.value.trim();
                results.textContent = 'Running...';
                runBtn.disabled = true;
                vscode.postMessage({ type: 'runSql', sql: sql || 'SELECT 1' });
            });
            window.addEventListener('message', function(e) {
                var msg = e.data;
                if (msg.type === 'snippetList') {
                    var list = msg.snippets || [];
                    snippetList.innerHTML = '';
                    list.forEach(function(s) {
                        var li = document.createElement('li');
                        li.textContent = s.name + (s.tags && s.tags.length ? ' [' + s.tags.join(', ') + ']' : '');
                        li.dataset.id = s.id;
                        li.addEventListener('click', function() { vscode.postMessage({ type: 'loadSnippet', id: s.id }); });
                        snippetList.appendChild(li);
                    });
                    return;
                }
                if (msg.type === 'snippet') {
                    editor.value = msg.code || '';
                    return;
                }
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
