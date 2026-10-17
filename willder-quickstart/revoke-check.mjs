// Revocation check against the hosted service: the token works, you revoke it in the app,
// and its very next call is refused. Exit 0 means it was accepted before and refused after.
//
//   WILLDER_TOKEN  any token you are willing to revoke
//
//   node revoke-check.mjs          interactive: checks, waits for you to revoke, checks again
//   node revoke-check.mjs --after  only the "after" half, for a token already revoked

import { createInterface } from "node:readline/promises";
import { ENDPOINT, rpc, callTool, requireToken, ledger, brief } from "./mcp.mjs";

const token = requireToken("WILLDER_TOKEN");
const afterOnly = process.argv.includes("--after");
const t = ledger();
console.log(`Endpoint: ${ENDPOINT}\n`);

if (!afterOnly) {
  const before = await rpc(token, "tools/list");
  t.check(before.status === 200 && before.tools.length > 0, "the token is accepted before revocation", `HTTP ${before.status}, ${before.tools.length} tools`);
  if (before.status !== 200) {
    console.log("\nThe token is not accepted now, so revoking it would prove nothing. Check WILLDER_TOKEN.");
    t.finish();
    process.exit();
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await rl.question("\nNow revoke it: Access -> Tokens, `revoke` on its row, `yes` at Sure?. Then press Enter here. ");
  rl.close();
}

const started = Date.now();
const list = await rpc(token, "tools/list");
const ms = Date.now() - started;
t.check(list.status === 401, "its next call (tools/list) is refused", `HTTP ${list.status} after ${ms} ms: ${brief(list.text)}`);
const query = await callTool(token, "memory_query", { query: "anything", limit: 1 });
t.check(query.status === 401, "a memory read with it is refused too", `HTTP ${query.status}: ${brief(query.text)}`);
t.finish();
