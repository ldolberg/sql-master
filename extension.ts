
import * as vscode from 'vscode';

/**
 * Activates the extension. 
 * This is the entry point for VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    const provider = new SqlSnippetMasterProvider(context.extensionUri);

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

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'showError':
                    vscode.window.showErrorMessage(data.value);
                    return;
                case 'showInfo':
                    vscode.window.showInformationMessage(data.value);
                    return;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // In a real extension build, this would read index.html from disk.
        // For the purpose of this ESM-based demo, we serve a standard shell
        // that initializes the React application.
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SQL Snippet Master</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500&family=Inter:wght@300;400;500;600&display=swap');
                    body {
                        font-family: 'Inter', sans-serif;
                        background-color: #1e1e1e;
                        color: #d4d4d4;
                        margin: 0;
                        padding: 0;
                        overflow: hidden;
                        height: 100vh;
                    }
                    #root { height: 100%; }
                </style>
                <script type="importmap">
                {
                  "imports": {
                    "lucide-react": "https://esm.sh/lucide-react@^0.563.0",
                    "react-dom/": "https://esm.sh/react-dom@^19.2.4/",
                    "react/": "https://esm.sh/react@^19.2.4/",
                    "react": "https://esm.sh/react@^19.2.4",
                    "@google/genai": "https://esm.sh/@google/genai@^1.40.0"
                  }
                }
                </script>
            </head>
            <body>
                <div id="root"></div>
                <!-- This script is a placeholder for the bundled index.js -->
                <script type="module" src="${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'index.js'))}"></script>
            </body>
            </html>
        `;
    }
}

export function deactivate() {}
