# Proposals

The mutation queue for the conserved core.

Most of this repository is free: add a task, write a playbook, declare a
metric, open a pull request. A small part is conserved, and changing it goes
through a Proposal that states the reason, the evidence, the expected benefit,
how the change will be validated, and how it is rolled back.

Writing a proposal is free and carries no authority. Anyone can write one,
including an agent. Applying one requires a recorded ruling from a human, with
their words quoted verbatim.

## What is conserved

The paths listed in [`.github/CODEOWNERS`](../../.github/CODEOWNERS): the
specification, the standards, the ADRs, the schemas, the policies, the
autonomy and escalation policies, the requirements and controls, this folder,
and the CI workflows.

Everything else is free. That boundary is deliberate. A repository where every
path needs the same review does not have a conserved core, it has a
bottleneck.

## The shape of a ruling

A ruling records the decision, the deciding person's canonical ID, the date,
and their own words. Not a paraphrase. The verbatim quote is what makes the
record readable years later, when the reasoning matters more than the outcome.

An agent may draft the wording of a ruling. It may not be the actor.

## Why this and not just pull requests

A pull request records that a change was merged. A proposal records why the
change was necessary, what evidence made it necessary, what would count as it
having worked, and how to undo it. The merge button is the ruling; the
proposal is everything the merge button cannot hold.

## See also

- [`/docs/standards/conserved-core.md`](../../docs/standards/conserved-core.md)
- [`/schemas/proposal.schema.json`](../../schemas/proposal.schema.json)
- [`PROP-0001`](./PROP-0001-compliance-and-capability-layer.yaml), which is the
  proposal that added the folder it lives in
