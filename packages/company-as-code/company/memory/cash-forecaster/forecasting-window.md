---
name: forecasting-window
description: Why the cash-forecaster uses a rolling 13-week window
metadata:
  type: project
  recordedAt: 2026-04-15
---

The cash-forecaster's rolling window is **13 weeks**.

**Why:** treasury practice at the company aligns with the quarter (13 weeks). A 13-week horizon means weekly briefs always cover the full current quarter plus one week of forward visibility into the next.

**How to apply:** when changing the forecast horizon, update the agent's `inputs[].from:` pipeline-state filter and emit a new typed event (`finance.forecast_horizon_changed`). Do not change the horizon without an ADR — downstream goal status thresholds are tuned to it.

Related: [`METRIC-FIN-CLOSE-ON-TIME`](../../metrics/METRIC-FIN-CLOSE-ON-TIME.yaml), [`GOAL-FIN-0001`](../../goals/GOAL-FIN-0001-monthly-close-on-time.yaml).
