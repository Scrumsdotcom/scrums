# Open questions about governance

This page starts a conversation. It lists questions about how the project is
governed that do not have settled answers yet. Each one lays out the realistic
options and says which way the lead maintainer currently leans, so there is
something concrete to argue with.

None of this is decided. The leanings are a starting point. When a question
is settled, it is decided through a Proposal and recorded in
[`stewardship.md`](./stewardship.md) or [`GOVERNANCE.md`](../../GOVERNANCE.md),
and the question is marked closed here with a link to the ruling.

To weigh in, open a discussion or an issue that names the question by its
number, or open a Proposal if you already have a concrete change in mind.

---

## 1. Should the specification and the reference implementation be governed separately?

Today the spec, the schemas, the CLI, and the runtime share one repository
and one set of rules.

- **Keep them together.** One place, one process. The spec and its checks
  cannot drift apart because they change in the same pull request.
- **Split governance, keep one repository.** The spec and schemas need a
  higher bar (for example, both code owners), while the CLI and runtime move
  at ordinary maintainer speed.
- **Split repositories.** The spec becomes its own project, and this one
  becomes one implementation among several.

*Current leaning:* keep one repository but split the bar. A separate spec
repository makes sense once a second, independent implementation exists. Before
then, it would separate the spec from the only code that tests it.

## 2. Who is the second code owner, and how are they chosen?

[`stewardship.md`](./stewardship.md) says the second code owner should come
from the maintainers and should not work with or for the lead maintainer. Open details:

- Is the lead maintainer's ruling enough to appoint them, or should existing
  maintainers have a say?
- Should the role rotate, or be held until someone steps down?
- What happens when the two code owners disagree and neither moves?

*Current leaning:* appointed by Proposal, held until stepping down, and a
deadlock is resolved by doing nothing: the existing spec stands until one side
brings better evidence. Changing the spec should be harder than keeping it.

## 3. How are decisions made once there are several maintainers?

Today every Proposal is ruled on by one person.

- **Lead maintainer rules.** Simple and fast. Does not scale past trust in one
  person.
- **Lazy consensus.** A Proposal passes if no maintainer objects within a
  stated window. Fast, but silence is not the same as agreement.
- **Vote.** Explicit, but it encourages counting heads over weighing evidence.

*Current leaning:* lazy consensus for anything outside the conserved core, and
a recorded ruling for the conserved core, with any maintainer able to force a
full ruling by objecting.

## 4. Who may say an implementation is "conformant"?

The [conformance suite](../../conformance/README.md) decides whether an
implementation produces the right verdicts. Whether anyone may use the word
"conformant" in public is a separate question.

- **Anyone who passes the suite may say so.** No gatekeeper. Hard to stop
  someone claiming it falsely.
- **A listed registry.** Implementations submit their suite output, and a
  maintainer adds them to a list.
- **A formal mark.** Needs a legal owner for the mark, which is part of
  question 6.

*Current leaning:* anyone who passes may say so, provided they name the suite
version they passed. A registry is worth adding when there is more than one
implementation to list.

## 5. Should employees of one implementer count towards maintainer diversity?

The foundation criteria in [`stewardship.md`](./stewardship.md) ask for
maintainers from at least two organisations.

- **Count everyone equally.** Simple, and fair to individual contributors.
- **Cap any one organisation's share.** For example, no more than half of the
  maintainers who can approve the conserved core.

*Current leaning:* count everyone for maintainership, and apply a cap only to
code owners of the conserved core. That is where a single organisation's
interests matter most.

## 6. Who should hold the name, the schema host, and the package names?

The project name, the host the schema identifiers point at, and the
published package names are what make the project findable and what forks
point back to. Today they sit with the lead maintainer personally.

- **The lead maintainer keeps them,** with the hand-over commitment in
  [`stewardship.md`](./stewardship.md).
- **A neutral holder now,** such as a fiscal host or a small independent
  association, before it is needed.
- **A foundation later,** when the criteria in `stewardship.md` are met.

*Current leaning:* the lead maintainer holds them for now, under the written
hand-over commitment, and they move with the project if it joins a
foundation. Moving them earlier costs effort and protects against a risk the
commitment already covers. That is the weakest of these leanings and the one
most worth challenging.

## 7. Does the project need a foundation at all?

- **No.** A clear stewardship page, two independent code owners, and an
  Apache-2.0 license already give adopters most of the protection.
- **A small, purpose-built foundation.** Full control, real overhead.
- **An existing umbrella foundation.** Established process and neutrality,
  but a process designed for larger projects.

*Current leaning:* no decision until the criteria in `stewardship.md` are met.
The question is listed so nobody has to wonder whether it was considered.

---

## Closed questions

None yet.
