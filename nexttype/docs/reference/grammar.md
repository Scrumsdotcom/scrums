---
title: Grammar
description: An EBNF summary of the draft NTΔ agent form, the manifest projection, and the semantic outline. Descriptive, not normative.
order: 12
---

# Grammar

> **Status: Draft summary. Not normative.**
> The language plan has no formal grammar yet.
> This page describes the shapes that appear in the design examples.
> A versioned grammar with a round-trip corpus is planned before any stable codec claim (C01).

The notation is ISO-style EBNF:
`=` defines, `,` concatenates, `|` separates choices, `{ }` repeats zero or more times, `[ ]` is optional, and `(* *)` is a comment.

## NTΔ frames

```ebnf
(* A stream is a sequence of frames, one per line in the examples. *)
stream          = { frame , newline } ;
frame           = slot-definition | command | diagnostic ;

(* Slot definitions *)
slot-definition = contract-slot , space , term
                | fragment-slot , space , term ;

(* Commands *)
command         = "put" , space , fragment-slot , space , contract-slot , space , alias
                | "ck" , space , fragment-slot , space , alias
                | "get" , space , obligation-slot , space , natural
                | "build" , space , alias , space , alias
                | "run" , space , alias , space , alias ;

(* Diagnostics, as returned to the agent *)
diagnostic      = result , space , obligation-slot , space , code , space , fragment-slot
                | "ctx" , space , alias ;
result          = "proved" | "refuted" | "unknown" | "unsupported" | "invalid" ;
code            = upper , { upper } ;                  (* only "EQ" is designed *)

(* Terms *)
term            = atom | "(" , term , { space , term } , ")" ;
atom            = core-constant | keyword | name | natural | "_" | "=" ;
core-constant   = "U0" | "N" | "Z" | "V" | "S" ;
keyword         = "pi" | "lam" | "app" | "sig" | "pair" | "fst" | "snd"
                | "refl" | "case" ;

(* Slots and aliases, as observed in the examples *)
contract-slot   = "c" , digits ;
fragment-slot   = "f" , digits ;
obligation-slot = "o" , digits ;
alias           = "@" , lower , digits ;              (* @b0 @a0 @k0 @p0 @t0 @x0 @r0 *)

name            = letter , { letter | digit } ;
natural         = digits ;
digits          = digit , { digit } ;
```

Notes:

- The meaning of a term depends on its head. For example, `(sig t Z P)` binds `t : Z` in `P`, and `(case v (cons (x _) x))` binds `x`.
- Keywords and core constants are bound to versioned core constructors through the manifest. Their exact arities are **open**.
- The examples also use manifest-bound names in head position, such as `(sum xs)`, `(zip xs ys)`, `(step i r)`, `(I paid)`, and `(Pair A B)`.
- Whitespace, escaping, text literals, integer literals, comments, and frame size limits are **open** (C01).
- A slot or alias cannot mix artifact classes. This is a typing rule, not a grammar rule.

## Contexts

Contexts appear in the documentation, not in frames.
A manifest supplies them.

```ebnf
context         = "Γ = {" , [ entry , { ", " , entry } ] , "}" ;
entry           = name , ":" , term-body ;
term-body       = (* a term written without outer parentheses, e.g. V A (S n) *) ;
```

## Manifest projection

The draft application-binding projection (section 8.3):

```ebnf
manifest-line   = operation | binding ;
operation       = "op" , digits , space , name , space , effect-row ;
effect-row      = "!{" , effect , { "," , effect } , "}" ;
effect          = name , { "." , name } ;             (* store.write, pay.sim *)

binding         = "http" , space , method , space , path , space , op-ref
                | "ui" , space , name , { space , term }
                | "cli" , space , name , space , op-ref
                | "job" , space , name , space , op-ref ;
op-ref          = "op" , digits ;
method          = "GET" | "POST" | (* other HTTP methods: open *) ;
path            = "/" , { path-char } ;
```

The `ui` line uses forms such as `(read op1)` and `(act op2)`.
Their vocabulary is **open**.

## Semantic outline

This is the model from section 4.2, not a parser grammar:

```ebnf
Type          = "Bool" | "Unit" | "Int" | "Nat" | "Text"
              | "Record(" , fields , ")" | "Sum(" , cases , ")" | "List(" , Type , ")"
              | "Vec(" , Type , "," , NatIndex , ")" | "Fin(" , NatIndex , ")"
              | "Pi(" , binding , "," , Type , ")"
              | "Sigma(" , binding , "," , predicate , ")"
              | "Eq(" , Type , "," , Expr , "," , Expr , ")" ;

Expr          = literal | variable | let | lambda | apply
              | record | field | case | constructor
              | fold | vectorIndex | primitive | proofHole ;

EffectRequest = operationId , checkedArguments , capabilityReference ;
```

The formal model will define evaluation order, primitive behavior, errors, and which expressions may occur in types.

## Readable view

The readable view has no grammar yet.
It uses a TypeScript-style subset: `type` aliases, `function` declarations with generic parameters, object types, `switch` and `case`, and `return`.
See [Readable view and NTΔ](views.md) for the construct mapping.
Its grammar is an **open question**.
