# Playbook: Production deploy

**Owner module:** `company/domains/product-operations/platform`
**Last updated:** 2026-05-13
**Audience:** platform-lead (operator), with the `deploy-watchdog` agent and `production-deploy` workflow as runtime helpers.
**Tier:** runtime entry-point (Tier 2)

---

## When to run this

A new build candidate is ready to promote to production. Triggered by the platform-lead from the admin surface; **never scheduled**. The runtime refuses to schedule this workflow (`hitl: true`).

## Inputs

- `build-id`: reference into the build system for the candidate
- Pre-flight check results (latest CI status, image scan, change-log)
- The platform-lead's explicit approval

## Definition of done

- [ ] Pre-flight checks recorded
- [ ] Dry-run deploy produced an expected projected payload
- [ ] Platform-lead approval captured in the audit log
- [ ] Live deploy succeeded, emitting `platform.deploy_succeeded`
- [ ] `deploy-watchdog` is observing the post-deploy window
- [ ] No SEV-1 / SEV-2 incident opened in the 30-minute post-deploy window

## Steps

1. **Pre-flight.** Trigger workflow step `pre-flight`. Verifies:
   - All CI checks for the build are green
   - The image has been scanned and no critical vulnerabilities are open
   - The build's change-log includes a manifest diff if any module's `manifest.yaml` changed
   - The deploy window does not overlap a declared SEV-1 / SEV-2 incident

2. **Dry-run.** Trigger workflow step `dry-run-deploy` via the `deploy-to-prod` automation with `dryRun: true`. Inspect the projected payload:
   - Image tag matches expectation
   - Configuration deltas are intentional
   - No unintended secret references
   - Rollback target is the current live image

3. **Approve.** Capture explicit platform-lead approval in the admin surface. The approval audit row carries the build-id, the dry-run correlation ID, and the approver's canonical Person ID. **No bypass under stress**, incident-response has separate channels; deploys do not.

4. **Live.** Trigger workflow step `deploy`. The runtime refuses if step 3 did not produce an approval row. `retries: 0`, failure escalates per the workflow's `onFailure: escalate`. Emits `platform.deploy_succeeded` on success.

5. **Watch.** Trigger workflow step `watch`, the `deploy-watchdog` agent observes the deploy for the next 30 minutes. If three consecutive deploy events fail within that window, the watchdog escalates to the platform-lead per [`escalation-policy.yaml`](../../../../runtime/escalation-policy.yaml).

## Failure handling

- **Pre-flight fails on CI status**: do not proceed. Re-running CI is the fix, not bypassing the check.
- **Pre-flight fails on a manifest diff missing from change-log**: file the missing piece, then re-run pre-flight. Manifest changes that ship undocumented break the modular monolith discipline.
- **Dry-run produces an unexpected image tag**: investigate the build pipeline; the dry-run did its job. Do not approve a dry-run you don't fully understand.
- **Live deploy partial-success**: escalate. Rollback path is the dry-run's recorded rollback target. Do not re-run; investigate via the audit narrative under the deploy correlation ID.
- **Watchdog escalates**: treat as a SEV-2 unless the post-deploy events show customer-facing impact (then SEV-1). Begin [`/company/playbooks/incident-response.md`](../../../../playbooks/incident-response.md).

## Observability

- Audit topic: `production-deploy`
- Dashboards: [`platform-overview`](../../../../dashboards/platform-overview.yaml)
- Events: `platform.deploy_succeeded`, `platform.deploy_failed`
- Metric: `METRIC-PLATFORM-DEPLOY-MTTR` (planned)

## Related

- Workflow: [`production-deploy.yaml`](../workflows/production-deploy.yaml)
- Agent: [`deploy-watchdog.yaml`](../agents/deploy-watchdog.yaml)
- Skill: [`sync-verification`](../../../../skills/sync-verification.yaml), promote a write path to autonomous only after evidence accumulates here.
- Policy: [`/company/policies/hitl-external-writes.md`](../../../../policies/hitl-external-writes.md)
