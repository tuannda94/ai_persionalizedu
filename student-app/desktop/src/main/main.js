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
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../../resources/icons/icon.png')
  });

  // Start backend trước khi load app
  startBackend()
    .then(() => {
      console.log('✅ Backend started successfully from Electron');

      // Wait a bit for backend to be fully ready
      setTimeout(() => {
        // Load app sau khi backend ready
        mainWindow.loadFile(path.join(__dirname, '../../index.html'));

        // Initialize auto-updater sau khi window ready
        initUpdater(mainWindow);
      }, 2000);
    })
    .catch((error) => {
      console.error('❌ Failed to start backend:', error);
      console.log('⚠️  Loading app anyway, backend may start later...');

      // Vẫn load app, nhưng sẽ hiển thị error
      mainWindow.loadFile(path.join(__dirname, '../../index.html'));

      // Initialize auto-updater ngay cả khi backend fail
      initUpdater(mainWindow);
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

