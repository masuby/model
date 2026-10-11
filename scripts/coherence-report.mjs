/**
 * coherence-report.mjs - the statistical coherence report of a release (issue MET-13):
 * docs/assessment/INFORM_TZ_Coherence_<release>.{md,json}, computed with the engine itself. Bundles
 * scripts/lib/coherence-report.ts with esbuild (the engine is TypeScript with "@/" and JSON imports).
 *
 * run: node scripts/coherence-report.mjs
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
process.chdir(ROOT);
const dir = mkdtempSync(join(tmpdir(), 'coherence-report-'));
try {
  const outfile = join(dir, 'coherence-report.mjs');
  await build({
    entryPoints: [join(ROOT, 'scripts/lib/coherence-report.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    alias: { '@': join(ROOT, 'src') },
    outfile,
    logLevel: 'error',
  });
  await import(pathToFileURL(outfile).href);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
