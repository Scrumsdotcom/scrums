---
name: nexttype
description: Write and review NextType contracts, and keep their obligations in a PROOF.md ledger checked by the nt preview CLI. Use when a task mentions NextType, NTΔ, nt guide, nt proof, PROOF.md, or dependent-type contracts in a TypeScript-style language.
license: Apache-2.0
compatibility: Needs sh, awk, and curl to install the nt preview CLI. Linux, macOS, BSD, or WSL.
---

# NextType

NextType is an experimental execution language for agents.
It keeps a TypeScript lineage.
Dependent types are the spec: a type can state a rule, such as "the total equals the sum of the lines".
Agents write the code. A planned compiler checks it against the fixed contract. People review and approve the contract.

## Status and safety

- Status: design preview. The `ntc` reference checker type-checks NTΔ (build it from `packages/compiler`; see https://nexttype.dev/docs/tools/ntc). `nt` is a separate preview script and is not a type checker. Nothing is measured.
- `nt proof` checks the ledger format only. It is not a type check and not a proof.
- NextType is experimental. Run it in isolated workspaces, not against production systems or sensitive data.
- Say what is planned and what is measured. Never claim a proof that you do not have.

## Install the preview CLI

Use the `nt` that is already on `PATH` when one exists. Install it only when it is missing:

```sh
command -v nt >/dev/null 2>&1 || curl -fsSL https://nexttype.dev/install.sh | sh
nt version
```

The installer puts `nt` in `${NT_INSTALL_DIR:-$HOME/.local/bin}`. It checks a SHA-256 and never uses `sudo`.

## Habits

1. Run `nt guide` to learn NextType. It matches the installed version.
2. Keep obligations in `PROOF.md`. Start with `nt proof init`.
3. Run `nt proof` before you commit. Exit code `0` means every obligation is discharged with evidence.
4. Never change a contract or a claim to make a check pass. Ask the owner.

## Write a contract

1. State the rule in one sentence.
2. Name the inputs and their types.
3. Write a result type that carries the rule.
4. List what the contract does not say.
5. Let a person approve the contract. An agent may repair the body, not weaken the contract.

Example rule: the invoice total equals the exact sum of its lines.

Readable view, for people:

```typescript
type Total<xs> = { t: Int; ok: t == sum(xs) };
function total(xs: Vec<Int>): Total<xs> {
  return { t: sum(xs), ok: refl };
}
```

NTΔ agent form, for agents, under `Γ = {n:N, xs:V Z n}`:

```text
c0 (sig t Z (= t (sum xs)))
f0 (pair (sum xs) refl)
put f0 c0 @b0
ck f0 @a0
```

Both views project the same planned NT0 term. A body such as `sum xs + 1` cannot satisfy the equality.
Currency, tenant, and input validation need their own contracts.

## Ledger entry

```markdown
# PROOF

ntproof: 0

## O1

- claim: The invoice total equals the exact sum of its lines.
- contract: invoice.total
- status: discharged
- evidence: tests/invoice_total.test.ts (property test)
```

`claim`, `status` (`open` or `discharged`), and `evidence` are required. An `open` obligation fails `nt proof`.

## Docs

- Docs: https://nexttype.dev/docs
- Language reference: https://nexttype.dev/docs/reference/
- CLI: https://nexttype.dev/docs/tools/cli/
- Source: https://github.com/Scrumsdotcom/scrums/tree/main/nexttype
