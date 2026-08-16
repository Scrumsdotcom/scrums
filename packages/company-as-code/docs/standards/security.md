# Standard: Security

## Rule

Force-push to protected branches is forbidden. Secrets never enter the repo. Dependencies are reviewed before adoption.

## Force-push

- `main` and any release branch are protected. Force-push is denied at the branch protection layer.
- If a commit needs correction: amend before pushing, or accept the extra commit. The history is the audit trail.

## Secrets

- No secret ever lives in the repo. Period.
- `.gitignore` excludes `.env`, `.env.local`, `credentials.json`, and the like.
- Integration manifests reference secrets by `secretRef`. A pointer into the secret manager. Never a literal.
- If a secret is accidentally committed: rotate it immediately, *then* clean the history. Rotation is mandatory; history-cleaning is best-effort.

## Dependencies

- New runtime dependencies require: a brief justification in the PR description, a license check (Apache 2.0 / MIT / BSD compatible), and a maintenance assessment (last release < 12 months, more than one maintainer is a plus).
- CI installs use `npm ci` exclusively: **no `|| npm install` fallback**. The lockfile is authoritative; if it doesn't match `package.json`, fix the lockfile in the same PR.
- Vulnerability scanning runs in CI on every PR and weekly: `npm audit --omit=dev --audit-level=high` for both `cli/` and `runtime/`. See [`.github/workflows/security.yml`](../../.github/workflows/security.yml).
- Static analysis runs via CodeQL on every PR and weekly. Findings land in the Security tab.
- Secret scanning runs via gitleaks on every PR.
- All GitHub Actions are pinned by SHA, not by tag.
- Dependabot opens grouped version-update PRs; see [`.github/dependabot.yml`](../../.github/dependabot.yml). Each ecosystem opens at most two: one for minor and patch bumps, one for majors. npm runs weekly, GitHub Actions monthly, because actions are SHA-pinned and the pin holds until someone reads the diff.
- A new release waits on its registry before it becomes a PR: 3 days for a patch, 7 for a minor, 30 for a major. A version that is withdrawn or immediately re-patched never reaches review. **Security updates ignore the cooldown, ignore the grouping, and ignore the open-PR limit.** Fast fixes stay fast; routine churn does not.

## Reporting

Vulnerabilities are reported per [`SECURITY.md`](../../SECURITY.md). Do not disclose publicly until coordinated.
