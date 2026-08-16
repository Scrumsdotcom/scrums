// Generated from /schemas/control.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** A verifiable mechanism that keeps one or more Requirements true, plus the evidence it produces. A Control declares what it implements, how it is checked, how often, and where the proof lands. Controls whose verification is 'automated' point at a runnable check; controls that are only prose are declared 'manual' and carry a review cadence. */
export interface Control {
  apiVersion: "company-as-code/v1";
  kind: "Control";
  /** Canonical, permanent control ID (e.g. CTRL-HITL-EXTERNAL-WRITES). */
  id: string;
  title: string;
  description: string;
  /** The Requirements this control covers. This is the single writer of the requirement-to-control edge; Requirements never list their controls. */
  implements: Array<string>;
  owner: {
    kind: "person" | "team" | "module";
    id: string;
  };
  /** Module paths this control operates on. Empty means company-wide. */
  appliesTo?: Array<string>;
  /** How the control is proven to be working. A control nobody checks is a claim, not a control. */
  verification: {
    /** 'automated' requires a `check` pointing at something a machine runs. */
    method: "automated" | "manual" | "hybrid";
    /** Where verification executes. Vendor-neutral by construction. */
    surface: "schema" | "ci" | "runtime-host" | "scheduled-job" | "human-review" | "external-audit";
    /** Repo-relative pointer to the runnable check (file, function, workflow, or CLI command). Required when method is 'automated'. */
    check?: string;
    frequency: "continuous" | "on-change" | "daily" | "weekly" | "monthly" | "quarterly" | "annually";
    /** What happens when the check fails: block the merge, page the owner, open a task, raise a finding. */
    failureMode?: string;
  };
  /** Where the proof of operation accumulates. An auditor should be able to follow each entry without asking a human where to look. */
  evidence?: Array<{
    source: "audit-log" | "event-ledger" | "ci-run" | "dashboard" | "document" | "external-system";
    reference: string;
    /** How long this evidence is kept, e.g. '7y'. */
    retention?: string;
  }>;
  severity: "low" | "medium" | "high" | "critical";
  /** 'operating' asserts the control has run at least once and produced evidence. */
  status: "designed" | "implemented" | "operating" | "failing" | "retired";
  /** Date the control was last confirmed to be working. Stale dates are a doctor finding, not a silent pass. */
  lastVerified?: string;
  /** Controls this one substitutes for when the primary mechanism is unavailable. */
  compensatingFor?: Array<string>;
  tags?: Array<string>;
}
