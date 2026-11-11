/**
 * Sessions: a manifest (constants, context, approved contracts, aliases)
 * and the processing of one NTΔ request stream against it.
 */
import { createHash } from "node:crypto";
import { CheckError, Code, Diagnostic, Result } from "./diagnostics.js";
import { Global, Machine, Tm, Val, canonical, printTm } from "./core.js";
import { Ctx, Elaborator, bind, emptyCtx } from "./check.js";
import { DEFAULT_LIMITS, Fuel, Limits, ResourceError, resolveLimits } from "./limits.js";
import { PRELUDE } from "./prelude.js";
import { Frame, Sexp, decodeStream, isName, isReserved, parseBody, printSexp } from "./syntax.js";

export const VERSION = "0.1.0";
export const MANIFEST_FORMAT = "nt-manifest/1";
export const STREAM_FORMAT = "ntd/1";
export const RESULT_FORMAT = "nt-result/1";

export interface ManifestJson {
  format: string;
  constants?: { name: string; type: string; implicit?: number }[];
  context?: { name: string; type: string }[];
  contracts?: Record<string, string>;
  aliases?: Record<string, string>;
}

export interface Manifest {
  globals: Map<string, Global>;
  ctx: Ctx;
  contracts: Map<string, { tm: Tm; text: string }>;
  aliases: Map<string, string>;
  baseDigest: string;
  approvalDigest: string;
  limits: Limits;
}

const sha256 = (s: string) => "sha256:" + createHash("sha256").update(s, "utf8").digest("hex");

function manifestError(msg: string): never {
  throw new CheckError("MANIFEST", msg);
}

function body(text: unknown, where: string, limits: Limits): Sexp {
  if (typeof text !== "string") manifestError(`${where} must be a string of NTΔ`);
  try {
    return parseBody(text, limits);
  } catch (e) {
    if (e instanceof CheckError) manifestError(`${where}: ${e.message}`);
    throw e;
  }
}

function rethrow(where: string, e: unknown): never {
  if (e instanceof CheckError) throw new CheckError(e.code === "KERNEL" ? "KERNEL" : "MANIFEST", `${where}: ${e.message}`);
  if (e instanceof ResourceError) throw new CheckError("RES", `${where}: ${e.message}`, undefined, undefined, "unknown");
  throw e;
}

/** The built-in constants, elaborated in order. */
export function preludeGlobals(): Map<string, Global> {
  const limits = DEFAULT_LIMITS;
  const globals = new Map<string, Global>();
  for (const p of PRELUDE) {
    const m = new Machine(globals, new Fuel(limits));
    const tm = new Elaborator(m).typeClosed(emptyCtx(), parseBody(p.type, limits));
    globals.set(p.name, { name: p.name, kind: p.kind, arity: p.arity, implicit: p.implicit, typeTm: tm, type: m.eval([], tm) });
  }
  return globals;
}

const MANIFEST_KEYS = new Set(["format", "constants", "context", "contracts", "aliases"]);

/** Validate and load a manifest. Every field is untrusted input. */
export function loadManifest(json: unknown, partialLimits?: Partial<Limits>): Manifest {
  const limits = resolveLimits(partialLimits);
  if (typeof json !== "object" || json === null || Array.isArray(json)) manifestError("the manifest must be a JSON object");
  const mj = json as Record<string, unknown>;
  for (const k of Object.keys(mj)) if (!MANIFEST_KEYS.has(k)) manifestError(`unknown manifest key ${JSON.stringify(k)}`);
  if (mj.format !== MANIFEST_FORMAT) manifestError(`format must be "${MANIFEST_FORMAT}"`);
  const constants = (mj.constants ?? []) as unknown;
  const context = (mj.context ?? []) as unknown;
  if (!Array.isArray(constants)) manifestError("constants must be an array");
  if (!Array.isArray(context)) manifestError("context must be an array");
  if (constants.length + context.length > limits.maxManifestEntries) manifestError(`a manifest may declare at most ${limits.maxManifestEntries} constants and context entries`);

  const globals = preludeGlobals();
  const baseLines: string[] = [];
  const checkName = (name: unknown, where: string): string => {
    if (typeof name !== "string" || !isName(name)) manifestError(`${where}: name must be a letter followed by letters or digits`);
    if (isReserved(name)) manifestError(`${where}: ${name} is reserved`);
    return name;
  };
  constants.forEach((c: unknown, i: number) => {
    const where = `constants[${i}]`;
    if (typeof c !== "object" || c === null || Array.isArray(c)) manifestError(`${where} must be an object`);
    const e = c as Record<string, unknown>;
    for (const k of Object.keys(e)) if (!["name", "type", "implicit"].includes(k)) manifestError(`${where}: unknown key ${JSON.stringify(k)}`);
    const name = checkName(e.name, where);
    if (globals.has(name)) manifestError(`${where}: ${name} is already defined`);
    const implicit = e.implicit ?? 0;
    if (!Number.isSafeInteger(implicit) || (implicit as number) < 0 || (implicit as number) > 16) manifestError(`${where}: implicit must be an integer from 0 to 16`);
    const m = new Machine(globals, new Fuel(limits));
    let tm: Tm;
    try {
      tm = new Elaborator(m).typeClosed(emptyCtx(), body(e.type, `${where}.type`, limits));
    } catch (err) {
      rethrow(`${where} (${name})`, err);
    }
    let ty: Val = m.eval([], tm);
    for (let k = 0; k < (implicit as number); k++) {
      const f = m.force(ty);
      if (f.v !== "pi") manifestError(`${where}: implicit is ${implicit}, but the type has only ${k} argument(s)`);
      ty = m.inst(f.b, { v: "ne", head: { h: "var", lvl: k }, spine: [] });
    }
    globals.set(name, { name, kind: "opaque", arity: 0, implicit: implicit as number, typeTm: tm, type: m.eval([], tm) });
    baseLines.push(`const ${name} ${implicit} ${canonical(tm)}`);
  });

  let ctx = emptyCtx();
  context.forEach((c: unknown, i: number) => {
    const where = `context[${i}]`;
    if (typeof c !== "object" || c === null || Array.isArray(c)) manifestError(`${where} must be an object`);
    const e = c as Record<string, unknown>;
    for (const k of Object.keys(e)) if (!["name", "type"].includes(k)) manifestError(`${where}: unknown key ${JSON.stringify(k)}`);
    const name = checkName(e.name, where);
    if (globals.has(name)) manifestError(`${where}: ${name} names a constant`);
    if (ctx.names.includes(name)) manifestError(`${where}: ${name} is already in the context`);
    const m = new Machine(globals, new Fuel(limits));
    let tm: Tm;
    try {
      tm = new Elaborator(m).typeClosed(ctx, body(e.type, `${where}.type`, limits));
    } catch (err) {
      rethrow(`${where} (${name})`, err);
    }
    ctx = bind(ctx, name, m.eval(ctx.env, tm));
    baseLines.push(`ctx ${name} ${canonical(tm)}`);
  });
  const baseDigest = sha256(`nt-base/1\n${baseLines.join("\n")}\n`);

  const contracts = new Map<string, { tm: Tm; text: string }>();
  const cj = mj.contracts ?? {};
  if (typeof cj !== "object" || cj === null || Array.isArray(cj)) manifestError("contracts must be an object");
  for (const [slot, text] of Object.entries(cj as Record<string, unknown>)) {
    if (!/^c(0|[1-9][0-9]*)$/.test(slot)) manifestError(`contracts: ${JSON.stringify(slot)} is not a contract slot`);
    const m = new Machine(globals, new Fuel(limits));
    try {
      const tm = new Elaborator(m).typeClosed(ctx, body(text, `contracts.${slot}`, limits));
      contracts.set(slot, { tm, text: text as string });
    } catch (err) {
      rethrow(`contracts.${slot}`, err);
    }
  }
  const approvalLines = [...contracts.entries()].sort(([a], [b]) => a.localeCompare(b, "en")).map(([slot, c]) => `${slot} ${canonical(c.tm)}`);
  const approvalDigest = sha256(`nt-approval/1\n${baseDigest}\n${approvalLines.join("\n")}\n`);

  const aliases = new Map<string, string>([
    ["@b0", baseDigest],
    ["@a0", approvalDigest],
  ]);
  const aj = mj.aliases ?? {};
  if (typeof aj !== "object" || aj === null || Array.isArray(aj)) manifestError("aliases must be an object");
  for (const [alias, digest] of Object.entries(aj as Record<string, unknown>)) {
    if (!/^@[a-z](0|[1-9][0-9]*)$/.test(alias)) manifestError(`aliases: ${JSON.stringify(alias)} is not an alias`);
    if (typeof digest !== "string" || !/^sha256:[0-9a-f]{64}$/.test(digest)) manifestError(`aliases.${alias} must be "sha256:" and 64 lowercase hex digits`);
    aliases.set(alias, digest);
  }
  return { globals, ctx, contracts, aliases, baseDigest, approvalDigest, limits };
}

/** A manifest with only a context, written as `name:type` entries separated by commas. */
export function manifestFromContext(context: string, partialLimits?: Partial<Limits>): Manifest {
  const entries = splitContext(context).map((e) => {
    const i = e.indexOf(":");
    if (i < 0) manifestError(`context entry ${JSON.stringify(e)} must have the form name:type`);
    return { name: e.slice(0, i).trim(), type: e.slice(i + 1).trim() };
  });
  return loadManifest({ format: MANIFEST_FORMAT, context: entries }, partialLimits);
}

function splitContext(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s.trim().replace(/^Γ\s*=\s*\{/, "").replace(/\}$/, "")) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

// ===================================================================== Stream

export interface ContextResponse {
  obligation: string;
  budget: number;
  text: string;
  omittedBytes: number;
}

export interface StreamResult {
  format: typeof RESULT_FORMAT;
  ok: boolean;
  diagnostics: Diagnostic[];
  contexts: ContextResponse[];
}

interface Obligation {
  slot: string;
  fragment: string;
  goal: string;
}

function diagFromError(e: unknown, extra: Partial<Diagnostic>): Diagnostic {
  if (e instanceof CheckError) {
    const d: Diagnostic = { result: e.result, code: e.code, message: e.message, ...extra };
    if (e.line !== undefined) d.line = e.line;
    if (e.col !== undefined) d.col = e.col;
    if (e.sides) d.sides = e.sides;
    return d;
  }
  if (e instanceof ResourceError) return { result: "unknown", code: "RES", message: e.message, ...extra };
  if (e instanceof RangeError) return { result: "unknown", code: "RES", message: `resource limit: ${e.message}`, ...extra };
  return { result: "invalid", code: "KERNEL", message: `internal error: ${(e as Error).message ?? String(e)}`, ...extra };
}

/** Check one NTΔ stream against a manifest. Never throws on bad input. */
export function checkStream(text: string, manifest: Manifest): StreamResult {
  const diagnostics: Diagnostic[] = [];
  const contexts: ContextResponse[] = [];
  const done = (): StreamResult => ({
    format: RESULT_FORMAT,
    ok: diagnostics.length > 0 && diagnostics.every((d) => d.result === "proved"),
    diagnostics,
    contexts,
  });
  let frames: Frame[];
  try {
    frames = decodeStream(text, manifest.limits);
  } catch (e) {
    diagnostics.push(diagFromError(e, {}));
    return done();
  }
  if (frames.length === 0) {
    diagnostics.push({ result: "invalid", code: "SYN", message: "the stream has no frames", line: 1, col: 1 });
    return done();
  }

  const contracts = new Map<string, { tm: Tm; line: number }>();
  const fragments = new Map<string, { term: Sexp; line: number }>();
  const puts = new Map<string, string>();
  const obligations = new Map<string, Obligation>();
  const names = manifest.ctx.names;
  const implicitOf = (n: string) => manifest.globals.get(n)?.implicit ?? 0;
  const stream = (code: Code, message: string, line: number, result: Result = "invalid", fragment?: string) => {
    const d: Diagnostic = { result, code, message, line, col: 1 };
    if (fragment) d.fragment = fragment;
    diagnostics.push(d);
  };
  for (const [slot, c] of manifest.contracts) contracts.set(slot, { tm: c.tm, line: 0 });

  for (const f of frames) {
    switch (f.k) {
      case "contract": {
        const m = new Machine(manifest.globals, new Fuel(manifest.limits));
        let tm: Tm;
        try {
          tm = new Elaborator(m).typeClosed(manifest.ctx, f.term);
        } catch (e) {
          diagnostics.push(diagFromError(e, { line: f.line }));
          continue;
        }
        const approved = manifest.contracts.get(f.slot);
        if (approved) {
          if (canonical(approved.tm) !== canonical(tm)) {
            stream("POLICY", `${f.slot} differs from the approved contract ${approved.text}; a contract change needs a new approval`, f.line);
          }
          continue;
        }
        if (contracts.has(f.slot)) {
          stream("SLOT", `${f.slot} is already defined; slots are immutable within a stream`, f.line);
          continue;
        }
        contracts.set(f.slot, { tm, line: f.line });
        break;
      }
      case "fragment":
        if (fragments.has(f.slot)) {
          stream("SLOT", `${f.slot} is already defined; slots are immutable within a stream`, f.line, "invalid", f.slot);
          continue;
        }
        fragments.set(f.slot, { term: f.term, line: f.line });
        break;
      case "put": {
        if (!fragments.has(f.fragment)) {
          stream("SLOT", `${f.fragment} is not defined`, f.line, "invalid", f.fragment);
          continue;
        }
        if (!contracts.has(f.contract)) {
          stream("SLOT", `${f.contract} is not defined`, f.line, "invalid", f.fragment);
          continue;
        }
        if (puts.has(f.fragment)) {
          stream("SLOT", `${f.fragment} is already put against ${puts.get(f.fragment)}`, f.line, "invalid", f.fragment);
          continue;
        }
        const digest = manifest.aliases.get(f.alias);
        if (!f.alias.startsWith("@b") || digest === undefined) {
          stream("ALIAS", `${f.alias} is not a base alias in this session`, f.line, "invalid", f.fragment);
          continue;
        }
        if (digest !== manifest.baseDigest) {
          stream("CONFLICT", `${f.alias} names base ${digest}, but the current base is ${manifest.baseDigest}; request a fresh manifest`, f.line, "invalid", f.fragment);
          continue;
        }
        puts.set(f.fragment, f.contract);
        break;
      }
      case "ck": {
        const contractSlot = puts.get(f.fragment);
        if (contractSlot === undefined) {
          stream("SLOT", `${f.fragment} has not been put; send put ${f.fragment} <contract> @b0 first`, f.line, "invalid", f.fragment);
          continue;
        }
        const digest = manifest.aliases.get(f.alias);
        if (!f.alias.startsWith("@a") || digest === undefined) {
          stream("ALIAS", `${f.alias} is not an approval alias in this session`, f.line, "invalid", f.fragment);
          continue;
        }
        if (digest !== manifest.approvalDigest) {
          stream("POLICY", `${f.alias} names approval ${digest}, but the session approval is ${manifest.approvalDigest}`, f.line, "invalid", f.fragment);
          continue;
        }
        const slot = `o${obligations.size}`;
        const contract = contracts.get(contractSlot)!;
        const frag = fragments.get(f.fragment)!;
        obligations.set(slot, { slot, fragment: f.fragment, goal: printTm(contract.tm, names, implicitOf) });
        const m = new Machine(manifest.globals, new Fuel(manifest.limits));
        try {
          const goal = m.eval(manifest.ctx.env, contract.tm);
          const tm = new Elaborator(m).checkClosed(manifest.ctx, frag.term, goal);
          const evidence = sha256(`nt-evidence/1\nntc ${VERSION}\n${manifest.approvalDigest}\n${contractSlot} ${canonical(contract.tm)}\n${f.fragment} ${canonical(tm)}\n`);
          diagnostics.push({ result: "proved", code: "TY", obligation: slot, fragment: f.fragment, line: frag.line, col: 1, message: `${f.fragment} has type ${contractSlot}`, evidence });
        } catch (e) {
          const d = diagFromError(e, { obligation: slot, fragment: f.fragment });
          if (d.line === undefined) {
            d.line = frag.line;
            d.col = 1;
          }
          diagnostics.push(d);
        }
        break;
      }
      case "get": {
        const o = obligations.get(f.obligation);
        if (!o) {
          stream("SLOT", `${f.obligation} is not an obligation in this stream`, f.line);
          continue;
        }
        if (f.budget > manifest.limits.maxGetBudget) {
          stream("LIM", `the budget may be at most ${manifest.limits.maxGetBudget}`, f.line);
          continue;
        }
        const lines = [`goal ${o.goal}`, ...names.map((n, i) => `${n} : ${printTm(manifest.ctx.types[i] ? new Machine(manifest.globals, new Fuel(manifest.limits)).quote(i, manifest.ctx.types[i]) : { t: "U", l: 0 }, names.slice(0, i), implicitOf)}`)];
        const full = lines.join("\n");
        let out = "";
        for (const l of lines) {
          const next = out ? `${out}\n${l}` : l;
          if (Buffer.byteLength(next, "utf8") > f.budget) break;
          out = next;
        }
        contexts.push({ obligation: f.obligation, budget: f.budget, text: out, omittedBytes: Buffer.byteLength(full, "utf8") - Buffer.byteLength(out, "utf8") });
        break;
      }
      case "build":
      case "run":
        stream("CMD", `${f.k} is not supported by the reference checker; it has no targets or runtime profiles`, f.line, "unsupported");
        break;
      case "result":
      case "ctx":
        stream("SYN", `${f.k === "ctx" ? "ctx" : f.result} is a response frame; it cannot appear in a request stream`, f.line);
        break;
    }
  }
  if (!diagnostics.some((d) => d.obligation !== undefined) && !diagnostics.some((d) => d.result !== "proved")) {
    diagnostics.push({ result: "invalid", code: "SLOT", message: "the stream has no ck frame, so nothing was checked", line: frames[frames.length - 1].line, col: 1 });
  }
  return done();
}

/** Print a result as an NTΔ response stream. */
export function formatResult(r: StreamResult): string {
  const out: string[] = [];
  for (const d of r.diagnostics) {
    if (d.obligation !== undefined && d.fragment !== undefined) {
      out.push(`${d.result} ${d.obligation} ${d.code} ${d.fragment}`);
      if (d.evidence) out.push(`; evidence ${d.evidence}`);
      if (d.result !== "proved") out.push(`; ${d.line ?? 0}:${d.col ?? 0} ${d.message}`);
    } else {
      out.push(`; ${d.line ?? 0}:${d.col ?? 0} ${d.result} ${d.code} ${d.message}`);
    }
  }
  for (const c of r.contexts) {
    for (const l of c.text.split("\n")) if (l) out.push(`; ${c.obligation} ${l}`);
    if (c.omittedBytes > 0) out.push(`; ${c.obligation} omitted ${c.omittedBytes} bytes (budget ${c.budget})`);
  }
  return out.join("\n") + "\n";
}

/** Evaluate a closed term (or a term over the manifest context) to normal form. */
export function evaluate(text: string, manifest: Manifest): { value: string; type: string } {
  const m = new Machine(manifest.globals, new Fuel(manifest.limits));
  const ctx = manifest.ctx;
  const { tm, ty } = new Elaborator(m).inferClosed(ctx, parseBody(text, manifest.limits));
  const implicitOf = (n: string) => manifest.globals.get(n)?.implicit ?? 0;
  return { value: printTm(m.nf(ctx.env, tm), ctx.names, implicitOf), type: printTm(m.nf(ctx.env, ty), ctx.names, implicitOf) };
}

export { printSexp };
