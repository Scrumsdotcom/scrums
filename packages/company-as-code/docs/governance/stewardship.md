# Stewardship

This is a plain-language account of who looks after Company-as-Code, what they
promise, and how that is meant to change over time. It is a guideline, not a
contract. Where it states a commitment, the commitment is real; where it
describes a direction, it says so.

[`GOVERNANCE.md`](../../GOVERNANCE.md) covers the mechanics: how a decision
is recorded and which paths need a Proposal. This page covers the people
behind those mechanics.

## Where things stand today

Be clear-eyed about this, because anyone thinking of building on the project
should be.

- **One person owns and decides.** Gerald Neves created the project and owns
  it personally. He is the lead maintainer and the only code owner of the
  conserved core. Every Proposal ruling today is his.
- **Scrums.com is an implementer.** Scrums.com runs an implementation of the
  pattern and builds a commercial product on it, as a user of the framework.
- **There is no second maintainer yet.** If the lead maintainer became
  unavailable tomorrow, nobody else could merge a change to the specification.

That is normal for a young project and it is also a risk. The rest of this
page is about reducing it in a way you can check, not just a way you are told
about.

## What will not change

These hold regardless of what happens to the lead maintainer's priorities,
or to any implementer's.

1. **The license.** Everything published here is Apache-2.0 and stays that
   way. A release already made under Apache-2.0 cannot be withdrawn, and
   future releases of the specification, the schemas, the CLI, the runtime,
   and the conformance suite will be under the same license.
2. **Nothing is held back to sell.** If a capability belongs to the framework
   (the specification, a schema, a check, a conformance case), it is
   developed here, in the open. Commercial products, Scrums.com's included,
   are built above the framework, never by keeping parts of it private.
3. **The conformance suite is open and anyone can run it.** Whether an
   implementation conforms is decided by the suite, not by who wrote the
   implementation. No implementer's product, Scrums.com's included, gets
   special treatment from it.
4. **Forks are welcome.** A fork that diverges is not a defect, and the
   framework/instance boundary exists so forks can keep taking releases.

## How someone becomes a maintainer

Maintainers review and merge changes outside the conserved core. The path is
meant to be ordinary and visible:

1. **Contribute.** Several merged, non-trivial pull requests, and some reviews
   of other people's work. Quality of judgement counts for more than volume.
2. **Be proposed.** Anyone, including the contributor themselves, opens a
   Proposal naming the person and pointing at the work.
3. **Get a ruling.** The lead maintainer rules on the Proposal in the usual
   way, with the reasoning written down. A rejection says what would change
   the answer.
4. **Get listed.** The person is added to [`MAINTAINERS.md`](../../MAINTAINERS.md).

Employment by any implementer, Scrums.com included, neither helps nor hurts.
The record of work is what is assessed.

## The second code owner

The single most useful governance change this project can make is to have a
second person who can approve changes to the conserved core. The intent is:

- the second code owner is someone **who does not work with or for the
  lead maintainer**;
- they are chosen from people who have already become maintainers, not
  appointed from outside;
- once they exist, a change to the specification needs **both** code owners
  to have had the chance to object, and a disagreement between them is
  recorded on the Proposal, including the argument that lost.

Until that person exists, this page will say so plainly under
*Where things stand today*.

## If the lead maintainer steps back

People change direction. If Gerald Neves decides to stop maintaining the
project, the commitment is:

1. **Say so publicly, in advance.** An announcement in the repository at
   least 90 days before maintenance ends, so nobody finds out from silence.
2. **Hand over, do not archive.** Move the repository, and anything needed to
   keep publishing it (the schema host, package names, release access), to
   the existing maintainers or to a neutral organisation they choose.
3. **Leave the history intact.** Proposals, rulings, and ADRs stay exactly as
   they are. They are the record of why the framework is the way it is.

If there are no other maintainers by then, the repository is archived in a
state anyone can fork, with a final note explaining what happened.

## When a foundation makes sense

Moving a project into a foundation too early adds process without adding
safety. The intent is to start that conversation when the project actually
needs it, which looks like:

- at least three maintainers, from at least two organisations;
- at least one implementation, not written by the lead maintainer or by
  Scrums.com, that passes the conformance suite;
- organisations other than Scrums.com running a company on it in earnest.

Any one of those is a reason to open the discussion. All three together are
a reason to act. The choice of foundation, and whether one is needed at all,
is an open question; see [`discussion.md`](./discussion.md).

## How this page changes

Through a Proposal, like the rest of the governance documents. A change that
weakens a commitment under *What will not change* has to say so in its title.
