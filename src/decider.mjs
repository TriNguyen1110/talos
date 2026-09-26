// One function, three implementations, same signature.
// decide(change) -> { verdict: "share"|"hold"|"discard", targets: string[], confidence: number, version: string }
// change: { id, from_room, kind?, text }
// TALOS_DECIDER = off | rules | jev | river. "off" is beat 1's control: nothing crosses.
export const VERSION = { rules: "rules-v0", jev: process.env.JEV_MODEL ?? "jev-unpinned", river: "river-v2" };

export async function decide(change) { throw new Error("not implemented: decider.decide"); }
/** v0. private_note -> hold; contract|decision|verdict -> share to crossers; noise -> discard. */
export function rules(change) { throw new Error("not implemented: decider.rules"); }
/** Classify kind when the caller did not say. v0 uses keywords; v1 asks Jev. */
export async function classify(change) { throw new Error("not implemented: decider.classify"); }
