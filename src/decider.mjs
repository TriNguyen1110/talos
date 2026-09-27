// One function, one live implementation, same signature for any that follows.
// decide(change) -> { verdict: "share"|"hold"|"discard", targets: string[], confidence: number, version: string, ... }
// change: { id, from_room, kind?, text }
// TALOS_DECIDER = off | rules. Scope decision 2026-09-27 14:50 PDT: no Jev, no River in this build;
// `jev`, `river` and unset all resolve to rules-v0. "off" is beat 1's control: nothing crosses.
// Targets always come from access.crossers, never from the text. Option order and per-option
// probabilities are logged on every call so a later version can train on the record.
import { crossers, ROOMS } from "./access.mjs";

export const KINDS = ["contract", "decision", "verdict", "private_note", "noise"];
export const VERDICTS = ["share", "hold", "discard"];
export const VERSION = { off: "off", rules: "rules-v0" };

/** Keyword signals per kind. Confidence is the fraction of a kind's signals that fired. */
export const SIGNALS = {
  contract:     [/switch to/i, /field is now/i, /\bschema\b/i, /\bendpoint\b/i, /\bAPI\b/, /\bbreaking\b/i, /\brenam(e|ed|ing)\b/i, /\bGraphQL\b/i, /\bREST\b/],
  decision:     [/we decided/i, /\bdecision\b/i, /\bassign(ed|ing)?\b/i],
  verdict:      [/\bverdict\b/i, /\bapproved\b/i, /\brejected\b/i, /\bLGTM\b/],
  private_note: [/\btrying\b/i, /\bapproach\b/i, /\bI will\b/i, /\bdraft\b/i, /\bscratch\b/i, /if it .* I will/i],
};
/** Beat 4: untrusted text that tries to steer the decider. It moves the probabilities, never the scope. */
export const INJECTION = /SYSTEM:|share (this|everything|this entire note) with (every|all) room/i;
const VERDICT_FOR_KIND = { contract: "share", decision: "share", verdict: "share", private_note: "hold", noise: "discard" };

function resolveMode(raw) {
  return raw === "off" ? "off" : "rules";
}

/** Score the text against every kind; returns { kind, confidence, probabilities } deterministically. */
function scoreKind(text) {
  const t = String(text ?? "");
  const scores = {};
  for (const k of KINDS) {
    const sig = SIGNALS[k] ?? [];
    scores[k] = sig.length ? sig.filter((re) => re.test(t)).length / sig.length : 0;
  }
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const probabilities = {};
  if (total === 0) { for (const k of KINDS) probabilities[k] = k === "noise" ? 1 : 0; }
  else { for (const k of KINDS) probabilities[k] = Math.round((scores[k] / total) * 1000) / 1000; }
  let kind = "noise";
  for (const k of KINDS) if (scores[k] > (scores[kind] ?? 0)) kind = k; // first in KINDS order wins a tie
  const confidence = total === 0 ? 1 : Math.round(scores[kind] * 1000) / 1000;
  return { kind, confidence, probabilities };
}

/** Classify kind when the caller did not say. v0 uses keywords. */
export async function classify(change) {
  if (change?.kind && KINDS.includes(change.kind)) return change.kind;
  return scoreKind(change?.text).kind;
}

/** v0. private_note -> hold; contract|decision|verdict -> share to crossers; noise -> discard. */
export function rules(change) {
  const text = String(change?.text ?? "");
  const scored = scoreKind(text);
  const kind = change?.kind && KINDS.includes(change.kind) ? change.kind : scored.kind;
  const confidence = change?.kind && KINDS.includes(change.kind) ? (scored.kind === kind ? scored.confidence : 0.5) : scored.confidence;
  const verdict = VERDICT_FOR_KIND[kind];
  const targets = verdict === "share" ? crossers(change.from_room, kind) : [];

  // Verdict probabilities: the kind's verdict takes 0.5 + 0.5*confidence, the rest is split.
  const p = {}; const rest = (1 - (0.5 + 0.5 * confidence)) / 2;
  for (const v of VERDICTS) p[v] = v === verdict ? 0.5 + 0.5 * confidence : rest;

  // Beat 4: an injected line tilts share upward and asks for every room. The verdict stays kind-driven
  // and the bridge runs the scope check on each requested target, so the audit shows the tilt and the refusal.
  const tilt = INJECTION.test(text);
  let requested_targets = targets;
  if (tilt) {
    const moved = Math.min(0.35, p.hold + p.discard);
    p.share += moved; p.hold = Math.max(0, p.hold - moved * 0.7); p.discard = Math.max(0, 1 - p.share - p.hold);
    requested_targets = ROOMS.filter((r) => r !== change.from_room);
  }
  for (const v of VERDICTS) p[v] = Math.round(p[v] * 1000) / 1000;

  return {
    verdict, targets, requested_targets, confidence, version: VERSION.rules, kind, tilt,
    option_order: { kind: [...KINDS], verdict: [...VERDICTS] },
    probabilities: { kind: scored.probabilities, verdict: p },
  };
}

/** TALOS_DECIDER is read here, at call time; the test flips it between beats in one process. */
export async function decide(change) {
  const mode = resolveMode(process.env.TALOS_DECIDER);
  if (mode === "off") {
    return {
      verdict: "discard", targets: [], requested_targets: [], confidence: 1, version: VERSION.off,
      kind: change?.kind ?? null, tilt: false,
      option_order: { kind: [...KINDS], verdict: [...VERDICTS] }, probabilities: null,
    };
  }
  return rules(change);
}

/** Not in this build. Kept so the signature file stays honest about what a v1 would be. */
export async function jev() { throw new Error("not in this build: decider is rules-only"); }
