---
name: brainstorm
description: Use this skill when exploring a fuzzy idea, thinking through a concept from first principles, stress-testing assumptions, or crystallizing what you're actually trying to build before committing to a plan. Load when asked to brainstorm, when a problem statement is vague, or when the user is saying "I'm thinking about..." rather than "build this."
license: Proprietary. LICENSE.txt has complete terms
---

# Brainstorm — Idea Crystallization

## Purpose

Turn a fuzzy idea into a crystallized brief that Nova and Kepler can act on. The output is not a plan. It is a foundation: what the idea actually is, what it assumes, what it is not, and what questions remain.

## Process

### Step 1: Restate Without Their Words

Before asking anything, restate what you heard — stripped of implementation details and in your own words. This forces precision and often surfaces misunderstandings before any question is asked.

- User says: "I want to add a notification system with emails, push notifications, maybe Slack"
- You restate: "You want users to be informed when relevant events occur. The delivery mechanism is still open."

If your restatement surprises the user, you've already found a gap.

### Step 2: Find the Axioms

Identify the foundational assumptions — the things that must be true for the idea to make sense. If any one is false, the idea collapses or changes shape entirely.

Work through these lenses — but do not list all at once. Ask the most important one first:

- **User axioms**: Who exactly benefits from this? What do they currently do without it?
- **System axioms**: What does the system do today that this builds on or changes?
- **Value axioms**: What is the actual pain? What happens if we don't build this?
- **Constraint axioms**: What hard limits exist — technical, temporal, organisational?

One question at a time. Wait for the answer before asking the next.

### Step 3: Separate Core from Periphery

Most ideas arrive bundled with implementation assumptions. Peel them apart:

- **Core**: The irreducible thing that must exist for the idea to have value
- **Periphery**: Delivery mechanisms, UI choices, nice-to-haves that could vary without changing the core

Naming the core unlocks alternatives. If the core is "users know when their data changes," maybe the cheapest solution is an in-app badge — not a full notification pipeline.

### Step 4: Stress-Test

Challenge the idea adversarially but constructively:

- "What breaks if we assume [X] is false?"
- "What is the minimum version of this that still has value?"
- "What problem does this NOT solve that the user might think it solves?"
- "Is there an existing solution in the codebase or ecosystem that already handles the core?"

The goal is not to kill the idea. It is to find where it is fragile so those points become explicit constraints for Kepler and Turing.

### Step 5: Produce the Crystallized Brief

When the core is clear and the key assumptions are surfaced, write the brief. Do not wait for perfect clarity — the brief explicitly contains open questions. Kepler and Nova take it from here.

## Output Format

```markdown
# Crystallized Brief: <Title>

## Core Intent
<One sentence: what this actually achieves, stripped of implementation.
Not "a notification system" — "users are informed when relevant events occur.">

## Key Assumptions
<What must be true for this to make sense. These become constraints for requirements.>
1. Users currently have no way to know when X happens without manually checking.
2. The system already tracks X events internally.
3. The primary users are [role], not [other role].

## What This Is NOT
<Explicit exclusions — things the user is NOT asking for, even if adjacent.
These become Kepler's out-of-scope section.>
- Not a two-way communication tool
- Not a marketing automation system
- Not required to be real-time

## Minimum Viable Core
<The smallest version that delivers the core intent. Forces honest scope.>

## Open Questions for Kepler
<What needs product/UX thinking, user empathy, or judgment about feel.>
1. How frequently do users want to be notified?
2. What level of granularity is useful vs. noisy?

## Open Questions for Research
<What Nova needs to investigate in the codebase before planning begins.>
1. Does the system currently emit events when X changes?
2. What infrastructure (if any) already handles this?
```

## Interaction Guidelines

- **One question at a time.** A barrage shuts down thinking. The best question opens up the next one naturally.
- **Restate before you probe.** Show you understood before you challenge.
- **Be Socratic, not interrogative.** You are thinking with the user, not extracting information from them.
- **Use silence productively.** After restating, let the user react. Often they'll correct themselves before you ask anything.
- **Know when to stop.** When the core is clear and the assumptions are surfaced, produce the brief. Over-refining here is waste — Kepler handles product depth, Nova handles research depth.
