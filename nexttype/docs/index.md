---
title: NextType
description: TypeScript that proves it. An experimental language where dependent types are the spec and agents write the code.
order: 1
---

# NextType

**TypeScript that proves it.**
Agents write the code.
The compiler checks the contract.
Humans review the spec.

> **Status: design preview.**
> The `ntc` 0.1.0 reference checker type-checks NTΔ against the NT0 core.
> Nothing is measured.
> See [Status](status.md) for what exists today.

## What NextType is

NextType is an experimental execution language for agents.
It has three core ideas:

- **TypeScript lineage.** People review a readable, TypeScript-style view of each contract. Agents write a compact form of the same contract. See [One contract, two views](language/two-views.md).
- **Dependent types are the spec.** A type can refer to a value. So a type can state "the total equals the sum of the lines". The compiler checks that the code satisfies it. See [Contracts](language/contracts.md).
- **Tokens per accepted change.** The main metric is the total model tokens across all attempts, divided by the changes that pass acceptance. Failed attempts count. See [Benchmark design](../benchmarks/README.md).

Programs are typed compiler graphs.
Agents send compact patches and receive explicit obligations.
People approve intent and assumptions.
An independent checker checks each implementation against the fixed contract.

## Safety warning

NextType is experimental.
Expect breaking changes, rough edges, and security issues.
Run it in isolated workspaces, not against production systems or sensitive data.

## Where to go next

| Page | Read it to |
| --- | --- |
| [Status](status.md) | See what exists, what is planned, and what is unmeasured. |
| [Language overview](language/overview.md) | Learn the compiler path from NTΔ to runtime targets. |
| [Contracts](language/contracts.md) | See how a dependent type states a requirement. |
| [One contract, two views](language/two-views.md) | Compare the readable view with the NTΔ agent form. |
| [Language reference](reference/index.md) | Look up the precise rules: types, contracts, effects, NTΔ frames, diagnostics, the protocol, and the grammar. |
| [Glossary](reference/glossary.md) | Look up NTΔ, NT0, Γ, obligation, and other terms. |
| [NTΔ shorthand](language/shorthand.md) | Learn every construct, with checked examples. |
| [Quick reference](reference/quick-reference.md) | Look up frames, terms, results, and codes on one screen. |
| [Patterns for agents](guides/agent-patterns.md) | Write streams that pass, and read each result. |
| [The ntc reference checker](tools/ntc.md) | Build `ntc` and check NTΔ streams. |
| [Security model](reference/security-model.md) | See what the checker trusts, rejects, and bounds. |
| [The nt preview CLI](tools/cli.md) | Install `nt`, read the guide, and check an obligation ledger. `nt` is not a type checker. |
| [Examples](../examples/README.md) | Read the invoice, vector, and state examples. |
| [Why NextType](../research/why-nexttype.md) | Understand the design position. |
| [Benchmark design](../benchmarks/README.md) | See how the project plans to measure tokens, time, and defects. |
| [Foundational paper](../research/paper/README.md) | Read the one-page concept note (PDF and HTML). |
| [Contributing](https://github.com/Scrumsdotcom/scrums/blob/main/CONTRIBUTING.md#nexttype-nexttype) | Find how to help. |
