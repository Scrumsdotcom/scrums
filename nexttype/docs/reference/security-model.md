---
title: Security model
description: What the NextType reference checker trusts, what it rejects, how it bounds resources, and what a proved result does and does not mean.
order: 13
---

# Security model

> **Applies to `ntc` 0.1.**
> This page states the guarantees of the reference checker as implemented.
> Guarantees that `ntc` 0.1 does not provide are listed at the end.

NextType is an execution language for agents.
Its inputs come from models, so every input is untrusted.
The checker's job is to say `proved` only when the fragment has the contract type, and to fail closed on everything else.

## Trust base

A `proved` result depends on these components, and only these:

| Component | File | Role |
| --- | --- | --- |
| Decoder | `packages/compiler/src/syntax.ts` | Turns bytes into frames under the input limits. |
| Core evaluator and conversion | `packages/compiler/src/core.ts` | Normalization by evaluation; definitional equality. |
| Kernel | `Kernel` in `packages/compiler/src/check.ts` | Re-checks every elaborated term from scratch. |
| Prelude | `packages/compiler/src/prelude.ts` | Types and reduction rules of the built-in constants. |
| Manifest | the session's `nt-manifest/1` file | Declares constants (axioms), context, and approved contracts. |

The elaborator is **not** in the trust base.
It resolves names and infers implicit arguments, but its output is re-checked by the kernel.
If the two disagree, the result is `invalid KERNEL`, never `proved`.

Constants declared in a manifest are axioms.
A manifest that declares `cheat : (pi A U0 A)` makes every type inhabited.
Treat the manifest as part of the approval: review it like a contract.

## What the checker rejects

| Attack | Defense | Result |
| --- | --- | --- |
| Weaken an approved contract | A restated contract must match the approval in canonical NT0 form. The fragment is always checked against the approval. | `invalid POLICY` |
| Patch a stale base | `put` compares the alias digest with the current base digest. | `invalid CONFLICT` |
| Use the wrong approval | `ck` compares the alias digest with the session approval digest. | `invalid POLICY` |
| Wildcard or missing proof | `_` is only a binder. There is no hole, `sorry`, or unchecked cast. | `invalid SYN` |
| Forge a state | State-indexed types can only be produced by approved constants. | `invalid TYPE` |
| Same name, different meaning | A name cannot be redefined: context entries, constants, and slots are unique; prelude names are reserved. | `invalid MANIFEST`, `invalid SLOT` |
| Look-alike identifiers | Identifiers are printable ASCII. Bidirectional controls are rejected everywhere, comments included. | `invalid SYN` |
| Hide a frame in a response | Result and `ctx` frames are rejected in a request stream. | `invalid SYN` |
| Prototype pollution through a manifest | Unknown keys are rejected; names must match the identifier grammar. | `invalid MANIFEST` |

## Resource bounds

Every phase is bounded.
Exceeding a bound produces a diagnostic, not a crash or a hang.

| Bound | Default | Where | Result |
| --- | --- | --- | --- |
| Input size | 1 MiB | before decoding | `invalid LIM` |
| Frames | 10,000 | decoder | `invalid LIM` |
| Bytes per frame | 64 KiB | decoder | `invalid LIM` |
| Nesting depth | 128 | decoder | `invalid LIM` |
| Nodes per frame | 20,000 | decoder | `invalid LIM` |
| Literal digits | 512 | decoder | `invalid LIM` |
| Manifest entries | 4,096 | loader | `invalid MANIFEST` |
| Evaluation steps | 1,000,000 per check | evaluator, conversion | `unknown RES` |
| Integer size | 8,192 bits | arithmetic | `unknown RES` |
| `get` budget | 1 MiB | session | `invalid LIM` |

The core has no general recursion, and every primitive terminates.
The step bound is a second line of defense against large inputs, not the termination argument.
A library caller may lower any bound with `resolveLimits`, but cannot raise it above the default.

## Capabilities of the checker process

`ntc` and the library:

- read only the files named on the command line, or standard input;
- refuse non-regular files and files over the input limit before reading them;
- never open a network connection, start a process, load code, or read environment variables;
- write only to standard output and standard error.

NTΔ programs do not run effects in the reference checker.
The evaluator computes pure values only.
`build` and `run` frames are reported as `unsupported CMD`.

## What `proved` means

`proved o0 TY f0` means: the kernel accepted fragment `f0` at the type of the approved contract, in the manifest's context, under the manifest's constants.

It does **not** mean:

- that the contract states the right requirement;
- that manifest constants are true or implementable;
- that any generated code, runtime, or target preserves the property (no target exists yet);
- that a timeout or resource bound was a success (those are `unknown`).

The evidence digest binds the checker version, the approval digest (which includes the base digest), the contract, and the fragment in canonical form.
Any change to any of them changes the digest.
The digest is a binding, not a signature: anyone can recompute it, and nobody can forge a different input with the same digest.

## Outside the scope of `ntc` 0.1

The language design includes these guarantees. `ntc` 0.1 does not provide them:

- effect rows and capability checks for host operations (see [Functions and effects](functions-effects.md));
- runtime decoders that establish trusted values at boundaries;
- erasure that keeps boundary checks;
- independent proof checking for obligations beyond `refl`;
- signed evidence records and approval envelopes (see [Evidence and approval](evidence.md)).

Report a vulnerability through the process in [SECURITY.md](https://github.com/Scrumsdotcom/scrums/blob/main/.github/SECURITY.md#nexttype).
A false `proved` is a security defect even without a runtime exploit.
