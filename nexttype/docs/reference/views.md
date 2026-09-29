---
title: Readable view and NTΔ
description: The construct-by-construct mapping between the readable TypeScript-style view and the NTΔ agent form.
order: 7
---

# Readable view and NTΔ

> **Status: Designed for the constructs in the examples; Open for the rest.**
> Both views are projections of the same planned NT0 term.
> The readable view is not arbitrary TypeScript.
> No projector exists.

For the idea behind the two views, read [One contract, two views](../language/two-views.md).

## Rules

- Both views project the same NT0 term. They are not two programs.
- A person reviews the readable view. An agent writes NTΔ.
- A change to a view or a summary cannot change an approved contract.
- Before checking, NTΔ elaborates to NT0. The elaborator reconstructs omitted type arguments and binder indices.
- An unresolved implicit argument blocks checking.
- The readable view is TypeScript-style, but TypeScript types are never proof certificates.

## Mapping table

Each row comes from the design examples unless its status says otherwise.

| Construct | Readable view | NTΔ | Status |
| --- | --- | --- | --- |
| Integer type | `Int` | `Z` | Designed |
| Natural type | `Nat` in the outline | `N` | Designed |
| Universe of types | type parameter `A` in `<A, …>` | `A:U0` in Γ | Designed |
| Vector of length `n` | `Vec<A, n>` | `V A n` | Designed |
| Successor | `n + 1` | `S n` | Designed |
| Nonempty vector | `Vec<A, n + 1>` | `V A (S n)` | Designed |
| Vector with the index left implicit | `Vec<Int>` | `V Z n` with `n:N` in Γ | Designed in the Invoice example; the implicit-index rule is Open |
| Pair type | none designed | `Pair A B` | NTΔ Designed (`zip` example); readable form Open |
| State-indexed type | `Invoice<"paid">` | `I paid` | Designed |
| Parameters and context | `function f<A, n>(v: T)` | `Γ = {A:U0, n:N, v:T}` | Designed |
| Result type (the contract) | `): R {` | `c0 R` | Designed |
| Dependent pair type | `type Total<xs> = { t: Int; ok: P }` | `(sig t Z P)` | Designed |
| Equality proposition | `a == b` in a type | `(= a b)` | Designed |
| Pair value | `{ t: e, ok: p }` | `(pair e p)` | Designed |
| Reflexivity proof | `refl` | `refl` | Designed |
| Function body (the fragment) | `{ return e; }` | `f0 e` | Designed |
| Application | `step(i, r)` | `(step i r)` | Designed |
| Pattern match | `switch (v) { case cons(x, _): return x; }` | `(case v (cons (x _) x))` | Designed |
| Unused binder | `_` | `_` | Designed |
| Projections | none designed | `(fst p)`, `(snd p)` | NTΔ Designed; readable form Open |
| Dependent function type | function signature | `pi` | NTΔ token Designed; syntax Open |
| Abstraction | none designed | `lam` | NTΔ token Designed; syntax Open |
| Explicit application | `f(a)` | `app` | NTΔ token Designed; when required is Open |
| Hole | none designed | named obligation, such as `o0` | Open (readable form) |
| Effect row | none designed | `!{store.write}` | NTΔ draft; readable form Open |
| Comment | `// …` | none designed | Open |
| Records, unions | object types, as in `Total` | none designed | Open |
| Patch against a base | none (not a source construct) | `put f0 c0 @b0` | Designed |
| Check request | none (not a source construct) | `ck f0 @a0` | Designed |

Commands such as `put` and `ck` have no readable-view form.
They are frames in the edit stream, not program text.
See [NTΔ edit frames](edit-frames.md).

## The three examples side by side

### Invoice: the total equals the sum

```typescript
type Total<xs> = { t: Int; ok: t == sum(xs) };
function total(xs: Vec<Int>): Total<xs> {
  return { t: sum(xs), ok: refl };
}
```

```text
Γ = {n:N, xs:V Z n}
c0 (sig t Z (= t (sum xs)))
f0 (pair (sum xs) refl)
put f0 c0 @b0
ck f0 @a0
```

### Vector: head of a nonempty vector

```typescript
function head<A, n>(v: Vec<A, n + 1>): A {
  switch (v) {
    case cons(x, _): return x;
  }
}
```

```text
Γ = {A:U0, n:N, v:V A (S n)}
c1 A
f1 (case v (cons (x _) x))
put f1 c1 @b0
ck f1 @a0
```

### State: a paid invoice needs a confirmed receipt

```typescript
function pay(
  i: Invoice<"pending">,
  r: Receipt<"confirmed">,
): Invoice<"paid"> {
  return step(i, r);
}
```

```text
Γ = {i:I pending, r:Receipt confirmed}
c3 (I paid)
f3 (step i r)
put f3 c3 @b0
ck f3 @a0
```

The `Γ = …` line shows the context. The manifest supplies it; an agent does not send it in each frame.

## Why NTΔ is compact

- The manifest sends names and definitions once.
- Only the changed fragment travels in a repair.
- Aliases such as `@b0` replace full digests.

All dictionary transmission and retrieval count toward tokens.
A dense symbol can tokenize worse than a common word.
The benchmark design compares readable source, typed patches, and dense syntax before it selects a codec.
No codec is selected.

## Open questions

- The complete readable-view grammar.
- Readable forms for holes, effects, projections, records, and unions.
- The rule for implicit indices in the readable view.
- Whether the readable view is only generated, or can also be written and parsed.
