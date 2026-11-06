/**
 * The core library: built-in type constructors, data constructors, and
 * primitives. Their types are written in NTΔ and elaborated at load time.
 * Every primitive is total and has a reduction rule in Machine.saturate.
 */
import type { GlobalKind } from "./core.js";

export interface PreludeEntry {
  name: string;
  kind: GlobalKind;
  arity: number;
  implicit: number;
  type: string;
  doc: string;
}

export const PRELUDE: readonly PreludeEntry[] = [
  { name: "N", kind: "tycon", arity: 0, implicit: 0, type: "U0", doc: "Natural numbers. Literals: 0 1 2 …" },
  { name: "Z", kind: "tycon", arity: 0, implicit: 0, type: "U0", doc: "Exact integers. Literals: … -1 0 1 …" },
  { name: "V", kind: "tycon", arity: 2, implicit: 0, type: "(pi A U0 (pi n N U0))", doc: "V A n: vectors of A with length exactly n." },
  { name: "S", kind: "ctor", arity: 1, implicit: 0, type: "(pi n N N)", doc: "Successor: S n is n + 1." },
  { name: "nil", kind: "ctor", arity: 1, implicit: 1, type: "(pi A U0 (V A 0))", doc: "The empty vector." },
  { name: "cons", kind: "ctor", arity: 4, implicit: 2, type: "(pi A U0 (pi n N (pi x A (pi xs (V A n) (V A (S n))))))", doc: "cons x xs: x in front of xs." },
  { name: "add", kind: "prim", arity: 2, implicit: 0, type: "(pi a Z (pi b Z Z))", doc: "Integer addition." },
  { name: "sub", kind: "prim", arity: 2, implicit: 0, type: "(pi a Z (pi b Z Z))", doc: "Integer subtraction." },
  { name: "mul", kind: "prim", arity: 2, implicit: 0, type: "(pi a Z (pi b Z Z))", doc: "Integer multiplication." },
  { name: "neg", kind: "prim", arity: 1, implicit: 0, type: "(pi a Z Z)", doc: "Integer negation." },
  { name: "int", kind: "prim", arity: 1, implicit: 0, type: "(pi n N Z)", doc: "The integer value of a natural." },
  { name: "sum", kind: "prim", arity: 2, implicit: 1, type: "(pi n N (pi xs (V Z n) Z))", doc: "Sum of an integer vector. sum nil = 0; sum (cons x xs) = add x (sum xs)." },
];
