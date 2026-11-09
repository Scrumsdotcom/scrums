# Policy: Incident response

**Status:** Active
**Owner:** [Lead maintainer](../../MAINTAINERS.md)
**Last updated:** 2026-05-13
**Operationalized by:** [`/company/playbooks/incident-response.md`](../playbooks/incident-response.md), [`/company/workflows/incident-response.yaml`](../workflows/incident-response.yaml)

## Rule

A declared incident triggers a coordinated response: severity classification within 15 minutes, an accountable incident commander, every action audit-logged, every state change emitted as a typed event, and a retrospective within 7 days of resolution.

## Severity classification

| Severity | Trigger | Response posture |
|---|---|---|
| **SEV-1** | Customer-facing outage; data loss; security breach; revenue impact > 1 hour | Page on-call immediately; incident commander assigned within 5 min; war-room within 15 min |
| **SEV-2** | Significant degradation; partial outage; financial or compliance risk | Page on-call within 15 min; incident commander within 30 min |
| **SEV-3** | Minor degradation; internal-only impact; workaround available | Open within working hours; incident commander on best-effort |
| **SEV-4** | Anomaly worth investigating; no current impact | Open as task; triaged in regular cadence |

## Roles

- **Incident commander.** One person. Coordinates response, makes the calls, owns communications. Often *not* the most technical person. The role is coordination.
- **Operator-on-call.** Executes the technical response under the commander's direction.
- **Communications lead.** External / customer communications; coordinated with the commander.
- **Scribe.** Captures the timeline in the audit log; ensures every action emits a typed event.

For SEV-3 and SEV-4 one person may hold multiple roles. For SEV-1 and SEV-2 the commander does only the commander job.

## Required artifacts

Every incident, regardless of severity:

- An incident **TASK** in `/company/tasks/` with a stable canonical ID
- An incident **correlation ID** threading every audit record from detection to resolution
- A typed event `runtime.incident_declared` at start
- A typed event `runtime.incident_resolved` at end
- A retrospective **plan** in `/docs/plans/` filed within 7 days

## Hard rules

- **No silent recovery.** Even when an automated system self-heals, the incident-resolved event must fire.
- **No untyped events.** Free-text incident logs are out of scope of the typed event ledger.
- **No off-the-record decisions.** If a call is made in chat, the commander or scribe transcribes it into the audit log immediately.
- **No retrospective skipping.** SEV-1 and SEV-2 retros are mandatory. SEV-3 retros default to "yes" with an explicit "skip" requiring the commander's sign-off and an audit record.

## Related

- Playbook: [`/company/playbooks/incident-response.md`](../playbooks/incident-response.md)
- Workflow: [`/company/workflows/incident-response.yaml`](../workflows/incident-response.yaml)
- Standard: [`/docs/standards/observability.md`](../../docs/standards/observability.md)
- Spec section: "Audit log + typed event ledger"
