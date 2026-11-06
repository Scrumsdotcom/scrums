/**
 * NT0: the core calculus. Terms use de Bruijn indices; values use de Bruijn
 * levels. Evaluation is normalization by evaluation with a step budget.
 *
 * The core is total by construction: there is no general recursion, every
 * primitive terminates, and universes are stratified (U0 : U1, never
 * U0 : U0). Every evaluation step consumes fuel, so a large input reaches
 * a resource diagnostic rather than an unbounded computation.
 */
import { Fuel } from "./limits.js";

export type Tm =
  | { t: "var"; ix: number }
  | { t: "const"; name: string }
  | { t: "meta"; id: number }
  | { t: "U"; l: number }
  | { t: "pi"; x: string; a: Tm; b: Tm }
  | { t: "lam"; x: string; b: Tm }
  | { t: "app"; f: Tm; a: Tm }
  | { t: "sig"; x: string; a: Tm; b: Tm }
  | { t: "pair"; a: Tm; b: Tm }
  | { t: "fst"; p: Tm }
  | { t: "snd"; p: Tm }
  | { t: "eq"; A: Tm; a: Tm; b: Tm }
  | { t: "refl" }
  | { t: "nat"; n: bigint }
  | { t: "int"; n: bigint }
  | { t: "case"; s: Tm; motive: Tm; branches: Branch[] };

/** A vector case branch. `nil` binds nothing; `cons` binds index, head, tail. */
export interface Branch {
  ctor: "nil" | "cons";
  names: string[];
  body: Tm;
}

export interface Clo {
  env: Val[];
  body: Tm;
}

export type Head =
  | { h: "var"; lvl: number }
  | { h: "meta"; id: number }
  | { h: "const"; name: string }
  | { h: "prim"; name: string; args: Val[] };

export type Elim =
  | { e: "app"; a: Val }
  | { e: "fst" }
  | { e: "snd" }
  | { e: "case"; env: Val[]; motive: Tm; branches: Branch[] };

export type Val =
  | { v: "U"; l: number }
  | { v: "pi"; x: string; a: Val; b: Clo }
  | { v: "lam"; x: string; b: Clo }
  | { v: "sig"; x: string; a: Val; b: Clo }
  | { v: "pair"; a: Val; b: Val }
  | { v: "eq"; A: Val; a: Val; b: Val }
  | { v: "refl" }
  | { v: "nat"; n: bigint }
  | { v: "int"; n: bigint }
  | { v: "con"; name: string; args: Val[] }
  | { v: "pap"; name: string; args: Val[] }
  | { v: "ne"; head: Head; spine: Elim[] };

export type GlobalKind = "tycon" | "ctor" | "prim" | "opaque";

export interface Global {
  name: string;
  kind: GlobalKind;
  /** Number of arguments a tycon, ctor, or prim takes before it computes. */
  arity: number;
  /** Number of leading arguments that the elaborator inserts as implicit. */
  implicit: number;
  type: Val;
  typeTm: Tm;
}

export const vVar = (lvl: number): Val => ({ v: "ne", head: { h: "var", lvl }, spine: [] });

export class Machine {
  readonly metas: (Val | undefined)[] = [];
  constructor(
    readonly globals: Map<string, Global>,
    readonly fuel: Fuel,
  ) {}

  freshMeta(): number {
    this.metas.push(undefined);
    return this.metas.length - 1;
  }

  // ---------------------------------------------------------------- eval

  eval(env: Val[], tm: Tm): Val {
    this.fuel.tick();
    switch (tm.t) {
      case "var": {
        const v = env[env.length - 1 - tm.ix];
        if (v === undefined) throw new Error(`internal: unbound index ${tm.ix}`);
        return v;
      }
      case "const":
        return this.evalConst(tm.name);
      case "meta":
        return this.metas[tm.id] ?? { v: "ne", head: { h: "meta", id: tm.id }, spine: [] };
      case "U":
        return { v: "U", l: tm.l };
      case "pi":
        return { v: "pi", x: tm.x, a: this.eval(env, tm.a), b: { env, body: tm.b } };
      case "lam":
        return { v: "lam", x: tm.x, b: { env, body: tm.b } };
      case "app":
        return this.apply(this.eval(env, tm.f), this.eval(env, tm.a));
      case "sig":
        return { v: "sig", x: tm.x, a: this.eval(env, tm.a), b: { env, body: tm.b } };
      case "pair":
        return { v: "pair", a: this.eval(env, tm.a), b: this.eval(env, tm.b) };
      case "fst":
        return this.fst(this.eval(env, tm.p));
      case "snd":
        return this.snd(this.eval(env, tm.p));
      case "eq":
        return { v: "eq", A: this.eval(env, tm.A), a: this.eval(env, tm.a), b: this.eval(env, tm.b) };
      case "refl":
        return { v: "refl" };
      case "nat":
        return { v: "nat", n: tm.n };
      case "int":
        return { v: "int", n: tm.n };
      case "case":
        return this.caseOf(this.eval(env, tm.s), env, tm.motive, tm.branches);
    }
  }

  inst(c: Clo, v: Val): Val {
    return this.eval([...c.env, v], c.body);
  }

  evalConst(name: string): Val {
    const g = this.globals.get(name);
    if (!g) throw new Error(`internal: unknown constant ${name}`);
    if (g.kind === "opaque") return { v: "ne", head: { h: "const", name }, spine: [] };
    if (g.arity === 0) return this.saturate(name, []);
    return { v: "pap", name, args: [] };
  }

  force(v: Val): Val {
    while (v.v === "ne" && v.head.h === "meta") {
      const sol = this.metas[v.head.id];
      if (!sol) return v;
      v = v.spine.reduce<Val>((acc, el) => this.elim(acc, el), sol);
    }
    return v;
  }

  private elim(v: Val, el: Elim): Val {
    switch (el.e) {
      case "app":
        return this.apply(v, el.a);
      case "fst":
        return this.fst(v);
      case "snd":
        return this.snd(v);
      case "case":
        return this.caseOf(v, el.env, el.motive, el.branches);
    }
  }

  apply(f: Val, a: Val): Val {
    this.fuel.tick();
    f = this.force(f);
    switch (f.v) {
      case "lam":
        return this.inst(f.b, a);
      case "pap": {
        const args = [...f.args, a];
        const g = this.globals.get(f.name)!;
        return args.length === g.arity ? this.saturate(f.name, args) : { v: "pap", name: f.name, args };
      }
      case "ne":
        return { v: "ne", head: f.head, spine: [...f.spine, { e: "app", a }] };
      default:
        throw new Error(`internal: cannot apply a ${f.v} value`);
    }
  }

  fst(p: Val): Val {
    p = this.force(p);
    if (p.v === "pair") return p.a;
    if (p.v === "ne") return { v: "ne", head: p.head, spine: [...p.spine, { e: "fst" }] };
    throw new Error(`internal: fst of a ${p.v} value`);
  }

  snd(p: Val): Val {
    p = this.force(p);
    if (p.v === "pair") return p.b;
    if (p.v === "ne") return { v: "ne", head: p.head, spine: [...p.spine, { e: "snd" }] };
    throw new Error(`internal: snd of a ${p.v} value`);
  }

  caseOf(s: Val, env: Val[], motive: Tm, branches: Branch[]): Val {
    s = this.force(s);
    if (s.v === "con" && (s.name === "nil" || s.name === "cons")) {
      const br = branches.find((b) => b.ctor === s.name);
      if (!br) throw new Error(`internal: no ${s.name} branch`);
      // cons args are [A, n, head, tail]; the branch binds [n, head, tail].
      const bound = s.name === "cons" ? s.args.slice(1) : [];
      return this.eval([...env, ...bound], br.body);
    }
    if (s.v === "ne") return { v: "ne", head: s.head, spine: [...s.spine, { e: "case", env, motive, branches }] };
    throw new Error(`internal: case on a ${s.v} value`);
  }

  /** Apply a fully applied type constructor, data constructor, or primitive. */
  saturate(name: string, args: Val[]): Val {
    this.fuel.tick();
    const g = this.globals.get(name)!;
    if (g.kind === "tycon" || g.kind === "ctor") {
      if (name === "S") {
        const n = this.force(args[0]);
        if (n.v === "nat") return { v: "nat", n: this.fuel.checkInt(n.n + 1n) };
        return { v: "con", name, args: [n] };
      }
      return { v: "con", name, args };
    }
    const vs = args.map((a) => this.force(a));
    const stuck = (): Val => ({ v: "ne", head: { h: "prim", name, args: vs }, spine: [] });
    const ints = (k: number) => vs.slice(0, k).every((x) => x.v === "int");
    const n = (i: number) => (vs[i] as { n: bigint }).n;
    switch (name) {
      case "add":
        return ints(2) ? { v: "int", n: this.fuel.checkInt(n(0) + n(1)) } : stuck();
      case "sub":
        return ints(2) ? { v: "int", n: this.fuel.checkInt(n(0) - n(1)) } : stuck();
      case "mul":
        return ints(2) ? { v: "int", n: this.fuel.checkInt(n(0) * n(1)) } : stuck();
      case "neg":
        return ints(1) ? { v: "int", n: -n(0) } : stuck();
      case "int": {
        const m = vs[0];
        if (m.v === "nat") return { v: "int", n: m.n };
        return stuck();
      }
      case "sum": {
        // sum {n} xs: unfold structurally so that sum (cons h t) = add h (sum t).
        const xs = vs[1];
        if (xs.v === "con" && xs.name === "nil") return { v: "int", n: 0n };
        if (xs.v === "con" && xs.name === "cons") {
          const [, m, h, t] = xs.args;
          return this.saturate("add", [h, this.saturate("sum", [m, t])]);
        }
        return stuck();
      }
      default:
        throw new Error(`internal: primitive ${name} has no rule`);
    }
  }

  // --------------------------------------------------------------- quote

  quote(lvl: number, v: Val): Tm {
    this.fuel.tick();
    v = this.force(v);
    switch (v.v) {
      case "U":
        return { t: "U", l: v.l };
      case "pi":
        return { t: "pi", x: v.x, a: this.quote(lvl, v.a), b: this.quote(lvl + 1, this.inst(v.b, vVar(lvl))) };
      case "lam":
        return { t: "lam", x: v.x, b: this.quote(lvl + 1, this.inst(v.b, vVar(lvl))) };
      case "sig":
        return { t: "sig", x: v.x, a: this.quote(lvl, v.a), b: this.quote(lvl + 1, this.inst(v.b, vVar(lvl))) };
      case "pair":
        return { t: "pair", a: this.quote(lvl, v.a), b: this.quote(lvl, v.b) };
      case "eq":
        return { t: "eq", A: this.quote(lvl, v.A), a: this.quote(lvl, v.a), b: this.quote(lvl, v.b) };
      case "refl":
        return { t: "refl" };
      case "nat":
        return { t: "nat", n: v.n };
      case "int":
        return { t: "int", n: v.n };
      case "con":
      case "pap":
        return v.args.reduce<Tm>((f, a) => ({ t: "app", f, a: this.quote(lvl, a) }), { t: "const", name: v.name });
      case "ne": {
        let head: Tm;
        const h = v.head;
        if (h.h === "var") head = { t: "var", ix: lvl - h.lvl - 1 };
        else if (h.h === "meta") head = { t: "meta", id: h.id };
        else if (h.h === "const") head = { t: "const", name: h.name };
        else head = h.args.reduce<Tm>((f, a) => ({ t: "app", f, a: this.quote(lvl, a) }), { t: "const", name: h.name });
        return v.spine.reduce<Tm>((acc, el) => {
          switch (el.e) {
            case "app":
              return { t: "app", f: acc, a: this.quote(lvl, el.a) };
            case "fst":
              return { t: "fst", p: acc };
            case "snd":
              return { t: "snd", p: acc };
            case "case":
              return {
                t: "case",
                s: acc,
                motive: this.quote(lvl, this.eval(el.env, el.motive)),
                branches: el.branches.map((br) => {
                  const k = br.names.length;
                  const vars = Array.from({ length: k }, (_, i) => vVar(lvl + i));
                  return { ctor: br.ctor, names: br.names, body: this.quote(lvl + k, this.eval([...el.env, ...vars], br.body)) };
                }),
              };
          }
        }, head);
      }
    }
  }

  nf(env: Val[], tm: Tm): Tm {
    return this.quote(env.length, this.eval(env, tm));
  }

  // ----------------------------------------------------------- conversion

  /** Definitional equality. Solves unsolved first-order metas on the way. */
  conv(lvl: number, a: Val, b: Val): boolean {
    this.fuel.tick();
    a = this.force(a);
    b = this.force(b);
    if (a.v === "ne" && a.head.h === "meta" && a.spine.length === 0) return this.solve(a.head.id, b);
    if (b.v === "ne" && b.head.h === "meta" && b.spine.length === 0) return this.solve(b.head.id, a);
    const fresh = vVar(lvl);
    if (a.v === "lam" || b.v === "lam" || (a.v === "pap" && b.v !== "pap") || (b.v === "pap" && a.v !== "pap")) {
      if (isFunctionLike(a) && isFunctionLike(b)) return this.conv(lvl + 1, this.apply(a, fresh), this.apply(b, fresh));
      return false;
    }
    if (a.v === "pair" || b.v === "pair") {
      if ((a.v === "pair" || a.v === "ne") && (b.v === "pair" || b.v === "ne")) {
        return this.conv(lvl, this.fst(a), this.fst(b)) && this.conv(lvl, this.snd(a), this.snd(b));
      }
      return false;
    }
    if (a.v === "nat" && b.v === "con" && b.name === "S") return a.n > 0n && this.conv(lvl, { v: "nat", n: a.n - 1n }, b.args[0]);
    if (b.v === "nat" && a.v === "con" && a.name === "S") return this.conv(lvl, b, a);
    if (a.v === "ne" && b.v === "ne") {
      // Eta for case on a neutral: only identical eliminations are equal.
      return this.convHead(lvl, a.head, b.head) && a.spine.length === b.spine.length && a.spine.every((el, i) => this.convElim(lvl, el, b.spine[i]));
    }
    if (a.v !== b.v) return false;
    switch (a.v) {
      case "U":
        return a.l === (b as typeof a).l;
      case "pi":
      case "sig": {
        const bb = b as typeof a;
        return this.conv(lvl, a.a, bb.a) && this.conv(lvl + 1, this.inst(a.b, fresh), this.inst(bb.b, fresh));
      }
      case "eq": {
        const bb = b as typeof a;
        return this.conv(lvl, a.A, bb.A) && this.conv(lvl, a.a, bb.a) && this.conv(lvl, a.b, bb.b);
      }
      case "refl":
        return true;
      case "nat":
      case "int":
        return a.n === (b as typeof a).n;
      case "con":
      case "pap": {
        const bb = b as typeof a;
        return a.name === bb.name && a.args.length === bb.args.length && a.args.every((x, i) => this.conv(lvl, x, bb.args[i]));
      }
      default:
        return false;
    }
  }

  private convHead(lvl: number, a: Head, b: Head): boolean {
    if (a.h !== b.h) return false;
    switch (a.h) {
      case "var":
        return a.lvl === (b as typeof a).lvl;
      case "meta":
        return a.id === (b as typeof a).id;
      case "const":
        return a.name === (b as typeof a).name;
      case "prim": {
        const bb = b as typeof a;
        return a.name === bb.name && a.args.every((x, i) => this.conv(lvl, x, bb.args[i]));
      }
    }
  }

  private convElim(lvl: number, a: Elim, b: Elim): boolean {
    if (a.e !== b.e) return false;
    if (a.e === "app") return this.conv(lvl, a.a, (b as typeof a).a);
    if (a.e === "case") {
      const bb = b as typeof a;
      if (a.branches.length !== bb.branches.length) return false;
      return a.branches.every((br) => {
        const other = bb.branches.find((x) => x.ctor === br.ctor);
        if (!other) return false;
        const k = br.names.length;
        const vars = Array.from({ length: k }, (_, j) => vVar(lvl + j));
        return this.conv(lvl + k, this.eval([...a.env, ...vars], br.body), this.eval([...bb.env, ...vars], other.body));
      });
    }
    return true;
  }

  private solve(id: number, v: Val): boolean {
    if (v.v === "ne" && v.head.h === "meta" && v.head.id === id && v.spine.length === 0) return true;
    if (this.occurs(id, v)) return false;
    this.metas[id] = v;
    return true;
  }

  private occurs(id: number, v: Val): boolean {
    v = this.force(v);
    const any = (xs: Val[]) => xs.some((x) => this.occurs(id, x));
    switch (v.v) {
      case "ne":
        if (v.head.h === "meta" && v.head.id === id) return true;
        if (v.head.h === "prim" && any(v.head.args)) return true;
        return v.spine.some((el) => el.e === "app" && this.occurs(id, el.a));
      case "con":
      case "pap":
        return any(v.args);
      case "pair":
        return any([v.a, v.b]);
      case "eq":
        return any([v.A, v.a, v.b]);
      case "pi":
      case "sig":
        return this.occurs(id, v.a) || this.occursTm(id, v.b.body) || any(v.b.env);
      case "lam":
        return this.occursTm(id, v.b.body) || any(v.b.env);
      default:
        return false;
    }
  }

  private occursTm(id: number, tm: Tm): boolean {
    return JSON.stringify(tm, bigintReplacer).includes(`"t":"meta","id":${id}}`);
  }

  /** Replace every solved meta in a term. Unsolved metas are returned. */
  zonk(tm: Tm, depth: number, unsolved: Set<number>): Tm {
    const go = (t: Tm, d: number): Tm => {
      switch (t.t) {
        case "meta": {
          const sol = this.metas[t.id];
          if (!sol) {
            unsolved.add(t.id);
            return t;
          }
          return go(this.quote(d, sol), d);
        }
        case "pi":
        case "sig":
          return { ...t, a: go(t.a, d), b: go(t.b, d + 1) };
        case "lam":
          return { ...t, b: go(t.b, d + 1) };
        case "app":
          return { t: "app", f: go(t.f, d), a: go(t.a, d) };
        case "pair":
          return { t: "pair", a: go(t.a, d), b: go(t.b, d) };
        case "fst":
        case "snd":
          return { t: t.t, p: go(t.p, d) };
        case "eq":
          return { t: "eq", A: go(t.A, d), a: go(t.a, d), b: go(t.b, d) };
        case "case":
          return {
            t: "case",
            s: go(t.s, d),
            motive: go(t.motive, d),
            branches: t.branches.map((br) => ({ ...br, body: go(br.body, d + br.names.length) })),
          };
        default:
          return t;
      }
    };
    return go(tm, depth);
  }
}

function isFunctionLike(v: Val): boolean {
  return v.v === "lam" || v.v === "pap" || v.v === "ne";
}

export function bigintReplacer(_k: string, v: unknown): unknown {
  return typeof v === "bigint" ? v.toString() : v;
}

/** True when a value is closed and canonical: no variables, metas, or stuck terms. */
export function isClosedCanonical(m: Machine, v: Val): boolean {
  v = m.force(v);
  switch (v.v) {
    case "nat":
    case "int":
    case "refl":
      return true;
    case "con":
      return v.args.every((a) => isClosedCanonical(m, a));
    case "pair":
      return isClosedCanonical(m, v.a) && isClosedCanonical(m, v.b);
    default:
      return false;
  }
}

/** Canonical NT0 text: names erased, de Bruijn indices. Used for digests. */
export function canonical(tm: Tm): string {
  switch (tm.t) {
    case "var":
      return `#${tm.ix}`;
    case "const":
      return `$${tm.name}`;
    case "meta":
      throw new Error("internal: canonical form of an unsolved meta");
    case "U":
      return `U${tm.l}`;
    case "pi":
    case "sig":
      return `(${tm.t} ${canonical(tm.a)} ${canonical(tm.b)})`;
    case "lam":
      return `(lam ${canonical(tm.b)})`;
    case "app":
      return `(app ${canonical(tm.f)} ${canonical(tm.a)})`;
    case "pair":
      return `(pair ${canonical(tm.a)} ${canonical(tm.b)})`;
    case "fst":
    case "snd":
      return `(${tm.t} ${canonical(tm.p)})`;
    case "eq":
      return `(= ${canonical(tm.A)} ${canonical(tm.a)} ${canonical(tm.b)})`;
    case "refl":
      return "refl";
    case "nat":
      return `n${tm.n}`;
    case "int":
      return `z${tm.n}`;
    case "case":
      return `(case ${canonical(tm.s)} ${canonical(tm.motive)} ${tm.branches
        .slice()
        .sort((x, y) => x.ctor.localeCompare(y.ctor))
        .map((b) => `(${b.ctor} ${canonical(b.body)})`)
        .join(" ")})`;
  }
}

/** Does de Bruijn index `ix` (relative to the term's root) occur in `tm`? */
export function mentions(tm: Tm, ix: number): boolean {
  switch (tm.t) {
    case "var":
      return tm.ix === ix;
    case "pi":
    case "sig":
      return mentions(tm.a, ix) || mentions(tm.b, ix + 1);
    case "lam":
      return mentions(tm.b, ix + 1);
    case "app":
      return mentions(tm.f, ix) || mentions(tm.a, ix);
    case "pair":
      return mentions(tm.a, ix) || mentions(tm.b, ix);
    case "fst":
    case "snd":
      return mentions(tm.p, ix);
    case "eq":
      return mentions(tm.A, ix) || mentions(tm.a, ix) || mentions(tm.b, ix);
    case "case":
      return mentions(tm.s, ix) || mentions(tm.motive, ix) || tm.branches.some((b) => mentions(b.body, ix + b.names.length));
    default:
      return false;
  }
}

/**
 * Print a core term in NTΔ surface syntax. `names` lists the context, outermost first.
 * Implicit arguments of constants are hidden, so the output reads back to the same term.
 */
export function printTm(tm: Tm, names: string[], implicitOf: (name: string) => number = () => 0): string {
  const fresh = (x: string, ns: string[]): string => {
    if (x === "_" || !ns.includes(x)) return x;
    const base = x.replace(/[0-9]+$/, "") || "x";
    for (let i = 1; ; i++) if (!ns.includes(`${base}${i}`)) return `${base}${i}`;
  };
  const go = (t: Tm, ns: string[]): string => {
    switch (t.t) {
      case "var":
        return ns[ns.length - 1 - t.ix] ?? `#${t.ix}`;
      case "const":
        return t.name;
      case "meta":
        return `?${t.id}`;
      case "U":
        return `U${t.l}`;
      case "pi":
      case "sig": {
        const x = fresh(t.x, ns);
        return `(${t.t} ${x} ${go(t.a, ns)} ${go(t.b, [...ns, x])})`;
      }
      case "lam": {
        const x = fresh(t.x, ns);
        return `(lam ${x} ${go(t.b, [...ns, x])})`;
      }
      case "app": {
        const args: Tm[] = [];
        let f: Tm = t;
        while (f.t === "app") {
          args.unshift(f.a);
          f = f.f;
        }
        const shown = f.t === "const" ? args.slice(implicitOf(f.name)) : args;
        if (shown.length === 0) return go(f, ns);
        return `(${[go(f, ns), ...shown.map((a) => go(a, ns))].join(" ")})`;
      }
      case "pair":
        return `(pair ${go(t.a, ns)} ${go(t.b, ns)})`;
      case "fst":
      case "snd":
        return `(${t.t} ${go(t.p, ns)})`;
      case "eq":
        return `(= ${go(t.a, ns)} ${go(t.b, ns)})`;
      case "refl":
        return "refl";
      case "nat":
      case "int":
        return t.n.toString();
      case "case": {
        const brs = t.branches.map((br) => {
          if (br.ctor === "nil") return `(nil () ${go(br.body, ns)})`;
          const xs: string[] = [];
          for (const n of br.names) xs.push(fresh(n, [...ns, ...xs]));
          const body = go(br.body, [...ns, ...xs]);
          const showIndex = mentions(br.body, 2);
          return `(cons (${(showIndex ? xs : xs.slice(1)).join(" ")}) ${body})`;
        });
        return `(case ${go(t.s, ns)} ${brs.join(" ")})`;
      }
    }
  };
  return go(tm, names);
}
