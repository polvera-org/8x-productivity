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

### With OpenCode

Agents in this directory can be copied to `.opencode/agents/` in any project. OpenCode will automatically detect them and make them available as sub-agents via the Task tool.

### Standalone

Each agent prompt is a self-contained markdown file. The YAML frontmatter defines metadata for OpenCode, but the prompt content works with any LLM platform that supports system prompts or agent definitions.

## File Structure

```
src/agents/
├── nova.md       # CEO & Orchestrator
├── kepler.md     # Product Analyst
├── turing.md     # Solution Architect
├── euclid.md     # Spec Writer
├── ada.md        # Full-Stack Engineer
├── nebula.md     # QA & Security Specialist
├── rosetta.md    # Technical Writer
└── comet.md      # SRE & DevOps
```
