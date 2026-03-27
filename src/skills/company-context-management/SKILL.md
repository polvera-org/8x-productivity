---
name: company-context-management
description: Manage the company knowledge vault at $HOME/workspace/context/ using Obsidian-compatible markdown and qmd search. Use when creating, searching, organizing, or linking company knowledge — memories, workflows, documents, decisions, or any persistent context.
---

# Company Context Management

Persistent company knowledge lives in an Obsidian-compatible vault at `$HOME/workspace/context/`. Every agent is responsible for reading existing context before starting work and writing back knowledge worth preserving.

The default context-loading workflow is `/brain-load <topic>`. Use it whenever a task depends on prior company memory, ongoing project history, decisions, workflows, meeting notes, or research context.

## Vault Structure

```
$HOME/workspace/context/
├── domains/           # Semantic concept hubs — category-level knowledge
├── entities/          # Lean factsheets for specific things
│   ├── projects/      # OpenClaw, NanoClaw, Pi, Agent Zero, Solohacker
│   ├── companies/     # Muse, ScaleSoftware, NanoCo, Agent Zero s.r.o.
│   └── people/        # Peter Steinberger, Mario Zechner, etc.
├── nicolas/           # Nicolas's career context — roles, career map
├── architecture/      # System designs, component docs
├── research/          # Time-stamped analytical syntheses
├── references/        # Raw source material for citation
├── workflows/         # SOPs, processes, runbooks, playbooks
└── daily/             # Episodic daily logs
```

### domains/

Semantic concept hubs that explain a category and link to all relevant entities. Each domain note contains real analytical content — not just an index of links, but an explanation of the domain's scope, key patterns, and current state.

Create a domain hub when a topic spans multiple projects, companies, or people and deserves a unified overview.

```
domains/
├── coding-agents.md         # The coding agents landscape, tools, patterns
├── openclaw.md              # OpenClaw ecosystem overview
└── mobile-development.md    # Mobile dev domain context
```

### entities/

Lean, structured factsheets for specific things — projects, companies, and people. Think "Wikipedia infobox": a Quick Facts table, one paragraph description, 3–5 key technical facts, and related links.

#### entities/projects/

One factsheet per project. Use when a project is referenced enough to warrant its own node in the knowledge graph.

```
entities/projects/
├── openclaw.md              # OpenClaw project factsheet
├── nanoclaw.md              # NanoClaw project factsheet
└── solohacker.md            # Solohacker project factsheet
```

#### entities/companies/

One factsheet per company or organization.

```
entities/companies/
├── muse.md                  # Muse company factsheet
├── scalesoftware.md         # ScaleSoftware company factsheet
└── agent-zero-sro.md        # Agent Zero s.r.o. factsheet
```

#### entities/people/

One factsheet per key individual — collaborators, founders, notable contacts.

```
entities/people/
├── peter-steinberger.md     # People factsheet
├── mario-zechner.md         # People factsheet
└── nicolas-bruns.md         # People factsheet
```

### nicolas/

Nicolas's personal career context — roles, career map, professional history. Separates his personal context from company/project knowledge so each can evolve independently.

```
nicolas/
├── career-map.md            # Career overview and trajectory
└── roles/                   # Individual role descriptions
    ├── muse-ios.md
    └── scalesoftware-cto.md
```

### architecture/

System designs, component documentation, and architectural decision records. Top-level for easy discovery — these are high-signal documents that inform implementation work.

```
architecture/
├── auth-service.md          # Auth service design
└── data-pipeline.md         # Data pipeline architecture
```

### research/

Time-stamped analytical syntheses that distill key insights from source material. Every research note should link to the transcript, document, or reference set it was derived from. Research notes are analytical snapshots — they capture understanding at a point in time.

```
research/
└── <topic>.md               # Insight-oriented synthesis with explicit source links
```

### references/

Raw reference material kept primarily for citation and traceability. Store transcripts, captured links, source excerpts, and other reference artifacts here so research and decision notes can cite stable source material.

```
references/
└── <source>.md              # Transcript, source notes, or durable link collection
```

### workflows/

Repeatable processes: how things get done. SOPs, checklists, deployment procedures, review protocols, onboarding guides.

```
workflows/
├── development/             # Dev processes, PR flow, branching strategy
├── deployment/              # Deploy procedures, rollback playbooks
├── operations/              # Monitoring, incident response, maintenance
└── onboarding/              # Setup guides, team norms, tool configs
```

### daily/

Journal-style daily notes for episodic memory. Use these notes to capture what happened, what changed, what was learned, and what may matter later even if it does not yet justify a formal decision or document.

```
daily/
└── YYYY-MM-DD.md            # Daily operating log, discoveries, and context snapshots
```

## Note Format

Every note uses YAML frontmatter, standard markdown body, and Obsidian linking conventions.

### Frontmatter

```yaml
---
title: Brief descriptive title
created: 2026-03-16
updated: 2026-03-16
tags:
  - decision
  - auth
  - backend
aliases:
  - JWT auth decision
  - authentication choice
author: nova
status: active
---
```

| Field     | Required | Purpose                                     |
| --------- | -------- | ------------------------------------------- |
| `title`   | yes      | Human-readable title                        |
| `created` | yes      | ISO date of creation                        |
| `updated` | yes      | ISO date of last update                     |
| `tags`    | yes      | Categorization for search and filtering     |
| `aliases` | no       | Alternative names for wiki-link resolution  |
| `author`  | no       | Agent or person who created/last modified   |
| `status`  | no       | `active`, `archived`, `draft`, `superseded` |

### Wiki-Links

Link related notes with `[[note-name]]` or `[[folder/note-name]]`. Use display text when the filename is not reader-friendly: `[[2026-03-16-jwt-decision|JWT Auth Decision]]`.

```markdown
This builds on the [[architecture/auth-service|Auth Service Architecture]] and
supersedes [[decisions/session-based-auth|the previous session approach]].
```

### Tags

Use `#tag` inline or in frontmatter. Prefer frontmatter tags for structured categorization. Use inline tags for ad-hoc context:

```markdown
Discovered during #incident-2026-03 that the connection pool needs tuning.
```

Common tag prefixes:

| Prefix      | Usage                                    |
| ----------- | ---------------------------------------- |
| `project/*` | Project-specific: `#project/auth-v2`     |
| `domain/*`  | Domain area: `#domain/payments`          |
| `type/*`    | Note type: `#type/decision`, `#type/sop` |
| `status/*`  | Lifecycle: `#status/active`              |
| `agent/*`   | Author agent: `#agent/nova`              |

### Linking policy

Prefer hub-and-spoke over mesh. Use `domains/` notes as the main hubs, and add manual links when they improve navigation - not just for completeness.

- `domains/`: canonical hubs that can link down more freely
- `entities/`: link primarily upward to the owning domain hub; add sideways links only for direct ownership, creator, dependency, or central comparisons
- `research/`: link mainly to the subject note, the source/reference note, and at most one downstream architecture or decision note that consumed the research
- `architecture/`: link mainly to the owning project and only a few key upstream research/reference notes
- `daily/`: link only to artifacts created, updated, or decided that day

Do not force reciprocal links by default. Obsidian backlinks already provide reverse discovery.

## Searching with qmd

`qmd` provides fast local search across the vault. Prefer `qmd search` (BM25 keyword) — it is instant. Fall back to `qmd vsearch` (semantic) only when keyword search fails.

### Setup (already configured in container)

```bash
qmd collection add $HOME/workspace/context --name context --mask "**/*.md"
qmd update
```

### Search Commands

```bash
# Keyword search (fast, default)
qmd search "authentication flow" -c context

# Semantic search (slow cold start, use as fallback)
qmd vsearch "how do we handle user sessions" -c context

# Limit results
qmd search "deploy" -c context -n 5

# JSON output (for programmatic use)
qmd search "database schema" -c context --json

# All matches above threshold
qmd search "error handling" -c context --all --min-score 0.3

# Files only (list matching note paths)
qmd search "onboarding" -c context --files
```

### Retrieve Full Notes

```bash
qmd get "architecture/auth-service.md"
qmd get "#docid"                          # by ID from search results
qmd multi-get "research/*.md"             # glob pattern
```

### Keep Index Fresh

After creating or editing notes:

```bash
qmd update    # re-index changed files (fast)
```

## Structured Retrieval Workflow

When a task depends on existing company memory, do not stop at a single keyword search. Use a staged retrieval flow.

### Default command

Run `/brain-load <topic>` to:

1. search for the most relevant notes
2. fall back to semantic retrieval when keyword search is weak
3. expand through related notes, workflows, decisions, and skills
4. summarize the highest-signal context before acting

Use `/brain-load` as the standard preflight step for planning, implementation, and research tasks that touch existing company context.

### Retrieval stages

1. **Precise search first** — start with `qmd search "<topic>" -c context`
2. **Semantic fallback second** — use `qmd vsearch` only when keyword retrieval misses likely context
3. **Relationship-aware expansion** — follow `[[wiki-links]]`, related index notes, and strongly related skill/docs notes one hop outward
4. **Context pack synthesis** — produce a concise brief with key notes, constraints, workflows, and open questions

### Relationship awareness

Do not treat notes as isolated files. Expand retrieval through:

- wiki-links and Obsidian backlinks
- related project notes
- relevant decision records
- workflows that constrain execution
- skill docs that describe reusable capabilities
- source documents such as meeting notes, specs, and transcripts

Stop expanding when additional notes stop changing the task understanding.

## Controlled Ingestion

The vault is most useful when canonical memory stays trustworthy.

### Canonical vs generated content

- Treat human-authored notes in `context/` as canonical by default.
- Keep agent-generated summaries, drafts, and exploratory writeups in staging locations unless explicitly asked to promote them.
- Suitable staging locations include `docs/` and purpose-built generated subfolders outside the vault's semantic folders.

### Promotion rules

Before promoting generated content into durable context:

1. verify it is worth preserving
2. link it to its source material
3. mark provenance clearly in frontmatter/body
4. add only the manual links needed for clear navigation

### Provenance

When summarizing transcripts, meeting notes, or research:

- keep raw source artifacts in `context/references/` and synthesized findings in `context/research/`
- link every synthesis note to its source transcript or source docs
- clearly separate fact, inference, and speculation

## Agent Responsibilities

### Before Starting Work

1. Run `/brain-load <topic>` when the task depends on existing company context
2. Search the vault for relevant prior context: `qmd search "<topic>" -c context`
3. Read related notes to avoid rediscovering known information or contradicting past decisions
4. Check for existing workflows that apply to the task

### After Completing Work

Write back knowledge worth preserving. Ask: "Would a future agent benefit from knowing this?"

**Always document:**

- Significant decisions with rationale
- Non-obvious debugging findings
- New or updated processes
- Architectural changes

**Skip:**

- Routine implementation details the code already captures
- Temporary or one-off findings with no future value

### Creating Notes

1. Choose the correct folder: `domains/` for concept hubs, `entities/projects/` / `entities/companies/` / `entities/people/` for factsheets, `nicolas/` for career context, `architecture/` for system designs, `research/` for analytical syntheses, `references/` for raw source material, `workflows/` for SOPs, `daily/` for episodic logs
2. Use the appropriate template — domain hub, entity factsheet, decision record, workflow/SOP, or technical document
3. Use a descriptive kebab-case filename: `jwt-vs-session-auth.md`
4. Add complete frontmatter with tags
5. Link to the smallest useful set of related notes with `[[wiki-links]]`, following the hub-and-spoke model
6. Keep `## Related` short by note type: domain 4-6, entity 3-4, research 2-4, people 2-3, daily 2-4
7. Run `qmd update` after writing

### Updating Notes

1. Update the `updated` field in frontmatter
2. Preserve the original `created` date
3. If a note is superseded, set `status: superseded` and link to the replacement
4. Run `qmd update` after editing

## Templates

### Decision Record

```markdown
---
title: <Decision Title>
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags:
  - type/decision
  - <domain-tag>
author: <agent-name>
status: active
---

# <Decision Title>

## Context

<What situation or problem prompted this decision?>

## Options Considered

### Option A: <Name>

- **Pros:** ...
- **Cons:** ...

### Option B: <Name>

- **Pros:** ...
- **Cons:** ...

## Decision

<What was decided and why.>

## Consequences

<What follows from this decision — what changes, what trade-offs are accepted.>

## Related

- [[link-to-related-note]]
```

### Workflow / SOP

```markdown
---
title: <Workflow Name>
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags:
  - type/sop
  - <domain-tag>
author: <agent-name>
status: active
---

# <Workflow Name>

## When to Use

<Trigger conditions — when should this workflow be followed?>

## Prerequisites

- <What must be true before starting>

## Steps

1. <Step with specific commands or actions>
2. <Step>
3. <Step>

## Rollback

<How to undo if something goes wrong.>

## Related

- [[link-to-related-note]]
```

### Technical Document

```markdown
---
title: <Document Title>
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags:
  - type/doc
  - <domain-tag>
author: <agent-name>
status: active
aliases:
  - <Alternative Name>
---

# <Document Title>

## Overview

<Brief summary — what this document covers and who it is for.>

## Content

<Main body.>

## Related

- [[link-to-related-note]]
```

### Domain Hub

```markdown
---
title: "<Domain Name> — Domain Overview"
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags:
  - type/domain
  - domain/<domain-slug>
  - status/active
author: <agent-name>
status: active
aliases:
  - <alternative names>
---

# <Domain Name> — Domain Overview

## What Is <Domain Name>?

<2-3 paragraph explanation of this domain/category. What does it encompass? Why does it matter? What's the current state of the field?>

## Key Projects / Entities

### [[entities/projects/<name>|Project Name]]

<1-2 paragraph summary with key stats>

### [[entities/companies/<name>|Company Name]]

<1-2 paragraph summary>

## Architecture / Patterns

<Key patterns, architectural decisions, and technical landscape in this domain>

## Nicolas's Relevance

<How this domain connects to Nicolas's roles and work>

## Related

- [[link-to-related-note]]
```

### Entity Factsheet (Project)

```markdown
---
title: "<Name> — Project Factsheet"
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags:
  - type/entity
  - domain/project
  - domain/<name-slug>
  - status/active
author: <agent-name>
status: active
aliases:
  - <alternative names>
---

# <Name> — Project Factsheet

## Quick Facts

| Field | Value |
|---|---|
| **Name** | <name> |
| **Type** | <brief type description> |
| **GitHub** | <link> |
| **Website** | <link> |
| **Stars** | <count> |
| **Language** | <primary language> |
| **License** | <license> |
| **Creators** | [[entities/people/<name>|Name]] |

## Description

<One paragraph — what it is and what it does.>

## Key Technical Facts

- <Fact 1>
- <Fact 2>
- <Fact 3>

## Related

- [[link-to-related-note]]
```

### Entity Factsheet (Company)

```markdown
---
title: "<Name> — Company Factsheet"
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags:
  - type/entity
  - domain/company
  - domain/<name-slug>
  - status/active
author: <agent-name>
status: active
aliases:
  - <alternative names>
---

# <Name> — Company Factsheet

## Quick Facts

| Field | Value |
|---|---|
| **Name** | <name> |
| **Website** | <link> |
| **Location** | <location> |
| **Founded by** | [[entities/people/<name>|Name]] |
| **Business model** | <brief description> |

## Description

<One paragraph — what the company does and why it matters.>

## Related

- [[link-to-related-note]]
```

### People Factsheet

```markdown
---
title: "<Name> — People Factsheet"
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags:
  - type/entity
  - domain/person
  - domain/<associated-project-slug>
  - status/active
author: <agent-name>
status: active
aliases:
  - <name>
  - <username>
---

# <Name> — People Factsheet

| Field | Value |
|---|---|
| **Name** | <full name> |
| **GitHub** | <link> |
| **Location** | <location> |
| **Key project** | [[entities/projects/<name>|Project Name]] |
| **Known for** | <brief achievement> |

<One paragraph bio.>

## Related

- [[link-to-related-note]]
```

## Conventions

- **Filenames**: kebab-case, descriptive, no dates in name (dates go in frontmatter). Exceptions: daily notes use `YYYY-MM-DD.md`, and meeting notes use `YYYY-MM-DD-topic.md`.
- **One idea per note**: Prefer atomic notes that can be linked over monolithic documents. Split when a note covers multiple independent topics.
- **Link intentionally**: Prefer hub-and-spoke navigation over dense mesh linking. Add a manual link only when navigation would be meaningfully worse without it.
- **Folders are the primary axis**: The semantic folder structure (`domains/`, `entities/`, `nicolas/`, `architecture/`, `research/`, `references/`, `workflows/`, `daily/`) is the primary organizational axis. Tags provide cross-cutting categorization (`type/*`, `domain/*`, `status/*`) that lets notes be discovered across folder boundaries.
- **Update, don't duplicate**: If a note exists on a topic, update it rather than creating a new one. Create a new note only when the scope is genuinely different.
- **Status lifecycle**: `draft` → `active` → `archived` or `superseded`. Mark superseded notes with a link to their replacement.
