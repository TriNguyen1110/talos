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
- Jev (v1) decider: not exercised by the stage; the demo passes with `rules`.
- Timeline page (`src/timeline.mjs`): bridge's, in progress. Cut to `tail -f data/audit.jsonl` if not standing at 16:00.
- Beat 6 (product CLI): cut in IMPLEMENT (`product/` not writable; board item 12 delayed).
- Recording: not made yet; PRESENT phase (16:15).
- QM running locally with two rooms: not done; not needed for the five beats.
