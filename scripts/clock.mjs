#!/usr/bin/env node
// The build day's clock, and the only place the schedule is written down.
//
// CLAUDE.md's timebox table is generated from PHASES below, so the two can never disagree.
// Agents do not decide what time it is or what they may touch: they ask this.
//
//   node scripts/clock.mjs                 what phase, how long left, what is allowed
//   node scripts/clock.mjs --json          the same, machine-readable
//   node scripts/clock.mjs --start         stamp demo/START with now; kickoff
//   node scripts/clock.mjs --gate <path>   exit 2 if writing that path is not allowed now
//
// The anchor is demo/START if it exists, else TALOS_START, else the scheduled kickoff.
// A dry run works the same way: stamp START and the whole day replays from that minute.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const START_FILE = join(ROOT, "demo/START");
/** Own Your Intelligence kickoff: Sun 2026-09-27 12:00 PT = 19:00 UTC. */
const SCHEDULED_KICKOFF = "2026-09-27T19:00:00Z";

/**
 * One phase of the day. `from`/`to` are minutes after kickoff. `allow` is the paths a builder
 * may create or edit; anything else is refused by --gate. `cut` is what goes first if behind.
 */
const PHASES = [
  { name: "plan",      from: 0,   to: 20,  clock: "12:00–12:20",
    does: "Decide the path and commit plan.md. No code, not one line.",
    allow: [/^plan\.md$/, /^BOARD\.tsv$/, /^demo\/STATUS\.md$/],
    cut: "Nothing to cut yet. If the path is unclear at 12:20, take the fallback and move on." },
  { name: "test",      from: 20,  to: 90,  clock: "12:20–13:30",
    does: "Write the demo-path test so it fails for the right reason. Still no implementation.",
    allow: [/^tests\//, /^plan\.md$/, /^BOARD\.tsv$/, /^\.env/],
    cut: "Cut beats 3 and 4 from the test before cutting the test. Never cut the test." },
  { name: "implement", from: 90,  to: 210, clock: "13:30–15:30",
    does: "Make the beats green locally. The audit table and v0 rules before any adapter.",
    allow: [/^src\//, /^tests\//, /^demo\//, /^scripts\//, /^data\//, /^BOARD\.tsv$/, /^plan\.md$/],
    cut: "1 River. 2 Jev, rules only. 3 QM rooms, directories instead. 4 timeline page, tail -f instead." },
  { name: "review",    from: 210, to: 230, clock: "15:30–15:50",
    does: "Verifier, fresh context, on the diff and the recording. Fixes only, nothing new.",
    allow: [/^tests\//, /^BOARD\.tsv$/],
    cut: "A finding that needs a new file is a note in the README, not a build." },
  { name: "present",   from: 230, to: 270, clock: "15:50–16:30",
    does: "README and the 60-second recording. The sentence, one command, numbers with dates.",
    allow: [/^README\.md$/, /^demo\//, /^BOARD\.tsv$/],
    cut: "Cut the numbers you cannot date before cutting the 'not true yet' list." },
  { name: "buffer",    from: 270, to: 300, clock: "16:30–17:00",
    does: "Nothing new. Fix only what the recording shows.",
    allow: [/^README\.md$/, /^demo\//, /^BOARD\.tsv$/],
    cut: "Everything. Ship what runs." },
  { name: "judging",   from: 300, to: 345, clock: "17:00–17:45",
    does: "Hands off the keyboard. Demo it.",
    allow: [/^BOARD\.tsv$/],
    cut: "n/a" },
];

function anchor() {
  if (existsSync(START_FILE)) {
    const stamped = Date.parse(readFileSync(START_FILE, "utf8").trim());
    if (Number.isFinite(stamped)) return { at: stamped, source: "demo/START" };
  }
  const fromEnv = process.env.TALOS_START ? Date.parse(process.env.TALOS_START) : NaN;
  if (Number.isFinite(fromEnv)) return { at: fromEnv, source: "TALOS_START" };
  return { at: Date.parse(SCHEDULED_KICKOFF), source: "the scheduled kickoff" };
}

/** Where we are: a phase, or "prep" before kickoff and "over" after judging. */
export function state(now = Date.now()) {
  const { at, source } = anchor();
  const elapsed = Math.floor((now - at) / 60000);
  if (elapsed < 0) {
    return { phase: "prep", source, elapsed, minutesLeft: -elapsed, hoursToKickoff: (-elapsed / 60).toFixed(1),
      does: "Prep. Everything is allowed, and the build day does not start until the clock does.", allow: [/.*/], cut: "n/a" };
  }
  const phase = PHASES.find((p) => elapsed >= p.from && elapsed < p.to);
  if (!phase) return { phase: "over", source, elapsed, minutesLeft: 0, does: "The day is done.", allow: [/^BOARD\.tsv$/], cut: "n/a" };
  return { ...phase, phase: phase.name, source, elapsed, minutesLeft: phase.to - elapsed };
}

/** Turn the allow patterns back into something a person reads: `src/`, `plan.md`. */
function allowList(allow) {
  return allow.map((r) => String(r).replace(/^\/\^?/, "").replace(/\$?\/[a-z]*$/, "").replace(/\\/g, "")).join(", ");
}

function render(s) {
  if (s.phase === "prep") {
    return [`PHASE prep — ${s.hoursToKickoff}h until kickoff (anchor: ${s.source})`, "", s.does].join("\n");
  }
  if (s.phase === "over") return `PHASE over — the day ended ${s.elapsed - 345} min ago.`;
  const next = PHASES[PHASES.findIndex((p) => p.name === s.phase) + 1];
  const bar = "#".repeat(Math.round(((s.elapsed - s.from) / (s.to - s.from)) * 20)).padEnd(20, ".");
  return [
    `PHASE ${s.phase.toUpperCase()} (${s.clock}) — ${s.minutesLeft} MIN LEFT  [${bar}]`,
    "",
    `  now:   ${s.does}`,
    `  next:  ${next ? `${next.name} at +${next.from} min` : "judging"}`,
    `  cut:   ${s.cut}`,
    "",
    `  Writes allowed this phase: ${allowList(s.allow)}`,
    `  Anchor: ${s.source}. A phase boundary is not a suggestion; the gate enforces it.`,
  ].join("\n");
}

const [, , flag, arg] = process.argv;

if (flag === "--start") {
  const now = new Date().toISOString();
  writeFileSync(START_FILE, now + "\n");
  console.log(`kickoff stamped: ${now}\n`);
  console.log(render(state()));
} else if (flag === "--json") {
  const s = state();
  console.log(JSON.stringify({ ...s, allow: s.allow.map(String) }));
} else if (flag === "--gate") {
  if (!arg) { console.error("usage: clock.mjs --gate <path>"); process.exit(1); }
  const s = state();
  const rel = relative(ROOT, resolve(arg)) || arg;
  if (rel.startsWith("..")) process.exit(0); // outside the repo, not ours to police
  if (s.allow.some((r) => r.test(rel))) process.exit(0);
  console.error(
    `\nBLOCKED by the clock: it is ${s.phase.toUpperCase()}, ${s.minutesLeft} min left, and ${rel} is not writable in this phase.\n` +
    `  This phase: ${s.does}\n` +
    `  Allowed:    ${allowList(s.allow)}\n` +
    `  If behind:  ${s.cut}\n` +
    `Change the plan, not the clock. If this is genuinely the right edit now, say so out loud ` +
    `to the human and let them decide; do not work around the gate.\n`,
  );
  process.exit(2);
} else {
  console.log(render(state()));
}
