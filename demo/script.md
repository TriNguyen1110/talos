# The demo, shot by shot

The problem with this use case is that the pain is a **non-event**: nothing crashes, nobody
lies, an agent quietly finishes the wrong work. And in real life it takes hours. Neither of
those demos on their own. So the whole design is one idea:

> **Run the same task twice, side by side, and let the first run fail.**

A controlled A/B is the only way a non-event becomes something a judge can see, and running
the broken version first is what makes the fixed version mean anything. Compress the hours by
typing fast, and say out loud that you are compressing them.

Two terminals, full screen, 18pt or larger, side by side. Left is **room A** (you). Right is
**room B** (your teammate's agent, mid-task). A wall clock with seconds is visible in both.

---

## Shot 1 — the setup (20 seconds, spoken over a still screen)

Both terminals show B already working: `B: task = write the REST client for decision D1`.

> "Two agents, two rooms, one project. B is building against a decision I made this morning.
> I'm about to change my mind, which is the most normal thing that happens in a week."

## Shot 2 — the failure, without Talos (50 seconds)

| t | left, room A | right, room B |
|---|---|---|
| 0:00 | you type the change live | `B: reading D1 — REST` |
| 0:05 | `A: recorded — "switch to GraphQL, REST rate limits are too low"` | `B: writing client…` |
| 0:30 | (nothing) | `B: done. 120 lines, REST client, tests green.` |

> "B finished. B is correct, careful, and wrong. My decision was forty seconds old and B never
> heard it. In our own crew this gap runs one to five hours, because every agent reads the
> world once when it starts and never looks again. I've just compressed five hours into forty
> seconds. Nothing else about this is sped up."

**Do not skip this shot to save time.** It is the only forty seconds that makes the next
forty mean anything. If the day runs short, cut shot 5 before cutting this.

## Shot 3 — the same minute, with Talos (45 seconds)

Reset. Same task, same words, typed live again.

| t | left, room A | right, room B |
|---|---|---|
| 0:00 | you type the same change | `B: writing client…` |
| 0:04 | `A: recorded` | `B: calling memory_query("what's the test command?")` |
| 0:07 | | `B: ⚠ while I was working, D1 changed 3.1s ago → GraphQL. Stopping the REST client.` |

> "Same change. B heard it on the next tool call it was already going to make. It asked about
> the test command, and the answer came back with the thing it needed to know. It did not
> poll, it did not restart, and nobody told it to check."

**The one thing to point at.** B's call was about something else entirely. That is the whole
claim, and it is why the call in shot 3 must be visibly unrelated to the decision. A call
named `check_for_updates` would prove nothing and the verifier fails the demo for it.

## Shot 4 — why you can trust it (30 seconds)

A third room's agent asks for the same decision.

```
C: memory_query("what did they decide about the API?")
C: ✗ denied — scope not granted to agent C
   audit  17:42:10  agent C  memory.read  DENY  scope=project.shared
```

> "C was never granted this. Not empty, not filtered afterwards, refused — and the refusal is
> on the record as deliberately as the answer. Every read in this demo has a row."

## Shot 5 — taking it back (25 seconds)

```
A: revoke B
B: memory_query("what's the test command?")
B: ✗ denied — capability revoked 0.3s ago
   audit  17:42:41  agent B  memory.read  DENY  revoked
```

> "One grant ended. No key rotated, nobody else disturbed, and B's very next call — not its
> next session — comes back empty."

## Shot 6 — the numbers (20 seconds, on the README, not spoken line by line)

Four numbers with today's date next to them: propagation A→B, revoke-to-denied, leaks across
cross-scope reads, audit rows per read. Then the "not true yet" list, on the same page.

---

## What makes this survive a stage

- **The recording is the artifact, the live run is the encore.** A 60-second cut of shots 2
  and 3 sits in the README and plays without wifi. Run it live after, and if it breaks, you
  have already shown it working and you say so.
- **One line per beat.** `demo/run.sh` prints `A:` / `B:` / `C:` prefixed lines and nothing
  else. Agent chatter goes to a log file. If a judge cannot read it from two metres away on a
  laptop screen, it does not go on screen.
- **Timestamps come from a clock, printed by the script.** Never say "instantly."
- **Type the decision live.** Pre-seeded text is the first thing a judge suspects.
- **Rehearse shot 2 and 3 back to back until the transition is one motion.** The reset between
  them is where a demo dies.

## Failure modes, and what to do in the moment

| If | Then |
|---|---|
| The live model is slow or wanders | Say "that's a live model" and play the recording. Do not wait on it. |
| Production is unreachable | The recording, and the numbers with their dates. Say what is down. |
| B does not hear the change | Do not retry twice. Go to shot 4, the refusal path, which is independent. |
| A judge asks "is this just polling?" | Show the log: one call, made for another reason, carrying the change. |
| A judge asks "does this scale?" | "Two agents. I've tested two agents." Nothing else. |

## What `demo/run.sh` must print, and nothing more

```
run.sh a                    run.sh b
A: room ready               B: room ready, task = REST client for D1
A: recorded "<text>"        B: calling memory_query("…")
A: revoked B                B: ⚠ D1 changed 3.1s ago → GraphQL. Stopping.
                            B: ✗ denied — capability revoked 0.3s ago
```

Everything else goes to `demo/run.log`. The script takes the decision text as an argument so
it is typed on the day, never baked in.
