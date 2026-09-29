---
title: One contract, two views
description: People review a readable TypeScript-style view; agents write the compact NTΔ form of the same contract.
order: 3
---

# One contract, two views

> Both views are proposals.
> The readable view is not arbitrary TypeScript.
> No compiler exists yet.

NextType keeps a TypeScript lineage.
Each contract has two views:

| View | Reader | Purpose |
| --- | --- | --- |
| Readable view | A human reviewer | Review intent, types, and assumptions in a familiar form. |
| NTΔ agent form | An agent | Change a small fragment with few tokens, against a pinned base. |

Both views project the same NT0 term.
They are not two programs.
A change to a summary or a view cannot change an approved contract.

## Example: a nonempty vector

Rule: the vector contains at least one element.

Readable view:

```typescript
function head<A, n>(v: Vec<A, n + 1>): A {
  switch (v) {
    case cons(x, _): return x;
  }
}
```

NTΔ agent form, under `Γ = {A:U0, n:N, v:V A (S n)}`:

```text
c1 A
f1 (case v (cons (x _) x))
put f1 c1 @b0
ck f1 @a0
```

The index `S n` excludes an empty vector.
So the match needs no empty case.
The checker reconstructs the full typed term before checking.

## Why two views

- People need to review intent, not every implementation term.
- Agents benefit from small messages. Only the changed fragment travels in a repair.
- The manifest supplies names and definitions once. Short aliases such as `@b0` resolve to exact digests.

All dictionary transmission and retrieval count toward tokens.
A dense symbol can tokenize worse than a common word.
The benchmark design compares readable source, typed patches, and dense syntax before it selects a codec.
See [Benchmark design](../../benchmarks/README.md).

## Read next

- [Examples](../../examples/README.md)
- [Glossary](../reference/glossary.md)
