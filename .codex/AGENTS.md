# Agent Roster

Eight specialized agents that form a complete product engineering team. Each agent has a distinct role, personality, and domain expertise. They can be used independently or orchestrated together through a Plan → Implement → QA workflow.

## The Team

| Agent       | Role                     | Domain                                                       |
| ----------- | ------------------------ | ------------------------------------------------------------ |
| **Nova**    | CEO & Orchestrator       | Research, delegation, strategic coordination                 |
| **Kepler**  | Product Analyst          | Requirements, acceptance criteria, scope definition          |
| **Turing**  | Solution Architect       | Technical design, architecture, pattern selection            |
| **Euclid**  | Spec Writer              | Implementation plans, step decomposition, verification gates |
| **Ada**     | Full-Stack Engineer      | All coding — frontend, backend, tests, infrastructure        |
| **Nebula**  | QA & Security Specialist | Code review, security audit, acceptance testing              |
| **Rosetta** | Technical Writer         | Documentation, changelogs, API docs                          |
| **Comet**   | SRE & DevOps             | Build verification, deployment, release management           |

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

## Context Management

All agents share a persistent knowledge vault at `/root/workspace/context/` — an Obsidian-compatible markdown vault searchable via `qmd`.

Skills are a first-class capability abstraction in this workspace. They let agents load targeted instructions, assets, and workflows only when needed, which keeps baseline context clean while still making advanced capabilities available on demand.

### Vault Structure

```
context/
├── domains/       # Semantic concept hubs — category-level knowledge
├── entities/      # Lean factsheets (projects/, companies/, people/)
├── nicolas/       # Nicolas's career context — roles, career map
├── architecture/  # System designs, component docs
├── research/      # Time-stamped analytical syntheses
├── references/    # Raw source material for citation
├── workflows/     # SOPs, deployment procedures, dev processes
└── daily/         # Episodic daily logs
```

### Core Rules

1. **Read before you work.** Search the vault (`qmd search "<topic>" -c context`) for relevant prior context before starting any task.
   - Default to `/brain-load <topic>` when the task depends on existing company memory, decisions, workflows, meeting notes, or research context.
2. **Query the domains before execution.** Check `context/domains/` for relevant domain context that should inform the task at hand before proceeding.
3. **Document new capabilities as skills.** When a reusable capability is added or materially changed as a skill, add or update its note in `context/domains/` so future runs can discover and use it.
4. **Link runtime installs to durable docs.** Treat `.claude/skills/`, `.codex/skills/`, and `.opencode/skills/` as installed artifacts and `context/domains/` as the discoverable documentation layer.
5. **Write back what matters.** After completing work, document decisions, non-obvious findings, and new processes. Skip routine implementation details.
6. **Link generously.** Use `[[wiki-links]]` to connect related notes. Update existing notes with backlinks to new ones.
7. **Use frontmatter.** Every note needs YAML frontmatter with `title`, `created`, `updated`, and `tags`.
8. **Update the index.** Run `qmd update` after creating or editing notes.

### Quick Reference

```bash
qmd search "auth" -c context           # fast keyword search
qmd search "skills" -c context         # discover relevant skill notes
qmd vsearch "how do sessions work" -c context  # semantic fallback
qmd get "domains/coding-agents.md"      # retrieve domain context
qmd get "entities/projects/openclaw.md" # retrieve entity factsheet
qmd update                             # re-index after edits
```

See the **company-context-management** skill (in `.claude/skills/`, `.opencode/skills/`, or `.codex/skills/`) for complete guidelines, templates, and conventions.

The shared context-loading command lives at `.claude/commands/brain-load.md`, `.opencode/commands/brain-load.md`, and `.codex/prompts/brain-load.md` after build/install.

## File Structure

```
/root/
├── .claude/agents/           # Generated — Claude Code format
├── .claude/skills/           # Generated — skills for Claude Code
├── .claude/skills/           # Generated — skills for Claude Code
├── .opencode/agents/         # Generated — OpenCode format
├── .opencode/skills/         # Generated — skills for OpenCode
├── .codex/skills/            # Generated — skills for Codex
├── workspace/                # CLI-agnostic agent source (source of truth)
│   ├── context/              # Shared company context, use the company-context-management skill to manage it actively.
│   ├── AGENTS.md             # This file.
```
