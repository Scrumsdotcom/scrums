---
title: Status
description: NextType is an M0 design preview. The compiler is planned and no result is measured.
order: 2
---

# Status

**Current maturity: M0 design preview.**
The compiler, the proof service, and the autonomous repair controller are planned.
There is no installable language release.
The `nt` preview script is not a compiler.
No benchmark has run.

## What exists

- A language plan with 60 completeness areas.
- A benchmark plan with fixed definitions and unmeasured targets.
- A one-page foundational paper. See [the paper](../research/paper/README.md).
- A research website with three browser fixture checks.
- A scripted target animation. It runs no model, compiler, or CI service.
- Repository templates: contribution, governance, and security drafts.
- A compact [language reference](reference/index.md). Each rule carries a Designed, Planned, or Open label.
- A preview command, `nt`. It prints the guide and checks the format of an obligation ledger. It has no compiler. See [The nt preview CLI](tools/cli.md).

The browser fixture checks test fixed sample values only.
They do not execute NTΔ.
They do not prove a property for all inputs.

## What is planned

| Stage | Deliverable | State |
| --- | --- | --- |
| 01 | Restricted typed IR and formal semantics | Planned |
| 02 | Lean proof integration and evidence binding | Planned |
| 03 | Approval envelopes and autonomous repair controller | Planned |
| 04 | Invoice application and runtime adapters | Planned |
| 05 | Paired token and correctness benchmarks | Not measured |

The next useful result is small.
Check one nonempty-vector function against its exact formal specification.
Reject its invalid counterpart.
Bind that result to the program.

## What is unmeasured

The north-star targets are goals, not results:

| Metric | Target | State |
| --- | --- | --- |
| Model tokens per accepted change | 50% fewer | Target, unmeasured |
| Elapsed time for matched work | 30% less | Target, unmeasured |
| Escaped-defect rate | 50% lower | Target, unmeasured |

See [Benchmark design](../benchmarks/README.md) for the definitions.

## Maturity levels

The language plan defines these profiles.
A label applies only when its evidence exists.

| Profile | Scope | Evidence required before the label |
| --- | --- | --- |
| M0 — design preview | Plans, compact examples, paper, repository templates, target animation. | Honest status, coherent notation, source references, no measured-performance claim. |
| M1 — executable dependent core | A restricted core with bounded primitives and a reference interpreter. | Real checked positive and negative fixtures; fixed semantics; exact theorem binding. |
| M2 — autonomous change toolchain | M1 plus approval envelopes, machine API, incremental builds, and accounting. | A complete bounded repair loop; protected-contract attacks reject; every attempt is counted. |
| M3 — full application pilot | M2 plus selected UI, API, storage, CLI, job, and event adapters. | One authored operation graph; transaction, authority, and failure tests across all targets. |
| M4 — supported v1 distribution | M3 plus package, release, compatibility, security, documentation, and ownership processes. | Conformance evidence for every in-profile capability. |
| M5 — verified compilation profile | M4 plus a proved preservation or translation-validation path for a named target subset. | The exact target claim follows from checked evidence; the trust base is published. |

A complete plan does not mean M1 exists.
M4 does not mean M5.
