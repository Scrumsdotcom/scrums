// Compliance and capability projections.
//
// Both generators invert declared edges rather than reading a second list.
// Controls declare what they implement; the control matrix inverts that into
// per-requirement coverage. Capabilities declare their own chains; the
// capability map flattens them and reports where a chain degrades.
//
// The point of generating rather than maintaining these views is that they
// cannot drift. A requirement that loses its last control shows up as a
// coverage gap on the next run, not at the next audit.

import type { RepoCorpus } from "./loader.js";

export interface GeneratedFile {
  name: string;
  content: string;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, sortKeys, 2);
  function sortKeys(_k: string, v: any) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.keys(v)
        .sort()
        .reduce((acc: Record<string, any>, key) => {
          acc[key] = v[key];
          return acc;
        }, {});
    }
    return v;
  }
}

export function controlMatrix(corpus: RepoCorpus): GeneratedFile {
  interface CoveringControl {
    id: string;
    title: string;
    status: string;
    method: string;
    surface: string;
    frequency: string;
    check?: string;
    evidenceSources: string[];
    lastVerified?: string;
  }

  const controlsByRequirement = new Map<string, CoveringControl[]>();
  for (const c of corpus.controls) {
    const summary: CoveringControl = {
      id: c.data.id,
      title: c.data.title,
      status: c.data.status,
      method: c.data.verification?.method,
      surface: c.data.verification?.surface,
      frequency: c.data.verification?.frequency,
      check: c.data.verification?.check,
      evidenceSources: ((c.data.evidence ?? []) as Array<{ source: string }>)
        .map((e) => e.source)
        .sort(),
      lastVerified: c.data.lastVerified,
    };
    for (const req of (c.data.implements ?? []) as string[]) {
      const list = controlsByRequirement.get(req) ?? [];
      list.push(summary);
      controlsByRequirement.set(req, list);
    }
  }

  const requirements = corpus.requirements
    .map((r) => {
      const covering = (controlsByRequirement.get(r.data.id) ?? []).slice().sort((a, b) =>
        a.id.localeCompare(b.id),
      );
      const operating = covering.filter((c) => c.status === "operating");
      return {
        id: r.data.id,
        framework: r.data.framework,
        clause: r.data.clause,
        title: r.data.title,
        status: r.data.status,
        severity: r.data.severity,
        owner: r.data.owner,
        controls: covering,
        // "covered" means an in-scope obligation has at least one control that
        // is actually running, not merely one that has been designed.
        covered: r.data.status !== "in-scope" || operating.length > 0,
        automated: operating.some((c) => c.method === "automated"),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const knownRequirementIds = new Set(corpus.requirements.map((r) => r.data.id as string));
  const orphanControls = corpus.controls
    .filter((c) => ((c.data.implements ?? []) as string[]).every((r) => !knownRequirementIds.has(r)))
    .map((c) => c.data.id as string)
    .sort();

  const byFramework: Record<string, { total: number; inScope: number; covered: number }> = {};
  for (const r of requirements) {
    const f = (byFramework[r.framework] ??= { total: 0, inScope: 0, covered: 0 });
    f.total += 1;
    if (r.status === "in-scope") {
      f.inScope += 1;
      if (r.covered) f.covered += 1;
    }
  }

  const out = {
    generatedFrom: "/company/requirements/*.yaml + /company/controls/*.yaml",
    note:
      "Coverage is declared one way: Controls name the Requirements they implement. This view is the inversion, so the two can never disagree.",
    requirementCount: requirements.length,
    controlCount: corpus.controls.length,
    gaps: requirements.filter((r) => !r.covered).map((r) => r.id),
    orphanControls,
    byFramework,
    requirements,
  };
  return { name: "control-matrix.json", content: stableStringify(out) };
}

export function capabilityMap(corpus: RepoCorpus): GeneratedFile {
  interface Holder {
    kind: string;
    id: string;
    delivers: string;
    note?: string;
  }

  const capabilities = corpus.capabilities
    .map((c) => {
      const chain: Holder[] = [
        c.data.primaryOwner,
        ...((c.data.fallback ?? []) as Holder[]),
        c.data.finalFallback,
      ].filter(Boolean);
      // Depth to the first holder that still delivers the whole capability.
      // Zero means the primary owner does; a large number means the company
      // limps for several hops before anything is whole again.
      const depthToFull = chain.findIndex((h) => h.delivers === "full");
      return {
        id: c.data.id,
        name: c.data.name,
        domain: c.data.domain,
        criticality: c.data.criticality,
        sla: c.data.sla,
        chain: chain.map((h, i) => ({ position: i, ...h })),
        chainDepth: chain.length,
        depthToFull: depthToFull === -1 ? null : depthToFull,
        // A capability with no full-delivery holder anywhere in its chain is
        // permanently degraded, whoever is on shift.
        neverFull: depthToFull === -1,
        requires: ((c.data.requires ?? []) as string[]).slice().sort(),
        measuredBy: ((c.data.measuredBy ?? []) as string[]).slice().sort(),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  // Holders carrying several primary responsibilities are the company's real
  // single points of failure, whatever the org chart says.
  const load = new Map<string, string[]>();
  for (const c of capabilities) {
    const primary = c.chain[0];
    if (!primary) continue;
    const key = `${primary.kind}:${primary.id}`;
    load.set(key, [...(load.get(key) ?? []), c.id]);
  }
  const concentration = [...load.entries()]
    .filter(([, caps]) => caps.length > 1)
    .map(([holder, caps]) => ({ holder, capabilities: caps.slice().sort() }))
    .sort((a, b) => a.holder.localeCompare(b.holder));

  const out = {
    generatedFrom: "/company/capabilities/*.yaml",
    note:
      "Every chain terminates in a holder that cannot itself be absent. The map exists to make degradation visible before it is discovered.",
    capabilityCount: capabilities.length,
    permanentlyDegraded: capabilities.filter((c) => c.neverFull).map((c) => c.id),
    criticalWithoutFullPrimary: capabilities
      .filter((c) => c.criticality === "critical" && c.depthToFull !== 0)
      .map((c) => c.id),
    concentration,
    capabilities,
  };
  return { name: "capability-map.json", content: stableStringify(out) };
}
