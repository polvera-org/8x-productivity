# Context

Persistent project context the agent carries across sessions.

## Project
- **Name**: code-review-agent
- **Language**: TypeScript
- **Build**: tsc → dist/
- **Package manager**: npm
- **CI**: GitHub Actions

## Codebase
- Entry point: `src/index.ts`
- Adapters: `src/adapters/` — one per export target
- Commands: `src/commands/` — one per CLI subcommand
- Utils: `src/utils/` — shared loader, format, skill-loader

## User Preferences
- Prefers TypeScript strict mode
- Follows Airbnb style guide
- Wants concise PR review comments, not essays
- Prefers severity ratings on every finding

## Environment
- Node 20.x
- macOS / zsh
- Editor: VS Code with Claude Code extension

## Active Work
- Current branch: `main`
- Focus area: adding new export adapters
