// Preload script for Copilot Desktop
// No-op, but required for contextIsolation and executeJavaScript to work safely

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openLogoContextMenu: () => ipcRenderer.send('logo-context-menu')
});
// Add more secure APIs as needed
