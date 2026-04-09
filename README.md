# 8x Productivity

**An AI agent roster for product engineering teams.**

Eight specialized agents — each with distinct expertise, personality, and domain boundaries — that cover the full product development lifecycle: from requirements to architecture to implementation to QA to deployment.

---

## The Team

| Agent | Role | What They Do |
|-------|------|-------------|
| **Nova** | CEO & Orchestrator | Researches the codebase, coordinates work, delegates to specialists |
| **Kepler** | Product Analyst | Translates business needs into testable requirements and acceptance criteria |
| **Turing** | Solution Architect | Designs technical solutions grounded in existing codebase patterns |
| **Euclid** | Spec Writer | Decomposes designs into self-contained, executable implementation steps |
| **Ada** | Full-Stack Engineer | Writes production-quality code — frontend, backend, tests, infrastructure |
| **Nebula** | QA & Security | Reviews code for correctness, security vulnerabilities, and edge cases |
| **Rosetta** | Technical Writer | Produces accurate documentation that matches the codebase |
| **Comet** | SRE & DevOps | Verifies builds, manages deployments, and ships releases |

---

## How It Works

The agents follow a **Plan → Implement → QA** workflow:

```
Plan                              Implement           Verify & Ship
─────────────────────────────     ───────────         ─────────────────
Nova researches                   Ada builds           Nebula reviews
Kepler defines requirements                            Rosetta documents
Turing designs architecture                            Comet deploys
Euclid writes the plan
```

Each agent has hard boundaries — they do their job and nothing else. The architect does not write code. The engineer does not make product decisions. QA does not fix bugs. This separation prevents the role confusion that degrades output quality in single-agent workflows.

---

## Installation

Clone the repo and run the build to generate CLI-specific configs:

```bash
git clone git@github.com:polvera-org/8x-productivity.git
cd 8x-productivity
npm install
npm run build
```

`npm run build` renders all agent definitions into `.claude/`, `.opencode/`, `.openclaw/`, and `.a0proj/`, and installs them globally into `~/.claude/` and `~/.opencode/` so agents are available in any project.

### Manual copy (no build step)

The generated configs are checked in, so you can copy them directly:

```bash
# Claude Code
cp -r .claude/agents/ your-project/.claude/agents/

# OpenCode
cp -r .opencode/agents/ your-project/.opencode/agents/

# Codex CLI
cp AGENTS.md your-project/AGENTS.md

# OpenClaw
cp -r .openclaw/ your-project/.openclaw/
```

---

## Project Structure

```
src/
└── agents/              # Source of truth — gitagent-compatible format
    ├── ada/
    │   ├── agent.yaml   # Manifest: name, description, model, tools
    │   └── SOUL.md      # Agent prompt body
    ├── nova/            # (same structure for all 8 agents)
    └── ...

scripts/
└── build.ts             # Renders src/agents/ into CLI-specific output formats

.claude/agents/          # Generated — Claude Code format
.opencode/agents/        # Generated — OpenCode format
.openclaw/               # Generated — OpenClaw format
.a0proj/agents/          # Generated — Agent Zero format
AGENTS.md                # Codex CLI manifest
```

Agents are defined in the [gitagent](https://github.com/open-gitagent/gitagent) format: each agent lives in its own directory with an `agent.yaml` manifest and a `SOUL.md` prompt. The build script reads these and renders CLI-specific output for Claude Code, OpenCode, OpenClaw, Agent Zero, and Codex.

---

## Agent Design

Each agent prompt is built on these principles:

- **Single responsibility** — One agent, one domain. No crossing boundaries.
- **Distinct personality** — Behavioral traits that make the agent effective in its role. Kepler's analytical rigor. Ada's craftsmanship. Nebula's adversarial mindset.
- **Explicit contracts** — Clear input/output formats so agents can hand off work cleanly.
- **Hard boundaries** — Every agent has a "What You Do NOT Do" section preventing scope creep.
- **Tech-stack agnostic** — Domain expertise without framework lock-in. They adapt to your codebase.

---

## Adding or Editing Agents

1. Edit `src/agents/<name>/SOUL.md` for prompt changes, or `src/agents/<name>/agent.yaml` for metadata.
2. Run `npm run build` to regenerate all CLI outputs.
