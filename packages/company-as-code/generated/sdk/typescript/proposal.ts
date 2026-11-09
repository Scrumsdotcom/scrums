// Generated from /schemas/proposal.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** The mutation queue for the conserved core. Changing the spec, a standard, an authority grant, a schema, or an autonomy policy is not an ordinary edit: it goes through a Proposal that states the reason, the evidence, the expected benefit, how the change will be validated, and how it is rolled back. A Proposal reaching a terminal status carries a Ruling with the decider's canonical ID and their words verbatim. */
export interface Proposal {
  apiVersion: "company-as-code/v1alpha1";
  kind: "Proposal";
  /** Canonical, permanent proposal ID. Numbers are never reused, including for withdrawn proposals. */
  id: string;
  title: string;
  /** 'accepted' means ruled on but not yet landed. 'applied' means the conserved files now reflect it. */
  status: "draft" | "open" | "accepted" | "rejected" | "applied" | "withdrawn" | "superseded";
  /** Who wrote the proposal. Agents may author freely; authorship carries no authority. */
  author: {
    kind: "person" | "team" | "agent";
    id: string;
  };
  opened?: string;
  /** The conserved surfaces this proposal mutates. Anything not listed here is out of scope for the ruling. */
  targets: Array<{
    /** Repo-relative path of the conserved file. */
    path: string;
    surface: "spec" | "standard" | "schema" | "policy" | "autonomy-policy" | "escalation-policy" | "adr" | "manifest" | "control" | "requirement" | "ci" | "governance";
    /** One line on what changes in this file. */
    change?: string;
  }>;
  /** The friction that forced this proposal. Not the solution. */
  reason: string;
  /** What makes the reason a fact rather than an opinion: incident IDs, audit references, failing runs, dated observations. */
  evidence?: Array<string>;
  benefit: string;
  /** How anyone will know afterwards whether the change worked. A proposal with no falsifiable validation is a preference. */
  validation: string;
  /** How the change is undone, and what is lost by undoing it. */
  rollback: string;
  /** The recorded exercise of authority. Required for every terminal status. A ruling claimed anywhere other than here is not a ruling. */
  ruling?: {
    decision: "accepted" | "rejected";
    /** Rulings are made by humans. An agent may draft the wording; it may not be the actor. */
    actor: {
      kind: "person";
      id: string;
    };
    date: string;
    /** The decider's own words, quoted, not paraphrased. */
    verbatim: string;
    conditions?: Array<string>;
  };
  /** Repo-relative path of the ADR recording the change, when the change is architectural. */
  adr?: string;
  /** Earlier proposals this one replaces. */
  supersedes?: Array<string>;
  /** The proposal that replaced this one. Required when status is 'superseded'. */
  supersededBy?: string;
  appliedOn?: string;
  tags?: Array<string>;
}
