# Capabilities

Things the company must be able to do, and who does them when the usual holder
cannot.

Most operating models record who owns what. That answers the question on a
good day. A capability records the whole chain: the primary owner, the ordered
fallbacks, and a final fallback that cannot itself be absent. It also records
how much of the capability each link actually delivers, which is the part
organizations usually discover the hard way.

## The `delivers` field

| Value | Means |
|---|---|
| `full` | No loss. This holder does the whole thing. |
| `reduced` | A documented subset. Write down which subset. |
| `manual` | The automation is gone; the outcome still happens, slower. |
| `triage-only` | This holder can hold the line, not close the loop. |

Being honest here is the difference between a fallback chain and a comforting
list of names. A chain whose links all say `full` when two of them cannot
actually sign anything is worse than no chain, because it will be believed.

## The rules

- The chain terminates in a holder that is not an agent. An agent can be
  unavailable, misconfigured, or deleted; the last link must not be.
- A holder may not appear twice in the same chain. A repeated holder is not a
  fallback, it just looks like one.
- `high` and `critical` capabilities require at least one intermediate
  fallback.
- A `critical` capability cannot terminate in a `triage-only` holder, because
  nobody closes the loop.

## The generated view

[`/generated/capability-map.json`](../../generated/capability-map.json) flattens
every chain and reports `depthToFull` (how many hops before something is whole
again), capabilities that are `permanentlyDegraded` (no link anywhere delivers
`full`), and `concentration`: holders who are the primary owner of more than
one capability. That last list is the company's real single points of failure,
whatever the org chart says.

## See also

- [`/docs/capabilities.md`](../../docs/capabilities.md)
- [`/schemas/capability.schema.json`](../../schemas/capability.schema.json)
