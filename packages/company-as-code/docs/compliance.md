# Compliance as code

Every operating framework describes how work gets done. Almost none of them
describe what the company is obliged to be able to prove. That gap is why a
SOC 2 or ISO 27001 audit costs hundreds of person-hours: the evidence exists,
scattered across CI logs, ticket systems, and people's memories, and somebody
has to spend a quarter assembling it into a shape an auditor accepts.

Company-as-Code models the obligation and the mechanism as two typed
primitives with a one-way edge between them, then generates the coverage view
that an auditor actually asks for.

## Two primitives, one direction

**Requirement** states what must be true. It comes from somewhere: an ISO
clause, a SOC 2 criterion, a GDPR article, a contract, or a rule the company
imposes on itself. It has an owner, a scope, and a severity.

**Control** states how it is kept true. It names the Requirements it
implements, how it is verified, on what cadence, and where the evidence lands.

The edge runs one way. Controls name Requirements; Requirements never name
Controls. This is the same one-writer-per-field discipline the framework
applies everywhere else, and it has the same payoff: the two lists cannot
disagree, because there is only one list.

```
Requirement  REQ-SOC2-CC6-1
     ▲
     │ implements
     │
Control      CTRL-IDENTITY-DRIFT-DETECTION
     │
     │ verification.check
     ▼
Agent        identity-drift-detector  (runs hourly, emits typed events)
     │
     │ evidence
     ▼
Event ledger platform.identity_drift_detected
```

Reading up that chain answers an auditor's question in one hop each: which
obligation, which mechanism, which run, which evidence, which date.

## The coverage gate

An `in-scope` Requirement with no operating Control fails `cac validate`.

That single rule is what makes this a compliance system rather than a
compliance document. A gap does not wait to be discovered at audit time; it
fails the build the moment somebody retires the last control covering an
obligation, or adds an obligation without covering it.

Two escape hatches exist, and both are explicit:

- `status: planned` for an obligation the company intends to meet but has not
  yet. It is visible in the matrix and excluded from the gate.
- `status: out-of-scope` with a required `scopeRationale`. A scoped-out
  obligation with a written reason is a defensible position. A silent
  exclusion is the thing auditors look for first.

## What gets generated

`cac generate` emits [`/generated/control-matrix.json`](../generated/control-matrix.json):

| Field | Answers |
|---|---|
| `requirements[]` | Every obligation with its covering controls, verification method, and evidence sources |
| `gaps` | In-scope obligations with no operating control |
| `orphanControls` | Controls implementing requirements that do not exist |
| `byFramework` | Total, in-scope, and covered counts per framework |
| `requirements[].automated` | Whether coverage is machine-verified or a human promise |

That last column is the honest one. A control whose verification method is
`human-review` is a real control, and it is not the same kind of thing as one
that blocks a merge. The matrix shows you which is which instead of averaging
them into a percentage.

The matrix is drift-gated. It cannot quietly stop matching its sources.

## Staleness

`cac validate` asks whether coverage exists. `cac doctor` asks whether it is
still real. A control whose `lastVerified` date has fallen far behind the rest
of the repository is a doctor finding: it is either not running, or nobody has
looked at whether it is running, and those two failure modes are
indistinguishable from outside.

Doctor compares against the newest verification date in the repository rather
than against wall-clock time, so the same commit produces the same answer on
every machine and in every replay.

## Worked example

The seed ships seven requirements across five frameworks and six controls
covering them. Every one of the controls points at something that actually
exists in this repository:

| Control | Verified by | Where |
|---|---|---|
| `CTRL-HITL-EXTERNAL-WRITES` | CI | `cli/src/validate.ts` refuses a HITL workflow carrying a schedule |
| `CTRL-DRY-RUN-BEFORE-LIVE` | Runtime host | `runtime/src/executor/runner.ts` refuses a live write with no prior dry-run |
| `CTRL-IDENTITY-DRIFT-DETECTION` | Scheduled job | The `identity-drift-detector` agent, hourly |
| `CTRL-PRODUCTION-CHANGE-GATE` | Runtime host | The `production-deploy` workflow's preflight, dry-run, approval sequence |
| `CTRL-SECRET-AND-DEPENDENCY-SCAN` | CI | `.github/workflows/security.yml`, blocking |
| `CTRL-RUNTIME-ACTIVITY-LEDGER` | Runtime host and review | Append-only audit and event tables, plus quarterly retention review |

Five of the six are machine-verified. The sixth is honest about being hybrid.
That ratio is the number worth tracking as a fork matures.

## What this deliberately is not

It is not a GRC product. There is no questionnaire workflow, no evidence
collection UI, no auditor portal. Those are things a fork builds on top, or
buys, and connects through the generated matrix.

What lives here is the part that has to be in version control to be worth
anything: the obligations, the mechanisms, the edge between them, and a gate
that fails when the edge breaks.

## See also

- [`/company/requirements`](../company/requirements) and [`/company/controls`](../company/controls)
- [`/docs/standards/policy-to-control-matrix.md`](./standards/policy-to-control-matrix.md) for framework-internal rules
- [`/docs/doctor.md`](./doctor.md)
- [ADR-0006](./adr/0006-compliance-and-capability-layer.md)
