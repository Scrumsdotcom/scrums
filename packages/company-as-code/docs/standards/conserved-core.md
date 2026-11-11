# Standard: the conserved core

**Applies to:** every change to the specification, the standards, the schemas,
the policies, the autonomy and escalation policies, the requirements and
controls, and the CI workflows.

## The idea

Most of this repository is free. Add a task, declare a metric, write a
playbook, open a pull request. Speed there is the whole point.

A small part is conserved, and changing it goes through a
[Proposal](../../company/proposals) with a recorded ruling.

The split is not bureaucratic. It preserves **governance latency**: layers that
change at different speeds should not be able to contaminate each other. Tasks
change hourly. Playbooks change weekly. Standards change monthly. The
specification changes rarely and deliberately. Letting a fast-changing layer
edit a slow-changing one is how strategy drifts without anyone deciding to
drift it.

## What is conserved

The paths in [`.github/CODEOWNERS`](../../.github/CODEOWNERS). That file is the
authoritative list, because it is the one the platform enforces.

A path is worth conserving when a wrong change to it is expensive and quiet:
the damage does not show up in the next test run, it shows up months later as
a system that no longer behaves the way its documentation says. That is why
schemas and policies are on the list and code is not. A wrong schema silently
admits documents that should have been rejected. A wrong function fails a test.

## Three layers of enforcement, honestly ranked

Files cannot enforce anything by themselves. The layers, in descending order of
trust:

1. **Compliance.** Every operator reads this standard before acting on a
   conserved path, and obeys it. This is the weakest layer and the one most
   often mistaken for the whole system.
2. **Review.** All work is diffs. Conserved changes are visible in history,
   detectable, and reversible. This is the real guarantee.
3. **Mechanical gate.** `CODEOWNERS` plus branch protection makes the boundary
   physical: a confused, crashed, or hostile contributor cannot land a
   conserved change without a code-owner review. `cac doctor` reports a repo
   with no `CODEOWNERS` as a finding.

Layer 3 without layer 2 is theatre; anyone with admin can bypass it. Layer 2
without layer 3 works right up until the day nobody reads the diff.

## Setting it up in a fork

1. Copy `.github/CODEOWNERS` and replace the handle with your own or a team's.
2. On the hosted repository, protect the default branch and require review from
   code owners for the listed paths.
3. Decide how direct-to-main rulings work for your instance. A founder ruling
   in a conversation, applied in the same session, needs either that person's
   own push, an admin bypass, or a short-lived pull request. Pick one, record
   the choice, and be consistent.

## The relationship between a proposal and a pull request

They are not the same artefact and neither replaces the other.

A pull request records that a change was merged, by whom, and what the diff
was. It is a record of an event.

A proposal records why the change was necessary, what evidence made it
necessary, what would count as it having worked, and how to undo it. It is a
record of a decision.

The merge button is the ruling. The proposal is everything the merge button
cannot hold. When both exist, quote the ruling verbatim into the proposal so
the record does not depend on the hosting platform still existing.

## Calibration

A healthy conserved core accumulates proposals at a slow, steady rate.

- **One or two a month** is healthy for an actively developed instance.
- **More than five a month** usually means the conserved documents are too
  prescriptive: they are specifying things that should have been left free.
- **Zero over many months** means either the instance is mature, or the
  conserved documents have decayed into boilerplate nobody reads. Re-read them
  to find out which.

## See also

- [`/company/proposals`](../../company/proposals)
- [`/schemas/proposal.schema.json`](../../schemas/proposal.schema.json)
- [`/docs/standards/merge-policy.md`](./merge-policy.md)
- [`/docs/doctor.md`](../doctor.md)
