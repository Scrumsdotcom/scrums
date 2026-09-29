# Security reporting template

**Private reporting is not configured by this template.**
Before publication, the owner must enable a private vulnerability-reporting channel and name responsible maintainers.
Replace this setup notice with the verified reporting route and supported-version policy.
No response-time commitment exists yet.

Do not post secrets, exploit payloads against live services, or private data in public issues.
Use a minimal synthetic reproducer.

Useful report details include:

- Affected version, artifact digest, target, and verification profile.
- The violated contract or authority boundary.
- Reproduction steps and expected versus observed behavior.
- Whether the issue involves proof soundness, theorem substitution, capability enforcement, or code generation.
- Dependency and environment information needed to reproduce the result.

A false acceptance is a security-relevant defect even if no runtime exploit is shown.
A mismatch between a proved model and emitted code also requires investigation.
The project must preserve the failing artifact and prevent its evidence from being reused after revocation.

Supported releases, disclosure coordination, escalation contacts, and release-signing procedures remain owner decisions before launch.
