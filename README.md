# 8x Productivity

**An AI agent roster and harness for product engineering teams.**

Eight specialized agents — each with distinct expertise, personality, and domain boundaries — that cover the full product development lifecycle: from requirements to architecture to implementation to QA to deployment.

---

## The Team

| Agent | Role | What They Do |
|-------|------|-------------|
| **Nova** | CEO & Orchestrator | Researches the codebase, coordinates work, delegates to specialists |
| **Kepler** | Product Analyst | Translates business needs into testable requirements and acceptance criteria |
| **Turing** | Solution Architect | Designs technical solutions grounded in existing codebase patterns |
| **Euclid** | Idea Crystallizer & Spec Writer | Crystallizes fuzzy ideas via first-principles thinking; decomposes designs into executable implementation steps |
| **Ada** | Full-Stack Engineer | Writes production-quality code — frontend, backend, tests, infrastructure |
| **Nebula** | QA & Security | Reviews code for correctness, security vulnerabilities, and edge cases |
| **Rosetta** | Technical Writer | Produces accurate documentation that matches the codebase |
| **Comet** | SRE & DevOps | Verifies builds, manages deployments, and ships releases |

---

## How It Works

The agents follow an **Ideation → Plan → Implement → Verify** workflow:

```
Ideation (optional)     Plan                          Implement      Verify & Ship
───────────────────     ─────────────────────────     ───────────    ─────────────────
Euclid crystallizes     Nova researches               Ada builds     Nebula reviews
the idea                Kepler defines requirements                  Rosetta documents
                        Turing designs architecture                  Comet deploys
                        Euclid writes the plan
```

Nova detects when a task is fuzzy and routes to Euclid for ideation before research begins. Clear tasks skip straight to planning.

Each agent has hard boundaries — they do their job and nothing else. The architect does not write code. The engineer does not make product decisions. QA does not fix bugs. This separation prevents the role confusion that degrades output quality in single-agent workflows.

---

## Installation

### Install with Claude

If you have [Claude Code](https://claude.ai/code) installed, run this one-liner in your terminal. Claude will guide you through the setup interactively — asking which CLIs you use, whether to install globally or into a specific project, and handling everything from there.

```bash
claude "$(curl -fsSL https://raw.githubusercontent.com/polvera-org/8x-productivity/main/docs/AGENT_SETUP.md)"
```

### Manual install

Clone the repo, install dependencies, and run the interactive setup wizard:

```bash
git clone https://github.com/polvera-org/8x-productivity.git
cd 8x-productivity
npm install
npm run setup
```

`npm run setup` is an interactive wizard that asks which CLIs you want to install for (Claude Code, OpenCode, Codex, OpenClaw, Agent Zero), whether to install globally or into a specific project directory, and handles all the copying.

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
2. Run `npm run build` to regenerate all output formats, or `npm run setup` to rebuild and reinstall to your targets.
