# /company/runtime

Execution surface configuration. This is where the autonomy classification policy, escalation rules, dry-run defaults, and retry budgets are declared.

The runtime enforces the classifications declared on agents and workflows:

- `autonomous` actions fire without human intervention
- `human-gated` actions require explicit human confirmation
- `escalated` actions fire up to a threshold, then escalate

Schedules attached to `human-gated` workflows fail validation here.
