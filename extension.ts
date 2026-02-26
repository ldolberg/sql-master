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
            var editor = document.getElementById('sql-editor');
            var runBtn = document.getElementById('run-btn');
            var results = document.getElementById('results');
            runBtn.addEventListener('click', function() {
                results.textContent = 'Run not connected yet. (Phase 3 will connect.)';
            });
        })();
    </script>
</body>
</html>`;
    }
}
