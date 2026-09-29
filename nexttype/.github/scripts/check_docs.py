#!/usr/bin/env python3
"""Check the docs contract shared with the nexttype.dev renderer.

- Every docs/**/*.md page has YAML frontmatter with title and description.
- Every page id in docs/nav.json exists as docs/<id>.md.
- Every relative link in a docs page resolves to a file.
"""
import json
import re
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parents[2] / "docs"
LINK = re.compile(r"!?\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
FENCE = re.compile(r"^(```|~~~)")
errors = []


def frontmatter(text):
    if not text.startswith("---\n"):
        return None
    end = text.find("\n---\n", 4)
    if end == -1:
        return None
    fields = {}
    for line in text[4:end].splitlines():
        key, sep, value = line.partition(":")
        if sep:
            fields[key.strip()] = value.strip()
    return fields


for page in sorted(DOCS.rglob("*.md")):
    rel = page.relative_to(DOCS)
    text = page.read_text(encoding="utf-8")
    fields = frontmatter(text)
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
