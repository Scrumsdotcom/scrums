// Importers draft canonical documents from wherever a company's truth lives
// today: a spreadsheet export, a folder of runbooks, an org chart.
//
// An importer never writes into the company graph. It produces drafts, which
// land in company/.drafts/<importer>/ where the loader cannot see them, and
// every drafted entity starts in status 'proposed'. A human reads the drafts
// and runs `cac import accept` to move them in. Adoption is federation, not
// migration (docs/adoption.md): the source system stays the source until a
// person decides otherwise.
//
// Importers are vendor-neutral by contract. They read generic formats (CSV,
// Markdown), never a named product's API.

import { orgChart } from "./org-chart.js";

export interface Draft {
  /** Path relative to the importer's drafts folder, e.g. people/PERSON-ADA.yaml. */
  path: string;
  kind: string;
  /** The canonical identity of the drafted entity. */
  id: string;
  data: Record<string, unknown>;
}

export interface ImportResult {
  drafts: Draft[];
  warnings: string[];
}

export interface Importer {
  name: string;
  summary: string;
  /** What the --file argument must contain. */
  input: string;
  draft(text: string, opts: { source: string }): ImportResult;
}

export const IMPORTERS: Importer[] = [orgChart];

export function findImporter(name: string): Importer | undefined {
  return IMPORTERS.find((i) => i.name === name);
}
