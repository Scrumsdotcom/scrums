# /company/domains/product-operations/platform

Shared platform, identity, billing, deployment, observability. Worked example demonstrating sub-cognition: three child modules ([`identity`](./sub-cognition/identity), [`billing`](./sub-cognition/billing), [`deployment`](./sub-cognition/deployment)) each with its own manifest, and three agents with distinct autonomy classifications:

- `deploy-watchdog`: **escalated** (event-driven, escalates after 3 consecutive failures)
- `identity-drift-detector`: **autonomous** (read-only against the IdP)
- `billing-reconciler`: **human-gated** (proposes, never writes)

See [`manifest.yaml`](./manifest.yaml).
