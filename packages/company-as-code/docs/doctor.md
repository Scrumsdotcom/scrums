# cac doctor

```bash
npm run doctor            # from the repo root
npm run doctor -- --strict
```

`cac validate` answers a binary question: is every document well-formed, and
does every declared edge resolve? It blocks merges, and it should.

`cac doctor` answers a different question: is this repository still healthy?
Health is not binary. A control that has not been verified in eight months is
not invalid. Neither is a module with no accountable contact, or a
documentation link that rotted when a file moved three commits ago. None of
those should block a merge on the day they appear. All of them compound.

## Two severities

- **Findings** fail the run. Something is wrong now.
- **Warnings** report and pass. Something is drifting.

`--strict` promotes warnings to findings. Most forks want that setting
eventually; starting with it usually means starting by suppressing it.

## The checks

| Check | Severity | Catches |
|---|---|---|
| `links` | warning | Relative links in Markdown that no longer resolve |
| `conserved-core` | finding | No `CODEOWNERS`: the conserved core has no mechanical gate |
| `controls` | finding | A control unverified far longer than anything else in the repo |
| `controls` | warning | A control that has never been verified |
| `ownership` | finding | A module with no accountable contact |
| `ownership` | warning | An accountable contact naming a role but no person |
| `observability` | finding | An autonomous agent with no dashboard and no alert |
| `observability` | warning | An agent with no audit topic |
| `capabilities` | warning | A high or critical capability with no metric behind it |
| `graph` | warning | An entity nothing references and which references nothing |
| `governance` | warning | An open proposal against conserved files with no ruling |

### Why "autonomous agent with no dashboard and no alert" is a finding

An agent classified `autonomous` runs without a human in the loop by
declaration. If nothing watches it, nothing notices when it stops, and a
scheduled job that stops running produces silence rather than an error.
Silence is indistinguishable from a healthy system with nothing to report.

That is the deadman problem from
[the concurrency standard](./standards/concurrency.md), applied to the agent
population as a whole.

### Why control staleness is measured against the repository, not the clock

Doctor compares each control's `lastVerified` date against the newest
verification date anywhere in the repository, not against wall-clock time.

Two reasons. The same commit produces the same doctor output on every machine
and in every replay, which is the same determinism property the generators
have. And relative staleness is the more useful signal anyway: a control that
is eight months behind everything else is being neglected, whereas a repository
where every control is eight months old is simply dormant, and that is a
different conversation.

## What doctor is not

It is not a linter for prose, a test runner, or a replacement for `validate`.
It does not check anything the schemas already make unrepresentable.

It also does not aim for a permanently empty output. A repository with two
standing warnings that everyone understands is healthier than one where the
warnings were suppressed to keep the output clean.

## Running it in CI

`validate.yml` runs `npm run doctor` on every pull request. Findings fail the
job; warnings print and pass. That split is the whole design: a repository with
no accountable owner on a module should not merge, and a repository with a
rotted documentation link should merge and then fix the link.

Forks wanting the tighter gate add `--strict` to that step. Most eventually do.
Starting with it usually means starting by suppressing it.

## Provenance

The shape comes from the `tools/doctor` script in the
[organizational-seed](https://github.com/codeyogi911/organizational-seed)
project, which frames repository self-inspection as immune surveillance:
continuous, cheap, and looking for malformed cells rather than waiting for
symptoms. The checks here are specific to this framework's primitives; the
idea that an instance should continuously inspect itself is theirs.

## See also

- [`/docs/standards/conserved-core.md`](./standards/conserved-core.md)
- [`/docs/standards/concurrency.md`](./standards/concurrency.md)
- [`/docs/compliance.md`](./compliance.md)
