/**
 * Auto-update mechanism for Electron app
 */
const { autoUpdater } = require('electron-updater');
const { ipcMain, dialog } = require('electron');
const log = require('electron-log');

// Configure auto-updater
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Update server URL (from environment or config)
const UPDATE_SERVER_URL = process.env.UPDATE_SERVER_URL || 'https://api.fpt.edu.vn';

let mainWindow = null;
let updateCheckInterval = null;

/**
 * Initialize auto-updater
 */
function initUpdater(window) {
  mainWindow = window;

  // Check for updates on startup
  checkForUpdates();

  // Check for updates periodically (every hour)
  updateCheckInterval = setInterval(() => {
    checkForUpdates();
  }, 3600000); // 1 hour

  // Setup event handlers
  setupUpdaterEvents();
}

/**
 * Setup auto-updater event handlers
 */
function setupUpdaterEvents() {
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
    mainWindow?.webContents.send('update-status', { status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    mainWindow?.webContents.send('update-status', {
      status: 'available',
      version: info.version,
      releaseNotes: info.releaseNotes
    });

    // Show notification
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available.`,
      detail: 'The update will be downloaded in the background.',
      buttons: ['OK']
    });
  });

  autoUpdater.on('update-not-available', () => {
    log.info('Update not available');
    mainWindow?.webContents.send('update-status', { status: 'not-available' });
  });

  autoUpdater.on('error', (error) => {
    log.error('Update error:', error);
    mainWindow?.webContents.send('update-status', {
      status: 'error',
      error: error.message
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    log.info('Download progress:', progress.percent);
    mainWindow?.webContents.send('update-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    mainWindow?.webContents.send('update-status', {
      status: 'downloaded',
      version: info.version
    });

    // Ask user to restart
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The application will restart to apply the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}

/**
 * Get auth token from secure storage (if available)
 */
function getAuthToken() {
  // TODO: Get from secure storage (electron-store or similar)
  // For now, return empty string (optional auth)
  return '';
}

/**
 * Get version code from version string (e.g., "1.2.3" -> 10203)
 */
function getVersionCode(version) {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3) return 0;
  return parts[0] * 10000 + parts[1] * 100 + parts[2];
}

/**
 * Check for updates manually
 */
async function checkForUpdates() {
  try {
    // Get current version info
    const currentVersion = require('../../package.json').version;

    // Check with backend API
    const headers = {
      'Content-Type': 'application/json'
    };

    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${UPDATE_SERVER_URL}/api/v1/updates/check`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        platform: process.platform === 'win32' ? 'windows' :
                  process.platform === 'darwin' ? 'macos' : 'linux',
        current_version: currentVersion,
        current_version_code: getVersionCode(currentVersion)
      })
    });

    if (response.ok) {
      const data = await response.json();

      if (data.has_update) {
        // Configure auto-updater with download URL
        // electron-updater expects a base URL, not direct download URL
        // For generic provider, we need to set the base URL
        const baseUrl = data.download_url.substring(0, data.download_url.lastIndexOf('/'));
        autoUpdater.setFeedURL({
          provider: 'generic',
          url: baseUrl
        });

        // Set update info manually if needed
        // Note: electron-updater will try to fetch latest.yml/latest-mac.yml/latest.json
        // For now, we'll use the direct download approach

        // Alternative: Use direct download URL
        // We'll need to handle this differently - download manually and install
        log.info(`Update available: ${data.latest_version}`);
        log.info(`Download URL: ${data.download_url}`);

        // For now, use electron-updater's built-in mechanism
        // This requires proper server setup with latest.yml files
        // For MVP, we'll download manually
        mainWindow?.webContents.send('update-status', {
          status: 'available',
          version: data.latest_version,
          releaseNotes: data.release_notes,
          downloadUrl: data.download_url,
          isMandatory: data.is_mandatory,
          fileSize: data.file_size
        });

        // If mandatory, force update
        if (data.is_mandatory) {
          // Block app usage until update is installed
          mainWindow?.webContents.send('mandatory-update', {
            version: data.latest_version,
            releaseNotes: data.release_notes,
            downloadUrl: data.download_url
          });
        }
      }
    }
  } catch (error) {
    log.error('Error checking for updates:', error);
  }
}

/**
 * Get version code from version string
 * e.g., "1.2.3" -> 123
 */
function getVersionCode(version) {
  const parts = version.split('.').map(Number);
  return parts[0] * 10000 + parts[1] * 100 + parts[2];
}

/**
 * Get auth token from secure storage
 */
function getAuthToken() {
  // TODO: Get from secure storage (keytar or similar)
  return null;
}

/**
 * Log update progress to backend
 */
async function logUpdateProgress(status, fromVersion, toVersion, error = null) {
  try {
    await fetch(`${UPDATE_SERVER_URL}/api/v1/updates/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        from_version: fromVersion,
        to_version: toVersion,
        platform: process.platform === 'win32' ? 'windows' :
                  process.platform === 'darwin' ? 'macos' : 'linux',
        status: status,
        error_message: error
      })
    });
  } catch (error) {
    log.error('Error logging update progress:', error);
  }
}

// IPC handlers
ipcMain.handle('check-for-updates', async () => {
  await checkForUpdates();
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

module.exports = {
  initUpdater,
  checkForUpdates,
  logUpdateProgress
};

