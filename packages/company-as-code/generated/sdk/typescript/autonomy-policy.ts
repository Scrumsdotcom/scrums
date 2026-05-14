// Generated from /schemas/autonomy-policy.schema.json — do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

export interface Class {
  description: string;
  schedulingAllowed: boolean;
  requiresHumanApproval: boolean;
  requiresEscalationBlock?: boolean;
  permittedActions?: Array<string>;
  forbiddenActions?: Array<string>;
  notes?: string;
}

/** Operational expression of the three autonomy classes. Singleton runtime configuration document. The CLI validates that an agent's declared autonomy is consistent with this policy. */
export interface AutonomyPolicy {
  apiVersion: "company-as-code/v1";
  kind: "AutonomyPolicy";
  version: number;
  classes: {
    autonomous: Class;
    "human-gated": Class;
    escalated: Class;
  };
  promotion?: {
    fromHumanGatedToAutonomous?: {
      requires?: Record<string, string | boolean | number>;
    };
    fromAutonomousToHumanGated?: {
      requires?: Record<string, string | boolean | number>;
      notes?: string;
    };
  };
  preflight?: Array<{
    check: string;
    onFailure: "refuse" | "warn" | "audit-only";
  }>;
}
