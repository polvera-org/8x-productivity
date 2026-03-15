'use strict';

const crypto = require('crypto');
const http = require('http');
const pty = require('node-pty');
const { WebSocketServer } = require('ws');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.WS_PORT, 10) || 8080;
const API_KEY = process.env.WS_API_KEY;
const MAX_CONNECTIONS = parseInt(process.env.WS_MAX_CONNECTIONS, 10) || 5;
const AUTH_TIMEOUT_MS = 5000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_FAILURES = 5;

// ---------------------------------------------------------------------------
// Startup validation
// ---------------------------------------------------------------------------
if (!API_KEY || API_KEY.length < 32) {
  console.error('FATAL: WS_API_KEY must be set and at least 32 characters.');
  process.exit(1);
}

const API_KEY_BUF = Buffer.from(API_KEY);

// ---------------------------------------------------------------------------
// Rate limiting — per-IP failed auth tracking
// ---------------------------------------------------------------------------
const rateLimits = new Map(); // ip -> { count, resetAt }

function isRateLimited(ip) {
  const entry = rateLimits.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    rateLimits.delete(ip);
    return false;
  }
  return entry.count >= RATE_LIMIT_MAX_FAILURES;
}

function recordAuthFailure(ip) {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count++;
  }
}

// ---------------------------------------------------------------------------
// Connection tracking
// ---------------------------------------------------------------------------
let activeConnections = 0;
const allSockets = new Set();

// ---------------------------------------------------------------------------
// HTTP + WebSocket server
// ---------------------------------------------------------------------------
const server = http.createServer((_req, res) => {
  res.writeHead(426, { 'Content-Type': 'text/plain' });
  res.end('WebSocket connections only.\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  allSockets.add(ws);

  // Rate limit check
  if (isRateLimited(ip)) {
    ws.close(4429, 'Rate limited');
    allSockets.delete(ws);
    return;
  }

  // Connection limit check
  if (activeConnections >= MAX_CONNECTIONS) {
    ws.close(1013, 'Max connections reached');
    allSockets.delete(ws);
    return;
  }

  activeConnections++;
  let authenticated = false;
  let shell = null;

  // Auth timeout — must authenticate within 5 seconds
  const authTimer = setTimeout(() => {
    if (!authenticated) {
      ws.close(4408, 'Auth timeout');
    }
  }, AUTH_TIMEOUT_MS);

  // -------------------------------------------------------------------------
  // Message handler
  // -------------------------------------------------------------------------
  ws.on('message', (data, isBinary) => {
    // Before auth: expect JSON auth message
    if (!authenticated) {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type !== 'auth' || typeof msg.token !== 'string') {
          ws.close(4401, 'Auth failed');
          return;
        }

        // Constant-time comparison
        const tokenBuf = Buffer.from(msg.token);
        if (tokenBuf.length !== API_KEY_BUF.length || !crypto.timingSafeEqual(tokenBuf, API_KEY_BUF)) {
          recordAuthFailure(ip);
          ws.send(JSON.stringify({ type: 'auth_fail' }));
          ws.close(4401, 'Auth failed');
          return;
        }

        // Auth success
        clearTimeout(authTimer);
        authenticated = true;
        ws.send(JSON.stringify({ type: 'auth_ok' }));

        // Spawn PTY
        const env = { ...process.env };
        env.SOLOHACKER_TOKEN = env.WS_API_KEY;
        delete env.WS_API_KEY;

        shell = pty.spawn('bash', [], {
          name: 'xterm-256color',
          cols: 80,
          rows: 24,
          cwd: '/root/workspace',
          env,
        });

        shell.onData((output) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(Buffer.from(output), { binary: true });
          }
        });

        shell.onExit(({ exitCode }) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'exit', code: exitCode }));
            ws.close(1000, 'Shell exited');
          }
        });
      } catch {
        ws.close(4401, 'Auth failed');
      }
      return;
    }

    // After auth: route messages
    if (isBinary) {
      // Binary frame → PTY stdin
      if (shell) shell.write(data.toString());
    } else {
      // Text frame → control message
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'resize' && typeof msg.cols === 'number' && typeof msg.rows === 'number') {
          if (shell) shell.resize(Math.max(1, msg.cols), Math.max(1, msg.rows));
        } else if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch {
        // Ignore malformed JSON after auth
      }
    }
  });

  // -------------------------------------------------------------------------
  // Cleanup on close
  // -------------------------------------------------------------------------
  ws.on('close', () => {
    clearTimeout(authTimer);
    activeConnections--;
    allSockets.delete(ws);
    if (shell) {
      try { shell.kill(); } catch { /* already dead */ }
      shell = null;
    }
  });

  ws.on('error', (err) => {
    console.error(`[ws] error from ${ip}:`, err.message);
  });
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
function shutdown(signal) {
  console.log(`\n[ws-server] ${signal} received, shutting down...`);
  wss.close(() => {
    server.close(() => {
      console.log('[ws-server] Stopped.');
      process.exit(0);
    });
  });
  // Close all active sockets
  for (const ws of allSockets) {
    ws.close(1001, 'Server shutting down');
  }
  // Force exit after 5s
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
server.listen(PORT, () => {
  console.log(`[ws-server] Listening on ws://0.0.0.0:${PORT}`);
  console.log(`[ws-server] Max connections: ${MAX_CONNECTIONS}`);
});
