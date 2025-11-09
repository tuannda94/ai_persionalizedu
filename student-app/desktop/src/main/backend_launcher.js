/**
 * Backend Launcher
 * Quản lý việc khởi động và dừng Python backend
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let backendProcess = null;
const BACKEND_PORT = 8000;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

/**
 * Lấy đường dẫn và command để chạy backend
 */
function getBackendConfig() {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const platform = process.platform;

  if (isDev) {
    // Development: chạy Python trực tiếp
    const backendPath = path.join(__dirname, '../../../backend');
    return {
      command: 'python3',
      args: ['-m', 'uvicorn', 'app.main:app', '--port', BACKEND_PORT.toString(), '--host', '127.0.0.1'],
      cwd: backendPath,
      env: {
        ...process.env,
        PYTHONPATH: backendPath
      }
    };
  } else {
    // Production: chạy executable
    let executable;
    const resourcesPath = process.resourcesPath || path.join(process.execPath, '..', '..', 'resources');

    if (platform === 'win32') {
      executable = path.join(resourcesPath, 'backend', 'ai-learning-backend.exe');
    } else {
      executable = path.join(resourcesPath, 'backend', 'ai-learning-backend');
    }

    // Check if executable exists
    if (!fs.existsSync(executable)) {
      throw new Error(`Backend executable not found: ${executable}`);
    }

    return {
      command: executable,
      args: [],
      cwd: path.dirname(executable),
      env: {
        ...process.env,
        PORT: BACKEND_PORT.toString()
      }
    };
  }
}

/**
 * Khởi động backend
 */
function startBackend() {
  if (backendProcess) {
    console.log('⚠️  Backend already running');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    try {
      const config = getBackendConfig();

      console.log(`🚀 Starting backend: ${config.command} ${config.args.join(' ')}`);
      console.log(`   Working directory: ${config.cwd}`);

      backendProcess = spawn(config.command, config.args, {
        cwd: config.cwd,
        env: config.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false
      });

      let startupResolved = false;

      backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[Backend] ${output.trim()}`);

        // Check if backend is ready
        if (output.includes('Uvicorn running') || output.includes('Application startup complete')) {
          if (!startupResolved) {
            startupResolved = true;
            console.log('✅ Backend started successfully!');
            resolve();
          }
        }
      });

      backendProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`[Backend Error] ${error.trim()}`);
      });

      backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
        backendProcess = null;

        if (!startupResolved && code !== 0) {
          reject(new Error(`Backend exited with code ${code}`));
        }
      });

      backendProcess.on('error', (error) => {
        console.error(`❌ Failed to start backend: ${error.message}`);
        backendProcess = null;
        reject(error);
      });

      // Timeout fallback
      setTimeout(() => {
        if (!startupResolved) {
          // Assume started if no error after 5 seconds
          startupResolved = true;
          resolve();
        }
      }, 5000);

    } catch (error) {
      console.error(`❌ Error starting backend: ${error.message}`);
      reject(error);
    }
  });
}

/**
 * Dừng backend
 */
function stopBackend() {
  if (backendProcess) {
    console.log('🛑 Stopping backend...');
    backendProcess.kill('SIGTERM');

    // Force kill after 5 seconds
    setTimeout(() => {
      if (backendProcess) {
        console.log('⚠️  Force killing backend...');
        backendProcess.kill('SIGKILL');
      }
    }, 5000);

    backendProcess = null;
  }
}

/**
 * Kiểm tra backend có đang chạy không
 */
async function checkBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Lấy backend URL
 */
function getBackendUrl() {
  return BACKEND_URL;
}

module.exports = {
  startBackend,
  stopBackend,
  checkBackendHealth,
  getBackendUrl,
  getBackendPort: () => BACKEND_PORT
};

