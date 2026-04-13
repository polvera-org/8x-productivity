---
name: writing-requirements
description: Use this skill when writing product requirements documents, defining acceptance criteria, or translating research and user needs into structured, testable specifications. Load when the task is to define what the system must do — not how — including functional requirements, non-functional requirements, user stories, acceptance criteria, and scope boundaries.
license: Proprietary. LICENSE.txt has complete terms
---

# Writing Requirements — Product Requirements Methodology

## Purpose

Translate research findings and user needs into structured, testable product requirements. Define the *what* — what the system must do, what success looks like, and where the boundaries are. Never define the *how*.

## Testability Standard

Every requirement and acceptance criterion must be testable. Apply this test: could a QA agent read this statement and definitively determine pass or fail? If not, rewrite it.

- **Bad**: "The UI should be fast."
- **Good**: "The page must reach interactive state within 2 seconds on a 3G connection."

- **Bad**: "Error handling should be improved."
- **Good**: "When the API returns a 4xx error, the system must display the error message from the response body without exposing stack traces or internal paths."

Every scope boundary must be explicit. If something is ambiguous, put it in out-of-scope and note it. Scope creep kills projects.

## Requirements Document Template

```markdown
# Requirements: <Title>

## Goal

<One sentence. What must be true when this work is complete.>

## Functional Requirements

<Numbered list. Each item is a testable statement about system behavior.>

1. The system must...
2. When a user..., the system must...

## Non-Functional Requirements

<Numbered list. Performance, security, accessibility, reliability, compatibility.>

1. Response time must not exceed...
2. The implementation must be accessible to...

## User Stories

<Only if applicable. Omit entirely for internal or technical work.>

- As a [role], I want [action] so that [outcome].

## Acceptance Criteria

<Numbered list. Each criterion is a specific, testable assertion with verification method.>

1. **<Short title>**: <What must be true>. Verify by: <how to test it>.
2. **<Short title>**: <What must be true>. Verify by: <how to test it>.

## Scope

### In Scope

<Bulleted list. Exactly what this work covers.>

### Out of Scope

<Bulleted list. Things that are explicitly NOT part of this work, even if related.>

## Edge Cases

<Numbered list. Unusual inputs, boundary conditions, failure modes, race conditions.>

1. What happens when...
2. If the input is empty/null/malformed...

## Constraints

<Bulleted list. Hard limitations from the existing system, user requirements, or technical reality.>

## Dependencies

<Bulleted list. Existing components, APIs, services, or files this work depends on. Specific file paths where known.>
```

## Thinking Process

1. **Start from user intent.** What is the actual problem being solved? Strip away implementation assumptions and focus on the outcome. If a crystallized brief from Euclid is available, use it as the starting point — it has already separated core intent from periphery.
2. **Decompose into testable units.** Every requirement maps to at least one acceptance criterion. If you cannot write a criterion for a requirement, the requirement is too vague.
3. **Think about edges early.** The happy path is obvious. Your value is in identifying what happens when things go wrong, inputs are unexpected, or the system is under stress.
4. **Scope aggressively.** A well-scoped feature that ships is worth more than an ambitious one that stalls. When in doubt, move it to out-of-scope.
5. **Write for downstream consumers.** Architects need requirements clear enough to design against. QA needs criteria specific enough to verify. Spec writers need scope tight enough to plan. Write for all three simultaneously.

## Flags to Raise

If you encounter these situations, stop and flag:

- Research is insufficient to define a specific requirement — identify the exact gap and what investigation would resolve it
- A requirement cannot be made testable — it may be a quality attribute that needs non-functional treatment
- Two requirements conflict — surface the conflict explicitly rather than silently picking one
- A requirement prescribes implementation — strip the how and restate as a what
