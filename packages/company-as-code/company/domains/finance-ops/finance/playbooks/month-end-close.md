# Playbook: Month-end Close

**Owner module:** `company/domains/finance-ops/finance`
**Last updated:** 2026-05-12
**Audience:** finance-lead (human operator), with the `cash-forecaster` agent and `month-end-close` workflow as runtime helpers.
**Tier:** runtime entry-point (Tier 2)

---

## When to run this

The first business day after the calendar month ends, after upstream pipeline data has settled. Triggered by the finance-lead from the admin surface; never scheduled.

## Inputs

- `period`: calendar month being closed (e.g. `2026-04`)
- Latest canonical ledger as of `period_end + 1 day`
- Approval from finance-lead

## Definition of done

- [ ] Baseline numbers recorded
- [ ] Dry-run journal entry inspected and matches expectation
- [ ] Counts confirmed against baseline
- [ ] Finance-lead approval captured in the audit log
- [ ] Live close posted
- [ ] Re-verification matches dry-run projection
- [ ] `finance.period_closed` event emitted

## Steps

1. **Baseline.** Run `cash-forecaster` once with `--read-only`. Record current cash, A/R, deferred revenue, and recognized revenue. Save the output to the audit log.
2. **Dry-run the close.** Trigger workflow step `dry-run-close`. Inspect the projected period-close journal entry. Verify accounts, sign, magnitudes.
3. **Confirm counts.** Compare projected delta against baseline. If any account moves by >10% beyond expectation, **stop**: open a TASK with the playbook ID in the title and escalate to the CFO.
4. **Approve.** In the admin surface, capture explicit finance-lead approval. The audit record carries the approver canonical ID.
5. **Go live.** Trigger workflow step `live-close`. The runtime refuses to proceed without a captured approval. No retries, failure escalates to the CFO.
6. **Re-verify.** Run `cash-forecaster` again. Compare to dry-run projection. Drift > 0.5% on cash position is an incident.

## Failure handling

- **Step 2 fails to produce a dry-run:** check `cash-forecaster` audit log; do not skip step 2.
- **Step 3 reveals an unexpected delta:** stop and escalate. Do not "force" the close.
- **Step 5 partially succeeds:** record the audit, do not re-run; investigate via the audit log before any remediation.
- **Step 6 reveals drift:** open an incident; flag the workflow as `state: blocked` in the runtime.

## Observability

- Audit topic: `month-end-close`
- Dashboards: `finance-overview`
- Events: `finance.period_closed`, `finance.cash_forecast_updated`
- Metric: `METRIC-FIN-CLOSE-ON-TIME`

## Related

- Workflow: [`month-end-close.yaml`](../workflows/month-end-close.yaml)
- Agent: [`cash-forecaster.yaml`](../agents/cash-forecaster.yaml)
- Initiative: [`INIT-FIN-0001`](../../../../initiatives/INIT-FIN-0001-monthly-close-automation.yaml)
- Metric: [`METRIC-FIN-CLOSE-ON-TIME`](../../../../metrics/METRIC-FIN-CLOSE-ON-TIME.yaml)
- Goal: [`GOAL-FIN-0001`](../../../../goals/GOAL-FIN-0001-monthly-close-on-time.yaml)
