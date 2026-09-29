---
title: The nt preview CLI
description: Install the nt preview command, read the guide, and check an obligation ledger. It has no compiler.
order: 1
---

# The nt preview CLI

> **Status: design preview.**
> `nt` has no compiler, type checker, or prover.
> It prints the guide and checks the format of an obligation ledger.
> It never verifies code.

`nt` is a small POSIX shell script.
It has no dependencies other than `sh` and `awk`.
Version `0.0.1-preview` has four commands.

## Safety warning

NextType is experimental.
Expect breaking changes, rough edges, and security issues.
Run it in isolated workspaces, not against production systems or sensitive data.

## Install

For humans:

```sh
curl -fsSL https://nexttype.dev/install.sh | sh
```

For agents:

```sh
npx skills add Scrumsdotcom/nexttype
```

The agent command installs the NextType agent skill. See [Agent skill](#agent-skill).

The installer does these steps:

1. It detects the operating system. Linux, macOS, and BSD are supported. On Windows, use WSL.
2. It downloads `https://nexttype.dev/nt` and `https://nexttype.dev/nt.sha256`.
3. It compares the SHA-256 of the download with the published value. On a mismatch, it stops and installs nothing.
4. It copies `nt` into `${NT_INSTALL_DIR:-$HOME/.local/bin}`. It never uses `sudo`.
5. It tells you how to add that directory to `PATH` when it is not there.

Read the script before you run it.
It is short: [cli/install.sh](https://github.com/Scrumsdotcom/nexttype/blob/main/cli/install.sh).

Other ways to install:

```sh
# Install into another directory
curl -fsSL https://nexttype.dev/install.sh | NT_INSTALL_DIR="$HOME/bin" sh

# Install from a checkout of the repository (no download)
sh cli/install.sh --local

# Remove nt
curl -fsSL https://nexttype.dev/install.sh | sh -s -- --uninstall
```

When you run `cli/install.sh` from a checkout and the download fails, the installer uses the checkout copy.
It checks that copy against `cli/nt.sha256`.
The uninstaller removes only a file that is the NextType preview script.

## Commands

| Command | What it does |
| --- | --- |
| `nt guide` | Prints the guide for agents and people: what NextType is, the two views, how to write a contract, and where the docs are. |
| `nt proof [FILE]` | Checks an obligation ledger. The default file is `PROOF.md`. |
| `nt proof init [FILE]` | Writes a template ledger. It does not overwrite a file. |
| `nt version` | Prints the version, for example `nt 0.0.1-preview`. |
| `nt help` | Prints the usage. |

Exit codes:

| Code | Meaning |
| --- | --- |
| `0` | Success. For `nt proof`: the ledger is well formed and every obligation is discharged with evidence. |
| `1` | The ledger has format errors, missing evidence, or open obligations. |
| `2` | A usage error. Or the file is missing, or `init` found an existing file. |

## The obligation ledger

A NextType contract creates obligations.
The planned compiler will discharge them with checked proofs and tests.
Until it exists, a team can keep each obligation in a Markdown ledger, `PROOF.md`, next to the code.
`nt proof` checks that ledger.

### Format `ntproof/0`

```markdown
# PROOF

ntproof: 0

## O1

- claim: The invoice total equals the exact sum of its lines.
- contract: invoice.total
- status: discharged
- evidence: tests/invoice_total.test.ts (property test, 10 000 cases)

## O2

- claim: head is never called on an empty vector.
- status: open
- evidence: none
```

The rules:

1. The line `ntproof: 0` comes before the first obligation. It names the format version.
2. Each obligation starts with a level-two heading `## ID`.
   An id starts with a letter and uses only letters, digits, `.`, `_`, and `-`.
   Each id occurs once.
3. The obligation has `- key: value` lines. Each key occurs at most once.
4. Required keys:
   - `claim` — the property, in one sentence.
   - `status` — `open` or `discharged`.
   - `evidence` — what supports the claim: a test file, a review record, or a proof artifact. The values `none`, `-`, `todo`, and `tbd` count as missing.
5. Other keys, such as `contract` or `owner`, are allowed. `nt proof` does not check them.
6. Other text is allowed. Code fences are skipped.

### What `nt proof` checks

- The file is a ledger in format `ntproof/0`.
- There is at least one obligation.
- Each obligation has a valid, unique id and the three required keys.
- Each obligation is `discharged` and names evidence.

An `open` obligation fails the check.
This keeps an unresolved obligation visible, like a proof hole in the planned compiler.

### What `nt proof` does not check

`nt proof` checks the ledger format only.
It does not:

- parse or type-check NextType or TypeScript;
- run the tests that the evidence names;
- check that the evidence supports the claim;
- prove anything.

Every run prints `design preview: no compiler; this checks the ledger format only`.
A person or an independent check must still review the evidence.

Example output:

```text
$ nt proof
nt proof: design preview: no compiler; this checks the ledger format only
PROOF.md:14: O2: evidence is missing
PROOF.md:14: O2: obligation is open
2 obligation(s): 1 discharged, 1 open; 2 error(s)
nt proof: FAIL (fix the lines above; design preview: no compiler; this checks the ledger format only)
```

## For agents

When you use NextType:

- Run `nt guide` to learn it.
- Keep obligations in `PROOF.md`.
- Run `nt proof` before you commit.
- Do not change a contract or a claim to make a check pass. Ask the owner.
- Report what is planned and what is measured. Do not claim a proof that does not exist.

## Agent skill

The repository contains an agent skill: [skills/nexttype/SKILL.md](https://github.com/Scrumsdotcom/nexttype/blob/main/skills/nexttype/SKILL.md).
It follows the [Agent Skills](https://agentskills.io) format.
The [`skills`](https://github.com/vercel-labs/skills) CLI installs it for Claude Code, Codex, Cursor, and other agents:

```sh
# Install into the current project for the agents that the CLI detects
npx skills add Scrumsdotcom/nexttype

# Install for one agent only, without prompts
npx skills add Scrumsdotcom/nexttype -a claude-code -y
```

The skill tells the agent to:

- install `nt` only when it is missing;
- run `nt guide`, keep obligations in `PROOF.md` (start with `nt proof init`), and run `nt proof` before a commit;
- write a contract in the readable view and in the NTΔ form;
- report the status honestly: `nt proof` checks the ledger format only.

The CLI clones the repository with git.
While the repository is private, the command needs GitHub access to it: a `gh` login or a `GH_TOKEN` with access.
When the repository is public, it needs no access.

## Relation to the planned toolchain

The language plan describes a future machine protocol with `inspect`, `holes`, `context`, `patch`, `check`, `build`, `run`, and `evidence`.
See [Machine protocol](../reference/protocol.md).
None of those operations exist in `nt` today.
The ledger is a stand-in that keeps obligations explicit until the compiler exists.
The ledger format may change or be removed when the compiler arrives.

## Source

- [cli/nt](https://github.com/Scrumsdotcom/nexttype/blob/main/cli/nt)
- [cli/install.sh](https://github.com/Scrumsdotcom/nexttype/blob/main/cli/install.sh)
- [tests/cli.sh](https://github.com/Scrumsdotcom/nexttype/blob/main/tests/cli.sh)
