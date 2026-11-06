# Security policy

NextType is an execution language for agents.
Its checker decides whether model-written code is accepted, so a checker defect can be a security defect even when no runtime exploit exists.

## Report a vulnerability

Report privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**.
Do not open a public issue, pull request, or discussion for a vulnerability.

Include:

- the `ntc version` output, or the commit;
- the smallest stream and manifest that reproduce the problem;
- the result you expected and the result you got;
- whether the problem is a false acceptance, a crash, a hang, a resource bound that does not hold, or a supply-chain issue.

Use synthetic data only.
Do not send secrets, private data, or exploit payloads against live services.

## What counts as a vulnerability

| Class | Example | Severity |
| --- | --- | --- |
| False acceptance | `ntc` prints `proved` for a fragment that does not have the contract type. | Critical |
| Policy bypass | A stream changes an approved contract, uses a stale base, or uses another approval, and is not rejected. | Critical |
| Kernel bypass | An elaborated term reaches `proved` without a kernel check. | Critical |
| Resource bound failure | An input within the documented limits crashes the checker, hangs it, or exhausts memory. | High |
| Input-handling defect | The decoder accepts bidirectional controls, invalid UTF-8, or input above a limit. | High |
| Supply chain | A release artifact whose digest or provenance does not match the tagged source; the installer accepts an unpinned file. | High |
| Misleading diagnostic | A result that is technically correct but tells an agent to weaken a contract. | Medium |

A manifest constant is an axiom by design.
A manifest that declares an inconsistent constant is not a checker vulnerability; see the [security model](docs/reference/security-model.md#trust-base).

## Supported versions

| Version | Supported |
| --- | --- |
| `main` | Yes |
| Latest `0.x` release | Yes |
| Older `0.x` releases | No. Upgrade to the latest release. |

`nt`, the preview ledger script, is supported on `main` only.

## Process

1. We acknowledge the report.
2. We reproduce it and agree on severity with the reporter.
3. We prepare a fix and a conformance case that fails before the fix and passes after it.
4. We release the fix and publish a GitHub security advisory that credits the reporter, unless the reporter asks not to be named.
5. A soundness fix ships in the next release, even a patch release, as stated in [Versioning and stability](docs/reference/versioning.md).

Evidence digests produced by an affected version should be re-validated with the fixed version.
The advisory lists the affected versions.

## Release integrity

Release artifacts are built by the `release` workflow from a tagged commit.
Each release includes `SHA256SUMS` and a Sigstore build-provenance attestation.
Verify a download with:

```sh
gh attestation verify scrums-nexttype-compiler-0.1.0.tgz --repo Scrumsdotcom/nexttype
sha256sum --check SHA256SUMS
```
