# The Team

| Agent | Role | What They Do |
|-------|------|--------------|
| **product-owner** | Product Requirements Definition | Frames the problem, defines outcomes, and writes `spec.md` |
| **system-architect** | Architecture & Decisions | Designs `architecture.md` and `tasks.md` captures trade-offs and risks |
| **data-engineer** | Data Engineering | Defines data models, pipelines, quality checks, and SLAs |
| **backend-developer** | Backend Implementation | Builds API/services with reliability, observability, and safety |
| **frontend-developer** | Frontend Implementation | Builds production UI flows with performance and accessibility focus |
| **qa-specialist** | QA Gate | Runs risk-based validation and release criteria checks |
| **security-engineer** | Security Validation | Threat models and reviews security-sensitive changes |
| **writer** | Marketing Content | Writes launch copy, campaigns, and video scripts |
| **designer** | Visual Design | Creates images, brand assets, and video visuals |

---

## 4-Phase Software Development Lifecycle

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

## 4-Phase Marketing Pipeline
- Content-driven marketing strategy

### Phase 1: Research
- **writer** does daily research and brainstorms social media and blog posts

### Phase 2: Planning
- **orchestrator** selects the best post ideas and updates the CONTENT_CALENDAR.md
- **writer** creates content plans in /content/{channel}/{content_name}/plan.md based on CONTENT_CALENDAR.md

### Phase 3: Content Creation
- **writer** creates the written part of the content and saves it to /content/{channel}/{content_name}/text.md
- **designer** creates any necessary visual assets for the post, including banners, thumbnails, motion designs if included in the plan.md

### Phase 4: Publish
- Human (CEO) should approve the outputs of the marketing team
- When approved, posts will be posted to their respective channels with automations

---

# Important Files
In the root of this project, we'll coordinate the team based on 4 live files:
- BRAND.md
- ROADMAP.md
- PRIORITIES.md
- CONTENT_CALENDAR.md

The orchestrator should create and maintain these files, ensuring they are always kept up-to-date and aligned with business needs and plans for the near future.