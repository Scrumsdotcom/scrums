# Plan: <Title>

**Status:** `active` | `parked` | `blocked` | `in-flight` | `complete`
**Owner:** <Name>
**Last touched:** <YYYY-MM-DD>
**Resume cue:** One sentence describing exactly what a fresh operator needs to read to pick this up.

---

## Goal

One or two sentences. What does done look like?

## Solution shape

The intended architecture. The boundaries it respects. Where logic lives, where it does not.

- Modules touched
- Interfaces declared
- Generators run
- HITL surfaces affected

## Capability check

What has been verified about the systems involved? List the evidence, not opinions.

- [ ] Module `<X>` has a manifest
- [ ] Interface `<Y>` is declared and stable
- [ ] CI drift gate passes locally

## Caveats

Known unknowns, locked-in design decisions, things not to re-debate.

## Phasing

Explicit stages, each small enough to be picked up independently.

### Phase 0: <short name>

- [ ] Task 1
- [ ] Task 2

### Phase 1: <short name>

- [ ] Task 1

## Open questions

Things parked until resumption. Each question should be answerable, not open-ended.

## Resume cue (verbose)

A longer version of the resume cue. What to read first, what to verify, what to do next. Written so a fresh operator (human or agent) can start at the next concrete step without re-deriving context.
