# 8x Productivity

**An enterprise-grade AI agent roster for product engineering teams.**

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

Nova orchestrates work using a **HEARTBEAT** loop — a continuous cycle of research, delegation, and verification. She reads the codebase, delegates tasks to the right specialist, and verifies their output before moving on.

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

See [src/HEARTBEAT.md](src/HEARTBEAT.md) for Nova's orchestration loop.

---

## Installation

### For OpenCode

Copy the agents into your project's `.opencode/agents/` directory:

```bash
# Clone this repo
git clone git@github.com:polvera-org/8x-productivity.git

# Copy agents to your project
cp 8x-productivity/src/agents/*.md your-project/.opencode/agents/
```

OpenCode will automatically detect them and make them available as sub-agents.

### For Other Platforms

Each agent is a self-contained markdown file with a system prompt. The YAML frontmatter is OpenCode-specific metadata; the prompt content works with any LLM platform that supports system prompts or agent definitions.

---

## Agent Design

Each agent prompt is built on these principles:

- **Single responsibility** — One agent, one domain. No crossing boundaries.
- **Distinct personality** — Behavioral traits that make the agent effective in its role. Kepler's analytical rigor. Ada's craftsmanship. Nebula's adversarial mindset.
- **Explicit contracts** — Clear input/output formats so agents can hand off work cleanly.
- **Hard boundaries** — Every agent has a "What You Do NOT Do" section preventing scope creep.
- **Tech-stack agnostic** — Domain expertise without framework lock-in. They adapt to your codebase.

See [src/AGENTS.md](src/AGENTS.md) for the full roster documentation.

---

## Project Structure

```
src/
├── agents/          # The 8 agent prompts
│   ├── nova.md      # CEO & Orchestrator
│   ├── kepler.md    # Product Analyst
│   ├── turing.md    # Solution Architect
│   ├── euclid.md    # Spec Writer
│   ├── ada.md       # Full-Stack Engineer
│   ├── nebula.md    # QA & Security Specialist
│   ├── rosetta.md   # Technical Writer
│   └── comet.md     # SRE & DevOps
├── AGENTS.md        # Agent roster documentation
├── HEARTBEAT.md     # Nova's orchestration loop
└── references/      # Reference documentation for agents
```

---

## Philosophy

- **Structured over ad-hoc** — Plan → Implement → QA. No skipping phases.
- **Separation of concerns** — Each agent owns one domain. Role confusion degrades quality.
- **Concrete over abstract** — Exact file paths and function names, not vague descriptions.
- **Scope control** — Agents state what to touch and what NOT to touch.
- **Fresh context per step** — Sub-agents start clean. No context rot from long conversations.
