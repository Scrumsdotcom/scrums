---
title: Modules and imports
description: Manifests, content-addressed identity, exports, and generated application bindings in the NextType design.
order: 6
---

# Modules and imports

> **Status: Planned.**
> The plan fixes content-addressed identity and manifest-bound names.
> It does not define module or import syntax.
> The rules below come from the language plan (sections 3, 6, 8, and 16).

## Identity, not file paths

NextType has no required source-file layer.
The program is a typed, content-addressed term graph (NT0).
A definition is identified by its canonical semantic digest, not by its name or file.

| Rule | Status |
| --- | --- |
| Digests are domain-separated for contracts, terms, approvals, evidence, and target artifacts. | Designed |
| A digest binds the serialization and semantics versions. | Designed |
| Debug names, comments, layout, and source locations are outside semantic identity. | Designed |
| Universe levels, erasure annotations, effect rows, and primitive versions are inside semantic identity. | Designed |
| Alpha-equivalent bindings normalize. Extensionally equal programs are not identified. | Designed |
| Shared nodes are hash-consed. Recursive groups are encoded explicitly before hashing. | Designed |
| Unresolved references and unbounded cycles outside supported recursion groups reject. | Designed |

Digest equality detects identity.
It does not establish correctness.

## Manifests

A *session manifest* supplies, once per session:

- names and slots;
- contracts;
- constructor signatures;
- dependency digests.

Short slots and aliases are local.
Every authoritative reference expands to a full digest.
The manifest is immutable for the session.

A *module manifest* owns operation signatures and effect rows (section 8.3).
Target bindings reference those operations. They do not re-declare payloads.

### Manifests in the reference checker

`ntc` 0.1 implements the session manifest as `nt-manifest/1` JSON:

```json
{
  "format": "nt-manifest/1",
  "constants": [
    { "name": "InvoiceState", "type": "U0" },
    { "name": "pending", "type": "InvoiceState" }
  ],
  "context": [
    { "name": "n", "type": "N" },
    { "name": "xs", "type": "V Z n" }
  ],
  "contracts": { "c0": "(sig t Z (= t (sum xs)))" },
  "aliases": { "@b0": "sha256:…", "@a0": "sha256:…" }
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `format` | yes | Must be `nt-manifest/1`. |
| `constants` | no | Opaque constants, in order. Each `type` is NTΔ and may use earlier constants. `implicit` (0 to 16) marks leading arguments that the elaborator infers. Constants are axioms: review them. |
| `context` | no | The context Γ, outermost first. Each `type` may use earlier entries. |
| `contracts` | no | Approved contracts by slot. A stream may restate one only in the same canonical form. |
| `aliases` | no | Alias digests the agent was given. `@b0` and `@a0` default to the current base and approval digests. A `@b0` that differs from the current base makes `put` return `CONFLICT`. |

Unknown fields are rejected.
Names must be identifiers and cannot reuse a reserved word, a built-in, or an earlier name.

The **base digest** is SHA-256 over the canonical NT0 form of the constants and the context.
The **approval digest** is SHA-256 over the base digest and the canonical approved contracts.
Canonical forms erase binder names, so alpha-equivalent manifests have the same digests.

## Using another definition

In the current design, a fragment uses a definition that the manifest binds.
In the Invoice example, the manifest binds `sum`, equality, and integer addition.
In the `zip` example, `zip` resolves to a checked library definition.

```text
c2 (V (Pair A B) n)
f2 (zip xs ys)
put f2 c2 @b0
ck f2 @a0
```

A dependency digest stops an agent from replacing `zip` with a truncating host implementation.
Changing `sum` while keeping its alias is a dependency mismatch. The old approval becomes invalid.

There is no `import` statement in the current design.
How a person or agent adds a dependency to a manifest is an **open question**.

## Exports and sealing

| Rule | Status |
| --- | --- |
| Exports are explicit. | Planned (C02) |
| Modules can be parametric. | Planned (C10) |
| Module sealing, abstract types, and smart constructors hide representations. | Planned (C12) |
| A client cannot forge a value by importing internal constructors. | Planned (C12) |
| Proof submissions cannot use arbitrary imports, general macros, or build hooks. | Designed (section 6.3) |

## Application bindings

Application bindings come from checked operations.
The draft projection uses symbolic aliases for immutable manifest entries:

```text
op0 createDraft   !{store.write}
op1 invoiceById   !{store.read}
op2 requestPay    !{store.write,pay.sim}
http POST /invoices op0
http GET /invoices/:id op1
ui invoice (read op1) (act op2)
cli show op1
job reminders op3
```

- `op0`, `op1`, and `op2` declare operations with effect rows.
- `http`, `ui`, `cli`, and `job` lines bind an operation to a target.
- HTTP verbs and paths are adapter data. They are not language evaluation rules.
- `op3` resolves to a reminder operation declared elsewhere in the manifest.
- The generator derives codecs and authority checks from the operation contract.

Framework conventions never define core language meaning.
Next.js is one adapter.

## Packages

Packages, versions, locks, and a registry are planned (C46, C47).
The plan keeps separate versions for the language profile, the NT0 encoding, the NTΔ protocol, the runtime ABI, and the evidence schema.
No package format exists.

## Open questions

- Module and import syntax in both views.
- How a manifest is authored and reviewed.
- The binding-line vocabulary beyond `http`, `ui`, `cli`, and `job`.
