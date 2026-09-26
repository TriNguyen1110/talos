#!/usr/bin/env bash
# Drives one side of the demo. `run.sh a` is Backend and types the change; `run.sh b` is Frontend,
# mid-task, and wraps each of its own tool calls with the change block. One line per beat, beat
# numbers visible, nothing else on screen; chatter goes to demo/run.log. TALOS_DECIDER=off is beat 1.
set -euo pipefail
side="${1:?usage: run.sh a|b}"
echo "room $side (decider=${TALOS_DECIDER:-rules}): not wired yet — see plan.md"
