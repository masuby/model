/**
 * integrity-recheck.mjs - the indicator integrity register of a release:
 * docs/assessment/INFORM_TZ_Indicator_Integrity_<release>.{md,json}, every Core indicator and every
 * Advancement member rechecked value by value with the engine itself. Bundles
 * scripts/lib/integrity-recheck.ts with esbuild (the engine is TypeScript with "@/" and JSON imports).
 *
 * run: node scripts/integrity-recheck.mjs
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
process.chdir(ROOT);
const dir = mkdtempSync(join(tmpdir(), 'integrity-recheck-'));
try {
  const outfile = join(dir, 'integrity-recheck.mjs');
  await build({
    entryPoints: [join(ROOT, 'scripts/lib/integrity-recheck.ts')],
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
