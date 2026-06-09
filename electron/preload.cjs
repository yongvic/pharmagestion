const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getApiUrl: () => ipcRenderer.invoke('get-api-url'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  isElectron: true,
  platform: process.platform,
  printReceipt: () => ipcRenderer.invoke('print-receipt'),
});
