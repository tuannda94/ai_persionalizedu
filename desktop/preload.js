const { contextBridge, ipcRenderer } = require('electron');

// Expose backend URL và helper functions
contextBridge.exposeInMainWorld('electronAPI', {
  getBackendUrl: () => process.env.BACKEND_URL || 'http://localhost:8000',
  platform: process.platform,
});
