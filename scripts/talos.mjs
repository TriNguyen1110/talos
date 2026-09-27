#!/usr/bin/env node
// The Talos CLI. demo/run.sh shells out to it; every command prints exactly one JSON value on
// stdout and nothing else (chatter goes to stderr). Exit 0 on success, 1 with {"error"} on failure.
//
//   node scripts/talos.mjs mint <role>                     -> {"token":"..."}
//   node scripts/talos.mjs write <room> "<text>"           -> audit rows from onWrite; also writes rooms/<room>/brain/<ts>.md
//   node scripts/talos.mjs changes <token> <room> <since>  -> rows delivered to <room> with seq > since
//   node scripts/talos.mjs check <token> <room> <action>   -> {"allowed":bool,"reason":"..."}
//   node scripts/talos.mjs revoke <token>                  -> {"revoked":true}
//   node scripts/talos.mjs revoke-role <role>              -> {"revoked":n}
//   node scripts/talos.mjs override <crossing_id> <verdict> -> the override row
//   node scripts/talos.mjs seq                             -> {"seq":lastSeq}
//   node scripts/talos.mjs reset                           -> {"reset":true}  (audit, tokens, rooms/*/brain/*.md)
import fs from "node:fs";
import path from "node:path";
import * as audit from "../src/audit.mjs";
import * as access from "../src/access.mjs";
import * as bridge from "../src/bridge.mjs";
import { ROOMS_DIR, brainDir } from "../src/rooms/dir.mjs";

const out = (v) => { process.stdout.write(JSON.stringify(v) + "\n"); };
const need = (v, what) => { if (v === undefined || v === "") throw new Error(`missing ${what}`); return v; };

async function main([cmd, ...a]) {
  switch (cmd) {
    case "mint":
      return { token: access.mint(need(a[0], "role")) };
    case "write": {
      const room = need(a[0], "room"), text = need(a.slice(1).join(" "), "text");
      if (!access.ROOMS.includes(room)) throw new Error(`unknown room: ${room}`);
      const dir = brainDir(room);
      fs.mkdirSync(dir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      fs.writeFileSync(path.join(dir, `${stamp}.md`), text.endsWith("\n") ? text : text + "\n");
      return bridge.onWrite(room, text);
    }
    case "changes":
      return bridge.changes(need(a[0], "token"), need(a[1], "room"), Number(a[2] ?? 0) || 0);
    case "check":
      return access.check(need(a[0], "token"), need(a[1], "room"), need(a[2], "action"));
    case "revoke": {
      const r = access.revoke(need(a[0], "token"));
      if (!r.revoked) throw new Error(r.reason);
      return { revoked: true };
    }
    case "revoke-role":
      return { revoked: access.revokeRole(need(a[0], "role")) };
    case "override":
      return bridge.override(need(a[0], "crossing_id"), need(a[1], "verdict"));
    case "seq":
      return { seq: audit.lastSeq() };
    case "watch": {
      // The adapter path: a page written into rooms/<room>/brain/ (by an agent, or by a GBrain-backed
      // agent whose brain is that directory) crosses through the watcher, not through `write`.
      // Long-running: prints {"watching":room} then one JSON line per crossing, until killed.
      const room = need(a[0], "room");
      if (!access.ROOMS.includes(room)) throw new Error(`unknown room: ${room}`);
      const { watch } = await import("../src/rooms/dir.mjs");
      const close = watch(room, async (from, text) => out(await bridge.onWrite(from, text)));
      out({ watching: room, dir: brainDir(room) });
      await new Promise((resolve) => { process.on("SIGINT", resolve); process.on("SIGTERM", resolve); });
      close();
      return { stopped: room };
    }
    case "reset": {
      audit.reset();
      access.resetTokens();
      for (const room of access.ROOMS) {
        const dir = path.join(ROOMS_DIR, room, "brain");
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir)) if (f.endsWith(".md")) fs.unlinkSync(path.join(dir, f));
      }
      return { reset: true };
    }
    default:
      throw new Error(`usage: talos.mjs mint|write|changes|check|revoke|revoke-role|override|seq|watch|reset (got: ${cmd ?? "nothing"})`);
  }
}

try { out(await main(process.argv.slice(2))); }
catch (e) { out({ error: e.message }); process.exit(1); }
