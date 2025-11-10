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
  getVersion: () => {
    // Get app version from package.json
    try {
      const pkg = require('../../package.json');
      return pkg.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  },

  // Update handlers
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, data) => callback(data));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-progress', (event, data) => callback(data));
  },
});

