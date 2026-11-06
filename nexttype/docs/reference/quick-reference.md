---
title: Quick reference
description: A one-screen card of NTΔ frames, terms, built-ins, results, and diagnostic codes for ntc 0.1.
order: 2
---

# Quick reference

> **Applies to `ntc` 0.1, stream format `ntd/1`, manifest format `nt-manifest/1`.**
> For examples of each row, see [NTΔ shorthand](../language/shorthand.md).

## Frames

```text
c0 TERM            contract slot: TERM is a type
f0 TERM            fragment slot: a candidate implementation
put f0 c0 @b0      propose f0 for contract c0 against base @b0
ck f0 @a0          check f0 under approval @a0 -> one obligation o<k>
get o0 256         goal and context of o0, at most 256 bytes
; text             comment, to the end of the line
```

## Terms

```text
U0  N  Z                    universe, naturals, integers
(V A n)  (S n)              vector of length n, successor
0 12000 -5                  literals (N, or Z where Z is expected; negative is Z)
(pi x A B)  (lam x e)       dependent function type, function
(sig x A P)  (pair a p)     dependent pair type, pair
(fst q)  (snd q)            projections
(= a b)  refl               equality type, its proof
(f a b)  (app f a)          application
(case v (nil () e) (cons (x t) e))     vector case; (cons (m x t) e) binds the length
_                           unused binder; never a proof
```

## Built-ins

```text
nil  (cons x xs)            vectors; element type and length are implicit
add sub mul : Z -> Z -> Z   neg : Z -> Z   int : N -> Z
(sum xs)                    sum nil = 0; sum (cons x t) = add x (sum t)
```

## Results

| Result | Meaning |
| --- | --- |
| `proved` | The fragment has the contract type. The kernel re-checked it. An evidence digest follows. |
| `refuted` | An equality has two closed, distinct values. |
| `unknown` | The checker could not decide: a symbolic equality, or a resource bound. |
| `unsupported` | The frame is valid NTΔ, but this implementation does not run it. |
| `invalid` | The input is malformed, ill-scoped, ill-typed, or breaks the approval. |

## Codes

| Code | Phase | Meaning |
| --- | --- | --- |
| `SYN` | decode | Malformed frame or term. |
| `LIM` | decode | Input limit exceeded. |
| `ALIAS` | decode | Malformed, unknown, or wrong-class alias. |
| `SLOT` | session | Undefined, redefined, or misused slot. |
| `SCOPE` | elaborate | Unbound or reserved name. |
| `TYPE` | elaborate | Type mismatch. |
| `IMPL` | elaborate | An implicit argument could not be inferred. |
| `UNIV` | elaborate | Universe level too large. |
| `CASE` | elaborate | Missing, unreachable, duplicate, or malformed branch. |
| `TY` | obligation | The typing obligation of a fragment. |
| `EQ` | obligation | An equality that `refl` cannot prove. |
| `CONFLICT` | policy | The patch base is stale. |
| `POLICY` | policy | The stream conflicts with the approval. |
| `RES` | any | Step or integer-size bound exhausted. |
| `CMD` | session | A reserved command that this implementation does not run. |
| `MANIFEST` | load | Malformed manifest. |
| `KERNEL` | check | The kernel rejected an elaborated term. Report this as a bug. |

## Commands

```text
ntc check [--manifest FILE | --context CTX] [--json] [FILE|-]
ntc eval  [--manifest FILE | --context CTX] TERM
ntc fmt [FILE|-]      ntc prelude      ntc limits      ntc version
```

Exit codes: `0` every obligation proved, `1` anything else, `2` usage or file error.

## Limits

| Limit | Default |
| --- | --- |
| Input size | 1 MiB |
| Frames per stream | 10,000 |
| Bytes per frame | 64 KiB |
| Nesting depth | 128 |
| Nodes per frame | 20,000 |
| Digits per literal | 512 |
| Integer size during evaluation | 8,192 bits |
| Evaluation steps per check | 1,000,000 |

A library caller can lower a limit, but not raise it above the default.
See [Security model](security-model.md).
