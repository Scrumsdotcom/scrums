# Anatomy

Field-by-field deep-dives on the canonical primitives. Use these when authoring a new instance and the schema alone is too terse, or when reviewing a PR and you need to be sure each declaration carries its weight.

| Deep-dive | Primitive | Schema |
|---|---|---|
| [`manifest.md`](./manifest.md) | Module manifest | [`/schemas/manifest.schema.json`](../../schemas/manifest.schema.json) |
| [`agent.md`](./agent.md) | Agent | [`/schemas/agent.schema.json`](../../schemas/agent.schema.json) |
| [`workflow.md`](./workflow.md) | Workflow | [`/schemas/workflow.schema.json`](../../schemas/workflow.schema.json) |

For the other primitives (Task, Initiative, Goal, Metric, Event, Audit Record, Interface, Organization, Person, Integration, Skill), the schemas + worked examples in `/company/**` are sufficient as anatomy. If a field repeatedly trips contributors up, add a section here.
