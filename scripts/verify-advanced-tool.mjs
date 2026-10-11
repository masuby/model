/**
 * verify-advanced-tool.mjs - recalculate the ADVANCED benchmark workbook with LibreOffice and compare its
 * component preview with the engine, cell by cell (issue TOOL-02). Exit code 1 on any difference.
 *
 * run: node scripts/verify-advanced-tool.mjs   (needs `soffice` on the PATH and inform_sheets/INFORM_TZ_Advanced_Benchmark.xlsx)
 */
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
process.chdir(ROOT);
const dir = mkdtempSync(join(tmpdir(), 'verify-advanced-tool-'));
try {
  const source = join(ROOT, 'inform_sheets/INFORM_TZ_Advanced_Benchmark.xlsx');
  if (!existsSync(source)) throw new Error(`${source} is missing: run scripts/build-advanced-tool.py and scripts/fill-advanced-tool.py first`);
  // LibreOffice computes every formula on load (openpyxl writes none of the cached values) and the
  // converted copy carries the results.
  execFileSync('soffice', ['--headless', '--convert-to', 'xlsx', '--outdir', dir, source], { stdio: 'ignore' });
  const recalculated = join(dir, 'INFORM_TZ_Advanced_Benchmark.xlsx');
  if (!existsSync(recalculated)) throw new Error('LibreOffice produced no recalculated copy');
  // A CommonJS bundle: the spreadsheet library requires node built-ins at run time.
  const outfile = join(dir, 'verify.cjs');
  await build({
    entryPoints: [join(ROOT, 'scripts/lib/verify-advanced-tool.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    alias: { '@': join(ROOT, 'src') },
    outfile,
    logLevel: 'error',
  });
  process.env.RECALC = recalculated;
  await import(pathToFileURL(outfile).href);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
