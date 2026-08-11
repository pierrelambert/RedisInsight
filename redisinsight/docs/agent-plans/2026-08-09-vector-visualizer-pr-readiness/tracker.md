# PR readiness tracker

| Task | Owner | Status | Requested route | Actual route | Ownership | Evidence | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T1 | `/root/pr_t1_scope` | audited | Codex `gpt-5.4` low | `gpt-5.6-terra` low, non-inherited | root package manifests/lock, Electron builder, workflows only | `audit-report.md`: no owned-path delta; exact delta approved | no task-local residual |
| T3 | `/root/pr_t3_lazy_route` | audited | Codex `gpt-5.4` low | `gpt-5.6-terra` low, non-inherited | `defaultRoutes.ts` only | `audit-report.md`: lazy named-export adapter; exact delta approved | no task-local residual |
| T4 | `/root/pr_t4_i18n` | audited | Codex `gpt-5.4` medium | `gpt-5.6-terra` medium, non-inherited | picker, subheader, additive locale keys | `T4-report.md`; `audit-final-report.md` APPROVED | no task-local residual |
| T5 | `/root/pr_t5_actions` | audited | Codex `gpt-5.4` low | `gpt-5.6-terra` low, non-inherited | `useListContent.ts`, additive locale key | `T5-report.md`; `audit-final-report.md` APPROVED | pre-existing unchanged TS2322 remains aggregate-only |
| T6 | `/root/pr_t6_quality` | audited | Codex `gpt-5.5` medium | `gpt-5.6-terra` medium, non-inherited | bounded package code-quality files and known-features | `T6-report.md`; `audit-final-report.md` APPROVED | aggregate lint/type-check remain non-green |
| T2 | `/root/pr_t2_key_type` | audited | Codex `gpt-5.4` medium | `gpt-5.6-terra` medium, non-inherited | `VectorSetDetails.tsx` and focused spec | `T2-report.md`; `audit-final-report.md` APPROVED | aggregate type-check environment gate remains non-pass |
| T7 | `/root/pr_t7_dedup_color` | audited | Codex `gpt-5.4` medium | `gpt-5.6-terra` medium, non-inherited | capability proof and parseColor scope | `T7-report.md`; `audit-final-report.md` APPROVED | no task-local residual |
| T8 | `/root/pr_t8_tests` | audited | Codex `gpt-5.5` medium | `gpt-5.6-terra` medium, non-inherited | five package spec files only | `T8-report.md`; `audit-final-report.md` APPROVED | no task-local residual |
| T9 | `/root/pr_t9_final_audit` | audited | Codex `gpt-5.6-sol` high | `gpt-5.6-sol` high, non-inherited | final audit report only | `audit-final-report.md`: APPROVED, 0 P0/P1/P2 | preserve documented aggregate and runtime proof boundaries |
| AUDIT | `/root/pr_delta_audit` | done | fresh Codex Auditor `gpt-5.6-sol` high | `gpt-5.6-sol` high, non-inherited | `audit-report.md` only | APPROVED: 0 P0, 0 P1, 0 P2 for exact T1/T3 delta | retain aggregate and missing-contract blockers |

Status vocabulary: planning, running, blocked, failed, done, audited. Commit allowed: no for every row.
