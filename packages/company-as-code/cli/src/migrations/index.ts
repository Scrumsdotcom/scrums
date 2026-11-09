// Every change to the document format ships a migration that moves existing
// documents forward. A migration is a pure text transform from one apiVersion
// to the next: text rather than parsed YAML, so a company's comments and
// formatting survive the move.
//
// Migrations are never edited after release. A mistake in one is fixed by
// the next one.

import { m0001 } from "./0001-v1-to-v1alpha1.js";

export interface Migration {
  /** Permanent, sequential: 0001, 0002, ... */
  id: string;
  from: string;
  to: string;
  summary: string;
  apply(text: string): string;
}

export const MIGRATIONS: Migration[] = [m0001];
