// Generated from /schemas/escalation-policy.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

export interface Severity {
  description: string;
  /** ISO 8601 duration. */
  acknowledgeWithin: string;
  /** ISO 8601 duration or the literal 'best-effort' / 'not-required'. */
  incidentCommanderWithin?: string;
  pageMode: "continuous-until-ack" | "notify" | "none";
}

/** Severity → SLA mapping; on-call role bindings; vendor-neutral channel routing. Singleton runtime configuration document. */
export interface EscalationPolicy {
  apiVersion: "company-as-code/v1";
  kind: "EscalationPolicy";
  version: number;
  severities: {
    "sev-1": Severity;
    "sev-2": Severity;
    "sev-3": Severity;
    "sev-4": Severity;
  };
  roles: Array<{
    role: string;
    description: string;
    fallback?: Array<{
      role: string;
    }>;
  }>;
  defaults?: {
    escalatedAgentThreshold?: string;
    escalatedAgentRecipient?: string;
  };
  channels: Array<{
    kind: "page" | "chat" | "email" | "sms" | "webhook";
    /** Pointer to a /company/integrations/<name> manifest (vendor-neutral). */
    target: string;
    forSeverities: Array<"sev-1" | "sev-2" | "sev-3" | "sev-4">;
  }>;
}
