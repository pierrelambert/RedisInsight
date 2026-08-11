# E5.VERIFY — Fresh product-UI verification

Role: Verifier  
Route: `gpt-5.6-terra`, high reasoning  
Fallback: `gpt-5.6-sol` high after coordinator approval  
Execution: fresh Agent tool context  
Writes: `E5-verify-report.md` only  
Commit: prohibited

Begin with: `Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.` Read all source specs, preserved references, charter, ledger, tracker, decisions, implementation reports, and current diff. Do not trust worker claims.

Run focused native/package/plugin Jest; scoped lint/Prettier; owned-path TypeScript classification; both relevant Vite builds; real-route product-UI Playwright at `1440x900`, an intermediate desktop width, and `960x680` for Atlas/Neighbors/Selection, themes, states, keyboard, console, and network; and `git diff --check`/scope checks. Do not add or claim a mobile-screen target.

Inspect every approved screenshot beside the corresponding reference. Confirm geometry numerically. Classify every visible difference as intentional semantic correction, responsive adaptation, or defect. Do not update source or baselines.

Return `READY` only if REQ-VV-011 through REQ-VV-015 have evidence and no P0/P1 remains. Explicitly report aggregate baseline non-passes and any unproven live Redis/Electron scope.
