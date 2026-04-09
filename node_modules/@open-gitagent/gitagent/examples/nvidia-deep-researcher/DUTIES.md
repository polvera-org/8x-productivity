# Segregation of Duties

## Roles

| Role         | Agent                   | Permissions                    |
|--------------|-------------------------|--------------------------------|
| Orchestrator | nvidia-deep-researcher  | delegate, synthesize, publish  |
| Planner      | planner                 | plan, query                    |
| Researcher   | researcher              | search, summarize, cite        |

## Conflict Matrix

| Role Pair                  | Constraint                                                       |
|----------------------------|------------------------------------------------------------------|
| Orchestrator ↔ Researcher  | Cannot coexist — orchestrator must not perform direct searches   |
| Planner ↔ Researcher       | Cannot coexist — plan generation and search execution must be separate |

## Handoff Workflows

### Publish Report
- **Action**: `publish_report`
- **Required roles**: Orchestrator, Researcher
- **Flow**: Researcher provides cited findings → Orchestrator synthesizes and publishes
- **Approval required**: Yes — orchestrator must verify coverage before publishing

## Isolation

- **State**: Agents operate on shared context (`/shared/` namespace) but each agent writes to its own designated files
- **Credentials**: Each agent uses its own model and API credentials

## Enforcement

**Strict** — Violations fail validation and block deployment. The orchestrator must delegate search tasks to the researcher and planning tasks to the planner; it must not perform these actions directly.
