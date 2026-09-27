#!/usr/bin/env node
// Turns the saved factory runs into the training-row format from docs/finetune.md.
// One row per decided change: the input the decider saw, the label it should have produced
// (the verdict, corrected by a human override when there is one), and where it came from.
//   node demo/factory/train-export.mjs   -> demo/factory/runs/train.jsonl
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), RUNS = path.join(HERE, "runs");
const out = [];
for (const f of fs.readdirSync(RUNS).filter((f) => f.endsWith(".json"))) {
  const run = JSON.parse(fs.readFileSync(path.join(RUNS, f), "utf8"));
  const overrides = new Map(run.rows.filter((r) => r.override).map((r) => [r.crossing_id, r.override]));
  const seen = new Set();
  for (const r of run.rows) {
    if (r.kind === "access" || r.override || !r.crossing_id || seen.has(r.crossing_id)) continue;
    seen.add(r.crossing_id);
    const targets = run.rows.filter((x) => x.crossing_id === r.crossing_id && x.to_room && x.allowed === true).map((x) => x.to_room);
    out.push({
      input: { text: r.text, from_room: r.from_room, kind: null, options: r.option_order?.verdict ?? ["share", "hold", "discard"] },
      label: { kind: r.kind, verdict: overrides.get(r.crossing_id) ?? r.verdict, targets },
      source: "demo", product: run.product, override: overrides.has(r.crossing_id),
      decider_version: r.decider_version, confidence: r.confidence, tilt: !!r.tilt, ts: r.ts,
    });
  }
}
const dest = path.join(RUNS, "train.jsonl");
fs.writeFileSync(dest, out.map((o) => JSON.stringify(o)).join("\n") + "\n");
const by = (k) => Object.entries(out.reduce((a, o) => ((a[o.label[k]] = (a[o.label[k]] || 0) + 1), a), {})).map(([k, v]) => `${k}=${v}`).join(" ");
console.log(`${out.length} training rows -> ${path.relative(process.cwd(), dest)}  kinds: ${by("kind")}  verdicts: ${by("verdict")}  overrides: ${out.filter((o) => o.override).length}`);
