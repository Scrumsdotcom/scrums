---
title: Language overview
description: The proposed NextType compiler path, from compact agent patches to checked runtime targets.
order: 1
---

# Language overview

> Everything on this page is a proposal.
> The parser, compiler, and proof integration are not implemented.

## The program is a typed graph

- **NT0** is the proposed canonical compiler representation. It is a typed, content-addressed term graph.
- **NTΔ** is a compact edit form for agents. It elaborates to NT0 before checking.
- A **readable view** shows the same contract in a TypeScript-style form for human review. See [One contract, two views](two-views.md).

Constructors, effects, and contracts define meaning.
Framework bindings are generated downstream.

## Three parts of a change

| Part | What it does |
| --- | --- |
| Fixed contract | Binds requirements, authority, assumptions, and acceptance tests to an approval envelope. Agents cannot edit it. |
| Compact patch | Sends only the changed fragment and reuses pinned aliases. Dictionary and retrieval overhead count as tokens. |
| Independent check | Checks exact obligations and runtime boundaries. A repair cannot weaken the approved contract. |

## The proposed compiler path

```text
NTΔ -> scope -> elaborate -> NT0
NT0 -> obligations -> independent check
NT0 -> erase -> lower -> effect ABI
ABI -> HTTP | storage | UI | CLI | jobs
```

Each pass declares its invariants and preservation requirements.
A proof about the core model does not verify a backend automatically.
The first implementation will report that boundary explicitly.

## A first core

| Construct | Proposed first boundary |
| --- | --- |
| Exact values | Integers, booleans, immutable records, and finite unions. |
| Indexed data | Nonempty lists, bounded indices, and length-indexed vectors. |
| Total functions | Structural operations with explicit termination requirements. |
| Proof obligations | Equality and supported refinements checked through Lean 4. |
| Explicit effects | Requests handled by declared runtime adapters. |
| Proof holes | Unresolved obligations block proof acceptance. |

## Tools and targets

- TypeScript is the proposed language for the initial tools.
- Lean 4 is the proposed proof backend.
- A reference interpreter is the first execution target.
- Next.js is one application adapter. Storage, UI, terminal, and job bindings are others.

Framework conventions never define core language meaning.

## Proof results

The planned protocol has five results:

```text
proved | refuted | unknown | unsupported | invalid
```

A failed proof attempt does not establish a counterexample.
A timeout remains `unknown`.

## Read next

- [Contracts](contracts.md)
- [One contract, two views](two-views.md)
- [Glossary](glossary.md)
