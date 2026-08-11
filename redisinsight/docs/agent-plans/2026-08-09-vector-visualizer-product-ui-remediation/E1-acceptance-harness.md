# E1 — Acceptance harness

Purpose: make the missing visual contract executable before production UI edits.

## E1.T1

Contract: [tasks/E1-T1-visual-acceptance.md](tasks/E1-T1-visual-acceptance.md)

This task must leave the product-fidelity assertions red for the current layout while keeping harness/bootstrap assertions green. It must not weaken tests to match the current page and must not create screenshot baselines from the current deficient rendering.

Exit: coordinator confirms the failures correspond to REQ-VV-012 through REQ-VV-015, then opens the E2 parallel wave.
