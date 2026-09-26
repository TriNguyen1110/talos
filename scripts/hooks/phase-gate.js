#!/usr/bin/env node
// PreToolUse gate: a builder may only write what its phase allows.
//
// The timebox table in CLAUDE.md is prose, and prose does not stop anyone at 15:30. This does.
// Reads the tool call on stdin, asks scripts/clock.mjs, and exits 2 to block with the reason.
// A tool call with no file path is always allowed; this gate is about writes, not thinking.
'use strict';
const { execFileSync } = require('node:child_process');
const path = require('node:path');

let raw = '';
try { raw = require('node:fs').readFileSync(0, 'utf8'); } catch { process.exit(0); }
let payload = {};
try { payload = JSON.parse(raw || '{}'); } catch { process.exit(0); }

const input = payload.tool_input || payload.toolInput || {};
const file = input.file_path || input.path || input.notebook_path;
if (!file) process.exit(0);

try {
  execFileSync(process.execPath, [path.join(__dirname, '..', 'clock.mjs'), '--gate', String(file)], { stdio: ['ignore', 'ignore', 'inherit'] });
} catch (error) {
  process.exit(typeof error.status === 'number' ? error.status : 2);
}
process.exit(0);
