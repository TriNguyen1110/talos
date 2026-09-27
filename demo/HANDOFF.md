# Handoff: taking over the Talos build mid-day

Written 2026-09-27 15:10 PDT by the Claude main session, for whichever agent (Codex or Claude)
picks up the main-session role next. Read all of it before touching anything. Then read
`CLAUDE.md`. Then run `node scripts/clock.mjs`.

## Where and when

- Repo: `/Users/tringuyen/Developer/talos`, branch `main`. Work only inside it.
- Event: Own Your Intelligence, today, Sunday 2026-09-27. Hacking ends 17:00 PDT, judging
  17:00–17:45.
- `node scripts/clock.mjs` is the schedule: phase, minutes left, which paths are writable, what to
  cut if behind. IMPLEMENT until 16:00 (src/, tests/, demo/, scripts/, data/, BOARD.tsv, plan.md);
  REVIEW 16:00–16:15 (tests/, BOARD.tsv); PRESENT 16:15–16:45 (README.md, demo/, BOARD.tsv);
  BUFFER 16:45–17:00 (same); JUDGING after. In a Claude Code session a PreToolUse hook enforces
  this; in Codex nothing enforces it, so follow it by hand. Do not write outside the phase's
  paths. If an edit outside the phase seems genuinely necessary, say so to Tri and let him decide.

## The product, one sentence

Two rooms, two agents. When Backend changes something, a rules decider says what crosses to
Frontend, Frontend has it on its next tool call, every crossing and every refusal is a row in
`data/audit.jsonl`, and a human override is a training row. The six beats in `CLAUDE.md` are the
spec; `demo/seed.md` is the fixture text; `tests/demo-path.test.mjs` is the acceptance test.

## Decisions already made today (do not reopen)

- **No Jev, no River.** `TALOS_DECIDER=off|rules` only; `jev`/`river` resolve to `rules-v0`.
  `CLAUDE.md` and the deck still mention them. The README must not claim them.
- **Beat 6 is cut** (the product CLI under `product/`). Board item 12 is `delayed`.
- **The repo had to be created today.** Friday's repo was renamed to
  `github.com/TriNguyen1110/talos-prep` (git remote `prep`). A fresh public
  `github.com/TriNguyen1110/talos` was created 15:01 PDT (git remote `origin`). `gh` is logged
  in as TriNguyen1110. Nothing was pushed to `origin` as of 15:10.

## What is standing (committed locally, not pushed)

| commit | what |
|---|---|
| 775d31e | bridge: `src/audit.mjs`, `src/access.mjs`, `src/decider.mjs`, `src/bridge.mjs`, `src/rooms/dir.mjs`; `TALOS_IMPL=1 npm test` 6 pass, 0 skipped |
| f5f9145 | bridge: `scripts/talos.mjs` CLI (`mint\|write\|changes\|check\|revoke\|revoke-role\|override\|seq\|reset`, one JSON line on stdout) |
| ad62459 | bridge: `src/timeline.mjs`; `npm run timeline` renders `demo/timeline.html` |
| ac9683c | stage: `demo/run.sh a\|b\|reset` (beats 1 to 5 across two terminals), `demo/REHEARSE.md`, `demo/STATUS.md`, `demo/.gitignore` |

Measured 14:56 PDT with the rules decider: 1.8 s and 1.9 s from A's write to B's next tool call
carrying it; revoke to denied 3.3 s (bounded by B's step cadence); decider off, B finished unaware
after 20.6 s. These are single runs, not a p50; the README says so.

Uncommitted at 15:10: `BOARD.tsv` (appended rows; commit it), `demo/README.draft.md` (the README
to ship), `demo/HANDOFF.md` (this file). `data/audit.jsonl` and `data/tokens.json` are untracked
and must never be committed; `.gitignore` is not writable today, so simply never `git add` them.

## Coordination protocol (from the hacker kit; keep it)

- `BOARD.tsv` is append-only, tab-separated, seven fields: `ts kind id value owner scope note`.
  Append with `printf '%s\t...\n' >> BOARD.tsv`, never edit a line, no tabs inside `note`.
  Current state, last row per key wins:
  `awk -F'\t' '{r[$2"\t"$3]=$0} END{for(k in r) print r[k]}' BOARD.tsv | sort -t$'\t' -k2,3`
- Only the verifier writes `done`. At 15:05 items 03, 04, 05, 10 (owner bridge) and 11 (owner
  stage) were in `review` and a verifier agent was running the checks in
  `.claude/agents/verifier.md`. **First thing: read the board.** If those items have `done` rows,
  proceed. If they are still `review`, do the verifier's job yourself: `node scripts/talos.mjs
  reset && TALOS_IMPL=1 npm test` (must be 6 pass), then the non-interactive run in
  `demo/REHEARSE.md`, then append `done` (owner verifier, evidence in note) or `doing` (owner
  bridge or stage, the exact failing assertion in note). A `doing` row means fix exactly that.
- Never `git stash`. Never `git add -A`. Commit only the paths you changed, with the prefix of
  the role that owns them (`bridge:`, `stage:`, `verifier:`, `board:`).
- `node scripts/talos.mjs reset` before every demo run, and never run tests and the demo at the
  same time: they share the one audit table.

## What remains, in order

1. **Now.** Confirm the verifier's verdict as above. `git add BOARD.tsv demo/HANDOFF.md
   demo/README.draft.md && git commit -m "board: verifier verdicts, handoff"`.
2. **As soon as 03, 04, 05, 10, 11 are `done`:** `git push -u origin main`. Confirm on
   https://github.com/TriNguyen1110/talos. (Codex: pushing needs network; approve it when asked.)
3. **16:15, PRESENT.** `git mv demo/README.draft.md README.md`. Edit README.md only to correct
   numbers against the verifier's `verify-20260927` fact row in the board and to add the
   recording filename if one exists. Keep "Not true yet". No host named in a comparison, never
   the word "instantly", every number with its date. `git add README.md demo && git commit -m
   "stage: README" && git push`.
4. Update `demo/STATUS.md` to what is actually standing at that minute. Commit, push.
5. The 60-second recording is Tri's, on camera; steps in `demo/REHEARSE.md`. If a `.mov` or
   `.webm` lands under `demo/` (`.mp4` is gitignored), commit it, link it from the README, push.
6. **16:45, BUFFER.** Nothing new. Fix only what the recording shows. Final push before 17:00.

## Things that look like bugs and are not

- `npm test` without `TALOS_IMPL=1` shows six SKIPs by design (the stop gate relies on it).
  `TALOS_IMPL=1 npm test` is the real run.
- A second `[beat 2]` line on B's screen means another process wrote into `data/audit.jsonl`
  during the run. Reset and rerun.
- `.claude/settings.json` hooks (clock, phase gate, stop gate) fire only for a Claude Code
  session started in this directory. Codex does not run them; follow the same rules by hand.
- `run.sh` uses `node -e` to parse JSON; `jq` is not needed.

End every turn with one line: clock phase, what changed, the commits, the board rows appended.
