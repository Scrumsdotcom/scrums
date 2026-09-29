---
title: Why NextType
description: NextType aims to be the next TypeScript for agents, with dependent types as the spec and cost measured per accepted change.
order: 1
---

# Why NextType

> Design position. The compiler is planned and nothing is measured.

## Agents write more code; people still own intent

Agents now write much of the code in a change.
People still decide what the change must do.
Tests catch some errors.
A type system that can state the requirement catches more, and it catches them before runtime.

NextType explores a language built for this split:

- **Agents write the code.**
- **The compiler checks the contract.**
- **Humans review the spec.**

## The next TypeScript, for agents

TypeScript added types to JavaScript without a new runtime.
NextType follows that lineage.
People review a readable, TypeScript-style view.
The first tools are written in TypeScript.
The first application targets are JavaScript, React, and Next.js.

NextType is not a superset of TypeScript.
It does not accept arbitrary TypeScript source.
The readable view is a projection of a restricted, checked core.

## Dependent types as the spec

Most type systems describe shape: "this is a list of integers".
Dependent types can describe facts: "this total equals the sum of these lines".
In NextType, that type is the specification.
The approval envelope fixes it.
An agent can repair the implementation, but it cannot weaken the contract.
See [Contracts](../docs/language/contracts.md).

## One number: tokens per accepted change

Many agent tools optimize the size of the final code or the number of CI runs.
NextType proposes one primary metric: total model tokens across all attempts, divided by accepted changes.
Failed attempts count.
Context, dictionaries, proof attempts, and repairs count.
A cheap run that fails does not count as a saving.
See [Benchmark design](../benchmarks/README.md).

## How NextType differs from graph-native agent languages

Other projects also explore languages for agents.
Some of them make the program graph the main interface: agents patch nodes, and a human view is secondary.
That is a valid direction.
NextType also uses a typed term graph internally, but it puts the weight elsewhere:

| Emphasis | NextType position |
| --- | --- |
| Human interface | A TypeScript-style readable view of each contract, for review. |
| Source of truth for correctness | Dependent types checked by an independent proof backend (proposed: Lean 4). |
| Authority | A fixed approval envelope. Only an owner can change a contract. |
| Success metric | Tokens per accepted change, with failures counted. |

The compact NTΔ patch form is a means, not the goal.
The benchmark design compares it with readable source and typed patches before any codec is selected.

## What NextType does not claim

- It does not claim a compiler exists. It is planned.
- It does not claim any token, time, or defect saving. All targets are unmeasured.
- A proof about the core model does not verify every generated runtime.
- A proof does not show that a requirement expresses the right intent.

Read the [Status](../docs/status.md) page for the current boundary.
