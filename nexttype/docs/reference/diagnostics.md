---
title: Diagnostics
description: Proof results, the draft diagnostic frame, and the diagnostic and response codes the NextType design defines.
order: 9
---

# Diagnostics

> **Status: Implemented in `ntc` 0.1.**
> The reference checker emits the five proof results and the code catalogue below (C22).
> Codes are stable: a code keeps its meaning and is never reused.

## Proof results

Every obligation ends in exactly one result:

| Result | Meaning | Required evidence |
| --- | --- | --- |
| `proved` | The obligation holds. | A checked proof artifact bound to the exact program and contract. |
| `refuted` | The obligation does not hold. | A validated counterexample or accepted refutation evidence. |
| `unknown` | The checker could not decide. | None. Timeouts and failed tactics land here. |
| `unsupported` | The obligation is outside the supported fragment. | None. For example, an unsupported predicate. |
| `invalid` | The input is malformed or inconsistent. | None. For example, a bad frame or a wrong theorem statement. |

The plan defines `proved`, `refuted`, and `unknown` precisely.
It names `unsupported` and `invalid` but does not define them in full.
Their rows show the intended reading; the exact boundary is an **open question**.

Rules:

- A timeout is `unknown`, never `proved` or `refuted`.
- A failed tactic is `unknown`. It is not a counterexample.
- A cached result is transport metadata, not a separate status.
- Acceptance is reported separately from proof status.

## Diagnostic shape

A diagnostic has four parts (Designed, section 3.4):

1. a code;
2. an obligation slot;
3. a typed local context;
4. an evidence handle.

Draft NTΔ form:

```text
unknown o0 EQ f0
ctx @k0
get o0 256
```

| Line | Meaning |
| --- | --- |
| `unknown o0 EQ f0` | Result `unknown` for obligation `o0`, class `EQ`, in fragment `f0`. |
| `ctx @k0` | `@k0` resolves to the expected type and the relevant local context. |
| `get o0 256` | The agent's next frame: request bounded context for `o0`. |

Every response also has a request identity in its transport envelope.
A bounded response declares omitted context, so a truncated answer cannot look complete.

## Code catalogue

| Code | Phase | Results | Meaning |
| --- | --- | --- | --- |
| `SYN` | Decode | `invalid` | Malformed frame or term, a response frame in a request, a `_` used as a term. |
| `LIM` | Decode | `invalid` | An input limit was exceeded. |
| `ALIAS` | Decode, session | `invalid` | Malformed alias, unknown alias, or an alias of the wrong class. |
| `SLOT` | Session | `invalid` | Undefined, redefined, or misused slot; a stream without `ck`. |
| `SCOPE` | Elaborate | `invalid` | Unbound name, or a binder that reuses a reserved word or a constant. |
| `TYPE` | Elaborate | `invalid` | Type mismatch. The message gives the expected and found types. |
| `IMPL` | Elaborate | `invalid` | An implicit argument could not be inferred. |
| `UNIV` | Elaborate | `invalid` | A type is in a larger universe than expected. |
| `CASE` | Elaborate | `invalid` | Missing, unreachable, duplicate, or malformed branch; case on a non-vector. |
| `TY` | Obligation | `proved` | The typing obligation of a fragment. |
| `EQ` | Obligation | `refuted`, `unknown` | `refl` against two sides with different normal forms. `refuted` when both are closed values. |
| `CONFLICT` | Patch | `invalid` | The base alias names a stale base. The patch did not apply. |
| `POLICY` | Policy | `invalid` | A restated contract differs from the approval, or `ck` names the wrong approval. |
| `RES` | Any | `unknown` | The step bound or the integer-size bound was exhausted. |
| `CMD` | Session | `unsupported` | `build` or `run`, which the reference checker does not run. |
| `MANIFEST` | Load | `invalid` | Malformed manifest. |
| `KERNEL` | Check | `invalid` | The kernel rejected an elaborated term, or an internal error occurred. Report it as a bug. |

The plan keeps these error classes distinct: programmer fault (`KERNEL`), unsupported feature (`CMD`), resource exhaustion (`RES`), and invalid input (everything else).
Resource exhaustion appears as a diagnostic, not as a crash.

## Output format

`ntc check` prints one line per obligation in the response form above, then comment lines:

```text
proved o0 TY f0
; evidence sha256:…
unknown o1 EQ f1
; 6:12 refl does not hold: (add (sum xs) 1) and (sum xs) are not definitionally equal; …
```

A diagnostic that has no obligation, such as `CONFLICT` or `POLICY`, prints as a comment: `; LINE:COL RESULT CODE message`.
`ntc check --json` prints all diagnostics as `nt-result/1` JSON.

## Failure sources by pass

Each compiler pass has a failure vocabulary (section 15.1).
The codes are not assigned.
This table shows where diagnostics will come from:

| Pass | Example failures |
| --- | --- |
| Decode | Frame too large, bad grammar, wrong alias class. |
| Scope | Dangling variable, capture, illegal recursion group. |
| Elaborate | Unresolved implicit, unsolved motive, universe inconsistency, missing termination evidence. |
| Obligation generation | Statement or predicate identity does not match the approval. |
| Check | Unapproved axiom, proof hole, stale dependency, wrong theorem. |
| Policy | Patch touches protected inputs, broader effect, new assumption. |

## Required negative cases

The plan lists cases that must produce a rejection or an unresolved result:

- Empty-vector access and unequal-length `zip` inputs.
- Wrong invoice totals and mixed currencies.
- Invalid state transitions and forged success responses.
- Stale versions, repeated requests, and exhausted capability budgets.
- Different definitions hidden behind the same display name.
- Missing proofs, unapproved assumptions, and checker resource exhaustion.
- Changed dependencies with stale cached evidence.
- Host functions attempting to return unchecked evidence.

## The preview CLI

`nt proof` is not a compiler and does not emit these diagnostics. Use `ntc`.
It prints `FILE:LINE: ID: message` lines for ledger format errors.
See [The nt preview CLI](../tools/cli.md).
