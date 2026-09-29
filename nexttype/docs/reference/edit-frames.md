---
title: NTΔ edit frames
description: "The draft NTΔ frames: slot definitions, put, ck, get, build, and run, and how a patch applies to an exact base."
order: 8
---

# NTΔ edit frames

> **Status: Designed (semantics), Planned (codec).**
> The patch semantics are in the language plan (sections 3.3 and 9).
> The text codec is a draft. These frames are not executable today.

NTΔ is an edit stream, not a source file.
An agent sends *frames*.
Each frame in the examples is one line.

## Frame kinds

| Frame | Form | Meaning |
| --- | --- | --- |
| Contract slot | `c0 TERM` | Names the expected type of a hole. In a repair, the manifest usually binds it. |
| Fragment slot | `f0 TERM` | Names a candidate implementation term. |
| Patch | `put f0 c0 @b0` | Propose replacing the authorized hole with fragment `f0`, against base `@b0`. |
| Check | `ck f0 @a0` | Request checks for `f0` under approval envelope `@a0`. |
| Context request | `get o0 256` | Request bounded context for obligation `o0`, within a budget of 256. |
| Build | `build @p0 @t0` | Build an accepted program `@p0` for a declared target `@t0`. |
| Run | `run @x0 @r0` | Execute artifact `@x0` under runtime and fixture profile `@r0`. |

The unit of the `get` budget is not fixed in the design. Tokens are the likely unit; this is an **open question**.

## A complete exchange

```text
c0 (sig t Z (= t (sum xs)))
f0 (pair (sum xs) refl)
put f0 c0 @b0
ck f0 @a0
```

1. `c0` states the contract: an integer `t` and evidence that `t = sum xs`.
2. `f0` states the fragment: the sum, with `refl` as the evidence.
3. `put` proposes `f0` for the hole whose expected type is `c0`, against base `@b0`.
4. `ck` asks for checks under the fixed envelope `@a0`.

## How `put` applies

`put` is compare-and-swap (Designed, section 9.2):

- The task manifest binds the authorized hole, the old node digest, the contract root, and the approval envelope.
- The patch applies atomically, with a base-identity check.
- A stale base returns `CONFLICT`. The patch never rebases silently across a changed contract.
- After a conflict, the agent requests a fresh manifest and retries within its existing permissions.
- A patch that touches protected acceptance inputs is rejected before evaluation.

## How `ck` checks

`ck` runs the checks that the envelope `@a0` names.
The agent cannot replace the approval profile.
The planned pipeline is:

```text
NTΔ -> decode -> scope -> elaborate -> NT0
NT0 -> obligations -> independent check
```

| Pass | Checks |
| --- | --- |
| Decode | Size limits, grammar, alias classes, frame identity. |
| Scope | No dangling variables, capture, or illegal recursion groups. |
| Elaborate | Implicits, motives, universes, effects, termination constraints. Unresolved terms reject. |
| Obligation generation | Statement and predicate identities match the approval. |
| Check | Kernel validation, assumption closure, and the exact challenge. |

The result of `ck` is a set of proof results. See [Diagnostics](diagnostics.md).

## A repair loop

```text
get o0 256
put f0 c0 @b0
ck f0 @a0
unknown o0 EQ f0
get o0 256
```

The planned controller repeats within fixed token, time, and attempt budgets.
It stops with unresolved obligations and complete usage records when the budget runs out.

## Contract changes are not frames

A contract-change proposal uses a different operation.
It cannot update the active approval root.
Only a reviewed approval envelope can activate a new root.
The name and form of that operation are an **open question**.

## Limits of the draft

- The frame grammar is draft. See [Grammar](grammar.md).
- Frame limits, escaping, and reserved opcodes are planned (C01).
- The view is compiler-oriented shorthand, not the kernel's complete concrete syntax.
- A JSON integration mode is planned for ordinary tools. See [Machine protocol](protocol.md).
