#!/usr/bin/env bash
# Stop gate: an agent may not finish a turn that leaves the demo-path test red, and it may not
# finish one without being told what time it is. Deterministic; the model does not decide
# whether either ran.
set -uo pipefail
cd "$(dirname "$0")/../.."

node scripts/clock.mjs >&2 || true

if npm run -s test >/tmp/talos-test.log 2>&1; then exit 0; fi
{
  echo ""
  echo "stop-gate: the demo-path test is red. Fix it before ending the turn."
  tail -20 /tmp/talos-test.log
} >&2
exit 2
