// Roles, tokens, the matrix from CLAUDE.md, check() and revoke().
// The token's scope is the boundary, never a parameter the caller passes.
export const ROLES = ["pm", "frontend", "backend", "qa"];

/** Mint a token for a role. Returns an opaque string; never log it. */
export function mint(role) { throw new Error("not implemented: access.mint"); }
/** { allowed: boolean, reason: string }. action is "read" | "write" | "verdict". */
export function check(token, room, action) { throw new Error("not implemented: access.check"); }
/** After this, every check() with the token is denied, on the very next call. */
export function revoke(token) { throw new Error("not implemented: access.revoke"); }
/** Rooms a change of this kind from this room may cross to. */
export function crossers(fromRoom, kind) { throw new Error("not implemented: access.crossers"); }
