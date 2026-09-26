# What this is for, and how we know the pain is real

`strategy.md` says who is in the room. `CLAUDE.md` says what gets built in which hour. This
file says **whose problem it is**, and it is the one to read before changing the demo, because
a mechanism demo that answers no question loses to a worse-built thing that answers one.

Rule for the day: **one use case, demoed all the way through.** The other two exist, the same
mechanism covers them, and they are named on the README as "the same thing does this" and
built by nobody on Sunday.

---

## Primary: the decision that changed while your agents were still working

**Who.** Anyone running more than one agent on one codebase. At this hackathon that is
literally everyone in the room, and it is QM's own shape: rooms that each hold their own
memory and deliberately do not see each other's.

**The moment it hurts.** You change your mind at 10pm. Two agents are mid-task. Neither is
told. They finish, correctly, against a decision that is no longer true, and you find out
when you read what shipped.

**What happens today.** Every agent is a batch: it reads the world once at the start of its
run and does not look again. So a decision reaches a running agent only when that agent
happens to start over. Measured in a real multi-agent team: **1 to 5 hours** of latency
between a decision being recorded and the agents acting on it. Three failures in that team's
incident log come from exactly this and nothing else: work done against a superseded decision,
the same stale rule copied into six separate rows before anyone caught it, and a page rewritten
seven hours after the decision that changed what it should say, still carrying the old thing.
That last one cost **about 24 hours live in production**, and 16 minutes to fix once a human
noticed. The fix was never the expensive part.

**Why nothing solves it.** QM keeps rooms apart on purpose, and that is the right default: a
room should not see another room's memory. But "should not see everything" got implemented as
"cannot be told anything," and a decision that everyone agreed should cross has no way across.
Polling is not an answer; it costs a call per agent per minute and still misses the window
between two polls.

**What the demo shows.** Beats 2 and 3 in `CLAUDE.md`. A records the change in room A. B, mid
task in room B, is told on its next tool call, with no poll and no restart, and says the thing
it was about to use is stale.

**How a judge knows it is not staged.** Three things, and the demo should make all three
visible without being asked:
- B's terminal shows the tool call it was *already going to make* carrying the change, not a
  new "check for updates" call invented for the demo.
- The decision text is typed live into room A during the demo, so it cannot be pre-seeded.
- The elapsed time between A's write and B's line appears on screen, from a clock, in seconds.

**The measure.** Propagation latency A to B, p50 over five runs, measured on the day.

---

## Secondary, named but not built: the contractor's agent

**Who.** Anyone who has given an outside collaborator's agent access to their work.

**The pain.** Access is a key, the key is shared, and taking it back means rotating it for
everyone. So nobody takes it back, and the contractor's agent keeps its reach for months
after the contract ends.

**What the mechanism already does.** Beat 5: a grant that ends, and the next call after the
revoke returns nothing. No rotation, nobody else disturbed, and the moment is on the record.

**Why it is not Sunday's demo.** It is the same code path as beat 5 with a different story on
top. Telling two stories in three minutes tells neither.

---

## Secondary, named but not built: the read nobody saw

**Who.** Anyone who has to answer "what did the agent look at?" and cannot.

**The pain.** An agent answers using something it should not have opened, and there is no
record either way, so you can neither prove the leak nor rule it out.

**What the mechanism already does.** Beat 4 plus the audit rows: the refusal is recorded as
deliberately as the allow, so the absence of a read is evidence rather than silence.

**Why it is not Sunday's demo.** It is the least visual of the three. It belongs on the
README as a line and a screenshot, not in the three minutes.

---

## Scope: what is deliberately not in this

- **No UI beyond two terminals.** A dashboard is the fastest way to spend the afternoon on
  something a judge will not read.
- **No ingestion pipeline, no connectors, no embeddings.** The shared scope is seeded from
  `demo/seed.md`.
- **No multi-org, no billing, no accounts.** One org, two rooms, three scopes.
- **No claim about scale.** Two agents. Say two agents.
