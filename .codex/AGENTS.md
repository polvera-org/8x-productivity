# Agent Roster

Eight specialized agents that form a complete product engineering team. Each agent has a distinct role, personality, and domain expertise. They can be used independently or orchestrated together through a Plan → Implement → QA workflow.

## The Team

| Agent | Role | Domain |
|-------|------|--------|
| **Nova** | CEO & Orchestrator | Research, delegation, strategic coordination |
| **Kepler** | Product Analyst | Requirements, acceptance criteria, scope definition |
| **Turing** | Solution Architect | Technical design, architecture, pattern selection |
| **Euclid** | Spec Writer | Implementation plans, step decomposition, verification gates |
| **Ada** | Full-Stack Engineer | All coding — frontend, backend, tests, infrastructure |
| **Nebula** | QA & Security Specialist | Code review, security audit, acceptance testing |
| **Rosetta** | Technical Writer | Documentation, changelogs, API docs |
| **Comet** | SRE & DevOps | Build verification, deployment, release management |

## How They Work Together

```
Plan                              Implement                    Verify & Ship
─────────────────────────────     ──────────────────────       ─────────────────────
Nova (research)                   Ada (build)                  Nebula (QA gate)
  → Kepler (requirements)                                     Rosetta (documentation)
  → Turing (architecture)                                     Comet (deploy)
  → Euclid (execution plan)
```

**Planning phase**: Nova researches the codebase, Kepler defines what to build, Turing designs how to build it, Euclid writes the step-by-step plan.

**Implementation phase**: Ada executes each step, producing working code.

**Verification phase**: Nebula reviews for correctness and security, Rosetta documents the changes, Comet ships to production.

## Agent Design Principles

Each agent prompt follows these principles:

1. **Single responsibility.** Each agent owns one domain. They do not cross boundaries.
2. **Explicit personality.** Each agent has distinct traits that make them effective in their role — not cosmetic flavor, but behavioral characteristics that improve output quality.
3. **Clear input/output contracts.** Every agent knows what it receives, what it produces, and in what format.
4. **Hard boundaries.** Every agent has an explicit "What You Do NOT Do" section that prevents scope creep between roles.
5. **Tech-stack agnostic.** Agents carry domain expertise without being locked to a specific framework or language. They adapt to whatever codebase they are working in.

## Using Agents

### With Claude Code

Copy `.claude/agents/` into your project root. Claude Code will detect them as custom agents available via the Task tool. Nova's config includes `Agent()` tool access for orchestrating the other 7 agents.

### With OpenCode

Copy `.opencode/agents/` into your project root. OpenCode will detect them as sub-agents available via the Task tool.

### With Codex CLI

Copy `AGENTS.md` to your project root. Codex reads agent definitions from this file automatically.

### With Docker

Run `make docker-run` to get a shell with all 3 CLIs and agents pre-installed globally. Mount any project and start working immediately. See [DOCKER.md](DOCKER.md) for details.

### Standalone

Each agent prompt lives in `src/agents/` as a CLI-agnostic markdown file. The YAML frontmatter contains only `name` and `description`. Run `make build-cli-configs` to generate CLI-specific configs for Claude Code and OpenCode.

## File Structure

```
src/agents/           # CLI-agnostic source (source of truth)
├── nova.md           # CEO & Orchestrator
├── kepler.md         # Product Analyst
├── turing.md         # Solution Architect
├── euclid.md         # Spec Writer
├── ada.md            # Full-Stack Engineer
├── nebula.md         # QA & Security Specialist
├── rosetta.md        # Technical Writer
└── comet.md          # SRE & DevOps

scripts/
└── build-cli-configs.sh  # Generates CLI-specific configs

.claude/agents/       # Generated — Claude Code format
.opencode/agents/     # Generated — OpenCode format
AGENTS.md             # Codex CLI reads this from project root
Dockerfile            # Portable dev environment
```
