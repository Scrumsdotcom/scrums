# Playbook: <Title>

**Owner module:** `<module path>`
**Last updated:** <YYYY-MM-DD>
**Audience:** human operator, AI agent, or both
**Tier:** runtime entry-point (Tier 2)

---

## When to run this

A short paragraph or bullet list describing the trigger. Specifically: what state of the world makes this playbook the right thing to follow?

## Inputs

- `<input>`: short description
- `<input>`: short description

## Definition of done

Bulleted, checkable outcomes. The playbook is complete when every item is true.

- [ ] Outcome 1
- [ ] Outcome 2
- [ ] Audit record written

## Steps

1. **Baseline.** Query current state. Record counts, IDs, or hashes, whatever this run would change.
2. **Dry-run.** Execute the relevant agent/workflow with `dryRun=true`. Inspect the audit record's projected payload.
3. **Confirm counts.** Compare the dry-run's projected delta to the baseline. If the number of rows or amounts is wildly different from expected, stop and escalate.
4. **Live.** Execute with `dryRun=false`. Begin with the smallest possible scope.
5. **Re-verify.** Re-query the baseline. Confirm state shifted exactly as the dry-run predicted.

For each step:

- the agent or human responsible
- the audit topic the step writes to
- the rollback path if step fails

## Failure handling

- **If step 3 reveals a wildly different delta:** stop, file a TASK with the playbook ID in the title, escalate to the owner module's accountable contact.
- **If step 4 partially succeeds:** record the audit, do not re-run; investigate via the audit log.
- **If step 5 reveals drift:** open an incident; do not rerun this playbook against the affected scope.

## Observability

- Audit topic(s) this playbook writes to
- Dashboards to watch during execution
- Events emitted on success

## Related

- Linked workflow(s)
- Linked agent(s)
- Linked metric(s)
- Linked ADR(s)
