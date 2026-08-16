# ADR 0002: Modular monolith as the canonical structure

- **Status:** Accepted
- **Date:** 2026-05-13
- **Deciders:** Seed maintainers
- **Tags:** architecture, structure

## Context

A framework for organizing companies as code must commit to a structural shape. The choice constrains everything downstream, module boundaries, deployment topology, observability, the ergonomics of cross-team coordination.

Three viable shapes existed at the time of the seed build:

1. **Microservices-by-default.** Each module is its own service with its own deployment.
2. **Modular monolith.** One repository, one deployment surface, hard boundaries between modules enforced by declarative manifests rather than network calls.
3. **Undifferentiated mass.** No structural commitment. Each fork picks what it wants.

The framework's audience includes startups (who lack operational maturity for microservices), agencies (whose engagements are short-lived), consultancies (who codify operating models that should outlive a single deployment), and AI-native companies (whose primary scaling axis is agents, not engineering headcount). All of these are better served by clear boundaries without the operational tax of running many services.

Additionally, the spec's emphasis on **operational clarity over architectural fashion** and **simplicity over enterprise bloat** points away from microservices-by-default.

## Decision

The canonical Company-as-Code structure is a **modular monolith**, enforced by manifest-level declarations rather than by network or process boundaries.

Specifically:

- Each module owns its business logic, data access, agents, and invariants.
- Cross-module communication happens only through interfaces declared in `manifest.exposes` and referenced in the consumer's `manifest.consumes`.
- Infrastructure layers contain zero business logic.
- State mutation is unidirectional (ADR-0003).
- The dependency-graph generator surfaces violations of these rules; CI fails on regeneration drift.

Forks may deploy modules as separate services later. The manifest already declares the interface; the migration is mechanical when the time comes. The default is one repository, one deployment surface.

## Consequences

**Positive**

- New contributors can read the whole organization in one place.
- Cross-cutting refactors are tractable.
- The discipline of declared interfaces makes future extraction to services cheap.
- Schemas, generators, validators, and audit infrastructure live in one place.

**Negative**

- Independent scaling of modules is not free at runtime.
- A misbehaving module can affect the whole deployment.
- Teams accustomed to microservices may resist the boundary discipline (the discipline doesn't enforce itself in code at runtime, it's enforced at declaration time).

**Neutral**

- The framework's drift gate and validator do the work of "boundary enforcement at compile time", without compile time.
- Migrating a module out to its own service later is a deployment change, not a redesign.

## Alternatives considered

- **Microservices-by-default.** Rejected as the wrong default for the audience. Forks that need it can do the extraction work themselves.
- **Undifferentiated mass.** Rejected because it offers no opinion, and frameworks that offer no opinion offer no value beyond a folder layout.
- **Domain-driven design with bounded contexts as services.** Rejected as overlapping with the modular monolith choice; the manifest captures bounded-context discipline without the deployment tax.

## Implementation notes

- The `manifest.yaml` is the single source of truth for module boundaries (ADR-0001 made the ADR-driven workflow itself canonical).
- The `dependency-graph` generator under `/cli/src/generate.ts` emits the cross-module edges.
- The cross-document validator in `/cli/src/validate.ts` rejects manifests that consume from undeclared sources.
- The standard at [`/docs/standards/code-organization.md`](../standards/code-organization.md) operationalizes this decision.

## Links

- Spec section: "Modular monolith discipline"
- ADR-0003: Unidirectional mutation flow
- Standard: [`/docs/standards/code-organization.md`](../standards/code-organization.md)
- Anatomy: [`/docs/anatomy/manifest.md`](../anatomy/manifest.md)
