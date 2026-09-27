# Talos

**Two rooms, two agents, one product. When one changes something, a decider says what crosses,
the other agent has it on its next tool call, every crossing is on the record, and the decider
learns from the record.**

```bash
TALOS_DECIDER=off   bash demo/run.sh a   # beat 1: the same minute without Talos
TALOS_DECIDER=rules bash demo/run.sh a   # room A, Backend: types the change
TALOS_DECIDER=rules bash demo/run.sh b   # room B, Frontend: mid-task, hears it, holds, is refused, is revoked
npm run timeline                          # data/audit.jsonl -> demo/timeline.html
```

Numbers (measured, with dates) and the 60-second recording go here on the day.

Design target for the demo screens (mockups, invented data): https://talos-visuals.vercel.app
(graph at /graph, two-terminal comparison at /split; source in `demo/mock/`).

Not true yet:
- (list what the demo does not do, on the same page as what it does)
