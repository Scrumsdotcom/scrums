# ADR 0010: A conformance suite defines correct, not the reference CLI

- **Status:** Accepted
- **Date:** 2026-10-12
- **Deciders:** Lead maintainer
- **Tags:** conformance, interoperability, schemas
- **Proposal:** [PROP-0005](../../company/proposals/PROP-0005-conformance-suite.yaml)

## Context

The getting-started guide calls the CLI "one reference implementation" and
invites ports to other languages. The schemas define the shape of a single
document, but "valid" for a company means more than that: references must
resolve, unknown kinds must fail rather than vanish, and documents must agree
with each other. Today those rules exist only as TypeScript in
`cli/src/validate.ts`.

A second implementation would have to reverse-engineer that file and would
disagree with it in ways nobody notices until a company's documents pass one
tool and fail another. At that point the format has dialects, and each
dialect is only as durable as its tool.

## Decision

1. **Correct is defined by cases.** `/conformance/cases/` holds small company
   trees, each with the verdict any implementation must reach. The reference
   CLI is held to the same cases as everyone else.
2. **Verdicts are coarse.** An implementation reports `valid` and a set of
   `(rule, file)` pairs, with four rules: classification, schema, reference,
   cross-document. Error wording is free; which file failed which rule is not.
3. **Implementations are commands.** Anything that takes a case directory and
   prints the verdict as JSON can be tested with `cac conformance --impl`. The
   reference CLI speaks the same protocol through `cac conformance verdict`.
4. **The suite runs in CI** through the CLI test suite, so a change to the
   validator that changes a verdict fails the build until a case is updated on
   purpose.

## Consequences

**Good.** A port can measure itself without reading TypeScript, and publish a
pass count.

**Good.** Every case is a precise, reviewable statement of a rule. Disagreements
about what the rules mean become pull requests against a case, not arguments
about intent.

**Cost.** Ten cases is a scaffold, not a definition. Most individual
cross-document rules have no case yet, and generation and runtime behaviour
are not covered at all. The README says so.

**Cost.** Changing a validation rule now means changing a case too. That is
the point, but it is friction.

## Alternatives considered

**Write the rules as prose in the spec.** Rejected as the only definition.
Prose is ambiguous in exactly the places that matter, and cannot fail a build.

**Compare error messages.** Rejected. It would freeze the reference CLI's
wording into the standard and make every message improvement a breaking change.

**Compare at the level of individual rules.** Considered, and possible later.
It needs stable rule identifiers for each cross-document check, which do not
exist yet. The four coarse rules are what can be made stable today.

## Implementation

- `/conformance/`: the README, which is the protocol, and the cases
- `cli/src/conformance.ts`: the runner, the reference verdict, the comparison
- `cli/src/loader.ts`: loads a corpus from any directory, not only this repository's
- `cli/test/conformance.test.ts`: runs every case against the reference implementation

## Links

- [`/conformance/README.md`](../../conformance/README.md)
- [`docs/interoperability.md`](../interoperability.md)
