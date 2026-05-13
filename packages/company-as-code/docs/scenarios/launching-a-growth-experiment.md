# Scenario: Launching a growth experiment (sales-marketing)

This scenario shows how the **initiative → goal → metric chain** drives a weekly operational cadence for the growth module. The goal is to make it visible how strategic intent reaches all the way down to a specific channel-allocation decision and back up to the metric that judges whether it worked.

> Time horizon: one ISO week. The cadence repeats every Monday.

---

## The cast

| Primitive | File |
|---|---|
| Module | [`growth/manifest.yaml`](../../company/domains/sales-marketing/growth/manifest.yaml) |
| Agent | [`growth-experiment-runner`](../../company/domains/sales-marketing/growth/agents/growth-experiment-runner.yaml) |
| Workflow | [`customer-acquisition`](../../company/domains/sales-marketing/growth/workflows/customer-acquisition.yaml) |
| Playbook | [`launch-experiment.md`](../../company/domains/sales-marketing/growth/playbooks/launch-experiment.md) |
| Automation | [`apply-channel-allocation`](../../company/automations/apply-channel-allocation.yaml) |
| Initiative | [`INIT-GROWTH-0001`](../../company/initiatives/INIT-GROWTH-0001-cac-payback-reduction.yaml) |
| Goal | [`GOAL-GROWTH-0001`](../../company/goals/GOAL-GROWTH-0001-cac-payback.yaml) |
| Metric | [`METRIC-GROWTH-CAC-PAYBACK`](../../company/metrics/METRIC-GROWTH-CAC-PAYBACK.yaml) |
| Skill | [`add-integration`](../../company/skills/add-integration.yaml) (if a new channel is being introduced) |
| Event types emitted | `growth.allocation_recommendation_emitted`, `growth.allocation_applied`, `growth.experiment_stop_loss_breached` |
| Policy applied | [`hitl-external-writes.md`](../../company/policies/hitl-external-writes.md) |

---

## The strategic frame

**Initiative** `INIT-GROWTH-0001` — *Reduce CAC payback to 12 months* — is active for the quarter. Its `goals[]` points at:

**Goal** `GOAL-GROWTH-0001` — *Blended CAC payback ≤ 12 months*, with `comparator: lte` and `horizon.end: 2026-09-30`. Its `metric:` points at:

**Metric** `METRIC-GROWTH-CAC-PAYBACK` — owned by `company/domains/sales-marketing/growth`, formula `blended_cac / monthly_gross_margin_per_customer` over a rolling 90-day window. Lineage references `paid_acquisition_spend` from sales and `monthly_gross_margin` from customer.

This chain is queryable: the initiative knows which goals it advances; the goals know which metric they target; the metric knows where its inputs come from. If any link breaks, validation surfaces it.

---

## Day 0 — Sunday night (autonomous)

The `growth-experiment-runner` agent runs at `09:00` per its schedule. The agent:

1. Reads `pipeline-state` from sales and `customer-health` from customer (declared in its `inputs`)
2. Scores active experiments against the channel-mix model (one of its `tools`)
3. Produces an **allocation recommendation** for the coming week
4. Emits `growth.allocation_recommendation_emitted`
5. Writes an audit record under topic `growth-experiment-runner`

The agent's autonomy is `human-gated` — so this recommendation **changes nothing on its own**. It's input for the operator.

---

## Monday — operator-led week start

The head-of-growth opens the admin surface and queues the `customer-acquisition` workflow for the new week. `hitl: true`; never scheduled.

### Step 1 — Read recommendation

The first workflow step (`kind: agent`) re-invokes the agent in read-only mode, producing the latest recommendation. The runtime assigns a correlation ID that will thread the rest of the week's audit narrative.

**Audit row 1** captures the recommendation contents under correlation ID `acquisition-2026-W19-<ulid>`.

### Step 2 — Dry-run allocation

The workflow advances to a `dry-run` step that invokes `apply-channel-allocation` with `dryRun: true`. The automation:

1. Reads current channel budgets
2. Computes the per-channel shifts it would apply
3. **Validates the invariants:** no single channel shifts > 25% week-over-week without an override; no experiment currently breaching stop-loss appears in the projection; cumulative weekly spend ≤ ceiling
4. Writes an audit record with the projection
5. Mutates nothing external

**Audit row 2** carries the projected shifts.

### Step 3 — Approve

`kind: human-approval`. The head-of-growth reviews the projection. The dashboard panel `growth-overview` is open during this step; the head-of-growth verifies that no experiment is in stop-loss territory before approving.

If any of the invariants in step 2 trigger an override path, the override is itself an audit row and references an ADR. **The runtime refuses to advance past unbridged invariants.**

**Audit row 3** captures the approval with the head-of-growth's canonical Person ID.

### Step 4 — Apply

`kind: live-write`. The same automation runs with `dryRun: false`. It:

1. Re-checks the same invariants against current state
2. Posts the per-channel shifts via the channel integration (vendor-neutral — see [`add-integration` skill](../../company/skills/add-integration.yaml) for how a new vendor is wired)
3. Emits `growth.allocation_applied`
4. Writes an audit record with `causationId` pointing at row 2

`onFailure: escalate, retries: 0`. A rate-limit hit during the apply triggers bounded retry per the integration's `rateLimits`, not the workflow's retry budget — and escalates after 3 throttled attempts.

**Event row** in the typed ledger: `growth.allocation_applied`.

### Step 5 — Monitor

The workflow's final step re-invokes the agent. It:

1. Re-runs stop-loss checks against the new spend levels
2. Verifies no experiment crossed into stop-loss territory due to the shift
3. Records its findings under the same correlation ID
4. Queues the next recommendation cycle (one day out)

If a stop-loss breach is detected, the agent emits `growth.experiment_stop_loss_breached` autonomously (this is the one autonomous side-effect of the otherwise-human-gated agent — and it's a *defensive* side-effect that halts a problem). Resumption requires explicit head-of-growth action.

---

## Tuesday–Friday — observability

The metric `METRIC-GROWTH-CAC-PAYBACK` updates as new acquisition data flows through its lineage (rolling 90-day window). The `growth-overview` dashboard shows the metric trending. If `payback > 14 months`, the warning threshold fires; if `> 18 months`, critical.

The goal `GOAL-GROWTH-0001` reads `status: on-track | at-risk | off-track` based on the metric's current value vs. the target. The initiative tracks against its milestones.

---

## End of quarter — initiative judgment

`INIT-GROWTH-0001` is `active` through 2026-09-30. At quarter end:

- If `METRIC-GROWTH-CAC-PAYBACK ≤ 12 months` (rolling 90d): the goal's `status` transitions to `achieved`, the initiative's milestone "Blended CAC payback ≤ 14 months" is marked `achieved: true`, and the initiative closes as `status: complete`.
- If not: the initiative's status transitions to `paused` or has its `targetDate` extended via an ADR documenting the slip.

Either outcome is a typed event — the executive layer's `gtm-roll-up` agent reads it and surfaces it in the weekly executive brief without any extra wiring.

---

## What this scenario demonstrates

- **Strategic intent reaches operational execution** through a chain of declared primitives: initiative → goal → metric → agent inputs/outputs → workflow step decisions.
- **Human-gated does not mean slow.** The weekly cadence is fast; the operator is in the loop only for the high-stakes decision (approving spend shifts), with the agent doing the analytical heavy lifting around them.
- **One autonomous side-effect is fine when it's defensive.** A `human-gated` agent autonomously halting an experiment that breached stop-loss is allowed — it's *preventing* irreversible loss, not causing it.
- **Vendor-neutral by construction.** The channel integration is named `customer-crm` or `ad-channels`, not the vendor. Swapping channels is a mapping change, not a logic change.
- **Metrics close the loop.** The same metric that the agent's outputs feed is the one the goal is judged against. Strategy and execution share schema.

---

## Related

- Anatomy: [`workflow.md`](../anatomy/workflow.md)
- Skill: [`add-integration`](../../company/skills/add-integration.yaml)
- Spec section: "Cognition tree model"
