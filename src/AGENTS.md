# 8x Agent System

## 3-Phase Execution Model

Every task flows through three phases: **Plan -> Implement -> QA**.

### Phase 1: Plan

A planning agent receives the task description and explores the codebase. It produces a single `spec.json` file in `/specs/<issue_number>-<spec_name>/spec.json`.

Two planning modes:
- **deep-plan**: For complex, multi-stage work (new features, architectural changes, multi-file refactors). Produces stages with steps, codebase analysis, and per-stage acceptance criteria.
- **quick-plan**: For straightforward tasks (bug fixes, simple features, single-concern changes). Produces a flat list of steps with acceptance criteria.

The planning agent makes all architectural decisions upfront. Sub-agents do not make design choices.

### Phase 2: Implement

For each step in `spec.json`, a sub-agent is dispatched with ONLY that step's `context` and `instructions`. The sub-agent:
1. Reads the context to understand what exists and what conventions to follow
2. Executes the instructions precisely
3. Runs the verification check to confirm success

Steps are executed sequentially. Each step can depend on the output of previous steps, but the dependency must be described explicitly in the step's context.

### Phase 3: QA

After all steps are complete, a QA agent is dispatched. It:
1. Reads the `acceptance_criteria` from `spec.json`
2. Reviews `git log` and `git diff` for all changes made during implementation
3. Runs each acceptance criterion's verification command
4. Reports pass/fail for each criterion with evidence

No task is considered complete until all acceptance criteria pass.

---

## Spec File Structure

All specs live in `/specs/<issue_number>-<spec_name>/spec.json`.

### Deep Plan spec.json
```json
{
  "plan": {
    "title": "kebab-case-name",
    "goal": "What this plan achieves",
    "codebase_analysis": {
      "tech_stack": "...",
      "relevant_files": [{"path": "...", "relevance": "..."}],
      "existing_patterns": "...",
      "risks": ["..."]
    },
    "stages": [
      {
        "title": "1 - stage-name",
        "goal": "What this stage achieves",
        "steps": [
          {
            "title": "step-name",
            "goal": "What this step achieves",
            "context": "Everything the sub-agent needs to know",
            "instructions": "Precise actions to take",
            "verification": "How to confirm success"
          }
        ],
        "acceptance_criteria": [
          {
            "title": "Testable assertion",
            "requirement": "What must be true and how to verify it"
          }
        ]
      }
    ]
  }
}
```

### Quick Plan spec.json
```json
{
  "plan": {
    "title": "kebab-case-name",
    "goal": "What this plan achieves",
    "steps": [
      {
        "title": "step-name",
        "goal": "What this step achieves",
        "context": "Everything the sub-agent needs to know",
        "instructions": "Precise actions to take",
        "verification": "How to confirm success"
      }
    ],
    "acceptance_criteria": [
      {
        "title": "Testable assertion",
        "requirement": "What must be true and how to verify it"
      }
    ]
  }
}
```

---

## Principles

1. **Self-contained steps**: Each step's context + instructions must be sufficient for a sub-agent with zero project knowledge to execute correctly.
2. **No implicit knowledge**: File paths, patterns, naming conventions, types -- everything must be explicit.
3. **Concrete over abstract**: Exact file paths and function names, not vague descriptions.
4. **Scope control**: Steps state what to touch and what NOT to touch.
5. **Sequential execution**: Steps run in order. Dependencies between steps must be described explicitly in the dependent step's context.
