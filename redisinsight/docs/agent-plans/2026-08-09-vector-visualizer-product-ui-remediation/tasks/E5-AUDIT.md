# E5.AUDIT — Independent visual contract audit

Role: Auditor  
Route: `gpt-5.6-sol`, high reasoning  
Fallback: none without coordinator decision  
Execution: fresh Agent tool context after E5.VERIFY READY  
Writes: `E5-audit-report.md` only  
Commit: prohibited

Begin with: `Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.` Read the source specs, preserved artifacts, charter, ledger, decisions, tracker, full implementation diff, tests, screenshot baselines/diffs, and E5 verification report. Do not edit source, tests, specs, plan control files, or baselines.

Independently audit:

- reference composition and operational density at desktop width;
- numeric landmark geometry and overflow;
- connected Atlas/Neighbors/Selection state and persistent inspector;
- supported desktop-window visibility, priority, overflow, and keyboard access;
- light/dark, keyboard, reduced motion, and non-ready states;
- plugin/native capability boundary;
- semantic precedence (UMAP-only, <=20k, evidence/privacy);
- screenshot-test legitimacy and absence of blanket baseline updates;
- regression/scope risk and exact gate evidence.

Return `APPROVED` only with zero P0/P1 and complete mapped evidence. A non-blank/readable page is insufficient. Report findings by severity, exact files/lines, commands/exits, residual risks, and no-write proof.
