# Generated SDKs

**Do not edit by hand.** These files are a deterministic projection of the
canonical JSON Schemas under `/schemas`. Regenerate with:

```bash
npm --prefix cli run generate
```

`cac generate --check` gates drift on these files exactly like every other
generated artefact, if the schemas change and the SDK is not regenerated, CI
fails.

## Why

The JSON Schemas are the single source of truth for the Company-as-Code spec.
A "Company Agent" can be written in any language, but it must stay strictly
typed against that spec. These SDKs are how: each target language gets native
type definitions generated straight from the schemas, so a type error in agent
code is a spec violation caught at compile time.

## Targets

- **`typescript/`**: one `.ts` per schema exporting an `interface`, plus
  `index.ts` with a `CompanyDocument` discriminated union keyed by `kind`.
- **`python/`**: one `.py` per schema exporting a `TypedDict` (Python 3.11+),
  plus `__init__.py` re-exporting every type.

## Schema → root type

| Schema | Root type |
| --- | --- |
| `agent.schema.json` | `Agent` |
| `audit-record.schema.json` | `AuditRecord` |
| `automation.schema.json` | `Automation` |
| `autonomy-policy.schema.json` | `AutonomyPolicy` |
| `capability.schema.json` | `Capability` |
| `control.schema.json` | `Control` |
| `dashboard.schema.json` | `Dashboard` |
| `escalation-policy.schema.json` | `EscalationPolicy` |
| `event-type-registry.schema.json` | `EventTypeRegistry` |
| `event.schema.json` | `Event` |
| `goal.schema.json` | `Goal` |
| `hub-module.schema.json` | `HubModule` |
| `initiative.schema.json` | `Initiative` |
| `instance.schema.json` | `Instance` |
| `integration.schema.json` | `Integration` |
| `interface.schema.json` | `Interface` |
| `manifest.schema.json` | `ModuleManifest` |
| `metric.schema.json` | `Metric` |
| `organization.schema.json` | `Organization` |
| `person.schema.json` | `Person` |
| `proposal.schema.json` | `Proposal` |
| `requirement.schema.json` | `Requirement` |
| `shadow-enrollment.schema.json` | `ShadowEnrollment` |
| `skill.schema.json` | `Skill` |
| `state-snapshot.schema.json` | `StateSnapshot` |
| `task.schema.json` | `Task` |
| `workflow.schema.json` | `Workflow` |

## Adding a language

Add an emitter function to `cli/src/sdk.ts` and include its output in
`sdkFiles()`. The schema-walking core (`$ref`, `enum`, `const`, unions,
nested objects) is shared across emitters.
