# Standard: concurrency between operators

**Applies to:** any situation where more than one operator, human or agent, can
act on the same canonical entity or the same external system at the same time.

A single-operator company has no concurrency problem. A company running
several agents on a schedule, plus humans, plus a runtime host, has the same
concurrency problem as any distributed system, and inherits the same failure
modes: lost updates, torn writes, and two actors each believing they hold the
work.

The framework's answer has three parts, in descending order of trust.

## 1. The write discipline is the real boundary

[Write discipline](./write-discipline.md) is what actually keeps concurrent
operators from corrupting shared state. Deterministic references make repeat
work detectable. Fresh pre-write reads catch a record that moved. Post-reads
catch a write that did not land the way it was requested.

Everything below is coordination on top of that foundation. If the foundation
is missing, no amount of coordination helps: two operators politely taking
turns can still both write stale data.

## 2. Session leases are advisory

An operator taking on work that mutates shared state announces it. A lease
records who is working, on what, since when, with what scopes, and carries a
heartbeat refreshed at least every fifteen minutes.

```yaml
operator: <harness and model, or human name>
task: <task ID>
started: 2026-08-16T09:14:02Z
heartbeat: 2026-08-16T09:41:55Z
scopes:
  - billing:mutate
  - repo:company/domains/product-operations/platform
```

Rules:

- **Reads never need a lease.** Only mutation announces itself.
- **A lease goes stale after thirty minutes without a heartbeat.** Any operator
  may break a stale lease, and records that it did so, with a reason.
- **Fencing: the holder re-reads its own lease before every mutation batch.**
  Missing, or replaced with a different start epoch, means halt immediately. A
  superseded session must never write again.

That last rule is the one that matters. Without it, breaking a stale lease
creates two live writers instead of one, and a session that was merely slow
rather than dead resumes writing underneath its replacement.

Leases are scent-marks, not walls. They tell other operators where work is
happening. They do not make writes safe; rule 1 does that.

## 3. Deadman checks

A scheduled agent that stops running produces no error. It produces silence,
which looks identical to a healthy system with nothing to report.

Anything expected to report on a cadence declares that expectation, and
something checks that the report arrived. In this framework that is a
freshness threshold on the metric the agent feeds, an alert on the dashboard
that reads it, or an explicit staleness check in `cac doctor`.

The general form: **growth is the flag, not existence.** A queue with items in
it is normal. A queue whose oldest item keeps getting older is the signal.

## What this deliberately does not do

It does not implement distributed locking. A lease is a file, not a
transaction, and two operators can write leases at the same instant. That is
acceptable because the lease is not what protects the data.

Forks operating at a scale where advisory coordination is insufficient should
put the lock where the state is, in the storage engine, and keep the lease as
the human-readable layer above it.

## See also

- [`/docs/standards/write-discipline.md`](./write-discipline.md)
- [`/docs/standards/observability.md`](./observability.md)
- [`/docs/doctor.md`](../doctor.md)
