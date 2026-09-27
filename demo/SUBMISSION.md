# Talos — submission text

## One line

Talos: a software factory for building, managing and extending software. Rooms of agents on GBrain memory, with precise access control over what crosses between them, every crossing on the record, and runs exported to Memorable.

## Short (about 100 words)

Talos is a software factory: rooms of agents, one per role, that build, manage and extend software. Multi-agent teams fail on coordination, not on models. An agent reads the world once, works for an hour, and finishes correct and wrong because a decision changed while it was working. Rooms with isolated memory are the right design, and they stop at the wall: there is no governed way for a contract change, a decision or a verdict to reach the one agent that needs it. Talos runs that path inside the factory. One decider classifies each change and returns share, hold or discard; a scope check the decider cannot widen decides who may hear it; one audit table records every crossing, every refusal and every denied read. Built today, tested with and without the hosts' tools, demoed by four rooms building two products live.

## Long (about 300 words)

**The problem.** Every team that runs more than one agent hits this in the first week. Agents read the world once when they start. When a decision, a contract or a verdict changes while they work, they finish correctly against something that is no longer true. Nothing crashes, so nobody notices until the work ships. Today a human relays those changes by hand, and that scales with the agent count. Sharing all memory leaks scratch and goes stale; isolating all memory misses the contract change.

**What Talos does.** Each role has a room with its own memory. When a room writes something, Talos runs one function, `decide(change)`, which classifies the kind (contract, decision, verdict, private note, noise) and returns share, hold or discard with a confidence. Targets come from an access matrix, never from the model. A scope check runs per target and refuses anything the matrix forbids, so a fooled decider still hits the wall. Every allow, hold, refusal and denied read is a row in one append-only audit table with the full text kept. Delivery rides the tool call the other agent was already making; nobody polls. Revoke lands on the very next call. A human override is a training row.

**What was built on the day.** The audit table, the access matrix, the rules decider, the bridge, a directory watcher adapter, a CLI, a timeline renderer, and a factory demo in which four rooms (PM, Backend, Frontend, QA) build a product live: a swipe-deck dating app for founders at your college, and a Twitter-style campus feed. Six beats were written as a failing test before the implementation; five deliberate breaks each turned a beat red.

**Measured, 2026-09-27.** Change to the other agent knowing: 2.9 s median over five runs, set by that agent's step cadence; the decider itself takes 1.7 ms. Revoke to denied on the same token: 0.105 s. Each product build: 31 audit rows, 19 crossings delivered, 3 refused by scope, 2 reads denied, 0 leaks. With GBrain as the room memory, a page written with GBrain's own `put` crossed in 2.3 s and read back from one brain only.

**Hosts.** GBrain is integrated and tested. QM is the natural room; the adapter attaches where QM routes a room's memory out, named and not run. River is where the decider's training rows, 18 exported today, would train a model that drops in behind the same function. The factory run is exported as a Memorable trace.

**Not true yet.** The decider is rules only and does not learn yet. No QM adapter, no connectors (GitHub, Linear, Slack, Supabase are each one watcher on a write path). Two agents, one laptop, single-run numbers except where a median is stated.

**Demo.** https://talos-factory.vercel.app (static copy of the last runs; live builds run locally).

**Repo.** https://github.com/TriNguyen1110/talos, created today; prep work from the days before is at talos-prep and named in the first commit.
