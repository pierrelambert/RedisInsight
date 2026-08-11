# T1 — Strip unrelated scope creep

Role: Implementor
Provider: Codex
Requested model/reasoning: `gpt-5.4` / low
Actual dispatch model/reasoning: `gpt-5.6-terra` / low, because the requested model is unavailable
Inheritance: no
Routing reason: bounded mechanical main-alignment and lock regeneration
Repo/branch: `/private/tmp/redisinsight-vector-visualizer`, `codex/redis-vector-visualizer`
Commit allowed: no

## Owned files

- `package.json`, limited to Electron/builder/rebuild/updater/sqlite-related restoration
- `redisinsight/package.json`, limited to `better-sqlite3`
- `package-lock.json`, generated from the restored root manifests
- `electron-builder.json`
- `.github/workflows/*.yml`

## Forbidden files

- `redisinsight/ui/src/packages/vector-visualizer/**`
- `redisinsight/ui/src/pages/vector-visualizer/**`
- every other source file
- plan, tracker, ledger, report, and audit files except the assigned report path

## Exact task

Read the user-provided T1 contract reflected in this brief. Inspect `git diff main...HEAD` for the owned paths and confirm the named Electron, Electron Builder, rebuild, updater, better-sqlite3, builder binary-path, and workflow drift. Restore unrelated paths from `main`. Run root `npm install` only after restoring the package manifests so `package-lock.json` is regenerated. Confirm Vector Visualizer dependencies remain in the lockfile. Do not commit.

## Verification

1. `git diff main -- package.json redisinsight/package.json package-lock.json electron-builder.json .github/workflows/`
2. Confirm any remaining manifest/lock delta is Vector Visualizer-related and explain it.
3. `npm test --prefix redisinsight/ui/src/packages/vector-visualizer -- --runInBand`
4. `npm run type-check`

Do not convert a known aggregate TypeScript baseline failure into PASS. Record exact exit code and feature-path diagnostics separately.

## Report

Write `T1-report.md` beside this task directory's parent. Return only: status, files changed, one-line verification summary, blockers. The report must contain status, requested/actual route, files changed, exact commands and exit codes, Vector Visualizer dependency retention, blockers, assumptions, and no-commit statement.
