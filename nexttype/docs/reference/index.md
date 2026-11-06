---
title: Language reference
description: How to read the NextType reference, its notation, and its status labels. Every rule here is a design, not an implementation.
order: 1
---

# Language reference

> **Status: the restricted core is implemented in the `ntc` 0.1 reference checker.**
> The NTΔ codec (`ntd/1`), the NT0 core, the kernel, and the diagnostics are **Implemented**: the conformance suite checks them.
> Effects, modules, targets, the readable-view parser, and proof integration remain designs.
> Each page and rule says which applies.

The reference is compact.
It states rules, not tutorials.
For an introduction, read the [language overview](../language/overview.md) first.

## Pages

| Page | Covers |
| --- | --- |
| [Lexical structure](lexical.md) | Tokens, slots, aliases, names, literals, and comments. |
| [Types](types.md) | Primitive types, records, unions, vectors, generics, dependent types, and refinements. |
| [Contracts and obligations](contracts.md) | Preconditions, postconditions, invariants, obligations, and how an obligation is discharged. |
| [Functions and effects](functions-effects.md) | Total functions, effect rows, handlers, capabilities, and foreign functions. |
| [Modules and imports](modules.md) | Manifests, content-addressed identity, exports, and application bindings. |
| [Readable view and NTΔ](views.md) | The full construct-by-construct mapping between the two views. |
| [NTΔ edit frames](edit-frames.md) | Slot definitions, `put`, `ck`, `get`, and how a patch applies. |
| [Diagnostics](diagnostics.md) | Proof results, diagnostic frames, and known codes. |
| [Machine protocol](protocol.md) | The planned requests and responses for tools and agents. |
| [Evidence and approval](evidence.md) | The approval envelope, the evidence record, and verification levels. |
| [Grammar](grammar.md) | An EBNF summary of the draft NTΔ form and the semantic outline. |
| [Glossary](glossary.md) | Short definitions of every term. |

## Status labels

Each page and each major rule carries one label:

| Label | Meaning |
| --- | --- |
| **Designed** | The language plan states the rule in detail. It can still change. |
| **Planned** | The language plan names the feature. The details are not fixed. |
| **Open** | The language plan does not decide it. The page lists the question. |

| **Implemented** | The reference checker implements the rule, and a conformance case checks it. |

A rule becomes implemented only when conformance evidence exists.
The plan's per-feature statuses are `planned`, `specified`, `implemented`, `conformant`, `deprecated`, and `unsupported`.
The NTΔ codec, the restricted core, and the diagnostics are `implemented`.
Everything else is `planned` or `specified`.

## Notation

The reference uses these conventions:

| Notation | Meaning |
| --- | --- |
| `c0 (sig t Z …)` | NTΔ agent form. Monospace, S-expression style. |
| `function total(…)` | Readable view. TypeScript-style, for human review. It is not arbitrary TypeScript. |
| `Γ = {n:N, xs:V Z n}` | A typing context. Each entry is `name:type`. A manifest supplies it. |
| `@b0`, `@a0` | Local aliases. Each resolves to an exact digest through the session manifest. |
| `c0`, `f0`, `o0` | Local slots for a contract, a fragment, and an obligation. |
| `U0`, `N`, `Z` | ASCII forms of the universe `U₀`, the naturals `ℕ`, and the integers `ℤ`. |
| `A -> B` | A compiler pass or a data flow, not a function type. |
| *italic term* | A term from the [glossary](glossary.md). |

Examples show both views when the design has both.
Where the design has only one view, the page says so.

## Representations

NextType separates four representations.
Most reference pages describe the first three.

| Representation | Consumer | Identity |
| --- | --- | --- |
| Approved contract graph | The acceptance authority. | An immutable contract digest. |
| NT0 typed graph | The checker and the reference evaluator. | A canonical semantic digest. |
| NTΔ edit stream | Generation and repair agents. | Resolves to NT0 before acceptance. |
| Target IR | Backends and runtimes. | Binds back to checked NT0 and pass identities. |

The readable view is a projection of the contract graph and NT0 for people.
A text file is one projection of the graph.
Changing a summary or a view cannot change an approved contract.

## Sources

The design comes from the NextType language plan, sections 3 to 17.
Rule ids such as C01 refer to the plan's 60 completeness areas.
See [Status](../status.md) for what exists today.
