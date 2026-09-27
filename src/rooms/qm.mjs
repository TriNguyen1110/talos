// QM adapter. Only if QM is standing; plan.md names the hook. Same interface as dir.mjs.
// QM documents no hook on tool calls or writes. Its documented surface is routing a room's memory to
// an external provider, so Talos would attach as that provider: the room's memory-provider route
// receives each write and this watch() would forward it to onWrite(room, text). Not built today;
// the directory adapter (rooms/dir.mjs) is the path in use.
export function watch(room, onWrite) {
  throw new Error(`not implemented: rooms/qm.watch(${room}) — would attach as the room's external memory provider (QM memory-provider route); see plan.md. Use rooms/dir.mjs.`);
}
