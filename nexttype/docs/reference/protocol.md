---
title: Machine protocol
description: The planned NextType machine protocol: requests, bounded responses, compact and JSON modes, and evidence.
order: 10
---

# Machine protocol

> **Status: Planned.**
> The language plan names the operations and their bounded outputs (section 9 and C44).
> Wire schemas are not written. No server or CLI implements them.
> The `nt` preview CLI does not implement this protocol.

## Modes

| Mode | Consumer | Form |
| --- | --- | --- |
| Compact | Agents | NTΔ frames, such as `put f0 c0 @b0`. |
| JSON integration | Ordinary tools | Canonical JSON with the same semantics. |

The plan starts with a local CLI that supports NTΔ frames and a JSON mode.
The website and other clients call the same library or service interface.
An MCP or language-server adapter can follow when a concrete client needs it.

## Operations

| Operation | Input | Bounded output |
| --- | --- | --- |
| `inspect` | Program digest, symbol, context budget. | Contract, effects, dependency signatures, evidence status. |
| `holes` | Program digest and scope. | Obligation ids, expected types, allowed names. |
| `context` | Obligation id and requested dependency ids. | Relevant definitions, with a token estimate and truncation state. |
| `patch` | Base digest and typed edits. | Candidate digest, or an explicit conflict. |
| `check` | Candidate digest and checker profile. | Structured statuses and artifact references. |
| `build` | Accepted candidate and target. | Runtime artifact and trust manifest. |
| `run` | Artifact, fixture, runtime profile. | Result and effect trace. |
| `evidence` | Artifact or obligation id. | Verification manifest and reproduction inputs. |

Compact projections of some operations:

| Operation | NTΔ frame |
| --- | --- |
| `context` | `get o0 256` |
| `patch` | `put f0 c0 @b0` |
| `check` | `ck f0 @a0` |
| `build` | `build @p0 @t0` |
| `run` | `run @x0 @r0` |

`inspect`, `holes`, and `evidence` have no compact frame in the design yet.

## Protocol rules

| Rule | Status |
| --- | --- |
| Every request and response has a request identity. | Designed |
| Responses are bounded. A truncated response declares what it omitted and a continuation identity. | Designed |
| A patch is compare-and-swap against an exact base. A stale base returns `CONFLICT`. | Designed |
| Requests support cancellation. Repeated requests are idempotent. | Planned (C44) |
| The protocol version is separate from the language, NT0, runtime ABI, and evidence versions. | Designed |
| Clients use the same checker and revision identities. | Planned (C48) |

## Evidence record

`check` and `evidence` return an evidence manifest.
The plan gives this proposed TypeScript interface for tool authors:

```ts
type ProofStatus = "proved" | "refuted" | "unknown" | "unsupported" | "invalid";

type EvidenceManifest = {
  schemaVersion: string;
  specificationDigest: string;
  programDigest: string;
  dependencyDigest: string;
  semanticsVersion: string;
  checkerDigest: string;
  compilerDigest: string;
  runtimeArtifactDigest: string | null;
  proofArtifactDigest: string | null;
  proofStatus: ProofStatus;
  verificationScope: "core-model" | "compiled-core";
  assumptionIds: string[];
  runtimeAssumptions: string[];
  obligations: Array<{ id: string; status: ProofStatus; evidenceDigest: string | null }>;
  acceptance: "passed" | "failed" | "not-run";
  integrationRunDigest: string | null;
};
```

The implementation will use validated discriminated unions to exclude inconsistent combinations.
For example, `proved` requires a checked artifact and completed obligations.
Elapsed time and timestamps live in a run record, outside reproducible digests.
See [Evidence and approval](evidence.md).

## Cache identity

A cached result is keyed by specification, implementation, dependencies, semantics, checker profile, and tool versions.
Runtime evidence adds adapter identities and test fixtures.
A change invalidates the affected dependency closure.
A cache hit still reports its evidence provenance.
Cached text and cached tokens do not count as free.

## Open questions

- The JSON schema for each request and response.
- Compact frames for `inspect`, `holes`, and `evidence`.
- The operation for a contract-change proposal.
- Transport: local process, HTTP, or both.
