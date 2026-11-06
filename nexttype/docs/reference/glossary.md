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
| Hole | An unresolved obligation with a name, an expected type, and a local context. A remaining hole blocks acceptance. |
| Slot | A short, typed, local name for a contract (`c0`), a fragment (`f0`), or an obligation (`o0`). See [Lexical structure](lexical.md). |
| Alias | A local name that starts with `@`, such as `@b0`. It resolves to an exact digest through the session manifest. |
| Session manifest | The immutable record that supplies names, slots, contracts, constructor signatures, and dependency digests once per session. See [Modules and imports](modules.md). |
| Contract root | The digest of a contract's preconditions, postconditions, invariants, termination, and public signatures. See [Contracts and obligations](contracts.md). |
| Discharge | To establish an obligation with checked evidence: definitional equality, a proof term, a trusted lemma, or a reconstructed solver result. |
| Effect row | The list of effects an operation may perform, such as `!{store.write}`. See [Functions and effects](functions-effects.md). |
| Capability | A runtime-created permission for an operation, a resource scope, and a limit. An agent holds only a reference. |
| Frame | One unit of the NTΔ edit stream, such as `put f0 c0 @b0`. See [NTΔ edit frames](edit-frames.md). |
| `CONFLICT` | The response to a patch against a stale base. The patch does not apply. |
| Proof result | One of `proved`, `refuted`, `unknown`, `unsupported`, `invalid`. See [Diagnostics](diagnostics.md). |
| Evidence manifest | The record that binds a result to exact specification, program, dependency, checker, and toolchain identities. See [Evidence and approval](evidence.md). |
| E1 · E2 · E3 | Verification levels: core model proved; target agrees on a tested corpus; compilation preserves behavior. |
| Refinement | A type restricted by a predicate. Refinement implication is explicit. |
| Erasure | Removing proof-only terms after checking. Boundary checks are never erased. |
| Obligation ledger | A Markdown file, `PROOF.md`, that records obligations and their evidence until a compiler exists. `nt proof` checks its format. See [The nt preview CLI](../tools/cli.md). |

## Draft NTΔ vocabulary

| Token | Meaning |
| --- | --- |
| `U0` · `N` · `Z` | Universe, exact naturals, and exact integers. |
| `V A n` · `S n` | Length-indexed vector and successor. |
| `pi` · `lam` · `app` | Dependent functions, abstraction, and application. |
| `sig` · `pair` · `=` · `refl` | Dependent pairs, equality, and reflexivity. |
| `fst` · `snd` | Projections of a dependent pair. |
| `case` · `cons` | Indexed pattern elimination and a vector constructor. |
| `_` | An unused bound field. Never a proof hole. |
| `@b0` · `@a0` | Local aliases for exact program-base and approval-envelope digests. |

## Draft operations

| Operation | Proposed meaning |
| --- | --- |
| `get o0 256` | Retrieve bounded context for an obligation. |
| `put f0 c0 @b0` | Patch an authorized hole against an exact base. |
| `ck f0 @a0` | Check the fragment under a fixed approval envelope. |
| `build @p0 @t0` | Build an accepted program for a declared target. |
| `run @x0 @r0` | Execute under a bound runtime and fixture profile. |

`ntc` 0.1 runs `put`, `ck`, and `get`.
`build` and `run` are reserved and report `unsupported`.

The full rules are in the [language reference](index.md).
