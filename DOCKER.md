# Docker Setup

A portable dev environment with all 3 AI CLI tools and the full 8-agent roster pre-installed.

## What's Inside

- **Ubuntu 24.04** base image
- **Node.js 22.x** LTS
- **Claude Code** (`@anthropic-ai/claude-code`)
- **Codex CLI** (`@openai/codex`)
- **OpenCode** (`opencode-ai`)
- **8 agents** installed globally for each CLI

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

```bash
make docker-run
# or
docker run -it --rm \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -v $(pwd):/root/workspace \
  8x-productivity
```

Your project is mounted at `/root/workspace`. Any project-level agent configs (`.claude/agents/`, `.opencode/agents/`, `AGENTS.md`) take precedence over the global ones baked into the image.

## Agent Locations

| CLI | Global (in image) | Project-level (takes precedence) |
|-----|-------------------|----------------------------------|
| **Claude Code** | `/root/.claude/agents/` | `.claude/agents/` in project root |
| **OpenCode** | `/root/.opencode/agents/` | `.opencode/agents/` in project root |
| **Codex CLI** | `/root/.codex/AGENTS.md` | `AGENTS.md` in project root |

## Make Targets

| Target | Description |
|--------|-------------|
| `make build-cli-configs` | Regenerate `.claude/agents/` and `.opencode/agents/` from `src/agents/` |
| `make docker-build` | Build the Docker image |
| `make docker-run` | Run the container interactively with API keys and project mount |
