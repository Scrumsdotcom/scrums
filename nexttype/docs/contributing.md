---
title: Contributing
description: How to contribute to NextType during the design preview, and where the project rules live.
order: 1
---

# Contributing

NextType is a design preview.
There is no compiler to install yet.
Useful contributions now:

- Semantic counterexamples and incomplete-contract findings.
- Compiler and protocol designs.
- Minimal conformance cases.
- Reproducible improvements to the [benchmark design](articles/benchmarks.md).
- Accurate documentation.

Label planned capabilities as planned.
Never invent a passing result for a planned command.

## Project rules

| File | Contents |
| --- | --- |
| [CONTRIBUTING.md](https://github.com/Scrumsdotcom/nexttype/blob/main/CONTRIBUTING.md) | Contribution scope, classes, evidence, and review. |
| [GOVERNANCE.md](https://github.com/Scrumsdotcom/nexttype/blob/main/GOVERNANCE.md) | Roles and decision responsibility. |
| [SECURITY.md](https://github.com/Scrumsdotcom/nexttype/blob/main/SECURITY.md) | How to report security issues. |
| [CODE_OF_CONDUCT.md](https://github.com/Scrumsdotcom/nexttype/blob/main/CODE_OF_CONDUCT.md) | Expected conduct. |

## Editing these docs

- Edit the Markdown files under `docs/`.
- Each page needs YAML frontmatter with `title` and a one-sentence `description`.
- Add new pages to `docs/nav.json`.
- Link between pages with relative `.md` paths.

The pages publish to [nexttype.dev/docs](https://nexttype.dev/docs) on the next site build.
