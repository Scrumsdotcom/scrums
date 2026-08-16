import Database from "better-sqlite3";
import { ulid } from "ulid";

/**
 * Shadow Mode: the reliability-evidence store.
 *
 * A new agent enrolls in shadow mode and runs in perpetual `dryRun: true`
 * alongside the human operators doing the real work. Every shadow invocation
 * is recorded here as a row of evidence: what the agent projected, under which
 * trace. When a human does the real action, an operator records whether the
 * agent's projection *matched*. That observation is the signal.
 *
 * Over weeks the rows accumulate into Reliability Evidence: how long the agent
 * has shadowed, how many runs, how often its projection agreed with the human.
 * When that evidence clears the AutonomyPolicy's promotion bar, `cac-host
 * shadow propose` drafts the ADR that promotes the agent to autonomous.
 *
 * The audit log and event ledger are untouched: shadow runs land there as
 * ordinary dry-run audit rows. This store is the *aggregation* layer on top.
 */

export type EnrollmentStatus = "shadow" | "promoted" | "withdrawn";

export interface ShadowEnrollment {
  agent: string;
  enrolledAt: string;
  status: EnrollmentStatus;
  statusChangedAt: string;
}

export interface ShadowRun {
  id: string;
  agent: string;
  correlationId?: string;
  traceId?: string;
  recordedAt: string;
  /** Hash of the agent's projected output. The "what it would have done". */
  projectionHash?: string;
  /** True once a human-comparison observation has been recorded. */
  observed: boolean;
  /** Whether the agent's projection matched the human's actual action. */
  matchedHuman?: boolean;
}

export interface ReliabilityEvidence {
  agent: string;
  enrolledAt: string;
  status: EnrollmentStatus;
  /** Whole days since enrollment. */
  shadowDays: number;
  totalRuns: number;
  /** Runs that have a human-comparison observation. */
  observedRuns: number;
  /** Observed runs where the projection matched the human action. */
  matchedRuns: number;
  /** matchedRuns / observedRuns, or 0 when nothing has been observed. */
  agreementRate: number;
  distinctTraces: number;
}

export class SqliteShadowStore {
  private readonly db: Database.Database;

  constructor(filePath: string) {
    this.db = new Database(filePath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS shadow_enrollments (
        agent TEXT PRIMARY KEY,
        enrolled_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'shadow',
        status_changed_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shadow_runs (
        id TEXT PRIMARY KEY,
        agent TEXT NOT NULL,
        correlation_id TEXT,
        trace_id TEXT,
        recorded_at TEXT NOT NULL,
        projection_hash TEXT,
        observed INTEGER NOT NULL DEFAULT 0,
        matched_human INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_shadow_runs_agent
        ON shadow_runs(agent, recorded_at);
    `);
  }

  // --- enrollment ----------------------------------------------------------

  enroll(agent: string): ShadowEnrollment {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO shadow_enrollments (agent, enrolled_at, status, status_changed_at)
         VALUES (@agent, @now, 'shadow', @now)
         ON CONFLICT(agent) DO UPDATE SET
           status = 'shadow',
           status_changed_at = @now`,
      )
      .run({ agent, now });
    return this.getEnrollment(agent)!;
  }

  setStatus(agent: string, status: EnrollmentStatus): ShadowEnrollment {
    const existing = this.getEnrollment(agent);
    if (!existing) throw new Error(`agent '${agent}' is not enrolled in shadow mode`);
    this.db
      .prepare(
        `UPDATE shadow_enrollments
         SET status = @status, status_changed_at = @now WHERE agent = @agent`,
      )
      .run({ agent, status, now: new Date().toISOString() });
    return this.getEnrollment(agent)!;
  }

  getEnrollment(agent: string): ShadowEnrollment | undefined {
    const r = this.db
      .prepare(`SELECT * FROM shadow_enrollments WHERE agent = ?`)
      .get(agent) as any;
    return r
      ? {
          agent: r.agent,
          enrolledAt: r.enrolled_at,
          status: r.status,
          statusChangedAt: r.status_changed_at,
        }
      : undefined;
  }

  /** Is this agent currently shadowing (status === 'shadow')? */
  isShadowing(agent: string): boolean {
    return this.getEnrollment(agent)?.status === "shadow";
  }

  listEnrollments(): ShadowEnrollment[] {
    const rows = this.db
      .prepare(`SELECT * FROM shadow_enrollments ORDER BY enrolled_at ASC`)
      .all() as any[];
    return rows.map((r) => ({
      agent: r.agent,
      enrolledAt: r.enrolled_at,
      status: r.status,
      statusChangedAt: r.status_changed_at,
    }));
  }

  // --- runs ----------------------------------------------------------------

  /** Record a shadow invocation (a dry-run the agent performed). */
  recordRun(input: {
    agent: string;
    correlationId?: string;
    traceId?: string;
    projectionHash?: string;
    recordedAt?: string;
  }): ShadowRun {
    const run: ShadowRun = {
      id: `srun-${ulid().toLowerCase()}`,
      agent: input.agent,
      correlationId: input.correlationId,
      traceId: input.traceId,
      recordedAt: input.recordedAt ?? new Date().toISOString(),
      projectionHash: input.projectionHash,
      observed: false,
    };
    this.db
      .prepare(
        `INSERT INTO shadow_runs
           (id, agent, correlation_id, trace_id, recorded_at, projection_hash, observed, matched_human)
         VALUES (@id, @agent, @correlationId, @traceId, @recordedAt, @projectionHash, 0, NULL)`,
      )
      .run({
        id: run.id,
        agent: run.agent,
        correlationId: run.correlationId ?? null,
        traceId: run.traceId ?? null,
        recordedAt: run.recordedAt,
        projectionHash: run.projectionHash ?? null,
      });
    return run;
  }

  /**
   * Record a human-comparison observation against a shadow run: did the
   * agent's projection match what the human actually did? With no runId, the
   * most recent un-observed run for the agent is used.
   */
  observe(agent: string, matchedHuman: boolean, runId?: string): ShadowRun {
    let target = runId;
    if (!target) {
      const r = this.db
        .prepare(
          `SELECT id FROM shadow_runs
           WHERE agent = ? AND observed = 0 ORDER BY recorded_at DESC LIMIT 1`,
        )
        .get(agent) as any;
      if (!r) throw new Error(`no un-observed shadow run for agent '${agent}'`);
      target = r.id;
    }
    const info = this.db
      .prepare(
        `UPDATE shadow_runs
         SET observed = 1, matched_human = @matched
         WHERE id = @id AND agent = @agent`,
      )
      .run({ id: target, agent, matched: matchedHuman ? 1 : 0 });
    if (info.changes === 0) {
      throw new Error(`shadow run '${target}' not found for agent '${agent}'`);
    }
    return this.getRun(target!)!;
  }

  getRun(id: string): ShadowRun | undefined {
    const r = this.db.prepare(`SELECT * FROM shadow_runs WHERE id = ?`).get(id) as any;
    return r ? rowToRun(r) : undefined;
  }

  listRuns(agent: string): ShadowRun[] {
    const rows = this.db
      .prepare(`SELECT * FROM shadow_runs WHERE agent = ? ORDER BY recorded_at ASC`)
      .all(agent) as any[];
    return rows.map(rowToRun);
  }

  // --- evidence aggregate --------------------------------------------------

  /** Aggregate the recorded runs into Reliability Evidence for one agent. */
  evidence(agent: string, now: Date = new Date()): ReliabilityEvidence {
    const enrollment = this.getEnrollment(agent);
    if (!enrollment) throw new Error(`agent '${agent}' is not enrolled in shadow mode`);
    const agg = this.db
      .prepare(
        `SELECT
           COUNT(*) total,
           SUM(observed) observed,
           SUM(CASE WHEN matched_human = 1 THEN 1 ELSE 0 END) matched,
           COUNT(DISTINCT trace_id) traces
         FROM shadow_runs WHERE agent = ?`,
      )
      .get(agent) as any;
    const totalRuns = agg.total ?? 0;
    const observedRuns = agg.observed ?? 0;
    const matchedRuns = agg.matched ?? 0;
    const distinctTraces = agg.traces ?? 0;
    const enrolledMs = now.getTime() - new Date(enrollment.enrolledAt).getTime();
    const shadowDays = Math.max(0, Math.floor(enrolledMs / 86_400_000));
    return {
      agent,
      enrolledAt: enrollment.enrolledAt,
      status: enrollment.status,
      shadowDays,
      totalRuns,
      observedRuns,
      matchedRuns,
      agreementRate: observedRuns > 0 ? matchedRuns / observedRuns : 0,
      distinctTraces,
    };
  }

  close(): void {
    this.db.close();
  }
}

function rowToRun(r: any): ShadowRun {
  return {
    id: r.id,
    agent: r.agent,
    correlationId: r.correlation_id ?? undefined,
    traceId: r.trace_id ?? undefined,
    recordedAt: r.recorded_at,
    projectionHash: r.projection_hash ?? undefined,
    observed: r.observed === 1,
    matchedHuman: r.matched_human === null || r.matched_human === undefined
      ? undefined
      : r.matched_human === 1,
  };
}
