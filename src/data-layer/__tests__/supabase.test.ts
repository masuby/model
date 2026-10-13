import { describe, expect, it } from 'vitest';
import { parseChanges } from '../supabase';

describe('parseChanges (validates client-written JSON from the submissions table)', () => {
  it('keeps well-formed changes, including null (= no data) and raw values', () => {
    expect(
      parseChanges([
        { ref: 'hazard:flood', value: 7.5, previous: 6.1 },
        { ref: 'vulnerability:habitat', value: null },
        { ref: 'coping:wash', value: 4, raw: { specId: 'CC.INF.WASH-W', value: 61, unit: '%' } },
      ]),
    ).toEqual([
      { ref: 'hazard:flood', value: 7.5, previous: 6.1 },
      { ref: 'vulnerability:habitat', value: null },
      { ref: 'coping:wash', value: 4, raw: { specId: 'CC.INF.WASH-W', value: 61, unit: '%' } },
    ]);
  });

  it('drops malformed entries instead of trusting them', () => {
    expect(
      parseChanges([
        { ref: 'hazard:flood; drop table', value: 1 },
        { ref: 'hazard:flood', value: '9' },
        { ref: 'hazard:flood', value: Number.NaN as unknown as number },
        'nonsense',
        null,
        [1, 2],
      ]),
    ).toEqual([]);
    expect(parseChanges({ ref: 'hazard:flood', value: 1 })).toEqual([]);
    expect(parseChanges(null)).toEqual([]);
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* An older database: reads fall back to what it has and the gaps are recorded                        */
/* ------------------------------------------------------------------------------------------------ */

import { createSupabaseRepository, schemaGaps, type SupabaseClient } from '../supabase';

type Result = { data: unknown; error: { message: string; code?: string } | null };
type Script = (table: string, select: string, kind: 'select' | 'rpc', args?: Record<string, unknown>) => Result;

/** A client whose every query resolves through `script` (the chain of select/order/range/eq/single/limit is accepted). */
function fakeClient(script: Script): SupabaseClient {
  const from = (table: string) => {
    let select = '';
    const b: Record<string, unknown> = {};
    b.select = (cols: string) => {
      select = cols;
      return b;
    };
    for (const m of ['order', 'range', 'eq', 'neq', 'limit', 'single']) b[m] = () => b;
    b.then = (resolve: (v: Result) => unknown, reject?: (e: unknown) => unknown) => Promise.resolve(script(table, select, 'select')).then(resolve, reject);
    return b;
  };
  return { auth: { getSession: async () => ({ data: { session: {} } }) }, from, rpc: (fn: string, args: Record<string, unknown>) => Promise.resolve(script(fn, '', 'rpc', args)) } as unknown as SupabaseClient;
}

const missingTable = (name: string): Result => ({ data: null, error: { code: 'PGRST205', message: `Could not find the table 'public.${name}' in the schema cache` } });
const missingColumn = (table: string, column: string): Result => ({ data: null, error: { code: '42703', message: `column ${table}.${column} does not exist` } });

describe('a database still on an older migration', () => {
  it('reads values without their type, method and source (before migration 0006) and records the gap', async () => {
    const repo = createSupabaseRepository(
      fakeClient((table, select) => {
        if (table !== 'raw_values') return { data: [], error: null };
        if (select.includes('value_type')) return missingColumn('raw_values', 'value_type');
        return { data: [{ spec_id: 'HA.NAT.DR-FRE', unit_id: 'C001', level: 'council', value: 3, dataset: 'TMA report', period: '2024', institution_key: 'TMA', author_name: 'A', updated_at: '2026-10-13T00:00:00Z' }], error: null };
      }),
    );
    const values = await repo.getRawValues();
    expect(values).toHaveLength(1);
    expect(values[0]).toMatchObject({ specId: 'HA.NAT.DR-FRE', unitId: 'C001', level: 'council', value: 3, valueType: 'raw', method: null, source: null, dataset: 'TMA report', institution: 'TMA' });
    expect(schemaGaps()).toContain('raw_values.value_type');
  });

  it('shows no committee records or notifications where their tables do not exist yet', async () => {
    const repo = createSupabaseRepository(fakeClient((table) => (table === 'committee_records' || table === 'notifications' ? missingTable(table) : { data: [], error: null })));
    expect(await repo.listCommitteeRecords()).toEqual([]);
    expect(await repo.listNotifications({ id: 'u', fullName: 'A', role: 'pmo' })).toEqual([]);
    expect(schemaGaps()).toEqual(expect.arrayContaining(['committee_records', 'notifications']));
  });

  it('submits a measured value through the older function, and refuses a score deposit plainly', async () => {
    const calls: Array<Record<string, unknown>> = [];
    const repo = createSupabaseRepository(
      fakeClient((table, _select, kind, args) => {
        if (kind === 'rpc') {
          calls.push(args ?? {});
          if (args && 'p_value_type' in args) return { data: null, error: { code: 'PGRST202', message: 'Could not find the function public.submit_raw_values(p_dataset, p_entries, p_method, p_note, p_period, p_request_id, p_source, p_spec_id, p_value_type) in the schema cache' } };
          return { data: 'id-1', error: null };
        }
        if (table === 'raw_submissions')
          return { data: { id: 'id-1', spec_id: 'HA.NAT.DR-FRE', institution_key: 'TMA', request_id: null, entries: [], dataset: 'TMA report', period: null, note: null, author_id: 'u', author_name: 'A', status: 'pending', created_at: '2026-10-13T00:00:00Z', reviewed_at: null, reviewer_name: null, review_note: null }, error: null };
        return { data: [], error: null };
      }),
    );
    const author = { id: 'u', fullName: 'A', role: 'sector' as const };
    const sent = await repo.submitRaw({ specId: 'HA.NAT.DR-FRE', entries: [{ unitId: 'C001', level: 'council', value: 3 }], dataset: 'TMA report' }, author);
    expect(sent).toMatchObject({ id: 'id-1', valueType: 'raw' });
    expect(calls).toHaveLength(2);
    expect(calls[1]).not.toHaveProperty('p_value_type');
    await expect(repo.submitRaw({ specId: 'HA.NAT.DR-FRE', entries: [{ unitId: 'C001', level: 'council', value: 3 }], dataset: 'x', valueType: 'score', method: 'inform' }, author)).rejects.toThrow(/migration 0006/);
    expect(schemaGaps()).toContain('submit_raw_values');
  });

  it('still surfaces a real failure', async () => {
    const repo = createSupabaseRepository(fakeClient(() => ({ data: null, error: { code: '42501', message: 'permission denied for table raw_values' } })));
    await expect(repo.getRawValues()).rejects.toThrow(/permission denied/);
  });
});
