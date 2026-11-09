#!/usr/bin/env bash
# Brings a Company-as-Code release into packages/company-as-code/, with its history.
#
# Usage: .github/scripts/company-as-code-sync.sh vX.Y.Z
#
# Run it from the repository root, on a clean sync/cac-vX.Y.Z branch from main.
# The script:
#   1. Fetches the upstream release tag (no other upstream tags).
#   2. Rewrites every upstream commit up to the tag so its paths sit under
#      packages/company-as-code/. Issue and pull request references such as
#      (#12) become gez-scrumsdotcom/Company-as-Code#12, so they link to the
#      upstream repository.
#   3. Merges the rewritten history into the current branch.
#   4. Checks that packages/company-as-code/ is identical to the upstream tree
#      at the tag.
#
# The rewrite is deterministic. A later sync rewrites the same earlier commits
# to the same commit IDs, so the merge adds only the new upstream commits.
set -euo pipefail

TAG="${1:?usage: $0 vX.Y.Z}"
UPSTREAM="https://github.com/gez-scrumsdotcom/Company-as-Code"
PREFIX="packages/company-as-code"
REWRITE_BRANCH="company-as-code-rewrite-$TAG"

if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "error: '$TAG' is not a release tag of the form vX.Y.Z" >&2
  exit 1
fi
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "error: the working tree has changes. Commit or stash them first." >&2
  exit 1
fi

git fetch --no-tags "$UPSTREAM.git" "refs/tags/$TAG"
UPSTREAM_COMMIT="$(git rev-parse "FETCH_HEAD^{commit}")"
UPSTREAM_TREE="$(git rev-parse "FETCH_HEAD^{tree}")"

MSG_FILTER="$(mktemp)"
trap 'rm -f "$MSG_FILTER"' EXIT
cat >"$MSG_FILTER" <<'PERL'
undef $/;
my $m = <STDIN>;
# Point bare issue and pull request references at the upstream repository.
$m =~ s{(^|[^A-Za-z0-9_/&])#(\d+)\b}{$1gez-scrumsdotcom/Company-as-Code#$2}gm;
# Drop tool session links and tool co-author trailers.
$m =~ s{^https://claude\.ai/code/session_\S*[ \t]*(\n\n?|\z)}{}gm;
$m =~ s{^Co-authored-by: Claude <noreply\@anthropic\.com>[ \t]*(\n\n?|\z)}{}gmi;
$m =~ s{\n+-{3,}\s*\z}{\n};
$m =~ s{\n+\z}{\n};
print $m;
PERL

git branch -f "$REWRITE_BRANCH" "$UPSTREAM_COMMIT"
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f \
  --index-filter "git read-tree --empty && git read-tree --prefix=$PREFIX/ \"\$GIT_COMMIT\"" \
  --msg-filter "perl $MSG_FILTER" \
  -- "$REWRITE_BRANCH"
git update-ref -d "refs/original/refs/heads/$REWRITE_BRANCH"

REWRITTEN_TREE="$(git rev-parse "$REWRITE_BRANCH:$PREFIX")"
if [ "$REWRITTEN_TREE" != "$UPSTREAM_TREE" ]; then
  echo "error: the rewritten tree $REWRITTEN_TREE does not match upstream $UPSTREAM_TREE" >&2
  exit 1
fi

git merge --no-ff --allow-unrelated-histories --no-edit \
  -m "Import Company-as-Code $TAG with its history into $PREFIX/" \
  -m "Upstream: $UPSTREAM, tag $TAG, commit $UPSTREAM_COMMIT. The upstream commits keep their authors and dates. Each path is rewritten under $PREFIX/, and issue references in the messages point at the upstream repository." \
  "$REWRITE_BRANCH"
git branch -D "$REWRITE_BRANCH"

if [ "$(git rev-parse "HEAD:$PREFIX")" != "$UPSTREAM_TREE" ]; then
  echo "error: $PREFIX/ does not match the upstream tree at $TAG" >&2
  exit 1
fi
echo "$PREFIX/ matches $TAG (commit $UPSTREAM_COMMIT, tree $UPSTREAM_TREE)."
