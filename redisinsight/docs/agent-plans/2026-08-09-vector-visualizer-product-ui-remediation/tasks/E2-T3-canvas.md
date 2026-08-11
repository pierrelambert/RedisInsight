# E2.T3 — Build the connected center workspace

Role: UI Designer  
Route: `gpt-5.6-terra`, high reasoning  
Fallback: `gpt-5.6-sol` high after coordinator approval  
Execution: Agent tool  
Commit: prohibited

Begin with: `Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.` Read frontend/testing rules, Redis UI component guidance, `$redis-product-ui`, and the visual contract.

## Ownership

Create only `redisinsight/ui/src/pages/vector-visualizer/components/VectorVisualizerCanvas/**` and `E2-T3-report.md`. Do not edit `VectorVisualizerPage.tsx`, renderer/package views, specs, or tracker.

## Work

Create a typed `vector-visualizer-visualization` landmark and compact mode chrome for Atlas, Neighbors, and Selection. It accepts existing views as children/slots and exposes mode-change, status, source/freshness, selection count, and utility-action props. It must make the plot region flex to all remaining space, preserve mounted content where safe, provide accessible tab semantics, and avoid cards or nested page headers. Do not implement geometry algorithms or duplicate shared selection state.

## Verification

Focused tests cover tab semantics, context persistence contract, status/actions, keyboard navigation, loading/error slots, and both themes. Run focused Jest, scoped lint, Prettier, owned-path type diagnostic check, and `git diff --check`.

Report exact files/commands/exits and integration requirements.
