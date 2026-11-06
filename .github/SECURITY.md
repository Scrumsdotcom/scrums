# Security policy

## Report a vulnerability

Please practice responsible disclosure. Report a security issue to us privately, and give us time to fix it before you tell anyone else.

Do not report security issues in public issues, discussions or pull requests.

Report them in one of two ways:

- [GitHub private vulnerability reporting](https://github.com/Scrumsdotcom/scrums/security/advisories/new)
- Email [security@scrums.com](mailto:security@scrums.com)

Include:

- The affected file, package or URL.
- The steps to reproduce the issue.
- The impact you expect.

## What to expect

- We confirm receipt within 3 business days.
- We tell you if we accept the issue, and we keep you informed while we fix it.
- We tell you when we release a fix. With your permission, we credit you in the release.

## Scope

This policy covers:

- The content of this repository.
- The `@scrums/*` npm packages built from [`packages/`](../packages).
- The NextType language and its tools in [`nexttype/`](../nexttype). See [NextType](#nexttype) below.
- The documentation at [scrums.com/docs](https://www.scrums.com/docs).

For the Scrums.com platform, use the same channels.

## Supported versions

We fix security issues in the latest release of each package. Packages at `0.x` can change between minor versions.

## NextType

NextType is an execution language for agents.
Its checker decides whether model-written code is accepted, so a checker defect can be a security defect even when no runtime exploit exists.

When you report a NextType issue, also include:

- the `ntc version` output, or the commit;
- the smallest stream and manifest that reproduce the problem;
- the result you expected and the result you got;
- whether the problem is a false acceptance, a crash, a hang, a resource bound that does not hold, or a supply-chain issue.

Use synthetic data only.
Do not send secrets, private data, or exploit payloads against live services.

### What counts as a vulnerability

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
A manifest that declares an inconsistent constant is not a checker vulnerability; see the [security model](../nexttype/docs/reference/security-model.md#trust-base).

### Supported NextType versions

| Version | Supported |
| --- | --- |
| `main` | Yes |
| Latest `0.x` release | Yes |
| Older `0.x` releases | No. Upgrade to the latest release. |

`nt`, the preview ledger script, is supported on `main` only.

### How we handle a NextType report

1. We acknowledge the report.
2. We reproduce it and agree on severity with the reporter.
3. We prepare a fix and a conformance case that fails before the fix and passes after it.
4. We release the fix and publish a GitHub security advisory that credits the reporter, unless the reporter asks not to be named.
5. A soundness fix ships in the next release, even a patch release, as stated in [Versioning and stability](../nexttype/docs/reference/versioning.md).

Evidence digests produced by an affected version should be re-validated with the fixed version.
The advisory lists the affected versions.

### Release integrity

The `nexttype-release` workflow builds NextType release artifacts from a `nexttype-v*` tag.
Each release includes `SHA256SUMS` and a Sigstore build-provenance attestation.
Verify a download with:

```sh
gh attestation verify scrums-nexttype-compiler-0.1.0.tgz --repo Scrumsdotcom/scrums
sha256sum --check SHA256SUMS
```
