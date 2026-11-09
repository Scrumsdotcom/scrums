# Contributing

Thank you for helping. This file applies to the whole repository. Each area below adds its own rules.

## All changes

- To suggest a change, open an [issue](https://github.com/Scrumsdotcom/scrums/issues) or a pull request.
- Keep one change in each pull request. Explain the changed behavior and how you checked it.
- Report a vulnerability privately, as described in [`SECURITY.md`](.github/SECURITY.md). Do not open a public issue for it.
- Do not submit secrets, private customer data, or data that you do not have the rights to. This repository is public.
- Follow the [code of conduct](CODE_OF_CONDUCT.md).
- Contributions are accepted under the [Apache License 2.0](LICENSE), except in [`packages/sorted-ui/`](packages/sorted-ui), which is [MIT](packages/sorted-ui/LICENSE).

The same rules apply to human and agent contributors.
The author remains responsible for the correctness of the submission and its stated evidence.

## Documentation (`docs/`)

Read [`docs/AGENTS.md`](docs/AGENTS.md) before you change a page.

## Company-as-Code (`packages/company-as-code/`)

[Company-as-Code](https://github.com/gez-scrumsdotcom/Company-as-Code) is created and maintained by Gerald Neves in its own repository.
`packages/company-as-code/` is a copy of one upstream release, with the upstream history.

- Pinned release: `v0.7.0` (upstream commit `b30cf552e993c996aa8a3f83375ddf7f8b93eef3`).
- Make changes upstream first. Do not edit files in `packages/company-as-code/` in this repository. Open the issue or pull request in the [upstream repository](https://github.com/gez-scrumsdotcom/Company-as-Code). The change arrives here with the next sync.
- Report bugs and questions as [upstream issues](https://github.com/gez-scrumsdotcom/Company-as-Code/issues). Report a vulnerability privately, as the [upstream security policy](https://github.com/gez-scrumsdotcom/Company-as-Code/blob/main/SECURITY.md) describes.
- Dependencies are updated upstream. Dependabot in this repository does not watch `packages/company-as-code/`.
- The `company-as-code-*` workflows run the upstream checks (validate, boundary, tests, drift gate and dependency audit) on changes under `packages/company-as-code/`. The workflows in `packages/company-as-code/.github/` belong to upstream and do not run here.

### Sync a new release

```sh
git switch -c sync/cac-vX.Y.Z origin/main
.github/scripts/company-as-code-sync.sh vX.Y.Z
```

The script fetches the upstream tag, rewrites the upstream history under `packages/company-as-code/`, merges it, and checks that the folder is identical to the upstream tree at the tag.
Then update the pinned release above, commit, and open a pull request.
Merge the sync pull request with a merge commit, not a squash merge. A squash merge drops the upstream history.

## NextType (`nexttype/`)

NextType has a reference checker, `ntc`, in `nexttype/packages/compiler/`.
Useful contributions include streams that `ntc` wrongly accepts or rejects, new conformance cases, protocol fixtures, benchmark methods, and accurate documentation.
Never invent passing results for a planned command.
Decisions follow [`nexttype/GOVERNANCE.md`](nexttype/GOVERNANCE.md).

### Build and test

```sh
cd nexttype/packages/compiler
npm ci --ignore-scripts
npm test                 # type-check, unit, property, conformance, and documentation tests
npm run fuzz             # the fuzzer (NT_FUZZ_RUNS, NT_FUZZ_SEED)
cd ../..
sh tests/cli.sh          # the nt preview script and its installer
python3 scripts/check_docs.py
```

Every change to the checker needs a conformance case under `nexttype/conformance/`: a positive case for new behavior and a negative case for each new rejection.
A conformance case is an NTΔ stream with `; expect:` lines; see `nexttype/packages/compiler/test/harness.ts`.
An `ntd` or `console` code block in the documentation is a test too.
Use a `text` block for notation that does not run.

### Start with a bounded change

1. State the required behavior and affected contract.
2. Identify the language-plan capability IDs and implementation profile.
3. Describe one observable failure or missing capability.
4. Keep implementation changes inside the approved scope.
5. Attach reproducible evidence and exact artifact versions.

A small implementation repair normally uses the existing contract.
A changed guarantee, input domain, effect, or assumption requires a separate contract-change proposal.
An agent cannot approve its own proposal.

### Contribution classes

| Class | Include |
| --- | --- |
| Compiler or runtime | Minimal NT0/NTΔ reproducer, expected behavior, negative case, affected pass, target, and evidence. |
| Proof library | Exact theorem, predicate identities, assumptions, pinned checker, and independently checked proof artifact. |
| Contract change | Old/new roots, semantic difference, compatibility impact, authority changes, and requirement-owner approval. |
| Protocol or schema | Version change, round-trip cases, malformed inputs, alias behavior, and migration plan. |
| Benchmark | Frozen workload, baseline parity, full usage records, failures, uncertainty, and reproduction procedure. |
| Website or paper | Accurate implementation state, primary references, working links, and explicit target/result distinctions. |

Generated code must pass the same independent checks as other code.
Do not let generated patches alter their own acceptance policy.
Use synthetic fixtures whenever possible.

### Proof and trust requirements

An accepted proof must match the intended theorem and exact dependency identities.
Unresolved holes, unapproved axioms, unsafe assumptions, and stale proof caches block acceptance.
A failed tactic is not a refutation.
A timeout is not a success.
A proof about the core model is not evidence that every generated runtime is verified.
Report the actual verification scope.

### Tests and evidence

Choose tests that can detect meaningful failures.
Include a negative case for each new guarantee or decoder boundary.
For compiler changes, compare emitted behavior with the reference interpreter.
For effects, test cancellation, retries, authority, and relevant failure modes.
For token claims, count complete attempts and report acceptance rates.
Do not add tests that merely repeat the implementation without an independent expected behavior.

### Pull requests

Label a NextType pull request `nexttype`. In its description, include:

- **Changed behavior:** the concrete requirement and resulting behavior.
- **Contract and authority:** the existing contract root, the candidate artifact or base revision, the affected capability IDs and supported profile, and a separate approval record if a contract, effect, assumption, or acceptance rule changes.
- **Evidence:** the proof, conformance, runtime, and compatibility checks that actually ran, with their versions and verification scope. For measurements, link complete records including failures. Do not report planned checks as passing.

Keep requirement changes separate from implementation repairs.
The reviewer checks behavior, assumptions, compatibility, and reproducibility.
A failing check must be repaired or explicitly escalated through a new requirement approval.
Disabling a check is not a repair.

### Releases

The release maintainer publishes only artifacts with complete evidence and provenance.
The `nexttype-release` workflow builds a release from a `nexttype-vX.Y.Z` tag, with `SHA256SUMS` and a build-provenance attestation, and creates a draft release for review.
The tag version must match `nexttype/packages/compiler/package.json`.

### Docs, examples and research

NextType keeps four kinds of content apart, like most language repositories:

| Folder | What belongs there |
| --- | --- |
| `nexttype/docs/` | Documentation only: getting started, the language guide, the reference. |
| `nexttype/examples/` | One folder per example with a `README.md`, a `.ntd` stream, and a `manifest.json`. CI checks every stream. |
| `nexttype/benchmarks/` | The benchmark design and, later, measured results. |
| `nexttype/research/` | The foundation paper and positioning articles. |

Follow the content contract:

- Each page starts with YAML frontmatter: `title` (required), `description` (one sentence, required), and optional `order`.
- Quote a frontmatter value in double quotes when it contains `: ` or ` #`, or starts with a YAML indicator such as `*`, `&`, `[`, or `"`. The check rejects it otherwise.
- Use plain GitHub-flavoured Markdown. Do not use MDX or HTML components.
- Link between pages with relative `.md` paths, for example `[Invoice](../examples/invoice/README.md)`.
- Add each new documentation page id to `nexttype/docs/nav.json`. A page id is its path under `nexttype/docs/` without `.md`.
- Put images next to the page that uses them and link them with relative paths.
- Run `python3 scripts/check_docs.py` in `nexttype/` before you open a pull request. CI runs it too.
