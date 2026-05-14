# people-ops

> Scaffolded from the CaC-Hub `standard-hr` module. Fill in the placeholders,
> validate, and commit.

People-operations module. Owns the canonical workforce record and exposes
`workforce-state` for payroll-aware cash forecasting in finance.

## After importing

1. Fill in `contacts` in `manifest.yaml` with real canonical Person IDs.
2. Move `lifecycle` from `planning` to `hardening` once the first workflow exists.
3. Declare your first agent with the `add-agent` skill (e.g. an
   onboarding-coordinator that proposes account provisioning as a dry-run).
4. Wire `workforce-state` into finance's `consumes` block if you want
   payroll commitments in the cash forecast.

## Worked story

_Replace this section with how people-ops actually runs in your company —
who owns it, what the onboarding cadence is, which external HR system holds
authoritative data and which fields this module coordinates._
