# 8x Productivity

**A CLI that makes solo developers 8x more productive by orchestrating AI agents through a structured Plan -> Implement -> QA workflow.**

No fluff. No agent marketplaces. Just four commands that turn a task description into working, reviewed code.

> Dogfooding in production: This is the framework we use to build [Polvera.ai](https://polvera.ai) — an AI-powered study platform for people who want to learn faster.

---

## How It Works

Every task flows through three phases:

```
8x quick-plan "add rate limiting"  -->  spec.json  -->  8x implement  -->  8x review
         (Plan)                                        (Implement)         (QA)
```

1. **Plan** — An AI agent explores your codebase, makes all architectural decisions, and produces a `spec.json` with concrete, self-contained steps.
2. **Implement** — Each step is dispatched to a sub-agent with only the context it needs. Steps run sequentially. No implicit knowledge, no guessing.
3. **QA** — A review agent checks every acceptance criterion from the spec against the actual changes, reporting pass/fail with evidence.

No task is considered complete until all acceptance criteria pass.

---

## Installation

Requires Node.js >= 18 and [opencode](https://opencode.ai) installed.

```bash
git clone git@github.com:polvera-org/8x-productivity.git
cd 8x-productivity
npm install
npx 8x install
```

This installs `8x` globally. You can now run it from any project directory.

---

## Commands

### `8x quick-plan <task>`

For straightforward tasks: bug fixes, simple features, single-concern changes. Produces a flat list of steps with acceptance criteria.

```bash
8x quick-plan "add rate limiting to the API"
```

### `8x deep-plan <task>`

For complex, multi-stage work: new features, architectural changes, multi-file refactors. Produces stages with steps, codebase analysis, and per-stage acceptance criteria.

```bash
8x deep-plan "migrate database from SQLite to PostgreSQL"
```

### `8x implement`

Picks a spec folder interactively, then executes each step sequentially by dispatching sub-agents. Stops on failure.

```bash
8x implement
```

### `8x review`

Picks a spec folder interactively, then dispatches a QA agent that verifies every acceptance criterion against the actual changes.

```bash
8x review
```

---

## Spec Files

Plans are stored as `specs/<spec-name>/spec.json`. The spec contains everything needed for implementation — no implicit knowledge required.

Each step includes:
- **title** — What the step does
- **goal** — What it achieves
- **context** — Everything the sub-agent needs to know (file paths, patterns, conventions)
- **instructions** — Precise actions to take
- **verification** — How to confirm success

See [src/AGENTS.md](src/AGENTS.md) for the full spec schema.

---

## Philosophy

- **Structured over ad-hoc** — Every task follows Plan -> Implement -> QA. No skipping phases.
- **Self-contained steps** — Each step's context + instructions must be sufficient for an agent with zero project knowledge.
- **Concrete over abstract** — Exact file paths and function names, not vague descriptions.
- **Scope control** — Steps state what to touch and what NOT to touch.
- **Sequential execution** — Steps run in order. Dependencies are described explicitly.

---

## Inspired By

- **get-shit-done** — Bias for action
- **BMAD** — Structured agent collaboration
- **Octopuses** — 8 intelligent arms working autonomously

---

**Built for developers who want to ship faster without burning out.**
