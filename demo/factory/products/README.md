# Adding a product to the factory

A product is two new files. Nothing else changes.

1. `demo/factory/products/<name>.sh`: the steps, sourced by `build.sh`. Use only the helpers it gives you:
   `step <room> "<what>"` (shows on the page), `write <room> "<text>"` (a real Talos write: the decider
   classifies it, the scope check picks the targets, the audit row is the log), `frontend_hears` (Frontend
   reads `changes` on a call it was already making; returns 1 if nothing crossed), `state '<json>'` (writes
   `$APP/state.json`), `receipt <room> "<msg>"` (a git commit as that room's author when `FACTORY_COMMIT=1`),
   `say "<text>"`, `sleep "$PAUSE"`, `$APP` (your app folder), `$CLI`, `$FE`, `$QA`. Copy `feed.sh` and
   change the words. Keep the shape: PM decision, Backend contract, Frontend builds only after `frontend_hears`,
   a held note, an injected note that is refused, a breaking contract change Frontend hears mid-task, a QA
   reject then approve, a second sprint, a denied read, a revoke. Kind detection is keyword based
   (`src/decider.mjs` SIGNALS): say `contract:`, `decision:`, `verdict:`, `switch to`, `the field is now`,
   `trying ... I will` for a private note.
2. `demo/factory/app/<name>/index.html`: the app. One file, vanilla JS, no build. It polls `state.json`
   every second and renders only features listed in `state.features`; the data file's field name follows
   `state.contract` (`v1` old name, `v2` new name), so the rename is visible. Dark palette from `feed/index.html`.

Test: `bash demo/factory/build.sh <name> --fast` with `node demo/factory/server.mjs` running; the page at
http://localhost:4242 lists products from this folder automatically. Add the display name to `NAMES` in
`demo/factory/index.html` if you want a nicer label than the file name.
