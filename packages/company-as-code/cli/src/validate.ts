import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  loadCorpusWithDiagnostics,
  loadSchemas,
  schemaFor,
  type RepoCorpus,
  type UnclassifiedFile,
} from "./loader.js";
import { REF_KEYWORD, danglingReferenceErrors, resolveTypedEdges } from "./refs.js";
import { INSTANCE_FILE, loadInstance } from "./boundary.js";
import { API_VERSION } from "./version.js";
import { MIGRATIONS } from "./migrations/index.js";
import { chain } from "./migrate.js";

export interface ValidationProblem {
  file: string;
  kind: string;
  errors: string[];
}

export function buildAjv(schemas: Record<string, unknown>) {
  // `strict: true` surfaces ambiguous / non-portable schema constructs at load
  // time. The framework treats schema warnings as defects.
  //
  // `allowUnionTypes: true` is intentional, several primitives carry fields
  // that legitimately accept either a number or a string template (e.g.
  // `Goal.target.value` can be a literal numeric target OR a formula-style
  // string for derived comparators).
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictTypes: true,
    strictTuples: true,
    strictRequired: false,
    allowUnionTypes: true,
  });
  addFormats(ajv);
  // `x-cac-ref` is an annotation, not a constraint: it declares which primitive
  // kinds a reference field may point at. Resolution happens in refs.ts against
  // the loaded corpus, which Ajv cannot see. Registering it here keeps strict
  // mode from rejecting the annotated schemas.
  ajv.addKeyword({
    keyword: REF_KEYWORD,
    metaSchema: { type: "array", items: { type: "string" }, minItems: 1 },
  });
  for (const [name, schema] of Object.entries(schemas)) {
    ajv.addSchema(schema as object, name);
  }
  return ajv;
}

export function schemaValidate(
  corpus: RepoCorpus,
  ajv: ReturnType<typeof buildAjv>,
): ValidationProblem[] {
  const problems: ValidationProblem[] = [];
  for (const bucket of Object.keys(corpus) as (keyof RepoCorpus)[]) {
    const validator = ajv.getSchema(schemaFor(bucket));
    if (!validator) throw new Error(`Schema not loaded: ${schemaFor(bucket)}`);
    for (const doc of corpus[bucket]) {
      const ok = validator(doc.data);
      if (!ok) {
        const errs = (validator.errors ?? []).map(
          (e) => `${e.instancePath || "(root)"} ${e.message}`,
        );
        problems.push({ file: doc.file, kind: doc.data.kind, errors: errs });
      }
    }
  }
  return problems;
}

export function unclassifiedErrors(unclassified: UnclassifiedFile[]): string[] {
  return unclassified.map((u) => {
    switch (u.reason) {
      case "unknown-kind":
        return `${u.file}: unrecognized kind '${u.kind}'. The document is excluded from validation. Fix the kind, or mark intentional non-primitive YAML with a '# cac:ignore' comment.`;
      case "missing-kind":
        return `${u.file}: no 'kind:' field. The document is excluded from validation. Add a kind, or mark intentional non-primitive YAML with a '# cac:ignore' comment.`;
      case "non-object":
        return `${u.file}: does not parse to a YAML mapping. The file is excluded from validation. Mark intentional non-primitive YAML with a '# cac:ignore' comment.`;
    }
  });
}

export async function validateCommand(): Promise<boolean> {
  const schemas = await loadSchemas();
  const { corpus, unclassified } = await loadCorpusWithDiagnostics();
  const ajv = buildAjv(schemas);

  const problems = schemaValidate(corpus, ajv);
  const totalDocs = Object.values(corpus).reduce((sum, arr) => sum + arr.length, 0);
  const edges = resolveTypedEdges(corpus, schemas);
  const refErrors = danglingReferenceErrors(edges);
  const crossErrors = crossDocumentChecks(corpus);
  const unclassifiedProblems = unclassifiedErrors(unclassified);
  const instance = await loadInstance();
  if (instance) {
    const validator = ajv.getSchema("instance.schema.json");
    if (validator && !validator(instance)) {
      problems.push({
        file: INSTANCE_FILE,
        kind: "Instance",
        errors: (validator.errors ?? []).map((e) => `${e.instancePath || "(root)"} ${e.message}`),
      });
    }
  }

  if (
    problems.length === 0 &&
    refErrors.length === 0 &&
    crossErrors.length === 0 &&
    unclassifiedProblems.length === 0
  ) {
    console.log(
      `✓ validate: ${totalDocs} document(s) OK across ${Object.keys(corpus).length} primitive(s); ${edges.length} typed reference(s) resolved.`,
    );
    return true;
  }

  const outdated = outdatedDocuments(corpus);
  if (outdated.length > 0) {
    const migratable = outdated.every((d) => chain(d.version, API_VERSION, MIGRATIONS) !== null);
    console.error(
      `✗ ${outdated.length} document(s) declare an older apiVersion than ${API_VERSION}` +
        (migratable ? ". Run 'cac migrate' to preview the fix, then 'cac migrate --write'." : ", and no migration path exists for at least one of them."),
    );
  }
  if (unclassifiedProblems.length > 0) {
    console.error(`✗ unclassified /company YAML (${unclassifiedProblems.length} file(s)):`);
    for (const e of unclassifiedProblems) console.error(`  - ${e}`);
  }
  if (problems.length > 0) {
    console.error(`✗ schema errors in ${problems.length} document(s):`);
    for (const p of problems) {
      console.error(`  ${p.file} [${p.kind}]`);
      for (const e of p.errors) console.error(`    - ${e}`);
    }
  }
  if (refErrors.length > 0) {
    console.error(`✗ dangling typed reference(s) (${refErrors.length}):`);
    for (const e of refErrors) console.error(`  - ${e}`);
  }
  if (crossErrors.length > 0) {
    console.error(`✗ cross-document discipline errors:`);
    for (const e of crossErrors) console.error(`  - ${e}`);
  }
  return false;
}

function outdatedDocuments(corpus: RepoCorpus): { file: string; version: string }[] {
  const out: { file: string; version: string }[] = [];
  for (const docs of Object.values(corpus)) {
    for (const doc of docs) {
      const v = doc.data?.apiVersion;
      if (typeof v === "string" && v !== API_VERSION) out.push({ file: doc.file, version: v });
    }
  }
  return out;
}

function normalizeWhitespace(v: unknown): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim() : JSON.stringify(v);
}

export function crossDocumentChecks(corpus: RepoCorpus): string[] {
  const errors: string[] = [];

  // 1. Workflow hitl=true must not have schedule trigger.
  for (const wf of corpus.workflows) {
    const hitl = wf.data.hitl === true;
    const trigger = wf.data.trigger?.kind;
    if (hitl && trigger === "schedule") {
      errors.push(`${wf.file}: workflow declares hitl: true with trigger.kind=schedule, runtime would reject this.`);
    }
  }

  // 2. Escalated agent must declare escalation.
  for (const agent of corpus.agents) {
    if (agent.data.autonomy === "escalated" && !agent.data.escalation) {
      errors.push(`${agent.file}: autonomy=escalated requires an escalation block.`);
    }
  }

  // 3. Manifest agent summaries ↔ standalone agent files must agree.
  //    The standalone file is the source of truth. We enforce:
  //    (a) every standalone agent's `module` resolves to a manifest path
  //    (b) the resolved manifest lists the agent in its agents[] block
  //    (c) overlapping fields (purpose, autonomy, cadence, runtime, schedule) agree
  //    (d) every manifest-listed agent has a corresponding standalone file
  const manifestByPath = new Map<string, (typeof corpus.manifests)[number]>();
  for (const m of corpus.manifests) {
    const modulePath = m.file.replace(/\/manifest\.ya?ml$/, "");
    manifestByPath.set(modulePath, m);
  }
  for (const agent of corpus.agents) {
    const modulePath = agent.data.module as string | undefined;
    if (!modulePath) {
      errors.push(`${agent.file}: standalone agent missing required 'module' field.`);
      continue;
    }
    const manifest = manifestByPath.get(modulePath);
    if (!manifest) {
      errors.push(
        `${agent.file}: standalone agent declares module '${modulePath}' but no manifest.yaml exists at that path.`,
      );
      continue;
    }
    const inline = ((manifest.data.agents ?? []) as Array<any>).find(
      (a) => a.name === agent.data.name,
    );
    if (!inline) {
      errors.push(
        `${agent.file}: agent '${agent.data.name}' is not listed in ${manifest.file}'s agents[] block.`,
      );
      continue;
    }
    // Discrete fields must match byte-for-byte; the runtime classification
    // is not allowed to drift between the manifest summary and the standalone.
    for (const field of ["autonomy", "cadence", "runtime", "schedule"] as const) {
      const a = (inline as any)[field];
      const b = (agent.data as any)[field];
      if (a !== undefined && b !== undefined && normalizeWhitespace(a) !== normalizeWhitespace(b)) {
        errors.push(
          `${agent.file}: field '${field}' (${JSON.stringify(b)}) does not match the manifest summary in ${manifest.file} (${JSON.stringify(a)}).`,
        );
      }
    }
    // Prose `purpose` may legitimately be terser in the manifest summary
    // than in the standalone file. We only check that both are non-empty.
    if (inline.purpose !== undefined && typeof inline.purpose === "string" && inline.purpose.trim().length === 0) {
      errors.push(`${manifest.file}: agent '${agent.data.name}' has an empty purpose in the manifest summary.`);
    }
    if (typeof agent.data.purpose !== "string" || agent.data.purpose.trim().length === 0) {
      errors.push(`${agent.file}: standalone agent has empty purpose.`);
    }
  }
  // (d). Every name in manifest.agents[] must have a standalone file under the same module.
  const standaloneByModuleName = new Set<string>();
  for (const a of corpus.agents) {
    if (a.data.module && a.data.name) {
      standaloneByModuleName.add(`${a.data.module}::${a.data.name}`);
    }
  }
  for (const m of corpus.manifests) {
    const modulePath = m.file.replace(/\/manifest\.ya?ml$/, "");
    for (const inline of (m.data.agents ?? []) as Array<{ name: string }>) {
      const key = `${modulePath}::${inline.name}`;
      if (!standaloneByModuleName.has(key)) {
        errors.push(
          `${m.file}: agents[] entry '${inline.name}' has no standalone file at ${modulePath}/agents/${inline.name}.yaml. The standalone file is the source of truth.`,
        );
      }
    }
  }

  // 4. Reference resolution across Initiative / Goal / Metric / Skill / Agent /
  //    Workflow / Dashboard / Manifest is no longer written by hand. Every
  //    reference field carries `x-cac-ref` in its schema and is resolved
  //    generically in refs.ts. Adding a new reference field is a one-line
  //    schema annotation, not a new check here.

  // 7. Automation invariants must include the dry-run safety statement when
  //    the automation has any entries in `mutates[]`.
  for (const automation of corpus.automations) {
    const mutates = (automation.data.mutates ?? []) as unknown[];
    const inputs = (automation.data.inputs ?? []) as Array<{ name: string }>;
    if (mutates.length > 0) {
      const hasDryRun = inputs.some((i) => i.name === "dryRun");
      if (!hasDryRun) {
        errors.push(`${automation.file}: automation mutates state but does not declare a 'dryRun' input.`);
      }
    }
  }

  // 8. Dashboard alert routing roles must resolve to a role defined in some EscalationPolicy.
  //    Both primary roles and their declared fallbacks count as valid targets.
  const escalationRoles = new Set<string>();
  for (const ep of corpus.escalationPolicies) {
    for (const r of (ep.data.roles ?? []) as Array<{ role: string; fallback?: Array<{ role: string }> }>) {
      escalationRoles.add(r.role);
      for (const fb of r.fallback ?? []) {
        escalationRoles.add(fb.role);
      }
    }
    const def = ep.data.defaults;
    if (def?.escalatedAgentRecipient) escalationRoles.add(def.escalatedAgentRecipient);
  }
  // Only enforce if at least one EscalationPolicy is loaded; forks without one are unconstrained.
  if (escalationRoles.size > 0) {
    for (const dashboard of corpus.dashboards) {
      for (const alert of (dashboard.data.alerts ?? []) as Array<{ id: string; routing: string }>) {
        if (alert.routing && !escalationRoles.has(alert.routing)) {
          errors.push(`${dashboard.file}: alert '${alert.id}' routes to '${alert.routing}' which is not a role defined in any EscalationPolicy.`);
        }
      }
    }
  }

  // 9. There may be at most one AutonomyPolicy and at most one EscalationPolicy
  //    document in the corpus (singletons). Forks may extend; the default is one.
  if (corpus.autonomyPolicies.length > 1) {
    const files = corpus.autonomyPolicies.map((p) => p.file).join(", ");
    errors.push(`Multiple AutonomyPolicy documents found (${files}). The runtime expects a singleton.`);
  }
  if (corpus.escalationPolicies.length > 1) {
    const files = corpus.escalationPolicies.map((p) => p.file).join(", ");
    errors.push(`Multiple EscalationPolicy documents found (${files}). The runtime expects a singleton.`);
  }

  // 10. EventTypeRegistry should appear exactly once. Workflow.steps[].emitsEvent
  //     and Agent.outputs[].emitsEvent should reference types from the registry.
  if (corpus.eventTypeRegistries.length > 1) {
    const files = corpus.eventTypeRegistries.map((p) => p.file).join(", ");
    errors.push(`Multiple EventTypeRegistry documents found (${files}). Expected exactly one.`);
  }
  const registeredEventTypes = new Set<string>();
  for (const reg of corpus.eventTypeRegistries) {
    for (const e of (reg.data.events ?? []) as Array<{ type: string }>) {
      registeredEventTypes.add(e.type);
    }
  }
  if (registeredEventTypes.size > 0) {
    // Workflow steps
    for (const wf of corpus.workflows) {
      for (const step of (wf.data.steps ?? []) as Array<{ id: string; emitsEvent?: string }>) {
        if (step.emitsEvent && !registeredEventTypes.has(step.emitsEvent)) {
          errors.push(`${wf.file}: workflow step '${step.id}' emits '${step.emitsEvent}' which is not in the EventTypeRegistry.`);
        }
      }
    }
    // Agent outputs
    for (const agent of corpus.agents) {
      for (const o of (agent.data.outputs ?? []) as Array<{ name: string; emitsEvent?: string }>) {
        if (o.emitsEvent && !registeredEventTypes.has(o.emitsEvent)) {
          errors.push(`${agent.file}: agent output '${o.name}' emits '${o.emitsEvent}' which is not in the EventTypeRegistry.`);
        }
      }
    }
  }

  // 11. Capability ownership chains must terminate and must not loop back on
  //     themselves. A capability whose fallback repeats the primary owner has
  //     no fallback at all; it just looks like it does.
  const agentNames = new Set(corpus.agents.map((a) => a.data.name));
  const modulePaths = new Set(corpus.manifests.map((m) => m.file.replace(/\/manifest\.ya?ml$/, "")));
  for (const cap of corpus.capabilities) {
    const chain = [
      cap.data.primaryOwner,
      ...((cap.data.fallback ?? []) as any[]),
      cap.data.finalFallback,
    ].filter(Boolean) as Array<{ kind: string; id: string }>;
    const seen = new Set<string>();
    for (const holder of chain) {
      const key = `${holder.kind}:${holder.id}`;
      if (seen.has(key)) {
        errors.push(
          `${cap.file}: '${key}' appears twice in the ownership chain. A repeated holder is not a fallback.`,
        );
      }
      seen.add(key);
      if (holder.kind === "agent" && !agentNames.has(holder.id)) {
        errors.push(`${cap.file}: ownership chain names agent '${holder.id}', which is not a defined Agent.`);
      }
      if (holder.kind === "module" && !modulePaths.has(holder.id)) {
        errors.push(`${cap.file}: ownership chain names module '${holder.id}', which has no manifest.`);
      }
    }
    const final = cap.data.finalFallback as { kind: string; delivers?: string } | undefined;
    if (final && final.kind === "agent") {
      errors.push(
        `${cap.file}: finalFallback is an agent. The last link in a chain must be something that cannot itself be absent, a person, team, or role.`,
      );
    }
    if (final && final.delivers === "triage-only" && cap.data.criticality === "critical") {
      errors.push(
        `${cap.file}: a critical capability cannot terminate in a triage-only holder, nobody closes the loop.`,
      );
    }
  }

  // 12. A control claiming to be operating must produce evidence. Otherwise
  //     "operating" is an assertion with nothing behind it.
  for (const control of corpus.controls) {
    if (control.data.status === "operating" && ((control.data.evidence ?? []) as unknown[]).length === 0) {
      errors.push(`${control.file}: status is 'operating' but no evidence source is declared.`);
    }
  }

  // 13. Every in-scope Requirement must be covered by at least one Control.
  //     Coverage direction is one-way: Controls declare what they implement,
  //     so this check inverts the declared edges rather than reading a second
  //     hand-maintained list.
  const covered = new Set<string>();
  for (const control of corpus.controls) {
    for (const req of (control.data.implements ?? []) as string[]) covered.add(req);
  }
  for (const req of corpus.requirements) {
    if (req.data.status === "in-scope" && !covered.has(req.data.id)) {
      errors.push(
        `${req.file}: requirement ${req.data.id} is in scope but no Control declares it under 'implements'.`,
      );
    }
  }

  // 14. A proposal's ruling must agree with its status. 'applied' without an
  //     accepting ruling is the failure mode this exists to catch.
  for (const prop of corpus.proposals) {
    const ruling = prop.data.ruling as { decision?: string } | undefined;
    if (!ruling) continue;
    const expected = prop.data.status === "rejected" ? "rejected" : "accepted";
    if ((prop.data.status === "accepted" || prop.data.status === "applied" || prop.data.status === "rejected") &&
        ruling.decision !== expected) {
      errors.push(
        `${prop.file}: status '${prop.data.status}' does not agree with ruling.decision '${ruling.decision}'.`,
      );
    }
  }

  return errors;
}
