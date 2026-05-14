// Generated from /schemas/metric.schema.json — do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Typed observable quantity with declared ownership, lineage, freshness, formula, and thresholds. */
export interface Metric {
  apiVersion: "company-as-code/v1";
  kind: "Metric";
  id: string;
  name: string;
  description?: string;
  owner: {
    module: string;
    person?: string;
  };
  type: "counter" | "gauge" | "histogram" | "ratio" | "percentage" | "currency" | "duration" | "boolean";
  /** Human-readable unit, e.g. 'USD', 'requests/sec', 'days'. */
  unit: string;
  /** Plain-language or expression describing how the metric is computed. */
  formula?: string;
  /** Upstream sources the metric is derived from. */
  lineage?: Array<{
    source: string;
    field?: string;
    transformation?: string;
  }>;
  freshness: {
    /** ISO 8601 duration. */
    expectedLag: string;
    /** ISO 8601 duration. Past this, alert. */
    maxLag?: string;
    lastObservedAt?: string;
  };
  thresholds?: Array<{
    level: "info" | "warning" | "critical";
    comparator: "gte" | "lte" | "gt" | "lt" | "eq" | "neq";
    value: number | string;
  }>;
  dashboards?: Array<string>;
  alerts?: Array<string>;
  history?: {
    /** ISO 8601 duration. */
    retention?: string;
    grain?: "minute" | "hour" | "day" | "week" | "month";
  };
}
