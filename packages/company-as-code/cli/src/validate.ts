import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { loadCorpus, loadSchemas, schemaFor, type RepoCorpus } from "./loader.js";

export interface ValidationProblem {
  file: string;
  kind: string;
  errors: string[];
}

export function buildAjv(schemas: Record<string, unknown>) {
  // `strict: true` surfaces ambiguous / non-portable schema constructs at load
  // time. The framework treats schema warnings as defects.
  //
  // `allowUnionTypes: true` is intentional — several primitives carry fields
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

export async function validateCommand(): Promise<boolean> {
  const schemas = await loadSchemas();
  const corpus = await loadCorpus();
  const ajv = buildAjv(schemas);

  const problems = schemaValidate(corpus, ajv);
  const totalDocs = Object.values(corpus).reduce((sum, arr) => sum + arr.length, 0);
  const crossErrors = crossDocumentChecks(corpus);

  if (problems.length === 0 && crossErrors.length === 0) {
    console.log(`✓ validate: ${totalDocs} document(s) OK across ${Object.keys(corpus).length} primitive(s).`);
    return true;
  }

  if (problems.length > 0) {
    console.error(`✗ schema errors in ${problems.length} document(s):`);
    for (const p of problems) {
      console.error(`  ${p.file} [${p.kind}]`);
      for (const e of p.errors) console.error(`    - ${e}`);
    }
  }
  if (crossErrors.length > 0) {
    console.error(`✗ cross-document discipline errors:`);
    for (const e of crossErrors) console.error(`  - ${e}`);
  }
  return false;
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
      errors.push(`${wf.file}: workflow declares hitl: true with trigger.kind=schedule — runtime would reject this.`);
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
  // (d) — every name in manifest.agents[] must have a standalone file under the same module.
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

  // 4. Initiative goals/metrics references should resolve.
  const goalIds = new Set(corpus.goals.map((g) => g.data.id));
  const metricIds = new Set(corpus.metrics.map((m) => m.data.id));
  for (const init of corpus.initiatives) {
    for (const g of init.data.goals ?? []) {
      if (!goalIds.has(g)) {
        errors.push(`${init.file}: references goal ${g} which is not defined under /company/goals.`);
      }
    }
    for (const m of init.data.metrics ?? []) {
      if (!metricIds.has(m)) {
        errors.push(`${init.file}: references metric ${m} which is not defined under /company/metrics.`);
      }
    }
  }
  for (const goal of corpus.goals) {
    const m = goal.data.metric;
    if (m && !metricIds.has(m)) {
      errors.push(`${goal.file}: references metric ${m} which is not defined under /company/metrics.`);
    }
  }

  // 5. Agent.skills references must resolve to a defined Skill.
  const skillNames = new Set(corpus.skills.map((s) => s.data.name));
  for (const agent of corpus.agents) {
    for (const s of (agent.data.skills ?? []) as string[]) {
      if (!skillNames.has(s)) {
        errors.push(`${agent.file}: agent references skill '${s}' which is not defined under /company/skills.`);
      }
    }
  }

  // 6. Skill.relatedSkills references must resolve.
  for (const skill of corpus.skills) {
    for (const r of (skill.data.relatedSkills ?? []) as string[]) {
      if (!skillNames.has(r)) {
        errors.push(`${skill.file}: relatedSkills includes '${r}' which is not defined under /company/skills.`);
      }
    }
  }

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

  return errors;
}
