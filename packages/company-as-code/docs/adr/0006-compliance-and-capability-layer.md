# ADR 0006: Compliance and capability as typed primitives

- **Status:** Accepted
- **Date:** 2026-08-16
- **Deciders:** Seed maintainers
- **Tags:** compliance, governance, resilience, schemas
- **Proposal:** [PROP-0001](../../company/proposals/PROP-0001-compliance-and-capability-layer.yaml)

## Context

The framework could describe how work executes. It could not describe two
things that turn out to matter as much:

**What the company is obliged to be able to prove.** The repository held a
policy-to-control matrix as a hand-maintained Markdown table. Nothing read it,
nothing validated it, and it covered framework-internal rules rather than the
external obligations a certification or a regulation imposes. An audit request
would have been answered the way it usually is: by a person spending a quarter
assembling evidence that already existed but was scattered.

**Who does something when the named owner cannot.** No artefact in the
repository answered that question for any function. Escalation policy answers
"who gets paged," which is adjacent but different: routing an interrupt is not
the same as the function surviving.

Both gaps existed as prose. Prose cannot fail a build.

## Decision

Add four primitives, with schemas, worked examples, generated views, and
validation.

**`Requirement`** states an obligation: framework, clause, statement, owner,
scope, severity. It never names the controls that satisfy it.

**`Control`** states a mechanism: what it implements, how it is verified, on
what cadence, where the evidence lands. `implements` is the single writer of
the requirement-to-control edge.

**`Capability`** states something the company must be able to do, with a
primary owner, an ordered fallback chain, and a final fallback that cannot
itself be absent. Every link declares how much of the capability it actually
delivers.

**`Proposal`** is the mutation queue for the conserved core: reason, evidence,
benefit, validation, rollback, and a ruling quoting the decider verbatim.

Three gates ship with them:

1. An `in-scope` Requirement with no operating Control fails validation.
2. A Capability chain must terminate in a non-agent holder, must not repeat a
   holder, and must carry an intermediate fallback when high or critical.
3. A Proposal's status must agree with its ruling.

Two generated views, both drift-gated: `control-matrix.json` inverts the
`implements` edges into per-requirement coverage with an explicit `gaps` array;
`capability-map.json` flattens the chains and reports degradation depth and
ownership concentration.

## Consequences

**Good.** A coverage gap becomes a build failure rather than an audit finding.
A capability chain that terminates in an agent is caught at authoring time. The
control matrix is derived, so it cannot silently stop matching reality, which
is the failure mode of every compliance spreadsheet ever maintained.

**Good.** The `delivers` field makes fallback chains honest. A chain claiming
`full` at every link is now a visible claim rather than an implicit one.

**Cost.** Four new schemas, four new folders in the canonical structure, and
the ongoing obligation to keep `lastVerified` dates current. A control with a
stale date is a doctor finding, which is deliberate friction: the alternative
is a repository asserting that controls operate when nobody has checked.

**Cost.** The canonical repository structure changed, which is a specification
change. That is what PROP-0001 exists to record.

**Risk.** The compliance layer can become theatre if controls are written to
satisfy the gate rather than to describe real mechanisms. The mitigation is the
`verification.check` field: an automated control must point at something that
actually runs, and a reviewer can follow the pointer.

## Alternatives considered

**Keep compliance as prose in `/docs/standards`.** Rejected. Prose cannot fail
a build, and the whole argument for this framework is that a rule which is not
versioned and enforced is a preference.

**Model compliance in an external GRC tool and sync.** Rejected as the default.
It reintroduces bidirectional sync between the coordination layer and a system
of record, which ADR-0003 forbids. A fork may project the generated matrix
outward, which is one-directional and fine.

**Fold capability ownership into the escalation policy.** Rejected. They answer
different questions and change at different rates. Escalation routes an
interrupt to a person; capability describes what that person can do once they
pick up.

**Let Requirements list their Controls.** Rejected. Two lists that must agree
will eventually disagree. One writer per edge, as everywhere else.

## Implementation

- `schemas/{requirement,control,capability,proposal}.schema.json`
- `cli/src/compliance.ts`: the two generators
- `cli/src/validate.ts`: checks 11 through 14
- `company/{requirements,controls,capabilities,proposals}/`: worked examples
- `templates/{requirement,control,capability,proposal}.yaml`

## Links

- [`/docs/compliance.md`](../compliance.md)
- [`/docs/capabilities.md`](../capabilities.md)
- [`/docs/standards/conserved-core.md`](../standards/conserved-core.md)
- [ADR-0003](./0003-unidirectional-mutation.md) for the one-writer principle
