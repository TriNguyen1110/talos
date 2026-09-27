#!/usr/bin/env node
// Serves the factory demo: the split page, the app the rooms build, and the audit table as JSON.
//   node demo/factory/server.mjs            -> http://localhost:4242
// No dependencies. Read-only; the rooms write through scripts/talos.mjs and demo/factory/build.sh.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
let building = null;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const PORT = Number(process.env.PORT || 4242);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml" };

const readJsonl = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []);

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const send = (code, body, type = "application/json") => { res.writeHead(code, { "content-type": type, "cache-control": "no-store", "access-control-allow-origin": "*" }); res.end(body); };
  if (url.pathname === "/audit") {
    const since = Number(url.searchParams.get("since") || 0);
    return send(200, JSON.stringify(readJsonl(path.join(ROOT, "data/audit.jsonl")).filter((r) => r.seq > since)));
  }
  if (url.pathname === "/build") {           // POST-free on purpose: a click from the page starts the rooms
    if (building && building.exitCode === null) return send(409, JSON.stringify({ running: true }));
    const product = (url.searchParams.get("product") || "dating").replace(/[^a-z]/g, "");
    const args = ["demo/factory/build.sh", product]; if (url.searchParams.get("fast")) args.push("--fast");
    building = spawn("bash", args, { cwd: ROOT, env: { ...process.env, TALOS_DECIDER: url.searchParams.get("decider") || "rules" }, stdio: ["ignore", "pipe", "pipe"] });
    building.stdout.on("data", (d) => process.stdout.write(d)); building.stderr.on("data", (d) => process.stderr.write(d));
    return send(200, JSON.stringify({ started: true, pid: building.pid }));
  }
  if (url.pathname === "/status") { let cur = {}; try { cur = JSON.parse(fs.readFileSync(path.join(HERE, "current.json"), "utf8")); } catch {} return send(200, JSON.stringify({ running: !!(building && building.exitCode === null), product: cur.product || "dating" })); }
  if (url.pathname === "/runs") { const d = path.join(HERE, "runs"); return send(200, JSON.stringify(fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")) : [])); }
  if (url.pathname === "/products") return send(200, JSON.stringify(fs.readdirSync(path.join(HERE, "products")).filter((f) => f.endsWith(".sh")).map((f) => f.replace(/\.sh$/, ""))));
  if (url.pathname === "/steps") {
    const p = path.join(HERE, "steps.log");
    return send(200, JSON.stringify(fs.existsSync(p) ? fs.readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : []));
  }
  let file = url.pathname === "/" ? "/index.html" : url.pathname;
  if (file.endsWith("/")) file += "index.html";
  const abs = path.normalize(path.join(HERE, file));
  if (!abs.startsWith(HERE) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) return send(404, "not found", "text/plain");
  send(200, fs.readFileSync(abs), TYPES[path.extname(abs)] || "application/octet-stream");
}).listen(PORT, () => console.log(`factory demo: http://localhost:${PORT}  (app at /app/, audit at /audit)`));
