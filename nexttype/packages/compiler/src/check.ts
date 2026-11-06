/**
 * Elaboration (NTΔ surface -> NT0) and the kernel (an independent re-check
 * of the elaborated NT0 term). The elaborator resolves names, inserts and
 * solves implicit arguments, and checks types. The kernel trusts nothing
 * from the elaborator: it re-checks the zonked term from scratch. A
 * fragment is accepted only when both agree.
 */
import { CheckError, Code } from "./diagnostics.js";
import { Branch, Global, Machine, Tm, Val, isClosedCanonical, mentions, printTm, vVar } from "./core.js";
import { Sexp, isName, isReserved, KEYWORDS } from "./syntax.js";

export interface Ctx {
  names: string[];
  types: Val[];
  env: Val[];
}

export const emptyCtx = (): Ctx => ({ names: [], types: [], env: [] });

/** Extend with a fresh variable. */
export function bind(ctx: Ctx, name: string, ty: Val): Ctx {
  return { names: [...ctx.names, name], types: [...ctx.types, ty], env: [...ctx.env, vVar(ctx.env.length)] };
}

/** Extend with a variable that stands for a known value. */
export function define(ctx: Ctx, name: string, ty: Val, value: Val): Ctx {
  return { names: [...ctx.names, name], types: [...ctx.types, ty], env: [...ctx.env, value] };
}

/** The name given to the hidden length binder of a two-binder cons pattern. It cannot be written. */
const HIDDEN_INDEX = "n'";

/**
 * Which vector constructors can produce a value of type V A m, and what the
 * length of the tail is when the constructor is cons.
 */
export function vectorShape(m: Machine, len: Val): { nil: boolean; cons: boolean; pred?: Val } {
  const n = m.force(len);
  if (n.v === "nat") return n.n === 0n ? { nil: true, cons: false } : { nil: false, cons: true, pred: { v: "nat", n: n.n - 1n } };
  if (n.v === "con" && n.name === "S") return { nil: false, cons: true, pred: n.args[0] };
  return { nil: true, cons: true };
}

function show(m: Machine, ctx: Ctx, v: Val): string {
  return printTm(m.quote(ctx.env.length, v), ctx.names, (name) => m.globals.get(name)?.implicit ?? 0);
}

function fail(code: Code, msg: string, s?: { line: number; col: number }): never {
  throw new CheckError(code, msg, s?.line, s?.col);
}

/** Build the diagnostic for a refl that does not hold. */
function eqFailure(m: Machine, ctx: Ctx, a: Val, b: Val, at?: { line: number; col: number }): never {
  const sa = show(m, ctx, a);
  const sb = show(m, ctx, b);
  if (isClosedCanonical(m, a) && isClosedCanonical(m, b)) {
    throw new CheckError("EQ", `refl does not hold: ${sa} and ${sb} are distinct values`, at?.line, at?.col, "refuted", [sa, sb]);
  }
  throw new CheckError("EQ", `refl does not hold: ${sa} and ${sb} are not definitionally equal; the checker cannot decide this equality`, at?.line, at?.col, "unknown", [sa, sb]);
}

/** Subsumption: definitional equality, plus U i <= U j when i <= j. */
function subtype(m: Machine, lvl: number, a: Val, b: Val): boolean {
  const fa = m.force(a);
  const fb = m.force(b);
  if (fa.v === "U" && fb.v === "U") return fa.l <= fb.l;
  return m.conv(lvl, fa, fb);
}

// ===================================================================== Kernel

export class Kernel {
  constructor(readonly m: Machine) {}

  private err(msg: string): never {
    throw new CheckError("KERNEL", `kernel: ${msg}`);
  }

  /** Infer the universe level of a type. */
  level(ctx: Ctx, tm: Tm): number {
    const ty = this.m.force(this.infer(ctx, tm));
    if (ty.v !== "U") this.err(`${printTm(tm, ctx.names)} is not a type`);
    return ty.l;
  }

  infer(ctx: Ctx, tm: Tm): Val {
    const m = this.m;
    switch (tm.t) {
      case "var": {
        const ty = ctx.types[ctx.types.length - 1 - tm.ix];
        if (!ty) this.err(`unbound index ${tm.ix}`);
        return ty;
      }
      case "const": {
        const g = m.globals.get(tm.name);
        if (!g) this.err(`unknown constant ${tm.name}`);
        return g.type;
      }
      case "meta":
        return this.err("unsolved meta");
      case "U":
        return { v: "U", l: tm.l + 1 };
      case "pi":
      case "sig": {
        const i = this.level(ctx, tm.a);
        const j = this.level(bind(ctx, tm.x, m.eval(ctx.env, tm.a)), tm.b);
        return { v: "U", l: Math.max(i, j) };
      }
      case "app": {
        const fty = m.force(this.infer(ctx, tm.f));
        if (fty.v !== "pi") this.err("application of a non-function");
        this.check(ctx, tm.a, fty.a);
        return m.inst(fty.b, m.eval(ctx.env, tm.a));
      }
      case "fst":
      case "snd": {
        const pty = m.force(this.infer(ctx, tm.p));
        if (pty.v !== "sig") this.err(`${tm.t} of a non-pair`);
        return tm.t === "fst" ? pty.a : m.inst(pty.b, m.fst(m.eval(ctx.env, tm.p)));
      }
      case "eq": {
        const l = this.level(ctx, tm.A);
        const A = m.eval(ctx.env, tm.A);
        this.check(ctx, tm.a, A);
        this.check(ctx, tm.b, A);
        return { v: "U", l };
      }
      case "nat":
        return m.evalConst("N");
      case "int":
        return m.evalConst("Z");
      case "case": {
        this.level(ctx, tm.motive);
        const motive = m.eval(ctx.env, tm.motive);
        this.checkCase(ctx, tm.s, tm.branches, motive);
        return motive;
      }
      default:
        return this.err(`cannot infer the type of ${tm.t}`);
    }
  }

  check(ctx: Ctx, tm: Tm, ty: Val): void {
    const m = this.m;
    const fty = m.force(ty);
    if (tm.t === "lam") {
      if (fty.v !== "pi") this.err("lam against a non-function type");
      this.check(bind(ctx, tm.x, fty.a), tm.b, m.inst(fty.b, vVar(ctx.env.length)));
      return;
    }
    if (tm.t === "pair") {
      if (fty.v !== "sig") this.err("pair against a non-pair type");
      this.check(ctx, tm.a, fty.a);
      this.check(ctx, tm.b, m.inst(fty.b, m.eval(ctx.env, tm.a)));
      return;
    }
    if (tm.t === "refl") {
      if (fty.v !== "eq") this.err("refl against a non-equality type");
      if (!m.conv(ctx.env.length, fty.a, fty.b)) eqFailure(m, ctx, fty.a, fty.b);
      return;
    }
    if (tm.t === "int") {
      const z = m.force(m.evalConst("Z"));
      if (!m.conv(ctx.env.length, fty, z)) this.err("integer literal against a non-integer type");
      return;
    }
    if (tm.t === "case") {
      const motive = m.eval(ctx.env, tm.motive);
      if (!m.conv(ctx.env.length, motive, fty)) this.err("case motive differs from the expected type");
      this.checkCase(ctx, tm.s, tm.branches, motive);
      return;
    }
    const got = this.infer(ctx, tm);
    if (!subtype(m, ctx.env.length, got, fty)) {
      this.err(`expected ${show(m, ctx, fty)}, found ${show(m, ctx, got)}`);
    }
  }

  private checkCase(ctx: Ctx, s: Tm, branches: Branch[], motive: Val): void {
    const m = this.m;
    const sty = m.force(this.infer(ctx, s));
    if (sty.v !== "con" || sty.name !== "V") this.err("case on a non-vector");
    const [A, len] = sty.args;
    const shape = vectorShape(m, len);
    const seen = new Set<string>();
    for (const br of branches) {
      if (seen.has(br.ctor)) this.err(`duplicate ${br.ctor} branch`);
      seen.add(br.ctor);
      if (br.ctor === "nil") {
        if (!shape.nil || br.names.length !== 0) this.err("unreachable or malformed nil branch");
        this.check(ctx, br.body, motive);
      } else {
        if (!shape.cons || br.names.length !== 3) this.err("unreachable or malformed cons branch");
        const N = m.evalConst("N");
        let c = shape.pred ? define(ctx, br.names[0], N, shape.pred) : bind(ctx, br.names[0], N);
        const idx = c.env[c.env.length - 1];
        c = bind(c, br.names[1], A);
        c = bind(c, br.names[2], m.saturate("V", [A, idx]));
        this.check(c, br.body, motive);
      }
    }
    if ((shape.nil && !seen.has("nil")) || (shape.cons && !seen.has("cons"))) this.err("non-exhaustive case");
  }
}

// ================================================================= Elaborator

export interface Elaborated {
  tm: Tm;
  ty: Val;
}

export class Elaborator {
  readonly kernel: Kernel;
  constructor(readonly m: Machine) {
    this.kernel = new Kernel(m);
  }

  private lookup(ctx: Ctx, name: string): number {
    for (let i = ctx.names.length - 1; i >= 0; i--) if (ctx.names[i] === name) return i;
    return -1;
  }

  binderName(s: Sexp): string {
    if (s.k !== "atom") fail("SYN", "expected a binder name, found a list", s);
    if (s.text === "_") return "_";
    if (!isName(s.text)) fail("SYN", `expected a binder name, found ${s.text}`, s);
    if (isReserved(s.text) || this.m.globals.has(s.text)) fail("SCOPE", `${s.text} is reserved or names a constant; choose another binder name`, s);
    return s.text;
  }

  /** Elaborate a type and return its universe level. */
  checkType(ctx: Ctx, s: Sexp): { tm: Tm; level: number } {
    const { tm, ty } = this.infer(ctx, s);
    const fty = this.m.force(ty);
    if (fty.v !== "U") fail("TYPE", `expected a type, found a term of type ${show(this.m, ctx, fty)}`, s);
    return { tm, level: fty.l };
  }

  infer(ctx: Ctx, s: Sexp): Elaborated {
    const m = this.m;
    if (s.k === "atom") return this.inferAtom(ctx, s);
    const items = s.items;
    if (items.length === 0) fail("SYN", "empty list", s);
    const head = items[0];
    const kw = head.k === "atom" && (KEYWORDS.has(head.text) || head.text === "=") ? head.text : undefined;
    const arity = (n: number) => {
      if (items.length !== n) fail("SYN", `${kw} takes ${n - 1} argument(s), found ${items.length - 1}`, s);
    };
    switch (kw) {
      case "pi":
      case "sig": {
        arity(4);
        const x = this.binderName(items[1]);
        const a = this.checkType(ctx, items[2]);
        const b = this.checkType(bind(ctx, x, m.eval(ctx.env, a.tm)), items[3]);
        return { tm: { t: kw, x, a: a.tm, b: b.tm }, ty: { v: "U", l: Math.max(a.level, b.level) } };
      }
      case "app":
        arity(3);
        return this.applyTo(ctx, this.infer(ctx, items[1]), items[2], items[1]);
      case "fst":
      case "snd": {
        arity(2);
        const p = this.infer(ctx, items[1]);
        const pty = m.force(p.ty);
        if (pty.v !== "sig") fail("TYPE", `${kw} needs a pair, found a term of type ${show(m, ctx, pty)}`, items[1]);
        if (kw === "fst") return { tm: { t: "fst", p: p.tm }, ty: pty.a };
        return { tm: { t: "snd", p: p.tm }, ty: m.inst(pty.b, m.fst(m.eval(ctx.env, p.tm))) };
      }
      case "=": {
        arity(3);
        const a = this.infer(ctx, items[1]);
        const b = this.check(ctx, items[2], a.ty);
        const A = this.zonkOrFail(ctx, m.quote(ctx.env.length, a.ty), items[1]);
        const l = this.kernel.level(ctx, A);
        return { tm: { t: "eq", A, a: a.tm, b }, ty: { v: "U", l } };
      }
      case "lam":
        return fail("TYPE", "lam needs an expected function type here", s);
      case "pair":
        return fail("TYPE", "pair needs an expected sig type here", s);
      case "case":
        return fail("TYPE", "case needs an expected result type here", s);
      case "refl":
        return fail("SYN", "refl takes no arguments", s);
    }
    let fn = this.infer(ctx, head);
    for (let i = 1; i < items.length; i++) fn = this.applyTo(ctx, fn, items[i], head);
    return fn;
  }

  private applyTo(ctx: Ctx, fn: Elaborated, arg: Sexp, at: Sexp): Elaborated {
    const m = this.m;
    const fty = m.force(fn.ty);
    if (fty.v !== "pi") fail("TYPE", `${this.render(ctx, fn.tm)} is not a function; it has type ${show(m, ctx, fty)}`, at);
    const a = this.check(ctx, arg, fty.a);
    return { tm: { t: "app", f: fn.tm, a }, ty: m.inst(fty.b, m.eval(ctx.env, a)) };
  }

  private render(ctx: Ctx, tm: Tm): string {
    return printTm(tm, ctx.names, (n) => this.m.globals.get(n)?.implicit ?? 0);
  }

  private inferAtom(ctx: Ctx, s: Sexp & { k: "atom" }): Elaborated {
    const m = this.m;
    const t = s.text;
    if (t === "U0") return { tm: { t: "U", l: 0 }, ty: { v: "U", l: 1 } };
    if (/^(0|[1-9][0-9]*)$/.test(t)) return { tm: { t: "nat", n: BigInt(t) }, ty: m.evalConst("N") };
    if (/^-[1-9][0-9]*$/.test(t)) return { tm: { t: "int", n: BigInt(t) }, ty: m.evalConst("Z") };
    if (t === "refl") fail("TYPE", "refl needs an expected equality type here", s);
    if (t === "_") fail("SYN", "_ is an unused binder, not a term; NTΔ has no wildcard proof", s);
    if (KEYWORDS.has(t) || t === "=") fail("SYN", `${t} must be at the head of a list`, s);
    const ix = this.lookup(ctx, t);
    if (ix >= 0) return { tm: { t: "var", ix: ctx.names.length - 1 - ix }, ty: ctx.types[ix] };
    const g: Global | undefined = m.globals.get(t);
    if (!g) fail("SCOPE", `${t} is not defined in this context or the manifest`, s);
    let tm: Tm = { t: "const", name: t };
    let ty: Val = g.type;
    for (let i = 0; i < g.implicit; i++) {
      const fty = m.force(ty);
      if (fty.v !== "pi") fail("KERNEL", `constant ${t} declares more implicit arguments than its type has`, s);
      const id = m.freshMeta();
      tm = { t: "app", f: tm, a: { t: "meta", id } };
      ty = m.inst(fty.b, m.eval(ctx.env, { t: "meta", id }));
    }
    return { tm, ty };
  }

  check(ctx: Ctx, s: Sexp, ty: Val): Tm {
    const m = this.m;
    const fty = m.force(ty);
    const lvl = ctx.env.length;
    if (s.k === "atom") {
      if (s.text === "refl") {
        if (fty.v !== "eq") fail("TYPE", `refl proves an equality, but the expected type is ${show(m, ctx, fty)}`, s);
        if (!m.conv(lvl, fty.a, fty.b)) eqFailure(m, ctx, fty.a, fty.b, s);
        return { t: "refl" };
      }
      if (/^(0|[1-9][0-9]*)$/.test(s.text)) {
        const z = m.force(m.evalConst("Z"));
        if (fty.v === "con" && fty.name === "Z" && m.conv(lvl, fty, z)) return { t: "int", n: BigInt(s.text) };
      }
    } else if (s.items.length > 0 && s.items[0].k === "atom") {
      const kw = s.items[0].text;
      if (kw === "lam") {
        if (s.items.length !== 3) fail("SYN", `lam takes 2 arguments, found ${s.items.length - 1}`, s);
        if (fty.v !== "pi") fail("TYPE", `lam builds a function, but the expected type is ${show(m, ctx, fty)}`, s);
        const x = this.binderName(s.items[1]);
        const b = this.check(bind(ctx, x, fty.a), s.items[2], m.inst(fty.b, vVar(lvl)));
        return { t: "lam", x, b };
      }
      if (kw === "pair") {
        if (s.items.length !== 3) fail("SYN", `pair takes 2 arguments, found ${s.items.length - 1}`, s);
        if (fty.v !== "sig") fail("TYPE", `pair builds a sig value, but the expected type is ${show(m, ctx, fty)}`, s);
        const a = this.check(ctx, s.items[1], fty.a);
        const b = this.check(ctx, s.items[2], m.inst(fty.b, m.eval(ctx.env, a)));
        return { t: "pair", a, b };
      }
      if (kw === "case") return this.checkCase(ctx, s, fty);
      if (!KEYWORDS.has(kw) && kw !== "=" && s.items.length > 1) {
        const r = this.checkApplication(ctx, s, fty);
        if (r) return r;
      }
    }
    const got = this.infer(ctx, s);
    if (!subtype(m, lvl, got.ty, fty)) {
      const g = m.force(got.ty);
      const code: Code = g.v === "U" && fty.v === "U" ? "UNIV" : "TYPE";
      fail(code, `expected ${show(m, ctx, fty)}, found ${this.render(ctx, got.tm)} of type ${show(m, ctx, got.ty)}`, s);
    }
    return got.tm;
  }

  /**
   * Check an application against an expected type. When the result type does
   * not depend on the explicit arguments, unify it with the expected type
   * first, so that implicit arguments are known before the arguments are
   * checked. This is what types the literal in (sum (cons 2 nil)) as Z.
   */
  private checkApplication(ctx: Ctx, s: Sexp & { k: "list" }, expected: Val): Tm | undefined {
    const m = this.m;
    const fn = this.infer(ctx, s.items[0]);
    const domains: Val[] = [];
    let t = m.force(fn.ty);
    const placeholder: Val = { v: "U", l: 0 };
    for (let i = 1; i < s.items.length; i++) {
      if (t.v !== "pi" || mentions(t.b.body, 0)) return this.finishApplication(ctx, s, fn, expected);
      domains.push(t.a);
      t = m.force(m.inst(t.b, placeholder));
    }
    const lvl = ctx.env.length;
    if (!subtype(m, lvl, t, expected)) return this.finishApplication(ctx, s, fn, expected);
    let tm = fn.tm;
    s.items.slice(1).forEach((arg, i) => {
      tm = { t: "app", f: tm, a: this.check(ctx, arg, domains[i]) };
    });
    return tm;
  }

  private finishApplication(ctx: Ctx, s: Sexp & { k: "list" }, fn: Elaborated, expected: Val): Tm {
    let r = fn;
    for (let i = 1; i < s.items.length; i++) r = this.applyTo(ctx, r, s.items[i], s.items[0]);
    const lvl = ctx.env.length;
    if (!subtype(this.m, lvl, r.ty, expected)) {
      const g = this.m.force(r.ty);
      const e = this.m.force(expected);
      fail(g.v === "U" && e.v === "U" ? "UNIV" : "TYPE", `expected ${show(this.m, ctx, expected)}, found ${this.render(ctx, r.tm)} of type ${show(this.m, ctx, r.ty)}`, s);
    }
    return r.tm;
  }

  private checkCase(ctx: Ctx, s: Sexp & { k: "list" }, ty: Val): Tm {
    const m = this.m;
    if (s.items.length < 3) fail("SYN", "case takes a scrutinee and at least one branch", s);
    const scrut = this.infer(ctx, s.items[1]);
    const sty = m.force(scrut.ty);
    if (sty.v !== "con" || sty.name !== "V") fail("CASE", `case works on vectors in this version; found a term of type ${show(m, ctx, sty)}`, s.items[1]);
    const [A, len] = sty.args;
    const shape = vectorShape(m, len);
    const motive = this.zonkOrFail(ctx, m.quote(ctx.env.length, ty), s);
    const branches: Branch[] = [];
    const seen = new Set<string>();
    for (const br of s.items.slice(2)) {
      if (br.k !== "list" || br.items.length !== 3 || br.items[0].k !== "atom" || br.items[1].k !== "list") {
        fail("SYN", "a branch has the form (ctor (binders) body)", br);
      }
      const ctor = (br.items[0] as Sexp & { k: "atom" }).text;
      const binders = (br.items[1] as Sexp & { k: "list" }).items;
      if (ctor !== "nil" && ctor !== "cons") fail("CASE", `${ctor} is not a vector constructor (use nil or cons)`, br.items[0]);
      if (seen.has(ctor)) fail("CASE", `duplicate ${ctor} branch`, br);
      seen.add(ctor);
      if (ctor === "nil") {
        if (!shape.nil) fail("CASE", `the nil branch is unreachable: the length ${show(m, ctx, len)} is a successor; remove the branch`, br);
        if (binders.length !== 0) fail("CASE", "nil binds nothing; write (nil () body)", br.items[1]);
        branches.push({ ctor: "nil", names: [], body: this.check(ctx, br.items[2], ty) });
        continue;
      }
      if (!shape.cons) fail("CASE", "the cons branch is unreachable: the length is 0; remove the branch", br);
      if (binders.length !== 2 && binders.length !== 3) fail("CASE", "cons binds (head tail) or (length head tail)", br.items[1]);
      const names = binders.map((b) => this.binderName(b));
      const all = names.length === 3 ? names : [HIDDEN_INDEX, ...names];
      const N = m.evalConst("N");
      let c = shape.pred ? define(ctx, all[0], N, shape.pred) : bind(ctx, all[0], N);
      const idx = c.env[c.env.length - 1];
      c = bind(c, all[1], A);
      c = bind(c, all[2], m.saturate("V", [A, idx]));
      branches.push({ ctor: "cons", names: all, body: this.check(c, br.items[2], m.eval(ctx.env, motive)) });
    }
    if (shape.nil && !seen.has("nil")) fail("CASE", "non-exhaustive case: add a nil branch, or give the vector a successor length", s);
    if (shape.cons && !seen.has("cons")) fail("CASE", "non-exhaustive case: add a cons branch", s);
    return { t: "case", s: scrut.tm, motive, branches };
  }

  /** Replace solved metas; an unsolved meta is an IMPL error. */
  zonkOrFail(ctx: Ctx, tm: Tm, at?: { line: number; col: number }): Tm {
    const unsolved = new Set<number>();
    const out = this.m.zonk(tm, ctx.env.length, unsolved);
    if (unsolved.size) fail("IMPL", "an implicit argument could not be inferred; give the term an expected type", at);
    return out;
  }

  /** Elaborate a term against a type, zonk it, and re-check it in the kernel. */
  checkClosed(ctx: Ctx, s: Sexp, ty: Val): Tm {
    const raw = this.check(ctx, s, ty);
    const tm = this.zonkOrFail(ctx, raw, s);
    this.kernel.check(ctx, tm, ty);
    return tm;
  }

  /** Elaborate a type, zonk it, and re-check it in the kernel. */
  typeClosed(ctx: Ctx, s: Sexp): Tm {
    const { tm: raw } = this.checkType(ctx, s);
    const tm = this.zonkOrFail(ctx, raw, s);
    this.kernel.level(ctx, tm);
    return tm;
  }

  /** Elaborate a term by inference, zonk it and its type, and re-check both. */
  inferClosed(ctx: Ctx, s: Sexp): { tm: Tm; ty: Tm } {
    const r = this.infer(ctx, s);
    const tm = this.zonkOrFail(ctx, r.tm, s);
    const ty = this.zonkOrFail(ctx, this.m.quote(ctx.env.length, r.ty), s);
    this.kernel.level(ctx, ty);
    this.kernel.check(ctx, tm, this.m.eval(ctx.env, ty));
    return { tm, ty };
  }
}
