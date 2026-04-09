# Key Decisions

Architectural and design decisions made during agent sessions. Each entry is immutable once recorded.

## 2026-02-20 — ESM over CommonJS
- **Decision**: Use ES Modules for all new code
- **Why**: Node 20 has full ESM support, cleaner imports, tree-shaking
- **Tradeoff**: Some older dependencies need interop wrappers
- **Status**: Active

## 2026-02-18 — vitest over jest
- **Decision**: Adopted vitest as the test runner
- **Why**: Native ESM support, faster execution, compatible API
- **Tradeoff**: Smaller ecosystem than jest
- **Status**: Active

## 2026-02-15 — Severity rating system
- **Decision**: All review findings must be rated: CRITICAL, WARNING, SUGGESTION
- **Why**: User wants to triage findings quickly without reading every detail
- **Tradeoff**: Adds overhead to every finding
- **Status**: Active

## 2026-02-10 — No auto-fixing
- **Decision**: Agent suggests fixes but never auto-applies them
- **Why**: User wants to review and apply changes manually
- **Tradeoff**: Slower workflow but safer
- **Status**: Active
