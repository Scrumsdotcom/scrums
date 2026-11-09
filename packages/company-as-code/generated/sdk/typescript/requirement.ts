// Generated from /schemas/requirement.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** An external obligation the company is held to: a certification clause, a regulation article, a contractual commitment, or an internally-imposed rule. Requirements state WHAT must be true. Controls state HOW it is made true and verified. A Requirement never names its own controls; the coverage direction is one-way so there is exactly one writer per edge. */
export interface Requirement {
  apiVersion: "company-as-code/v1alpha1";
  kind: "Requirement";
  /** Canonical, permanent requirement ID (e.g. REQ-ISO27001-A-8-5). */
  id: string;
  /** The obligation's source catalogue. 'contract' covers customer or supplier commitments; 'internal' covers rules the company imposes on itself. */
  framework: "iso27001" | "iso27701" | "soc2" | "gdpr" | "hipaa" | "pci-dss" | "cis" | "nist-csf" | "nist-800-53" | "cobit" | "eu-ai-act" | "contract" | "internal" | "other";
  /** The identifier this obligation carries inside its own catalogue (e.g. 'A.8.5', 'CC6.1', 'Art. 32(1)(b)'). Verbatim, so an auditor can find it. */
  clause: string;
  title: string;
  /** What the obligation actually requires, in the company's own words. Not a copy of copyrighted standard text. */
  statement: string;
  /** The accountable party. Accountability for an obligation always rests with a human or a team, never with an agent. */
  owner: {
    kind: "person" | "team" | "module";
    id: string;
  };
  /** Module paths in scope for this obligation. An empty list means company-wide. */
  appliesTo?: Array<string>;
  /** 'out-of-scope' requires a scopeRationale; an unexplained exclusion is an audit finding waiting to happen. */
  status: "in-scope" | "planned" | "out-of-scope" | "retired";
  /** Why this obligation is out of scope or merely planned. Required when status is 'out-of-scope'. */
  scopeRationale?: string;
  /** Consequence if the obligation is unmet. Drives the coverage gate in the generated control matrix. */
  severity?: "low" | "medium" | "high" | "critical";
  /** Identifiers this obligation carries in external GRC tooling. Evolutionary mappings; never primary keys. */
  externalIds?: Array<{
    system: string;
    id: string;
  }>;
  /** Repo-relative paths or URLs supporting the obligation (policy documents, the published standard, the signed contract). */
  references?: Array<string>;
  tags?: Array<string>;
}
