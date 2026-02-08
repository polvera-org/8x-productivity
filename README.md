# 8x Productivity

**A lightweight meta-prompting framework that makes solo developers 8x more productive through intelligent agent orchestration.**

No fluff. No bullshit. Just 9 specialized AI agents that streamline your entire software development lifecycle.

> 🚀 **Dogfooding in production:** This is the framework we use to build [Polvera.ai](https://polvera.ai) — an AI-powered study platform for people who want to learn faster.

---

## Installation

**Requirement**: Node.js >= 18.

**Requirement**: Agents are optimized for the Linear MCP integration. Ensure the Linear MCP is available and configured for your CLI so agents can update tickets, add comments, and apply labels as part of the workflow.

```bash
git clone git@github.com:polvera-org/8x-productivity.git
cd 8x-productivity
npx 8x install
```

Follow the prompts to pick your CLI (opencode, claude-code, cursor, agentzero) and target path. Agents are installed into `.<cli>/agents` and skills into `.<cli>/skills` for the selected CLI.

You can also run it non-interactively:

```bash
npx 8x install --platform=opencode --path=/path/to/project
npx 8x install --platform=claude-code --path=/path/to/project
npx 8x install --platform=cursor --path=/path/to/project
npx 8x install --platform=agentzero --path=/path/to/agentzero/usr
```

---

## Why 8x?

Traditional development is slow because **you wear all the hats**. 8x Productivity gives you a focused team of 9 agents, each an expert in their domain, working in parallel to ship faster without compromising quality.

**9 agents × focused expertise = 8x output**

---

## The Team

| Agent | Role | What They Do |
|-------|------|--------------|
| **product-owner** | Product Requirements Definition | Frames the problem, defines outcomes, and writes `spec.md` |
| **system-architect** | Architecture & Decisions | Designs `architecture.md`, captures trade-offs and risks |
| **data-engineer** | Data Engineering | Defines data models, pipelines, quality checks, and SLAs |
| **backend-developer** | Backend Implementation | Builds API/services with reliability, observability, and safety |
| **frontend-developer** | Frontend Implementation | Builds production UI flows with performance and accessibility focus |
| **qa-specialist** | QA Gate | Runs risk-based validation and release criteria checks |
| **security-engineer** | Security Validation | Threat models and reviews security-sensitive changes |
| **writer** | Marketing Content | Writes launch copy, campaigns, and video scripts |
| **designer** | Visual Design | Creates images, brand assets, and video visuals |

---

## 4-Phase Workflow

### Phase 1: Planning
- **product-owner** creates `spec.md` (requirements, scope, DoD)
- **product-owner** adds findings to `research.md`
- **system-architect** reviews spec, creates `architecture.md`
- **system-architect** updates `research.md` with technical findings

### Phase 2: Implementation
- **data-engineer** handles data model, pipeline, or contract changes first (if needed)
- **backend-developer** implements API/services using `tasks.md`
- **frontend-developer** implements UI flows using `tasks.md`
- All implementation agents track progress in `tasks.md`

### Phase 3: Validation
- **qa-specialist** reviews against `spec.md` acceptance criteria
- **security-engineer** reviews security-sensitive changes
- No PR merge without QA approval

### Phase 4: Completion
- **product-owner** updates `/docs/` after ticket is approved by the CEO (Human)
- **writer** Writes concise changelog `/docs/changelogs/` after ticket is merged

---

## Philosophy

- ✅ **Lightweight** → Easy to understand and adopt
- ✅ **Practical** → Built for solo developers and small teams
- ✅ **Opinionated** → Clear roles, clear workflows
- ❌ **No excess** → Every agent earns its place
- ❌ **No bureaucracy** → Agents work, they don't block

---

## Getting Started

```bash
# Clone the framework
git clone https://github.com/yourusername/8x-productivity.git

# Follow the setup guide
cat docs/getting-started.md
```

---

## Inspired By

- **get-shit-done** → Bias for action
- **BMAD** → Structured agent collaboration
- **Octopuses** → 8 intelligent arms working autonomously

---

**Built for developers who want to ship faster without burning out.**
