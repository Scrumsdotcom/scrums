import type { Draft, Importer, ImportResult } from "./index.js";
import { API_VERSION } from "../version.js";

/**
 * Minimal RFC 4180 reader: quoted fields, doubled quotes, commas and newlines
 * inside quotes. Enough for spreadsheet and HR-system exports; not a general
 * CSV library.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

function slug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PERSON_TYPES = new Set(["employee", "contractor", "supplier"]);
const SYSTEM_LABEL = "org-chart-import";

/**
 * One row per person. Columns, matched case-insensitively:
 *
 *   name      required
 *   email     optional
 *   title     optional
 *   team      optional; each distinct team becomes a draft Organization
 *   type      optional; employee (default), contractor, or supplier
 *   id        optional; the source system's own ID, kept as an external ID
 *   lead      optional; "yes" marks the person as a lead of their team
 */
export const orgChart: Importer = {
  name: "org-chart",
  summary: "Draft a Person for every row of an org-chart CSV, and an Organization for every team.",
  input: "a CSV export with a header row and at least a 'name' column",
  draft(text: string, opts: { source: string }): ImportResult {
    const rows = parseCsv(text);
    const warnings: string[] = [];
    if (rows.length === 0) return { drafts: [], warnings: ["the file is empty"] };

    const header = rows[0]!.map((h) => h.trim().toLowerCase());
    const col = (name: string) => header.indexOf(name);
    if (col("name") === -1) {
      return { drafts: [], warnings: [`no 'name' column; found: ${header.join(", ")}`] };
    }
    const get = (row: string[], name: string) => (col(name) === -1 ? "" : (row[col(name)] ?? "").trim());

    const people: Draft[] = [];
    const teams = new Map<string, { id: string; name: string; members: string[]; leads: string[] }>();
    const usedIds = new Set<string>();

    rows.slice(1).forEach((row, i) => {
      const line = i + 2;
      const name = get(row, "name");
      if (!name) {
        warnings.push(`line ${line}: no name, skipped`);
        return;
      }
      let id = `PERSON-${slug(name)}`;
      for (let n = 2; usedIds.has(id); n++) id = `PERSON-${slug(name)}-${n}`;
      if (id !== `PERSON-${slug(name)}`) warnings.push(`line ${line}: a second '${name}' was drafted as ${id}; check it is not a duplicate`);
      usedIds.add(id);

      const rawType = get(row, "type").toLowerCase();
      const type = PERSON_TYPES.has(rawType) ? rawType : "employee";
      if (rawType && !PERSON_TYPES.has(rawType)) warnings.push(`line ${line}: unknown type '${rawType}', drafted as employee`);

      const team = get(row, "team");
      const email = get(row, "email");
      const title = get(row, "title");
      const sourceId = get(row, "id");

      const data: Record<string, unknown> = {
        apiVersion: API_VERSION,
        kind: "Person",
        canonicalId: id,
        displayName: name,
        type,
        status: "proposed",
      };
      if (email) data.primaryEmail = email;
      if (team) {
        const teamId = `ORG-${slug(team)}`;
        const t = teams.get(teamId) ?? { id: teamId, name: team, members: [], leads: [] };
        t.members.push(id);
        if (/^(y|yes|true|1)$/i.test(get(row, "lead"))) t.leads.push(id);
        teams.set(teamId, t);
        data.organizations = [teamId];
      }
      if (title) data.roles = [{ title, ...(team ? { organization: `ORG-${slug(team)}` } : {}) }];
      data.externalIds = [{ system: SYSTEM_LABEL, id: sourceId || `${opts.source}#line-${line}` }];

      people.push({ path: `people/${id}.yaml`, kind: "Person", id, data });
    });

    const orgs: Draft[] = [...teams.values()]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((t) => ({
        path: `organizations/${t.id}.yaml`,
        kind: "Organization",
        id: t.id,
        data: {
          apiVersion: API_VERSION,
          kind: "Organization",
          canonicalId: t.id,
          name: t.name,
          type: "team",
          status: "proposed",
          members: t.members,
          leads: t.leads,
          externalIds: [{ system: SYSTEM_LABEL, id: t.name }],
        },
      }));

    return { drafts: [...orgs, ...people], warnings };
  },
};
