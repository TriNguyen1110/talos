// Roles, tokens, the matrix from CLAUDE.md, check() and revoke().
// The token's scope is the boundary, never a parameter the caller passes.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as audit from "./audit.mjs";

export const ROLES = ["pm", "frontend", "backend", "qa"];
/** Rooms carry the same names as the roles that own them. */
export const ROOMS = ROLES;
export const ACTIONS = ["read", "write", "verdict"];

/**
 * The access matrix (CLAUDE.md "Roles and scopes"), one readable table.
 *   own   = actions a role may take in its own room
 *   other = actions a role may take in any room it does not own
 * Shared contracts reach frontend/backend as crossings via bridge.changes(), never by reading
 * the other room; outputs reach QA the same way. Nobody but the owner writes into a room.
 */
export const MATRIX = {
  //            own room                       other rooms
  pm:       { own: ["read", "write"],           other: ["read"] },     // reads decisions and verdicts
  frontend: { own: ["read", "write"],           other: [] },           // shared contracts arrive as crossings
  backend:  { own: ["read", "write"],           other: [] },           // shared contracts arrive as crossings
  qa:       { own: ["read", "write", "verdict"], other: ["verdict"] }, // outputs arrive as crossings; writes verdicts only
};

/**
 * Where a change of each kind may cross to, by the room that wrote it. "*" is any other room.
 * targets always come from this table, never from the decider or the text.
 */
export const CROSSERS = {
  contract:     { backend: ["frontend", "qa"], frontend: ["backend", "qa"] },
  decision:     { pm: ["frontend", "backend", "qa"], "*": ["pm"] },
  verdict:      { qa: ["pm", "frontend", "backend"] },
  private_note: {},
  noise:        {},
};

const TOKENS_PATH = fileURLToPath(new URL("../data/tokens.json", import.meta.url));

function loadTokens() {
  try { return JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8")); } catch (e) { if (e.code === "ENOENT") return []; throw e; }
}
function saveTokens(list) {
  fs.mkdirSync(path.dirname(TOKENS_PATH), { recursive: true });
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(list, null, 0) + "\n");
}

/** Mint a token for a role. Returns an opaque string; never log it. */
export function mint(role) {
  if (!ROLES.includes(role)) throw new Error(`unknown role: ${role}`);
  const token = crypto.randomBytes(16).toString("hex");
  const list = loadTokens();
  list.push({ token, role, revoked: false, minted: new Date().toISOString() });
  saveTokens(list);
  return token;
}

/**
 * { allowed: boolean, reason: string }. action is "read" | "write" | "verdict".
 * Every check, allow or deny, is an audit row (kind "access"); the deny is what beat 4 and 5 show.
 */
export function check(token, room, action) {
  const rec = loadTokens().find((t) => t.token === token);
  let allowed = false, reason;
  if (!rec) reason = "unknown token";
  else if (rec.revoked) reason = "revoked";
  else if (!ROOMS.includes(room)) reason = `unknown room: ${room}`;
  else if (!ACTIONS.includes(action)) reason = `unknown action: ${action}`;
  else {
    const own = rec.role === room;
    allowed = (own ? MATRIX[rec.role].own : MATRIX[rec.role].other).includes(action);
    reason = allowed
      ? (own ? `${rec.role} owns ${room}` : `${rec.role} may ${action} ${room}`)
      : `${rec.role} may not ${action} ${room}`;
  }
  audit.append({
    crossing_id: null, from_room: rec?.role ?? null, to_room: room, kind: "access", action,
    verdict: null, confidence: null, decider_version: null, option_order: null, probabilities: null, tilt: false,
    allowed, reason, override: null, latency_ms: null, text: null,
  });
  return { allowed, reason };
}

/** After this, every check() with the token is denied, on the very next call. No cache anywhere. */
export function revoke(token) {
  const list = loadTokens();
  const rec = list.find((t) => t.token === token);
  if (!rec) return { revoked: false, reason: "unknown token" };
  rec.revoked = true;
  rec.revoked_at = new Date().toISOString();
  saveTokens(list);
  return { revoked: true };
}

/** Revoke every live token of a role; returns how many. */
export function revokeRole(role) {
  const list = loadTokens();
  let n = 0;
  for (const rec of list) if (rec.role === role && !rec.revoked) { rec.revoked = true; rec.revoked_at = new Date().toISOString(); n++; }
  saveTokens(list);
  return n;
}

/** Rooms a change of this kind from this room may cross to. */
export function crossers(fromRoom, kind) {
  const table = CROSSERS[kind];
  if (!table) return [];
  return [...(table[fromRoom] ?? table["*"] ?? [])];
}

/** Truncate the token store. The demo reset uses it. */
export function resetTokens() { saveTokens([]); }
