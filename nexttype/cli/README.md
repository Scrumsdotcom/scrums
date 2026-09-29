# nt — NextType preview CLI

> **Design preview.** `nt` has no compiler, type checker, or prover.
> It prints the guide and checks the format of an obligation ledger.

`nt` is a POSIX shell script with no dependencies other than `sh` and `awk`.
Full documentation: [docs/tools/cli.md](../docs/tools/cli.md) (published at [nexttype.dev/docs/tools/cli](https://nexttype.dev/docs/tools/cli)).

## Safety warning

NextType is experimental.
Expect breaking changes, rough edges, and security issues.
Run it in isolated workspaces, not against production systems or sensitive data.

## Install

```sh
curl -fsSL https://nexttype.dev/install.sh | sh
```

- Installs into `${NT_INSTALL_DIR:-$HOME/.local/bin}`. Never uses `sudo`.
- Checks the download against `https://nexttype.dev/nt.sha256`. A mismatch installs nothing.
- From a checkout: `sh cli/install.sh --local`.
- Remove: `sh cli/install.sh --uninstall`.

## Commands

| Command | What it does |
| --- | --- |
| `nt guide` | Print the guide for agents and people. |
| `nt proof [FILE]` | Check an obligation ledger (default `PROOF.md`). Exit 1 on errors or open obligations. |
| `nt proof init [FILE]` | Write a template ledger. |
| `nt version` | Print the version (`0.0.1-preview`). |
| `nt help` | Print the usage. |

## Ledger format `ntproof/0`

```markdown
ntproof: 0

## O1

- claim: The invoice total equals the exact sum of its lines.
- status: discharged
- evidence: tests/invoice_total.test.ts (property test)
```

Each obligation needs a unique `## ID` heading and `claim`, `status` (`open` or `discharged`), and `evidence`.
`nt proof` checks the ledger format only.
It does not run tests or prove anything.

## When using NextType

- Run `nt guide` to learn it.
- Keep obligations in `PROOF.md`.
- Run `nt proof` before you commit.

## Files

| File | Purpose |
| --- | --- |
| `nt` | The preview CLI. |
| `nt.sha256` | The SHA-256 of `nt`. The site publishes it as `https://nexttype.dev/nt.sha256`. Update it with `sha256sum nt > nt.sha256` whenever `nt` changes; `tests/cli.sh` fails when it is stale. |
| `install.sh` | The installer. The site publishes it as `https://nexttype.dev/install.sh`. |

Run the tests with `sh tests/cli.sh`.
