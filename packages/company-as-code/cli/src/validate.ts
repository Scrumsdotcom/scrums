import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { loadCorpus, loadSchemas, schemaFor, type RepoCorpus } from "./loader.js";

export interface ValidationProblem {
  file: string;
  kind: string;
  errors: string[];
}

export function buildAjv(schemas: Record<string, unknown>) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
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

  // 3. Standalone agent files are the source of truth for escalation policy.
  //    Manifest-inline agent entries are summaries — the full escalation block
  //    lives in agents/<name>.yaml. Linkage between manifest entries and
  //    standalone files is not yet enforced here.

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

  return errors;
}
