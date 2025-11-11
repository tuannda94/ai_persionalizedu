/**
 * Electron Main Process
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { startBackend, stopBackend } = require('./backend_launcher');
const { initUpdater } = require('./updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Ẩn cửa sổ cho đến khi content sẵn sàng
    backgroundColor: '#f5f5f5', // Màu nền để tránh màn hình trắng
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // sandbox: false allows preload to expose Node.js modules
      sandbox: false,
      // Enable DevTools for debugging
      devTools: true
    },
    icon: path.join(__dirname, '../../resources/icons/icon.png')
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Hiển thị cửa sổ khi content đã sẵn sàng
  mainWindow.once('ready-to-show', () => {
    console.log('✅ Window ready to show');
    mainWindow.show();
  });

  // Fallback: Force show window after 3 seconds if ready-to-show didn't fire
  setTimeout(() => {
    if (!mainWindow.isVisible()) {
      console.log('⚠️  Force showing window (ready-to-show timeout)');
      mainWindow.show();
    }
  }, 3000);

  // Log errors from renderer
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Failed to load:', errorCode, errorDescription, validatedURL);
    // Show window even if load failed
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level === 3) { // Error level
      console.error('Renderer error:', message, 'at', sourceId, ':', line);
    }
  });

  // Log when DOM is ready
  mainWindow.webContents.on('dom-ready', () => {
    console.log('✅ DOM ready');
  });

  // Load app immediately, don't wait for backend
  // Backend will start in background and app will show "offline" until it's ready
  mainWindow.loadFile(path.join(__dirname, '../../index.html'));

  // Initialize auto-updater
  initUpdater(mainWindow);

  // Start backend in background (non-blocking)
  startBackend()
    .then(() => {
      console.log('✅ Backend started successfully from Electron');
    })
    .catch((error) => {
      console.error('❌ Failed to start backend:', error);
      console.log('⚠️  Backend may start later, app will show offline status...');
    });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopBackend();
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

// Handle backend errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

