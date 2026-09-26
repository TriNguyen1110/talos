// Watch a room's write path -> classify -> decide -> check -> deliver -> audit row.
// Delivery is a change block the target room's next tool call picks up via changes(since).
export async function onWrite(fromRoom, text) { throw new Error("not implemented: bridge.onWrite"); }
/** What a room's agent sees on its next tool call: rows delivered to it since seq. */
export function changes(token, room, since) { throw new Error("not implemented: bridge.changes"); }
/** A human flips a verdict; writes an override row. Beat 5. */
export function override(crossingId, verdict) { throw new Error("not implemented: bridge.override"); }
