/**
 * Preload Script
 * Bridge giữa renderer và main process
 */
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const url = require('url');
const process = require('process');
const fs = require('fs');
const util = require('util');
const stream = require('stream');
const buffer = require('buffer');
const crypto = require('crypto');
const os = require('os');
const assert = require('assert');
const constants = require('constants');
const events = require('events');
const http = require('http');
const https = require('https');
const net = require('net');
const tls = require('tls');
const zlib = require('zlib');

// Create a require polyfill for node: modules
// This is needed because webpack externalizes node: modules
// and they need to be available at runtime
const nodeModulesMap = {
  'node:path': path,
  'node:url': url,
  'node:process': process,
  'node:fs': fs,
  'node:util': util,
  'node:stream': stream,
  'node:buffer': buffer,
  'node:crypto': crypto,
  'node:os': os,
  'node:assert': assert,
  'node:constants': constants,
  'node:events': events,
  'node:http': http,
  'node:https': https,
  'node:net': net,
  'node:tls': tls,
  'node:zlib': zlib
};

// Expose require polyfill for node: modules
// This will be used by webpack externalized modules
contextBridge.exposeInMainWorld('__node_require__', function(moduleName) {
  if (nodeModulesMap[moduleName]) {
    return nodeModulesMap[moduleName];
  }
  // Fallback: try to require without node: prefix
  const withoutPrefix = moduleName.replace(/^node:/, '');
  if (nodeModulesMap[`node:${withoutPrefix}`]) {
    return nodeModulesMap[`node:${withoutPrefix}`];
  }
  throw new Error(`Module ${moduleName} not available`);
});

// Also expose as require for compatibility
// Note: This is safe because we only expose specific modules
if (typeof window !== 'undefined') {
  // This will be available in the renderer context
  window.__electron_require__ = function(moduleName) {
    if (moduleName.startsWith('node:')) {
      return window.__node_require__(moduleName);
    }
    throw new Error(`Cannot require ${moduleName} in renderer`);
  };
}

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Backend URL
  getBackendUrl: () => {
    // Trong production, backend chạy local
    // Trong dev, có thể config
    return process.env.BACKEND_URL || 'http://localhost:8000';
  },

  // Remote API URL
  getRemoteApiUrl: () => {
    // Remote API URL cho authentication, telemetry, updates
    return process.env.REMOTE_API_URL || 'http://localhost:8001';
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

  // Learning Package handlers
  installLearningPackage: (packageData) => ipcRenderer.invoke('install-learning-package', packageData),
  onLearningPackageUpdate: (callback) => {
    ipcRenderer.on('learning-package-update', (event, data) => callback(data));
  },
});
