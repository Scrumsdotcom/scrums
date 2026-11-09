# Controls

The mechanisms that keep Requirements true, and the evidence they produce.

A Control declares what it implements, how it is verified, how often, and
where the proof lands. A control nobody checks is a claim, so `verification`
is required, and a control declaring `method: automated` must name a `check`
that a machine actually runs.

## The rules

- `status: operating` asserts the control has run and produced evidence. It
  requires both a `lastVerified` date and at least one evidence entry.
- `implements` is the single writer of the requirement-to-control edge.
  Requirements never list their controls.
- Evidence entries point somewhere an auditor can follow without asking a
  human where to look: an audit topic, an event type, a CI workflow, a
  dashboard, a retained document.
- A control unverified for longer than the staleness window is a `cac doctor`
  finding, not a silent pass.

## Verification surfaces

| Surface | Means |
|---|---|
| `schema` | The shape of the document makes the violation unrepresentable |
| `ci` | A check runs on every pull request and blocks the merge |
| `runtime-host` | The runtime refuses the action at execution time |
| `scheduled-job` | An agent or automation checks on a cadence and emits on divergence |
| `human-review` | A person checks on a cadence and records the result |
| `external-audit` | A third party attests |

The first three are the ones worth building. The last three are what you write
down honestly when the first three are not available yet.

## See also

- [`/company/requirements`](../requirements) for the obligations
- [`/docs/compliance.md`](../../docs/compliance.md)
- [`/schemas/control.schema.json`](../../schemas/control.schema.json)
