---
title: Contracts
description: In NextType, dependent types are the spec. The Invoice contract states that the total equals the sum of the lines.
order: 2
---

# Contracts

> Proposed design. The `ntc` reference checker checks NTΔ contracts; see [NTΔ shorthand](shorthand.md) for checked examples.

## Dependent types are the spec

A dependent type can refer to a value.
So a type can state a requirement about data, not only its shape.
The compiler then checks that the code satisfies the type.

This idea is not new.
Per Martin-Löf developed intuitionistic type theory during the 1970s.
Lean 4, Idris 2, and F* already combine execution with proofs.
NextType's proposed contribution is to join these ideas with agent workflows and a TypeScript application target.

Three ideas matter most:

| Idea | Meaning | Proposed use |
| --- | --- | --- |
| Dependent function | A result type can depend on an input value. | `zip` returns a vector with the supplied length. |
| Dependent pair | A value can travel with evidence about that value. | An invoice carries evidence that its total matches its lines. |
| Identity type | Equality is a proposition with a proof term. | An implementation establishes a specified result equality. |

## The Invoice contract

The rule: **the total equals the exact sum of its lines.**

Readable view (what a human reviews):

```typescript
type Total<xs> = { t: Int; ok: t == sum(xs) };
function total(xs: Vec<Int>): Total<xs> {
  return { t: sum(xs), ok: refl };
}
```

NTΔ agent form (what an agent writes), under the context `Γ = {n:N, xs:V Z n}`:

```text
c0 (sig t Z (= t (sum xs)))
f0 (pair (sum xs) refl)
put f0 c0 @b0
ck f0 @a0
```

- `c0` is the contract: a pair of an integer `t` and evidence that `t` equals `sum xs`.
- `f0` is the implementation: the sum, with `refl` as the evidence.
- `put` proposes the fragment against the exact program base `@b0`.
- `ck` requests checks under the fixed approval envelope `@a0`.

`refl` succeeds only when both sides of the equality are definitionally equal.
If an agent changes the body to `sum xs + 1`, the same equality fails.
The agent cannot change the contract to make the check pass.

See the full [Invoice example](../../examples/invoice/README.md).

## The contract is fixed

The approval envelope binds the contract, semantics, assumptions, acceptance rules, capabilities, edit scope, budgets, and toolchain.
An agent can repair an implementation or a proof attempt inside it.
A changed guarantee requires owner approval before a new contract root activates.

| Proposed change | Required outcome |
| --- | --- |
| Body or proof repair | Check against the existing approval envelope. |
| Weaker guarantee or narrower input domain | Owner approval before a new contract root activates. |
| Broader effects or new assumptions | Separate authority and trust review. |
| Changed tests or evaluator | Reject under the existing envelope. |
| Timeout or missing proof | Keep the obligation unresolved. |
| Stale base, proof, or approval | Reject the mismatched evidence. |

## What a contract cannot do

A checker cannot recover business intent that the contract omits.
For example, a deduplication contract that requires only uniqueness admits an empty result.
People must review contracts and counterexamples before they freeze the approval envelope.
A proof establishes modeled properties under recorded assumptions.
It does not establish that the requirement expresses the right intent.
