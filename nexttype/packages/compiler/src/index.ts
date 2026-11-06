/** Public API of the NextType reference checker. */
export { DEFAULT_LIMITS, resolveLimits, ResourceError } from "./limits.js";
export type { Limits } from "./limits.js";
export { CheckError, RESULTS } from "./diagnostics.js";
export type { Code, Diagnostic, Result } from "./diagnostics.js";
export { decodeStream, decodeUtf8, parseBody, printFrame, printSexp } from "./syntax.js";
export type { Frame, Sexp } from "./syntax.js";
export { canonical, printTm } from "./core.js";
export type { Tm } from "./core.js";
export { PRELUDE } from "./prelude.js";
export {
  VERSION,
  MANIFEST_FORMAT,
  STREAM_FORMAT,
  RESULT_FORMAT,
  checkStream,
  evaluate,
  formatResult,
  loadManifest,
  manifestFromContext,
} from "./session.js";
export type { Manifest, ManifestJson, StreamResult, ContextResponse } from "./session.js";
