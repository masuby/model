/**
 * build-worked-example.mjs - regenerate the tables behind docs/WORKED_EXAMPLE.md from the engine itself
 * (src/engine/risk), so the documentation's example can never drift from what the site computes.
 *
 * The engine is TypeScript with "@/" imports and JSON imports, so this wrapper bundles
 * scripts/lib/worked-example.ts with esbuild (a Vite dependency) into a temporary module and runs it.
 *
 * out: docs/worked_example_indicators.csv, docs/worked_example_levels.csv, and a JSON summary on stdout
 * run: node scripts/build-worked-example.mjs
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
process.chdir(ROOT);
const dir = mkdtempSync(join(tmpdir(), 'worked-example-'));
try {
  const outfile = join(dir, 'worked-example.mjs');
  await build({
    entryPoints: [join(ROOT, 'scripts/lib/worked-example.ts')],
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
