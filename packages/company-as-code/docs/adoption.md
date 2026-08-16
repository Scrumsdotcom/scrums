# Adoption: federate, do not migrate

The most common way to fail at this is to treat it as a migration.

A migration means moving your data into a new system, which means a project,
which means a deadline, which means the whole thing is judged on whether the
data arrived. Meanwhile the company keeps running on the old systems, because
it has to, and the new repository fills up with a partial copy of reality that
nobody trusts.

The alternative is federation. Your systems keep running and keep owning their
data. The repository starts as the coordination layer above them: it records
which system is authoritative for what, it holds the canonical IDs, and it
runs one real process end to end.

**A company is on Company-as-Code the day one real decision flows through the
loop. Not the day its data moves.**

## The first week

1. **Write the executive manifest.** One module, `company/executive/ceo`, with
   an honest purpose statement and one accountable contact. Ten minutes.
2. **Enumerate your systems as Integrations.** One file per external system:
   what it is the source of truth for, which canonical entities it maps to,
   and which direction mutation flows. This moves no data. Adoption here is
   acknowledgment, not migration.
3. **Pick the one process that hurts.** Not the most important process, the
   most painful recurring one. Month-end close, incident response, deal desk,
   onboarding. Write it as a Workflow with real steps, real inputs, and a real
   HITL gate where a human currently makes the call.
4. **Run it once, by hand, following the declaration.** Where the declaration
   and reality disagree, reality wins and the declaration gets fixed. Do this
   before automating anything.
5. **Declare the metric that says whether it worked.** One Metric with an
   owner, a lineage, and a freshness expectation.

At the end of the week you have a repository that describes one real process
truthfully. That is worth more than a complete-looking structure describing
nothing.

## The first quarter

- **Add a capability chain for the process you wrote.** Who does it when the
  usual owner cannot, and how much of it survives. This is a fifteen-minute
  document that answers a question most companies cannot answer at all.
- **Turn one manual check into a Control.** Something a machine already does,
  written down as the mechanism it is, pointed at the obligation it serves.
- **Add the second module only when a second module actually consumes
  something.** A module with no consumer is a folder.
- **Put one agent in shadow mode.** Perpetual dry-run, accumulating evidence.
  Promote it when the evidence clears the bar, not when the demo looks good.

## What not to do first

**Do not scaffold all three domains and thirty subdirectories.** Structure
without content is the failure mode this framework is most likely to produce,
because the structure is the easy part. A folder with no manifest declares no
logic, which is legitimate; a repository that is entirely such folders declares
nothing at all.

**Do not automate a process you have not first run manually from the
declaration.** Automation amplifies whatever shape the process is in,
including its errors. The manual run is where you find out that step four
depends on a spreadsheet nobody mentioned.

**Do not build the coordination layer as a mirror of your SaaS databases.**
That is the single biggest source of drift available to you. Within a year
nobody trusts it, and the effort to get there was substantial.

## The five properties that make this work

Any implementation of the pattern, this one or another, has to be all five of
these. Dropping any one collapses it back into documentation.

| Property | What it means | How this repository does it |
|---|---|---|
| **Queryable** | You can trace relationships between people, modules, agents, obligations, and systems without reading prose | Typed reference edges resolve into [`company-graph.json`](../generated/company-graph.json) |
| **Versionable** | Every change is explicit, attributed, diffable, and reversible | Git, plus the [conserved core](./standards/conserved-core.md) for the parts that must not change casually |
| **Integrated** | State moves between the repository and the systems that hold the truth | [Integrations](../company/integrations) with canonical IDs and a declared mutation direction |
| **Testable** | You can model a change before it becomes real | Dry-run on every write path, plus [shadow mode](./shadow-mode.md) for agents |
| **Accessible** | Non-technical operators can participate | The honest current answer: partially. Generated views and the cognition graph server help; a low-code authoring surface is a roadmap item, not a shipped one |

That last row is deliberately not dressed up. A framework that claims all five
when it has four and a half is exactly the kind of thing this framework is
supposed to make impossible to say.

## Calibration signals

Healthy adoption:

- The declaration gets corrected when it disagrees with reality, rather than
  reality being described as an exception.
- Agents are added because a specific recurring judgement was being made the
  same way every time, not because agents are the point.
- `cac doctor` output is read and acted on, and its warning count trends down
  slowly rather than being suppressed.
- Someone who joined last month can answer "what is the company doing right
  now" from the repository.

Unhealthy adoption:

- Many modules, few manifests. Structure has outrun content.
- Generated files edited by hand. The drift gate is being fought rather than
  used.
- Every capability chain says `full` at every link. Nobody has been honest yet.
- The last proposal was six months ago and the spec has changed three times.
  The conserved core has become decorative.

## Migrating doctrine from old tooling

When you find operating knowledge trapped in a wiki, a prompt library, or a
tool you are leaving, migrate it curated rather than wholesale. Read all of it,
take what earns its place, leave the wrapper, and record the gaps you find
while reading.

A wholesale import produces a repository full of content nobody wrote and
nobody will maintain. The point of the exercise is the reading.

## See also

- [`/docs/getting-started.md`](./getting-started.md) for the hands-on walkthrough
- [`/docs/forking.md`](./forking.md) for adapting the framework itself
- [`/docs/scenarios/`](./scenarios) for three end-to-end examples
