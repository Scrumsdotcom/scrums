// Generated from /schemas/person.schema.json — do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Canonical actor identity. Employee, contractor, supplier, AI operator, or agent identity. */
export interface Person {
  apiVersion: "company-as-code/v1";
  kind: "Person";
  /** Permanent internal ID. */
  canonicalId: string;
  displayName: string;
  type: "employee" | "contractor" | "supplier" | "ai-operator" | "agent-identity" | "service-account";
  status: "proposed" | "active" | "leave" | "offboarded" | "terminated" | "soft-deleted";
  primaryEmail?: string;
  organizations?: Array<string>;
  roles?: Array<{
    title: string;
    organization?: string;
    since?: string;
    until?: string;
  }>;
  /** Agents this identity operates on behalf of (for ai-operator and agent-identity types). */
  agentBindings?: Array<string>;
  externalIds?: Array<{
    system: string;
    id: string;
    addedAt?: string;
  }>;
  /** Set when status transitions to soft-deleted. */
  tombstone?: {
    deletedAt?: string;
    reason?: string;
    mergedInto?: string;
  };
}
