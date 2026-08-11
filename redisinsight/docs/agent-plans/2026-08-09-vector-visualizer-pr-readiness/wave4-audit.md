# Wave 4 — dispatch T9 after ALL prior waves complete

T9 is the final audit. It must be a fresh-context agent with no prior worker context.

---

## WORKER T9: Final PR-readiness audit

```
Role: Auditor
Requested model: gpt-5.6-sol
Requested reasoning effort: high
Actual model: unknown until completion
Actual reasoning effort: unknown until completion
Inherited from coordinator: unknown until completion
Routing reason: Final verification requires reading all changed files, running all gate commands, and making high-risk judgment about PR readiness; gpt-5.6-sol high is necessary for frontier audit with subtle regression detection
Repo: /private/tmp/redisinsight-vector-visualizer
Branch: codex/redis-vector-visualizer
Source of truth: change-delta.md acceptance scenarios

You own: ALL files (read-only audit — do NOT edit any source file)
Write only: audit-final-report.md in the plan directory

Do not touch: any source file, any spec file, any locale file, any config file

Other agents active: no (Wave 4 is serial, all prior work is done)

Task:
Independently verify ALL fixes from T1-T8 against acceptance criteria.
Run every verification command yourself — do not trust prior reports.

PRIOR TASK SUMMARY (verify each independently):
- T1: Unrelated scope creep stripped (Electron/sqlite downgrades, CI changes reverted to main)
- T2: VectorSetDetails.tsx type mismatch fixed (RedisString → Uint8Array conversion)
- T3: Lazy loading added for VectorVisualizerPage in defaultRoutes.ts
- T4: i18n added for 6 hardcoded strings in VectorFieldPicker.tsx + VectorSetKeySubheader.tsx
- T5: Action properties completed for "Visualize vectors" in useListContent.ts
- T6: Code quality fixes (magic numbers, boolean naming, type-only imports, ts-ignore, feature ordering)
- T7: Type dedup in capabilityProof.ts + parseColor fallback in AtlasRenderer.ts
- T8: queryLabEvidence.spec.ts created + renderComponent added to 4 specs

BLOCKER ACCEPTANCE CHECKS (all must pass for APPROVED):

□ B1 — Scope creep:
  git diff main...HEAD -- package.json electron-builder.json .github/workflows/ | head -5
  → 0 lines for non-VV changes (VV-specific deps in package.json are OK)

□ B2 — Type mismatch:
  grep -A5 'handleVisualize' redisinsight/ui/src/pages/browser/modules/key-details/components/vector-set-details/VectorSetDetails.tsx
  → setVectorVisualizerSource must receive key: <Uint8Array expression>, NOT selectedKeyData.name directly

□ B3 — Lazy loading:
  grep 'LazyVectorVisualizerPage' redisinsight/ui/src/components/main-router/constants/defaultRoutes.ts
  → exactly 2 matches: one const declaration with lazy(), one LAZY_LOAD ternary usage

□ B4 — i18n strings:
  grep -c ">[A-Z]" redisinsight/ui/src/pages/vector-search/pages/VectorSearchListPage/components/list-content/VectorFieldPicker.tsx
  → 0 matches for the 5 original bare English strings (attribute names in buttons are OK — they're dynamic)
  grep 'Visualize' redisinsight/ui/src/pages/browser/modules/key-details/components/vector-set-details/vector-set-key-subheader/VectorSetKeySubheader.tsx
  → must use t('...') not bare "Visualize"

□ B5 — Action properties:
  grep -A6 'Visualize vectors' redisinsight/ui/src/pages/vector-search/hooks/useListContent/useListContent.ts
  → entry must have: name, label (t() call), icon (<Component>), callback

CODE QUALITY CHECKS (important but not blocking):

□ I1 — Magic numbers:
  Spot-check AtlasRenderer.ts, compare.ts, layout.ts for remaining bare numeric literals in logic context

□ I2 — Boolean naming:
  grep -rn ': boolean' redisinsight/ui/src/packages/vector-visualizer/src/ | grep -v '.spec.' | grep -v 'is\|has\|should\|can\|was\|will\|needs\|allows' | head -10
  → should return 0 or only false positives

□ I3 — Type-only imports:
  Spot-check a few imports in VV files — are type-only imports used?

□ I4 — Type dedup:
  grep -c 'interface.*Capabilities\|interface.*LayoutJob\|interface.*HostAdapter' redisinsight/ui/src/packages/vector-visualizer/src/capabilityProof.ts
  → 0 (all imported from contracts.ts)

□ I5 — parseColor:
  grep -A10 'parseColor' redisinsight/ui/src/packages/vector-visualizer/src/renderer/AtlasRenderer.ts | head -20
  → must have try/catch or equivalent fallback handling

□ I6 — ts-ignore:
  grep '@ts-ignore' redisinsight/ui/src/packages/vector-visualizer/src/workbenchSdk.ts
  → 0 matches
  grep '@ts-expect-error' redisinsight/ui/src/packages/vector-visualizer/src/workbenchSdk.ts
  → 1 match

□ I7 — queryLabEvidence tests:
  ls redisinsight/ui/src/packages/vector-visualizer/src/query-lab/QueryLab/queryLabEvidence.spec.ts
  → file exists

□ I8 — renderComponent:
  for f in Atlas MetadataMatrix HealthExplorers SelectionInspector; do
    grep -l 'renderComponent' redisinsight/ui/src/packages/vector-visualizer/src/**/$f/*.spec.tsx 2>/dev/null || echo "MISSING: $f"
  done
  → 4 files found, 0 MISSING

□ I10 — Feature ordering:
  grep -n 'DevVectorVisualizer' redisinsight/api/src/modules/feature/constants/known-features.ts
  → positioned appropriately (grouped with dev-* flags or in alphabetical order)

GATE COMMANDS (run ALL independently):

  npm run lint
  → exit 0, 0 warnings

  npm run type-check
  → note: pre-existing 1,312 diagnostics baseline. Count diagnostics for VV-owned files only:
    npm run type-check 2>&1 | grep -E 'vector-visualizer|vector-set-details|VectorSetDetails|VectorFieldPicker|useListContent|defaultRoutes|known-features' | head -20
  → 0 VV-specific NEW errors

  npm test --prefix redisinsight/ui/src/packages/vector-visualizer -- --runInBand
  → PASS, all suites/tests

  node node_modules/.bin/jest redisinsight/ui/src/pages/vector-visualizer -c jest.config.cjs --runInBand
  → PASS, all suites/tests

  node node_modules/.bin/jest redisinsight/ui/src/utils/tests/plugins.spec.ts -c jest.config.cjs --runInBand
  → PASS, all tests (matcher tests)

PRIVACY/SECURITY SPOT CHECK:
  grep -rn 'console\.log' redisinsight/ui/src/packages/vector-visualizer/src/ | grep -v '.spec.' | grep -v node_modules
  → 0 matches (no console.log in production code)

  grep -rn 'fetch\|XMLHttpRequest\|WebSocket\|navigator\.sendBeacon' redisinsight/ui/src/packages/vector-visualizer/src/ | grep -v '.spec.' | grep -v node_modules
  → 0 matches (no network calls from plugin)

OUTPUT FORMAT:

Write audit-final-report.md with this structure:

  # Final PR-Readiness Audit Report
  Date: <date>
  Branch: codex/redis-vector-visualizer
  Audited HEAD: <commit hash from git rev-parse HEAD>

  ## Verdict
  VERDICT: APPROVED | NOT APPROVED
  P0_FINDINGS: <count>
  P1_FINDINGS: <count>
  P2_FINDINGS: <count>

  ## Blocker Checks
  <one line per B1-B5 with PASS/FAIL and evidence>

  ## Code Quality Checks
  <one line per I1-I10 with PASS/FAIL/CONCERN and evidence>

  ## Gate Results
  <one line per gate command with exit code and summary>

  ## Findings
  <if any: file:line — severity — issue — required fix>

  ## Residual Risks
  <known deferred items: I9 page decomposition, VectorVisualizerPage i18n, nav tab decision>

  ## Explicit Non-Passes
  <aggregate type-check baseline, shared multi-plugin build, etc.>

Commit allowed: no
```
