# Execution overview

## Control

- Shared worktree: `/private/tmp/redisinsight-vector-visualizer`
- Branch: `codex/redis-vector-visualizer`
- Start policy: authorized by the user on 2026-08-10
- After start: autonomous, task-bounded, no commit/push/ref change
- Coordination: shared tracker and capability ledger; no worker edits to plan control files

The repository tracker and ledger are the authoritative coordination record. `agent_memory` was searched at execution start for relevant project history; shared-memory writes remain prohibited because the user did not authorize a memory update.

## Dependency graph

```text
E1.T1 red visual acceptance harness
             |
             v
  +----------+-----------+
  |          |           |
E2.T1      E2.T2       E2.T3
controls   results     center shell
  +----------+-----------+
             |
             v
      E3.T1 native integrator
             |
             v
 E4.T1 responsive/a11y -> E4.T2 Workbench refinement
             |
             v
       E5.VERIFY -> E5.AUDIT
```

E2 tasks are parallel only because they create file-disjoint presentational components. E3 owns all integration edits serially. E4 starts only after desktop composition is green. E5 uses fresh agents and is read-only except for reports.

## Required skill stack

- Coordinator: `agent-spec-writing`, `agent-delegation-planning`, `agent-delegation-routing`, `agent-capability-ledger`, `verification-before-completion`.
- UI workers: repository frontend and Redis UI component instructions, `redis-product-ui`, `playwright-cli-agent` for visual inspection, and `$agent-delegation-routing` for route confirmation.
- Test workers: repository testing instructions and `playwright-test`.
- Auditor: `code-review`, `playwright-cli-agent`, and `verification-before-completion`.

## Routing

| Task class                 | Role                      | Preferred route | Reasoning | Fallback                                         |
| -------------------------- | ------------------------- | --------------- | --------- | ------------------------------------------------ |
| Browser acceptance harness | Implementor/Test Engineer | `gpt-5.6-terra` | medium    | same model high                                  |
| Redis product composition  | UI Designer               | `gpt-5.6-terra` | high      | `gpt-5.6-sol` high                               |
| Native integration         | Integrator                | `gpt-5.6-terra` | high      | `gpt-5.6-sol` high                               |
| Verification               | Verifier                  | `gpt-5.6-terra` | high      | `gpt-5.6-sol` high                               |
| Independent final audit    | Auditor                   | `gpt-5.6-sol`   | high      | no cheaper fallback without coordinator decision |

Workers must begin: `Use $agent-delegation-routing if available to confirm role, model/reasoning, ownership, command shape, and fallback before starting.`

## Proof boundaries

- Unit/component proof does not prove visual fidelity.
- Fixture Playwright proves component behavior, not final product acceptance.
- Final visual proof must use the real RedisInsight route and compare approved screenshots.
- Aggregate lint/type-check baseline failures remain explicit; owned-path diagnostics must be zero.
- Screenshot baselines are reviewed artifacts. Workers may not use `--update-snapshots` unless their task explicitly authorizes a named baseline after coordinator visual review.
