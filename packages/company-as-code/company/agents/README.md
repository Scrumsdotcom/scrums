# /company/agents

Cross-cutting autonomous units, typically executive-scope agents like the CEO strategist or domain roll-up agents. Most agents live alongside their owning module.

Validate against [`/schemas/agent.schema.json`](../../schemas/agent.schema.json).

Every agent declares:

- **purpose**: one-sentence intent
- **autonomy**: `autonomous`, `human-gated`, or `escalated`
- **cadence**: how often it operates
- **runtime**: abstract (llm, scheduled-job, event-handler). No vendor names

Autonomy is enforced. An agent declared `human-gated` cannot fire on a schedule.
