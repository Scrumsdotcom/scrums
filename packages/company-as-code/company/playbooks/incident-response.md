# Playbook: Incident response (cross-domain)

**Owner module:** `company/runtime` (cross-cutting)
**Last updated:** 2026-05-13
**Audience:** operator-on-call (human), incident commander (human), runtime agents (read-only context consumers)
**Tier:** runtime entry-point (Tier 2)

---

## When to run this

Any time a SEV-1, SEV-2, SEV-3, or SEV-4 incident is declared per [`/company/policies/incident-response.md`](../policies/incident-response.md). The runtime workflow `incident-response` invokes the relevant steps of this playbook based on declared severity.

## Inputs

- **Declared severity**: one of `sev-1 | sev-2 | sev-3 | sev-4`
- **Originating signal**: what triggered the incident (alert ID, customer report, audit-log anomaly, agent escalation)
- **Affected modules**: at minimum one; cross-domain incidents commonly touch platform + one of finance / sales-marketing

## Definition of done

- [ ] Severity classified within the SLA from [`escalation-policy.yaml`](../runtime/escalation-policy.yaml)
- [ ] Incident commander assigned and recorded in the audit log
- [ ] Incident TASK opened in `/company/tasks/` with the canonical incident ID
- [ ] All actions emit audit records under the incident correlation ID
- [ ] State transitions emit typed events (`runtime.incident_declared`, `runtime.incident_resolved`)
- [ ] Customer communications (if any) reviewed by the commander before send
- [ ] Resolution event emitted
- [ ] Retrospective plan filed within 7 days for SEV-1 / SEV-2 (and SEV-3 unless explicitly skipped with audit)

## Steps

### 0. Classify

The originating signal lands as either an alert or a human-filed task. The first responder classifies severity per the table in [`/company/policies/incident-response.md`](../policies/incident-response.md). Misclassification is corrected by the commander once assigned, re-classification is itself an audit row.

### 1. Declare

Emit `runtime.incident_declared` with payload:
- `incidentId` (canonical ID, e.g. `INC-PLATFORM-0042`)
- `severity`
- `originatingSignal`
- `affectedModules`
- `commander` (initially the first responder; updated when reassigned)

The runtime opens a TASK with the incident ID in the title.

### 2. Assemble

- For SEV-1 and SEV-2, the commander assembles the war-room: commander + on-call operator(s) + communications lead + scribe. Each role is captured in audit records.
- For SEV-3, the commander may hold scribe and communications roles concurrently.
- For SEV-4, one operator suffices; the commander role is logged but may be informal.

### 3. Stabilize

This is the technical response and is **module-specific**. The playbook does not prescribe the fix. The affected module's playbooks do. The commander's job here is coordination, not implementation:

- Decide which module's playbook is primary.
- Authorize HITL writes per [`/company/policies/hitl-external-writes.md`](../policies/hitl-external-writes.md). Authorizations are recorded.
- Defer non-essential changes: the goal is to stop the bleeding, not improve the system.

### 4. Communicate

- Internal: a continuous chat thread in the team-chat integration (routing per [`escalation-policy.yaml`](../runtime/escalation-policy.yaml)).
- External: customer-facing communications are drafted by the communications lead, reviewed by the commander, and sent through the appropriate integration. Per the HITL policy, customer comms are always human-gated.
- Cadence: status updates every 30 minutes for SEV-1 / SEV-2 until resolution.

### 5. Resolve

When the affected systems are stable and the customer impact has ended:

- Emit `runtime.incident_resolved` with payload:
  - `incidentId`
  - `resolvedAt`
  - `durationSec`
  - `rootCauseSummary` (one paragraph; full RCA goes in the retro)
- The commander marks the incident TASK as `state: completed`.

### 6. Retrospect

Within 7 days (SEV-1 / SEV-2 mandatory; SEV-3 default-yes):

- Open a plan at `/docs/plans/retro-<incidentId>.md` using [`/templates/plan.md`](../../templates/plan.md).
- Include: timeline (extracted from the audit log via correlation ID), contributing factors, action items, follow-up TASKs.
- Action items become real TASKs with owners and due dates.

## Failure handling

- **Commander becomes unavailable mid-incident**: escalate per [`escalation-policy.yaml`](../runtime/escalation-policy.yaml) (`fallback` for the commander role). The handoff is itself an audit row.
- **A required HITL approver is unreachable**: escalate to the role's first fallback. Do not bypass the approval; the policy is uniform under stress.
- **The audit log is unavailable**: pause non-emergency actions; emergency actions proceed and are reconciled into the audit log after recovery, with a typed `audit.reconciled_after_outage` event.

## Observability

- Audit topic: `incident-response`
- Dashboards: [`executive-overview`](../dashboards/executive-overview.yaml), the affected modules' overview dashboards
- Events: `runtime.incident_declared`, `runtime.incident_resolved`, plus module-specific events emitted during stabilization

## Related

- Policy: [`/company/policies/incident-response.md`](../policies/incident-response.md)
- Workflow: [`/company/workflows/incident-response.yaml`](../workflows/incident-response.yaml)
- Standard: [`/docs/standards/observability.md`](../../docs/standards/observability.md)
- Spec section: "Continuous improvement system" (retrospectives as a first-class primitive)
