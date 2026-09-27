# Rehearsal: two terminals, five beats, twice

Two terminals side by side, 18pt or larger, both `cd ~/Developer/talos`. Left is **A** (Backend, you).
Right is **B** (Frontend, mid-task). A wall clock with seconds visible. Everything below is copy-paste.
Chatter goes to `demo/run.log`; `tail -f demo/run.log` in a third window if a judge asks "is this polling?".

## Pass 1: without (beat 1). Decider off. Do not skip this.

| step | left (A) | right (B) | screen shows |
|---|---|---|---|
| 1 | `bash demo/run.sh reset` | | `reset.` |
| 2 | | `TALOS_DECIDER=off bash demo/run.sh b` | `B: room ready, task = REST client for C1 (items[])`, then one step line every 4 s |
| 3 | `TALOS_DECIDER=off bash demo/run.sh a` | | `A: room ready (decider=off)` and a prompt |
| 4 | type the change live, Enter: `switch to GraphQL, REST rate limits are too low; the field is now nodes, not items` | | `[beat 1] A: recorded "…" · kind=- verdict=- conf=- by off · HH:MM:SS.s` |
| 5 | press `q` | keep watching, ~30 s | `[beat 1] B: done. REST client, items[], tests green. (never heard the change; NNs elapsed)` |

Say: "B is correct, careful, and wrong. Forty seconds; in real teams one to five hours."

## Pass 2: with Talos (beats 2 to 5). Decider rules (or jev if the key is set: leave TALOS_DECIDER unset).

| step | left (A) | right (B) | screen shows |
|---|---|---|---|
| 1 | `bash demo/run.sh reset` | | `reset.` |
| 2 | | `TALOS_DECIDER=rules bash demo/run.sh b` | `B: room ready…`, step lines |
| 3 | `TALOS_DECIDER=rules bash demo/run.sh a` | | `A: room ready (decider=rules)` |
| 4 | type the same change, Enter | | green `[beat 2] A: recorded "…" · kind=contract verdict=share conf=… by rules-v0 · HH:MM:SS.s` |
| 5 | wait for B's next step (≤ 4 s) | | green `[beat 2] B: ⚠ while I was working, C1 changed N.Ns ago → "…" (crossing c-…, by rules-v0). Stopping the REST client.` then B re-plans: `B: re-reading C1 — GraphQL, nodes[]` … |
| 6 | press `3` | | yellow `[beat 3] A: noted (hold) "trying a resolver cache…" · kind=private_note verdict=hold …`. B's next step lines carry nothing. Point at that. |
| 7 | press `4` | | yellow `[beat 4] A: noted + injected line · decider tilted toward share (tilt=true, …) · scope refused N targets` |
| 8 | press `5` | | yellow `[beat 5] A: override c-… hold→share (training row)` then red `[beat 5] A: revoked frontend (1 token) · HH:MM:SS.s` |
| 9 | | B's very next step | red `[beat 5] B: ✗ denied — revoked … · HH:MM:SS.s` and B exits |
| 10 | press `q` | | |

Point at B's step line just before the ⚠: it was about tests or git, not about the change. That is the claim.

If B does not hear the change: do not retry twice. Press `5` (revoke), and show the denial; it is independent.
If A's write fails: `tail -3 demo/run.log` on screen and say what it says. Never edit the fixture live.

## Non-interactive dry run (same thing, one shell, 30 s)

```
bash demo/run.sh reset; (TALOS_DECIDER=rules bash demo/run.sh b & sleep 2; \
  TALOS_DECIDER=rules bash demo/run.sh a --now --beats 345 --pause 6 "switch to GraphQL, the field is now nodes, not items"; wait)
```

## Recording the 60-second cut (macOS)

1. Terminal profile: 18pt JetBrains Mono or Menlo, dark background, two windows tiled left/right (Window > Move & Resize).
   Hide the menu bar clutter; `clear` both.
2. QuickTime Player > File > New Screen Recording > record selected portion covering both windows. Or, if installed:
   `ffmpeg -f avfoundation -framerate 30 -i "1:none" -t 75 demo/talos-60s.mov` (list devices with `-list_devices true -i ""`).
3. Start recording, run pass 1 with `B_STEPS=6` (`TALOS_DECIDER=off B_STEPS=6 bash demo/run.sh b`) so beat 1 lands in ~25 s,
   then `reset` and pass 2 straight through beats 2 to 5. Type the change live both times. One take with a stumble beats
   three clean takes; leave it in.
4. Trim to 60 s in QuickTime (Edit > Trim), export 1080p, save under `demo/`. `.mp4` is gitignored; use `.mov` or `.webm`.
