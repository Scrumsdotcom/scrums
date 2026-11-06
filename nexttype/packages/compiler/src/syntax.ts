/**
 * The NTΔ text codec, version ntd/1: a bounded, line-oriented decoder and a
 * canonical printer. See docs/reference/grammar.md for the normative grammar.
 */
import { CheckError } from "./diagnostics.js";
import { Limits } from "./limits.js";

export type Sexp =
  | { k: "atom"; text: string; line: number; col: number }
  | { k: "list"; items: Sexp[]; line: number; col: number };

export type Frame =
  | { k: "contract"; slot: string; term: Sexp; line: number }
  | { k: "fragment"; slot: string; term: Sexp; line: number }
  | { k: "put"; fragment: string; contract: string; alias: string; line: number }
  | { k: "ck"; fragment: string; alias: string; line: number }
  | { k: "get"; obligation: string; budget: number; line: number }
  | { k: "build"; a: string; b: string; line: number }
  | { k: "run"; a: string; b: string; line: number }
  | { k: "result"; result: string; obligation: string; code: string; fragment: string; line: number }
  | { k: "ctx"; alias: string; line: number };

export const KEYWORDS = new Set(["pi", "lam", "app", "sig", "pair", "fst", "snd", "refl", "case"]);
export const CORE_CONSTANTS = new Set(["U0", "N", "Z", "V", "S"]);
export const COMMANDS = new Set(["put", "ck", "get", "build", "run", "ctx"]);
export const RESULT_WORDS = new Set(["proved", "refuted", "unknown", "unsupported", "invalid"]);

const NAME = /^[A-Za-z][A-Za-z0-9]*$/;
const NATURAL = /^(0|[1-9][0-9]*)$/;
const INTEGER = /^-[1-9][0-9]*$/;
const ALIAS = /^@[a-z](0|[1-9][0-9]*)$/;
const CODE = /^[A-Z]+$/;
export const CONTRACT_SLOT = /^c(0|[1-9][0-9]*)$/;
export const FRAGMENT_SLOT = /^f(0|[1-9][0-9]*)$/;
export const OBLIGATION_SLOT = /^o(0|[1-9][0-9]*)$/;

/** True for names that a program may not bind: keywords, slots, commands. */
export function isReserved(name: string): boolean {
  return (
    KEYWORDS.has(name) ||
    CORE_CONSTANTS.has(name) ||
    COMMANDS.has(name) ||
    RESULT_WORDS.has(name) ||
    /^[cfo](0|[1-9][0-9]*)$/.test(name) ||
    /^U[0-9]+$/.test(name)
  );
}

export function isName(text: string): boolean {
  return NAME.test(text);
}

// Bidirectional overrides and isolates can make text render differently
// from how it parses. They are rejected everywhere, comments included.
const BIDI = /[؜‎‏‪-‮⁦-⁩]/;
// C0 controls other than tab, LF and CR; DEL; C1 controls.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/;

/** Decode UTF-8 bytes strictly. Malformed sequences are an error. */
export function decodeUtf8(bytes: Uint8Array, limits: Limits): string {
  if (bytes.length > limits.maxInputBytes) {
    throw new CheckError("LIM", `input is ${bytes.length} bytes; the limit is ${limits.maxInputBytes}`, 1, 1);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new CheckError("SYN", "input is not valid UTF-8", 1, 1);
  }
}

function splitLines(text: string): string[] {
  const lines = text.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.map((l) => (l.endsWith("\r") ? l.slice(0, -1) : l));
}

function checkText(line: string, n: number): void {
  if (n === 1 && line.startsWith("﻿")) throw new CheckError("SYN", "a byte order mark is not allowed", 1, 1);
  const bidi = BIDI.exec(line);
  if (bidi) throw new CheckError("SYN", "bidirectional control characters are not allowed", n, bidi.index + 1);
  const ctl = CONTROL.exec(line);
  if (ctl) throw new CheckError("SYN", `control character U+${ctl[0].charCodeAt(0).toString(16).padStart(4, "0").toUpperCase()} is not allowed`, n, ctl.index + 1);
  const cr = line.indexOf("\r");
  if (cr >= 0) throw new CheckError("SYN", "a carriage return must end a line", n, cr + 1);
}

/** Strip a trailing comment. Returns the code part of the line. */
function codeOf(line: string): string {
  const i = line.indexOf(";");
  return i >= 0 ? line.slice(0, i) : line;
}

/** Parse the terms on one line. */
export function parseTerms(src: string, lineNo: number, limits: Limits, colOffset = 0): Sexp[] {
  const out: Sexp[] = [];
  const stack: { items: Sexp[]; line: number; col: number }[] = [];
  let nodes = 0;
  let i = 0;
  const bump = (col: number) => {
    if (++nodes > limits.maxNodes) throw new CheckError("LIM", `a frame may contain at most ${limits.maxNodes} nodes`, lineNo, col);
  };
  while (i < src.length) {
    const ch = src[i];
    const col = i + 1 + colOffset;
    if (ch === " " || ch === "\t") {
      i++;
      continue;
    }
    if (ch === "(") {
      if (stack.length >= limits.maxDepth) throw new CheckError("LIM", `nesting exceeds depth ${limits.maxDepth}`, lineNo, col);
      bump(col);
      stack.push({ items: [], line: lineNo, col });
      i++;
      continue;
    }
    if (ch === ")") {
      const top = stack.pop();
      if (!top) throw new CheckError("SYN", "unexpected ')'", lineNo, col);
      const node: Sexp = { k: "list", items: top.items, line: top.line, col: top.col };
      (stack.length ? stack[stack.length - 1].items : out).push(node);
      i++;
      continue;
    }
    let j = i;
    while (j < src.length && !" \t()".includes(src[j])) j++;
    const text = src.slice(i, j);
    if (!/^[\x21-\x7e]+$/.test(text)) throw new CheckError("SYN", `atom ${JSON.stringify(text)} contains a character outside printable ASCII`, lineNo, col);
    validateAtom(text, lineNo, col, limits);
    bump(col);
    (stack.length ? stack[stack.length - 1].items : out).push({ k: "atom", text, line: lineNo, col });
    i = j;
  }
  if (stack.length) {
    const top = stack[stack.length - 1];
    throw new CheckError("SYN", "'(' is not closed on this line", top.line, top.col);
  }
  return out;
}

function validateAtom(text: string, line: number, col: number, limits: Limits): void {
  if (text === "_" || text === "=") return;
  if (NATURAL.test(text) || INTEGER.test(text)) {
    const digits = text.replace("-", "").length;
    if (digits > limits.maxLiteralDigits) throw new CheckError("LIM", `a literal may have at most ${limits.maxLiteralDigits} digits`, line, col);
    return;
  }
  if (/^-?[0-9]+$/.test(text)) throw new CheckError("SYN", `numeric literal ${text} is not canonical (no leading zeros, no -0)`, line, col);
  if (NAME.test(text) || ALIAS.test(text)) return;
  if (text.startsWith("@")) throw new CheckError("ALIAS", `alias ${text} is malformed (expected @, one lowercase letter, digits)`, line, col);
  throw new CheckError("SYN", `unexpected token ${JSON.stringify(text)}`, line, col);
}

function atomText(s: Sexp | undefined): string | undefined {
  return s && s.k === "atom" ? s.text : undefined;
}

function expectArity(terms: Sexp[], n: number, form: string, line: number): void {
  if (terms.length !== n) throw new CheckError("SYN", `${form} takes ${n - 1} argument(s), found ${terms.length - 1}`, line, terms[0]?.col ?? 1);
}

function expectAtom(s: Sexp, re: RegExp, what: string, code: "SYN" | "ALIAS" | "SLOT" = "SYN"): string {
  const t = atomText(s);
  if (t === undefined || !re.test(t)) throw new CheckError(code, `expected ${what}, found ${t === undefined ? "a list" : t}`, s.line, s.col);
  return t;
}

/** Parse one non-empty line into a frame. */
export function parseFrame(terms: Sexp[], line: number): Frame {
  const head = atomText(terms[0]);
  if (head === undefined) throw new CheckError("SYN", "a frame must start with a slot or a command", line, terms[0].col);
  if (CONTRACT_SLOT.test(head) || FRAGMENT_SLOT.test(head)) {
    if (terms.length !== 2) throw new CheckError("SYN", `slot definition ${head} takes exactly one term; wrap an application in parentheses`, line, terms[0].col);
    return { k: CONTRACT_SLOT.test(head) ? "contract" : "fragment", slot: head, term: terms[1], line };
  }
  switch (head) {
    case "put":
      expectArity(terms, 4, "put", line);
      return {
        k: "put",
        fragment: expectAtom(terms[1], FRAGMENT_SLOT, "a fragment slot", "SLOT"),
        contract: expectAtom(terms[2], CONTRACT_SLOT, "a contract slot", "SLOT"),
        alias: expectAtom(terms[3], ALIAS, "an alias", "ALIAS"),
        line,
      };
    case "ck":
      expectArity(terms, 3, "ck", line);
      return { k: "ck", fragment: expectAtom(terms[1], FRAGMENT_SLOT, "a fragment slot", "SLOT"), alias: expectAtom(terms[2], ALIAS, "an alias", "ALIAS"), line };
    case "get": {
      expectArity(terms, 3, "get", line);
      const obligation = expectAtom(terms[1], OBLIGATION_SLOT, "an obligation slot", "SLOT");
      const b = expectAtom(terms[2], NATURAL, "a natural budget");
      const budget = Number(b);
      if (!Number.isSafeInteger(budget) || budget <= 0) throw new CheckError("LIM", "the budget must be a positive integer", line, terms[2].col);
      return { k: "get", obligation, budget, line };
    }
    case "build":
    case "run":
      expectArity(terms, 3, head, line);
      return { k: head, a: expectAtom(terms[1], ALIAS, "an alias", "ALIAS"), b: expectAtom(terms[2], ALIAS, "an alias", "ALIAS"), line };
    case "ctx":
      expectArity(terms, 2, "ctx", line);
      return { k: "ctx", alias: expectAtom(terms[1], ALIAS, "an alias", "ALIAS"), line };
  }
  if (RESULT_WORDS.has(head)) {
    expectArity(terms, 4, head, line);
    return {
      k: "result",
      result: head,
      obligation: expectAtom(terms[1], OBLIGATION_SLOT, "an obligation slot", "SLOT"),
      code: expectAtom(terms[2], CODE, "an upper-case code"),
      fragment: expectAtom(terms[3], FRAGMENT_SLOT, "a fragment slot", "SLOT"),
      line,
    };
  }
  throw new CheckError("SYN", `unknown frame head ${JSON.stringify(head)}`, line, terms[0].col);
}

/** Decode a whole stream. Throws on the first decode error. */
export function decodeStream(text: string, limits: Limits): Frame[] {
  if (Buffer.byteLength(text, "utf8") > limits.maxInputBytes) {
    throw new CheckError("LIM", `input exceeds ${limits.maxInputBytes} bytes`, 1, 1);
  }
  const frames: Frame[] = [];
  const lines = splitLines(text);
  for (let n = 0; n < lines.length; n++) {
    const raw = lines[n];
    const lineNo = n + 1;
    checkText(raw, lineNo);
    if (Buffer.byteLength(raw, "utf8") > limits.maxFrameBytes) {
      throw new CheckError("LIM", `line exceeds ${limits.maxFrameBytes} bytes`, lineNo, 1);
    }
    const terms = parseTerms(codeOf(raw), lineNo, limits);
    if (terms.length === 0) continue;
    if (frames.length >= limits.maxFrames) throw new CheckError("LIM", `a stream may contain at most ${limits.maxFrames} frames`, lineNo, 1);
    frames.push(parseFrame(terms, lineNo));
  }
  return frames;
}

/** Parse a term body such as `V A (S n)`: one term, or several read as an application. */
export function parseBody(src: string, limits: Limits, line = 1): Sexp {
  checkText(src, line);
  if (src.includes("\n")) throw new CheckError("SYN", "a term must fit on one line", line, 1);
  const terms = parseTerms(codeOf(src), line, limits);
  if (terms.length === 0) throw new CheckError("SYN", "expected a term", line, 1);
  if (terms.length === 1) return terms[0];
  return { k: "list", items: terms, line, col: terms[0].col };
}

export function printSexp(s: Sexp): string {
  return s.k === "atom" ? s.text : `(${s.items.map(printSexp).join(" ")})`;
}

/** Print a frame in canonical form: single spaces, no comments. */
export function printFrame(f: Frame): string {
  switch (f.k) {
    case "contract":
    case "fragment":
      return `${f.slot} ${printSexp(f.term)}`;
    case "put":
      return `put ${f.fragment} ${f.contract} ${f.alias}`;
    case "ck":
      return `ck ${f.fragment} ${f.alias}`;
    case "get":
      return `get ${f.obligation} ${f.budget}`;
    case "build":
    case "run":
      return `${f.k} ${f.a} ${f.b}`;
    case "result":
      return `${f.result} ${f.obligation} ${f.code} ${f.fragment}`;
    case "ctx":
      return `ctx ${f.alias}`;
  }
}
