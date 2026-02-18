# 8x Agent System

## 3-Phase Execution Model

Every task flows through three phases: **Plan -> Implement -> QA**.

### Phase 1: Plan

A planning agent receives the task description and explores the codebase. It produces two files in `/specs/<issue_number>-<spec_name>/`:

- **`spec.xml`** — The machine-readable execution plan consumed by sub-agents.
- **`spec.md`** — A human-readable summary of the plan for reviewer approval before implementation begins.

The planning agent makes all architectural decisions upfront. Sub-agents do not make design choices.

### Phase 2: Implement

For each step in `spec.xml`, a sub-agent is dispatched with ONLY that step's `context` and `instructions`. The sub-agent:
1. Reads the context to understand what exists and what conventions to follow
2. Executes the instructions precisely
3. Runs the verification check to confirm success

Steps are executed sequentially. Each step can depend on the output of previous steps, but the dependency must be described explicitly in the step's context.

### Phase 3: QA

After all steps are complete, a QA agent is dispatched. It:
1. Reads the `acceptance_criteria` from `spec.xml`
2. Reviews `git log` and `git diff` for all changes made during implementation
3. Runs each acceptance criterion's verification command
4. Reports pass/fail for each criterion with evidence

No task is considered complete until all acceptance criteria pass.

---

## Spec File Structure

All specs live in `/specs/<issue_number>-<spec_name>/` and contain two files:

- `spec.xml` — The execution plan in XML format, consumed by sub-agents.
- `spec.md` — A human-readable markdown summary of the plan for review and approval.

### Plan spec.xml
```xml
<plan>
  <title>kebab-case-name</title>
  <goal>What this plan achieves</goal>
  <steps>
    <step>
      <title>step-name</title>
      <goal>What this step achieves</goal>
      <context><![CDATA[Everything the sub-agent needs to know]]></context>
      <instructions><![CDATA[Precise actions to take]]></instructions>
      <verification><![CDATA[How to confirm success]]></verification>
    </step>
  </steps>
  <acceptance_criteria>
    <criterion>
      <title>Testable assertion</title>
      <requirement>What must be true and how to verify it</requirement>
    </criterion>
  </acceptance_criteria>
</plan>
```

---

## Principles

1. **Self-contained steps**: Each step's context + instructions must be sufficient for a sub-agent with zero project knowledge to execute correctly.
2. **No implicit knowledge**: File paths, patterns, naming conventions, types -- everything must be explicit.
3. **Concrete over abstract**: Exact file paths and function names, not vague descriptions.
4. **Scope control**: Steps state what to touch and what NOT to touch.
5. **Sequential execution**: Steps run in order. Dependencies between steps must be described explicitly in the dependent step's context.
