# Importing what a company already knows

How to start an existing company on Company-as-Code without typing in every
person and team by hand, and without letting an import decide anything.

> **Status: scaffold.** One importer exists, for org charts. The shape every
> importer follows is settled; the list of importers is not.

## The rule

**An importer drafts. A human accepts.**

Nothing an importer produces enters the company graph on its own. Drafts land
in `company/.drafts/<importer>/`, a folder the loader never reads, and every
drafted entity starts in status `proposed`. A person reviews the drafts, edits
them, and runs `cac import accept` to move them in. Even then they stay
`proposed` until someone confirms each one and sets it to `active`.

This is the federation idea from [`adoption.md`](./adoption.md) applied to
data. The source system stays the source. The import records what it said on
the day you ran it, labelled as such, and you decide what to believe.

## Importing an org chart

Export your people from wherever they live today, as CSV with a header row.
Only `name` is required.

| Column | Meaning |
|---|---|
| `name` | Required. Becomes the Person's display name and canonical ID (`PERSON-ADA-LOVELACE`). |
| `email` | Primary email. |
| `title` | Role title, linked to the team when there is one. |
| `team` | Each distinct team becomes a draft Organization (`ORG-FINANCE`) listing its members. |
| `type` | `employee` (default), `contractor`, or `supplier`. |
| `lead` | `yes` marks the person as a lead of their team. |
| `id` | The source system's own ID, kept as an external ID so you can trace every draft back. |

```bash
cd cli

# See what would be drafted
npx tsx src/index.ts import org-chart --file ~/exports/people.csv

# Draft it
npx tsx src/index.ts import org-chart --file ~/exports/people.csv --write

# Read and edit company/.drafts/org-chart/, then
npx tsx src/index.ts import accept org-chart --into company/directory
npx tsx src/index.ts import accept org-chart --into company/directory --write

npm run validate
```

The importer warns rather than guesses. Two people with the same name are
drafted as `PERSON-ADA-LOVELACE` and `PERSON-ADA-LOVELACE-2` with a warning to
check for a duplicate. An unknown `type` is drafted as `employee` with a
warning. `accept` refuses to overwrite any identity that already exists; merging
is a human job.

## Writing an importer

An importer is one file in `cli/src/importers/` implementing a small interface:
a name, a summary, a description of its input, and a `draft()` function that
turns the input's text into drafts and warnings. Add it to `IMPORTERS` in
`cli/src/importers/index.ts`.

Three rules keep importers safe to add:

1. **Generic formats only.** CSV, Markdown, JSON exports. Never a named
   product's API; vendor names stay out of business logic.
2. **Drafts are `proposed`.** An importer never marks anything active.
3. **Warn, do not guess.** When the input is ambiguous, draft the most
   conservative reading and say so.

Importers worth writing next:

- **Runbooks to playbooks.** A folder of Markdown procedures, drafted as
  playbooks with their owners left for a human to fill in.
- **Systems inventory to integrations.** A spreadsheet of tools, drafted as
  read-only Integration declarations.
- **Responsibility matrix to capabilities.** A RACI sheet, drafted as
  capability chains with every link marked for review.
