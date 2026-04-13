---
name: deploy-checklist
description: Use this skill when verifying a build, preparing a deployment, creating pull requests, running health checks, or managing a release. Load when the task is to get code from "merged" to "running in production" — or to confirm it is ready to be merged.
license: Proprietary. LICENSE.txt has complete terms
---

# Deploy Checklist — SRE & DevOps Methodology

## Purpose

Verify builds, manage deployments, create pull requests, run health checks, and handle release management. The status is binary: **SHIPPED** or **BLOCKED**. There is no "SHIPPED with warnings."

## Hard Gates

Before doing anything else, confirm:

1. **QA approval exists.** If absent, stop immediately. Report BLOCKED: "No QA approval." No exceptions.
2. **Git state is clean.** No uncommitted changes, no untracked files that should be committed.

## Phase 1: Pre-Flight Checks

1. Confirm QA approval is documented.
2. Verify working tree is clean.
3. Verify branch lineage — feature branch should be based on current target. Check for merge conflicts. If conflicts exist, report BLOCKED with the specific conflicting files.
4. Review commit history. Verify commits correspond to the expected work. Flag anomalies.

## Phase 2: Build Verification

Every check must pass. A single failure means BLOCKED.

1. **Lint.** Zero errors. No new warnings beyond the existing baseline.
2. **Type Check.** Zero errors. No new `any` suppressions unless explicitly approved.
3. **Tests.** All pass. Zero failures. Zero newly-skipped tests.
4. **Build.** Production build completes with zero exit code. Artifacts generated where expected.

Record the output of every check in the deployment report.

If the build toolchain is not provided, inspect `package.json`, `Makefile`, `Cargo.toml`, or equivalent to determine the correct commands.

## Phase 3: Deployment

Adapt to what exists:

**CI/CD project:**
- Verify CI configuration is correct for this branch
- Create a Pull Request if one does not exist
- Ensure the branch is merge-ready

**Manual deployment:**
- Execute deployment commands as specified
- Verify target is accessible and configured
- Deploy incrementally — prefer canary or staged rollouts where supported

**No deployment needed:**
- Ensure the branch is ready to merge
- Create a Pull Request with an accurate description
- Verify the PR reflects the actual changes

## Phase 4: Post-Deploy Verification

1. **Service health.** If deployed, verify the service starts and responds. Check health endpoints.
2. **No regressions.** Run smoke tests if they exist.
3. **Clean state.** Git tree clean. No temp files, debug logs, or dev artifacts.

## Phase 5: Release Management

1. **Git tags.** If the project uses semver or tagged releases, create the appropriate tag.
2. **Release notes.** Use existing documentation (Rosetta's output) as source — do not write from scratch.
3. **PR management.** Clear title, issue reference, appropriate labels.
4. **Branch cleanup.** Note branches for deletion after merge confirmation. Do not delete without explicit confirmation.

## Output Format

```markdown
# Deployment Report

## Branch

<branch> → <target>

## Build Status

| Check      | Status    | Details   |
| ---------- | --------- | --------- |
| Lint       | PASS/FAIL | <summary> |
| Type Check | PASS/FAIL | <summary> |
| Tests      | PASS/FAIL | <summary> |
| Build      | PASS/FAIL | <summary> |

## Deployment Status

<What was deployed, where, how. Or: "PR created — awaiting merge.">

## Health Verification

<Results. Or: "N/A — no deployment target.">

## Release Artifacts

- PR: <URL or N/A>
- Tag: <tag or N/A>
- Release Notes: <Updated / Created / N/A>

## Overall Status: SHIPPED | BLOCKED

### Blockers (if BLOCKED)

1. <What is broken and what must be done to fix it>
```

## Operational Philosophy

- **Never deploy broken code.** If the build fails, stop. Do not comment out failing tests. Do not skip the linter. Do not force-push over broken commits.
- **Every deployment reproducible.** No reliance on local state, environment hacks, or undocumented manual steps.
- **Always know the rollback path.** Before shipping anything, know which commit to revert to. You may never need it, but you must always have it.
- **Deploy, verify, confirm, report.** Never deploy and walk away.
- **Minimal blast radius.** Prefer incremental changes. At minimum, ensure the PR is scoped tightly — no unrelated changes.
