# 8x Productivity

**A lightweight meta-prompting framework that makes solo developers 8x more productive through intelligent agent orchestration.**

No fluff. No bullshit. Just 8 specialized AI agents that streamline your entire software development lifecycle.

> 🚀 **Dogfooding in production:** This is the framework we use to build [Polvera.ai](https://polvera.ai) — an AI-powered study platform for people who want to learn faster.

---

## Installation

Requirements: Node.js >= 18.

```bash
npx 8xp install
```

Follow the prompts to pick your CLI (opencode, claude-code, cursor, agentzero) and target path. Agents are installed into `.<cli>/agents` and skills into `.<cli>/skills` for the selected CLI.

You can also run it non-interactively:

```bash
npx 8xp install --platform=opencode --path=/path/to/project
npx 8xp install --platform=claude-code --path=/path/to/project
npx 8xp install --platform=cursor --path=/path/to/project
npx 8xp install --platform=agentzero --path=/path/to/agentzero/usr
```

---

## Why 8x?

Traditional development is slow because **you wear all the hats**. 8x Productivity gives you a focused team of 8 agents, each an expert in their domain, working in parallel to ship faster without compromising quality.

**8 agents × focused expertise = 8x output**

---

## The Team

| Agent | Role | What They Do |
|-------|------|--------------|
| **product-owner** | Business Systems Analyst | Writes `spec.md` with requirements, scope, and Definition of Done |
| **system-architect** | Pattern Validator | Designs `architecture.md`, maintains `research.md` |
| **frontend-developer** | Frontend Implementation | Builds React/Next.js components and UI |
| **backend-developer** | Backend Implementation | Creates FastAPI services and endpoints |
| **data-engineer** | Data Modeling | Designs database schema, writes migrations (Prisma) |
| **quality-assurance** | QA Gate | Validates everything meets production standards |
| **security-engineer** | Security Validation | Reviews security-sensitive code and changes |
| **documentator** | Documentation | Updates `/docs/` after ticket completion |

---

## 4-Phase Workflow

### Phase 1: Planning
- **product-owner** creates `spec.md` (requirements, scope, DoD)
- **product-owner** adds findings to `research.md`
- **system-architect** reviews spec, creates `architecture.md`
- **system-architect** updates `research.md` with technical findings

### Phase 2: Implementation
- **data-engineer** handles schema changes first (if needed)
- **backend-developer** implements API/services using `tasks.md`
- **frontend-developer** implements UI using `tasks.md`
- All implementation agents track progress in `tasks.md`

### Phase 3: Validation
- **quality-assurance** reviews against `spec.md` acceptance criteria
- **security-engineer** reviews security-sensitive changes
- No PR merge without QA approval

### Phase 4: Completion
- **documentator** updates `/docs/` after ticket is merged

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
