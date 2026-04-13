---
name: writing-plans
description: Use this skill when writing implementation plans, spec files, or step-by-step execution plans for engineers or sub-agents. Load when translating an architecture document and requirements into a concrete, ordered execution plan where each step must be self-contained and independently executable.
license: Proprietary. LICENSE.txt has complete terms
---

# Writing Plans — Implementation Spec Methodology

## Purpose

Translate a design document and requirements into a machine-readable, self-contained execution plan. Every step must be executable by a sub-agent with zero project knowledge. If a step requires guessing, it is not done.

## The Five Principles

These are non-negotiable. Every step must satisfy all five.

### 1. Self-Contained Steps

Each step's context + instructions must be sufficient for a sub-agent who has never seen the project to execute correctly. The sub-agent sees ONLY the step — not the design document, not other steps, not the README.

Ask yourself: "If I gave this step to an engineer who has never seen this project, could they execute it perfectly with zero questions?" If the answer is no, add more context.

### 2. No Implicit Knowledge

File paths, patterns, naming conventions, types, data shapes, import paths, environment variables — everything must be explicit in each step that needs it.

- **Bad:** "Follow the existing pattern for services."
- **Good:** "Follow the pattern in `src/services/user.service.ts`, which exports a class with static async methods, uses the `db` import from `src/lib/db.ts`, and returns typed DTOs from `src/types/user.types.ts`."

### 3. Concrete Over Abstract

Exact file paths, function names, type names, variable names, and import paths. Vague instructions produce vague implementations.

- **Bad:** "Add the component to the page."
- **Good:** "Create `src/components/WidgetCard.tsx` exporting a default function component that accepts `{ widget: Widget, onDelete: (id: string) => void }` as props. Import `Widget` from `src/types/widget.types.ts`."

### 4. Scope Control

Every step states what to create or modify AND what NOT to touch.

- **Example:** "Create `src/services/widget.service.ts`. Do NOT modify `src/services/index.ts` — the barrel export will be added in a later step."

### 5. Sequential Execution with Explicit Dependencies

Steps run in order. If step N depends on output from step M, step N's context must explicitly describe that output — never by step number reference.

- **Bad:** "Use the service created in step 2."
- **Good:** "The file `src/services/widget.service.ts` exports a `WidgetService` class with a static `create(data: CreateWidgetInput): Promise<Widget>` method. Import it with `import { WidgetService } from '@/services/widget.service'`."

## Step Structure

Every step must contain all four sections:

### Context

Everything the sub-agent needs to understand before touching code:

- Exact file paths to read, create, or modify
- Existing patterns and conventions to follow (with example file paths)
- Data shapes, types, interfaces, and their import paths
- Naming conventions used in this project
- What was produced by prior steps (described concretely, not by reference)
- Integration points and any prerequisites

### Instructions

Precise, actionable directives:

- Exact file paths and function/class/type names
- What to create vs. what to modify
- What NOT to touch and why (scope boundaries)
- Expected behavior and edge cases to handle
- Specific patterns to follow with concrete file references

Every instruction must be unambiguous. If there are two reasonable interpretations, the instruction has failed.

### Verification

Concrete, pass/fail checks to confirm the step succeeded:

- A command to run (e.g., `npx tsc --noEmit`, `npm test -- --testPathPattern=widget`)
- A file existence check
- A behavioral assertion

Verification must be binary. No subjective assessments.

### Acceptance Criteria

Derived from the product analyst's requirements. Each criterion must be testable with a pass/fail outcome and specify the verification method.

## Writing Process

1. Read the design document completely. Understand the technical approach, component breakdown, file paths, patterns, step ordering, and dependencies.
2. Read the requirements completely. Understand functional requirements, non-functional requirements, and acceptance criteria.
3. Decompose the design into steps. Each step maps to one coherent unit of work — not two unrelated things, not so granular it creates unnecessary overhead.
4. Write the context first. This is the most important part — the sub-agent's entire world for that step.
5. Write the instructions. Given the context, what exactly must the sub-agent do?
6. Write the verification. How do we know this step succeeded?
7. Map acceptance criteria from requirements. Each requirement maps to at least one testable criterion.
8. Write the human-readable summary. Plain English for reviewer approval.
9. Self-review. For each step, ask: "Could a sub-agent with zero project knowledge execute this perfectly?" If not, add what is missing.

## Flags to Raise

If you encounter these situations, stop and flag — do not guess or improvise:

- The design document is ambiguous about a specific implementation decision
- A requirement has no clear mapping to the design
- Two steps have a circular dependency
- The design assumes a system or pattern that does not appear to exist

Flag with: the specific ambiguity, what you need to resolve it, and which downstream steps are blocked until it is resolved.
