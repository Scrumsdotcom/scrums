import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { CognitionLiveReader } from "./live-reader.js";
import { allowedHosts, refuseRequest } from "../http-guard.js";

/**
 * The Visual Cognition Graph server.
 *
 * Serves a real-time, interactive version of the Mermaid diagrams in the docs:
 * the company's domains and modules as a clickable graph, with each module's
 * agents, workflows, and metrics, overlaid with LIVE activity (audit rows,
 * typed events, pending HITL approvals) read from the runtime database.
 *
 * - GET /            the interactive single-page graph
 * - GET /api/graph   the static structure (/generated/cognition-graph.json)
 * - GET /api/live    the live overlay (CognitionLiveReader over the runtime DB)
 *
 * Dependency-free: Node's built-in http, one HTML page. Forks swap the
 * front-end against the same two JSON endpoints.
 */

export interface CognitionServerOptions {
  repoRoot: string;
  dbPath: string;
  port?: number;
  host?: string;
}

export interface RunningCognitionServer {
  server: http.Server;
  url: string;
  close(): Promise<void>;
}

export function startCognitionServer(
  opts: CognitionServerOptions,
): Promise<RunningCognitionServer> {
  const host = opts.host ?? "127.0.0.1";
  const port = opts.port ?? 4100;
  const graphPath = path.join(opts.repoRoot, "generated", "cognition-graph.json");

  const server = http.createServer(async (req, res) => {
    try {
      const hosts = allowedHosts(host, (server.address() as AddressInfo).port);
      const refused = refuseRequest(req, hosts, { stateChanging: req.method !== "GET" });
      if (refused) {
        json(res, 403, { error: refused });
        return;
      }
      await route(req, res, graphPath, opts.dbPath);
    } catch (err) {
      json(res, 500, { error: (err as Error).message });
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const addr = server.address() as AddressInfo;
      resolve({
        server,
        url: `http://${host}:${addr.port}`,
        close: () => new Promise<void>((res) => server.close(() => res())),
      });
    });
  });
}

async function route(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  graphPath: string,
  dbPath: string,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(PAGE);
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/graph") {
    let raw: string;
    try {
      raw = await fs.readFile(graphPath, "utf8");
    } catch {
      json(res, 404, {
        error: `cognition-graph.json not found at ${graphPath}. Run 'cd cli && npm run generate' first.`,
      });
      return;
    }
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(raw);
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/live") {
    const reader = new CognitionLiveReader(dbPath);
    try {
      json(res, 200, reader.overlay());
    } finally {
      reader.close();
    }
    return;
  }
  json(res, 404, { error: `no route for ${req.method} ${url.pathname}` });
}

function json(res: http.ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Company-as-Code, Visual Cognition Graph</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { font: 13px/1.5 ui-sans-serif, system-ui, sans-serif; margin: 0; }
  header { padding: .75rem 1.25rem; border-bottom: 1px solid #8884; display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: baseline; }
  header h1 { font-size: 1rem; margin: 0; }
  .totals { display: flex; gap: 1rem; flex-wrap: wrap; opacity: .85; font-size: .85rem; }
  .totals b { font-variant-numeric: tabular-nums; }
  .layout { display: flex; height: calc(100vh - 52px); }
  .canvas { flex: 1; overflow: auto; background: #8881; }
  .panel { width: 22rem; border-left: 1px solid #8884; padding: 1rem 1.25rem; overflow: auto; }
  .panel.empty { opacity: .55; }
  svg { display: block; }
  .node rect { stroke: #8888; stroke-width: 1.5; cursor: pointer; transition: filter .1s; }
  .node:hover rect { filter: brightness(1.12); }
  .node.selected rect { stroke: #4a90d9; stroke-width: 3; }
  .node text { pointer-events: none; }
  .node .nm { font-weight: 600; font-size: 12px; }
  .node .sub { font-size: 10px; opacity: .7; }
  .badge { font-size: 10px; font-weight: 700; }
  .edge { stroke: #8886; fill: none; }
  .domainLabel { font-size: 12px; font-weight: 700; opacity: .55; text-transform: uppercase; letter-spacing: .04em; }
  h2 { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; opacity: .6; margin: 1.25rem 0 .4rem; }
  .panel h1 { font-size: 1rem; margin: 0 0 .25rem; }
  .panel .purpose { opacity: .75; margin: 0 0 .5rem; }
  .row { display: flex; justify-content: space-between; gap: .5rem; padding: .15rem 0; border-bottom: 1px dotted #8883; }
  .pill { font-size: 10px; padding: .05rem .4rem; border-radius: 999px; background: #8882; }
  .legend { display: flex; gap: .75rem; font-size: .75rem; opacity: .7; flex-wrap: wrap; }
  .legend span::before { content: "■ "; }
  .ev { font-size: 11px; padding: .15rem 0; border-bottom: 1px dotted #8883; }
  .ev .t { font-weight: 600; }
  code { font-size: 11px; background: #8882; padding: 0 .25rem; border-radius: 3px; }
  .muted { opacity: .55; }
</style>
</head>
<body>
<header>
  <h1>Visual Cognition Graph</h1>
  <div class="totals" id="totals">loading…</div>
  <div class="legend">
    <span style="color:#7c9">stable</span>
    <span style="color:#dba43a">hardening</span>
    <span style="color:#8aa">planning</span>
    <span style="color:#c77">agent-ready</span>
    <span style="color:#999">deprecated</span>
  </div>
</header>
<div class="layout">
  <div class="canvas"><svg id="svg"></svg></div>
  <div class="panel empty" id="panel">Click a module to inspect its agents, workflows, metrics, and live activity.</div>
</div>
<script>
const LIFECYCLE_COLOR = {
  stable: "#7c9", hardening: "#dba43a", planning: "#8aa",
  "agent-ready": "#c77", deprecated: "#999",
};
const COL_W = 260, ROW_H = 92, NODE_W = 210, NODE_H = 64, PAD_X = 40, PAD_Y = 56;
let GRAPH = null, LIVE = null, SELECTED = null, POS = {};

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

async function load() {
  GRAPH = await fetch("/api/graph").then((r) => r.json());
  if (GRAPH.error) { document.getElementById("svg").innerHTML = ""; document.getElementById("totals").textContent = GRAPH.error; return; }
  await refreshLive();
  render();
  setInterval(refreshLive, 4000);
}

async function refreshLive() {
  LIVE = await fetch("/api/live").then((r) => r.json()).catch(() => null);
  paintLive();
  if (SELECTED) showPanel(SELECTED);
}

function moduleActivity(p) {
  return (LIVE && LIVE.perModule && LIVE.perModule[p]) || { events: 0, auditRows: 0, dryRunCount: 0, pendingApprovals: 0 };
}

function render() {
  const svg = document.getElementById("svg");
  POS = {};
  const domains = GRAPH.domains;
  let maxRows = 0;
  domains.forEach((d, ci) => {
    d.modules.forEach((m, ri) => {
      POS[m.path] = { x: PAD_X + ci * COL_W, y: PAD_Y + ri * ROW_H, m };
      maxRows = Math.max(maxRows, ri + 1);
    });
  });
  const width = PAD_X * 2 + domains.length * COL_W;
  const height = PAD_Y + maxRows * ROW_H + 30;
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", "0 0 " + width + " " + height);

  let s = "";
  // edges first (behind nodes)
  for (const e of GRAPH.edges) {
    const a = POS[e.from], b = POS[e.to];
    if (!a || !b) continue;
    const x1 = a.x + NODE_W / 2, y1 = a.y + NODE_H, x2 = b.x + NODE_W / 2, y2 = b.y;
    const my = (y1 + y2) / 2;
    s += '<path class="edge" d="M' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + my + ' ' + x2 + ' ' + my + ' ' + x2 + ' ' + y2 + '" />';
  }
  // domain labels
  domains.forEach((d, ci) => {
    s += '<text class="domainLabel" x="' + (PAD_X + ci * COL_W) + '" y="32">' + esc(d.name) + ' (' + d.moduleCount + ')</text>';
  });
  // nodes
  for (const path in POS) {
    const { x, y, m } = POS[path];
    const color = LIFECYCLE_COLOR[m.lifecycle] || "#999";
    s += '<g class="node" id="node-' + cssId(path) + '" data-path="' + esc(path) + '" transform="translate(' + x + ',' + y + ')">';
    s += '<rect width="' + NODE_W + '" height="' + NODE_H + '" rx="8" fill="' + color + '22" />';
    s += '<rect width="6" height="' + NODE_H + '" rx="3" fill="' + color + '" />';
    s += '<text class="nm" x="14" y="20">' + esc(m.name) + '</text>';
    s += '<text class="sub" x="14" y="36">' + m.agents.length + ' agent · ' + m.workflows.length + ' wf · ' + m.metrics.length + ' metric</text>';
    s += '<text class="sub" x="14" y="52" opacity="0.55">' + esc(m.lifecycle) + '</text>';
    s += '<text class="badge actEvents" x="' + (NODE_W - 12) + '" y="20" text-anchor="end" fill="' + color + '"></text>';
    s += '<text class="badge actPending" x="' + (NODE_W - 12) + '" y="38" text-anchor="end" fill="#d33"></text>';
    s += '</g>';
  }
  svg.innerHTML = s;
  svg.querySelectorAll(".node").forEach((n) => {
    n.addEventListener("click", () => showPanel(n.dataset.path));
  });
  paintLive();
}

function cssId(p) { return p.replace(/[^a-z0-9]/gi, "_"); }

function paintLive() {
  if (!GRAPH) return;
  if (LIVE && LIVE.totals) {
    const t = LIVE.totals;
    document.getElementById("totals").innerHTML =
      '<span><b>' + GRAPH.stats.moduleCount + '</b> modules</span>' +
      '<span><b>' + GRAPH.stats.agentCount + '</b> agents</span>' +
      '<span><b>' + GRAPH.stats.workflowCount + '</b> workflows</span>' +
      '<span><b>' + t.events + '</b> events</span>' +
      '<span><b>' + t.auditRows + '</b> audit rows</span>' +
      '<span><b>' + t.traces + '</b> traces</span>' +
      '<span><b>' + t.snapshots + '</b> snapshots</span>' +
      '<span style="color:#d33"><b>' + t.pendingApprovals + '</b> pending approvals</span>';
  }
  for (const path in POS) {
    const node = document.getElementById("node-" + cssId(path));
    if (!node) continue;
    const a = moduleActivity(path);
    const ev = node.querySelector(".actEvents");
    const pend = node.querySelector(".actPending");
    ev.textContent = a.events ? (a.events + " ev") : "";
    pend.textContent = a.pendingApprovals ? ("\\u26a0 " + a.pendingApprovals) : "";
  }
}

function showPanel(path) {
  SELECTED = path;
  document.querySelectorAll(".node").forEach((n) => n.classList.toggle("selected", n.dataset.path === path));
  let m = null;
  for (const d of GRAPH.domains) { const f = d.modules.find((x) => x.path === path); if (f) m = f; }
  const panel = document.getElementById("panel");
  if (!m) { panel.className = "panel empty"; panel.textContent = "Module not found."; return; }
  panel.className = "panel";
  const act = moduleActivity(path);
  const events = (LIVE && LIVE.recentEvents || []).filter((e) => e.sourceModule === path);

  let h = '<h1>' + esc(m.name) + '</h1>';
  h += '<div class="purpose">' + esc(m.purpose) + '</div>';
  h += '<div class="legend"><span class="pill">' + esc(m.domain) + '</span> <span class="pill">' + esc(m.lifecycle) + '</span> <span class="pill">consumes ' + m.consumes + '</span></div>';

  h += '<h2>Live activity</h2>';
  h += '<div class="row"><span>typed events</span><b>' + act.events + '</b></div>';
  h += '<div class="row"><span>audit rows</span><b>' + act.auditRows + '</b></div>';
  h += '<div class="row"><span>dry-runs</span><b>' + act.dryRunCount + '</b></div>';
  h += '<div class="row"><span>pending approvals</span><b style="color:' + (act.pendingApprovals ? '#d33' : 'inherit') + '">' + act.pendingApprovals + '</b></div>';
  h += '<div class="row"><span>last activity</span><span class="muted">' + esc(act.lastActivity || ", ") + '</span></div>';

  h += '<h2>Agents (' + m.agents.length + ')</h2>';
  h += m.agents.length ? m.agents.map((a) =>
    '<div class="row"><span>' + esc(a.name) + '</span><span class="pill">' + esc(a.autonomy || "?") + ' · ' + esc(a.cadence || "?") + '</span></div>').join("")
    : '<div class="muted">none declared</div>';

  h += '<h2>Workflows (' + m.workflows.length + ')</h2>';
  h += m.workflows.length ? m.workflows.map((w) =>
    '<div class="row"><span>' + esc(w.name) + (w.hitl ? ' <span class="pill">HITL</span>' : '') + '</span><span class="muted">' + w.steps + ' steps</span></div>').join("")
    : '<div class="muted">none declared</div>';

  h += '<h2>Metrics (' + m.metrics.length + ')</h2>';
  h += m.metrics.length ? m.metrics.map((mt) =>
    '<div class="row"><span>' + esc(mt.name) + '</span><span class="pill">' + esc(mt.type || "?") + '</span></div>').join("")
    : '<div class="muted">none declared</div>';

  h += '<h2>Exposes</h2>';
  h += m.exposes.length ? m.exposes.map((x) => '<code>' + esc(x) + '</code> ').join("") : '<div class="muted">nothing</div>';

  h += '<h2>Recent events</h2>';
  h += events.length ? events.slice(0, 8).map((e) =>
    '<div class="ev"><span class="t">' + esc(e.type) + '</span><br><span class="muted">' + esc(e.occurredAt) + (e.traceId ? ' · trace ' + esc(e.traceId.slice(0, 12)) : '') + '</span></div>').join("")
    : '<div class="muted">no events recorded for this module yet</div>';

  panel.innerHTML = h;
}

load();
</script>
</body>
</html>
`;
