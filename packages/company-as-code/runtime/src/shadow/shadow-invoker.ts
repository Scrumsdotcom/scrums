import { createHash } from "node:crypto";
import type { AgentInvoker } from "../executor/runner.js";
import type { RepoIndex } from "../loader/repo.js";
import type { TypedEvent } from "../types.js";
import { activeTraceContext } from "../observability/tracing.js";
import { SqliteShadowStore } from "./evidence-store.js";

/**
 * Agent invoker that enforces Shadow Mode.
 *
 * It wraps any inner `AgentInvoker`. For an agent NOT enrolled in shadow mode
 * it is a transparent pass-through. For an agent that IS shadowing it:
 *
 *   1. forces `dryRun: true` for that invocation, regardless of the run mode —
 *      a shadow agent never writes, it only projects;
 *   2. records the invocation in the shadow ledger as a row of Reliability
 *      Evidence (agent, correlation, trace, a hash of the projection);
 *   3. strips any `emittedEvent` — a shadow agent observes, it does not change
 *      canonical state.
 *
 * Enrollment is the switch. `cac-host shadow enroll <agent>` turns it on;
 * nothing else about the workflow changes. The agent runs alongside the human
 * operators, perpetually in dry-run, accumulating evidence.
 */
export class ShadowAgentInvoker implements AgentInvoker {
  constructor(
    private readonly inner: AgentInvoker,
    private readonly store: SqliteShadowStore,
  ) {}

  async invoke(args: {
    agent: string;
    correlationId: string;
    dryRun: boolean;
    repo: RepoIndex;
  }): Promise<{ output: unknown; emittedEvent?: TypedEvent }> {
    if (!this.store.isShadowing(args.agent)) {
      return this.inner.invoke(args);
    }

    // Shadow agents are perpetually dry-run.
    const result = await this.inner.invoke({ ...args, dryRun: true });
    const projectionHash = hashProjection(result.output);
    const tc = activeTraceContext();
    this.store.recordRun({
      agent: args.agent,
      correlationId: args.correlationId,
      traceId: tc?.traceId,
      projectionHash,
    });

    // Observe, do not change state — strip any emitted event.
    return {
      output: {
        shadowMode: true,
        agent: args.agent,
        projectionHash,
        projection: result.output,
        note: "Shadow Mode — projection recorded as reliability evidence; no event emitted, no state changed.",
      },
    };
  }
}

function hashProjection(output: unknown): string {
  const canonical = JSON.stringify(output ?? null, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.keys(v)
        .sort()
        .reduce((acc: Record<string, unknown>, k) => {
          acc[k] = (v as Record<string, unknown>)[k];
          return acc;
        }, {});
    }
    return v;
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}
