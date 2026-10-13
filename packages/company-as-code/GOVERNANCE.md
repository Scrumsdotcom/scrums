# Governance

How decisions get made in this repository, and who makes them.

## The short version

The specification is the source of authority. It changes through a Proposal
with a recorded ruling, and architectural changes additionally carry an ADR.
Everything else moves through ordinary pull request review.

## Roles

**Lead maintainer.** Accepts or rejects Proposals and ADRs, owns the conserved
paths listed in [`.github/CODEOWNERS`](./.github/CODEOWNERS), and is
accountable for releases. Currently Gerald Neves; see
[`MAINTAINERS.md`](./MAINTAINERS.md).

**Maintainers.** Review and merge pull requests outside the conserved core.
Added through demonstrated contribution plus an ADR proposing the addition.

**Contributors.** Anyone who opens an issue, a discussion, or a pull request.
No agreement to sign beyond the Apache-2.0 terms recorded in
[`MAINTAINERS.md`](./MAINTAINERS.md).

## Stewardship

Today one person decides and one company sponsors the work. What that means
for anyone building on the project, what will not change if the sponsor's
priorities do, how someone becomes a maintainer, and when a foundation would
make sense are written down in plain language in
[`docs/governance/stewardship.md`](./docs/governance/stewardship.md).

Questions that are still open, each with options and a current leaning, are
in [`docs/governance/discussion.md`](./docs/governance/discussion.md). That
page exists to be argued with.

## The conserved core

The paths in [`.github/CODEOWNERS`](./.github/CODEOWNERS) change only through a
[Proposal](./company/proposals): the specification, the standards, the ADRs,
the schemas, the policies, the autonomy and escalation policies, the
requirements and controls, and the CI workflows.

Everything else is free. That boundary is deliberate. A repository where every
path needs the same review does not have a conserved core, it has a
bottleneck. See [`docs/standards/conserved-core.md`](./docs/standards/conserved-core.md).

## How a decision is recorded

1. **Proposal.** States the friction, the evidence, the expected benefit, how
   the change will be validated, and how it is rolled back.
2. **Ruling.** The lead maintainer's decision, recorded on the Proposal with
   their canonical ID, the date, and their words quoted verbatim. A ruling
   claimed anywhere else is not a ruling.
3. **ADR**, when the change is architectural. Numbered, dated, status-tracked.
   Superseded ADRs are never deleted; the history is the audit trail.
4. **Pull request.** The merge is the mechanical half of the ruling.

## Disagreement

Disagreement is resolved on the evidence in the Proposal, not on seniority. If
the evidence does not settle it, the lead maintainer decides and records the
reasoning verbatim, including the argument that lost. A ruling that does not
say what it rejected is worth less later, when the question comes back.

## Forking

Apache-2.0. Fork it, run a company on it, build products above it, sell what
you build. The schemas are the compatibility surface; an implementation that
validates against them is portable.

A fork that diverges from the specification is not a defect. It is the point.
Divergence worth upstreaming comes back as a Proposal.

A fork owns its company and its governance, including this file and
`docs/governance/`. It does not own the framework it runs on. The line
between the two is declared in
[`docs/standards/framework-boundary.md`](./docs/standards/framework-boundary.md),
and keeping to it is what lets a fork take upstream releases with
`cac upgrade` instead of a merge.

## Changing this document

Through a Proposal, like the rest of the conserved core.
