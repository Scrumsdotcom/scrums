---
title: Versioning and stability
description: How NextType versions the language, the formats, and the checker; and what each version promises.
order: 14
---

# Versioning and stability

NextType versions four things separately.
Each carries its own identifier, so a tool can check compatibility without guessing.

| Surface | Identifier | Current |
| --- | --- | --- |
| NTΔ stream format | `ntd/N` | `ntd/1` |
| Manifest format | `nt-manifest/N` | `nt-manifest/1` |
| Result format (JSON) | `nt-result/N` | `nt-result/1` |
| Reference checker | semantic version | `0.1.0` |

`ntc version` prints all four.

## Rules for the formats

A format identifier changes only for an incompatible change.

- **Compatible** (same identifier): a new optional manifest field; a new diagnostic code; a new built-in constant whose name was not previously usable; a new JSON field in a result.
- **Incompatible** (new identifier): a change to the meaning of an existing frame, term, field, or code; removing anything; making a valid stream invalid.

A checker supports the current identifier and, after a change, the previous one for at least one minor release.
A reader must reject an identifier it does not know.
`ntc` rejects an unknown `format` in a manifest with `invalid MANIFEST`.

## Rules for the checker

The checker follows [Semantic Versioning 2.0.0](https://semver.org/).

Before 1.0:

- A minor release (`0.x.0`) may change behavior. Every change is listed under **Breaking changes** in the changelog, with a migration note.
- A patch release (`0.x.y`) fixes defects only.
- Soundness fixes are exempt: if a release accepted something it must reject, the next release rejects it, even in a patch. Such a fix is called out in the changelog and in a security advisory.

From 1.0:

- A stream that is `proved` by `1.a` is `proved` by every `1.b` with `b ≥ a`, unless the proof relied on a soundness defect.
- Diagnostic codes keep their meaning and are never reused.
- Limits only grow within a major version.

## Evidence digests

An evidence digest includes the checker version.
A digest from one version is not expected to match a digest from another.
To re-validate evidence after an upgrade, re-run `ntc check` with the same manifest and stream.
