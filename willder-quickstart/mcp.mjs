// The one HTTP call both checks make: JSON-RPC to the hosted Willder MCP endpoint.
// Node 20+ only, no dependencies. Tokens come from the environment and are never printed.

export const ENDPOINT = process.env.WILLDER_MCP_URL ?? "https://willder.ai/api/mcp";

/**
 * Sends one JSON-RPC request. `token` may be undefined to send no Authorization header.
 * Returns the HTTP status, whether the tool reported an error, and the text it returned.
 */
export async function rpc(token, method, params = {}) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  if (token !== undefined) headers.authorization = `Bearer ${token}`;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(30_000),
  });
  const raw = await res.text();
  // Streamable HTTP may answer as server-sent events: the JSON is the last `data:` line.
  const json = raw.startsWith("event:") || raw.startsWith("data:")
    ? raw.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).pop() ?? ""
    : raw;
  let body = {};
  try { body = JSON.parse(json); } catch { /* not JSON: keep the raw text below */ }
  if (body.error) return { status: res.status, isError: true, text: body.error.message ?? "error", tools: [] };
  const text = (body.result?.content ?? []).map((c) => c.text ?? "").join("\n") || (body.result ? "" : raw);
  return {
    status: res.status,
    isError: Boolean(body.result?.isError),
    text,
    tools: (body.result?.tools ?? []).map((t) => t.name),
  };
}

export const callTool = (token, name, args) => rpc(token, "tools/call", { name, arguments: args });

/** Reads a required token from the environment, or exits with a message naming the variable. */
export function requireToken(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`${name} is not set. See README.md, step 2.`);
    process.exit(2);
  }
  return value;
}

/** A pass/fail ledger that prints one line per check and sets the exit code at the end. */
export function ledger() {
  let failed = 0;
  return {
    check(ok, label, detail = "") {
      if (!ok) failed += 1;
      console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
    },
    finish() {
      console.log(failed ? `\n${failed} check(s) failed.` : "\nAll checks passed.");
      process.exitCode = failed ? 1 : 0;
    },
  };
}

/** First line of a server reply, shortened, safe to print (replies never echo the token). */
export const brief = (text) => (text ?? "").split("\n")[0].slice(0, 100);
