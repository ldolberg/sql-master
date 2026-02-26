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

    private getHtmlForWebview(_webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SQL Snippet Master</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 16px;
            box-sizing: border-box;
        }
        h1 { font-size: 1.1em; margin: 0 0 8px 0; }
        p { margin: 0; opacity: 0.9; }
    </style>
</head>
<body>
    <h1>SQL Snippet Master</h1>
    <p>Ready.</p>
</body>
</html>`;
    }
}
