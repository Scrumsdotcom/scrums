// Generated from /schemas/instance.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** What this repository is, declared once at the root in cac.yaml. Upstream is the Company-as-Code project itself; a fork is a company running on it. The role decides how the framework/instance boundary is checked, and the framework pin records which upstream release a fork is on. */
export interface Instance {
  apiVersion: "company-as-code/v1alpha1";
  kind: "Instance";
  /** Human-readable name of the project or company. */
  name: string;
  /** 'upstream' publishes framework.lock.json from its own tree. 'fork' checks its tree against the lock it received. */
  role: "upstream" | "fork";
  /** Short prefix this instance puts on anything that could collide with upstream, such as hub module names. Upstream uses 'cac'. */
  namespace: string;
  framework: {
    /** The framework release this tree is on. In a fork, it is updated only by 'cac upgrade'. */
    version: string;
    /** Where the framework comes from. Informational. */
    upstream?: string;
  };
  /** Framework files this fork has deliberately changed. A declared deviation is reported but does not fail 'cac boundary check'; an undeclared one does. Upgrades stop at every deviation for a human to resolve. */
  deviations?: Array<{
    /** Repo-relative path of the framework file. */
    path: string;
    /** Why the fork carries this change instead of upstreaming it. */
    reason: string;
    /** Repo-relative path of the fork's decision record, usually under company/decisions/. */
    decision?: string;
  }>;
}
