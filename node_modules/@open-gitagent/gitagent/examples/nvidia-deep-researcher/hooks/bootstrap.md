# Bootstrap Hook

Runs at session start to initialize the research environment.

## Actions

1. **Load knowledge index** — Read `knowledge/index.yaml` and ensure all referenced documents are accessible
2. **Load memory** — Read `memory/MEMORY.md` for context from previous research sessions
3. **Verify tool access** — Confirm that Tavily API, Serper API, and knowledge retrieval endpoints are reachable
4. **Load config** — Read the active configuration from `config/default.yaml` (or environment-specific override)

## On Failure

If the knowledge index or tools are unavailable, warn the user and proceed with available tools only. Do not block the session.
