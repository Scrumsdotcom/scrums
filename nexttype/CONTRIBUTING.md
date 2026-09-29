# Contributing to NextType

**Proposed standalone-project guidelines.**
Maintainers must ratify this template before accepting external contributions.
It does not govern the parent company repository.

## Current contribution scope

NextType is a design preview.
Useful contributions include semantic counterexamples, compiler designs, protocol fixtures, benchmark methods, and accurate documentation.
There is no compiler installation command yet.
Use the repository's actual commands when implementation packages arrive.
Never invent passing results for a planned command.

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
Follow the project's configured private reporting channel for exploitable defects.

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
Signing, license terms, contributor agreements, and contact details need owner decisions before public launch.

## Docs, examples and research

The repository keeps four kinds of content apart, like most language repositories:

| Folder | Publishes to | What belongs there |
| --- | --- | --- |
| `docs/` | [nexttype.dev/docs](https://nexttype.dev/docs) | Documentation only: getting started, the language guide, the reference. |
| `examples/` | nexttype.dev/examples | One folder per example with a `README.md`. Each starts with the disclaimer that it has not been compiled, checked or run. |
| `benchmarks/` | nexttype.dev/benchmarks | The benchmark design and, later, measured results. |
| `research/` | nexttype.dev/research | The foundation paper and positioning articles. |

The site renders these folders on its next build. Follow the content contract:

- Each page starts with YAML frontmatter: `title` (required), `description` (one sentence, required), and optional `order`.
- Use plain GitHub-flavoured Markdown. Do not use MDX or HTML components.
- Link between pages with relative `.md` paths, for example `[Invoice](../examples/invoice/README.md)`.
- Add each new documentation page id to `docs/nav.json`. A page id is its path under `docs/` without `.md`.
- Put images next to the page that uses them and link them with relative paths.
- Run `python3 .github/scripts/check_docs.py` before you open a pull request. CI runs it too.
