# Security Policy

## Reporting a vulnerability

**Do not open a public issue for security reports.**

If you believe you have found a security vulnerability in Company-as-Code — in the reference CLI, the schemas, the generators, or anything else shipped from this repository — report it privately.

### How to report

- Open a **private security advisory** via GitHub: `Security` tab → `Report a vulnerability`.
- Or email the maintainers at the address listed in the repository's `MAINTAINERS` file.

Include:

- a description of the issue
- steps to reproduce or a proof-of-concept
- the affected version or commit
- the impact you believe it has
- any suggested mitigation

### What to expect

- Acknowledgement within 72 hours.
- An initial assessment within 7 days.
- A fix, mitigation, or formal acceptance of the risk within 30 days for confirmed issues. Critical issues are prioritized.
- Coordinated disclosure: we will agree on a publication timeline with the reporter before disclosing.

We do not currently operate a bug bounty.

---

## Scope

In scope:

- the reference CLI (`/cli/`)
- the canonical schemas (`/schemas/`)
- the generators and their outputs (`/generated/`)
- the CI workflows (`.github/workflows/`)
- the documentation insofar as it could mislead operators into insecure configurations

Out of scope:

- vulnerabilities in third-party SaaS systems integrated via `/company/integrations`
- forks that have modified the schemas, generators, or invariants
- denial-of-service issues that require an actor with merge access to the repository
- social-engineering against contributors

---

## Security posture (operational)

This is also the place where the project's operational security posture is summarized. Detailed standards live in [`docs/standards/security.md`](./docs/standards/security.md).

- **No force-push to protected branches.** Branch protection is configured at the platform level. History-rewriting pushes are rejected.
- **No secrets in the repository.** Secrets live in the secret store declared per integration. Pre-commit hooks scan for common secret patterns; CI re-scans on push.
- **HITL by default for irreversible writes.** External-system writes go through human approval unless promoted to autonomous through a recorded policy update.
- **Dry-run first.** Every new write path runs in dry-run before the first live execution. The audit log records the dry-run.
- **Dependency review.** Pull requests that add or upgrade dependencies are reviewed for supply-chain risk.
- **Adversarial verification.** Recalled information (memory, docs, prior answers) is treated as a claim. Operators verify before acting.

---

## Cryptographic signing

If your fork operates in a regulated context, enable commit signing and consider artifact signing for `/generated/` outputs. This repository does not require either by default, but both are recommended.

---

## License

This policy is licensed under the same Apache 2.0 terms as the rest of the project.
