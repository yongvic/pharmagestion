const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { startBackend, waitForPort, getApiUrl } = require('./backend-manager.cjs');

const isDev = !app.isPackaged;
let mainWindow = null;
let backendProcess = null;

function getIndexPath() {
  if (isDev) return null;
  const candidates = [
    path.join(__dirname, '..', 'frontend', 'dist', 'index.html'),
    path.join(process.resourcesPath, 'app.asar', 'frontend', 'dist', 'index.html'),
  ];
  for (const p of candidates) {
    try {
      require('fs').accessSync(p);
      return p;
    } catch {
      // continue
    }
  }
  return path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: 'PharmaGestion',
    backgroundColor: '#f8fafc',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(getIndexPath());
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function bootstrap() {
  if (isDev) {
    try {
      await waitForPort(8765);
    } catch (err) {
      console.error('Backend non disponible:', err.message);
    }
  } else {
    const result = startBackend(false);
    if (!result.child) {
      dialog.showErrorBox(
        'PharmaGestion — Erreur',
        'Le serveur interne (backend.exe) est introuvable.\n\nRéinstallez l\'application ou contactez le support.'
      );
      app.quit();
      return;
    }
    backendProcess = result.child;
    backendProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) console.error(`Backend exited with code ${code}`);
    });
    try {
      await waitForPort(8765, '127.0.0.1', 120000);
    } catch (err) {
      dialog.showErrorBox(
        'PharmaGestion — Erreur',
        'Le serveur n\'a pas démarré à temps.\n\nVérifiez qu\'aucun antivirus ne bloque backend.exe, puis relancez l\'application.'
      );
      app.quit();
      return;
    }
  }

  createWindow();
}

app.whenReady().then(bootstrap);

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});

ipcMain.handle('get-api-url', () => getApiUrl());
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('print-receipt', () => {
  if (mainWindow) mainWindow.webContents.print({ silent: false });
});
