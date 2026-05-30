const vscode = require('vscode');
const http = require('http');
const fs = require('fs');
const path = require('path');

const GAME_DIST = path.join(__dirname, 'game', 'dist');
const PORT = 1986;

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
  '.wasm': 'application/wasm',
  '.mp4':  'video/mp4',
  '.webp': 'image/webp',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gz':   'application/gzip',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

let server;

function startServer() {
  server = http.createServer((req, res) => {
    const urlPath = req.url.split('?')[0];
    const filePath = path.join(GAME_DIST, urlPath === '/' ? 'index.html' : urlPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const headers = {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      };

      if (ext === '.html') {
        const inject = `<style>
::-webkit-scrollbar { display: none; }
* { scrollbar-width: none; -ms-overflow-style: none; }
</style>
<script>
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.href;
  if (href && (href.startsWith('http://') || href.startsWith('https://')) && !href.startsWith('http://127.0.0.1')) {
    e.preventDefault();
    window.parent.postMessage({ type: 'openExternal', url: href }, '*');
  }
});
</script>`;
        const patched = data.toString().replace('</body>', inject + '\n</body>');
        headers['Content-Length'] = Buffer.byteLength(patched);
        res.writeHead(200, headers);
        res.end(patched);
        return;
      }

      res.writeHead(200, headers);
      res.end(data);
    });
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`ViceCode server running on http://127.0.0.1:${PORT}`);
  });

  server.on('error', (err) => {
    vscode.window.showErrorMessage(`ViceCode: no se pudo iniciar el servidor en el puerto ${PORT}. ${err.message}`);
  });
}

class ViceCodeViewProvider {
  static viewType = 'vicecode.gameView';

  constructor(extensionUri) {
    this._extensionUri = extensionUri;
  }

  resolveWebviewView(webviewView) {
    const codiconUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')
    );
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode', 'codicons', 'dist')
      ]
    };
    webviewView.webview.html = this._getHtml(codiconUri);
    webviewView.webview.onDidReceiveMessage(msg => {
      if (msg.type === 'openExternal' && msg.url) {
        vscode.env.openExternal(vscode.Uri.parse(msg.url));
      }
      if (msg.type === 'close') {
        vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
      }
    });
  }

  _getHtml(codiconUri) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="stylesheet" href="${codiconUri}" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' http://127.0.0.1:${PORT}; frame-src http://127.0.0.1:${PORT}; script-src 'unsafe-inline'; style-src 'unsafe-inline' vscode-resource:; font-src vscode-resource:;" />
  <style>
    * { margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    #game { display: block; border: none; }
    #toolbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      padding: 0 1rem;
      background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 9999;
    }
    #toolbar:hover { opacity: 1; }
    #toolbar button {
      background: rgba(255,255,255,0.15);
      border: none;
      color: #fff;
      font-size: 14px;
      width: 26px; height: 26px;
      border-radius: 4px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    #toolbar button:hover { background: rgba(255,255,255,0.3); }
  </style>
</head>
<body>
  <iframe id="game" src="http://127.0.0.1:${PORT}" allow="cross-origin-isolated; fullscreen; autoplay"></iframe>
  <div id="toolbar">
    <button id="btn-restart" title="Restart"><i class="codicon codicon-debug-restart"></i></button>
    <button id="btn-close"   title="Close"><i class="codicon codicon-close"></i></button>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    const frame  = document.getElementById('game');
    const root   = document.documentElement;

    function fit(w, h) {
      frame.style.width  = w + 'px';
      frame.style.height = h + 'px';
    }
    new ResizeObserver(([{ contentRect }]) => {
      fit(contentRect.width, contentRect.height);
    }).observe(root);
    fit(root.clientWidth, root.clientHeight);

    document.getElementById('btn-restart').addEventListener('click', () => {
      frame.src = frame.src;
    });

    document.getElementById('btn-close').addEventListener('click', () => {
      vscode.postMessage({ type: 'close' });
    });

    window.addEventListener('message', e => {
      if (e.data && e.data.type === 'openExternal') {
        vscode.postMessage({ type: 'openExternal', url: e.data.url });
      }
    });
  </script>
</body>
</html>`;
  }
}

function activate(context) {
  startServer();

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ViceCodeViewProvider.viewType,
      new ViceCodeViewProvider(context.extensionUri),
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
}

function deactivate() {
  if (server) server.close();
}

module.exports = { activate, deactivate };
