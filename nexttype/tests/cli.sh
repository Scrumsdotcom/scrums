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

# 4. Ledger: init, then the template is open and fails
cd "$work"
expect 0 "nt proof init" sh "$nt" proof init
expect 2 "nt proof init refuses to overwrite" sh "$nt" proof init
expect 1 "template ledger fails (open obligation)" sh "$nt" proof
contains "O1: obligation is open" "open obligation reported"
contains "design preview: no compiler; this checks the ledger format only" "preview note printed"

# 5. A good ledger passes
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

# 6. Bad ledgers fail
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

# 7. Installer: download path (file:// base URL), checksum, local copy, uninstall
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
