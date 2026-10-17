// Black-box leak suite against the hosted service: a fact written in scope A must never
// reach a token for sibling scope B, while A itself reads it back (so a filter that hides
// everything fails too). Also: no token, a fake token, and a write from a read-only token
// are all refused. Exit 0 means every check passed.
//
//   LEAK_TOKEN_A  write token on scope A
//   LEAK_TOKEN_B  read token on scope B (a sibling of A, not its parent)
//   LEAK_SCOPE_A  optional: scope A's path, to also try naming A from B's token

import { randomUUID } from "node:crypto";
import { ENDPOINT, rpc, callTool, requireToken, ledger, brief } from "./mcp.mjs";

const tokenA = requireToken("LEAK_TOKEN_A");
const tokenB = requireToken("LEAK_TOKEN_B");
const scopeA = process.env.LEAK_SCOPE_A?.trim();
const canary = `leak-canary-${randomUUID()}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const t = ledger();

console.log(`Endpoint: ${ENDPOINT}\nCanary:   ${canary}\n`);

const anon = await rpc(undefined, "tools/list");
t.check(anon.status === 401, "a call with no token is refused", `HTTP ${anon.status}`);

const fake = await rpc("wcap_not_a_real_token", "tools/list");
t.check(fake.status === 401, "a made-up token is refused", `HTTP ${fake.status}`);

const listA = await rpc(tokenA, "tools/list");
t.check(listA.status === 200 && listA.tools.includes("memory_ingest"), "token A is accepted", `HTTP ${listA.status}, ${listA.tools.length} tools`);
const listB = await rpc(tokenB, "tools/list");
t.check(listB.status === 200 && listB.tools.includes("memory_query"), "token B is accepted", `HTTP ${listB.status}, ${listB.tools.length} tools`);
if (listA.status !== 200 || listB.status !== 200) {
  // Every later check needs two working tokens; with a refused one they would pass for the wrong reason.
  console.log("\nStopping: both tokens must be accepted before a leak can be tested. See README.md, step 2.");
  t.finish();
  process.exit();
}

const write = await callTool(tokenA, "memory_ingest", {
  content: `The leak check canary is ${canary}. It must only be readable in scope A.`,
  name: "leak check canary",
});
t.check(write.status === 200 && !write.isError, "token A writes the canary in scope A", brief(write.text));

// Positive control: A must see its own fact, or "B saw nothing" proves nothing.
let seenByA = false;
for (let attempt = 0; attempt < 5 && !seenByA; attempt += 1) {
  if (attempt) await sleep(2_000);
  const r = await callTool(tokenA, "memory_query", { query: canary, limit: 10 });
  seenByA = r.status === 200 && r.text.includes(canary);
}
t.check(seenByA, "token A reads the canary back (positive control)");

const queryB = await callTool(tokenB, "memory_query", { query: canary, limit: 50 });
t.check(queryB.status === 200 && !queryB.text.includes(canary), "token B's search does not return the canary", brief(queryB.text));

const changesB = await callTool(tokenB, "memory_changes", {});
t.check(changesB.status === 200 && !changesB.text.includes(canary), "token B's change feed does not mention the canary", `HTTP ${changesB.status}`);

if (scopeA) {
  const named = await callTool(tokenB, "memory_query", { query: canary, scopePath: scopeA, limit: 50 });
  t.check(named.status === 200 && !named.text.includes(canary), "token B naming scope A explicitly still gets no canary", brief(named.text));
} else {
  console.log("SKIP  token B naming scope A explicitly (set LEAK_SCOPE_A to run it)");
}

const writeB = await callTool(tokenB, "memory_ingest", { content: `read-only write attempt ${canary}`, name: "leak check canary" });
t.check(writeB.status === 200 && writeB.isError && !writeB.text.includes("Stored"), "token B (read-only) cannot write", brief(writeB.text));

t.finish();
