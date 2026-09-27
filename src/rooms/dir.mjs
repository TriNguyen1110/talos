// Directory adapter: rooms/<room>/brain/*.md is the write path (a GBrain brain is flat Markdown).
// watch() calls onWrite(room, fileText) about 100 ms after a page changes; returns a closer.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOMS_DIR = fileURLToPath(new URL("../../rooms/", import.meta.url));
export const DEBOUNCE_MS = 100;

export function brainDir(room) { return path.join(ROOMS_DIR, room, "brain"); }

export function watch(room, onWrite) {
  const dir = brainDir(room);
  fs.mkdirSync(dir, { recursive: true });
  const timers = new Map();
  const watcher = fs.watch(dir, (_event, filename) => {
    if (!filename || !String(filename).endsWith(".md")) return;
    const name = String(filename);
    clearTimeout(timers.get(name));
    timers.set(name, setTimeout(() => {
      timers.delete(name);
      let text;
      try { text = fs.readFileSync(path.join(dir, name), "utf8"); } catch { return; } // deleted before we read it
      if (!text.trim()) return;
      Promise.resolve(onWrite(room, text)).catch((e) => console.error(`[talos] ${room}/${name}: ${e.message}`));
    }, DEBOUNCE_MS));
  });
  return () => { for (const t of timers.values()) clearTimeout(t); timers.clear(); watcher.close(); };
}
