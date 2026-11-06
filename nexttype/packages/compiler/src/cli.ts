#!/usr/bin/env node
/**
 * ntc: the reference checker command line.
 *
 * ntc reads only the files named on its command line (or stdin), performs
 * no network access, starts no processes, and writes only to stdout and
 * stderr. All inputs are bounded by the limits in limits.ts.
 */
import { closeSync, fstatSync, openSync, readSync } from "node:fs";
import { CheckError } from "./diagnostics.js";
import { DEFAULT_LIMITS, ResourceError } from "./limits.js";
import { decodeUtf8, decodeStream, printFrame } from "./syntax.js";
import { MANIFEST_FORMAT, Manifest, RESULT_FORMAT, VERSION, checkStream, evaluate, formatResult, loadManifest, manifestFromContext } from "./session.js";
import { PRELUDE } from "./prelude.js";

const USAGE = `ntc ${VERSION} - NextType reference checker (NT0 core, NTΔ ${"ntd/1"})

Usage:
  ntc check [--manifest FILE | --context CTX] [--json] [FILE|-]
                     Check an NTΔ stream. Prints an NTΔ response stream,
                     or ${RESULT_FORMAT} JSON with --json.
  ntc eval [--manifest FILE | --context CTX] TERM
                     Elaborate TERM, re-check it, and print its normal form.
  ntc fmt [FILE|-]   Decode a stream and print it in canonical form.
  ntc prelude        List the built-in constants and their types.
  ntc limits         Print the input and resource limits.
  ntc version        Print the version.

CTX is a context such as "n:N, xs:V Z n". A manifest is ${MANIFEST_FORMAT} JSON.

Exit codes:
  0  every obligation is proved (check), or the command succeeded
  1  an obligation is not proved, or the input is invalid
  2  usage error, or a file cannot be read
`;

class UsageError extends Error {}

function readInput(path: string | undefined): string {
  const fd = path === undefined || path === "-" ? 0 : openSync(path, "r");
  try {
    if (fd !== 0) {
      const st = fstatSync(fd);
      if (!st.isFile()) throw new UsageError(`${path} is not a regular file`);
      if (st.size > DEFAULT_LIMITS.maxInputBytes) throw new CheckError("LIM", `${path} is ${st.size} bytes; the limit is ${DEFAULT_LIMITS.maxInputBytes}`);
    }
    const chunks: Buffer[] = [];
    let total = 0;
    const buf = Buffer.alloc(64 * 1024);
    for (;;) {
      let n: number;
      try {
        n = readSync(fd, buf, 0, buf.length, null);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "EAGAIN") continue;
        if ((e as NodeJS.ErrnoException).code === "EOF") break;
        throw e;
      }
      if (n === 0) break;
      total += n;
      if (total > DEFAULT_LIMITS.maxInputBytes) throw new CheckError("LIM", `input exceeds ${DEFAULT_LIMITS.maxInputBytes} bytes`);
      chunks.push(Buffer.from(buf.subarray(0, n)));
    }
    return decodeUtf8(Buffer.concat(chunks), DEFAULT_LIMITS);
  } finally {
    if (fd !== 0) closeSync(fd);
  }
}

interface Opts {
  manifest?: string;
  context?: string;
  json: boolean;
  rest: string[];
}

function parseOpts(args: string[]): Opts {
  const o: Opts = { json: false, rest: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--json") o.json = true;
    else if (a === "--manifest" || a === "--context") {
      const v = args[++i];
      if (v === undefined) throw new UsageError(`${a} needs a value`);
      if (a === "--manifest") o.manifest = v;
      else o.context = v;
    } else if (a.startsWith("--")) throw new UsageError(`unknown option ${a}`);
    else o.rest.push(a);
  }
  if (o.manifest !== undefined && o.context !== undefined) throw new UsageError("use --manifest or --context, not both");
  return o;
}

function manifestOf(o: Opts): Manifest {
  if (o.manifest !== undefined) {
    const text = readInput(o.manifest);
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new CheckError("MANIFEST", `${o.manifest} is not valid JSON`);
    }
    return loadManifest(json);
  }
  return manifestFromContext(o.context ?? "");
}

function main(argv: string[]): number {
  const [cmd, ...args] = argv;
  switch (cmd) {
    case "check": {
      const o = parseOpts(args);
      if (o.rest.length > 1) throw new UsageError("check takes at most one FILE");
      const manifest = manifestOf(o);
      const result = checkStream(readInput(o.rest[0]), manifest);
      process.stdout.write(o.json ? JSON.stringify(result, null, 2) + "\n" : formatResult(result));
      return result.ok ? 0 : 1;
    }
    case "eval": {
      const o = parseOpts(args);
      if (o.rest.length !== 1) throw new UsageError("eval takes exactly one TERM");
      const r = evaluate(o.rest[0], manifestOf(o));
      process.stdout.write(o.json ? JSON.stringify(r) + "\n" : `${r.value} : ${r.type}\n`);
      return 0;
    }
    case "fmt": {
      const o = parseOpts(args);
      if (o.rest.length > 1) throw new UsageError("fmt takes at most one FILE");
      const frames = decodeStream(readInput(o.rest[0]), DEFAULT_LIMITS);
      process.stdout.write(frames.map(printFrame).join("\n") + (frames.length ? "\n" : ""));
      return 0;
    }
    case "prelude":
      for (const p of PRELUDE) process.stdout.write(`${p.name} : ${p.type}${p.implicit ? `   ; ${p.implicit} implicit` : ""}\n    ${p.doc}\n`);
      return 0;
    case "limits":
      for (const [k, v] of Object.entries(DEFAULT_LIMITS)) process.stdout.write(`${k} ${v}\n`);
      return 0;
    case "version":
    case "--version":
      process.stdout.write(`ntc ${VERSION} (stream ntd/1, manifest ${MANIFEST_FORMAT}, result ${RESULT_FORMAT})\n`);
      return 0;
    case undefined:
    case "help":
    case "--help":
    case "-h":
      process.stdout.write(USAGE);
      return cmd === undefined ? 2 : 0;
    default:
      throw new UsageError(`unknown command ${JSON.stringify(cmd)}`);
  }
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (e) {
  if (e instanceof UsageError) {
    process.stderr.write(`ntc: ${e.message}\n\n${USAGE}`);
    process.exitCode = 2;
  } else if (e instanceof CheckError) {
    const at = e.line !== undefined ? `${e.line}:${e.col ?? 1}: ` : "";
    process.stderr.write(`ntc: ${at}${e.result} ${e.code}: ${e.message}\n`);
    process.exitCode = 1;
  } else if ((e as NodeJS.ErrnoException).code === "ENOENT" || (e as NodeJS.ErrnoException).code === "EACCES" || (e as NodeJS.ErrnoException).code === "EISDIR") {
    process.stderr.write(`ntc: ${(e as Error).message}\n`);
    process.exitCode = 2;
  } else if (e instanceof RangeError || e instanceof ResourceError) {
    process.stderr.write(`ntc: unknown RES: resource limit: ${e.message}\n`);
    process.exitCode = 1;
  } else {
    process.stderr.write(`ntc: internal error: ${(e as Error).stack ?? String(e)}\n`);
    process.exitCode = 70;
  }
}
