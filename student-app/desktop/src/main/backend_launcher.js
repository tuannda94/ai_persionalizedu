/**
 * Backend Launcher
 * Quản lý việc khởi động và dừng Python backend
 */
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

let backendProcess = null;
const BACKEND_PORT = 8000;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

/**
 * Lấy đường dẫn và command để chạy backend
 */
function getBackendConfig() {
  const { app } = require('electron');
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const platform = process.platform;

  if (isDev) {
    // Development: chạy Python trực tiếp
    // __dirname = student-app/desktop/src/main
    // local-backend = student-app/local-backend (need to go up 3 levels: main -> src -> desktop -> student-app, then down to local-backend)
    const backendPath = path.join(__dirname, '../../../local-backend');

    // Find python3 - try common locations
    let pythonCmd = 'python3';
    try {
      // Try to find python3 in PATH
      execSync('which python3', { stdio: 'ignore' });
    } catch {
      // If not in PATH, try common macOS locations
      const possiblePaths = [
        '/usr/local/bin/python3',
        '/opt/homebrew/bin/python3',
        '/usr/bin/python3'
      ];
      for (const pyPath of possiblePaths) {
        try {
          fs.accessSync(pyPath);
          pythonCmd = pyPath;
          break;
        } catch {}
      }
    }

    // Try to use venv python if exists (preferred)
    const venvPython = path.join(backendPath, '.venv', 'bin', 'python');
    if (fs.existsSync(venvPython)) {
      pythonCmd = venvPython;
      console.log(`Using venv python: ${pythonCmd}`);
    }

    return {
      command: pythonCmd,
      args: ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', BACKEND_PORT.toString(), '--host', '127.0.0.1'],
      cwd: backendPath,
      env: {
        ...process.env,
        PYTHONPATH: backendPath,
        PATH: process.env.PATH || ''
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
    console.log('⚠️  Backend already running (from Electron)');
    return Promise.resolve();
  }

  return new Promise(async (resolve, reject) => {
    try {
      // First, check if backend is already running and healthy
      const isHealthy = await checkBackendHealth();
      if (isHealthy) {
        console.log('✅ Backend is already running and healthy (from bash script)');
        console.log('   Using existing backend, not starting a new one');
        return resolve();
      }

      // Backend is not healthy, check if port is in use
      try {
        const portCheck = execSync(`lsof -ti :${BACKEND_PORT}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        if (portCheck && portCheck.trim()) {
          const pids = portCheck.trim().split('\n').filter(p => p);
          console.log(`⚠️  Port ${BACKEND_PORT} is in use (PIDs: ${pids.join(', ')}) but not healthy`);
          console.log(`   Killing existing process(es) and starting new one...`);

          // Kill each process
          for (const pid of pids) {
            try {
              execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
              console.log(`   ✅ Killed PID: ${pid}`);
            } catch (e) {
              console.log(`   ⚠️  Could not kill PID ${pid}`);
            }
          }

          // Wait for port to be released
          const start = Date.now();
          while (Date.now() - start < 2000) {
            // Busy wait for 2 seconds
          }

          // Verify port is free
          try {
            const stillInUse = execSync(`lsof -ti :${BACKEND_PORT}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
            if (stillInUse && stillInUse.trim()) {
              console.log(`   ⚠️  Port still in use, trying force kill...`);
              execSync(`lsof -ti :${BACKEND_PORT} | xargs kill -9`, { stdio: 'ignore' });
              // Wait again
              const start2 = Date.now();
              while (Date.now() - start2 < 1000) {}
            }
          } catch (e) {
            // Port is free now
            console.log(`   ✅ Port ${BACKEND_PORT} is now free`);
          }
        }
      } catch (e) {
        // Port is free, continue
        console.log(`   ✅ Port ${BACKEND_PORT} is free, starting new backend...`);
      }

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

        // Check if backend is ready - look for multiple indicators
        if (output.includes('Uvicorn running') ||
            output.includes('Application startup complete') ||
            output.includes('Local Backend started successfully')) {
          if (!startupResolved) {
            startupResolved = true;
            console.log('✅ Backend started successfully!');
            // Wait a bit more and verify health before resolving
            setTimeout(async () => {
              const isHealthy = await checkBackendHealth();
              if (isHealthy) {
                console.log('✅ Backend health verified');
                resolve();
              } else {
                console.log('⚠️  Backend started but health check failed, resolving anyway...');
                resolve();
              }
            }, 2000);
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

      // Timeout fallback - check health endpoint
      setTimeout(async () => {
        if (!startupResolved) {
          // Try to verify backend is actually running by checking health
          try {
            const isHealthy = await checkBackendHealth();
            if (isHealthy) {
              console.log('✅ Backend verified via health check (timeout fallback)');
              startupResolved = true;
              resolve();
            } else {
              console.log('⚠️  Backend process running but health check failed, resolving anyway...');
              startupResolved = true;
              resolve();
            }
          } catch (error) {
            console.log('⚠️  Health check failed in timeout, but process is running. Resolving...');
            startupResolved = true;
            resolve();
          }
        }
      }, 10000); // Increased timeout to 10 seconds

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
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // 5 second timeout
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    // Check both 'ok' and 'status' fields
    return data.ok === true || data.status === 'ok';
  } catch (error) {
    console.error('Backend health check failed:', error);
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

