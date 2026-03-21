---
name: sync-brain
description: Sync the shared knowledge vault by committing local `context/` changes, rebasing onto the latest `main`, resolving context conflicts, and pushing back to origin.
---

# Sync Brain

Use this skill when the user wants to sync shared knowledge in `$HOME/workspace/context/` with the remote repository.

## Goal

Safely update `origin/main` with local knowledge changes from `context/` while keeping the branch rebased on the latest remote history.

## Workflow

1. Run from `$HOME/workspace`.
2. Confirm the repo is on `main` before syncing.
3. Inspect the working tree and isolate changes under `context/`.
4. Stage only new or modified files in `context/` that belong in durable knowledge.
5. Create a commit for the staged `context/` changes if there is anything to commit.
6. Run `git fetch origin`.
7. Run `git pull --rebase origin main`.
8. If rebase conflicts happen inside `context/`, resolve them by merging both sides carefully:
   - preserve valid frontmatter
   - keep both non-duplicate knowledge additions when possible
   - prefer the newer `updated` date
   - remove conflict markers completely
9. Continue the rebase until it succeeds.
10. Push the final `main` branch to `origin`.

## Guardrails

- Do not stage or commit unrelated files outside `context/` unless the user explicitly asks.
- Do not discard user changes.
- If there are conflicts outside `context/`, stop and ask the user instead of guessing.
- If there are no `context/` changes, skip the commit and just sync with remote.
- Use a concise commit message such as `context: sync brain updates` unless the user provides one.

## Command Pattern

```bash
cd ~/workspace
git checkout main
git add context
git commit -m "context: sync brain updates"
git fetch origin
git pull --rebase origin main
# resolve conflicts if needed
git push origin main
```

Adapt the exact commands to the repo state. For example, skip the commit when `context/` has no changes, and avoid re-staging unrelated files.

## Conflict Resolution Notes

When a markdown note in `context/` conflicts:

- keep the YAML frontmatter intact and valid
- preserve both useful wiki-links and references
- merge complementary discoveries instead of choosing one side blindly
- update the `updated` field after resolving the note

If the conflict cannot be resolved confidently without changing meaning, ask the user with a short explanation of the tradeoff.
