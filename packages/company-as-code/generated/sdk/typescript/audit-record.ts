// Generated from /schemas/audit-record.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** One row per orchestration action. Loose schema for what happened in the runtime, debugging, post-hoc reasoning, compliance. */
export interface AuditRecord {
  apiVersion: "company-as-code/v1";
  kind: "AuditRecord";
  id: string;
  actor: {
    kind: "person" | "agent" | "automation" | "system";
    id: string;
  };
  /** Free-text action label. By convention, lowercase + dotted segments. */
  action: string;
  module?: string;
  workflow?: string;
  agent?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  status: "success" | "failure" | "partial" | "dry-run" | "skipped";
  dryRun?: boolean;
  /** Input payload, redacted as required by policy. */
  input?: unknown;
  /** Output payload or summary. */
  output?: unknown;
  error?: {
    code?: string;
    message?: string;
    stack?: string;
  };
  correlationId?: string;
  causationId?: string;
  /** External system the action targeted, by canonical name. */
  targetSystem?: string;
  /** W3C trace ID (32 hex chars) joining this audit row to the typed-event ledger. */
  traceId?: string;
  /** W3C span ID (16 hex chars) of the step span that produced this row. */
  spanId?: string;
}
