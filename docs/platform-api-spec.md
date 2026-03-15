# Solo Hacker Platform API Spec

API specification for the Solo Hacker platform backend. The `solohacker` CLI inside each container calls these endpoints to manage issues, sync agent configs, and report progress.

## Authentication

All requests require:

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer <token>` | Container auth token (derived from `WS_API_KEY`) |
| `X-Agent` | `<agent_name>` | Agent making the request (for attribution) |

## Error Format

All errors return JSON:

```json
{
  "error": "Human-readable error message"
}
```

Standard HTTP status codes:

| Code | Meaning |
|------|---------|
| 400 | Bad request (missing/invalid fields) |
| 401 | Unauthorized (missing or invalid token) |
| 404 | Resource not found |
| 422 | Unprocessable entity (valid JSON but invalid values) |
| 500 | Internal server error |

## Data Types

### Issue Statuses

`draft` | `backlog` | `todo` | `in_progress` | `in_review` | `completed`

### Priorities

`low` | `medium` | `high` | `urgent`

### Agent Roles

`orchestrator` (gets delegation tools in Claude Code) | `specialist`

---

## Endpoints

### GET /api/agents

List all agents with their config data. Used by `sync-agents` to write local CLI config files.

**Response** `200 OK`:

```json
[
  {
    "name": "nova",
    "role": "orchestrator",
    "description": "CEO & Orchestrator. The strategic brain of the team.",
    "body": "# Nova — CEO & Orchestrator\n\nYou are Nova..."
  },
  {
    "name": "ada",
    "role": "specialist",
    "description": "Full-Stack Implementation Engineer.",
    "body": "# Ada — Full-Stack Implementation Engineer\n\n..."
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Agent identifier (lowercase) |
| `role` | string | `orchestrator` or `specialist` |
| `description` | string | One-line description |
| `body` | string | Full markdown system prompt |

---

### GET /api/issues

List issues with filtering.

**Query Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter to a single status |
| `exclude_status` | string | Exclude a single status |
| `limit` | number | Max results (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

**Response** `200 OK`:

```json
[
  {
    "id": "SH-12",
    "title": "Implement auth middleware",
    "status": "in_progress",
    "priority": "high",
    "agent": "ada",
    "labels": ["backend", "security"],
    "created_at": "2025-06-10",
    "updated_at": "2025-06-12"
  }
]
```

---

### POST /api/issues

Create a new issue.

**Request Body**:

```json
{
  "title": "Add error handling to API routes",
  "description": "Wrap all route handlers in try/catch...",
  "status": "draft",
  "priority": "medium",
  "labels": ["backend"]
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | string | Yes | — | Issue title |
| `description` | string | No | `""` | Markdown description |
| `status` | string | No | `draft` | Must be `draft`, `backlog`, or `todo` |
| `priority` | string | No | `medium` | `low`, `medium`, `high`, `urgent` |
| `labels` | string[] | No | `[]` | Labels for categorization |

**Response** `201 Created`:

```json
{
  "id": "SH-25",
  "title": "Add error handling to API routes",
  "status": "draft",
  "priority": "medium",
  "labels": ["backend"],
  "created_at": "2025-06-15",
  "updated_at": "2025-06-15"
}
```

---

### GET /api/issues/:id

Get full issue details including description and comments.

**Response** `200 OK`:

```json
{
  "id": "SH-12",
  "title": "Implement auth middleware",
  "status": "in_progress",
  "priority": "high",
  "agent": "ada",
  "labels": ["backend", "security"],
  "description": "Implement JWT-based authentication middleware...",
  "created_at": "2025-06-10",
  "updated_at": "2025-06-12",
  "comments": [
    {
      "author": "nova",
      "body": "Assigned to ada after review.",
      "created_at": "2025-06-10 14:35"
    },
    {
      "author": "ada",
      "body": "Started implementation.",
      "created_at": "2025-06-11 10:00"
    }
  ]
}
```

---

### PATCH /api/issues/:id

Update issue fields. Partial update — only provided fields are changed.

**Request Body** (all fields optional):

```json
{
  "status": "in_review",
  "priority": "high",
  "title": "Updated title",
  "description": "Updated description",
  "labels": ["backend", "security"]
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `status` | string | `draft`, `backlog`, `todo`, `in_progress`, `in_review`, `completed` |
| `priority` | string | `low`, `medium`, `high`, `urgent` |
| `title` | string | Non-empty |
| `description` | string | — |
| `labels` | string[] | Replaces all labels |

**Response** `200 OK`: Returns the full updated issue object (same shape as GET).

---

### POST /api/issues/:id/assign

Assign an agent to an issue. This is a separate endpoint from PATCH because assignment triggers agent execution on the platform side.

**Request Body**:

```json
{
  "agent": "ada"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agent` | string | Yes | Agent name to assign |

**Response** `200 OK`:

```json
{
  "id": "SH-12",
  "agent": "ada",
  "status": "in_progress"
}
```

**Side effects**: The platform dispatches the issue to the agent's container PTY for execution.

---

### POST /api/issues/:id/comments

Add a comment to an issue. The author is determined from the `X-Agent` header.

**Request Body**:

```json
{
  "body": "Started implementation. Will focus on JWT validation first."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `body` | string | Yes | Comment text |

**Response** `201 Created`:

```json
{
  "author": "ada",
  "body": "Started implementation. Will focus on JWT validation first.",
  "created_at": "2025-06-11 10:00"
}
```

---

### GET /api/goals

List company goals with milestone progress.

**Response** `200 OK`:

```json
[
  {
    "id": "G-1",
    "title": "Launch MVP",
    "description": "Ship the core product to first 10 customers",
    "progress": "3/5 milestones complete"
  },
  {
    "id": "G-2",
    "title": "Security hardening",
    "description": "Pass SOC 2 Type II audit",
    "progress": "1/4 milestones complete"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Goal identifier |
| `title` | string | Goal title |
| `description` | string | Goal description |
| `progress` | string | Human-readable progress summary |
