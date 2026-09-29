---
title: Examples
description: Three illustrative NextType contracts, each shown as a readable TypeScript view and an NTΔ agent form.
order: 1
---

# Examples

> **Disclaimer.** Illustrative design example. There is no NextType compiler yet; this code has not been compiled, checked or run.

Each example shows one contract in two views:

- The **readable view** is what a human reviews.
- The **NTΔ form** is what an agent writes.

| Example | Rule | Files |
| --- | --- | --- |
| [Invoice](invoice.md) | The total equals the exact sum of its lines. | `invoice.nt` · `sum.ntd` |
| [Vector](vector.md) | The vector contains at least one element. | `head.nt` · `head.ntd` |
| [State](state.md) | A paid state requires a validated confirmation. | `pay.nt` · `step.ntd` |

The file names are illustrative.
The website playground runs one fixed-value fixture check for each example.
Those checks are browser code, not NextType.
They do not execute the NTΔ shown here.
