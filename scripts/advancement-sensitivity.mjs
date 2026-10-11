/**
 * advancement-sensitivity.mjs - the sensitivity and validation report of the Advancement layer (issue
 * ADV-04): docs/assessment/INFORM_TZ_Advancement_Sensitivity_2026-10.{md,json}, computed with the engine
 * itself. Bundles scripts/lib/advancement-sensitivity.ts with esbuild (the engine is TypeScript with
 * "@/" and JSON imports) into a temporary module and runs it.
 *
 * run: node scripts/advancement-sensitivity.mjs
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
process.chdir(ROOT);
const dir = mkdtempSync(join(tmpdir(), 'advancement-sensitivity-'));
try {
  const outfile = join(dir, 'advancement-sensitivity.mjs');
  await build({
    entryPoints: [join(ROOT, 'scripts/lib/advancement-sensitivity.ts')],
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
