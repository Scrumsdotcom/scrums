---
title: NTΔ shorthand
description: Every NTΔ construct and shorthand, each with a checked example. The examples on this page run in CI against the reference checker.
order: 4
---

# NTΔ shorthand

> **Status: implemented in `ntc` 0.1 (stream format `ntd/1`).**
> Every `ntd` and `console` example on this page runs in CI against the reference checker.
> A failing example fails the build.

NTΔ is the compact form that agents write.
This page lists every construct, the shorthand it allows, and one checked example for each.
For a one-screen summary, see the [quick reference](../reference/quick-reference.md).
For patterns, see [Patterns for agents](../guides/agent-patterns.md).

## How to read the examples

An `ntd` example is a complete request stream.
Its comment lines carry the test data:

- `; context: n:N, xs:V Z n` gives the context Γ. In real use a manifest supplies it.
- `; expect: proved o0 TY f0 @4` is the expected diagnostic: result, obligation, code, fragment, and the line it points at.

The checker ignores comments.
Try any example yourself:

```sh
ntc check --context "n:N, xs:V Z n" example.ntd
```

## Streams and frames

A stream is a sequence of lines.
Each non-empty line is one frame.

| Frame | Form | Meaning |
| --- | --- | --- |
| Contract | `c0 TERM` | Define contract slot `c0`. `TERM` must be a type. |
| Fragment | `f0 TERM` | Define fragment slot `f0`, a candidate implementation. |
| Patch | `put f0 c0 @b0` | Propose `f0` for the hole of type `c0`, against base `@b0`. |
| Check | `ck f0 @a0` | Check `f0` under approval `@a0`. Produces one obligation. |
| Context | `get o0 256` | Ask for the goal and context of obligation `o0`, within 256 bytes. |
| Build, run | `build @p0 @t0`, `run @x0 @r0` | Reserved. The reference checker reports `unsupported CMD`. |

The smallest useful stream has four frames:

```ntd
; expect: proved o0 TY f0 @3
c0 Z
f0 42
put f0 c0 @b0
ck f0 @a0
```

Rules:

- Slots are immutable within a stream. Defining `f0` twice is `invalid SLOT`.
- A slot definition takes exactly one term. Write `c0 (I paid)`, not `c0 I paid`.
- Obligations are numbered `o0`, `o1`, … in `ck` order.
- `ck` without an earlier `put` is `invalid SLOT`.

## Lexical shorthand

| Token | Form | Notes |
| --- | --- | --- |
| Comment | `; text` | To the end of the line. May contain any UTF-8 except bidirectional controls. |
| Name | `xs`, `sum`, `Receipt` | ASCII letter, then ASCII letters or digits. Case-sensitive. |
| Natural | `0`, `12000` | No leading zeros. Type `N`, or `Z` where `Z` is expected. |
| Negative integer | `-5` | Type `Z`. `-0` is not allowed. |
| Alias | `@b0`, `@a0` | `@`, one lowercase letter, digits. The letter is the class: `b` base, `a` approval. |
| Slot | `c0`, `f0`, `o0` | Contract, fragment, obligation. No leading zeros: `c01` is invalid. |
| Unused binder | `_` | Only in binder position. Never a proof hole. |

Outside comments, frames are printable ASCII.
Identifiers are never normalized, so two names that look alike cannot alias each other.

## Types

| Construct | NTΔ | Readable view | Type |
| --- | --- | --- | --- |
| Universe | `U0` | type parameter `A` | `U0 : U1` |
| Naturals | `N` | `Nat` | `U0` |
| Integers | `Z` | `Int` | `U0` |
| Vector | `(V A n)` | `Vec<A, n>` | `U0` when `A : U0` |
| Successor | `(S n)` | `n + 1` | `N` |
| Dependent function | `(pi x A B)` | function signature | the larger universe of `A` and `B` |
| Dependent pair | `(sig x A P)` | `{ x: A; ok: P }` | the larger universe of `A` and `P` |
| Equality | `(= a b)` | `a == b` in a type | the universe of the type of `a` |

`(S 2)` and `3` are the same natural.
`(V A (S n))` is a vector with at least one element.

```ntd
; context: A:U0, n:N
; expect: proved o0 TY f0 @4
c0 (= (V A (S (S n))) (V A (S (S n))))
f0 refl
put f0 c0 @b0
ck f0 @a0
```

There is no `U0 : U0`:

```ntd
; expect: invalid o0 UNIV f0 @3
c0 U0
f0 U0
put f0 c0 @b0
ck f0 @a0
```

## Application

`(f a b)` applies `f` to `a`, then to `b`.
`(app f a)` is the explicit form of `(f a)`.
In a context or manifest entry, outer parentheses are optional: `V Z n` means `(V Z n)`.

```ntd
; expect: proved o0 TY f0 @3
c0 (= (add 2 3) (app (app add 2) 3))
f0 refl
put f0 c0 @b0
ck f0 @a0
```

### Implicit arguments

Some constants take leading arguments that the checker infers.
You never write them.

| Constant | You write | The checker fills in |
| --- | --- | --- |
| `nil` | `nil` | the element type `A` |
| `cons` | `(cons x xs)` | `A` and the length of `xs` |
| `sum` | `(sum xs)` | the length of `xs` |

```ntd
; context: n:N, xs:V Z n
; expect: proved o0 TY f0 @4
c0 (V Z (S (S n)))
f0 (cons 1 (cons 2 xs))
put f0 c0 @b0
ck f0 @a0
```

When nothing determines an implicit argument, the result is `invalid IMPL`.
Give the term an expected type, for example by putting it in a contract.

## Functions

`(lam x body)` builds a function.
It needs an expected `pi` type, which the contract supplies.

```ntd
; expect: proved o0 TY f0 @3
c0 (pi A U0 (pi x A A))
f0 (lam A (lam x x))
put f0 c0 @b0
ck f0 @a0
```

## Pairs and evidence

`(sig x A P)` is "a value `x` of type `A`, with evidence of `P`".
`(pair a p)` builds one. `p` must have type `P` with `a` in place of `x`.
`(fst q)` and `(snd q)` take a pair apart.

```ntd
; context: n:N, xs:V Z n
; expect: proved o0 TY f0 @4
c0 (sig t Z (= t (sum xs)))
f0 (pair (sum xs) refl)
put f0 c0 @b0
ck f0 @a0
```

```ntd
; context: n:N, xs:V Z n, q:sig t Z (= t (sum xs))
; expect: proved o0 TY f0 @4
c0 (= (fst q) (sum xs))
f0 (snd q)
put f0 c0 @b0
ck f0 @a0
```

## Equality and `refl`

`refl` proves `(= a b)` when `a` and `b` have the same normal form.
The checker computes with closed values and unfolds `sum` on a known head.

```ntd
; context: n:N, xs:V Z n
; expect: proved o0 TY f0 @4
c0 (= (sum (cons 5 xs)) (add 5 (sum xs)))
f0 refl
put f0 c0 @b0
ck f0 @a0
```

When `refl` fails, the result says why:

- `refuted EQ` — both sides are closed, distinct values. The diagnostic carries both values.
- `unknown EQ` — the sides differ symbolically. They may still be equal for every input, but `refl` cannot show it.

```ntd
; expect: refuted o0 EQ f0 @3
c0 (= (mul 2 6000) 12500)
f0 refl
put f0 c0 @b0
ck f0 @a0
```

```ntd
; context: n:N, xs:V Z n
; expect: unknown o0 EQ f0 @4
c0 (= (add (sum xs) 0) (sum xs))
f0 refl
put f0 c0 @b0
ck f0 @a0
```

The second case is true for every `xs`, but `add` does not simplify a symbolic `x + 0`.
The checker reports `unknown`, never `proved`.

## Case on a vector

`(case v (nil () e1) (cons (x t) e2))` matches a vector.

- `nil` binds nothing. Write `()`.
- `cons` binds the head and the tail: `(x t)`. Use `_` for an unused binder.
- `(cons (m x t) e)` also binds the tail length `m`.
- The length index decides which branches exist. A branch that cannot occur is an error, and so is a missing branch that can occur.
- `case` needs an expected type. The contract supplies it.

| Length of `v` | Required branches |
| --- | --- |
| `0` | `nil` only |
| `(S n)` or a positive literal | `cons` only |
| unknown, such as `n` | `nil` and `cons` |

```ntd
; context: A:U0, n:N, v:V A (S n)
; expect: proved o0 TY f0 @4
c0 A
f0 (case v (cons (x _) x))
put f0 c0 @b0
ck f0 @a0
```

```ntd
; context: A:U0, n:N, v:V A n, d:A
; expect: proved o0 TY f0 @4
c0 A
f0 (case v (nil () d) (cons (x _) x))
put f0 c0 @b0
ck f0 @a0
```

```ntd
; context: A:U0, n:N, v:V A n
; expect: invalid o0 CASE f0 @4
c0 A
f0 (case v (cons (x _) x))
put f0 c0 @b0
ck f0 @a0
```

## Built-in constants

| Constant | Type | Computes |
| --- | --- | --- |
| `add`, `sub`, `mul` | `(pi a Z (pi b Z Z))` | Exact integer arithmetic. |
| `neg` | `(pi a Z Z)` | Negation. |
| `int` | `(pi n N Z)` | A natural as an integer. |
| `sum` | `(sum xs)` with `xs : V Z n` | `sum nil = 0`, `sum (cons x t) = add x (sum t)`. |
| `nil`, `cons` | see [Case on a vector](#case-on-a-vector) | Vector constructors. |

`ntc prelude` prints the full list.
`ntc eval` runs the reference evaluator:

```console
$ ntc eval '(sum (cons 2 (cons 3 (cons -1 nil))))'
4 : Z
$ ntc eval '(mul (sub 7 10) (neg 4))'
12 : Z
$ ntc eval --context 'n:N, xs:V Z n' '(sum (cons 1 xs))'
(add 1 (sum xs)) : Z
```

## Context and manifest

A context lists the names a fragment may use, outermost first.
Later entries may depend on earlier ones.

```text
Γ = {A:U0, n:N, v:V A (S n)}
```

On the command line, pass it with `--context "A:U0, n:N, v:V A (S n)"`.
In a session, a manifest supplies it, together with constants, approved contracts, and aliases.
See [Manifests](../reference/modules.md#manifests-in-the-reference-checker).

## Results

`ck` produces exactly one line per obligation:

```text
proved o0 TY f0
refuted o0 EQ f0
unknown o0 EQ f0
invalid o0 TYPE f0
```

The form is `RESULT OBLIGATION CODE FRAGMENT`.
Comment lines after it give the evidence digest or the message.
See [Diagnostics](../reference/diagnostics.md) for every code.
