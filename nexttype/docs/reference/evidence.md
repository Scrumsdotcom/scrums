---
title: Evidence and approval
description: The approval envelope, the evidence record, proof statuses, and the three verification levels in the NextType design.
order: 11
---

# Evidence and approval

> **Status: Designed.**
> The approval envelope, the authority split, and the evidence levels are in the language plan (sections 6 and 14).
> No enforcement service exists.

## Four authorities

| Authority | May change | Cannot self-authorize |
| --- | --- | --- |
| Requirement owner | Intent, accepted domains, required behavior, capability envelope, assumptions, release policy. | A machine proof does not replace this decision. |
| Implementation agent | Authorized bodies, approved proof attempts, local optimizations, generated artifacts. | Contract changes, broader effects, extra assumptions, weaker tests, larger budgets. |
| Independent acceptance service | Verifies immutable inputs, runs checks, issues evidence, accepts or rejects. | Invent requirements or approve its own changed checker policy. |
| Runtime authority | Enforces current capabilities, revocation, transaction limits, deployment scope. | Infer permission from an agent-generated string or a passing test. |

## The approval envelope

An *approval envelope* binds every input that can change acceptance.
The alias `@a0` refers to one.

| Field | Meaning | Validation |
| --- | --- | --- |
| `contractRoot` | Preconditions, postconditions, invariants, termination, public signatures. | Immutable digest and dependency closure. |
| `semanticsRoot` | Core semantics and the definitions of referenced predicates. | Pinned identity. Display names are not enough. |
| `assumptionRoot` | Allowed axioms, trusted adapters, environmental premises. | Exact allowlist and transitive inspection. |
| `acceptanceRoot` | Public evaluation specification and private evaluator identity. | The agent cannot write the evaluator or its fixtures. |
| `capabilityRoot` | Resource scope, effects, authority, aggregate limits. | Checked again when an external action executes. |
| `editScope` | Authorized nodes, files, packages, generated destinations. | Candidate changes are compared with the task boundary. |
| `budget` | Model tokens, attempts, wall time, solver time, memory, external requests. | Enforced outside generated program code. |
| `toolchainRoot` | Checker profile, compiler passes, runtime adapters, dependencies. | Content and version pinning. |
| `approval` | Approver, project, old and new roots, expiry, nonce, review record. | Authenticated outside the agent's authority. |

Rules:

- A boolean `approved: true` inside an agent patch grants no authority.
- The approval store is separate from the agent's writable files.
- Approval is evidence of a decision. It is not a theorem that the requirement is sensible.
- Stale, expired, wrong-project, replayed, or revoked approvals reject.

## Acceptance

The foundational note states acceptance as:

```text
Accept_A(p, π, r) ⇔ Root(C) = A.contract
                  ∧ K(π : Sat(p, C))
                  ∧ Tests_A(r) = pass
                  ∧ Bind(r, p, A)
```

- `A` is the approval, `C` the contract, `p` the program, `π` the proof, `r` the test record.
- `K` checks proof evidence.
- `Bind` links every result to the exact program, dependency, and toolchain identities.

## The repair state machine

```text
approved -> scoped -> proposed -> elaborated -> checked -> tested -> accepted
                         |           |           |         |
                         +-----------+-----------+---------+--> repair
repair -> proposed                         [budget remains]
repair -> stopped                          [budget exhausted]
any -> rejected                            [policy or identity violation]
contract-change -> approval-required -> new-approved-root
```

- Policy checks run before expensive proof search.
- A test timeout is a failed or incomplete run.
- A successful proof cannot replace missing integration results.
- A tool failure cannot reuse an earlier green result for a different artifact.
- Every attempt is recorded, including rejected changes.

## Verification levels

| Level | Claim | Required evidence |
| --- | --- | --- |
| E1 | The core model satisfies the specification. | A checked theorem bound to the exact core program. |
| E2 | The target agrees on the tested corpus. | E1 plus differential, property, mutation, and integration tests. |
| E3 | The supported compilation preserves the modeled behavior. | A checked preservation theorem or accepted translation validation. |

The first preview targets E2 and displays E1 as its proof scope, reported as `core-model`.
E2 never gets an "entire application proved" label.
E3 is a separate research workstream.
Today no level is reached.

## Trusted components

| Component | Trusted to | How to inspect it |
| --- | --- | --- |
| Human intent and specification | Express the intended task. | Review, examples, counterexamples, specification mutation. |
| IR semantics and encoding | Represent the intended language. | A small semantic model and formal-methods review. |
| Lean kernel and allowed axioms | Validate proofs correctly. | Pinned versions and independent checking. |
| TypeScript interpreter | Implement the formal semantics. | Differential testing; later a preservation path. |
| Code generator and passes | Preserve behavior. | Simple emission; comparison with the interpreter. |
| Runtime adapters | Enforce effects and boundary checks. | Contract tests, fault injection, runtime enforcement. |
| JavaScript engine, OS, hardware | Execute as assumed. | Recorded platform assumptions. |

A core theorem does not verify a browser or an operating system.

## Feature status vocabulary

Each language feature gets a record with this status set:
`planned`, `specified`, `implemented`, `conformant`, `deprecated`, `unsupported`.
Only evidence can promote a feature to `conformant`.
