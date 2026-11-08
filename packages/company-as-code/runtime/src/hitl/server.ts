import http from "node:http";
import type { AddressInfo } from "node:net";
import { SqliteHitlInbox } from "./inbox.js";
import { allowedHosts, refuseRequest } from "../http-guard.js";

/**
 * The HITL dashboard: a specialised "Inbox" surface for human operators.
 *
 * A world-class company OS does not make a human tail a log to find what
 * needs sign-off. This is a dedicated queue: every dry-run projection waiting
 * on a human shows up here with its full "what would happen" payload, and the
 * operator approves or rejects it (with their canonical Person ID recorded)
 * before the live write is allowed to fire.
 *
 * Deliberately dependency-free: Node's built-in http, a single HTML page, a
 * tiny JSON API. Forks swap in their own front-end against the same API.
 */

export interface InboxServerOptions {
  inbox: SqliteHitlInbox;
  port?: number;
  host?: string;
}

export interface RunningInboxServer {
  server: http.Server;
  url: string;
  close(): Promise<void>;
}

export function startInboxServer(opts: InboxServerOptions): Promise<RunningInboxServer> {
  const { inbox } = opts;
  const host = opts.host ?? "127.0.0.1";
  const port = opts.port ?? 4000;

  const server = http.createServer(async (req, res) => {
    try {
      const hosts = allowedHosts(host, (server.address() as AddressInfo).port);
      const refused = refuseRequest(req, hosts, { stateChanging: req.method !== "GET" });
      if (refused) {
        json(res, 403, { error: refused });
        return;
      }
      await route(req, res, inbox);
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
        close: () =>
          new Promise<void>((res) => server.close(() => res())),
      });
    });
  });
}

async function route(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  inbox: SqliteHitlInbox,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const method = req.method ?? "GET";

  if (method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(PAGE);
    return;
  }

  if (method === "GET" && url.pathname === "/api/items") {
    const status = url.searchParams.get("status");
    const items =
      status === "pending" || status === "approved" || status === "rejected"
        ? inbox.list(status)
        : inbox.list();
    json(res, 200, { items });
    return;
  }

  if (method === "POST" && url.pathname === "/api/resolve") {
    const body = await readJson(req);
    const { id, approved, approver, reason } = body as {
      id?: string;
      approved?: boolean;
      approver?: string;
      reason?: string;
    };
    if (!id || typeof approved !== "boolean" || !approver) {
      json(res, 400, { error: "id, approved (boolean) and approver are required" });
      return;
    }
    try {
      const item = inbox.resolve(id, { approved, approver, reason });
      json(res, 200, { item });
    } catch (err) {
      json(res, 409, { error: (err as Error).message });
    }
    return;
  }

  json(res, 404, { error: `no route for ${method} ${url.pathname}` });
}

function json(res: http.ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(body);
}

function readJson(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > 1_000_000) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

// Single-page dashboard. All data is fetched client-side from /api/items so
// the server stays a thin JSON layer over the inbox store.
const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Company-as-Code, HITL Inbox</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 0 0 4rem; }
  header { padding: 1rem 1.5rem; border-bottom: 1px solid #8884; position: sticky; top: 0; background: Canvas; }
  h1 { font-size: 1.1rem; margin: 0; }
  .sub { opacity: .65; font-size: .85rem; }
  main { padding: 1.5rem; max-width: 60rem; margin: 0 auto; }
  .item { border: 1px solid #8884; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
  .item.pending { border-left: 4px solid #e0a800; }
  .item.approved { border-left: 4px solid #2e9e44; opacity: .75; }
  .item.rejected { border-left: 4px solid #d33; opacity: .75; }
  .meta { display: flex; flex-wrap: wrap; gap: .25rem 1.25rem; font-size: .85rem; margin-bottom: .5rem; }
  .meta b { font-weight: 600; }
  pre { background: #8881; padding: .75rem; border-radius: 6px; overflow: auto; max-height: 18rem; margin: .5rem 0; }
  .controls { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; margin-top: .5rem; }
  input { font: inherit; padding: .35rem .5rem; border: 1px solid #8886; border-radius: 6px; background: Canvas; color: inherit; }
  button { font: inherit; padding: .4rem .9rem; border-radius: 6px; border: 1px solid #8886; cursor: pointer; }
  button.approve { background: #2e9e44; color: #fff; border-color: #2e9e44; }
  button.reject { background: #d33; color: #fff; border-color: #d33; }
  .empty { opacity: .6; padding: 2rem 0; text-align: center; }
  .tag { font-size: .75rem; padding: .1rem .45rem; border-radius: 999px; background: #8882; }
  h2 { font-size: .95rem; margin: 2rem 0 .75rem; opacity: .8; }
  .err { color: #d33; font-size: .85rem; }
</style>
</head>
<body>
<header>
  <h1>HITL Inbox <span class="tag" id="count">…</span></h1>
  <div class="sub">Approve or reject dry-run projections before the live write fires. Auto-refreshes every 4s.</div>
</header>
<main>
  <div id="pending"></div>
  <h2>Resolved</h2>
  <div id="resolved"></div>
</main>
<script>
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function itemCard(it, isPending) {
  const proj = it.projection === undefined ? '(no projection captured)' : JSON.stringify(it.projection, null, 2);
  const meta = [
    ['workflow', it.module + '::' + it.workflow],
    ['step', it.stepId],
    ['approver role', it.approverRole],
    ['triggered by', it.triggerActor],
    ['correlation', it.correlationId],
    it.traceId ? ['trace', it.traceId] : null,
  ].filter(Boolean).map(([k,v]) => '<span><b>' + esc(k) + ':</b> ' + esc(v) + '</span>').join('');
  let controls = '';
  if (isPending) {
    controls = '<div class="controls">'
      + '<input id="ap-' + it.id + '" placeholder="approver canonical Person ID" size="32" />'
      + '<input id="rs-' + it.id + '" placeholder="reason (optional)" size="28" />'
      + '<button class="approve" onclick="resolveItem(\\'' + it.id + '\\', true)">Approve</button>'
      + '<button class="reject" onclick="resolveItem(\\'' + it.id + '\\', false)">Reject</button>'
      + '<span class="err" id="er-' + it.id + '"></span>'
      + '</div>';
  } else {
    controls = '<div class="meta"><span><b>' + esc(it.status) + '</b> by ' + esc(it.resolvedBy || '?')
      + ' at ' + esc(it.resolvedAt || '?') + (it.reason ? ', ' + esc(it.reason) : '') + '</span></div>';
  }
  return '<div class="item ' + it.status + '">'
    + '<div class="meta">' + meta + '</div>'
    + '<pre>' + esc(proj) + '</pre>'
    + controls + '</div>';
}

async function resolveItem(id, approved) {
  const approver = document.getElementById('ap-' + id).value.trim();
  const reason = document.getElementById('rs-' + id).value.trim();
  const errEl = document.getElementById('er-' + id);
  errEl.textContent = '';
  if (!approver) { errEl.textContent = 'approver Person ID is required'; return; }
  const res = await fetch('/api/resolve', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, approved, approver, reason: reason || undefined }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    errEl.textContent = body.error || ('HTTP ' + res.status);
    return;
  }
  refresh();
}

async function refresh() {
  try {
    const res = await fetch('/api/items');
    const { items } = await res.json();
    const pending = items.filter((i) => i.status === 'pending');
    const resolved = items.filter((i) => i.status !== 'pending');
    document.getElementById('count').textContent = pending.length + ' pending';
    document.getElementById('pending').innerHTML = pending.length
      ? pending.map((i) => itemCard(i, true)).join('')
      : '<div class="empty">Nothing waiting on a human. 🎉</div>';
    document.getElementById('resolved').innerHTML = resolved.length
      ? resolved.map((i) => itemCard(i, false)).join('')
      : '<div class="empty">No resolved items yet.</div>';
  } catch (e) {
    document.getElementById('count').textContent = 'offline';
  }
}
refresh();
setInterval(refresh, 4000);
</script>
</body>
</html>
`;
