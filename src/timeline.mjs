// Render data/audit.jsonl as demo/timeline.html: swimlanes per room, a line across on a delivered
// share, a red bar on a denial, yellow on hold and on a tilt, and the table underneath.
// Self-contained HTML, no scripts, Inter from Google Fonts only. `npm run timeline` runs this file.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as audit from "./audit.mjs";

export const OUT_PATH = fileURLToPath(new URL("../demo/timeline.html", import.meta.url));

const C = { bg: "#0A0A0D", txt: "#F5F5F7", mut: "rgba(245,245,247,.56)", faint: "rgba(245,245,247,.32)", hair: "rgba(255,255,255,.08)",
  glass: "rgba(255,255,255,.035)", green: "#7EDC9B", yellow: "#E5B96B", red: "#FF7A70", blue: "#8AB4FF" };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (v) => v == null ? "—" : typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")) : String(v);
const hhmmss = (ts) => { const d = new Date(ts); return Number.isNaN(d) ? "—" : d.toISOString().slice(11, 23); };

/** Colour of one row: green delivered share, red refused, yellow hold or tilt, faint otherwise. */
function colour(r) {
  if (r.allowed === false) return C.red;
  if (r.tilt) return C.yellow;
  if (r.verdict === "hold") return C.yellow;
  if (r.verdict === "share" && r.allowed === true) return C.green;
  if (r.override != null) return C.blue;
  return C.faint;
}

export function render(rows = audit.all()) {
  const main = ["backend", "frontend"];
  const extra = ["qa", "pm"].filter((room) => rows.some((r) => r.from_room === room || r.to_room === room));
  const lanes = [...main, ...extra];
  const laneY = Object.fromEntries(lanes.map((room, i) => [room, 56 + i * (main.includes(room) ? 96 : 64) + (i >= 2 ? 40 : 0)]));
  const height = Math.max(...Object.values(laneY), 56) + 56;
  const step = 34, left = 120, width = Math.max(760, left + rows.length * step + 40);
  const x = (i) => left + i * step;

  const first = rows[0]?.ts, last = rows.at(-1)?.ts;
  const spanS = first && last ? ((new Date(last) - new Date(first)) / 1000) : 0;
  const crossings = rows.filter((r) => r.crossing_id && r.override == null);
  const delivered = crossings.filter((r) => r.verdict === "share" && r.allowed === true).length;
  const held = new Set(crossings.filter((r) => r.verdict === "hold").map((r) => r.crossing_id)).size;
  const denied = rows.filter((r) => r.allowed === false).length;
  const overrides = rows.filter((r) => r.override != null).length;
  const tilted = new Set(crossings.filter((r) => r.tilt).map((r) => r.crossing_id)).size;
  const latencies = crossings.map((r) => r.latency_ms).filter((v) => typeof v === "number");
  const maxLatency = latencies.length ? Math.max(...latencies) : null;

  const svg = [];
  svg.push(`<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="audit timeline">`);
  for (const room of lanes) {
    const y = laneY[room], thin = !main.includes(room);
    svg.push(`<line x1="${left - 20}" y1="${y}" x2="${width - 20}" y2="${y}" stroke="${C.hair}" stroke-width="${thin ? 1 : 1.5}"/>`);
    svg.push(`<text x="16" y="${y + 4}" fill="${thin ? C.faint : C.mut}" font-size="${thin ? 11 : 12.5}" font-weight="500" letter-spacing=".08em">${esc(room.toUpperCase())}</text>`);
  }
  rows.forEach((r, i) => {
    const cx = x(i), col = colour(r);
    const from = laneY[r.from_room], to = laneY[r.to_room];
    const title = `<title>#${r.seq} ${esc(r.crossing_id ?? r.kind)} ${esc(r.from_room ?? "")} → ${esc(r.to_room ?? "—")} · ${esc(r.kind)} · ${esc(r.verdict ?? r.action ?? "")} · allowed ${fmt(r.allowed)}</title>`;
    if (r.kind === "access") {
      // A token asking a room: a tick on that room's lane; red bar when refused.
      if (to != null) svg.push(r.allowed === false
        ? `<rect x="${cx - 4}" y="${to - 16}" width="8" height="32" rx="2" fill="${C.red}" opacity=".9">${title}</rect>`
        : `<rect x="${cx - 1}" y="${to - 6}" width="2" height="12" fill="${C.faint}">${title}</rect>`);
      return;
    }
    if (r.override != null) {
      if (from != null) svg.push(`<rect x="${cx - 5}" y="${from - 5}" width="10" height="10" transform="rotate(45 ${cx} ${from})" fill="none" stroke="${C.blue}" stroke-width="1.5">${title}</rect>`);
      return;
    }
    if (from != null && to != null && r.allowed === true && r.verdict === "share") {
      svg.push(`<line x1="${cx}" y1="${from}" x2="${cx}" y2="${to}" stroke="${C.green}" stroke-width="2" stroke-linecap="round" opacity=".85"/>`);
      svg.push(`<circle cx="${cx}" cy="${to}" r="3.5" fill="${C.green}"/>`);
    } else if (from != null && to != null && r.allowed === false) {
      const top = Math.min(from, to), bottom = Math.max(from, to);
      svg.push(`<line x1="${cx}" y1="${top}" x2="${cx}" y2="${bottom}" stroke="${C.red}" stroke-width="1" stroke-dasharray="3 3" opacity=".6"/>`);
      svg.push(`<rect x="${cx - 4}" y="${to - 14}" width="8" height="28" rx="2" fill="${C.red}">${title}</rect>`);
    }
    if (from != null) {
      svg.push(`<circle cx="${cx}" cy="${from}" r="${r.tilt ? 7 : 5.5}" fill="${col}" ${r.tilt ? `stroke="${C.yellow}" stroke-width="2" fill-opacity=".35"` : ""}>${title}</circle>`);
    }
  });
  // seq ticks along the bottom, every row when few, every 5th otherwise.
  rows.forEach((r, i) => { if (rows.length <= 40 || i % 5 === 0) svg.push(`<text x="${x(i)}" y="${height - 14}" fill="${C.faint}" font-size="10" text-anchor="middle">${r.seq}</text>`); });
  svg.push(`</svg>`);

  const tr = rows.map((r) => {
    const col = colour(r);
    const to = r.to_room ?? "—";
    return `<tr><td class="m f">${hhmmss(r.ts)}</td><td class="m">${esc(r.crossing_id ?? "")}</td><td>${esc(r.from_room ?? "—")} <span class="f">→</span> ${esc(to)}</td><td>${esc(r.kind)}${r.action ? ` <span class="f">${esc(r.action)}</span>` : ""}</td>` +
      `<td style="color:${col};font-weight:600">${esc(r.override != null ? `${r.verdict} → ${r.override}` : (r.verdict ?? "—"))}${r.tilt ? ` <span class="y">tilt</span>` : ""}</td><td class="m">${fmt(r.confidence)}</td><td>${esc(r.decider_version ?? "—")}</td>` +
      `<td style="color:${r.allowed === false ? C.red : r.allowed === true ? C.green : C.faint}">${fmt(r.allowed)}</td><td class="m">${fmt(r.latency_ms)}</td></tr>`;
  }).join("\n");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Talos — timeline</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:${C.bg};--txt:${C.txt};--mut:${C.mut};--faint:${C.faint};--hair:${C.hair};--glass:${C.glass};--green:${C.green};--yellow:${C.yellow};--red:${C.red};--blue:${C.blue}}
*{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--txt);font:14px/1.6 Inter,-apple-system,system-ui,sans-serif;-webkit-font-smoothing:antialiased;max-width:1180px;margin:48px auto;padding:0 24px}
h1{font-size:22px;font-weight:600;letter-spacing:-.01em}
.sub{color:var(--mut);margin-top:4px}
.c{margin:18px 0;padding:18px 22px;border-radius:18px;background:var(--glass);border:1px solid var(--hair)}
.n{font-size:11px;color:var(--faint);letter-spacing:.12em;text-transform:uppercase;font-weight:500}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px}
.stats b{display:block;font-size:22px;font-weight:600;font-variant-numeric:tabular-nums}
.scroll{overflow-x:auto;padding-top:8px}
svg text{font-family:Inter,system-ui,sans-serif}
.legend{display:flex;flex-wrap:wrap;gap:18px;font-size:12px;color:var(--mut);margin-top:8px}
.legend i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:middle}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th{text-align:left;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);font-weight:500;padding:6px 10px;border-bottom:1px solid var(--hair)}
td{padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.04);color:var(--mut);vertical-align:top;white-space:nowrap}
td.m{font-variant-numeric:tabular-nums}.f{color:var(--faint)}.y{color:var(--yellow);font-weight:500}
.empty{color:var(--faint);padding:28px 0;text-align:center}
</style></head><body>
<h1>Talos · timeline</h1>
<p class="sub">Every row of <code>data/audit.jsonl</code>. ${rows.length} rows${first ? `, first at ${esc(hhmmss(first))} UTC, spanning ${spanS.toFixed(1)} s` : ""}. Rendered ${esc(new Date().toISOString())}.</p>
<div class="c stats">
  <div><span class="n">rows</span><b>${rows.length}</b></div>
  <div><span class="n">delivered shares</span><b style="color:var(--green)">${delivered}</b></div>
  <div><span class="n">held</span><b style="color:var(--yellow)">${held}</b></div>
  <div><span class="n">refused</span><b style="color:var(--red)">${denied}</b></div>
  <div><span class="n">tilted</span><b style="color:var(--yellow)">${tilted}</b></div>
  <div><span class="n">overrides</span><b style="color:var(--blue)">${overrides}</b></div>
  <div><span class="n">max decide latency</span><b>${maxLatency == null ? "—" : `${(maxLatency / 1000).toFixed(3)} s`}</b></div>
</div>
<div class="c"><div class="n">swimlanes · one dot per row at its seq</div>
${rows.length ? `<div class="scroll">${svg.join("\n")}</div>` : `<div class="empty">no rows yet — run the demo, then <code>npm run timeline</code></div>`}
<div class="legend"><span><i style="background:var(--green)"></i>share delivered (line across lanes)</span><span><i style="background:var(--yellow)"></i>hold, or tilt (ring)</span><span><i style="background:var(--red);border-radius:2px"></i>refused by scope or token</span><span><i style="border:1.5px solid var(--blue);border-radius:2px;transform:rotate(45deg)"></i>human override</span><span><i style="background:var(--faint);width:2px;border-radius:0"></i>allowed read</span></div>
</div>
<div class="c"><div class="n">audit.jsonl</div>
<div class="scroll"><table><thead><tr><th>ts</th><th>crossing</th><th>from → to</th><th>kind</th><th>verdict</th><th>conf</th><th>decider</th><th>allowed</th><th>latency ms</th></tr></thead>
<tbody>${tr || `<tr><td colspan="9" class="empty">empty</td></tr>`}</tbody></table></div></div>
</body></html>
`;
}

export function write(outPath = OUT_PATH) {
  const rows = audit.all();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, render(rows));
  return { path: outPath, rows: rows.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const r = write();
  console.error(`timeline: ${r.rows} rows -> ${path.relative(process.cwd(), r.path)}`);
}
