# subscription-billing

> Scaffolded from the CaC-Hub `subscription-billing` module. Fill in the
> placeholders, validate, and commit.

Coordinates the recurring-revenue billing system. Owns canonical subscription
and billing-account IDs and the writeback-only mapping to the billing provider.

## After importing

1. Set the real `system:` label and `secretRef` in
   `integrations/billing-provider.yaml`.
2. Fill in `contacts` in `manifest.yaml`.
3. If you do not run the `standard-hr` / `people-ops` module, remove the
   `workforce-state` entry from `consumes`.
4. Declare a billing-reconciler agent (dry-run-first) with the `add-agent` skill.
5. Wire `subscription-state` into finance's revenue-recognition flow.

## Why vendor-neutral

The integration's `name` is `billing-provider`, not the vendor. The vendor is a
`system:` label, not a contract. When you switch providers, only the mapping and
the endpoints change — canonical subscription IDs and every downstream consumer
survive untouched. This is the framework's "coordinate, don't replicate" rule.
