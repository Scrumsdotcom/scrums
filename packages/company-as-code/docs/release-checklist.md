# Release checklist

The project sells versioned, auditable operations. Its own release history
must satisfy the same bar. Every release, however small, walks this list.

## Before tagging

1. **CHANGELOG.** Move the shipped `[Unreleased]` entries under a new
   `## [x.y.z], YYYY-MM-DD` heading. Every PR since the last release is
   represented. Update the compare links at the bottom of the file.
2. **Version fields.** `cli/package.json` and `runtime/package.json`
   `version` match the release. The README **Project status** section names
   the new release.
3. **Roadmap.** `docs/roadmap.md` moves shipped items into "Shipped", updates
   the snapshot date, and contains no entry that is simultaneously shipped
   and in-flight.
4. **ADRs.** Any scope change (new primitive, new subsystem, reversal of a
   non-goal) has an ADR. If none is needed, say "ADR: N/A" in the release PR.
5. **Version fields, second pass.** `package.json` at the root, plus
   `CITATION.cff` (`version` and `date-released`).
6. **Green gates.** `npm run validate`, `npm test` (both packages),
   `npm run typecheck` (both packages), `npm run generate:check`,
   `npm run boundary`, and `npm run doctor` all pass at the release commit.
7. **Zero em dashes.** `grep -rP '\x{2014}' --exclude-dir=.git --exclude-dir=node_modules .`
   returns nothing. Punctuation that carries meaning beats punctuation that
   carries rhythm.
8. **Stewardship.** "Where things stand today" in
   [`docs/governance/stewardship.md`](./governance/stewardship.md) still
   describes the project as it is: who decides, who sponsors, and whether a
   second code owner exists. Any question in
   [`docs/governance/discussion.md`](./governance/discussion.md) settled since
   the last release is marked closed with a link to its ruling.

## Tagging

9. Tag the release commit: `git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin vX.Y.Z`.
   The tag points at the commit the CHANGELOG entry describes, never at a
   later commit.

## After tagging

10. `release.yml` fires on the tag. It re-runs every gate rather than trusting
   that the tagged commit was green on its pull request, confirms that all
   three `package.json` versions and the CHANGELOG heading agree with the tag,
   extracts the CHANGELOG entry, and publishes the GitHub release. A tag that
   cannot pass the project's own gates does not become a release.
11. Verify the CHANGELOG compare links resolve (they 404 until the tags are
    pushed).

## Versioning policy

The policy is [`docs/standards/versioning.md`](./standards/versioning.md#release-numbers).
In short, while the framework is 0.x:

- A change that makes an existing valid document invalid ships with an ADR
  and a migration, bumps the document version (`v1alphaN` to `v1alphaN+1`),
  and is a **minor** release.
- New optional fields or new primitives are a **minor** release.
- Tooling and documentation fixes are a **patch** release.
