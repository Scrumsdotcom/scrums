#!/bin/sh
# NextType preview installer.
#
#   curl -fsSL https://nexttype.dev/install.sh | sh
#   curl -fsSL https://nexttype.dev/install.sh | sh -s -- --uninstall
#
# Installs the `nt` preview script into ${NT_INSTALL_DIR:-$HOME/.local/bin}.
# It never uses sudo. It checks the download against a published SHA-256.
# NextType is an M0 design preview: `nt` has no compiler.
#
# Licensed under the Apache License 2.0. See LICENSE in the repository.

set -eu

NT_BASE_URL=${NT_BASE_URL:-https://nexttype.dev}
NT_INSTALL_DIR=${NT_INSTALL_DIR:-$HOME/.local/bin}
MARKER="nt - NextType preview command line"

say() { printf 'nt-install: %s\n' "$*"; }
die() { printf 'nt-install: error: %s\n' "$*" >&2; exit 1; }

warning() {
  cat <<'EOF'

  NextType is experimental (M0 design preview). There is no compiler.
  Expect breaking changes, rough edges, and security issues.
  Run it in isolated workspaces, not against production systems or
  sensitive data.

EOF
}

usage() {
  cat <<'EOF'
NextType preview installer

Usage: install.sh [--local] [--uninstall] [--help]

  --local       Install the copy next to this script (a repository checkout).
  --uninstall   Remove nt from the install directory.
  --help        Print this help.

Environment:
  NT_INSTALL_DIR  Install directory (default: $HOME/.local/bin).
  NT_BASE_URL     Download base URL (default: https://nexttype.dev).
EOF
}

mode=install
local_only=0
for arg in "$@"; do
  case "$arg" in
    --uninstall) mode=uninstall ;;
    --local) local_only=1 ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $arg (see --help)" ;;
  esac
done

[ "$(id -u)" = 0 ] && say "note: you are root; nt does not need root. Consider a normal user."

case "$(uname -s)" in
  Linux) os=linux ;;
  Darwin) os=macos ;;
  *BSD) os=bsd ;;
  *) die "unsupported OS: $(uname -s). nt is a POSIX sh script; on Windows use WSL." ;;
esac

target="$NT_INSTALL_DIR/nt"

if [ "$mode" = uninstall ]; then
  if [ ! -e "$target" ]; then
    say "nothing to remove: $target does not exist"
    exit 0
  fi
  grep -q "$MARKER" "$target" 2>/dev/null || die "$target is not the NextType preview script; not removing it"
  rm -f "$target"
  say "removed $target"
  exit 0
fi

warning

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then shasum -a 256 "$1" | awk '{print $1}'
  elif command -v openssl >/dev/null 2>&1; then openssl dgst -sha256 "$1" | awk '{print $NF}'
  else die "no SHA-256 tool found (need sha256sum, shasum, or openssl)"
  fi
}

fetch() {
  if command -v curl >/dev/null 2>&1; then curl -fsSL --proto '=https,file' "$1" -o "$2"
  elif command -v wget >/dev/null 2>&1; then wget -q "$1" -O "$2"
  else return 1
  fi
}

tmp=$(mktemp -d 2>/dev/null || mktemp -d -t nt-install)
trap 'rm -rf "$tmp"' EXIT HUP INT TERM

# A local copy exists when this script runs from a file in a checkout.
here=""
case "$0" in
  */install.sh|install.sh) [ -f "$0" ] && here=$(cd "$(dirname "$0")" && pwd) ;;
esac
local_copy=""
[ -n "$here" ] && [ -f "$here/nt" ] && [ -f "$here/nt.sha256" ] && local_copy="$here"

source=""
if [ "$local_only" = 0 ] && fetch "$NT_BASE_URL/nt" "$tmp/nt" && fetch "$NT_BASE_URL/nt.sha256" "$tmp/nt.sha256"; then
  source="$NT_BASE_URL/nt"
elif [ -n "$local_copy" ]; then
  [ "$local_only" = 0 ] && say "download from $NT_BASE_URL failed; using the local checkout copy"
  cp "$local_copy/nt" "$tmp/nt"
  cp "$local_copy/nt.sha256" "$tmp/nt.sha256"
  source="$local_copy/nt"
elif [ "$local_only" = 1 ]; then
  die "--local needs nt and nt.sha256 next to install.sh (run it from a checkout: sh cli/install.sh --local)"
else
  die "could not download $NT_BASE_URL/nt (need curl or wget and a network connection)"
fi

expected=$(awk 'NR==1{print $1}' "$tmp/nt.sha256")
actual=$(sha256_of "$tmp/nt")
case "$expected" in
  ????????????????????????????????????????????????????????????????) ;;
  *) die "the checksum file is not a SHA-256 value; not installing" ;;
esac
[ "$expected" = "$actual" ] || die "checksum mismatch for $source (expected $expected, got $actual); not installing"
grep -q "$MARKER" "$tmp/nt" || die "the downloaded file is not the NextType preview script; not installing"

mkdir -p "$NT_INSTALL_DIR" 2>/dev/null || die "cannot create $NT_INSTALL_DIR; set NT_INSTALL_DIR to a directory you own"
[ -w "$NT_INSTALL_DIR" ] || die "$NT_INSTALL_DIR is not writable; set NT_INSTALL_DIR to a directory you own (never use sudo)"
cp "$tmp/nt" "$NT_INSTALL_DIR/.nt.tmp.$$"
chmod 755 "$NT_INSTALL_DIR/.nt.tmp.$$"
mv -f "$NT_INSTALL_DIR/.nt.tmp.$$" "$target"

say "installed $("$target" version) to $target ($os)"
say "sha256 $actual verified"

case ":${PATH:-}:" in
  *":$NT_INSTALL_DIR:"*) ;;
  *)
    say "$NT_INSTALL_DIR is not on your PATH. Add this line to your shell profile:"
    # shellcheck disable=SC2016 # $PATH is printed literally on purpose
    printf '\n  export PATH="%s:$PATH"\n\n' "$NT_INSTALL_DIR"
    ;;
esac

say "next: run \"nt guide\", then \"nt proof init\" in an isolated workspace."
