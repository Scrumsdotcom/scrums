# Standard: write discipline

**Applies to:** every mutation of a system outside this repository, whether
performed by a human, an agent, or an automation.

The sync verification protocol says how to run a state-mutating sync safely.
This standard says how to build the write path so that the protocol has
something safe to run, and so that a crashed or colliding operator leaves a
state a fresh run can finish.

These rules were forced by failures rather than designed in advance:
concurrent operators working the same ledger, sessions dying mid-write,
scheduled jobs that stopped running without anyone noticing. Where a rule
looks paranoid, it is because the cheerful version of it failed.

## 1. Deterministic references

Every external write carries an identity derived from its cause, not from the
clock or a counter. A hash of the source transaction ID. A slug built from the
canonical entity ID and the period. The same cause maps to the same reference
on every run, forever.

The payoff is that a re-run detects prior work instead of repeating it. Without
this, every other rule here is unenforceable, because you cannot tell your own
previous write from a new one.

## 2. The external system is the write-ahead log

Stamp evidence into the system you are mutating: the deterministic reference,
a note naming the source signal, a comment on the parent record. A crashed
session's progress then becomes readable by any successor from the target
system itself.

Do not keep progress in local state. Local state dies with the session that
held it, which is precisely the moment you need it.

## 3. Recovery is re-running the process

With rules 1 and 2, there is no separate crash-recovery procedure. Idempotency
branches find what landed and do only what is missing.

Design every mutation sequence so that stopping at any point leaves a state a
fresh run can finish. If a sequence has a step where stopping leaves an
unrecoverable middle, that step is the design problem, not the crash.

## 4. Fresh pre-write reads, never cache

Immediately before every write, re-read the exact records involved. If the
state changed since you looked, halt and flag.

An unexplained mid-run change is an implicit foreign lease: somebody or
something else is working this record. Proceeding on a stale read is how two
operators produce a state neither of them intended.

## 5. Post-read every write

A write you did not read back is a write you do not know happened. Require the
post-read to match intent exactly, and log before and after.

Success responses are claims about what the remote system accepted, not
observations of what it stored.

## 6. Bulk pulls prove presence, never absence

Paged lists lie at the cutoff and under load. Any conclusion of the form "X
does not exist" must be re-verified with a targeted direct lookup before it
becomes a flag or, much worse, a create.

The expensive version of this failure is a duplicate record created because
page three of a list came back empty under load.

## 7. Derive state from the owning side

A record's state lives on the record, matched by ID and deterministic
reference. It does not live on whatever happens to name that record from the
other side of a link.

Link tables and denormalized references go stale. The owning side does not.

## 8. Corrections supersede, never rewrite

Reports and published outputs are append-only. A wrong conclusion is retracted
by a dated `## Correction` section that names what it supersedes.

The company may be publicly wrong and then visibly repair itself. That is a
feature, and it is only possible if history is never edited. An organization
that quietly fixes its own past record has no past record.

## 9. A confident-looking signal is not verification

An empty search result, a validation error's literal wording, a document's own
stated cadence, another system's ledger: each can be mistaken for ground truth
because it looks authoritative.

When a check is meant to establish presence, absence, cause, or schedule, trace
it to the source that actually knows, not to a description or proxy of it. A
process's documentation describing its intended cadence is a claim about
intent, not evidence of what runs.

Rules 4, 6, and 7 are this principle applied specifically to writes. It holds
just as well for reads, diagnosis, and doctrine.

## Enforcement

| Rule | How it is enforced |
|---|---|
| 1, 3 | Automation invariants declare idempotency on the deterministic key; reviewed at merge |
| 2, 5 | The audit record captures before and after; `CTRL-RUNTIME-ACTIVITY-LEDGER` |
| 4 | Declared as an invariant on any automation with a `mutates` block |
| 6, 7, 9 | Operator and agent discipline; named in the adversarial verification posture |
| 8 | Repository convention; corrections are commits, never amends |

The rules that are not machine-enforced are named here anyway. A standard that
only lists what CI can check is a description of the CI configuration.

## Provenance

Distilled from live operation of an agent-run business, published in the
[organizational-seed](https://github.com/codeyogi911/organizational-seed)
project, and adapted here. Folding in proven ideas from neighbouring projects
with attribution is itself a practice worth keeping.

## See also

- [`/company/skills/sync-verification.yaml`](../../company/skills/sync-verification.yaml)
- [`/docs/standards/concurrency.md`](./concurrency.md)
- [`/docs/architecture.md#sync-verification-protocol`](../architecture.md)
