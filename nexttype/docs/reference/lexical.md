---
title: Lexical structure
description: The draft tokens of the NTΔ agent form, including slots, aliases, names, literals, and the open lexical questions.
order: 2
---

# Lexical structure

> **Status: Planned.**
> The draft NTΔ text uses a small S-expression vocabulary.
> A versioned grammar, escaping rules, and frame limits are planned (C01).
> A formal grammar and a round-trip corpus come before any stable codec claim.

This page describes the tokens that appear in the design examples.
The [grammar](grammar.md) page gives an EBNF summary.

## Source text

| Rule | Status |
| --- | --- |
| Text is UTF-8. | Designed (C01, section 3.2). |
| Identifiers are not normalized implicitly. | Designed (C05). |
| Bytes, code points, and grapheme operations are distinct. | Planned (C05). |
| A frame has a maximum size. The limit is not set. | Planned (C01). |
| Layout, comments, debug names, and source locations are outside semantic identity. | Designed (section 3.2). |

The draft text is line oriented.
Each line in the examples is one frame: a slot definition, a command, or a diagnostic.
Whether a frame can span lines is an **open question**.

## Token classes

| Class | Examples | Meaning |
| --- | --- | --- |
| Parentheses | `(` `)` | Group an application or a constructor form. |
| Core constructors | `U0` `N` `Z` `V` `S` | Universe, naturals, integers, vector, successor. Bound to versioned core constructors. |
| Binding forms | `pi` `lam` `app` | Dependent function, abstraction, application. |
| Pair forms | `sig` `pair` `fst` `snd` | Dependent pair and its projections. |
| Equality and elimination | `=` `refl` `case` | Equality, reflexivity, indexed pattern elimination. |
| Unused binder | `_` | A bound field that the body does not use. It is never a proof hole. |
| Contract slots | `c0` `c1` | A local contract slot. |
| Fragment slots | `f0` `f1` | A local fragment (implementation) slot. |
| Obligation slots | `o0` | A local obligation slot. |
| Aliases | `@b0` `@a0` `@k0` | A local alias. It resolves to a full digest through the session manifest. |
| Commands | `put` `ck` `get` `build` `run` | Edit and request frames. See [NTΔ edit frames](edit-frames.md). |
| Result words | `proved` `refuted` `unknown` `unsupported` `invalid` | Proof results. See [Diagnostics](diagnostics.md). |
| Diagnostic codes | `EQ` | An obligation class in a diagnostic. |
| Names | `xs` `sum` `zip` `cons` `step` | Context variables and manifest-bound definitions. |
| Natural literals | `256` | A bound, such as a context budget in `get o0 256`. |

## Slots

A slot is a short local name for one artifact in the current session.

- The prefix gives the class: `c` for a contract, `f` for a fragment, `o` for an obligation.
- A slot is typed. A slot cannot alias artifacts of different classes.
- Slots are local. They are not authoritative identities.

Other one-letter prefixes appear in the draft manifest projection: `op0` for an operation.
The complete prefix set is an **open question**.

## Aliases

An alias starts with `@`.
It is a short name for an exact digest in the immutable session manifest.

| Alias in examples | Resolves to |
| --- | --- |
| `@b0` | The base program. |
| `@a0` | The approval envelope. |
| `@k0` | The expected type and local context of an obligation. |
| `@p0` · `@t0` | An accepted program and a declared target, in `build`. |
| `@x0` · `@r0` | An executable artifact and a runtime profile, in `run`. |

Every authoritative reference expands to a full digest before checking.
Dictionary transmission and retrieval count toward tokens.

## Names and binding

- In NTΔ, a name refers to a context entry or to a manifest-bound definition.
- In NT0, binding uses de Bruijn indices. Names are metadata. (Designed, section 3.2.)
- Alpha-equivalent bindings normalize to the same identity. (Designed.)
- Exports are explicit. Renaming is hygienic. (Planned, C02.)
- A display name does not decide identity. The agent cannot redefine `sum` under an existing specification id. (Designed, section 6.2.)

## Literals

| Literal | Status |
| --- | --- |
| Natural numbers, such as `256`. | Appear in examples. Syntax not fixed. |
| Exact integers. | Planned. The canonical JSON form encodes integers as strings (section 3.2). |
| Text and escapes. | Planned (C01, C05). Syntax not designed. |
| Money. | Integer minor units with a currency tag. No literal syntax designed (section 4.3). |
| Decimals and floats. | Later work (C04). Outside exact invariants. |

## Comments

**Open question.**
The plan puts comments outside semantic identity.
It does not define comment syntax for NTΔ.
The readable view uses `//` comments in examples, like TypeScript.

## Readable view tokens

The readable view uses TypeScript tokens: `type`, `function`, `return`, `switch`, `case`, `<…>`, `==`, `{ … }`.
It adds `refl` and the NextType type names `Int`, `Vec`, and state-indexed types such as `Invoice<"paid">`.
Its complete lexical grammar is an **open question**.
See [Readable view and NTΔ](views.md).
