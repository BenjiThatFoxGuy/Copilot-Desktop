// Preload script for Copilot Desktop
// No-op, but required for contextIsolation and executeJavaScript to work safely

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openLogoContextMenu: () => ipcRenderer.send('logo-context-menu'),
  saveSettings: (settings) => ipcRenderer.send('save-settings', settings)
});
// Add more secure APIs as needed
