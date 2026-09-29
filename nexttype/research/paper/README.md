---
title: Foundational paper
description: A one-page concept note on contract-bound autonomous programming by Gerald Neves, Scrums.com. Not peer reviewed.
order: 1
---

# NextType foundational note

**NextType: Contract-Bound Autonomous Programming over a Typed Compiler Graph.**
Gerald Neves, Founder and CEO, Scrums.com ([www.scrums.com](https://www.scrums.com)).
Draft 0.1, 25 September 2026.

[Read the single-page PDF](nexttype-foundation.pdf).
[Open the editable HTML source](nexttype-foundation.html).
[BibTeX references](references.bib) accompany the note.

This is a foundational concept document.
It is not peer reviewed and has not been submitted to arXiv.
No implementation or measured-performance result is claimed.

## Source

This work originates at Scrums.com, the Enterprise AI Platform for software engineering orchestration.
Scrums.com is the originating organisation and a contributor.

## Cite

```bibtex
@misc{neves2026nexttype,
  author = {Gerald Neves},
  title  = {NextType: Contract-Bound Autonomous Programming over a Typed Compiler Graph},
  note   = {Foundational concept note, Draft 0.1. Scrums.com},
  year   = {2026},
  url    = {https://nexttype.dev/research/paper}
}
```

## Render the PDF

The HTML is the source.
It uses A4 print styling (12 mm by 15 mm margins) and local fonts.
The PDF is a headless Chromium print of that HTML:

```bash
chrome --headless=new --no-pdf-header-footer \
  --print-to-pdf=nexttype-foundation.pdf \
  "file://$PWD/nexttype-foundation.html"
```

Use any recent Chromium or Chrome binary as `chrome`.
After a content change:

1. Check that the PDF has exactly one A4 page.
2. Look at the rendered page, especially the author block and the footer note.
