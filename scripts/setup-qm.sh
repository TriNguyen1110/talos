#!/usr/bin/env bash
# Stand QM up locally with two rooms. Run this BEFORE Sunday (strategy.md: Thu 09-24).
#
# QM is YC's multiplayer agent harness, MIT, github.com/yc-software/qm. It wants Node and
# Postgres. This script does the parts that are the same every time and stops with a named
# next step when it hits something only you can answer, rather than guessing.
#
# The checkout lives outside ~/Developer's top level on purpose (house rule: no loose clones).
set -euo pipefail

QM_DIR="${QM_DIR:-$HOME/Developer/.worktrees/qm-upstream}"

step() { printf '\n== %s\n' "$1"; }
stop() { printf '\nSTOP: %s\n' "$1"; exit 1; }

step "Prerequisites"
command -v node >/dev/null || stop "node is not on PATH"
node_major=$(node -p 'process.versions.node.split(".")[0]')
[ "$node_major" -ge 22 ] || stop "node $node_major is too old; QM wants 22+, switch with nvm"
command -v git >/dev/null || stop "git is not on PATH"
command -v psql >/dev/null || printf '  note: psql not found, a hosted Postgres URL works too\n'
printf '  node %s\n' "$(node -v)"

step "Clone or update QM at $QM_DIR"
mkdir -p "$(dirname "$QM_DIR")"
if [ -d "$QM_DIR/.git" ]; then
  git -C "$QM_DIR" pull --ff-only
else
  git clone https://github.com/yc-software/qm "$QM_DIR"
fi

step "Read its own setup before running anything"
for f in README.md SETUP.md docs/setup.md CONTRIBUTING.md; do
  [ -f "$QM_DIR/$f" ] && printf '  %s exists, read it: it is the source of truth for the next step\n' "$f"
done

step "Install"
( cd "$QM_DIR" && { npm ci || npm install; } )

cat <<'NEXT'

Next, by hand, because these are choices and not steps:

  1. Point QM at a Postgres you control and run its migrations (its README names the command).
  2. Create two rooms and put one agent in each. Two rooms is the whole demo.
  3. Find where a tool call returns to the model. That is where Talos attaches.
     Write the file and function into plan.md. Do not edit it tonight.
  4. Screenshot the two rooms talking, and append a fact row to BOARD.tsv saying QM is up.

If any of this is unresolved by Friday evening, write "fallback" in demo/STATUS.md and build
the two-terminal path. That decision is cheap on Friday and expensive on Sunday.
NEXT
