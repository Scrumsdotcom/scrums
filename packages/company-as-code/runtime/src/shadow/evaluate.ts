import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import type { ReliabilityEvidence } from "./evidence-store.js";

/**
 * Promotion-gate evaluation.
 *
 * Shadow Mode does not invent its own promotion bar — it reads the one the
 * company already declared, in the AutonomyPolicy's
 * `promotion.fromHumanGatedToAutonomous.requires` block. This module loads that
 * block and checks the accumulated Reliability Evidence against it.
 *
 * The `requires` block is intentionally free-form (string | number | boolean
 * values). The convention this evaluator understands:
 *
 *   - a comparison-expression value (">= 3", "> 0.95", …) is an AUTO check —
 *     the key names the evidence metric, the expression is the threshold.
 *   - a value of `required` / `true` is a MANUAL gate — something a human
 *     must do (accept an ADR, update a manifest). `cac-host shadow propose`
 *     is the step that produces the ADR those gates point at.
 *   - any other key is reported as UNKNOWN and does not block.
 */

/** Evidence metric keys an AutonomyPolicy requirement can name. */
const METRIC_ALIASES: Record<string, keyof ReliabilityEvidence> = {
  successfulsyncverificationinvocations: "matchedRuns",
  shadowmodedays: "shadowDays",
  shadowdays: "shadowDays",
  shadowagreementrate: "agreementRate",
  agreementrate: "agreementRate",
  shadowruns: "totalRuns",
  totalruns: "totalRuns",
  shadowobservedruns: "observedRuns",
  observedruns: "observedRuns",
  matchedruns: "matchedRuns",
};

export interface RequirementResult {
  key: string;
  raw: string | number | boolean;
  kind: "auto" | "manual" | "unknown";
  metric?: keyof ReliabilityEvidence;
  comparator?: string;
  threshold?: number;
  actual?: number;
  met: boolean;
  note?: string;
}

export interface PromotionEvaluation {
  requirements: RequirementResult[];
  /** Every AUTO requirement is met. */
  autoMet: boolean;
  /** AUTO requirements not yet met. */
  unmetAuto: string[];
  /** MANUAL gates a human still has to clear. */
  manualGates: string[];
}

const COMPARATORS: Record<string, (a: number, b: number) => boolean> = {
  ">=": (a, b) => a >= b,
  "<=": (a, b) => a <= b,
  ">": (a, b) => a > b,
  "<": (a, b) => a < b,
  "==": (a, b) => a === b,
};

export async function loadAutonomyPolicy(repoRoot: string): Promise<any | undefined> {
  const file = path.join(repoRoot, "company", "runtime", "autonomy-policy.yaml");
  try {
    return YAML.parse(await fs.readFile(file, "utf8"));
  } catch {
    return undefined;
  }
}

export function evaluatePromotion(
  evidence: ReliabilityEvidence,
  policy: any | undefined,
): PromotionEvaluation {
  const requires: Record<string, string | number | boolean> =
    policy?.promotion?.fromHumanGatedToAutonomous?.requires ?? {};

  const requirements: RequirementResult[] = [];
  for (const [key, raw] of Object.entries(requires)) {
    const exprMatch =
      typeof raw === "string" ? raw.trim().match(/^(>=|<=|>|<|==)\s*([\d.]+)$/) : null;

    if (exprMatch) {
      const comparator = exprMatch[1];
      const threshold = Number(exprMatch[2]);
      const metric = METRIC_ALIASES[key.toLowerCase()];
      if (!metric) {
        requirements.push({
          key,
          raw,
          kind: "unknown",
          comparator,
          threshold,
          met: true, // unknown metrics do not block — surfaced for the human
          note: `no evidence metric maps to '${key}'; not auto-checked`,
        });
        continue;
      }
      const actual = Number(evidence[metric]);
      const met = COMPARATORS[comparator](actual, threshold);
      requirements.push({ key, raw, kind: "auto", metric, comparator, threshold, actual, met });
      continue;
    }

    // `required` / true / non-expression strings are manual gates.
    const isManual = raw === "required" || raw === true || typeof raw === "string";
    requirements.push({
      key,
      raw,
      kind: isManual ? "manual" : "unknown",
      met: false,
      note:
        key.toLowerCase().includes("adr")
          ? "run `cac-host shadow propose` to draft the ADR, then merge it"
          : key.toLowerCase().includes("manifest")
            ? "update the agent's manifest autonomy field as part of the promotion PR"
            : "manual gate — a human must confirm this",
    });
  }

  const autoReqs = requirements.filter((r) => r.kind === "auto");
  const unmetAuto = autoReqs.filter((r) => !r.met).map((r) => r.key);
  const manualGates = requirements.filter((r) => r.kind === "manual").map((r) => r.key);

  return {
    requirements,
    autoMet: unmetAuto.length === 0,
    unmetAuto,
    manualGates,
  };
}
