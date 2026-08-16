# Support

## Before opening anything

Most questions are answered by four documents:

| Question | Read |
|---|---|
| What is this and how do I start? | [`docs/adoption.md`](./docs/adoption.md) |
| How do I do a specific thing? | [`docs/getting-started.md`](./docs/getting-started.md) |
| Why is it built this way? | [`docs/spec/company-as-code-spec.md`](./docs/spec/company-as-code-spec.md) and [`docs/adr/`](./docs/adr) |
| Is this a known limitation? | [`docs/faq.md`](./docs/faq.md) and [`docs/roadmap.md`](./docs/roadmap.md) |

If `npm run validate` or the drift gate is failing, the
[`resolve-drift`](./company/skills/resolve-drift.yaml) skill describes the fix.
The answer is almost always "regenerate, do not hand-merge".

## Where to take it

**A bug in the CLI, the runtime host, or the schemas.** Open an issue with the
bug report template. Include the command you ran, the output, your Node
version, and the commit you are on.

**A question about how to model something.** Open a GitHub Discussion. Modelling
questions are usually interesting to more than one person, and the answer often
becomes documentation.

**A proposed change to the framework itself.** Open an issue with the feature
request template first, so the shape can be agreed before anyone writes code.
Changes to the conserved core additionally need a
[Proposal](./company/proposals) and, for anything architectural, an ADR. See
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

**A security vulnerability.** Do not open an issue. Follow
[`SECURITY.md`](./SECURITY.md).

**Commercial or partnership questions.** Scrums.com, via
[scrums.com](https://scrums.com).

## What support is and is not

This is an open-source seed maintained by a small team. Issues are read.
Response time is best effort and is not an SLA. There is no paid support tier
attached to this repository.

Forks are expected and encouraged. If you fork and adapt the framework, the
schemas are the compatibility surface: an implementation that validates
against them is portable, whatever language its generators are written in.
