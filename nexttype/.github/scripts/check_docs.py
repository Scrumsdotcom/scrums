#!/usr/bin/env python3
"""Check the content contract shared with the nexttype.dev renderer.

- Every page under docs/, examples/, benchmarks/ and research/ has YAML
  frontmatter with title and description (the site renders all four).
- Frontmatter values are valid YAML scalars: an unquoted value must not
  contain ": " or " #", or start with a YAML indicator character; a quoted
  value must close its quote.
- Every page id in docs/nav.json exists as docs/<id>.md.
- Every relative link in those pages resolves to a file.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs"
AREAS = [ROOT / a for a in ("docs", "examples", "benchmarks", "research")]
LINK = re.compile(r"!?\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
FENCE = re.compile(r"^(```|~~~)")
errors = []


INDICATORS = set("[]{}>|*&!%@`#,?:-'\"")


def scalar_error(value):
    """Return why a one-line YAML scalar is invalid, or None."""
    if not value:
        return None
    if value[0] in "\"'":
        quote = value[0]
        if len(value) < 2 or value[-1] != quote:
            return "quoted value is not closed"
        inner = value[1:-1]
        if quote == "'" and "'" in inner.replace("''", ""):
            return "single quote inside a single-quoted value must be doubled"
        if quote == '"' and re.search(r'(?<!\\)"', inner):
            return "double quote inside a double-quoted value must be escaped"
        return None
    if value[0] in INDICATORS and not (value[0] == "-" and value[1:2] not in ("", " ")):
        return f"unquoted value starts with {value[0]!r}; quote it"
    if ": " in value or value.endswith(":"):
        return "unquoted value contains ': '; quote it"
    if " #" in value:
        return "unquoted value contains ' #' (a YAML comment); quote it"
    return None


def unquote(value):
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def frontmatter(text, rel):
    if not text.startswith("---\n"):
        return None
    end = text.find("\n---\n", 4)
    if end == -1:
        return None
    fields = {}
    for number, line in enumerate(text[4:end].splitlines(), 2):
        key, sep, value = line.partition(":")
        if sep:
            value = value.strip()
            problem = scalar_error(value)
            if problem:
                errors.append(f"{rel}:{number}: frontmatter {key.strip()}: {problem}")
            fields[key.strip()] = unquote(value)
    return fields


for page in sorted(p for area in AREAS if area.exists() for p in area.rglob("*.md")):
    rel = page.relative_to(ROOT)
    text = page.read_text(encoding="utf-8")
    fields = frontmatter(text, rel)
    if fields is None:
        errors.append(f"{rel}: missing YAML frontmatter")
    else:
        for key in ("title", "description"):
            if not fields.get(key):
                errors.append(f"{rel}: frontmatter has no {key}")
    in_code = False
    for number, line in enumerate(text.splitlines(), 1):
        if FENCE.match(line.strip()):
            in_code = not in_code
            continue
        if in_code:
            continue
        for target in LINK.findall(re.sub(r"`[^`]*`", "", line)):
            if re.match(r"^[a-z][a-z0-9+.-]*:", target) or target.startswith("#"):
                continue
            path = target.split("#", 1)[0]
            if not (page.parent / path).resolve().exists():
                errors.append(f"{rel}:{number}: broken link {target}")

nav = json.loads((DOCS / "nav.json").read_text(encoding="utf-8"))
for section in nav["sections"]:
    if not section.get("title"):
        errors.append("nav.json: section without title")
    for page_id in section.get("pages", []):
        if not (DOCS / f"{page_id}.md").is_file():
            errors.append(f"nav.json: page id {page_id} has no docs/{page_id}.md")

for error in errors:
    print(error)
print(f"docs check: {len(errors)} error(s)")
sys.exit(1 if errors else 0)
