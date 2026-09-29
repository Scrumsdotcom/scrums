---
title: Glossary
description: Definitions of the NextType terms used in these docs, such as NTΔ, NT0, Γ, obligation, and approval envelope.
order: 13
---

# Glossary

| Term | Meaning |
| --- | --- |
| NTΔ | The compact edit form an agent writes. It changes a small fragment against a pinned program base. |
| NT0 | The proposed canonical compiler representation. NTΔ elaborates to NT0 before checking. |
| Readable view | A TypeScript-style projection of the same contract for human review. It is not arbitrary TypeScript. |
| Γ (context) | The typed names in scope for a fragment, such as `A:U0` or `xs:V Z n`. |
| U0 | The first universe: the type of ordinary types. |
| Manifest-bound context | Context that a pinned manifest supplies. Short aliases resolve to exact artifact digests. |
| Obligation | One exact property the checker must establish before a change is accepted. |
| Approval envelope | The fixed, owner-approved record of requirements, semantics, assumptions, acceptance rules, capabilities, edit scope, budgets, and toolchain. Agents work inside it. Only an independent owner can change it. |
| Execution IR | The lowered program after proofs are erased. Proposed; preservation needs its own evidence. |
| ABI | The effect interface that runtime targets call. Handlers enforce authority at runtime. |

## Draft NTΔ vocabulary

| Token | Meaning |
| --- | --- |
| `U0` · `N` · `Z` | Universe, exact naturals, and exact integers. |
| `V A n` · `S n` | Length-indexed vector and successor. |
| `pi` · `lam` · `app` | Dependent functions, abstraction, and application. |
| `sig` · `pair` · `=` · `refl` | Dependent pairs, equality, and reflexivity. |
| `case` · `cons` | Indexed pattern elimination and a vector constructor. |
| `@b0` · `@a0` | Local aliases for exact program-base and approval-envelope digests. |

## Draft operations

| Operation | Proposed meaning |
| --- | --- |
| `get o0 256` | Retrieve bounded context for an obligation. |
| `put f0 c0 @b0` | Patch an authorized hole against an exact base. |
| `ck f0 @a0` | Check the fragment under a fixed approval envelope. |
| `build @p0 @t0` | Build an accepted program for a declared target. |
| `run @x0 @r0` | Execute under a bound runtime and fixture profile. |

These operations are planned.
They are not executable today.
