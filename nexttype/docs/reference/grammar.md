---
title: Grammar
description: "The normative grammar of the NTΔ stream format ntd/1, as implemented by ntc 0.1, plus the draft manifest projection and the semantic outline."
order: 12
---

# Grammar

> **Status: `ntd/1` is normative and implemented in `ntc` 0.1.**
> The NTΔ frames and terms below are the grammar that the reference checker decodes.
> The conformance suite and the property tests check it.
> The manifest projection and the semantic outline later on this page are still drafts.

The notation is ISO-style EBNF:
`=` defines, `,` concatenates, `|` separates choices, `{ }` repeats zero or more times, `[ ]` is optional, and `(* *)` is a comment.

## NTΔ stream format `ntd/1`

```ebnf
(* A stream is UTF-8 text. A line ends with LF or CRLF.            *)
(* Each line holds at most one frame, then an optional comment.     *)
stream          = { line } ;
line            = [ ws ] , [ frame , [ ws ] ] , [ comment ] , eol ;
comment         = ";" , { any-char - eol } ;
ws              = ( " " | tab ) , { " " | tab } ;

frame           = slot-definition | command | response ;

slot-definition = contract-slot , ws , term
                | fragment-slot , ws , term ;

command         = "put" , ws , fragment-slot , ws , contract-slot , ws , alias
                | "ck" , ws , fragment-slot , ws , alias
                | "get" , ws , obligation-slot , ws , positive
                | "build" , ws , alias , ws , alias
                | "run" , ws , alias , ws , alias ;

(* Responses appear only in checker output. A request stream that   *)
(* contains one is invalid.                                          *)
response        = result , ws , obligation-slot , ws , code , ws , fragment-slot
                | "ctx" , ws , alias ;
result          = "proved" | "refuted" | "unknown" | "unsupported" | "invalid" ;
code            = upper , { upper } ;

(* Terms *)
term            = atom | "(" , [ ws ] , term , { ws , term } , [ ws ] , ")"
                | "(" , [ ws ] , ")" ;                 (* only as an empty binder list *)
atom            = name | natural | integer | alias | "_" | "=" ;

name            = letter , { letter | digit } ;
natural         = "0" | nonzero , { digit } ;
positive        = nonzero , { digit } ;
integer         = "-" , nonzero , { digit } ;
alias           = "@" , lower , index ;
contract-slot   = "c" , index ;
fragment-slot   = "f" , index ;
obligation-slot = "o" , index ;
index           = "0" | nonzero , { digit } ;

letter          = upper | lower ;
upper           = "A" | … | "Z" ;
lower           = "a" | … | "z" ;
digit           = "0" | nonzero ;
nonzero         = "1" | … | "9" ;
```

### Lexical rules

- Outside comments, a line contains only printable ASCII (U+0021 to U+007E), space, and tab.
- A comment may contain any UTF-8 text except control characters and bidirectional controls (U+061C, U+200E, U+200F, U+202A to U+202E, U+2066 to U+2069). These are rejected anywhere in the stream.
- A byte order mark, a NUL, or a bare carriage return is rejected.
- Numbers and indices have no leading zeros, and `-0` is invalid. So every value has exactly one spelling.
- A frame may not span lines.

### Term forms

The head of a list decides its meaning.
Keywords and core constants are reserved: they cannot be bound.

| Form | Arity | Meaning |
| --- | --- | --- |
| `(pi x A B)` | 3 | Dependent function type. `x` is bound in `B`. |
| `(sig x A B)` | 3 | Dependent pair type. `x` is bound in `B`. |
| `(lam x e)` | 2 | Function. Needs an expected `pi` type. |
| `(app f a)` | 2 | Application. Same as `(f a)`. |
| `(pair a b)` | 2 | Pair. Needs an expected `sig` type. |
| `(fst p)`, `(snd p)` | 1 | Projections. |
| `(= a b)` | 2 | Equality type. |
| `refl` | atom | Proof of `(= a a)`. |
| `(case s branch …)` | 2 or more | Vector case. Needs an expected type. |
| `(f a …)` | 1 or more | Application of any other head. |

A branch is `(nil () e)`, `(cons (x t) e)`, or `(cons (m x t) e)`.

Reserved words: `pi lam app sig pair fst snd refl case U0 N Z V S put ck get build run ctx proved refuted unknown unsupported invalid`, every slot spelling (`c0`, `f12`, `o3`, …), and every `U` followed by digits.

### Limits

A conforming decoder enforces limits and reports them as `LIM`.
The `ntc` defaults are in the [quick reference](quick-reference.md#limits).
A decoder may use smaller limits. It must not accept input above the limit it states.

### Canonical form

`ntc fmt` prints each frame with single spaces and no comments.
Decoding a canonical stream and printing it again gives the same text.
The property tests check this.

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
