---
title: Examples
description: Three illustrative NextType contracts, each shown as a readable TypeScript view and an NTΔ agent form.
order: 1
---

# Examples

> **Checked.** Each example's NTΔ form is a `.ntd` file with a `manifest.json`. CI checks all three with `ntc`.
> The readable views are illustrative: the readable view has no parser yet.

Each example shows one contract in two views:

- The **readable view** is what a human reviews.
- The **NTΔ form** is what an agent writes.

| Example | Rule | Files |
| --- | --- | --- |
| [Invoice](invoice/README.md) | The total equals the exact sum of its lines. | [`sum.ntd`](invoice/sum.ntd) · [`manifest.json`](invoice/manifest.json) |
| [Vector](vector/README.md) | The vector contains at least one element. | [`head.ntd`](vector/head.ntd) · [`manifest.json`](vector/manifest.json) |
| [State](state/README.md) | A paid state requires a validated confirmation. | [`step.ntd`](state/step.ntd) · [`manifest.json`](state/manifest.json) |

The readable-view file names (`invoice.nt`, `head.nt`, `pay.nt`) are illustrative.
The website playground runs one fixed-value fixture check for each example.
Those checks are browser code. `ntc` checks the NTΔ forms for all inputs.
