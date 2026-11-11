# Capabilities and the fallback chain

An org chart tells you who owns what on a good day. It does not tell you what
happens on the day the owner is on a plane, the agent's credentials expired,
or the person who knew how to run the close resigned three weeks ago.

A Capability records the whole chain, and records honestly how much of the
capability survives each hop down it.

## The shape

```yaml
id: CAP-CASH-FORECAST
criticality: high

primaryOwner:
  kind: agent
  id: cash-forecaster
  delivers: full

fallback:
  - kind: role
    id: finance-lead
    delivers: manual
    note: Same forecast, by hand, weekly rather than daily.

finalFallback:
  kind: person
  id: cfo
  delivers: reduced
  note: Position and runway without the weekly decomposition.
```

Read it as a sentence: the agent does this; if the agent is unavailable the
finance lead does it by hand and it becomes weekly; if the finance lead is
unavailable the CFO gives you position and runway and you lose the weekly
decomposition.

That is a different kind of document from "Finance owns cash forecasting."

## The `delivers` field is where the honesty lives

| Value | Means |
|---|---|
| `full` | No loss. |
| `reduced` | A documented subset. Say which subset in the `note`. |
| `manual` | The automation is gone; the outcome still happens, slower. |
| `triage-only` | This holder can hold the line, not close the loop. |

A chain whose links all claim `full` when two of them cannot actually approve
spend is worse than having no chain, because somebody will rely on it during
an incident. The generated map reads `delivers` literally, so overstating it
produces a map that lies confidently.

## Enforced rules

Four checks run in `cac validate`:

1. **The chain terminates in something that cannot itself be absent.** The
   final fallback may not be an agent. An agent can lose credentials, hit a
   rate limit, or be deleted in a refactor. The last link must be a person, a
   team, or a role.
2. **No holder appears twice in a chain.** A repeated holder is not a fallback.
3. **High and critical capabilities carry at least one intermediate fallback.**
   Primary straight to final is not a chain, it is a cliff.
4. **A critical capability may not terminate in a `triage-only` holder.**
   Somebody has to close the loop.

Every holder that names an agent or a module must resolve to a real one, so a
renamed agent breaks the chain visibly rather than silently.

## What the generated map tells you

[`/generated/capability-map.json`](../generated/capability-map.json) computes
three things worth looking at:

**`depthToFull`.** How many hops before something delivers the capability
whole. Zero means the primary owner does. A three means the company limps
through two intermediate holders before anything is complete again.

**`permanentlyDegraded`.** Capabilities where no link anywhere in the chain
delivers `full`. These are capabilities the company does not actually have; it
has a partial version of them and a list of people who each provide a
different partial version.

**`concentration`.** Holders who are the primary owner of more than one
capability. This is the company's real single-point-of-failure list. It is
usually shorter and more alarming than anyone expects, and it is derived, so
it updates the moment ownership changes rather than the next time somebody
runs a resilience workshop.

## The pattern this comes from

Multi-agent frameworks that assign work to roles have converged on a version of
this: every capability has a primary owner and a fallback, and the top of the
hierarchy is always the final fallback, so no capability is ever unowned. That
idea generalises past agent teams. It is the same problem as on-call
escalation, and the same problem as bus factor, and modelling it once means
one document answers all three.

The addition here is `delivers`. Assigning a fallback is easy. Writing down
that the fallback only does half the job is the part that makes the document
worth reading during an incident.

## Relationship to escalation policy

They answer adjacent questions and should not be merged.

`EscalationPolicy` answers "who gets paged, in what order, within what SLA."
It is about routing an interrupt.

`Capability` answers "who can actually do this thing, and how much of it."
It is about the function surviving.

An escalation chain routes to a person. A capability chain tells you what that
person can do once they pick up.

## See also

- [`/company/capabilities`](../company/capabilities)
- [`/company/runtime/escalation-policy.yaml`](../company/runtime/escalation-policy.yaml)
- [`/schemas/capability.schema.json`](../schemas/capability.schema.json)
- [ADR-0006](./adr/0006-compliance-and-capability-layer.md)
