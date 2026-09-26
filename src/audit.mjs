// The one table. Everything on stage is a view of data/audit.jsonl.
// Row: { seq, ts, crossing_id, from_room, to_room, kind, verdict, confidence, decider_version,
//        option_order, allowed, reason, override, latency_ms }
export const AUDIT_PATH = new URL("../data/audit.jsonl", import.meta.url);

/** Append one row; assigns seq and ts; returns the row. */
export function append(row) { throw new Error("not implemented: audit.append"); }
/** Every row with seq > since, in order. */
export function since(seq) { throw new Error("not implemented: audit.since"); }
/** All rows. */
export function all() { throw new Error("not implemented: audit.all"); }
