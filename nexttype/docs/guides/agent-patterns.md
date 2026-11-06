---
title: Patterns for agents
description: Common NTΔ patterns for agents, with checked examples - the repair loop, evidence pairs, nonempty inputs, state transitions, and how to read each result.
order: 1
---

# Patterns for agents

> Every `ntd` and `console` example on this page runs in CI against `ntc` 0.1.

This page is for an agent that writes NTΔ.
Each pattern states when to use it, then shows a checked stream.

## The rules that do not change

1. Never edit an approved contract to make a check pass. A restated contract that differs from the approval is `invalid POLICY`, and the fragment is still checked against the approval.
2. `_` is a binder. It is never a proof. There is no wildcard proof.
3. `proved` is the only passing result. `unknown` does not pass.
4. Count every attempt. A failed `ck` costs tokens too.

## Pattern 1: send only the fragment

When the manifest already binds the contract, do not restate it.
Send the fragment, `put`, and `ck`.

```ntd
; manifest: examples/invoice/manifest.json
; expect: proved o0 TY f0 @3
f0 (pair (sum xs) refl)
put f0 c0 @b0
ck f0 @a0
```

This is the shortest correct stream for a repair.

## Pattern 2: a value with its evidence

When the contract is a `sig`, return the value and the proof together.
Compute the value with the same expression that the contract names, then close the proof with `refl`.

```ntd
; context: n:N, xs:V Z n
; expect: proved o0 TY f0 @4
c0 (sig t Z (= t (add (sum xs) 10)))
f0 (pair (add (sum xs) 10) refl)
put f0 c0 @b0
ck f0 @a0
```

A different expression with the same value for some inputs is not enough:

```ntd
; context: n:N, xs:V Z n
; expect: unknown o0 EQ f0 @4
c0 (sig t Z (= t (add (sum xs) 10)))
f0 (pair (add 10 (sum xs)) refl)
put f0 c0 @b0
ck f0 @a0
```

`refl` does not know that addition commutes.
Use the contract's own expression.

## Pattern 3: require a nonempty input

Put the requirement in the type, not in a runtime check.
A vector of length `(S n)` has no `nil` case, so the match needs only `cons`.

```ntd
; manifest: examples/vector/manifest.json
; expect: proved o0 TY f1 @4
c1 A
f1 (case v (cons (x _) x))
put f1 c1 @b0
ck f1 @a0
```

If the length is unknown, the checker asks for the `nil` branch:

```ntd
; context: A:U0, n:N, v:V A n
; expect: invalid o0 CASE f0 @4
c0 A
f0 (case v (cons (x _) x))
put f0 c0 @b0
ck f0 @a0
```

Do not add a default value to make this pass if the contract needs a nonempty vector.
Ask the contract owner for a `(V A (S n))` input instead.

## Pattern 4: state transitions through one constant

Model each state as an index.
Make one approved constant the only way to reach the next state.

```ntd
; manifest: examples/state/manifest.json
; expect: proved o0 TY f3 @4
c3 (I paid)
f3 (step i r)
put f3 c3 @b0
ck f3 @a0
```

A shortcut does not type-check:

```ntd
; manifest: examples/state/manifest.json
; expect: invalid o0 TYPE f3 @4
c3 (I paid)
f3 (step i confirmed)
put f3 c3 @b0
ck f3 @a0
```

`confirmed` is a state label, not a `Receipt confirmed` value.
Only a runtime decoder can produce a receipt.

## Pattern 5: the repair loop

1. Send `put` and `ck`.
2. Read the result line.
3. On anything other than `proved`, send `get` for that obligation, then a new fragment slot.
4. Stop when the attempt budget runs out. Report the open obligations.

```ntd
; context: n:N, xs:V Z n
; expect: unknown o0 EQ f0 @5
; expect: proved o1 TY f1 @6
c0 (sig t Z (= t (sum xs)))
f0 (pair (add (sum xs) 0) refl)
f1 (pair (sum xs) refl)
put f0 c0 @b0
ck f0 @a0
get o0 256
put f1 c0 @b0
ck f1 @a0
```

Use a new fragment slot for each attempt. Slots are immutable within a stream.

## Pattern 6: check closed facts first

Before you rely on a closed computation, check it on its own.
A `refuted` result carries both values.

```console
$ printf 'c0 (= (mul 2 6000) 12500)\nf0 refl\nput f0 c0 @b0\nck f0 @a0\n' | ntc check
refuted o0 EQ f0
; 2:4 refl does not hold: 12000 and 12500 are distinct values
```

## How to read each result

| Result line | What to do |
| --- | --- |
| `proved oN TY fN` | Done. Record the evidence digest. |
| `refuted oN EQ fN` | The values differ. Fix the computation. Do not change the contract. |
| `unknown oN EQ fN` | Rewrite the fragment so that both sides have the same normal form. Use the contract's own expression. |
| `unknown oN RES fN` | The check ran out of steps or integer size. Simplify, or ask for a smaller input. |
| `invalid oN TYPE fN` | Read the expected and found types in the message. |
| `invalid oN CASE fN` | Add the missing branch, or remove the unreachable one. |
| `invalid oN IMPL fN` | Give the term an expected type. |
| `invalid - POLICY -` | You restated a contract differently. Remove the restatement. |
| `invalid - CONFLICT fN` | Your base is stale. Request a fresh manifest, then retry. |

## Use JSON in tools

`ntc check --json` prints `nt-result/1` JSON with the same diagnostics, plus line, column, message, evidence, and the two sides of a failed equality.
Use it when a program reads the result.
