---
title: Contracts and obligations
description: How a NextType contract states preconditions, postconditions, and invariants, and how each obligation is discharged.
order: 4
---

# Contracts and obligations

> **Status: Designed.**
> The contract model, the obligation rules, and the weakening rules are in the language plan (sections 4, 6, and 14).
> No checker exists.
> For an introduction, read [Contracts](../language/contracts.md).

## What a contract contains

A contract is part of the approved contract graph.
Its root, `contractRoot`, binds these parts:

| Part | Meaning | How it is written |
| --- | --- | --- |
| Precondition | What must hold for an input. | An input type, often indexed, such as `V A (S n)`. |
| Postcondition | What must hold for the result. | A result type, often a `sig` with evidence, such as `(sig t Z (= t (sum xs)))`. |
| Invariant | What must hold for every value or state. | A type that makes illegal states unrepresentable, such as `I paid`, or a store invariant. |
| Termination | The function terminates for every input in its domain. | Structural recursion through trusted combinators, or a decreasing measure. |
| Public signature | Names, parameters, and result types. | The typed interface in the manifest. |
| Effects | The effects the operation may perform. | An effect row, such as `!{store.write}`. |

In the plan's notation, a contract is a triple `(P, Q, E)`:
precondition `P`, postcondition `Q`, and effect set `E`.

NextType has no separate `requires` or `ensures` keywords in the current design.
Types carry the pre- and postconditions.
Whether to add such keywords to the readable view is an **open question**.

## Example: precondition in the type

```typescript
function head<A, n>(v: Vec<A, n + 1>): A {
  switch (v) {
    case cons(x, _): return x;
  }
}
```

```text
c1 A
f1 (case v (cons (x _) x))
put f1 c1 @b0
ck f1 @a0
```

The context `Γ = {A:U0, n:N, v:V A (S n)}` states the precondition: `v` is not empty.
An empty-vector decoder fails before `head` receives its input.

## Example: postcondition in the type

```typescript
type Total<xs> = { t: Int; ok: t == sum(xs) };
function total(xs: Vec<Int>): Total<xs> {
  return { t: sum(xs), ok: refl };
}
```

```text
c0 (sig t Z (= t (sum xs)))
f0 (pair (sum xs) refl)
put f0 c0 @b0
ck f0 @a0
```

The result type states the postcondition: `t` equals `sum xs`.

## Obligations

An *obligation* is one exact property that must be established before a change is accepted.

| Rule | Status |
| --- | --- |
| The compiler generates obligations from NT0 and the approved contract. | Designed |
| The statement and the predicate identities must match the approval. | Designed |
| Each obligation has an id, an expected type, and a local context. | Designed |
| An unresolved obligation (a *hole*) blocks acceptance. | Designed |
| A hole has a name, an expected type, and a local context. | Designed |
| `_` is an unused binder, never a hole. | Designed |

Obligations appear in slots such as `o0`.
Diagnostics refer to them by slot. See [Diagnostics](diagnostics.md).

## How an obligation is discharged

An obligation is discharged only by checked evidence.
The plan allows these routes:

| Route | Rule |
| --- | --- |
| Definitional equality | The checker reduces both sides within a resource budget. `refl` succeeds only when they are definitionally equal. |
| Explicit evidence | A proof term, checked by the pinned checker. |
| Trusted library lemma | A lemma from an approved proof library, under its recorded contract and dependency closure. |
| SMT result | Only through an accepted reconstruction or certificate path. |

The proposed proof backend is Lean 4.
The checker profile rejects proof holes, `sorryAx`, unapproved axioms, and unsupported native-evaluation trust.

Rules for results:

- A timeout is `unknown`. It is not false and not proved.
- A failed tactic is `unknown`. It is not a refutation.
- `refuted` requires a validated counterexample.
- A proof is reusable only under its recorded contract and dependency closure.

## Binding a proof to the task

The plan defines eight steps (section 6.2):

1. Resolve the immutable specification and dependency set.
2. Construct the expected theorem from reviewed semantic templates.
3. Validate the candidate IR against the supported grammar and primitive set.
4. Build proof candidates inside a separate restricted process.
5. Compare the elaborated theorem with the expected theorem and definitions.
6. Recheck proof terms under the pinned checker and approved assumptions.
7. Record the full dependency and toolchain identities.
8. Run independent acceptance checks before releasing an executable artifact.

Display names do not decide theorem identity.
The acceptance gate checks the bound definitions.

## The contract is fixed

An implementation agent can repair a body or a proof attempt.
It cannot change the contract.

| Proposed change | Required outcome |
| --- | --- |
| Body or proof repair | Check against the existing approval envelope. |
| Weaker guarantee or narrower input domain | Owner approval before a new contract root activates. |
| Broader effects or new assumptions | Separate authority and trust review. |
| Changed tests or evaluator | Reject under the existing envelope. |
| Timeout or missing proof | Keep the obligation unresolved. |
| Stale base, proof, or approval | Reject the mismatched evidence. |

## What counts as weakening

For an old contract `(P, Q, E)` and a proposed contract `(P', Q', E')`, a refinement requires at least:

```text
forall x. P(x) => P'(x)
forall x,y. P(x) and Q'(x,y) => Q(x,y)
E' subseteq E
```

- The first rule stops a stronger precondition from silently excluding supported inputs.
- The second rule stops a weaker postcondition on those inputs.
- The third rule stops broader effects.

Termination, resource limits, state invariants, and assumptions must also be preserved.
These are necessary checks, not a universal compatibility algorithm.
Entailment can be `unknown`.

Other weakening examples: removing an error case, reducing a test set, redefining a predicate, or changing a dependency behind the same name.

Every contract-root change requires owner approval today.
An unknown classification always follows the approval path.
See [Evidence and approval](evidence.md).

## Limits

A checker cannot recover intent that the contract omits.
A deduplication contract that requires only uniqueness admits an empty result.
A proof establishes modeled properties under recorded assumptions.
It does not establish that the requirement expresses the right intent.

## Until a compiler exists

Teams can record obligations in a Markdown ledger and check its format with `nt proof`.
See [The nt preview CLI](../tools/cli.md).
The ledger is not a proof.
