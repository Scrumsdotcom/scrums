# Scenario: Responding to a cross-domain incident

A simulated **SEV-2 incident** that touches the platform module's billing reconciliation and the finance module's month-end close cadence. This scenario shows how cross-domain coordination works when the cognition tree has to pull in multiple modules at once — and how policy, workflow, playbook, and audit log compose to leave a queryable trail.

> Time horizon: a few hours from declaration to resolution. Retrospective filed within 7 days.

---

## The cast

| Primitive | File |
|---|---|
| Policy | [`/company/policies/incident-response.md`](../../company/policies/incident-response.md) |
| Workflow | [`/company/workflows/incident-response.yaml`](../../company/workflows/incident-response.yaml) |
| Playbook | [`/company/playbooks/incident-response.md`](../../company/playbooks/incident-response.md) |
| Affected modules | [`platform`](../../company/domains/product-operations/platform/manifest.yaml), [`finance`](../../company/domains/finance-ops/finance/manifest.yaml) |
| Agents involved | `billing-reconciler`, `cash-forecaster`, `deploy-watchdog` |
| Escalation routing | [`/company/runtime/escalation-policy.yaml`](../../company/runtime/escalation-policy.yaml) |
| Event types | `runtime.incident_declared`, `platform.billing_reconciliation_proposed`, `runtime.incident_resolved` |

---

## T-0 — Detection

At 09:14 UTC, the `billing-reconciler` agent runs its nightly reconciliation. The agent is `human-gated` — it produces proposals, never writes back to the external billing system. The proposal includes a flag: **15% of canonical subscriptions show no matching record in the external billing system**.

This is far outside the expected drift. The agent does what it always does — emits `platform.billing_reconciliation_proposed` with the unusual delta. The `billing-reconciliation-stale` alert on the [`platform-overview`](../../company/dashboards/platform-overview.yaml) dashboard fires.

The on-call operator (binding resolved via [`escalation-policy.yaml`](../../company/runtime/escalation-policy.yaml) → `on-call-platform`) is paged.

---

## T+0:05 — Classification

The operator opens the alert. The proposal payload is sitting in the audit log; the operator reads it. Two facts emerge:

1. The number of canonical subscriptions hasn't dropped. The disappearance is in the external billing system's records.
2. The finance module's `cash-forecaster` last ran at 07:00 and didn't flag anything — the integration with billing is read-only via the proposal pipeline, so cash forecast hadn't picked it up yet.

The operator declares **SEV-2** — significant degradation, financial reporting at risk if unresolved before the next monthly close. The first responder is also the incident commander for the first 30 minutes per [`escalation-policy.yaml`](../../company/runtime/escalation-policy.yaml) `sev-2` SLA.

---

## T+0:06 — Declaration

The operator triggers the [`incident-response.yaml`](../../company/workflows/incident-response.yaml) workflow with `severity: sev-2`. The workflow's `declare` step emits:

**Event row 1**: `runtime.incident_declared`
- `entity.canonicalId: INC-CROSS-0042`
- `payload.severity: sev-2`
- `payload.affectedModules: [platform, finance]`
- `payload.commander: people:platform-on-call`

A TASK opens at `/company/tasks/INC-CROSS-0042.yaml` with the canonical incident ID. The same correlation ID will thread every audit record from this point.

---

## T+0:10 — Assemble

The commander assembles the war-room per the SEV-2 SLA:
- Commander: the on-call platform operator (initial)
- Operator-on-call: the on-call finance operator (joined for cross-domain coordination)
- Communications lead: head-of-finance (customer-facing implications)
- Scribe: the on-call platform operator's pair

Each role binding is captured in audit records under the incident correlation ID.

---

## T+0:20 — Stabilize

The commander invokes the workflow's `stabilize-with-war-room` branch (chosen because severity is `sev-2`). This step is a `human-approval` — the runtime doesn't prescribe the fix; the commander's playbook calls do.

The war-room walks the affected modules' playbooks:

### platform → billing sub-cognition

The team reads the proposal payload. The 15% gap traces to a recent change in the external billing system: a vendor-side migration moved some subscriptions to a new account namespace without updating the IDs that the canonical mapping points at. The canonical IDs are intact; the **external mapping is stale**.

The fix is **not a write** — it's an update to the integration's canonical-ID mapping. Per [`/company/skills/add-integration.yaml`](../../company/skills/add-integration.yaml), changing an `externalIdField` is a manifest change, and the rotated mapping is recorded against the existing canonical IDs. The commander authorizes the manifest change as a one-PR fix.

### finance → cash-forecaster

The finance-lead confirms: cash position is unaffected. The forecaster doesn't read from the external billing system directly — it reads from the canonical ledger, and the ledger is intact. The reporting forecast is correct; the **observability of the integration** is what failed, not the underlying state.

This shifts severity tentatively to **SEV-3** at T+0:45, after the commander confirms no customer impact. The reclassification is itself an audit row.

---

## T+0:50 — Communicate

The communications lead drafts an internal status update: the incident is being managed; no customer impact identified; resolution expected within the day. Per the HITL policy, customer-facing communication is gated — the commander reviews and approves the message before send.

**Audit rows** under the same correlation ID:
- Communication drafted
- Communication approved
- Communication sent (via the comms integration)

The runtime emits a typed `runtime.incident_status_update` event (planned addition to the event registry).

---

## T+1:30 — Apply the mapping fix

The platform team opens a PR updating `company/integrations/example-crm.yaml` (or the real integration's manifest) — the rotated external IDs are mapped to the existing canonical IDs.

The PR includes:
- The mapping change
- A regenerated dependency graph (drift gate green)
- A note in the PR body referencing `INC-CROSS-0042`

Validation passes; the PR is reviewed by the platform-lead (per merge policy); it merges. The `billing-reconciler` agent's next nightly run picks up the corrected mapping.

---

## T+2:15 — Resolve

The commander confirms with the war-room that the incident is stable: the mapping is corrected; the next reconciliation will read clean; no customer impact materialized.

The workflow's `resolve` step emits:

**Event row 2**: `runtime.incident_resolved`
- `entity.canonicalId: INC-CROSS-0042`
- `payload.resolvedAt: <timestamp>`
- `payload.durationSec: 8100` (~2h15m)
- `payload.rootCauseSummary: "Vendor-side namespace migration in external billing system rotated subscription IDs without notice. Canonical IDs intact; integration mapping required update."`

The incident TASK is marked `state: completed`. The dashboard alert clears.

---

## T+7d — Retrospective

Within 7 days (SEV-2 mandatory), the commander files a retrospective plan at `/docs/plans/retro-INC-CROSS-0042.md` using [`/templates/plan.md`](../../templates/plan.md).

The plan includes:
- **Timeline** extracted from the audit log via the correlation ID — perfectly chronological because every action emitted under the same correlation ID
- **Contributing factors:**
  - Vendor-side migration without advance notice
  - The mapping-staleness alert threshold was too loose (26h) for the rate of change
  - No proactive monitoring for vendor-side namespace changes
- **Action items, each becoming a TASK:**
  - Tighten the `billing-reconciliation-stale` alert threshold
  - Add a `platform.integration_mapping_changed` event type to the registry
  - Establish a quarterly review of integration mapping freshness
- **Policy update:** consider promoting "integration mapping change" to an explicit type in the [`hitl-external-writes.md`](../../company/policies/hitl-external-writes.md) policy

---

## What this scenario demonstrates

- **Cross-domain coordination works because the cognition tree is explicit.** The platform module owned the integration; the finance module's read interface protected its observability. No domain logic moved; only a mapping changed.
- **Canonical IDs survive vendor instability.** The whole reason this was SEV-2 and not SEV-1 is that the canonical IDs held — only the external mapping rotated. If the framework had replicated billing-system IDs as primary keys, this would have been a multi-day incident.
- **Audit + event ledger together are queryable as a narrative.** Every action under one correlation ID; every state change as a typed event. The retrospective writes itself.
- **HITL throughout protects under stress.** No one bypassed approval gates during the incident; the policy holds when it matters.
- **Retros become real work.** Action items become TASKs, not bullet points in a doc. They have owners and due dates.

---

## What would change for a higher-severity incident

A SEV-1 (customer-facing outage) would:
- Trigger continuous paging until acknowledgment
- Require communications lead from day-one
- Mandate the retrospective regardless of override
- Pull the CEO and CTO into the war-room

The workflow shape is the same; the SLAs and roster are tighter.

---

## Related

- Anatomy: [`workflow.md`](../anatomy/workflow.md)
- Policy: [`/company/policies/incident-response.md`](../../company/policies/incident-response.md)
- Spec section: "Canonical IDs + Evolving System Mappings"
