# nt — NextType preview CLI

> **Design preview.** `nt` has no compiler, type checker, or prover.
> It prints the guide, estimates token counts, compares the two views of the examples, and checks the format of an obligation ledger.
> Its token counts are estimates, not model tokenizer output.

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
| `nt guide` | Print the guide for agents and people, with a 3-step quickstart. |
| `nt tokens [--quiet] [FILE\|-]` | Estimate the token count of a file or stdin. `--quiet` prints the number only. |
| `nt compare [EXAMPLE]` | Show the readable view and the NTΔ form of `invoice` (default), `vector`, or `state`, each with a token estimate, and the difference. |
| `nt proof [FILE]` | Check an obligation ledger (default `PROOF.md`). Exit 1 on errors or open obligations. |
| `nt proof init [FILE]` | Write a starter ledger with one worked example that is already discharged. |
| `nt quickstart` | Run `nt compare` and the ledger flow in a temporary directory. Alias: `nt demo`. |
| `nt version` | Print the version (`0.0.2-preview`). |
| `nt help` | Print the usage. |

## Quickstart

```sh
nt compare      # one contract in both views, with token estimates
nt proof init   # PROOF.md with one worked example obligation
nt proof        # passes; then add your own open obligation and it fails until you record evidence
```

## Token estimate

`nt tokens` does not run a model tokenizer.
It counts character runs:

- A run of letters costs `ceil(length / 8)` tokens. One leading space joins the word at no cost.
- A run of digits costs `ceil(length / 3)` tokens.
- A run of ASCII punctuation costs `ceil(length / 2)` tokens.
- A run of two or more spaces or tabs costs 1 token.
- A line break, with the blank lines and indentation after it, costs 1 token. Directly after punctuation, it costs 0.
- A run of other bytes (non-ASCII text) costs `ceil(bytes / 2)` tokens.

Against `cl100k_base` and `o200k_base`, the estimate was within about ±15% on the repository's text files over 100 tokens (mean about +6%).
On short snippets, the error can reach about ±25%.
The method is in [docs/tools/cli.md](../docs/tools/cli.md#token-estimate).

## Ledger format `ntproof/0`

```markdown
ntproof: 0

## O1

- claim: The invoice total equals the exact sum of its lines.
- status: discharged
- evidence: tests/invoice_total.test.ts (property test)
- tokens: 1840
```

Each obligation needs a unique `## ID` heading and `claim`, `status` (`open` or `discharged`), and `evidence`.
The `tokens` key is optional: the tokens an agent spent on the change, as a non-negative integer.
When a discharged obligation has `tokens`, `nt proof` prints the tokens per accepted change: the mean over the discharged obligations that have the key.
`nt proof` checks the ledger format only.
It does not run tests or prove anything.

## When using NextType

- Run `nt guide` to learn it.
- Keep obligations in `PROOF.md`.
- Record the tokens that each change cost in the `tokens` key.
- Run `nt proof` before you commit.

## Files

| File | Purpose |
| --- | --- |
| `nt` | The preview CLI. |
| `nt.sha256` | The SHA-256 of `nt`. The site publishes it as `https://nexttype.dev/nt.sha256`. Update it with `sha256sum nt > nt.sha256` whenever `nt` changes; `tests/cli.sh` fails when it is stale. |
| `install.sh` | The installer. The site publishes it as `https://nexttype.dev/install.sh`. |

Run the tests with `sh tests/cli.sh`.
