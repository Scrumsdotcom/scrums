import type http from "node:http";

/**
 * Request checks for the local dashboards (HITL inbox, cognition graph).
 *
 * The dashboards listen on loopback by default. Loopback alone does not stop
 * a web page in the operator's browser from reaching them:
 *
 * - DNS rebinding: a page on attacker.example re-points its own name at
 *   127.0.0.1 and then reads or writes the API as same-origin. The Host
 *   header still says attacker.example, so it is checked against the address
 *   the server is bound to.
 * - Cross-site POST: a page sends a "simple" POST (text/plain) that needs no
 *   preflight. State-changing routes therefore require
 *   `content-type: application/json`, which a cross-origin page cannot send
 *   without a preflight that this server never approves, and an Origin, when
 *   present, must be the dashboard's own.
 *
 * When the server is bound to a non-loopback address the operator has chosen
 * to expose it, and the Host check is skipped. The JSON and Origin checks
 * still apply.
 */

const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export function allowedHosts(host: string, port: number): Set<string> | null {
  if (!LOOPBACK.has(host)) return null;
  return new Set([`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`]);
}

/** Returns an error message when the request must be refused, else null. */
export function refuseRequest(
  req: http.IncomingMessage,
  hosts: Set<string> | null,
  opts: { stateChanging: boolean },
): string | null {
  const hostHeader = (req.headers.host ?? "").toLowerCase();
  if (hosts && !hosts.has(hostHeader)) return `host '${hostHeader}' is not served here`;

  if (!opts.stateChanging) return null;

  const contentType = String(req.headers["content-type"] ?? "").toLowerCase();
  if (!contentType.startsWith("application/json")) return "content-type must be application/json";

  const origin = req.headers.origin;
  if (origin !== undefined) {
    let originHost: string;
    try {
      originHost = new URL(origin).host.toLowerCase();
    } catch {
      return "origin is not a URL";
    }
    if (hosts ? !hosts.has(originHost) : originHost !== hostHeader) {
      return `origin '${origin}' is not this dashboard`;
    }
  }
  return null;
}
