const { execSync } = require('child_process');

const PORTS = [3000, 5000, 5001, 5002, 5003];

function killOnWindows(port) {
  try {
    const output = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
    const lines = output.split(/\r?\n/);
    const pids = new Set();

    for (const line of lines) {
      const normalized = line.trim().replace(/\s+/g, ' ');
      if (!normalized) continue;

      const parts = normalized.split(' ');
      if (parts.length < 5) continue;

      const localAddress = parts[1] || '';
      const state = parts[3] || '';
      const pid = parts[4] || '';

      if (!localAddress.endsWith(`:${port}`)) continue;
      if (state.toUpperCase() !== 'LISTENING') continue;
      if (!/^\d+$/.test(pid)) continue;

      pids.add(pid);
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[dev] Freed port ${port} by stopping PID ${pid}`);
      } catch {
        // Ignore race conditions where the process exits between checks.
      }
    }
  } catch {
    // Ignore; dev startup will surface real issues if any remain.
  }
}

function killOnUnix(port) {
  try {
    const pids = execSync(`lsof -ti:${port}`, { encoding: 'utf8' })
      .split(/\r?\n/)
      .map((pid) => pid.trim())
      .filter(Boolean);

    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        console.log(`[dev] Freed port ${port} by stopping PID ${pid}`);
      } catch {
        // Ignore race conditions where the process exits between checks.
      }
    }
  } catch {
    // Ignore missing lsof/no listener.
  }
}

for (const port of PORTS) {
  if (process.platform === 'win32') {
    killOnWindows(port);
  } else {
    killOnUnix(port);
  }
}
