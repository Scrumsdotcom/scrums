---
title: Invoice
description: An invoice contract where the total must equal the exact sum of its lines.
order: 2
---

# Invoice

> **Disclaimer.** Illustrative design example. There is no NextType compiler yet; this code has not been compiled, checked or run.

**Rule:** the total equals the exact sum of its lines.

## Readable view

`invoice.nt` — what a human reviews:

```typescript
type Total<xs> = { t: Int; ok: t == sum(xs) };
function total(xs: Vec<Int>): Total<xs> {
  return { t: sum(xs), ok: refl };
}
```

## NTΔ form

`sum.ntd` — what an agent writes, under the context `Γ = {n:N, xs:V Z n}`:

```text
c0 (sig t Z (= t (sum xs)))
f0 (pair (sum xs) refl)
put f0 c0 @b0
ck f0 @a0
```

## What the contract guarantees

- The result contains an exact integer total and evidence of its definition.
- The evidence `refl` holds only when the total is definitionally equal to `sum xs`.
- A body such as `sum xs + 1` cannot satisfy the same equality.
- The agent cannot weaken the contract. `@a0` pins the approval envelope.

## What it does not guarantee

- Currency, tenant, identity, and state rules need their own contracts. An invoice adapter adds them around this pure fragment.
- Incoming data is still untrusted. Runtime decoders must validate it.

## Fixture check

The website playground checks one sample: 2 × 6000 = 12000 minor units.
The value `12000` passes and `12500` fails.
This is a browser fixture, not a proof for all inputs.
