---
name: cfo-format-preference
description: CFO prefers concise weekly briefs — ≤ 5 bullets, no narrative paragraphs
metadata:
  type: feedback
  recordedAt: 2026-03-21
---

When the cash-forecaster generates the weekly executive brief consumed by the CFO, the brief should be **≤ 5 bullets**. No narrative paragraphs. No restated context.

**Why:** explicit CFO feedback ("I read this in 30 seconds while drinking coffee, don't give me prose"). The brief is consumed before Monday standup; concision is the requirement.

**How to apply:** when generating any output destined for the CFO via the `executive-brief` interface, structure as bullets, lead with the change since last brief, defer detail to the dashboard link. Other primary users may receive longer outputs.

Related: prompt template `/company/prompts/cash-forecast-summary.md`.
