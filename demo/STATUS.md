# Status (Sun 2026-09-27, 15:00 PDT, IMPLEMENT phase)

Decision for Sunday (Fri evening): **fallback**. Two directories with GBrain brains and a file watcher; no QM adapter.

What is standing, measured by running it (not asserted):

- One audit table (`data/audit.jsonl`): standing (bridge commit 775d31e).
- Access matrix (`src/access.mjs`), rules decider, bridge with directory adapter: standing; `scripts/talos.mjs` is the CLI.
- `demo/run.sh a|b|reset`: standing. Beats 1 to 5 run end to end against the real CLI, both `TALOS_DECIDER=off`
  and `rules`, one line per beat, beat numbers on screen, chatter in `demo/run.log`.
  - 2026-09-27 14:56 PDT, rules, real CLI: A wrote at 14:56:48.2, B's next tool call (a write of its own client) carried the
    change at 14:56:49.8: **1.8 s** change to B knowing. Revoke 14:57:06.9, B's next call denied 14:57:10.2 (3.3 s;
    bounded by B's step cadence, not the CLI). Decider off, same words: B finished 20.6 s later, never heard it.
- `demo/REHEARSE.md`: the two-terminal sequence and how to record the 60-second cut.
- Decider: rules-only by decision at 14:50 PDT (no Jev, no River). `TALOS_DECIDER=off|rules`.
- Timeline page (`src/timeline.mjs` → `demo/timeline.html`): standing (bridge commit ad62459; verified 15:08 PDT, 18 rows, red refusals and green shares).
- Beat 6 (product CLI): cut in IMPLEMENT (`product/` not writable; board item 12 delayed).
- Recording: not made yet; PRESENT phase (16:15).
- QM running locally with two rooms: not done; not needed for the five beats.
- Verifier, 15:04–15:09 PDT: items 03, 04, 05, 10, 11 `done`; five mutations went red; leaks 0; one weak beat-4 assertion strengthened (47a2a2b).
- Pushed to https://github.com/TriNguyen1110/talos (created today) at 15:10 PDT.
- With the hosts' tools, 15:18–15:21 PDT: both room brains registered as GBrain sources; `gbrain put` into the backend source wrote the page through to `rooms/backend/brain/` and Talos crossed it to Frontend in 2.3 s with no CLI call (`scripts/talos.mjs watch backend`). Plain file write through the same watcher: 0.44 s. QM: not standing, not tested. Superset, Memorable, UFO: not in the build.
