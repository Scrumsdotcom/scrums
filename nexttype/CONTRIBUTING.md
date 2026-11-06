# Contributing to NextType

## Current contribution scope

NextType has a reference checker, `ntc`, in `packages/compiler/`.
Useful contributions include streams that `ntc` wrongly accepts or rejects, new conformance cases, protocol fixtures, benchmark methods, and accurate documentation.
Never invent passing results for a planned command.

## Build and test

```sh
cd packages/compiler
npm ci --ignore-scripts
npm test                 # type-check, unit, property, conformance, and documentation tests
npm run fuzz             # the fuzzer (NT_FUZZ_RUNS, NT_FUZZ_SEED)
cd ../..
sh tests/cli.sh          # the nt preview script and its installer
python3 .github/scripts/check_docs.py
```

Every change to the checker needs a conformance case under `conformance/`: a positive case for new behavior and a negative case for each new rejection.
A conformance case is an NTΔ stream with `; expect:` lines; see `packages/compiler/test/harness.ts`.
An `ntd` or `console` code block in the documentation is a test too.
Use a `text` block for notation that does not run.

## Start with a bounded change

1. State the required behavior and affected contract.
2. Identify the language-plan capability IDs and implementation profile.
3. Describe one observable failure or missing capability.
4. Keep implementation changes inside the approved scope.
5. Attach reproducible evidence and exact artifact versions.

A small implementation repair normally uses the existing contract.
A changed guarantee, input domain, effect, or assumption requires a separate contract-change proposal.
An agent cannot approve its own proposal.

## Contribution classes

| Class | Include |
| --- | --- |
| Compiler or runtime | Minimal NT0/NTΔ reproducer, expected behavior, negative case, affected pass, target, and evidence. |
| Proof library | Exact theorem, predicate identities, assumptions, pinned checker, and independently checked proof artifact. |
| Contract change | Old/new roots, semantic difference, compatibility impact, authority changes, and requirement-owner approval. |
| Protocol or schema | Version change, round-trip cases, malformed inputs, alias behavior, and migration plan. |
| Benchmark | Frozen workload, baseline parity, full usage records, failures, uncertainty, and reproduction procedure. |
| Website or paper | Accurate implementation state, primary references, working links, and explicit target/result distinctions. |

## Human and agent contributors

The same acceptance rules apply to both.
The author remains responsible for the correctness of the submission and its stated evidence.
Include a concise explanation of changed behavior and unresolved obligations.
Generated code must pass the same independent checks as other code.
Do not let generated patches alter their own acceptance policy.

Do not submit secrets, private customer data, copyrighted datasets without rights, or fabricated benchmark records.
Use synthetic fixtures whenever possible.
Report exploitable defects privately, as described in [SECURITY.md](SECURITY.md).

## Proof and trust requirements

An accepted proof must match the intended theorem and exact dependency identities.
Unresolved holes, unapproved axioms, unsafe assumptions, and stale proof caches block acceptance.
A failed tactic is not a refutation.
A timeout is not a success.
A proof about the core model is not evidence that every generated runtime is verified.
Report the actual verification scope.

## Tests and evidence

Choose tests that can detect meaningful failures.
Include a negative case for each new guarantee or decoder boundary.
For compiler changes, compare emitted behavior with the reference interpreter.
For effects, test cancellation, retries, authority, and relevant failure modes.
For token claims, count complete attempts and report acceptance rates.
Do not add tests that merely repeat the implementation without an independent expected behavior.

## Review and merge

Use the pull-request template.
Keep requirement changes separate from implementation repairs.
The reviewer checks behavior, assumptions, compatibility, and reproducibility.
The acceptance service checks the frozen approval envelope independently of the candidate branch.
A failing check must be repaired or explicitly escalated through a new requirement approval.
Disabling a check is not a repair.

The release maintainer publishes only artifacts with complete evidence and provenance.
Releases are built by the `release` workflow from a version tag, with `SHA256SUMS` and a build-provenance attestation.
Contributions are accepted under the [Apache License 2.0](LICENSE).

## Docs, examples and research

The repository keeps four kinds of content apart, like most language repositories:

| Folder | Publishes to | What belongs there |
| --- | --- | --- |
| `docs/` | [nexttype.dev/docs](https://nexttype.dev/docs) | Documentation only: getting started, the language guide, the reference. |
| `examples/` | nexttype.dev/examples | One folder per example with a `README.md`, a `.ntd` stream, and a `manifest.json`. CI checks every stream. |
| `benchmarks/` | nexttype.dev/benchmarks | The benchmark design and, later, measured results. |
| `research/` | nexttype.dev/research | The foundation paper and positioning articles. |

The site renders these folders on its next build. Follow the content contract:

- Each page starts with YAML frontmatter: `title` (required), `description` (one sentence, required), and optional `order`.
- Quote a frontmatter value in double quotes when it contains `: ` or ` #`, or starts with a YAML indicator such as `*`, `&`, `[`, or `"`. The check rejects it otherwise.
- Use plain GitHub-flavoured Markdown. Do not use MDX or HTML components.
- Link between pages with relative `.md` paths, for example `[Invoice](../examples/invoice/README.md)`.
- Add each new documentation page id to `docs/nav.json`. A page id is its path under `docs/` without `.md`.
- Put images next to the page that uses them and link them with relative paths.
- Run `python3 .github/scripts/check_docs.py` before you open a pull request. CI runs it too.
