# /company/workflows

Cross-cutting orchestrations not owned by a single module. Most workflows live alongside their owning module; this directory holds workflows that span domains.

Validate against [`/schemas/workflow.schema.json`](../../schemas/workflow.schema.json).

Triggers may be event, schedule, human, webhook, or manual. Workflows declared as `hitl: true` cannot have a `schedule` trigger — the runtime rejects that combination.
