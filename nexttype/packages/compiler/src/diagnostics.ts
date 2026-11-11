/**
 * Diagnostic codes and results. The codes are part of the stable surface:
 * a code keeps its meaning across 0.x minor releases and is never reused.
 * See docs/reference/diagnostics.md for the catalogue.
 */
export type Result = "proved" | "refuted" | "unknown" | "unsupported" | "invalid";

export const RESULTS: readonly Result[] = ["proved", "refuted", "unknown", "unsupported", "invalid"];

export type Code =
  // Decode
  | "SYN" // malformed frame or term
  | "LIM" // an input limit was exceeded while decoding
  | "ALIAS" // unknown alias or alias of the wrong class
  | "SLOT" // undefined, redefined, or misused slot
  // Scope and elaboration
  | "SCOPE" // unbound or reserved name
  | "TYPE" // type mismatch or ill-formed type
  | "IMPL" // unresolved implicit argument
  | "UNIV" // universe level violation
  | "CASE" // non-exhaustive, redundant, or malformed case
  // Obligations
  | "TY" // the typing obligation of a fragment
  | "EQ" // an equality obligation that does not hold definitionally
  // Patch and policy
  | "CONFLICT" // the patch base is stale
  | "POLICY" // the stream conflicts with the approval envelope
  // Resources and support
  | "RES" // evaluation step or integer-size bound exhausted
  | "CMD" // a command that this implementation does not support
  | "MANIFEST" // the manifest is malformed
  | "KERNEL"; // the kernel rejected an elaborated term (implementation fault)

export interface Diagnostic {
  result: Result;
  code: Code;
  /** Obligation slot, such as "o0", when the diagnostic concerns one. */
  obligation?: string;
  /** Fragment slot, such as "f0", when the diagnostic concerns one. */
  fragment?: string;
  line?: number;
  col?: number;
  message: string;
  /** Present on a proved obligation: the digest that binds the evidence. */
  evidence?: string;
  /** Present on refuted or unknown EQ: the two sides in normal form. */
  sides?: [string, string];
}

/** An error raised during decoding, scoping, or elaboration. */
export class CheckError extends Error {
  constructor(
    readonly code: Code,
    message: string,
    readonly line?: number,
    readonly col?: number,
    readonly result: Result = "invalid",
    readonly sides?: [string, string],
  ) {
    super(message);
    this.name = "CheckError";
  }
}
