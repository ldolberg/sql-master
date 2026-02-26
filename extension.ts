import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const provider = new SqlSnippetMasterProvider(context);

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

function isDestructiveWithoutWhere(sql: string): boolean {
    const lower = sql.toLowerCase().trim();
    const isDestructive = lower.startsWith('update') || lower.startsWith('delete');
    return isDestructive && !lower.includes('where');
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

const SNIPPETS_KEY = 'sqlSnippetMaster.snippets';

class SqlSnippetMasterProvider implements vscode.WebviewViewProvider {
    private _snippets: Snippet[] = [];
    private _loaded = false;

    constructor(private readonly _context: vscode.ExtensionContext) {}

    private loadSnippets(): void {
        if (this._loaded) return;
        this._loaded = true;
        const stored = this._context.globalState.get<Snippet[]>(SNIPPETS_KEY);
        if (stored && Array.isArray(stored) && stored.length > 0) {
            this._snippets = stored;
        } else {
            this._snippets = [...DEFAULT_SNIPPETS];
            this.persistSnippets();
        }
    }

    private persistSnippets(): void {
        void this._context.globalState.update(SNIPPETS_KEY, this._snippets);
    }

    private sendSnippetList(webview: vscode.Webview): void {
        webview.postMessage({
            type: 'snippetList',
            snippets: this._snippets.map((s) => ({ id: s.id, name: s.name, tags: s.tags })),
        });
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this.loadSnippets();
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._context.extensionUri],
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview, this._context.extensionUri);

        webviewView.webview.onDidReceiveMessage((data: {
            type: string; sql?: string; id?: string;
            name?: string; code?: string; tags?: string[];
        }) => {
            if (data.type === 'runSql' && typeof data.sql === 'string') {
                if (isDestructiveWithoutWhere(data.sql)) {
                    webviewView.webview.postMessage({
                        type: 'runConfirm',
                        sql: data.sql,
                        message: 'UPDATE/DELETE without WHERE can affect many rows. Run anyway?',
                    });
                    return;
                }
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
            if (data.type === 'runSqlForce' && typeof data.sql === 'string') {
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
                this.sendSnippetList(webviewView.webview);
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
                return;
            }
            if (data.type === 'addSnippet' && typeof data.name === 'string' && typeof data.code === 'string') {
                const tags = Array.isArray(data.tags) ? data.tags : [];
                const newSnip: Snippet = {
                    id: Date.now().toString(),
                    name: data.name.trim() || 'Untitled',
                    code: data.code,
                    tags,
                };
                this._snippets.push(newSnip);
                this.persistSnippets();
                this.sendSnippetList(webviewView.webview);
                return;
            }
            if (data.type === 'updateSnippet' && typeof data.id === 'string') {
                const idx = this._snippets.findIndex((s) => s.id === data.id);
                if (idx >= 0) {
                    if (typeof data.name === 'string') this._snippets[idx].name = data.name.trim() || 'Untitled';
                    if (typeof data.code === 'string') this._snippets[idx].code = data.code;
                    if (Array.isArray(data.tags)) this._snippets[idx].tags = data.tags;
                    this.persistSnippets();
                    this.sendSnippetList(webviewView.webview);
                }
                return;
            }
            if (data.type === 'deleteSnippet' && typeof data.id === 'string') {
                this._snippets = this._snippets.filter((s) => s.id !== data.id);
                this.persistSnippets();
                this.sendSnippetList(webviewView.webview);
            }
        });
    }

    private getHtmlForWebview(webview: vscode.Webview, _extensionUri: vscode.Uri): string {
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
        .snippet-form { margin-bottom: 10px; }
        .snippet-form label { display: block; margin-bottom: 2px; font-size: 0.85em; opacity: 0.9; }
        .snippet-form input { width: 100%; padding: 4px 8px; margin-bottom: 6px; box-sizing: border-box; font-size: 0.9em; }
        .btn-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
        .btn-row button { padding: 4px 10px; font-size: 0.85em; cursor: pointer; border-radius: 4px; border: none; }
        .btn-row .primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
        .btn-row .secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
        .btn-row .danger { background: var(--vscode-errorForeground); color: var(--vscode-editor-background); }
    </style>
</head>
<body>
    <h1>SQL Snippet Master</h1>
    <div class="snippets-wrap">
        <label>Snippets</label>
        <ul id="snippet-list"></ul>
    </div>
    <div class="snippet-form">
        <label for="snippet-name">Name</label>
        <input type="text" id="snippet-name" placeholder="Snippet name">
        <label for="snippet-tags">Tags (comma-separated)</label>
        <input type="text" id="snippet-tags" placeholder="tag1, tag2">
    </div>
    <div class="btn-row">
        <button type="button" id="save-new-btn" class="primary">Save as new</button>
        <button type="button" id="update-btn" class="secondary">Update</button>
        <button type="button" id="delete-btn" class="danger">Delete</button>
    </div>
    <div class="editor-wrap">
        <label for="sql-editor">SQL</label>
        <textarea id="sql-editor" placeholder="SELECT * FROM ..."></textarea>
    </div>
    <button id="run-btn" type="button">Run</button>
    <div class="results-wrap">
        <label>Results</label>
        <pre id="results">No results yet.</pre>
        <div id="confirm-wrap" style="display:none; margin-top: 8px;">
            <p id="confirm-msg"></p>
            <div class="btn-row">
                <button type="button" id="run-anyway-btn" class="danger">Run anyway</button>
                <button type="button" id="confirm-cancel-btn" class="secondary">Cancel</button>
            </div>
        </div>
    </div>
    <script>
        (function() {
            var vscode = acquireVsCodeApi();
            var editor = document.getElementById('sql-editor');
            var runBtn = document.getElementById('run-btn');
            var results = document.getElementById('results');
            var snippetList = document.getElementById('snippet-list');
            var nameInput = document.getElementById('snippet-name');
            var tagsInput = document.getElementById('snippet-tags');
            var saveNewBtn = document.getElementById('save-new-btn');
            var updateBtn = document.getElementById('update-btn');
            var deleteBtn = document.getElementById('delete-btn');
            var currentSnippetId = null;
            vscode.postMessage({ type: 'getSnippetList' });
            var confirmWrap = document.getElementById('confirm-wrap');
            var confirmMsg = document.getElementById('confirm-msg');
            var runAnywayBtn = document.getElementById('run-anyway-btn');
            var confirmCancelBtn = document.getElementById('confirm-cancel-btn');
            var pendingSql = null;
            runBtn.addEventListener('click', function() {
                var sql = editor.value.trim();
                results.textContent = 'Running...';
                confirmWrap.style.display = 'none';
                runBtn.disabled = true;
                vscode.postMessage({ type: 'runSql', sql: sql || 'SELECT 1' });
            });
            runAnywayBtn.addEventListener('click', function() {
                if (!pendingSql) return;
                confirmWrap.style.display = 'none';
                results.textContent = 'Running...';
                vscode.postMessage({ type: 'runSqlForce', sql: pendingSql });
                pendingSql = null;
            });
            confirmCancelBtn.addEventListener('click', function() {
                confirmWrap.style.display = 'none';
                pendingSql = null;
                results.textContent = 'Cancelled.';
            });
            function tagsArray() {
                var t = (tagsInput.value || '').trim();
                return t ? t.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
            }
            saveNewBtn.addEventListener('click', function() {
                var name = (nameInput.value || '').trim() || 'Untitled';
                vscode.postMessage({ type: 'addSnippet', name: name, code: editor.value, tags: tagsArray() });
            });
            updateBtn.addEventListener('click', function() {
                if (!currentSnippetId) return;
                vscode.postMessage({ type: 'updateSnippet', id: currentSnippetId, name: nameInput.value, code: editor.value, tags: tagsArray() });
            });
            deleteBtn.addEventListener('click', function() {
                if (!currentSnippetId) return;
                vscode.postMessage({ type: 'deleteSnippet', id: currentSnippetId });
                currentSnippetId = null;
                nameInput.value = '';
                tagsInput.value = '';
                editor.value = '';
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
                    currentSnippetId = msg.id;
                    nameInput.value = msg.name || '';
                    tagsInput.value = (msg.tags || []).join(', ');
                    editor.value = msg.code || '';
                    return;
                }
                if (msg.type === 'runConfirm') {
                    runBtn.disabled = false;
                    pendingSql = msg.sql;
                    confirmMsg.textContent = msg.message || 'Run this query anyway?';
                    confirmWrap.style.display = 'block';
                    results.textContent = 'Destructive query detected.';
                    return;
                }
                if (msg.type !== 'runResult') return;
                runBtn.disabled = false;
                confirmWrap.style.display = 'none';
                pendingSql = null;
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
