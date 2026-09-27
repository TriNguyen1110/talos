// The one table. Everything on stage is a view of data/audit.jsonl.
// Row: { seq, ts, crossing_id, from_room, to_room, kind, verdict, confidence, decider_version,
//        option_order, probabilities, tilt, allowed, reason, override, latency_ms, text }
//
// Append-only JSONL. Every call reads or appends the file synchronously so that separate
// processes (the CLI in two terminals, the test, the timeline) see one shared table with no cache.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const AUDIT_PATH = new URL("../data/audit.jsonl", import.meta.url);
const FILE = fileURLToPath(AUDIT_PATH);

function readLines() {
  let text;
  try { text = fs.readFileSync(FILE, "utf8"); } catch (e) { if (e.code === "ENOENT") return []; throw e; }
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); } catch { /* a torn last line from a concurrent writer; skip it */ }
  }
  return rows;
}

/** The highest seq on file, 0 when empty. */
export function lastSeq() {
  const rows = readLines();
  return rows.length ? rows[rows.length - 1].seq : 0;
}

/** Append one row; assigns seq and ts; returns the row. The full text is kept, never truncated. */
export function append(row) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const full = { seq: lastSeq() + 1, ts: new Date().toISOString(), ...row };
  fs.appendFileSync(FILE, JSON.stringify(full) + "\n");
  return full;
}

/** Every row with seq > since, in order. */
export function since(seq) {
  const n = Number(seq) || 0;
  return readLines().filter((r) => r.seq > n);
}

/** All rows. */
export function all() { return readLines(); }

/** Truncate the table. The demo reset uses it; nothing else should. */
export function reset() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, "");
}
