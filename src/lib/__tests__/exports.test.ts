/**
 * Every file that leaves the site carries the release, the date, what it covers, the lineage legend and
 * the disclaimer (EXP-01), and names its file after the release.
 */
import { describe, expect, it } from 'vitest';
import '@/i18n';
import i18n from '@/i18n';
import { DATA_AS_OF, DATA_RELEASE } from '@/engine/risk/model';
import { exportFileName, exportMeta, exportPreamble, exportStamp, lineageOf } from '../exports';

const t = i18n.getFixedT('en');

describe('export stamp', () => {
  it('names the release, the data month, the generation time, the scope and the layer', () => {
    const stamp = exportStamp('Kondoa District (council)', { now: new Date('2026-10-10T08:00:00Z') });
    expect(stamp).toEqual({ release: DATA_RELEASE, asOf: DATA_AS_OF, generated: '2026-10-10T08:00:00.000Z', scope: 'Kondoa District (council)', layer: 'core' });
    expect(DATA_RELEASE).toMatch(/^core-\d{4}\.\d{2}$/);
    expect(DATA_AS_OF).toBe('2024-12');
  });

  it('opens a CSV with labelled rows and an empty row, in the reader’s language', () => {
    const rows = exportPreamble(t, exportStamp('Explorer', { now: new Date('2026-10-10T08:00:00Z') }));
    const labels = rows.map((r) => r[0]);
    expect(labels).toEqual(['INFORM Tanzania export', 'Data release', 'Layer', 'Data as of', 'Generated', 'Covers', 'Lineage of values', 'Disclaimer', undefined]);
    expect(rows[1][1]).toBe(DATA_RELEASE);
    expect(rows[3][1]).toBe('2024-12');
    expect(rows[6][1]).toContain('workbook = ');
    expect(rows[6][1]).toContain('inherited = ');
    expect(rows[7][1]).toContain('support, not replace');
    expect(rows[rows.length - 1]).toEqual([]);
    const sw = exportPreamble(i18n.getFixedT('sw'), exportStamp('Kichunguzi'));
    expect(sw[1][0]).toBe('Toleo la data');
  });

  it('gives a JSON export the same fields', () => {
    const meta = exportMeta(t, exportStamp('Severity', { layer: 'advancement', release: 'adv-2026.10' }));
    expect(meta.release).toBe('adv-2026.10');
    expect(meta.layer).toBe('advancement');
    expect(meta.dataAsOf).toBe('2024-12');
    expect(Object.keys(meta.lineage)).toEqual(['workbook', 'benchmark', 'institution', 'advancement', 'inherited', 'none']);
  });

  it('names files after the release', () => {
    expect(exportFileName('council-risk', { release: 'core-2026.10' })).toBe('inform-tz-core-2026.10-council-risk.csv');
    expect(exportFileName('severity', { release: 'core-2026.10' }, 'json')).toBe('inform-tz-core-2026.10-severity.json');
  });
});

describe('lineage of a value', () => {
  const at = '2026-10-10T00:00:00Z';
  it('tells the workbook, the Benchmark 2026, an institution, the Advancement layer, an inherited value and no value apart', () => {
    expect(lineageOf(undefined, { inheritedFrom: null }, 4.3)).toBe('workbook');
    expect(lineageOf(undefined, { inheritedFrom: 'Rufiji' }, 4.3)).toBe('inherited');
    expect(lineageOf(undefined, { inheritedFrom: null }, null)).toBe('none');
    expect(lineageOf({ value: 5, at, authority: 'NBS' }, { inheritedFrom: null }, 5)).toBe('institution');
    expect(lineageOf({ value: 5, at, authority: 'CHC' }, { inheritedFrom: 'Rufiji' }, 5)).toBe('advancement');
    expect(lineageOf({ value: 5, at, authority: 'NEMC', release: 'bm-2026.10' }, { inheritedFrom: null }, 5)).toBe('benchmark');
  });
});
