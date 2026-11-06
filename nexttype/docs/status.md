---
title: Status
description: "NextType is a design preview. The ntc 0.1.0 reference checker type-checks NTΔ against the NT0 core; no performance result is measured."
order: 2
---

# Status

**NextType is a design preview.**
The `ntc` 0.1.0 reference checker decodes NTΔ, elaborates it to the NT0 core, re-checks it in an independent kernel, and binds each proved result to a digest.
There is no published release yet.
The `nt` preview script is not a type checker.
No benchmark has run.

## What exists

- The [`ntc` reference checker](tools/ntc.md) (0.1.0, unreleased): the `ntd/1` codec, the NT0 core with `U0`, `N`, `Z`, vectors, `pi`, `sig`, equality, and vector `case`; an elaborator with implicit arguments; an independent kernel; a reference evaluator; bounded inputs and evaluation; and evidence digests.
- A [conformance suite](https://github.com/Scrumsdotcom/nexttype/tree/main/conformance) of positive and negative cases, seeded property tests, and a fuzzer. Every example in the documentation runs in CI.
- A [security model](reference/security-model.md) and a [versioning policy](reference/versioning.md).
- A compact [language reference](reference/index.md). Each rule carries an Implemented, Designed, Planned, or Open label.
- A one-page foundational paper. See [the paper](../research/paper/README.md).
- A benchmark design with fixed definitions and unmeasured targets.
- A preview command, `nt`. It prints the guide, estimates token counts with a documented heuristic, compares the two views of the design examples, and checks the format of an obligation ledger. Its token counts are estimates, not measurements. See [The nt preview CLI](tools/cli.md).

## What `ntc` 0.1.0 does not do

- It does not parse the readable view.
- It does not lower NT0 to any target or run effects. `build` and `run` frames report `unsupported`.
- It does not check obligations in Lean. A proved result is bound to an evidence digest.
- It has no `Bool`, finite sums, records, or text in the core.

## What is unmeasured

The north-star targets are goals, not results:

| Metric | Target | State |
| --- | --- | --- |
| Model tokens per accepted change | 50% fewer | Target, unmeasured |
| Elapsed time for matched work | 30% less | Target, unmeasured |
| Escaped-defect rate | 50% lower | Target, unmeasured |

See [Benchmark design](../benchmarks/README.md) for the definitions.
The website's browser fixture checks test fixed sample values only. They do not execute NTΔ.
