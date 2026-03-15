# WebSocket Shell Server

Authenticated WebSocket server that provides PTY shell access to the 8x-productivity container. Designed for integration with web-based terminal UIs (xterm.js).

## Quick Start

```bash
# Build the image
make docker-build

# Generate a secure API key
export WS_API_KEY=$(openssl rand -hex 32)

# Run the container (detached, port 8080)
make docker-run

# Test with wscat
npm install -g wscat
wscat -c ws://localhost:8080
> {"type":"auth","token":"<your WS_API_KEY>"}
# Should receive: {"type":"auth_ok"}
# Now type shell commands — output streams back as binary frames
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WS_API_KEY` | Yes | — | API key for authentication. Must be at least 32 characters. Server refuses to start without it. |
| `WS_PORT` | No | `8080` | Port the WebSocket server listens on inside the container. |
| `WS_MAX_CONNECTIONS` | No | `5` | Maximum concurrent WebSocket connections. |
| `ANTHROPIC_API_KEY` | No | — | Passed through to shell environment for Claude Code. |
| `OPENAI_API_KEY` | No | — | Passed through to shell environment for Codex/OpenCode. |

## Protocol Reference

### Connection Flow

```
Client                                    Server
  |--- ws://host:8080 --(upgrade)-------->|
  |<-- 101 Switching Protocols -----------|
  |--- {"type":"auth","token":"<key>"} -->|  (must be first message, within 5s)
  |<-- {"type":"auth_ok"} ---------------|  (PTY spawned)
  |                                       |
  |--- binary <terminal input> --------->|  (stdin)
  |<-- binary <terminal output> ---------|  (stdout)
  |--- {"type":"resize","cols":N,"rows":N}->|
  |<-- {"type":"exit","code":N} ---------|  (shell exited)
```

### Message Types

#### Client -> Server

| Type | Format | When |
|------|--------|------|
| Auth | `{"type":"auth","token":"..."}` | Must be the first message, within 5 seconds |
| Terminal input | Binary frame (raw bytes) | After authentication |
| Resize | `{"type":"resize","cols":N,"rows":N}` | When terminal dimensions change |
| Ping | `{"type":"ping"}` | Keepalive check |

#### Server -> Client

| Type | Format | When |
|------|--------|------|
| Auth OK | `{"type":"auth_ok"}` | Successful authentication |
| Auth Fail | `{"type":"auth_fail"}` | Invalid token |
| Terminal output | Binary frame (raw bytes) | Shell stdout/stderr |
| Exit | `{"type":"exit","code":N}` | Shell process exited |
| Pong | `{"type":"pong"}` | Response to ping |

### Close Codes

| Code | Meaning |
|------|---------|
| `1000` | Normal close (shell exited cleanly) |
| `1001` | Server shutting down |
| `1013` | Max connections reached |
| `4401` | Authentication failed |
| `4408` | Authentication timeout (no auth within 5s) |
| `4429` | Rate limited (too many failed auth attempts) |

## Authentication

1. Client opens a WebSocket connection to the server.
2. Client must send `{"type":"auth","token":"<WS_API_KEY>"}` as the **first message within 5 seconds**.
3. Server validates the token using constant-time comparison (`crypto.timingSafeEqual`) to prevent timing attacks.
4. On success: server responds with `{"type":"auth_ok"}` and spawns a bash PTY.
5. On failure: server responds with `{"type":"auth_fail"}` and closes with code `4401`.
6. On timeout: server closes with code `4408`.

### Rate Limiting

Per-IP rate limiting tracks failed authentication attempts:
- **5 failed attempts** within a 60-second window triggers a block.
- Blocked IPs receive an immediate close with code `4429`.
- The window resets automatically after 60 seconds of no failures.

## Security

### TLS

The server runs `ws://` (unencrypted) internally. For production use, terminate TLS at a reverse proxy:

```
Client --wss://--> nginx/caddy --ws://--> container:8080
```

Example nginx config:

```nginx
location /ws {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_read_timeout 3600s;
}
```

### Key Management

- Generate keys with `openssl rand -hex 32` (64-char hex string).
- The `WS_API_KEY` is automatically stripped from the spawned shell environment so it cannot be leaked by `env` or `printenv`.
- Never commit API keys to source control. Use environment variables or a secrets manager.

### Shell Environment

The spawned PTY runs bash with:
- **TERM**: `xterm-256color`
- **Working directory**: `/root/workspace`
- **Environment**: inherits all container env vars **except** `WS_API_KEY`
