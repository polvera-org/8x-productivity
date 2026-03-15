# Solo Hacker CLI

The `solohacker` CLI is a command-line tool installed inside every 8x-productivity container. It provides agents with direct access to the Solo Hacker platform API for managing issues, syncing configs, and tracking goals.

## Setup

The CLI is pre-installed at `/usr/local/bin/solohacker` in the Docker image. No additional setup is needed inside the container.

### Environment Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `SOLOHACKER_TOKEN` | Auto-injected by ws-server | Auth token for the platform API |
| `SOLOHACKER_API_URL` | Set via Docker `-e` flag | Platform API base URL |
| `SOLOHACKER_AGENT` | Set by platform before dispatch | Agent name for attribution |

`SOLOHACKER_TOKEN` is automatically derived from `WS_API_KEY` when a PTY session starts. You don't need to set it manually.

## Commands

### sync-agents

Fetch agent configurations from the platform and write them to local CLI directories.

```bash
solohacker sync-agents
# → Synced 8 agents to /root/.claude/agents, /root/.opencode/agents, and /root/.codex/AGENTS.md
```

Writes to:
- `/root/.claude/agents/*.md` — Claude Code agent configs
- `/root/.opencode/agents/*.md` — OpenCode agent configs
- `/root/.codex/AGENTS.md` — Codex combined agent roster

### list-issues

List all open issues (excludes completed), sorted by status.

```bash
solohacker list-issues
```

Output:
```
STATUS       ID     PRIORITY  AGENT   TITLE
in_review    SH-12  high      ada     Implement auth middleware
in_progress  SH-8   high      nova    Research codebase
todo         SH-15  medium    —       Add error handling
backlog      SH-22  low       —       Refactor database layer
```

### list-completed-issues

List the 20 most recently completed issues.

```bash
solohacker list-completed-issues
```

### read-issue

Show full details for a specific issue, including description and comments.

```bash
solohacker read-issue SH-12
```

Output:
```
Issue SH-12: Implement auth middleware
Status: in_progress | Priority: high | Agent: ada
Labels: backend, security
Created: 2025-06-10 | Updated: 2025-06-12

Description:
  Implement JWT-based authentication middleware...

Comments (2):
  [2025-06-10 14:35] nova: Assigned to ada after review.
  [2025-06-11 10:00] ada: Started implementation.
```

### create-issue

Create a new issue on the platform.

```bash
solohacker create-issue --title "Add rate limiting" --description "Implement per-IP rate limiting on all API endpoints" --priority high --labels "backend,security"
# → Created issue SH-25: Add rate limiting
```

Flags:
- `--title "..."` (required) — Issue title
- `--description "..."` — Issue description
- `--status draft|backlog|todo` — Defaults to `draft`
- `--priority low|medium|high|urgent` — Defaults to `medium`
- `--labels "a,b,c"` — Comma-separated labels

### update-issue

Update fields on an existing issue.

```bash
solohacker update-issue SH-12 --status in_review --priority high
# → Updated issue SH-12: Implement auth middleware
```

Flags: `--status`, `--priority`, `--title`, `--description`, `--labels`

### assign-issue

Assign an issue to a specific agent. This triggers the platform to dispatch the issue to that agent's container for execution.

```bash
solohacker assign-issue SH-12 ada
# → Assigned SH-12 to ada
```

This is separate from `update-issue` because assignment has side effects (triggers agent execution).

### comment-issue

Add a comment to an issue. The author is set from the `SOLOHACKER_AGENT` env var.

```bash
solohacker comment-issue SH-12 "Started implementation. Focusing on JWT validation first."
# → Comment added to SH-12
```

### list-goals

List company goals with progress tracking.

```bash
solohacker list-goals
```

Output:
```
1. Launch MVP
   Ship the core product to first 10 customers
   Progress: 3/5 milestones complete

2. Security hardening
   Pass SOC 2 Type II audit
   Progress: 1/4 milestones complete
```

## Auth Mechanism

1. The platform sets `WS_API_KEY` when starting the container
2. When a WebSocket connection spawns a PTY shell, `ws-server` copies the key to `SOLOHACKER_TOKEN` and strips `WS_API_KEY` from the environment
3. The CLI reads `SOLOHACKER_TOKEN` and sends it as `Authorization: Bearer <token>` on every API call
4. The `X-Agent` header is set from `SOLOHACKER_AGENT` for attribution

This means the auth token is available to CLI commands inside the shell but the raw WebSocket key is not exposed.

## Error Handling

- Missing `SOLOHACKER_TOKEN` → `Error: SOLOHACKER_TOKEN is not set.`
- Missing `SOLOHACKER_API_URL` → `Error: SOLOHACKER_API_URL is not set.`
- Network failure → `Error: Could not reach <url> — <reason>`
- API error → `Error: HTTP <status>: <message>`

All errors go to stderr with exit code 1.

## Agent Workflow Example

A typical Nova heartbeat cycle using the CLI:

```bash
# 1. Survey the board
solohacker list-issues

# 2. Check on a running agent
solohacker read-issue SH-8

# 3. Triage — bump priority
solohacker update-issue SH-15 --priority high

# 4. Assign work to an available agent
solohacker assign-issue SH-15 ada

# 5. Create new work from roadmap analysis
solohacker create-issue --title "Add webhook support" --description "..." --labels "nova-generated"

# 6. Add a comment explaining your decision
solohacker comment-issue SH-15 "Assigned to ada — aligns with current sprint priority."
```
