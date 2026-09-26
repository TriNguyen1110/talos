// One function, three implementations, same signature.
// decide(change) -> { verdict: "share"|"hold"|"discard", targets: string[], confidence: number, version: string }
// change: { id, from_room, kind?, text }
// TALOS_DECIDER = off | rules | jev | river; default jev when JEV_API_KEY is set, else rules.
// "off" is beat 1's control: nothing crosses. jev falls back to rules on error or after 2 s, and the
// returned version then reads "rules-v0 (fallback)". Jev asks two Choice questions against one state:
// kind over KINDS, verdict over VERDICTS; targets always come from access.crossers, never the model.
// Log option order and per-option probabilities on every call; v1.5 trains on them.
export const KINDS = ["contract", "decision", "verdict", "private_note", "noise"];
export const VERDICTS = ["share", "hold", "discard"];
export const JEV_TIMEOUT_MS = 2000;
export const VERSION = { rules: "rules-v0", jev: process.env.JEV_MODEL ?? "jev-unpinned", river: "river-v2" };

export async function decide(change) { throw new Error("not implemented: decider.decide"); }
/** v0. private_note -> hold; contract|decision|verdict -> share to crossers; noise -> discard. */
export function rules(change) { throw new Error("not implemented: decider.rules"); }
/** Ask Jev both questions; returns { kind, verdict, probabilities, confidence } or throws. */
export async function jev(change) { throw new Error("not implemented: decider.jev"); }
/** Classify kind when the caller did not say. v0 uses keywords; v1 asks Jev. */
export async function classify(change) { throw new Error("not implemented: decider.classify"); }
