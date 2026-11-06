/**
 * Shared test harness: runs conformance cases and documentation examples.
 *
 * A case is an NTΔ stream with pragma comments:
 *   ; context: n:N, xs:V Z n          (or)  ; manifest: examples/invoice/manifest.json
 *   ; expect: proved o0 TY f0 @4      (result, obligation or -, code, fragment or -, @line)
 * The expected lines must match the diagnostics exactly and in order.
 *
 * A console block in the docs runs `ntc` commands:
 *   $ ntc eval '(add 2 3)'
 *   5 : Z
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { checkStream, loadManifest, manifestFromContext, Manifest } from "../src/index.js";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
export const CLI = resolve(dirname(fileURLToPath(import.meta.url)), "../src/cli.js");

export function walk(dir: string, ext: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, ext));
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

export function manifestFor(text: string): Manifest {
  const mf = /^; manifest: (.+)$/m.exec(text);
  if (mf) return loadManifest(JSON.parse(readFileSync(join(ROOT, mf[1].trim()), "utf8")));
  const cx = /^; context: (.+)$/m.exec(text);
  return manifestFromContext(cx ? cx[1] : "");
}

export function expected(text: string): string[] {
  return [...text.matchAll(/^; expect: (.+)$/gm)].map((m) => m[1].trim());
}

export function actual(text: string, manifest: Manifest = manifestFor(text)): string[] {
  const r = checkStream(text, manifest);
  return r.diagnostics.map((d) => `${d.result} ${d.obligation ?? "-"} ${d.code} ${d.fragment ?? "-"} @${d.line ?? 0}`);
}

export interface DocBlock {
  file: string;
  line: number;
  lang: string;
  body: string;
}

/** Extract fenced blocks with the given info strings from Markdown files. */
export function docBlocks(files: string[], langs: string[]): DocBlock[] {
  const out: DocBlock[] = [];
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const open = /^```([a-z-]+)\s*$/.exec(lines[i]);
      if (!open) continue;
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith("```")) j++;
      if (langs.includes(open[1])) out.push({ file, line: i + 1, lang: open[1], body: lines.slice(i + 1, j).join("\n") + "\n" });
      i = j;
    }
  }
  return out;
}

/** Split a shell-like argument string with single and double quotes. */
export function shellSplit(s: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q: string | null = null;
  let any = false;
  for (const ch of s) {
    if (q) {
      if (ch === q) q = null;
      else cur += ch;
    } else if (ch === "'" || ch === '"') {
      q = ch;
      any = true;
    } else if (ch === " ") {
      if (cur || any) out.push(cur);
      cur = "";
      any = false;
    } else cur += ch;
  }
  if (q) throw new Error(`unclosed quote in: ${s}`);
  if (cur || any) out.push(cur);
  return out;
}

/** Run each `$ ntc …` command of a console block; return [expected, actual] output. */
export function runConsole(body: string): { want: string; got: string }[] {
  const res: { want: string; got: string }[] = [];
  const lines = body.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("$ ")) continue;
    let cmd = lines[i].slice(2);
    let stdin: string | undefined;
    const pipe = /^printf '([^']*)' \| (.*)$/.exec(cmd);
    if (pipe) {
      stdin = pipe[1].replace(/\\n/g, "\n");
      cmd = pipe[2];
    }
    const argv = shellSplit(cmd);
    if (argv[0] !== "ntc") throw new Error(`console blocks may only run ntc: ${cmd}`);
    const want: string[] = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].startsWith("$ ")) want.push(lines[j++]);
    while (want.length && want[want.length - 1] === "") want.pop();
    const p = spawnSync(process.execPath, [CLI, ...argv.slice(1)], { cwd: ROOT, input: stdin ?? "", encoding: "utf8" });
    const got = (p.stdout + p.stderr).replace(/\n+$/, "");
    res.push({ want: want.join("\n"), got });
    i = j - 1;
  }
  return res;
}
