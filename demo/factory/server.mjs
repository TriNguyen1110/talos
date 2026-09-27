#!/usr/bin/env node
// Serves the factory demo: the split page, the app the rooms build, and the audit table as JSON.
//   node demo/factory/server.mjs            -> http://localhost:4242
// No dependencies. Read-only; the rooms write through scripts/talos.mjs and demo/factory/build.sh.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
