# Docker Setup

A portable dev environment with all 3 AI CLI tools and the full 8-agent roster pre-installed.

## What's Inside

- **Ubuntu 24.04** base image
- **Node.js 22.x** LTS
- **Claude Code** (`@anthropic-ai/claude-code`)
- **Codex CLI** (`@openai/codex`)
- **OpenCode** (`opencode-ai`)
- **8 agents** installed globally for each CLI
- **WebSocket shell server** for remote terminal access

## Prerequisites

- Docker
- API keys: `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY`

## Build

```bash
make docker-build
# or
docker build -t 8x-productivity .
```

## Run

### WebSocket Server Mode (default)

The container starts a WebSocket server on port 8080 that provides authenticated shell access. This is the default mode, designed for integration with web-based terminal UIs.

```bash
# Generate a secure API key
export WS_API_KEY=$(openssl rand -hex 32)

# Start the container (detached)
make docker-run

# Test with wscat
wscat -c ws://localhost:8080
> {"type":"auth","token":"<your WS_API_KEY>"}
```

Required: `WS_API_KEY` environment variable (at least 32 characters).

See [docs/websocket-server.md](docs/websocket-server.md) for full protocol documentation and [docs/xterm-integration.md](docs/xterm-integration.md) for client-side integration.

```bash
# Stop the container
make docker-stop
```

### Interactive Mode

For direct shell access without the WebSocket server:

```bash
make docker-run-interactive
# or
docker run -it --rm \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -v $(pwd):/root/workspace \
  8x-productivity bash
```

Your project is mounted at `/root/workspace`. Any project-level agent configs (`.claude/agents/`, `.opencode/agents/`, `AGENTS.md`) take precedence over the global ones baked into the image.

## Agent Locations

| CLI | Global (in image) | Project-level (takes precedence) |
|-----|-------------------|----------------------------------|
| **Claude Code** | `/root/.claude/agents/` | `.claude/agents/` in project root |
| **OpenCode** | `/root/.opencode/agents/` | `.opencode/agents/` in project root |
| **Codex CLI** | `/root/.codex/AGENTS.md` | `AGENTS.md` in project root |

## Solo Hacker CLI

The container includes the `solohacker` CLI at `/usr/local/bin/solohacker` for managing issues, syncing agent configs, and tracking goals through the Solo Hacker platform API.

```bash
# Inside the container PTY
solohacker list-issues
solohacker read-issue SH-12
solohacker assign-issue SH-12 ada
```

The CLI auth token (`SOLOHACKER_TOKEN`) is automatically injected when a PTY shell is spawned. See [docs/solohacker-cli.md](docs/solohacker-cli.md) for full usage.

## Make Targets

| Target | Description |
|--------|-------------|
| `make build-cli-configs` | Regenerate `.claude/agents/` and `.opencode/agents/` from `src/agents/` |
| `make docker-build` | Build the Docker image |
| `make docker-run` | Run the container with WebSocket server (detached, port 8080) |
| `make docker-run-interactive` | Run the container interactively with bash |
| `make docker-stop` | Stop the running container |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | No | — | API key for Claude Code |
| `OPENAI_API_KEY` | No | — | API key for Codex/OpenCode |
| `WS_API_KEY` | WebSocket mode | — | API key for WebSocket auth (min 32 chars) |
| `WS_PORT` | No | `8080` | Host port mapping for WebSocket server |
| `WS_MAX_CONNECTIONS` | No | `5` | Max concurrent WebSocket connections |
| `SOLOHACKER_API_URL` | WebSocket mode | — | Solo Hacker platform API base URL |
| `SOLOHACKER_AGENT` | No | — | Agent name for API attribution (set by platform) |
| `SOLOHACKER_TOKEN` | Auto | — | API auth token (auto-derived from WS_API_KEY in PTY) |
