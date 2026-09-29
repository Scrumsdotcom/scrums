---
title: Foundational paper
description: A one-page concept note on contract-bound autonomous programming. Not peer reviewed.
order: 1
---

# NextType foundational note

[Read the single-page PDF](nexttype-foundation.pdf).
[Open the editable HTML source](nexttype-foundation.html).
[BibTeX references](references.bib) accompany the note.

This is a foundational concept document.
It is not peer reviewed and has not been submitted to arXiv.
No implementation or measured-performance result is claimed.

The HTML uses A4 print styling and local fonts.
The PDF is rendered from that HTML through Chromium.
Verify one page and inspect the result after content changes.
Use the website's existing Playwright installation for rendering:

```bash
node scripts/render-paper.mjs
```

Run the command from `website/` after installing its locked dependencies and a compatible Chromium browser.
Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` when reusing an existing browser binary.
