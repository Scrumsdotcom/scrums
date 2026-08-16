import fs from "node:fs/promises";
import path from "node:path";
import type { ReliabilityEvidence } from "./evidence-store.js";
import type { PromotionEvaluation } from "./evaluate.js";

/**
 * Automated ADR proposal.
 *
 * The spec's pitch: a shadow agent that has accumulated enough Reliability
 * Evidence is promoted to autonomous "via an automated ADR proposal". This
 * module is that automation. It turns the evidence into a `Proposed` ADR
 * draft, following /templates/adr.md, that a human reviews and merges.
 *
 * The proposal is the bridge: the AutonomyPolicy's promotion gate includes
 * `acceptedADR: required` and `manifestUpdate: required`. Both are cleared by
 * reviewing and merging the ADR this generates.
 */

/** Next sequential ADR number, zero-padded to 4, by scanning docs/adr. */
export async function nextAdrNumber(repoRoot: string): Promise<string> {
  const adrDir = path.join(repoRoot, "docs", "adr");
  let max = 0;
  try {
    for (const f of await fs.readdir(adrDir)) {
      const m = f.match(/^(\d{4})-.*\.md$/);
      if (m) max = Math.max(max, Number(m[1]));
    }
  } catch {
    /* no adr dir. Start at 1 */
  }
  return String(max + 1).padStart(4, "0");
}

export interface AdrProposalInput {
  agent: string;
  agentModule?: string;
  evidence: ReliabilityEvidence;
  evaluation: PromotionEvaluation;
  number: string;
  today: string;
}

export interface AdrProposal {
  /** Repo-relative path the ADR would be written to. */
  file: string;
  /** Markdown content. */
  content: string;
}

export function generateAdrProposal(input: AdrProposalInput): AdrProposal {
  const { agent, evidence, evaluation, number, today } = input;
  const slug = agent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const file = `docs/adr/${number}-promote-${slug}-to-autonomous.md`;

  const evidenceRows = [
    ["Enrolled in shadow mode", evidence.enrolledAt],
    ["Days shadowing", String(evidence.shadowDays)],
    ["Total shadow runs", String(evidence.totalRuns)],
    ["Observed runs (human-compared)", String(evidence.observedRuns)],
    ["Runs matching the human action", String(evidence.matchedRuns)],
    ["Agreement rate", `${(evidence.agreementRate * 100).toFixed(1)}%`],
    ["Distinct traces", String(evidence.distinctTraces)],
  ];

  const reqRows = evaluation.requirements.map((r) => {
    if (r.kind === "auto") {
      return `| \`${r.key}\` | ${r.comparator} ${r.threshold} | ${r.actual} | ${r.met ? "✅ met" : "❌ not met"} |`;
    }
    if (r.kind === "manual") {
      return `| \`${r.key}\` | ${JSON.stringify(r.raw)} | n/a | ⏳ manual: ${r.note} |`;
    }
    return `| \`${r.key}\` | ${r.comparator ?? ""} ${r.threshold ?? ""} | n/a | ⚠ ${r.note} |`;
  });

  const content = `# ADR ${number}: Promote ${agent} to autonomous

- **Status:** Proposed
- **Date:** ${today}
- **Deciders:** TBD
- **Tags:** runtime, autonomy, shadow-mode

> Auto-drafted by \`cac-host shadow propose\`. The reliability evidence below is
> generated from the runtime's shadow ledger. Review, fill in the Deciders, and
> merge to clear the AutonomyPolicy's \`acceptedADR\` promotion gate.

## Context

The agent \`${agent}\`${input.agentModule ? ` (module \`${input.agentModule}\`)` : ""} has
been running in **shadow mode**, perpetual \`dryRun: true\` alongside the human
operators doing the real work, since ${evidence.enrolledAt}.

Shadow Mode accumulates Reliability Evidence: every shadow invocation is a
dry-run projection recorded against a trace; when a human performs the real
action, an operator records whether the agent's projection matched. The
accumulated evidence:

| Evidence | Value |
|---|---|
${evidenceRows.map(([k, v]) => `| ${k} | ${v} |`).join("\n")}

The AutonomyPolicy
(\`company/runtime/autonomy-policy.yaml\`,
\`promotion.fromHumanGatedToAutonomous.requires\`) is the promotion bar. Checked
against the evidence above:

| Requirement | Threshold | Actual | Status |
|---|---|---|---|
${reqRows.join("\n")}

**Automated gate: ${evaluation.autoMet ? "MET ✅" : "NOT MET ❌"}**${
    evaluation.unmetAuto.length
      ? `, unmet: ${evaluation.unmetAuto.map((k) => `\`${k}\``).join(", ")}`
      : ""
  }

## Decision

Promote \`${agent}\` from \`human-gated\` to \`autonomous\`. Its shadow-mode
projections have agreed with human operators at a rate that clears the declared
promotion bar; the agent has earned the autonomy classification.

## Consequences

- **Positive**
  - The agent fires without a human-approval step, removing operator toil on a
    path it has demonstrably handled correctly.
  - The promotion is evidence-backed and auditable: the shadow ledger is the
    record, this ADR is the decision.
- **Negative**
  - Autonomous execution carries more risk than gated execution. The agent must
    still respect the \`autonomous\` class's \`forbiddenActions\` (no
    \`write-external\`).
  - If the agent regresses, demotion is the remedy: and demotion is free
    (\`promotion.fromAutonomousToHumanGated\`).
- **Neutral**
  - The shadow ledger remains; the agent can be re-enrolled for re-validation
    after any significant change.

## Alternatives considered

- **Stay human-gated.** Rejected: the evidence clears the bar the company
  itself declared; keeping the gate is now pure toil.
- **Promote without an ADR.** Rejected: \`promotion.fromHumanGatedToAutonomous\`
  requires an accepted ADR. This document is that ADR.

## Implementation notes

- Update the agent's manifest: set \`autonomy: autonomous\` for \`${agent}\`
  (clears the \`manifestUpdate\` promotion gate).
- Run \`cd cli && npm run validate && npm run generate\`, the
  \`agent-catalogue\` and per-agent context bundle will reflect the new class.
- Optionally \`cac-host shadow withdraw ${agent}\` once the promotion lands, or
  leave it enrolled for continued evidence collection.
- Add a row to \`docs/adr/README.md\`.

## Links

- AutonomyPolicy: \`company/runtime/autonomy-policy.yaml\`
- Policy: \`company/policies/hitl-external-writes.md\`
- Shadow Mode: \`docs/shadow-mode.md\`
- The shadow ledger backing this proposal: \`cac-host shadow status ${agent}\`
`;

  return { file, content };
}
