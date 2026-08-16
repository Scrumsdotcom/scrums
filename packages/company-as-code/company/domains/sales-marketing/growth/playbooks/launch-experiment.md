# Playbook: Launch a growth experiment

**Owner module:** `company/domains/sales-marketing/growth`
**Last updated:** 2026-05-13
**Audience:** head-of-growth (operator), with the `growth-experiment-runner` agent and `customer-acquisition` workflow as runtime helpers.
**Tier:** runtime entry-point (Tier 2)

---

## When to run this

A new acquisition experiment is being introduced into the channel mix, or the weekly allocation review is shifting budget between active experiments. Triggered by the head-of-growth from the admin surface; **never scheduled**. The customer-acquisition workflow is `hitl: true`.

## Inputs

- `week`: ISO week label (e.g. `2026-W19`)
- The agent's most recent allocation recommendation (read from `/generated/skill-index.json` and the agent's audit topic)
- Per-channel stop-loss thresholds (already declared on each experiment; this playbook does not change them)
- Head-of-growth's explicit approval of any spend shift

## Definition of done

- [ ] Recommendation read from `growth-experiment-runner` audit log
- [ ] Dry-run allocation produced a projection that matches the recommendation
- [ ] Per-channel shift ≤ 25% week-over-week, or override audit row exists
- [ ] No active experiment is currently breaching its stop-loss threshold
- [ ] Head-of-growth approval captured in the audit log
- [ ] Live allocation applied, emitting `growth.allocation_applied`
- [ ] Cumulative weekly spend ≤ declared ceiling
- [ ] Monitor step queued to flag stop-loss breaches in the post-application window

## Steps

1. **Read recommendation.** Trigger workflow step `read-recommendation`. The `growth-experiment-runner` agent emits its most recent recommendation (cadence: daily). Verify the recommendation is fresher than 24 hours; if not, regenerate before proceeding.

2. **Dry-run the allocation.** Trigger workflow step `dry-run-allocation` via the `apply-channel-allocation` automation with `dryRun: true`. Inspect the projection:
   - Per-channel `prevBudget → nextBudget` matches expectation
   - No single channel shifts by > 25% week-over-week (without override)
   - No channel currently breaching stop-loss appears in the projection (the automation refuses to apply through breach)
   - Cumulative weekly spend ≤ declared ceiling

3. **Approve.** Capture explicit head-of-growth approval. The approval audit row carries the week, the dry-run correlation ID, and the approver's canonical Person ID. If any of the validations in step 2 require override, the override is itself an audit row and references an ADR.

4. **Apply.** Trigger workflow step `apply` via the same automation with `dryRun: false`. Emits `growth.allocation_applied`. `retries: 0`; failure escalates per the workflow's `onFailure: escalate`.

5. **Monitor.** Trigger workflow step `monitor`. The `growth-experiment-runner` re-runs against the freshly-applied allocations. Specifically:
   - Re-check stop-loss thresholds against the new spend levels
   - Verify no experiment crossed into stop-loss territory due to the allocation shift
   - Emit `growth.allocation_recommendation_emitted` for next week's brief

## Failure handling

- **Recommendation is stale (> 24h)**: re-run the agent; do not apply on stale recommendations. The agent's recommendations are time-sensitive.
- **Dry-run shows a > 25% shift without prior override**: pause. The 25% guardrail prevents starving the funnel; overriding requires explicit head-of-growth + CRO sign-off.
- **Stop-loss breach detected at dry-run time**: the automation refuses; halt the breaching experiment by emitting `growth.experiment_stop_loss_breached` (the agent has the invariant to do this autonomously); resumption requires explicit head-of-growth action.
- **Allocation apply rate-limited by the channel integration**: bounded retry per the integration's `rateLimits`; escalate after 3 failures. Do not split the apply across multiple invocations to bypass rate limits.
- **Cumulative spend would exceed the ceiling**: the automation refuses; head-of-growth must re-approve at a lower amount. Do not raise the ceiling in the moment; that's an ADR-gated change.

## Observability

- Audit topic: `apply-channel-allocation` + `growth-experiment-runner`
- Dashboards: `growth-overview`
- Events: `growth.allocation_recommendation_emitted`, `growth.allocation_applied`, `growth.experiment_stop_loss_breached`
- Metric: [`METRIC-GROWTH-CAC-PAYBACK`](../../../../metrics/METRIC-GROWTH-CAC-PAYBACK.yaml)

## Related

- Workflow: [`customer-acquisition.yaml`](../workflows/customer-acquisition.yaml)
- Agent: [`growth-experiment-runner.yaml`](../agents/growth-experiment-runner.yaml)
- Automation: [`/company/automations/apply-channel-allocation.yaml`](../../../../automations/apply-channel-allocation.yaml)
- Initiative: [`INIT-GROWTH-0001`](../../../../initiatives/INIT-GROWTH-0001-cac-payback-reduction.yaml)
- Goal: [`GOAL-GROWTH-0001`](../../../../goals/GOAL-GROWTH-0001-cac-payback.yaml)
