const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const interactiveSessions = new Map();

function buildSessionId() {
  return crypto.randomUUID();
}

// BUG FIX: "python" doesn't exist on Debian/Ubuntu-based hosts (Render, Docker, most CI).
// Those environments only ship "python3". Windows dev machines typically only have
// "python" (the py launcher aliases python3 there). This picks the right one per platform
// instead of hardcoding "python", which is what caused "spawn python ENOENT" on Render/Vercel.
function pythonExecutable() {
  return process.platform === 'win32' ? 'python' : 'python3';
}

function startInteractiveSession({ language, code }) {
  return new Promise((resolve) => {
    const sessionId = buildSessionId();
    const tmpDir = os.tmpdir();
    const session = {
      id: sessionId,
      language: (language || '').toLowerCase(),
      output: '',
      lastReadIndex: 0,
      status: 'starting',
      child: null,
      filePath: null,
      classFile: null
    };
    interactiveSessions.set(sessionId, session);

    const finalize = (exitCode, error) => {
      session.status = error ? 'error' : 'completed';
      session.exitCode = exitCode ?? 0;
      if (session.child && !session.child.killed) {
        try { session.child.stdin.end(); } catch (_) {}
      }
      if (session.filePath) {
        try { fs.unlinkSync(session.filePath); } catch (_) {}
      }
      if (session.classFile) {
        try { fs.unlinkSync(session.classFile); } catch (_) {}
      }
    };

    const attachChild = (child) => {
      session.child = child;
      session.status = 'running';
      child.stdout.on('data', chunk => {
        session.output += chunk.toString();
      });
      child.stderr.on('data', chunk => {
        session.output += chunk.toString();
      });
      child.on('error', err => {
        session.output += `\n${err.message}`;
        finalize(1, true);
      });
      child.on('close', exitCode => {
        finalize(exitCode, exitCode !== 0);
      });
    };

    if (session.language === 'python') {
      const filePath = path.join(tmpDir, `codapt_${Date.now()}_${Math.random().toString(16).slice(2)}.py`);
      session.filePath = filePath;
      fs.writeFileSync(filePath, code, 'utf8');
      attachChild(spawn(pythonExecutable(), ['-u', filePath], { cwd: tmpDir, stdio: ['pipe', 'pipe', 'pipe'] }));
      resolve({ sessionId, output: '', status: 'running' });
      return;
    }

    if (session.language === 'javascript') {
      const filePath = path.join(tmpDir, `codapt_${Date.now()}_${Math.random().toString(16).slice(2)}.js`);
      session.filePath = filePath;
      fs.writeFileSync(filePath, code, 'utf8');
      attachChild(spawn('node', [filePath], { cwd: tmpDir, stdio: ['pipe', 'pipe', 'pipe'] }));
      resolve({ sessionId, output: '', status: 'running' });
      return;
    }

    if (session.language === 'java') {
      const classMatch = code.match(/public\s+class\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
      const className = classMatch ? classMatch[1] : 'Main';
      const sessionDir = fs.mkdtempSync(path.join(tmpDir, 'codapt_java_'));
      const filePath = path.join(sessionDir, `${className}.java`);
      const classFile = path.join(sessionDir, `${className}.class`);
      session.filePath = filePath;
      session.classFile = classFile;
      session.tempDir = sessionDir;
      fs.writeFileSync(filePath, code, 'utf8');

      const compileChild = spawn('javac', [filePath], { cwd: sessionDir, stdio: ['pipe', 'pipe', 'pipe'] });
      compileChild.stdout.on('data', chunk => {
        session.output += chunk.toString();
      });
      compileChild.stderr.on('data', chunk => {
        session.output += chunk.toString();
      });
      compileChild.on('error', err => {
        session.output += `\n${err.message}`;
        finalize(1, true);
        resolve({ sessionId, output: session.output, status: session.status });
      });
      compileChild.on('close', exitCode => {
        if (exitCode !== 0) {
          session.output += '\nCompilation failed';
          finalize(exitCode, true);
          resolve({ sessionId, output: session.output, status: session.status });
          return;
        }
        attachChild(spawn('java', ['-cp', sessionDir, className], { cwd: sessionDir, stdio: ['pipe', 'pipe', 'pipe'] }));
        resolve({ sessionId, output: session.output, status: session.status });
      });
      return;
    }

    session.status = 'error';
    session.output = `Unsupported language: ${language}`;
    resolve({ sessionId, output: session.output, status: session.status });
  });
}

function writeToInteractiveSession(sessionId, input) {
  const session = interactiveSessions.get(sessionId);
  if (!session) {
    return { error: true, message: 'Session not found', output: '', status: 'idle' };
  }
  if (!session.child || session.status !== 'running') {
    return { error: true, message: 'Session is not running', output: session.output.slice(session.lastReadIndex), status: session.status };
  }
  const payload = typeof input === 'string' ? input : '';
  if (payload) {
    session.child.stdin.write(`${payload}\n`);
  }
  const output = session.output.slice(session.lastReadIndex);
  session.lastReadIndex = session.output.length;
  return { error: false, output, status: session.status };
}

function getInteractiveSessionOutput(sessionId) {
  const session = interactiveSessions.get(sessionId);
  if (!session) {
    return { error: true, output: '', status: 'idle' };
  }
  const output = session.output.slice(session.lastReadIndex);
  session.lastReadIndex = session.output.length;
  return { error: false, output, status: session.status };
}

function removeInteractiveSession(sessionId) {
  const session = interactiveSessions.get(sessionId);
  if (session?.child && !session.child.killed) {
    try { session.child.kill(); } catch (_) {}
  }
  interactiveSessions.delete(sessionId);
}

module.exports = {
  startInteractiveSession,
  writeToInteractiveSession,
  getInteractiveSessionOutput,
  removeInteractiveSession
};