const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

const BACKEND_PORT = parseInt(process.env.PHARMAGESTION_PORT || '8765', 10);
const BACKEND_HOST = '127.0.0.1';

function getDataDir() {
  const { app } = require('electron');
  const dataDir = path.join(app.getPath('userData'), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  return dataDir;
}

function resolveBackendExecutable() {
  const { app } = require('electron');
  const candidates = [
    path.join(process.resourcesPath, 'backend', 'backend.exe'),
    path.join(app.getAppPath(), 'backend', 'dist', 'backend.exe'),
    path.join(__dirname, '..', 'backend', 'dist', 'backend.exe'),
  ];
  for (const exe of candidates) {
    if (fs.existsSync(exe)) return exe;
  }
  return null;
}

function waitForPort(port, host = BACKEND_HOST, timeout = 90000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error(`Backend not ready on ${host}:${port}`));
        } else {
          setTimeout(check, 500);
        }
      });
      socket.connect(port, host);
    };
    check();
  });
}

function attachBackendLogs(child) {
  child.stdout?.on('data', (d) => process.stdout.write(`[backend] ${d}`));
  child.stderr?.on('data', (d) => process.stderr.write(`[backend] ${d}`));
  child.on('error', (err) => console.error('[backend spawn error]', err.message));
}

function startBackend(isDev = false) {
  const addr = `${BACKEND_HOST}:${BACKEND_PORT}`;
  const dataDir = getDataDir();
  const env = {
    ...process.env,
    PHARMAGESTION_DATA_DIR: dataDir,
    DJANGO_DEBUG: isDev ? 'True' : 'False',
  };

  if (!isDev) {
    const exe = resolveBackendExecutable();
    if (!exe) {
      console.error('backend.exe introuvable. resourcesPath:', process.resourcesPath);
      return { child: null, port: BACKEND_PORT, error: 'BACKEND_NOT_FOUND' };
    }

    const child = spawn(exe, ['runserver', addr], {
      cwd: path.dirname(exe),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    attachBackendLogs(child);
    return { child, port: BACKEND_PORT };
  }

  const backendDir = path.join(__dirname, '..', 'backend');
  const venvPython = path.join(backendDir, 'venv', 'Scripts', 'python.exe');
  const python = fs.existsSync(venvPython) ? venvPython : 'py';
  const args = fs.existsSync(venvPython)
    ? [path.join(backendDir, 'run_backend.py'), 'runserver', addr]
    : ['-3.12', path.join(backendDir, 'run_backend.py'), 'runserver', addr];

  const child = spawn(python, args, {
    cwd: backendDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  attachBackendLogs(child);
  return { child, port: BACKEND_PORT };
}

function getApiUrl() {
  return `http://${BACKEND_HOST}:${BACKEND_PORT}/api/`;
}

module.exports = { startBackend, waitForPort, getApiUrl, BACKEND_PORT };
