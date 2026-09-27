// Watch a room's write path -> classify -> decide -> check -> deliver -> audit row.
// Delivery is a change block the target room's next tool call picks up via changes(since).
import * as audit from "./audit.mjs";
import { check, crossers } from "./access.mjs";
import { classify, decide, VERDICTS } from "./decider.mjs";

function nextId() {
  // Zero-padded from the table's next seq, so "crossing c-042" reads in a commit message and is
  // unique across processes (every onWrite appends at least one row).
  return "c-" + String(audit.lastSeq() + 1).padStart(3, "0");
}

/** A write in fromRoom. Returns the audit rows it produced (one per requested target, or one hold/discard row). */
export async function onWrite(fromRoom, text) {
  const t0 = performance.now();
  const id = nextId();
  const change = { id, from_room: fromRoom, text: String(text) };
  const kind = await classify(change);
  const d = await decide({ ...change, kind });
  const latency_ms = Math.round((performance.now() - t0) * 10) / 10;

  const base = {
    crossing_id: id, from_room: fromRoom, kind, verdict: d.verdict, confidence: d.confidence,
    decider_version: d.version, option_order: d.option_order ?? null, probabilities: d.probabilities ?? null,
    tilt: d.tilt ?? false, override: null, latency_ms, text: change.text,
  };
  const requested = d.requested_targets ?? d.targets ?? [];
  if (requested.length === 0) {
    const reason = d.version === "off" ? "decider off: nothing crosses"
      : d.verdict === "hold" ? `hold: ${kind} stays in ${fromRoom}`
      : `${d.verdict}: ${kind} from ${fromRoom} crosses to nobody`;
    return [audit.append({ ...base, to_room: null, allowed: null, reason })];
  }

  // The scope check is the boundary: the decider may ask for any room, the table decides.
  const may = crossers(fromRoom, kind);
  const rows = [];
  for (const target of requested) {
    const inScope = may.includes(target);
    const allowed = inScope && d.verdict === "share";
    const reason = !inScope ? `scope: ${kind} does not cross from ${fromRoom}`
      : allowed ? `scope: ${kind} crosses from ${fromRoom} to ${target}`
      : `${d.verdict}: not delivered`;
    rows.push(audit.append({ ...base, to_room: target, allowed, reason }));
  }
  return rows;
}

/** What a room's agent sees on its next tool call: rows delivered to it since seq. The token is the scope. */
export function changes(token, room, since = 0) {
  const c = check(token, room, "read"); // writes the allow/deny row itself
  if (!c.allowed) return [];
  return audit.since(since).filter((r) =>
    r.crossing_id && r.to_room === room && r.verdict === "share" && r.allowed === true && r.override == null);
}

/** A human flips a verdict; writes an override row. Beat 5. The row is a record, never a delivery. */
export function override(crossingId, verdict) {
  if (!VERDICTS.includes(verdict)) throw new Error(`unknown verdict: ${verdict}`);
  const orig = audit.all().find((r) => r.crossing_id === crossingId && r.override == null);
  if (!orig) throw new Error(`unknown crossing: ${crossingId}`);
  return audit.append({
    crossing_id: orig.crossing_id, from_room: orig.from_room, to_room: orig.to_room, kind: orig.kind,
    verdict: orig.verdict, override: verdict, confidence: orig.confidence, decider_version: orig.decider_version,
    option_order: orig.option_order ?? null, probabilities: orig.probabilities ?? null, tilt: orig.tilt ?? false,
    allowed: null, reason: "human override", latency_ms: null, text: orig.text,
  });
}
