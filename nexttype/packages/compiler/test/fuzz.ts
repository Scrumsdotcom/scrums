/**
 * Long-running fuzzer: random streams against the checker. Run with
 *   npm run fuzz            (NT_FUZZ_RUNS, default 20000; NT_FUZZ_SEED, default time-based)
 * Exits 1 and prints the seed and the input on the first property violation.
 */
import { checkStream, manifestFromContext } from "../src/index.js";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Rng, mutate, stream } from "./gen.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const corpus: string[] = [];
for (const area of ["accept", "reject", "policy"]) {
  const dir = join(root, "conformance", area);
  for (const f of readdirSync(dir)) if (f.endsWith(".ntd")) corpus.push(readFileSync(join(dir, f), "utf8").replace(/^;.*\n/gm, ""));
}

const runs = Number(process.env.NT_FUZZ_RUNS ?? 20000);
const seed = Number(process.env.NT_FUZZ_SEED ?? Date.now() % 0xffffffff);
const manifests = [manifestFromContext(""), manifestFromContext("A:U0, n:N, xs:V Z n, v:V A (S n), x:Z, d:A")];
const r = new Rng(seed);
const counts: Record<string, number> = {};
for (let i = 0; i < runs; i++) {
  const text = r.int(2) === 0 ? stream(r) : mutate(r, r.pick(corpus));
  for (const m of manifests) {
    let out;
    try {
      out = checkStream(text, m);
    } catch (e) {
      console.error(`fuzz: checkStream threw (seed ${seed}, run ${i})\n${JSON.stringify(text)}\n${(e as Error).stack}`);
      process.exit(1);
    }
    for (const d of out.diagnostics) {
      counts[`${d.result} ${d.code}`] = (counts[`${d.result} ${d.code}`] ?? 0) + 1;
      if (d.code === "KERNEL") {
        console.error(`fuzz: KERNEL diagnostic (seed ${seed}, run ${i})\n${JSON.stringify(text)}\n${d.message}`);
        process.exit(1);
      }
    }
  }
}
console.log(`fuzz: ${runs} streams, seed ${seed}, no violations`);
for (const [k, v] of Object.entries(counts).sort()) console.log(`  ${k}: ${v}`);
