# ADR 0005: CaC-Hub as an in-repo module registry

- **Status:** Accepted (retrospective, records a decision shipped in v0.5.0, PR #13)
- **Date:** 2026-07-02
- **Deciders:** Seed maintainers
- **Tags:** ecosystem, scope, governance

## Context

The roadmap listed *"a 'marketplace' / public registry of forks, modules,
skills"* under **Considered later (or never)**. v0.5.0 then shipped
**CaC-Hub**: `hub/modules/*` plus `cac hub list / show / add / validate`,
without an ADR, leaving the roadmap celebrating a feature its own non-goals
section appeared to decline. For a framework whose pitch is declared scope,
that contradiction is worse than either decision on its own.

## Decision

CaC-Hub is **in scope** and stays, but it is deliberately a *narrower thing*
than the declined marketplace:

1. **In-repo only.** Hub modules live in the repository (`/hub/modules`),
   version with it, and are reviewed through the same PR process as any other
   artefact. There is no hosted service and no network fetch.
2. **Schema-governed.** Every module is a `HubModule` document wrapping a
   `payload/` that validates against the framework schemas,
   `cac hub validate` is part of the test suite.
3. **Dry-run-first scaffolding.** `cac hub add` projects the writes before
   applying them, refuses collisions, and only writes under `/company`.
4. The **hosted public registry** (third-party publishing, discovery across
   forks, supply-chain trust model) remains **Considered later (or never)**.
   Shipping it requires a new ADR superseding this one, including a
   provenance/signing story.

## Consequences

- The roadmap's non-goal is reworded from "marketplace / public registry" to
  "hosted public registry", with CaC-Hub explicitly carved out.
- Community module contributions are PRs against `/hub/modules`, inheriting
  CI validation and human review, no separate trust infrastructure needed.
- If a hosted registry ever ships, the in-repo format is its interchange
  format; nothing shipped in v0.5.0 is throwaway.

## Lesson recorded

This ADR is retrospective. The plan-first/ADR discipline the repository
declares was not followed for PR #13; the release checklist
([`docs/release-checklist.md`](../release-checklist.md)) now makes an ADR (or
an explicit N/A) part of cutting a release, so scope changes can't ship
undocumented again.
