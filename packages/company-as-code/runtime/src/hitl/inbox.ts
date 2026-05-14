import Database from "better-sqlite3";
import { ulid } from "ulid";

/**
 * Human-in-the-loop inbox.
 *
 * The spec makes HITL a *declaration* — a workflow declares `hitl: true`, a
 * step declares `kind: human-approval`. This store is the operational surface
 * behind that declaration: a durable queue of dry-run projections waiting for
 * a named human to approve or reject before the live write fires.
 *
 * The queued approval provider enqueues here and blocks; a human resolves the
 * item from the CLI (`cac-host inbox approve/reject`) or the web dashboard
 * (`cac-host inbox serve`). Either way the decision — and the approver's
 * canonical Person ID — is recorded against the item.
 */

export type PendingStatus = "pending" | "approved" | "rejected";

export interface PendingApproval {
  id: string;
  correlationId: string;
  traceId?: string;
  workflow: string;
  module: string;
  stepId: string;
  /** The role declared on the workflow step, e.g. "people:finance-lead". */
  approverRole: string;
  triggerActor: string;
  /** The dry-run projection the human is being asked to sign off. */
  projection: unknown;
  status: PendingStatus;
  createdAt: string;
  resolvedAt?: string;
  /** Canonical Person ID of whoever resolved it. */
  resolvedBy?: string;
  reason?: string;
}

export interface EnqueueInput {
  correlationId: string;
  traceId?: string;
  workflow: string;
  module: string;
  stepId: string;
  approverRole: string;
  triggerActor: string;
  projection: unknown;
}

export interface ResolveInput {
  approved: boolean;
  approver: string;
  reason?: string;
}

export class SqliteHitlInbox {
  private readonly db: Database.Database;

  constructor(filePath: string) {
    this.db = new Database(filePath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS hitl_pending (
        id TEXT PRIMARY KEY,
        correlation_id TEXT NOT NULL,
        trace_id TEXT,
        workflow TEXT NOT NULL,
        module TEXT NOT NULL,
        step_id TEXT NOT NULL,
        approver_role TEXT NOT NULL,
        trigger_actor TEXT NOT NULL,
        projection_json TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        resolved_by TEXT,
        reason TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_hitl_status
        ON hitl_pending(status, created_at);
      CREATE INDEX IF NOT EXISTS idx_hitl_correlation
        ON hitl_pending(correlation_id);
    `);
  }

  /** Add a dry-run projection to the inbox. Returns the new item's ID. */
  enqueue(input: EnqueueInput): PendingApproval {
    const item: PendingApproval = {
      id: `hitl-${ulid().toLowerCase()}`,
      correlationId: input.correlationId,
      traceId: input.traceId,
      workflow: input.workflow,
      module: input.module,
      stepId: input.stepId,
      approverRole: input.approverRole,
      triggerActor: input.triggerActor,
      projection: input.projection,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.db
      .prepare(
        `INSERT INTO hitl_pending
           (id, correlation_id, trace_id, workflow, module, step_id,
            approver_role, trigger_actor, projection_json, status, created_at)
         VALUES (@id, @correlationId, @traceId, @workflow, @module, @stepId,
            @approverRole, @triggerActor, @projectionJson, 'pending', @createdAt)`,
      )
      .run({
        id: item.id,
        correlationId: item.correlationId,
        traceId: item.traceId ?? null,
        workflow: item.workflow,
        module: item.module,
        stepId: item.stepId,
        approverRole: item.approverRole,
        triggerActor: item.triggerActor,
        projectionJson: item.projection === undefined ? null : JSON.stringify(item.projection),
        createdAt: item.createdAt,
      });
    return item;
  }

  get(id: string): PendingApproval | undefined {
    const r = this.db.prepare(`SELECT * FROM hitl_pending WHERE id = ?`).get(id) as any;
    return r ? rowToPending(r) : undefined;
  }

  /** List items, newest first. Pass a status to filter. */
  list(status?: PendingStatus): PendingApproval[] {
    const rows = status
      ? (this.db
          .prepare(`SELECT * FROM hitl_pending WHERE status = ? ORDER BY created_at DESC`)
          .all(status) as any[])
      : (this.db
          .prepare(`SELECT * FROM hitl_pending ORDER BY created_at DESC`)
          .all() as any[]);
    return rows.map(rowToPending);
  }

  /**
   * Resolve a pending item. Idempotent only for the same decision — resolving
   * an already-resolved item throws, because two humans disagreeing on the
   * same projection must surface, not get silently overwritten.
   */
  resolve(id: string, decision: ResolveInput): PendingApproval {
    const current = this.get(id);
    if (!current) throw new Error(`inbox item '${id}' not found`);
    if (current.status !== "pending") {
      throw new Error(
        `inbox item '${id}' is already ${current.status} (by ${current.resolvedBy ?? "unknown"})`,
      );
    }
    this.db
      .prepare(
        `UPDATE hitl_pending
         SET status = @status, resolved_at = @resolvedAt, resolved_by = @resolvedBy, reason = @reason
         WHERE id = @id AND status = 'pending'`,
      )
      .run({
        id,
        status: decision.approved ? "approved" : "rejected",
        resolvedAt: new Date().toISOString(),
        resolvedBy: decision.approver,
        reason: decision.reason ?? null,
      });
    return this.get(id)!;
  }

  /**
   * Block until the item leaves `pending`, polling the table. Used by the
   * queued approval provider so a workflow process can wait on a human who
   * resolves the item from a different process (CLI or dashboard).
   */
  async waitFor(
    id: string,
    opts: { pollMs?: number; timeoutMs?: number } = {},
  ): Promise<PendingApproval> {
    const pollMs = opts.pollMs ?? 1000;
    const timeoutMs = opts.timeoutMs ?? 0; // 0 = wait forever
    const start = Date.now();
    for (;;) {
      const item = this.get(id);
      if (!item) throw new Error(`inbox item '${id}' disappeared while waiting`);
      if (item.status !== "pending") return item;
      if (timeoutMs > 0 && Date.now() - start >= timeoutMs) {
        throw new Error(`timed out waiting for approval of inbox item '${id}'`);
      }
      await sleep(pollMs);
    }
  }

  close(): void {
    this.db.close();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rowToPending(r: any): PendingApproval {
  return {
    id: r.id,
    correlationId: r.correlation_id,
    traceId: r.trace_id ?? undefined,
    workflow: r.workflow,
    module: r.module,
    stepId: r.step_id,
    approverRole: r.approver_role,
    triggerActor: r.trigger_actor,
    projection: r.projection_json ? JSON.parse(r.projection_json) : undefined,
    status: r.status,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at ?? undefined,
    resolvedBy: r.resolved_by ?? undefined,
    reason: r.reason ?? undefined,
  };
}
