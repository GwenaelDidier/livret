const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let backendProcess;

function startBackend() {
  const backendPath = path.join(__dirname, '..', 'backend');
  backendProcess = spawn('npm', ['run', 'start:prod'], {
    cwd: backendPath,
    shell: true,
    env: { ...process.env, PORT: '4200' },
  });

  backendProcess.stdout.on('data', (data) => {
    console.log('[Backend]', data.toString());
  });

  backendProcess.stderr.on('data', (data) => {
    console.error('[Backend ERROR]', data.toString());
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Livret d'évaluation",
    show: true,
  });

  // In production, load built Angular. In dev, load dev server.
  const isDev = !app.isPackaged;
  const url = isDev
    ? 'http://localhost:4200'
    : `file://${path.join(__dirname, '..', 'frontend', 'dist', 'frontend', 'browser', 'index.html')}`;

  mainWindow.loadURL(url);
  mainWindow.maximize();

  // Retry if Angular hasn't bootstrapped yet (app-root is empty)
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents
      .executeJavaScript('document.querySelector("app-root")?.innerHTML?.trim() || ""')
      .then((html) => {
        if (!html) {
          setTimeout(() => mainWindow && mainWindow.webContents.reload(), 2000);
        }
      })
      .catch(() => {});
  });

  // Retry on connection failure (backend/frontend not ready yet)
  mainWindow.webContents.on('did-fail-load', (_e, code, _desc, url) => {
    if (isDev && url.includes('localhost')) {
      setTimeout(() => mainWindow && mainWindow.loadURL(url), 2000);
    }
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url: openUrl }) => {
    if (openUrl.startsWith('http') && !openUrl.includes('localhost')) {
      shell.openExternal(openUrl);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const isDev = !app.isPackaged;
  if (isDev) {
    // In dev mode, backend and frontend are already started externally
    createWindow();
  } else {
    startBackend();
    // Give backend 2s to start before showing window
    setTimeout(createWindow, 2000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});
