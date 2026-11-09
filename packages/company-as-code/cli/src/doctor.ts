// cac doctor, standing self-inspection for an instance.
//
// `validate` answers "is every document well-formed and does every declared
// edge resolve?" That question has a binary answer and it blocks merges.
//
// Doctor answers a different question: "is this repository still healthy?"
// Health is not binary. A control that has not been verified in eight months
// is not invalid, and neither is a module with no accountable contact, or a
// documentation link that quietly rotted when a file moved. None of those
// should block a merge on the day they appear, and all of them should be
// visible before they compound.
//
// So doctor reports at two severities. Findings fail the run; warnings do not.
// `--strict` promotes warnings to findings for forks that want the tighter
// gate, which is the setting most forks eventually want.

import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { COMPANY_DIR, REPO_ROOT } from "./paths.js";
import { loadCorpus, loadSchemas, modulePathOf, type RepoCorpus } from "./loader.js";
import { buildGraph } from "./graph.js";
import { checkBoundary, failing } from "./boundary.js";

export type Severity = "finding" | "warning";

export interface DoctorResult {
  check: string;
  severity: Severity;
  where: string;
  message: string;
}

/** Controls unverified for longer than this are stale, whatever their status says. */
const CONTROL_STALE_DAYS = 180;

/** Roots scanned for rotted relative links. */
const DOC_ROOTS = ["docs", "company", "schemas", "templates", "hub", "generated/sdk"];

const ROOT_DOCS = [
  "README.md",
  "AGENTS.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "SECURITY.md",
  "MAINTAINERS.md",
  "CODE_OF_CONDUCT.md",
];

export async function doctorCommand(opts: { strict: boolean }): Promise<boolean> {
  const corpus = await loadCorpus();
  const schemas = await loadSchemas();
  const results: DoctorResult[] = [];

  results.push(...(await deadRelativeLinks()));
  results.push(...(await conservedCoreGate()));
  results.push(...staleControls(corpus));
  results.push(...unaccountableModules(corpus));
  results.push(...silentAgents(corpus));
  results.push(...uncoveredCapabilities(corpus));
  results.push(...isolatedEntities(corpus, schemas));
  results.push(...unrulesProposals(corpus));
  results.push(...(await boundaryHealth()));

  results.sort((a, b) =>
    `${a.severity === "finding" ? 0 : 1}${a.check}${a.where}`.localeCompare(
      `${b.severity === "finding" ? 0 : 1}${b.check}${b.where}`,
    ),
  );

  const findings = results.filter((r) => r.severity === "finding");
  const warnings = results.filter((r) => r.severity === "warning");

  if (results.length === 0) {
    console.log("✓ doctor: clean.");
    return true;
  }

  for (const r of results) {
    const label = r.severity === "finding" ? "finding" : "warning";
    console.log(`  [${label}] [${r.check}] ${r.where}: ${r.message}`);
  }
  console.log(
    `\ndoctor: ${findings.length} finding(s), ${warnings.length} warning(s)${opts.strict ? " (strict: warnings fail)" : ""}.`,
  );

  return opts.strict ? results.length === 0 : findings.length === 0;
}

// --- D1: relative links in Markdown resolve -------------------------------

const LINK = /\]\(([^)#\s][^)]*)\)/g;

async function deadRelativeLinks(): Promise<DoctorResult[]> {
  const out: DoctorResult[] = [];
  const files = [
    ...ROOT_DOCS.map((f) => path.join(REPO_ROOT, f)),
    ...(await fg(
      DOC_ROOTS.map((r) => `${r}/**/*.md`),
      { cwd: REPO_ROOT, absolute: true, ignore: ["**/node_modules/**"] },
    )),
  ];
  for (const file of files) {
    let text: string;
    try {
      text = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    const base = path.dirname(file);
    for (const line of text.split("\n")) {
      // Blockquoted lines are usually quoted from somewhere else; their links
      // resolve in their destination, not here.
      if (line.trimStart().startsWith(">")) continue;
      for (const m of line.matchAll(LINK)) {
        const target = m[1]!;
        if (/^(https?:|mailto:|tel:)/.test(target) || target.includes("{")) continue;
        const resolved = path.resolve(base, target.split("#")[0]!);
        const exists = await fs
          .stat(resolved)
          .then(() => true)
          .catch(() => false);
        if (!exists) {
          out.push({
            check: "links",
            severity: "warning",
            where: path.relative(REPO_ROOT, file),
            message: `relative link does not resolve: ${target}`,
          });
        }
      }
    }
  }
  return out;
}

// --- D2: the conserved core has a mechanical gate --------------------------

async function conservedCoreGate(): Promise<DoctorResult[]> {
  const candidates = ["CODEOWNERS", ".github/CODEOWNERS", "docs/CODEOWNERS"];
  for (const c of candidates) {
    const exists = await fs
      .stat(path.join(REPO_ROOT, c))
      .then(() => true)
      .catch(() => false);
    if (exists) return [];
  }
  return [
    {
      check: "conserved-core",
      severity: "finding",
      where: "(repo root)",
      message:
        "no CODEOWNERS file. The spec, standards, schemas, and policies have no mechanical review gate. See docs/standards/conserved-core.md.",
    },
  ];
}

// --- D3: controls that nobody has verified recently ------------------------

function staleControls(corpus: RepoCorpus): DoctorResult[] {
  const out: DoctorResult[] = [];
  // Compared against the newest lastVerified in the corpus rather than the
  // wall clock: doctor must produce the same answer on every machine and in
  // every replay, and "now" does not.
  const dates = corpus.controls
    .map((c) => c.data.lastVerified)
    .filter((d): d is string => typeof d === "string")
    .sort();
  const reference = dates[dates.length - 1];
  if (!reference) return out;
  const referenceMs = Date.parse(reference);
  for (const c of corpus.controls) {
    if (c.data.status === "retired") continue;
    const last = c.data.lastVerified;
    if (typeof last !== "string") {
      if (c.data.status === "operating") continue; // schema already requires it
      out.push({
        check: "controls",
        severity: "warning",
        where: c.file,
        message: `control ${c.data.id} has never been verified.`,
      });
      continue;
    }
    const ageDays = Math.round((referenceMs - Date.parse(last)) / 86_400_000);
    if (ageDays > CONTROL_STALE_DAYS) {
      out.push({
        check: "controls",
        severity: "finding",
        where: c.file,
        message: `control ${c.data.id} was last verified ${ageDays} days before the newest verification in the repo. An unverified control is a claim.`,
      });
    }
  }
  return out;
}

// --- D4: modules with nobody accountable ----------------------------------

function unaccountableModules(corpus: RepoCorpus): DoctorResult[] {
  const out: DoctorResult[] = [];
  for (const m of corpus.manifests) {
    const contacts = (m.data.contacts ?? []) as Array<{ role: string; person?: string }>;
    const accountable = contacts.find((c) => c.role === "accountable");
    if (!accountable) {
      out.push({
        check: "ownership",
        severity: "finding",
        where: m.file,
        message: "no contact with role 'accountable'. Every module has a person who answers for it.",
      });
    } else if (!accountable.person) {
      out.push({
        check: "ownership",
        severity: "warning",
        where: m.file,
        message: "the accountable contact names a role but no person.",
      });
    }
  }
  return out;
}

// --- D5: agents that emit nothing anyone watches ---------------------------

function silentAgents(corpus: RepoCorpus): DoctorResult[] {
  const out: DoctorResult[] = [];
  for (const a of corpus.agents) {
    const obs = a.data.observability ?? {};
    if (!obs.auditTopic) {
      out.push({
        check: "observability",
        severity: "warning",
        where: a.file,
        message: `agent '${a.data.name}' declares no auditTopic. Its actions land nowhere anyone reads.`,
      });
    }
    const watched =
      ((obs.dashboards ?? []) as unknown[]).length > 0 || ((obs.alerts ?? []) as unknown[]).length > 0;
    if (a.data.autonomy === "autonomous" && !watched) {
      out.push({
        check: "observability",
        severity: "finding",
        where: a.file,
        message: `agent '${a.data.name}' runs autonomously with no dashboard and no alert. Nothing would notice it failing.`,
      });
    }
  }
  return out;
}

// --- D6: capabilities that no metric can confirm are being delivered -------

function uncoveredCapabilities(corpus: RepoCorpus): DoctorResult[] {
  const out: DoctorResult[] = [];
  for (const c of corpus.capabilities) {
    const measured = ((c.data.measuredBy ?? []) as unknown[]).length > 0;
    if (!measured && (c.data.criticality === "critical" || c.data.criticality === "high")) {
      out.push({
        check: "capabilities",
        severity: "warning",
        where: c.file,
        message: `capability ${c.data.id} is ${c.data.criticality} but no metric shows whether it is actually being delivered.`,
      });
    }
  }
  return out;
}

// --- D7: entities nothing points at and which point at nothing ------------

function isolatedEntities(corpus: RepoCorpus, schemas: Record<string, unknown>): DoctorResult[] {
  const { nodes, edges } = buildGraph(corpus, schemas);
  const touched = new Set<string>();
  for (const e of edges) {
    touched.add(e.from);
    touched.add(e.to);
  }
  // Singletons and registries are legitimately unreferenced; they are read by
  // the runtime, not pointed at by other documents.
  const EXEMPT = new Set([
    "AutonomyPolicy",
    "EscalationPolicy",
    "EventTypeRegistry",
    "Proposal",
    "StateSnapshot",
    "Event",
    "ShadowEnrollment",
  ]);
  return nodes
    .filter((n) => !touched.has(n.id) && !EXEMPT.has(n.kind))
    .map((n) => ({
      check: "graph",
      severity: "warning" as Severity,
      where: n.file,
      message: `${n.kind} '${n.label}' is isolated: nothing references it and it references nothing.`,
    }));
}

// --- D8: proposals whose status outran their ruling ------------------------

function unrulesProposals(corpus: RepoCorpus): DoctorResult[] {
  const out: DoctorResult[] = [];
  for (const p of corpus.proposals) {
    if (p.data.status !== "open") continue;
    const targets = (p.data.targets ?? []) as Array<{ path: string }>;
    if (targets.length === 0) continue;
    out.push({
      check: "governance",
      severity: "warning",
      where: p.file,
      message: `proposal ${p.data.id} is open against ${targets.length} conserved file(s) and has no ruling yet.`,
    });
  }
  return out;
}

// --- D9: the framework/instance boundary -----------------------------------
//
// Upstream's lock is already drift-gated by `generate --check`, so here only
// unclassified paths are reported. In a fork, every undeclared edit to a
// framework file is a future upgrade conflict, and doctor says so before the
// upgrade does.

async function boundaryHealth(): Promise<DoctorResult[]> {
  const report = await checkBoundary(REPO_ROOT);
  return failing(report)
    .filter((f) => report.role === "fork" || (f.kind !== "lock-stale" && f.kind !== "no-lock"))
    .map((f) => ({
      check: "boundary",
      severity: "warning" as const,
      where: f.path,
      message: `${f.kind}: ${f.message}`,
    }));
}

/** Exported for tests: the company directory doctor reads. */
export const DOCTOR_SCOPE = COMPANY_DIR;
export { modulePathOf };
