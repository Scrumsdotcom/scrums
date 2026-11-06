# Changelog

All notable changes are listed here.
Versioning follows [Versioning and stability](docs/reference/versioning.md).

## Unreleased — ntc 0.1.0

### Added

- `ntc` 0.1.0, the reference checker, in `packages/compiler/`:
  - the `ntd/1` stream codec, with input limits, strict UTF-8, rejection of bidirectional controls, and a canonical printer;
  - the NT0 core: `U0`, `N`, `Z`, `V`, `S`, `pi`, `lam`, `sig`, `pair`, `fst`, `snd`, `=`, `refl`, and vector `case` with index-driven exhaustiveness;
  - an elaborator with implicit arguments and expected-type propagation;
  - an independent kernel that re-checks every elaborated term;
  - a reference evaluator (normalization by evaluation) with a step budget and bounded integers;
  - `put`, `ck`, and `get` frames; base and approval digests; `CONFLICT` and `POLICY` checks; evidence digests;
  - a 17-code diagnostic catalogue and `nt-result/1` JSON output;
  - `nt-manifest/1` manifests with constants, context, approved contracts, and aliases.
- A conformance suite under `conformance/`, seeded property tests, and a corpus-mutating fuzzer.
- Checked example streams and manifests for the invoice, vector, and state examples.
- Documentation: NTΔ shorthand, quick reference, patterns for agents, the `ntc` guide, the security model, and the versioning policy. Every `ntd` and `console` example in the documentation runs in CI.
- CI on Linux and macOS with Node.js 20, 22, and 24; CodeQL; dependency review; Dependabot; a weekly fuzz run; and a tag-triggered release workflow with `SHA256SUMS` and Sigstore build provenance.
- A security policy with a private reporting route.

### Changed

- The installer pins the SHA-256 of the `nt` script it installs, refuses non-HTTPS sources and redirects, and can require GitHub build provenance (`NT_VERIFY_PROVENANCE=1`). A file that matches the published checksum but not the pin is rejected. Set `NT_SHA256` to install a different build on purpose.
- The grammar, lexical, diagnostics, and modules reference pages now state the implemented rules. Open questions that `ntd/1` settles: comments (`;`), negative integer literals, frame size limits, and frames limited to one line.
- The status page describes what `ntc` 0.1.0 checks and what it does not.

### Breaking changes

- None for `nt` or the ledger format.
- The NTΔ notation in the documentation is now normative `ntd/1`. Earlier draft notation that `ntd/1` rejects: non-ASCII identifiers, numbers with leading zeros, and a slot definition with more than one term (write `c3 (I paid)`, not `c3 I paid`).

## Earlier — design preview

- Compiler-oriented NT0 graphs and compact NTΔ patch design.
- Fixed approval envelopes and bounded autonomous repair design.
- Complete language capability and repository plans.
- One-page foundational note and explicitly unmeasured target animation.
- Compact language reference with Designed, Planned, and Open labels.
- `nt` 0.0.1-preview: a guide and an obligation-ledger format checker (`nt proof`). It has no compiler.
- `nt` 0.0.2-preview: `nt tokens` (a token estimate, not a model tokenizer), `nt compare` (both views of an example with token estimates), `nt quickstart`, an optional `tokens` field in the ledger with a tokens-per-accepted-change line, and a starter ledger that passes on the first run.
- Paper author block: Gerald Neves, Founder and CEO, Scrums.com.

No executable language release has shipped.
