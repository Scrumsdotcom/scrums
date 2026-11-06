/** Seeded generators for property tests and the fuzzer. Deterministic: a seed reproduces a failure. */
export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0 || 1;
  }
  /** xorshift32 */
  next(): number {
    let x = this.s;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.s = x >>> 0;
    return this.s / 0x100000000;
  }
  int(n: number): number {
    return Math.floor(this.next() * n);
  }
  pick<T>(xs: readonly T[]): T {
    return xs[this.int(xs.length)];
  }
}

export interface IntExpr {
  text: string;
  value: bigint;
}

/** A closed integer expression and its value under ordinary bigint arithmetic. */
export function intExpr(r: Rng, depth: number): IntExpr {
  if (depth <= 0 || r.int(4) === 0) {
    const v = BigInt(r.int(2001) - 1000);
    return { text: v.toString(), value: v };
  }
  switch (r.int(5)) {
    case 0: {
      const a = intExpr(r, depth - 1);
      const b = intExpr(r, depth - 1);
      return { text: `(add ${a.text} ${b.text})`, value: a.value + b.value };
    }
    case 1: {
      const a = intExpr(r, depth - 1);
      const b = intExpr(r, depth - 1);
      return { text: `(sub ${a.text} ${b.text})`, value: a.value - b.value };
    }
    case 2: {
      const a = intExpr(r, depth - 1);
      const b = intExpr(r, depth - 1);
      return { text: `(mul ${a.text} ${b.text})`, value: a.value * b.value };
    }
    case 3: {
      const a = intExpr(r, depth - 1);
      return { text: `(neg ${a.text})`, value: -a.value };
    }
    default: {
      const n = r.int(4);
      const items = Array.from({ length: n }, () => intExpr(r, depth - 1));
      const vec = items.reduceRight((acc, it) => `(cons ${it.text} ${acc})`, "nil");
      return { text: `(sum ${vec})`, value: items.reduce((s, it) => s + it.value, 0n) };
    }
  }
}

const ATOMS = ["U0", "N", "Z", "V", "S", "x", "xs", "n", "refl", "_", "=", "0", "1", "-3", "sum", "add", "cons", "nil", "pi", "lam", "sig", "pair", "fst", "snd", "case", "app", "@b0", "@a0", "c0", "f0", "o0"];

/** A random S-expression over the NTΔ vocabulary: often ill-typed, always lexically valid. */
export function sexp(r: Rng, depth: number): string {
  if (depth <= 0 || r.int(3) === 0) return r.pick(ATOMS);
  const n = 1 + r.int(4);
  return `(${Array.from({ length: n }, () => sexp(r, depth - 1)).join(" ")})`;
}

const FRAME_HEADS = ["c0", "c1", "f0", "f1", "put f0 c0 @b0", "put f1 c1 @b0", "ck f0 @a0", "ck f1 @a0", "get o0 64", "build @p0 @t0"];

/** A random stream mixing valid frames, random terms, and random bytes. */
export function stream(r: Rng): string {
  const lines: string[] = [];
  const n = 1 + r.int(8);
  for (let i = 0; i < n; i++) {
    const k = r.int(10);
    if (k < 6) {
      const h = r.pick(FRAME_HEADS);
      lines.push(h.includes(" ") ? h : `${h} ${sexp(r, 4)}`);
    } else if (k < 8) lines.push(sexp(r, 3));
    else lines.push(Array.from({ length: r.int(40) }, () => String.fromCharCode(r.int(0x3000))).join(""));
  }
  return lines.join(r.pick(["\n", "\r\n"]));
}

/** Mutate a valid stream at the token level: replace, drop, or duplicate one token. */
export function mutate(r: Rng, text: string): string {
  const toks = text.split(/(\s+|[()])/).filter((t) => t !== "");
  const atomIx = toks.map((t, i) => (/^[^\s()]+$/.test(t) && !t.startsWith(";") ? i : -1)).filter((i) => i >= 0);
  const edits = 1 + r.int(3);
  for (let e = 0; e < edits && atomIx.length; e++) {
    const i = r.pick(atomIx);
    switch (r.int(3)) {
      case 0:
        toks[i] = r.pick(ATOMS);
        break;
      case 1:
        toks[i] = "";
        break;
      default:
        toks[i] = `${toks[i]} ${toks[i]}`;
    }
  }
  return toks.join("");
}
