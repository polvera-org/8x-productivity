# xterm.js Integration Guide

How to connect a web-based terminal (xterm.js) to the 8x-productivity WebSocket shell server.

## Dependencies

```bash
npm install xterm xterm-addon-fit xterm-addon-web-links
```

## JavaScript Example

```js
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';

const WS_URL = 'ws://localhost:8080';
const API_KEY = 'your-api-key-here';

// Create terminal
const term = new Terminal({
  cursorBlink: true,
  fontSize: 14,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.loadAddon(new WebLinksAddon());
term.open(document.getElementById('terminal'));
fitAddon.fit();

// Connect WebSocket
const ws = new WebSocket(WS_URL);
ws.binaryType = 'arraybuffer';

ws.onopen = () => {
  // Authenticate (must be the first message, within 5 seconds)
  ws.send(JSON.stringify({ type: 'auth', token: API_KEY }));
};

ws.onmessage = (event) => {
  if (typeof event.data === 'string') {
    // JSON control message
    const msg = JSON.parse(event.data);

    switch (msg.type) {
      case 'auth_ok':
        term.writeln('Connected.');
        // Send initial size
        ws.send(JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows,
        }));
        break;

      case 'auth_fail':
        term.writeln('\r\nAuthentication failed.');
        break;

      case 'exit':
        term.writeln(`\r\nShell exited with code ${msg.code}.`);
        break;

      case 'pong':
        // Keepalive response
        break;
    }
  } else {
    // Binary frame — terminal output
    term.write(new Uint8Array(event.data));
  }
};

ws.onclose = (event) => {
  term.writeln(`\r\nDisconnected (code ${event.code}).`);
};

ws.onerror = () => {
  term.writeln('\r\nConnection error.');
};

// Forward terminal input to server as binary
term.onData((data) => {
  if (ws.readyState === WebSocket.OPEN) {
    const encoder = new TextEncoder();
    ws.send(encoder.encode(data));
  }
});

// Handle terminal resize
const resizeObserver = new ResizeObserver(() => {
  fitAddon.fit();
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'resize',
      cols: term.cols,
      rows: term.rows,
    }));
  }
});
resizeObserver.observe(document.getElementById('terminal'));
```

## Minimal HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>8x Terminal</title>
  <link rel="stylesheet" href="node_modules/xterm/css/xterm.css">
  <style>
    body { margin: 0; background: #1e1e1e; }
    #terminal { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="terminal"></div>
  <script type="module">
    // Import and use the JavaScript example above
    import { Terminal } from './node_modules/xterm/lib/xterm.mjs';
    import { FitAddon } from './node_modules/xterm-addon-fit/lib/xterm-addon-fit.mjs';

    const term = new Terminal({ cursorBlink: true });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(document.getElementById('terminal'));
    fitAddon.fit();

    const ws = new WebSocket('ws://localhost:8080');
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token: prompt('API Key:') }));
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const msg = JSON.parse(event.data);
        if (msg.type === 'auth_ok') {
          ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
        } else if (msg.type === 'exit') {
          term.writeln(`\r\nExited (${msg.code})`);
        }
      } else {
        term.write(new Uint8Array(event.data));
      }
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(new TextEncoder().encode(data));
      }
    });

    window.addEventListener('resize', () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    });
  </script>
</body>
</html>
```

## Production Considerations

- **Use `wss://`** — terminate TLS at a reverse proxy (nginx, Caddy). See [websocket-server.md](./websocket-server.md#tls) for nginx config.
- **Reconnection** — implement exponential backoff reconnection logic. Re-authenticate on each new connection.
- **Error handling** — check close codes to distinguish auth failures (`4401`), rate limiting (`4429`), and timeouts (`4408`).
- **Keepalive** — send `{"type":"ping"}` periodically if your proxy has idle timeouts. The server responds with `{"type":"pong"}`.
- **Multiple sessions** — each WebSocket connection gets its own isolated PTY. Up to `WS_MAX_CONNECTIONS` concurrent sessions (default 5).
