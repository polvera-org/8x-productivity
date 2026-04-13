# Agent Roster

Eight specialized agents that form a complete product engineering team. Each agent has a distinct role, personality, and domain expertise. They can be used independently or orchestrated together through a four-phase workflow: Ideation → Plan → Implement → Verify & Ship.

## The Team

| Agent       | Role                          | Domain                                                            |
| ----------- | ----------------------------- | ----------------------------------------------------------------- |
| **Nova**    | CEO & Orchestrator            | Research, delegation, strategic coordination, intake assessment   |
| **Euclid**  | Idea Crystallizer & Spec Writer | Ideation: first-principles decomposition, crystallized briefs. Spec: implementation plans, step decomposition, verification gates. |
| **Kepler**  | Product Analyst               | Requirements, acceptance criteria, scope definition, UX judgment  |
| **Turing**  | Solution Architect            | Technical design, architecture, pattern selection                 |
| **Ada**     | Full-Stack Engineer           | All coding — frontend, backend, tests, infrastructure             |
| **Nebula**  | QA & Security Specialist      | Code review, security audit, acceptance testing                   |
| **Rosetta** | Technical Writer              | Documentation, changelogs, API docs                               |
| **Comet**   | SRE & DevOps                  | Build verification, deployment, release management                |

## How They Work Together

```
Ideation (when task is fuzzy)     Plan                              Implement        Verify & Ship
─────────────────────────────     ─────────────────────────────     ────────────     ────────────────────
Nova (intake assessment)          Nova (research)                   Ada (build)      Nebula (QA gate)
  → Euclid (crystallized brief)     → Kepler (requirements)                          Rosetta (docs)
                                    → Turing (architecture)                          Comet (deploy)
                                    → Euclid (execution plan)
```

**Ideation phase** (optional — triggered when the task is fuzzy): Nova detects an unclear or underspecified idea and routes to Euclid. Euclid applies first-principles thinking to extract the core intent, surface hidden assumptions, and produce a crystallized brief. This brief focuses the research and prevents building the wrong thing.

**Planning phase**: Nova researches the codebase against a clear problem statement. Kepler translates research and the crystallized brief into product requirements, adding the user perspective and UX judgment. Turing designs the solution. Euclid writes the step-by-step execution plan.

**Implementation phase**: Ada executes each step, producing working code.

**Verification phase**: Nebula reviews for correctness and security. Rosetta documents the changes. Comet ships to production.

## Skills

Agents load domain-specific skills on demand. Skills contain detailed methodology, templates, and checklists — keeping the baseline agent context clean while making advanced capabilities available when needed.

| Skill                   | Used by  | Purpose                                              |
| ----------------------- | -------- | ---------------------------------------------------- |
| **brainstorm**          | Euclid   | Ideation mode: Socratic questioning, axiom decomposition, crystallized brief format |
| **writing-plans**       | Euclid   | Spec mode: five principles, step structure, plan writing process |
| **writing-requirements**| Kepler   | Requirements template, testability standards, writing process |
| **code-review**         | Nebula   | Review process, quality checklist, security checklist, report format |
| **deploy-checklist**    | Comet    | Five-phase deployment process, build verification, report format |

## Agent Design Principles

Each agent prompt follows these principles:

1. **Single responsibility.** Each agent owns one domain. They do not cross boundaries.
2. **Explicit personality.** Each agent has distinct traits that make them effective in their role — not cosmetic flavor, but behavioral characteristics that improve output quality.
3. **Clear input/output contracts.** Every agent knows what it receives, what it produces, and in what format.
4. **Hard boundaries.** Every agent has an explicit "What You Do NOT Do" section that prevents scope creep between roles.
5. **Skills over monoliths.** Detailed methodology lives in skills, not baked into agent SOULs. Agents declare which skills they use and when.
6. **Tech-stack agnostic.** Agents carry domain expertise without being locked to a specific framework or language. They adapt to whatever codebase they are working in.

## Using Agents

### With Claude Code

Copy `.claude/agents/` into your project root. Claude Code will detect them as custom agents available via the Task tool. Nova's config includes `Agent()` tool access for orchestrating the other agents.

### With OpenCode

Copy `.opencode/agents/` into your project root. OpenCode will detect them as sub-agents available via the Task tool.

### With Codex CLI

Copy `AGENTS.md` to your project root. Codex reads agent definitions from this file automatically.

### With Docker

Run `make docker-run` to get a shell with all CLIs and agents pre-installed globally. Mount any project and start working immediately.

### Standalone

Each agent prompt lives in `src/agents/` as a CLI-agnostic markdown file. Run `npm run build` to generate CLI-specific configs for all supported platforms.

## File Structure

```
src/
├── agents/           # CLI-agnostic source (source of truth)
│   ├── nova/         # CEO & Orchestrator
│   ├── euclid/       # Idea Crystallizer & Spec Writer
│   ├── kepler/       # Product Analyst
│   ├── turing/       # Solution Architect
│   ├── ada/          # Full-Stack Engineer
│   ├── nebula/       # QA & Security Specialist
│   ├── rosetta/      # Technical Writer
│   └── comet/        # SRE & DevOps
└── skills/           # Skill definitions (loaded on demand)
    ├── brainstorm/
    ├── writing-plans/
    ├── writing-requirements/
    ├── code-review/
    ├── deploy-checklist/
    └── ... (domain skills)

scripts/
└── build.ts          # Generates CLI-specific configs for all platforms

.claude/agents/       # Generated — Claude Code format
.opencode/agents/     # Generated — OpenCode format
AGENTS.md             # Codex CLI reads this from project root
```
