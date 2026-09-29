#!/bin/sh
# Tests for the preview CLI (cli/nt) and installer (cli/install.sh).
# Run from anywhere: sh tests/cli.sh
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
nt="$root/cli/nt"
installer="$root/cli/install.sh"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
pass=0
fail=0

ok() { pass=$((pass + 1)); printf 'ok   %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf 'FAIL %s\n' "$1"; }

# expect CODE NAME CMD...  (runs CMD, compares its exit code)
expect() {
  want=$1; name=$2; shift 2
  set +e; "$@" >"$work/out" 2>&1; got=$?; set -e
  if [ "$got" = "$want" ]; then ok "$name"; else bad "$name (exit $got, want $want)"; sed 's/^/     /' "$work/out"; fi
}

# contains TEXT NAME  (checks the output of the last expect)
contains() {
  if grep -qF -- "$1" "$work/out"; then ok "$2"; else bad "$2 (missing: $1)"; fi
}

# 1. Syntax and lint
expect 0 "sh -n cli/nt" sh -n "$nt"
expect 0 "sh -n cli/install.sh" sh -n "$installer"
if command -v shellcheck >/dev/null 2>&1; then
  expect 0 "shellcheck" shellcheck -s sh "$nt" "$installer" "$0"
else
  printf 'skip shellcheck (not installed)\n'
fi

# 2. Published checksum matches the script
want=$(awk '{print $1}' "$root/cli/nt.sha256")
have=$(sha256sum "$nt" 2>/dev/null | awk '{print $1}' || shasum -a 256 "$nt" | awk '{print $1}')
if [ "$want" = "$have" ]; then ok "cli/nt.sha256 matches cli/nt"; else bad "cli/nt.sha256 is stale (run: cd cli && sha256sum nt > nt.sha256)"; fi

# 3. Commands
expect 0 "nt version" sh "$nt" version
contains "preview" "version says preview"
expect 0 "nt help" sh "$nt" help
expect 0 "nt guide" sh "$nt" guide
contains "No compiler exists" "guide states there is no compiler"
contains "nt proof" "guide lists nt proof"
expect 2 "unknown command" sh "$nt" frobnicate

# 4. Token estimates (stable numbers; the method is documented in cli/nt)
printf 'The quick brown fox jumps over the lazy dog.\n' >"$work/fox.txt"
expect 0 "nt tokens FILE" sh "$nt" tokens "$work/fox.txt"
contains "~10 tokens (estimate;" "tokens on a sentence"
contains "not a model tokenizer" "tokens output says it is an estimate"
# tokens_is WANT NAME TEXT  (pipes TEXT to nt tokens --quiet)
tokens_is() {
  got=$(printf '%s' "$3" | sh "$nt" tokens --quiet)
  if [ "$got" = "$1" ]; then ok "$2"; else bad "$2 (got $got, want $1)"; fi
}
tokens_is 3 "tokens: two words and a line break" 'hello world
'
tokens_is 5 "tokens: digits and punctuation" 'total = 12000;
'
tokens_is 4 "tokens: a long word splits (20 letters = 3, line break = 1)" 'internationalization
'
tokens_is 4 "tokens: blank lines and indentation fold" 'a


   b
'
tokens_is 0 "tokens: empty input" ''
expect 0 "nt tokens - (stdin)" sh -c "printf 'hello world\n' | sh '$nt' tokens -"
contains "~3 tokens" "stdin estimate"
expect 2 "nt tokens missing file" sh "$nt" tokens "$work/nope.txt"
expect 2 "nt tokens unknown option" sh "$nt" tokens --frobnicate

# 5. Compare the two views of the bundled examples
expect 0 "nt compare (default invoice)" sh "$nt" compare
contains "type Total<xs> = { t: Int; ok: t == sum(xs) };" "compare shows the readable view"
contains "c0 (sig t Z (= t (sum xs)))" "compare shows the NTΔ form"
contains "Readable view, for people (TypeScript lineage): ~48 tokens" "readable view estimate"
contains "NTΔ agent form, for agents: ~39 tokens" "NTΔ form estimate"
contains "about 18% fewer tokens for the agent to write" "compare prints the percentage"
contains "design notation example; token counts are estimates" "compare labels the estimate"
contains "no compiler exists" "compare states there is no compiler"
expect 0 "nt compare vector" sh "$nt" compare vector
contains "% fewer tokens" "vector percentage"
expect 0 "nt compare state" sh "$nt" compare state
contains "c3 (I paid)" "state NTΔ form"
expect 2 "nt compare unknown example" sh "$nt" compare nosuch

# 6. Ledger: init, then the first run passes
cd "$work"
expect 0 "nt proof init" sh "$nt" proof init
expect 2 "nt proof init refuses to overwrite" sh "$nt" proof init
expect 0 "first nt proof after init passes" sh "$nt" proof
contains "nt proof: PASS" "first run prints PASS"
contains "tokens per accepted change: ~1840 (over 1 accepted change" "first run prints tokens per accepted change"
contains "Next: add your own obligation (status: open)" "first run prints the next step"
contains "design preview: no compiler; this checks the ledger format only" "preview note printed"
printf '\n## O2\n\n- claim: head is never called on an empty vector.\n- status: open\n- evidence: none\n' >>PROOF.md
expect 1 "an added open obligation fails" sh "$nt" proof
contains "O2: obligation is open" "open obligation reported"
contains "nt proof: FAIL" "open obligation prints FAIL"
expect 0 "nt quickstart" sh "$nt" quickstart
contains "about 18% fewer tokens" "quickstart runs compare"
contains "nt proof: PASS" "quickstart shows the passing ledger"
contains "O2: obligation is open" "quickstart shows the open obligation"
expect 0 "nt demo alias" sh "$nt" demo

# 7. A good ledger passes (no tokens field: format 0 stays compatible)
cat >good.md <<'EOF'
---
title: Proof ledger
---
# PROOF

ntproof: 0

## O1

- claim: The invoice total equals the exact sum of its lines.
- status: discharged
- evidence: tests/invoice_total.test.ts (property test)

## O2.vector-head

- claim: head is never called on an empty vector.
- status: discharged
- evidence: review by the requirement owner, 2026-09-29

```text
## not-an-obligation (inside a code fence)
```
EOF
expect 0 "good ledger passes" sh "$nt" proof good.md
contains "2 obligation(s): 2 discharged, 0 open; 0 error(s)" "good ledger counts"
contains "not a type check or a proof" "pass output disclaims verification"
if grep -qF "tokens per accepted change" "$work/out"; then bad "no tokens line without tokens fields"; else ok "no tokens line without tokens fields"; fi

# 8. Bad ledgers fail
printf 'ntproof: 0\n\n## O1\n- claim: x\n- status: discharged\n' >no-evidence.md
expect 1 "missing evidence fails" sh "$nt" proof no-evidence.md
contains "O1: evidence is missing" "missing evidence reported"
printf 'ntproof: 0\n\n## O1\n- claim: x\n- status: proved\n- evidence: y\n' >bad-status.md
expect 1 "unknown status fails" sh "$nt" proof bad-status.md
printf 'ntproof: 0\n\n## O1\n- claim: x\n- status: discharged\n- evidence: y\n## O1\n- claim: x\n- status: discharged\n- evidence: y\n' >dup.md
expect 1 "duplicate id fails" sh "$nt" proof dup.md
printf '## O1\n- claim: x\n- status: discharged\n- evidence: y\n' >no-marker.md
expect 1 "missing ntproof marker fails" sh "$nt" proof no-marker.md
printf 'ntproof: 0\n' >empty.md
expect 1 "ledger without obligations fails" sh "$nt" proof empty.md
expect 2 "missing file" sh "$nt" proof does-not-exist.md

# 9. Optional tokens field
printf 'ntproof: 0\n\n## A\n- claim: x\n- status: discharged\n- evidence: y\n- tokens: 1000\n\n## B\n- claim: x\n- status: discharged\n- evidence: y\n- tokens: 2001\n\n## C\n- claim: x\n- status: discharged\n- evidence: y\n' >tokens.md
expect 0 "ledger with tokens passes" sh "$nt" proof tokens.md
contains "tokens per accepted change: ~1501 (over 2 accepted changes" "average over discharged obligations with tokens"
printf 'ntproof: 0\n\n## A\n- claim: x\n- status: discharged\n- evidence: y\n- tokens: -5\n' >neg.md
expect 1 "negative tokens fails" sh "$nt" proof neg.md
contains "A: tokens \"-5\" is not a non-negative integer" "negative tokens reported"
printf 'ntproof: 0\n\n## A\n- claim: x\n- status: discharged\n- evidence: y\n- tokens: 12.5\n' >frac.md
expect 1 "non-integer tokens fails" sh "$nt" proof frac.md
printf 'ntproof: 0\n\n## A\n- claim: x\n- status: discharged\n- evidence: y\n- tokens: many\n' >word.md
expect 1 "non-numeric tokens fails" sh "$nt" proof word.md

# 10. Installer: download path (file:// base URL), checksum, local copy, uninstall
mkdir -p site
cp "$root/cli/nt" "$root/cli/nt.sha256" site/
expect 0 "install from base URL" env NT_BASE_URL="file://$work/site" NT_INSTALL_DIR="$work/bin" sh "$installer"
contains "verified" "installer verifies the checksum"
contains "experimental" "installer prints the safety warning"
expect 0 "installed nt runs" "$work/bin/nt" version
printf '\n# tampered\n' >>site/nt
expect 1 "tampered download is rejected" env NT_BASE_URL="file://$work/site" NT_INSTALL_DIR="$work/bin3" sh "$installer"
contains "checksum mismatch" "mismatch reported"
if [ -e "$work/bin3/nt" ]; then bad "tampered file was installed"; else ok "tampered file not installed"; fi
expect 0 "install --local" env NT_INSTALL_DIR="$work/bin2" sh "$installer" --local
expect 0 "uninstall" env NT_INSTALL_DIR="$work/bin2" sh "$installer" --uninstall
if [ -e "$work/bin2/nt" ]; then bad "uninstall left nt"; else ok "uninstall removed nt"; fi
mkdir -p "$work/bin4" && printf '#!/bin/sh\necho other\n' >"$work/bin4/nt"
expect 1 "uninstall refuses a foreign nt" env NT_INSTALL_DIR="$work/bin4" sh "$installer" --uninstall
expect 1 "unknown installer option" sh "$installer" --frobnicate

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" = 0 ]
