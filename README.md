# 8x Productivity

**A CLI that orchestrates AI agents through a structured Plan -> Implement -> QA workflow.**

Four commands turn a task description into working, reviewed code. Each implementation step is executed by a fresh sub-agent with precisely the context it needs — no context rot, no buildup, no 200k-token conversations that forget what they were doing.

> Dogfooding in production: This is the framework we use to build [Polvera.ai](https://polvera.ai).

---

## How It Works

```
8x plan "add rate limiting"  -->  spec.toon  -->  8x implement  -->  8x review
     (Plan)                                       (Implement)         (QA)
```

1. **Plan** — An agent explores the codebase, makes architectural decisions, and produces a `spec.toon` with self-contained steps.
2. **Implement** — Each step is dispatched to a sub-agent with only that step's context, instructions, and verification criteria. Fresh context window per step.
3. **QA** — A review agent verifies every acceptance criterion against the actual changes.

---

## Installation

Requires Node.js >= 18 and [opencode](https://opencode.ai).

```bash
git clone git@github.com:polvera-org/8x-productivity.git
cd 8x-productivity
npm install && npx 8x install
```

---

## Commands

| Command | Description |
|---------|-------------|
| `8x plan <task>` | Produce a flat plan for implementation steps and acceptance criteria |
| `8x implement` | Execute each step from a spec sequentially. Stops on failure. |
| `8x review` | Verify acceptance criteria against actual changes. |

---

## Why Sub-Agents Per Step

Long-running agent sessions accumulate context that degrades output quality. 8x solves this by:

- **Isolating each step** in its own agent session with a clean context window
- **Front-loading decisions** in the planning phase so sub-agents don't need to reason about architecture
- **Providing exactly the context needed** — file paths, patterns, conventions, constraints — nothing more

The planner sees the full picture. Each implementer sees only its step. The reviewer sees only the acceptance criteria and the diff.

---

## Configuration

All commands default to `opencode run`. Override per-command via config files:

- `~/.8x/config.json` — Global
- `<project>/.8x/config.json` — Project (takes precedence)

```json
{
  "plan_command": "claude -p",
  "implement_command": "opencode run",
  "review_command": "opencode run"
}
```

All keys are optional. Commands support full shell syntax via `sh -c`.

---

## Spec Files

Plans live in `specs/<name>/spec.toon` using [TOON](https://github.com/toon-format/toon) (Token-Oriented Object Notation) format -- a compact, LLM-friendly encoding of the JSON data model that reduces parse errors and token usage. Each step includes:

- **context** — Everything the sub-agent needs to know
- **instructions** — Precise actions to take
- **verification** — How to confirm success

See [src/AGENTS.md](src/AGENTS.md) for the full schema.

---

## Philosophy

- **Structured over ad-hoc** — Plan -> Implement -> QA. No skipping phases.
- **Fresh context per step** — Sub-agents start clean. No context rot.
- **Concrete over abstract** — Exact file paths, not vague descriptions.
- **Scope control** — Steps state what to touch and what NOT to touch.

---

**Built for developers who want to ship faster without burning out.**
