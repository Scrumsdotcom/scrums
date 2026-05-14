// Generated from /schemas/goal.schema.json — do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Measurable objective: KPI, OKR, SLA, or metric target. Goals are owned and time-bounded. */
export interface Goal {
  apiVersion: "company-as-code/v1";
  kind: "Goal";
  id: string;
  title: string;
  description?: string;
  type: "kpi" | "okr" | "sla" | "target" | "guardrail";
  owner: {
    kind: "person" | "team" | "agent" | "module";
    id: string;
  };
  /** Metric ID this goal targets. */
  metric: string;
  target: {
    value: number | string;
    unit?: string;
    comparator: "gte" | "lte" | "gt" | "lt" | "eq" | "neq" | "between";
    lower?: number | string;
    upper?: number | string;
  };
  horizon?: {
    period?: "weekly" | "monthly" | "quarterly" | "yearly" | "rolling";
    start?: string;
    end?: string;
  };
  initiatives?: Array<string>;
  status?: "draft" | "active" | "on-track" | "at-risk" | "off-track" | "achieved" | "missed" | "archived";
  lastReviewedAt?: string;
}
