/**
 * Preload Script
 * Bridge giữa renderer và main process
 */
const { contextBridge, ipcRenderer } = require('electron');

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Backend URL
  getBackendUrl: () => {
    // Trong production, backend chạy local
    // Trong dev, có thể config
    return process.env.BACKEND_URL || 'http://localhost:8000';
  },

  // Platform info
  getPlatform: () => process.platform,

  // App info
  getVersion: () => process.versions.electron,

  // IPC handlers (nếu cần)
  // onBackendStatus: (callback) => ipcRenderer.on('backend-status', callback),
});

