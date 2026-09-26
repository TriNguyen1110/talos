# Plan (committed Fri 2026-09-25 evening; adjust at 12:00 only if something is not standing)

Path chosen: **fallback**. Two rooms are two directories under `rooms/`, each with its own
GBrain brain. Talos watches each room's write path with a file watcher. If `scripts/setup-qm.sh`
was completed and two QM rooms are up, the QM adapter replaces the watcher; the hook is the
point where a QM tool call returns to the model, named here before it is edited:

QM hook or file the bridge attaches to: (unknown until QM is standing; leave blank, use the watcher)

Files to touch, in order:
1. `src/audit.mjs` — the one table. Append, read, and `since(seq)`.
2. `src/access.mjs` — roles, tokens, the matrix, `check(token, room, action)`, `revoke(token)`.
3. `src/decider.mjs` — `decide(change)`; v0 rules; `TALOS_DECIDER` switch; v1/v2 adapters behind env.
4. `src/bridge.mjs` — watch room write path → classify → decide → check → deliver → audit row.
5. `src/rooms/dir.mjs` — directory adapter (`rooms/<room>/brain/**.md`); `src/rooms/qm.mjs` stub.
6. `src/timeline.mjs` — render `data/audit.jsonl` as `demo/timeline.html`, two swimlanes.
7. `demo/run.sh a|b` — the two terminals, one line per beat; `TALOS_DECIDER=off` for beat 1.

Risks, and the one most likely to cost the afternoon:
- **"Nobody polled" in beat 2.** The other agent must receive the change on a call it was
  already making about something else. In the fallback, `run.sh b` wraps each tool call with
  `talos changes --since <seq>` and prints the block. If that wrapper looks like polling, the
  claim dies. Make the wrapped call visibly unrelated (the test command), and log one call.
- Jev availability on the day. Rules first; Jev is a flag.
- River training time. Start it at hour three, show the job page if it is not done.

Cut order (from CLAUDE.md, adjusted for what is actually standing): as written there.
Who runs room A / room B: Tri runs Backend (A) and types the change; teammate runs Frontend (B)
and the override key. Both terminals on one laptop for the recording; two laptops live if wifi holds.
