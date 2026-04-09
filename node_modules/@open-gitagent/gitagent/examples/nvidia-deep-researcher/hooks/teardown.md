# Teardown Hook

Runs at session end to persist state and clean up.

## Actions

1. **Persist session summary** — Append a summary of the research session (topic, key findings, sources used) to `memory/MEMORY.md`
2. **Archive if needed** — If working memory exceeds 200 lines, rotate older entries to `memory/archive/`
3. **Push runtime branch** — If running in a git-managed environment, commit session artifacts and push to the runtime branch for version tracking

## On Failure

Log the failure but do not block session termination. Memory persistence is best-effort.
