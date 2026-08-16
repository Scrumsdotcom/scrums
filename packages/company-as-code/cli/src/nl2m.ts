// NL2M, Natural Language to Manifest.
//
// A CEO describes a company initiative in prose; NL2M turns it into a linked
// Initiative + Goal + Metric triple, schema-valid and ready to commit.
//
// The reference implementation is a DETERMINISTIC heuristic parser, not an LLM
// call. The CLI must be reproducible and testable. It extracts what it can
// confidently (a target number, a direction, a domain, a horizon) and leaves
// honest `nl2m: review` markers everywhere it had to guess. The output always
// validates against the canonical schemas; the human (or an agent) fills the
// review fields before the docs go live.
//
// Like every write path in the framework, `cac nl2m` is dry-run by default,
// it prints the projected files; `--write` commits them.

import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { COMPANY_DIR } from "./paths.js";
import { strictParse } from "./cli-args.js";
import { loadCorpus, loadSchemas } from "./loader.js";
import { buildAjv } from "./validate.js";

type Domain =
  | "executive"
  | "finance-ops"
  | "product-operations"
  | "sales-marketing"
  | "cross-domain";

const DOMAIN_CODE: Record<Domain, string> = {
  executive: "EXEC",
  "finance-ops": "FIN",
  "product-operations": "PLATFORM",
  "sales-marketing": "GROWTH",
  "cross-domain": "XFN",
};

const DOMAIN_KEYWORDS: Record<Exclude<Domain, "cross-domain" | "executive">, string[]> = {
  "finance-ops": [
    "cash", "runway", "ledger", "close", "invoice", "payroll", "burn",
    "finance", "revenue", "margin", "budget", "spend", "cost", "accounting",
  ],
  "sales-marketing": [
    "growth", "acquisition", "cac", "marketing", "pipeline", "lead", "leads",
    "conversion", "churn", "retention", "funnel", "campaign", "mrr", "arr",
    "customer", "signup", "signups",
  ],
  "product-operations": [
    "deploy", "platform", "incident", "uptime", "latency", "reliability",
    "release", "infrastructure", "build", "outage", "sla", "performance",
  ],
};

export interface ParsedIntent {
  title: string;
  summary: string;
  domain: Domain;
  /** Concrete domain code used for ID prefixes (cross-domain resolves to dominant). */
  codeDomain: Exclude<Domain, "cross-domain">;
  metricName: string;
  metricSlug: string;
  metricType: string;
  metricUnit: string;
  goalType: "kpi" | "okr" | "sla" | "target" | "guardrail";
  target: { value: number | string; unit?: string; comparator: string };
  horizonPeriod?: "weekly" | "monthly" | "quarterly" | "yearly" | "rolling";
  /** Fields the parser had to guess, surfaced as review markers in output. */
  review: string[];
}

// ---------------------------------------------------------------------------
// Heuristic parser
// ---------------------------------------------------------------------------

export function parseProse(proseRaw: string): ParsedIntent {
  const prose = proseRaw.replace(/\s+/g, " ").trim();
  const lower = prose.toLowerCase();
  const review: string[] = [];

  // --- domain ---------------------------------------------------------------
  const scores: Record<string, number> = {};
  for (const [domain, words] of Object.entries(DOMAIN_KEYWORDS)) {
    scores[domain] = words.reduce(
      (n, w) => n + (new RegExp(`\\b${w}\\b`, "i").test(lower) ? 1 : 0),
      0,
    );
  }
  const hits = Object.entries(scores).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  let domain: Domain;
  let codeDomain: Exclude<Domain, "cross-domain">;
  if (hits.length === 0) {
    domain = "executive";
    codeDomain = "executive";
    review.push("domain, no domain keywords matched; defaulted to executive");
  } else if (hits.length > 1 && hits[0][1] === hits[1][1]) {
    domain = "cross-domain";
    codeDomain = hits[0][0] as Exclude<Domain, "cross-domain">;
    review.push(`domain, multiple domains tied (${hits.map((h) => h[0]).join(", ")}); set cross-domain`);
  } else {
    domain = hits[0][0] as Domain;
    codeDomain = hits[0][0] as Exclude<Domain, "cross-domain">;
  }

  // --- title ----------------------------------------------------------------
  const firstSentence = (prose.split(/(?<=[.!?])\s/)[0] ?? prose).trim();
  let title = firstSentence
    .replace(/^(we|i|let's|let us)\s+(want to|need to|should|will|plan to|aim to|are going to)\s+/i, "")
    .replace(/^(we|i)\s+(want|need)\s+/i, "")
    .replace(/[.!?]+$/, "")
    .trim();
  title = title.charAt(0).toUpperCase() + title.slice(1);
  if (title.length < 4) {
    title = "Untitled initiative";
    review.push("title, could not extract a title from the prose");
  }

  // --- target number + direction -------------------------------------------
  // Look for: "<verb> ... to <number>" or "below/above <number>" etc.
  const numberToken = "(\\$?\\d[\\d,]*(?:\\.\\d+)?\\s?%?)";
  const downVerbs = /\b(reduce|cut|decrease|lower|shrink|bring down|drop)\b/i;
  const upVerbs = /\b(increase|grow|raise|improve|reach|hit|boost|double|lift)\b/i;

  let comparator = "gte";
  let directionFound = false;
  if (downVerbs.test(lower)) {
    comparator = "lte";
    directionFound = true;
  } else if (upVerbs.test(lower)) {
    comparator = "gte";
    directionFound = true;
  } else if (/\b(below|under|less than|at most|no more than)\b/i.test(lower)) {
    comparator = "lte";
    directionFound = true;
  } else if (/\b(above|over|more than|at least)\b/i.test(lower)) {
    comparator = "gte";
    directionFound = true;
  }

  // Pull the first number that looks like a target (skip pure year-like 20xx
  // and durations handled by horizon).
  const targetMatch =
    lower.match(new RegExp(`\\bto\\s+${numberToken}`, "i")) ??
    lower.match(new RegExp(`(?:below|under|above|over|at least|more than|less than)\\s+${numberToken}`, "i")) ??
    lower.match(new RegExp(`\\b${numberToken}`, "i"));

  let value: number | string = "TBD";
  let unit: string | undefined;
  let metricType = "gauge";
  if (targetMatch) {
    const raw = targetMatch[1].trim();
    const isCurrency = raw.startsWith("$");
    const isPercent = raw.endsWith("%");
    const numeric = Number(raw.replace(/[$,%\s]/g, ""));
    if (Number.isFinite(numeric)) {
      value = numeric;
      if (isCurrency) {
        unit = "USD";
        metricType = "currency";
      } else if (isPercent) {
        unit = "%";
        metricType = "percentage";
      }
    }
  }
  if (value === "TBD") {
    review.push("target.value, no target number found in the prose");
  }
  if (!directionFound) {
    review.push("target.comparator, no direction verb found; defaulted to 'gte'");
  }

  // Duration phrases ("9 months", "2 business days") become a duration metric
  // when no other unit was found.
  if (!unit) {
    const durMatch = lower.match(/\b\d[\d,]*\s?(day|days|week|weeks|month|months|hour|hours)\b/i);
    if (durMatch) {
      unit = durMatch[1].replace(/s$/, "") + "s";
      metricType = "duration";
    }
  }
  if (!unit) {
    unit = "TBD";
    review.push("metric.unit, could not infer a unit; set 'TBD'");
  }

  // --- metric name / subject -----------------------------------------------
  // "<verb> (the) <subject phrase> to <number>"  # capture the subject.
  let metricName = "";
  const subjMatch = lower.match(
    /\b(?:reduce|cut|decrease|lower|increase|grow|raise|improve|reach|hit|boost)\s+(?:the\s+|our\s+|its\s+)?([a-z][a-z0-9 \-]{2,40}?)\s+(?:to|by|below|above|under|over)\b/i,
  );
  if (subjMatch) {
    metricName = titleCase(subjMatch[1].trim());
  } else {
    metricName = `${title}, primary metric`;
    review.push("metric.name, could not isolate the metric subject; derived from the title");
  }
  const metricSlug =
    slug(metricName).toUpperCase().slice(0, 32).replace(/-+$/, "") || "PRIMARY";

  // --- goal type ------------------------------------------------------------
  let goalType: ParsedIntent["goalType"] = "okr";
  if (/\bsla\b/i.test(lower) || metricType === "duration") goalType = "sla";
  else if (/\bkpi\b/i.test(lower)) goalType = "kpi";
  else if (comparator === "lte" && metricType !== "duration") goalType = "target";

  // --- horizon --------------------------------------------------------------
  let horizonPeriod: ParsedIntent["horizonPeriod"];
  if (/\bq[1-4]\b/i.test(lower) || /\bquarter\b/i.test(lower)) horizonPeriod = "quarterly";
  else if (/\b(year|annual|fy\d|fiscal year)\b/i.test(lower)) horizonPeriod = "yearly";
  else if (/\bmonth(ly)?\b/i.test(lower)) horizonPeriod = "monthly";
  else if (/\bweek(ly)?\b/i.test(lower)) horizonPeriod = "weekly";
  if (!horizonPeriod) {
    review.push("goal.horizon, no timeframe found; left unset");
  }

  return {
    title,
    summary: prose,
    domain,
    codeDomain,
    metricName,
    metricSlug,
    metricType,
    metricUnit: unit,
    goalType,
    target: { value, comparator, ...(unit !== "TBD" ? { unit } : {}) },
    horizonPeriod,
    review,
  };
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// ID allocation, scan the existing corpus so generated IDs never collide
// ---------------------------------------------------------------------------

export interface AllocatedIds {
  initiativeId: string;
  goalId: string;
  metricId: string;
}

export async function allocateIds(intent: ParsedIntent): Promise<AllocatedIds> {
  const corpus = await loadCorpus();
  const code = DOMAIN_CODE[intent.codeDomain as Domain];

  const nextSeq = (existing: string[], prefix: string): string => {
    const re = new RegExp(`^${prefix}-(\\d{4,})$`);
    let max = 0;
    for (const id of existing) {
      const m = id.match(re);
      if (m) max = Math.max(max, Number(m[1]));
    }
    return `${prefix}-${String(max + 1).padStart(4, "0")}`;
  };

  const initiativeId = nextSeq(
    corpus.initiatives.map((d) => d.data.id as string),
    `INIT-${code}`,
  );
  const goalId = nextSeq(corpus.goals.map((d) => d.data.id as string), `GOAL-${code}`);

  // Metric IDs are slug-based; de-dupe with a numeric suffix on collision.
  const metricIds = new Set(corpus.metrics.map((d) => d.data.id as string));
  let metricId = `METRIC-${code}-${intent.metricSlug}`;
  let n = 2;
  while (metricIds.has(metricId)) {
    metricId = `METRIC-${code}-${intent.metricSlug}-${n}`;
    n += 1;
  }

  return { initiativeId, goalId, metricId };
}

// ---------------------------------------------------------------------------
// Synthesis, build the linked Initiative + Goal + Metric triple
// ---------------------------------------------------------------------------

export interface SynthesisOptions {
  owner?: string;
  today?: string; // injectable for deterministic tests
}

export interface SynthesizedDoc {
  /** Repo-relative path the doc would be written to. */
  file: string;
  /** Parsed object (schema-valid). */
  data: Record<string, unknown>;
}

export function synthesize(
  intent: ParsedIntent,
  ids: AllocatedIds,
  opts: SynthesisOptions = {},
): { initiative: SynthesizedDoc; goal: SynthesizedDoc; metric: SynthesizedDoc } {
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const ownerId = opts.owner ?? "team:TBD";
  const initiativeDomain: Domain = intent.domain;

  const initiative = {
    apiVersion: "company-as-code/v1",
    kind: "Initiative",
    id: ids.initiativeId,
    title: intent.title,
    summary: intent.summary,
    status: "proposed",
    owner: { kind: "team", id: ownerId },
    domain: initiativeDomain,
    startDate: today,
    goals: [ids.goalId],
    metrics: [ids.metricId],
    tasks: [],
    modules: [],
  };

  const goal = {
    apiVersion: "company-as-code/v1",
    kind: "Goal",
    id: ids.goalId,
    title: `${intent.title}, measurable goal`,
    description: `Auto-drafted by nl2m from the initiative prose. Review the target before activating.`,
    type: intent.goalType,
    owner: { kind: "team", id: ownerId },
    metric: ids.metricId,
    target: intent.target,
    ...(intent.horizonPeriod
      ? { horizon: { period: intent.horizonPeriod, start: today } }
      : {}),
    initiatives: [ids.initiativeId],
    status: "draft",
  };

  const metric = {
    apiVersion: "company-as-code/v1",
    kind: "Metric",
    id: ids.metricId,
    name: intent.metricName,
    description: `Auto-drafted by nl2m. Fill in the formula, lineage, and owning module.`,
    owner: { module: "TBD" },
    type: intent.metricType,
    unit: intent.metricUnit,
    formula: "TBD, describe how this metric is computed",
    lineage: [],
    freshness: { expectedLag: "P1D" },
  };

  const slugTitle = slug(intent.title).slice(0, 48) || "initiative";
  return {
    initiative: {
      file: `company/initiatives/${ids.initiativeId}-${slugTitle}.yaml`,
      data: initiative,
    },
    goal: {
      file: `company/goals/${ids.goalId}-${slugTitle}.yaml`,
      data: goal,
    },
    metric: {
      file: `company/metrics/${ids.metricId}.yaml`,
      data: metric,
    },
  };
}

// ---------------------------------------------------------------------------
// Rendering + validation
// ---------------------------------------------------------------------------

function renderDoc(doc: SynthesizedDoc, intent: ParsedIntent, kind: string): string {
  const reviewForKind = intent.review.filter((r) => r.startsWith(kind.toLowerCase()) || matchesGeneric(r, kind));
  const header = [
    `# Generated by 'cac nl2m'. This is a draft, review before committing.`,
    reviewForKind.length
      ? `# nl2m: review the following. The parser had to guess:`
      : `# nl2m: parser extracted every field with confidence.`,
    ...reviewForKind.map((r) => `#   - ${r}`),
    ``,
  ].join("\n");
  return header + YAML.stringify(doc.data);
}

function matchesGeneric(review: string, kind: string): boolean {
  // "target.*" + "metric.*" markers belong on goal/metric; "domain"/"title" on initiative.
  if (kind === "Goal") return review.startsWith("target.") || review.startsWith("goal.");
  if (kind === "Metric") return review.startsWith("metric.");
  if (kind === "Initiative") return review.startsWith("domain") || review.startsWith("title");
  return false;
}

async function validateDoc(doc: SynthesizedDoc, schemaFile: string): Promise<string[]> {
  const schemas = await loadSchemas();
  const ajv = buildAjv(schemas);
  const validator = ajv.getSchema(schemaFile);
  if (!validator) throw new Error(`schema not loaded: ${schemaFile}`);
  if (validator(doc.data)) return [];
  return (validator.errors ?? []).map((e) => `${e.instancePath || "(root)"} ${e.message}`);
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export interface Nl2mArgs {
  prose: string;
  write: boolean;
  owner?: string;
  today?: string;
}

export async function nl2mCommand(args: Nl2mArgs): Promise<boolean> {
  if (!args.prose.trim()) {
    console.error("nl2m: empty prose. Pass a description or use --file <path>.");
    return false;
  }

  const intent = parseProse(args.prose);
  const ids = await allocateIds(intent);
  const { initiative, goal, metric } = synthesize(intent, ids, {
    owner: args.owner,
    today: args.today,
  });

  // Validate every synthesized doc, nl2m output must always be schema-valid.
  const problems: Array<{ file: string; errors: string[] }> = [];
  for (const [doc, schemaFile] of [
    [initiative, "initiative.schema.json"],
    [goal, "goal.schema.json"],
    [metric, "metric.schema.json"],
  ] as const) {
    const errs = await validateDoc(doc, schemaFile);
    if (errs.length) problems.push({ file: doc.file, errors: errs });
  }
  if (problems.length) {
    console.error("✗ nl2m: synthesized documents failed schema validation (this is a bug, please report):");
    for (const p of problems) {
      console.error(`  ${p.file}`);
      for (const e of p.errors) console.error(`    - ${e}`);
    }
    return false;
  }

  const rendered = [
    { doc: initiative, kind: "Initiative" },
    { doc: goal, kind: "Goal" },
    { doc: metric, kind: "Metric" },
  ];

  console.log(`nl2m, parsed prose into a linked Initiative + Goal + Metric triple`);
  console.log(`  domain:    ${intent.domain}`);
  console.log(`  initiative: ${ids.initiativeId}`);
  console.log(`  goal:       ${ids.goalId}`);
  console.log(`  metric:     ${ids.metricId}`);
  console.log(
    `  ${intent.review.length} field(s) need review` +
      (intent.review.length ? `. See the # nl2m: review headers below` : ``),
  );
  console.log(`  mode:      ${args.write ? "WRITE" : "DRY-RUN, no files written"}\n`);

  for (const { doc, kind } of rendered) {
    console.log(`# ---- ${doc.file} ----`);
    console.log(renderDoc(doc, intent, kind));
  }

  if (!args.write) {
    console.log(`Re-run with --write to create these files, then 'cd cli && npm run validate'.`);
    return true;
  }

  // Refuse to overwrite, nl2m only creates new drafts.
  for (const { doc } of rendered) {
    const abs = path.join(COMPANY_DIR, "..", doc.file);
    try {
      await fs.stat(abs);
      console.error(`✗ nl2m: ${doc.file} already exists. Refusing to overwrite.`);
      return false;
    } catch {
      /* good, does not exist */
    }
  }
  for (const { doc, kind } of rendered) {
    const abs = path.join(COMPANY_DIR, "..", doc.file);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, renderDoc(doc, intent, kind), "utf8");
  }
  console.log(`✓ wrote 3 file(s). Next: fill in the review fields, then 'cd cli && npm run validate && npm run generate'.`);
  return true;
}

/** Parse argv tail for `cac nl2m`. Accepts positional prose or --file. */
export async function nl2mFromArgv(rest: string[]): Promise<boolean> {
  const parsed = strictParse(
    "nl2m",
    rest,
    {
      write: { type: "boolean" },
      file: { type: "string" },
      owner: { type: "string" },
    },
    true,
  );
  if (!parsed) return false;
  const write = parsed.values.write === true;
  const owner = parsed.values.owner as string | undefined;
  const file = parsed.values.file as string | undefined;

  let prose: string;
  if (file !== undefined) {
    prose = await fs.readFile(path.resolve(file), "utf8");
  } else {
    prose = parsed.positionals.join(" ");
  }
  return nl2mCommand({ prose, write, owner });
}
