
import * as vscode from 'vscode';

/**
 * Activates the extension. 
 * This is the entry point for VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    const extensionUri = vscode.Uri.file(context.extensionPath);
    const provider = new SqlSnippetMasterProvider(extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('sqlSnippetMasterView', provider)
    );

    console.log('SQL Snippet Master is now active.');
}

/**
 * Provider for the SQL Snippet Master sidebar view.
 */
class SqlSnippetMasterProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        const messageDisposable = webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'showError':
                    vscode.window.showErrorMessage(data.value);
                    return;
                case 'showInfo':
                    vscode.window.showInformationMessage(data.value);
                    return;
            }
        });

        webviewView.onDidDispose(() => {
            messageDisposable.dispose();
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'index.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'index.css')
        );
        const nonce = getNonce();
        const csp = `default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource}; connect-src https://generativelanguage.googleapis.com;`;

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="stylesheet" href="${styleUri}">
<title>SQL Snippet Master</title>
</head>
<body>
<div id="root"></div>
<script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

export function deactivate() {}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
