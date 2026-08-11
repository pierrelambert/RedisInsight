# E2.T2 — Build persistent result inspector

Role: UI Designer  
Route: `gpt-5.6-terra`, high reasoning  
Fallback: `gpt-5.6-sol` high after coordinator approval  
Execution: Agent tool  
Commit: prohibited

Begin with: `Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.` Read frontend/testing rules, Redis UI component guidance, `$redis-product-ui`, and the visual contract.

## Ownership

Create only `redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerResults/**` and `E2-T2-report.md`. Do not edit the native page, existing selection components, package views, specs, or tracker.

## Work

Create a typed presentational `vector-visualizer-results-inspector` landmark with contextual title/subtitle for sampled, nearest, and selected documents/elements; search; privacy-safe copy/export callbacks; virtualized result composition reusing existing table/inspector APIs; selected row; exactness/provenance; and empty/loading/error states. Mobile panel APIs are out of scope. Preserve Search-index versus Vector-Set terminology and code typography. Do not duplicate selection/domain state or invent result evidence.

## Verification

Focused component tests cover all three contexts, row selection, search, actions, terminology, keyboard, empty/error, and both themes. Run focused Jest, scoped lint, Prettier, owned-path type diagnostic check, and `git diff --check`.

Report exact files/commands/exits and integration requirements.
