// Generated from /schemas/interface.schema.json — do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Declared interface a module exposes to other modules. The contract; the code implements it. */
export interface Interface {
  apiVersion: "company-as-code/v1";
  kind: "Interface";
  name: string;
  /** Module that owns this interface. */
  owner: string;
  description?: string;
  stability: "experimental" | "stable" | "deprecated";
  version?: string;
  transport?: "in-process" | "http" | "rpc" | "event" | "file" | "queue";
  operations: Array<{
    name: string;
    kind: "read" | "write" | "stream" | "rpc";
    /** Schema reference for input payload. */
    input?: string;
    /** Schema reference for output payload. */
    output?: string;
    idempotent?: boolean;
    hitl?: boolean;
    dryRunSupported?: boolean;
  }>;
  /** Modules that have declared a consumes-entry against this interface. */
  consumers?: Array<string>;
  deprecatedAt?: string;
  removeAfter?: string;
}
