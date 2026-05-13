# /company/observability

Logs, traces, audit records, and alert routing. The observability layer surfaces:

- **audit log** — one row per orchestration action (every script run, every API call, every dry-run, every error)
- **traces** — per-correlation-id execution traces
- **alerts** — threshold breaches on declared metrics

The audit log is distinct from the typed event ledger:

- Audit log answers: *what did we do?*
- Event ledger answers: *what happened to this entity?*

Audit records validate against [`/schemas/audit-record.schema.json`](../../schemas/audit-record.schema.json).
