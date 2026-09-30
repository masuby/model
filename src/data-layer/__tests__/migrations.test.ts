/**
 * The database seeds must agree with the code: the institutions in migration 0004 are the source
 * register (same keys, labels and kind: Tanzanian institution or global dataset), and its indicator list
 * is the workflow's (the 53 INFORM indicators flagged core, plus the 25 advanced ones).
 */
import workflowSql from '../../../supabase/migrations/0004_data_workflow.sql?raw';
import { AUTHORITIES, AUTHORITY_KEYS, authorityKind } from '@/engine/risk/sources';
import { WORKFLOW_INDICATORS } from '@/features/data/lib/workflow';

/** The rows of one `insert into public.<table> (...) values (...), (...);` statement. */
function seedRows(sql: string, table: string): string[][] {
  const start = sql.indexOf(`insert into public.${table} `);
  expect(start, `seed for ${table}`).toBeGreaterThan(-1);
  const body = sql.slice(sql.indexOf('values', start) + 'values'.length, sql.indexOf('\non conflict', start));
  return [...body.matchAll(/\(((?:'(?:[^']|'')*'|[^()'])*)\)/g)].map((m) =>
    [...m[1].matchAll(/'((?:[^']|'')*)'|(true|false|null)/g)].map((v) => (v[1] !== undefined ? v[1].replace(/''/g, "'") : v[2])),
  );
}

describe('migration 0004 seeds', () => {
  it('seeds exactly the source register, with the same labels and kinds', () => {
    const rows = seedRows(workflowSql, 'institutions');
    expect(rows.map((r) => r[0]).sort()).toEqual([...AUTHORITY_KEYS].sort());
    for (const [key, label, fullName, kind] of rows) {
      const a = (AUTHORITIES as Record<string, { label: string; full: string }>)[key];
      expect({ key, label, fullName, kind }).toEqual({ key, label: a.label, fullName: a.full, kind: authorityKind(key) });
    }
  });

  it('seeds the workflow indicators, the INFORM ones flagged core', () => {
    const rows = seedRows(workflowSql, 'indicators');
    const seeded = new Map(rows.map((r) => [r[0], r[r.length - 1] === 'true']));
    expect([...seeded.keys()].sort()).toEqual(WORKFLOW_INDICATORS.map((w) => w.spec.id).sort());
    for (const w of WORKFLOW_INDICATORS) expect(seeded.get(w.spec.id), w.spec.id).toBe(w.core);
    expect([...seeded.values()].filter(Boolean)).toHaveLength(53);
  });
});
