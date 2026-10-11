#!/usr/bin/env node
/**
 * check-bundle-size.mjs - the size budget of the application's first download (run after `vite build`).
 *
 * Reads dist/index.html, finds the entry module it loads, and fails when the entry chunk grows past its
 * budget. The budget protects phones on slow networks: a data file bundled into the entry by mistake
 * (the Benchmark 2026 once added 1.1 MB of repeated strings) shows up here, not in the field.
 *
 * Usage: node scripts/check-bundle-size.mjs [--raw-kb 880] [--gzip-kb 200]
 *
 * The raw budget rose from 850 to 880 KB on 11 October 2026 for the text-size and panel-width controls in
 * the shell (interface code, not data); the gzip budget, the cost on the wire, stays at 200 KB.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const RAW_KB = opt('--raw-kb', 880);
const GZIP_KB = opt('--gzip-kb', 200);
const dist = path.resolve('dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const src = [...html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g)].map((m) => m[1]).find((s) => /\/assets\/index-[^/]+\.js$/.test(s));
if (!src) {
  console.error('check-bundle-size: no entry module found in dist/index.html');
  process.exit(1);
}
const file = path.join(dist, src.replace(/^\//, ''));
const buf = fs.readFileSync(file);
const raw = buf.length / 1024;
const gz = zlib.gzipSync(buf, { level: 9 }).length / 1024;
console.log(`entry ${path.basename(file)}: ${raw.toFixed(0)} KB raw (budget ${RAW_KB}), ${gz.toFixed(0)} KB gzip (budget ${GZIP_KB})`);
if (raw > RAW_KB || gz > GZIP_KB) {
  console.error('check-bundle-size: the entry chunk is over budget. Move large data out of the entry (lazy import) or store it compactly.');
  process.exit(1);
}
