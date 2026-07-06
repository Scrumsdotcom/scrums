# Release checklist

The project sells versioned, auditable operations — its own release history
must satisfy the same bar. Every release, however small, walks this list.

## Before tagging

1. **CHANGELOG.** Move the shipped `[Unreleased]` entries under a new
   `## [x.y.z] — YYYY-MM-DD` heading. Every PR since the last release is
   represented. Update the compare links at the bottom of the file.
2. **Version fields.** `cli/package.json` and `runtime/package.json`
   `version` match the release. The README **Project status** section names
   the new release.
3. **Roadmap.** `docs/roadmap.md` moves shipped items into "Shipped", updates
   the snapshot date, and contains no entry that is simultaneously shipped
   and in-flight.
4. **ADRs.** Any scope change (new primitive, new subsystem, reversal of a
   non-goal) has an ADR. If none is needed, say "ADR: N/A" in the release PR.
5. **Green gates.** `npm run validate`, `npm test` (both packages),
   `npm run typecheck` (both packages), and `npm run generate:check` all pass
   at the release commit.

## Tagging

6. Tag the release commit: `git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin vX.Y.Z`.
   The tag points at the commit the CHANGELOG entry describes — never at a
   later commit.

## After tagging

7. Create the GitHub release from the tag, with the CHANGELOG entry as the
   release notes.
8. Verify the CHANGELOG compare links resolve (they 404 until the tags are
   pushed).

## Versioning policy (from the CHANGELOG header)

- Backwards-incompatible change to a canonical primitive's schema → **major**.
- New optional fields or new primitives → **minor**.
- Tooling and documentation fixes → **patch**.
