# Brain Load

Load the most relevant company context for: `$ARGUMENTS`

Use the `company-context-management` skill before doing anything else.

## Goal

Build a concise, evidence-backed context pack that helps the current task start with the right company memory instead of re-discovering it from scratch.

## Retrieval Workflow

1. Search the vault with `qmd search "<relevant_query>" -c context`.
2. If keyword results are weak, broaden with `qmd vsearch "<relevant_query>" -c context`.
3. Do multiple queries with different wording to ensure revery relevant document is found.
4. Read the highest-signal notes with `qmd get`.
5. Expand one hop through linked notes, related workflows, decisions, and skills when they materially improve understanding.
6. Check `docs/` for recent supporting documents when the topic appears implementation or research-heavy.
7. Prefer precise retrieval over full-vault scans.

## Guardrails

- Treat `context/` as canonical, human-curated memory.
- Do not rewrite canonical notes during this command.
- If you create synthesized output, keep it separate from source notes unless explicitly asked to promote it.
- Quote concrete note paths when making claims.
- Distinguish facts, inferences, and open questions.

## Output Format

Return a compact brief with these sections:

### Context Pack

- `Topic`: normalized interpretation of `$ARGUMENTS`
- `Key notes`: highest-value notes with paths and one-line relevance
- `Existing decisions/workflows`: anything the task must follow
- `Related skills/tools`: relevant skills, scripts, or commands
- `Risks/constraints`: what could cause errors or duplicate work
- `Open questions`: what remains unclear after retrieval

### Recommended Next Step

- State the single best next action for the current agent after reading the context.
