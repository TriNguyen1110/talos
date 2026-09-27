#!/usr/bin/env bash
# The factory builds Startup College Dating. Four rooms, each step is a real write through Talos:
# the decider classifies it, the scope check says who may hear it, the audit row is the log, and
# the room's step then changes the app the way that room would. Frontend only acts on what has
# crossed to it: it reads `changes` on the tool call it was already making. The steps are scripted;
# the crossings, verdicts, refusals and denials are not.
#
#   node demo/factory/server.mjs &            # http://localhost:4242
#   bash demo/factory/build.sh [dating|feed] [--fast]   # ~2 minutes; --fast makes it ~40 s
# A product is a step file under demo/factory/products/<name>.sh using the helpers below.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT" || exit 1
PRODUCT="dating"; PAUSE=5
for a in "$@"; do case "$a" in --fast) PAUSE=1.5;; *) PRODUCT="$a";; esac; done
[ -f "demo/factory/products/$PRODUCT.sh" ] || { echo "no such product: $PRODUCT (see demo/factory/products/)"; exit 2; }
APP="demo/factory/app/$PRODUCT"; STEPS="demo/factory/steps.log"; CLI="node scripts/talos.mjs"; mkdir -p "$APP"
COMMIT="${FACTORY_COMMIT:-0}"
export TALOS_DECIDER="${TALOS_DECIDER:-rules}"

j() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const d=JSON.parse(s);console.log(eval(process.argv[1]))})' "$1"; }
step() { printf '{"ts":"%s","room":"%s","what":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2" >> "$STEPS"; printf '%-9s %s\n' "$1:" "$2"; }
say() { printf '          %s\n' "$*"; }
write() { local out; out="$($CLI write "$1" "$2")"; printf '%s' "$out" | j 'd.map(x=>`  ${x.crossing_id} ${x.kind} ${x.verdict}${x.to_room?" -> "+x.to_room:""} allowed=${x.allowed}`).join("\n")'; }
state() { printf '%s\n' "$1" > "$APP/state.json"; printf '{"ts":"%s","room":"app","what":"state v%s","version":%s}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$(printf '%s' "$1" | j 'd.version')" "$(printf '%s' "$1" | j 'd.version')" >> "$STEPS"; }
archive() { mkdir -p demo/factory/runs; node -e '
const fs=require("fs");const [product,steps,audit,out]=process.argv.slice(1);
const L=(p)=>fs.existsSync(p)?fs.readFileSync(p,"utf8").split("\n").filter(Boolean).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean):[];
fs.writeFileSync(out,JSON.stringify({product,finishedAt:new Date().toISOString(),steps:L(steps),rows:L(audit)}));
' "$PRODUCT" "$STEPS" data/audit.jsonl "demo/factory/runs/$PRODUCT.json"; }
receipt() { [ "$COMMIT" = "1" ] || return 0; GIT_AUTHOR_NAME="$1-agent" GIT_AUTHOR_EMAIL="$1@rooms.local" git add "$APP" >/dev/null 2>&1 && git commit -q -m "$1: $2" >/dev/null 2>&1 || true; }

$CLI reset >/dev/null; : > "$STEPS"
printf '{"product":"%s"}\n' "$PRODUCT" > demo/factory/current.json
echo "== factory: $PRODUCT (decider=$TALOS_DECIDER) =="
FE="$($CLI mint frontend | j 'd.token')"; QA="$($CLI mint qa | j 'd.token')"; SINCE=0
frontend_hears() {  # the change block rides a call Frontend was already making
  local rows n; rows="$($CLI changes "$FE" frontend "$SINCE")"; n="$(printf '%s' "$rows" | j 'd.length')"
  if [ "$n" -gt 0 ]; then SINCE="$(printf '%s' "$rows" | j 'Math.max(...d.map(x=>x.seq))')"; printf '%s' "$rows" | j 'd.map(x=>`  heard ${x.crossing_id} (${x.kind}, by ${x.decider_version}): ${x.text.slice(0,90)}`).join("\n")'; return 0; fi
  return 1
}

. "demo/factory/products/$PRODUCT.sh"
archive
