# Standards

Engineering and operational standards. Versioned, reviewable, enforceable. If a rule is worth enforcing, it lives here. If it is not in the repo, it is a preference, not a standard.

| Standard | Topic |
|---|---|
| [`code-organization.md`](./code-organization.md) | Where logic lives, where runtime config lives, what `/company` looks like |
| [`schema-migrations.md`](./schema-migrations.md) | How JSON Schemas evolve, deprecation cadence, ADR requirement |
| [`branching.md`](./branching.md) | Branch naming, lifecycle, protected branches |
| [`merge-policy.md`](./merge-policy.md) | Required reviews, drift gate, generated-file rules |
| [`security.md`](./security.md) | Force-push policy, secret handling, dependency review |
| [`observability.md`](./observability.md) | What every new agent must emit |
| [`documentation.md`](./documentation.md) | What every new module must declare |
| [`write-discipline.md`](./write-discipline.md) | How external write paths survive crashes and collisions |
| [`concurrency.md`](./concurrency.md) | Session leases, fencing, deadman checks between operators |
| [`conserved-core.md`](./conserved-core.md) | Which paths change only through a Proposal, and how that is enforced |
| [`policy-to-control-matrix.md`](./policy-to-control-matrix.md) | Every declared rule mapped to its enforcement location (schema / CI / runtime / discipline) |
| [`framework-boundary.md`](./framework-boundary.md) | Which paths belong to the framework and which to the company; what a fork may change |
| [`fork-namespacing.md`](./fork-namespacing.md) | Where a fork's decisions and hub modules live so they never collide with upstream's |
| [`versioning.md`](./versioning.md) | Framework release versus document version, the alpha/beta/stable ladder, migrations |
