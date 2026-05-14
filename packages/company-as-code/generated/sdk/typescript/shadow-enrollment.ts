// Generated from /schemas/shadow-enrollment.schema.json — do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** An agent's enrollment in Shadow Mode plus the Reliability Evidence accumulated against it. A shadow agent runs in perpetual dry-run alongside human operators; every invocation is a row of evidence. When the evidence clears the AutonomyPolicy's promotion bar, an ADR proposal promotes the agent to autonomous. */
export interface ShadowEnrollment {
  apiVersion: "company-as-code/v1";
  kind: "ShadowEnrollment";
  /** Canonical agent name enrolled in shadow mode. */
  agent: string;
  enrolledAt: string;
  /** shadow = actively shadowing; promoted = an accepted ADR moved it to autonomous; withdrawn = removed from shadow mode. */
  status: "shadow" | "promoted" | "withdrawn";
  statusChangedAt?: string;
  /** Aggregated Reliability Evidence over the shadow ledger. */
  evidence: {
    /** Whole days since enrollment. */
    shadowDays: number;
    /** Shadow invocations recorded. */
    totalRuns: number;
    /** Runs that have a human-comparison observation. */
    observedRuns: number;
    /** Observed runs where the projection matched the human action. */
    matchedRuns: number;
    /** matchedRuns / observedRuns, or 0 when nothing has been observed. */
    agreementRate: number;
    /** Distinct W3C trace IDs the shadow runs span. */
    distinctTraces: number;
  };
  /** Evaluation of the AutonomyPolicy promotion requirements against the evidence. */
  promotionGate?: {
    /** Every automatically-checkable requirement is met. */
    autoMet?: boolean;
    unmetAuto?: Array<string>;
    manualGates?: Array<string>;
  };
}
