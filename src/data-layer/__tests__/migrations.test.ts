/**
 * The database seeds must agree with the code: the institutions in migration 0004 are the source
 * register (same keys, labels and kind: Tanzanian institution or global dataset), and its indicator list
 * with migrations 0008's and 0012's is the workflow's (the 53 INFORM indicators flagged core, plus the 30 advanced ones);
 * migrations 0014 and 0015 flag the Benchmark 2026 activations core with their Tanzanian names, and 0016 the
 * two institutional indicators the engine computes from the committees' records.
 */
import workflowSql from '../../../supabase/migrations/0004_data_workflow.sql?raw';
import membersSql from '../../../supabase/migrations/0008_advanced_members.sql?raw';
import feltSql from '../../../supabase/migrations/0012_felt_intensity_member.sql?raw';
import activatedSql from '../../../supabase/migrations/0014_benchmark_activations.sql?raw';
import revisedSql from '../../../supabase/migrations/0015_benchmark_hazmat_crashes.sql?raw';
import institutionalSql from '../../../supabase/migrations/0016_institutional_indicators.sql?raw';
import custodiansSql from '../../../supabase/migrations/0013_assign_custodians.sql?raw';
import viewsSql from '../../../supabase/migrations/0009_public_views.sql?raw';
import unitsSql from '../../../supabase/migrations/0010_validate_units.sql?raw';
import notificationsSql from '../../../supabase/migrations/0011_notifications.sql?raw';
import { ALL_INDICATORS } from '@/engine/risk/hierarchy';
import { buildModel } from '@/engine/risk/model';
import { AUTHORITIES, AUTHORITY_KEYS, authorityKind } from '@/engine/risk/sources';
import { ACTIVATED_SPECS } from '@/engine/risk/standardise';
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

  it('seeds the workflow indicators, the INFORM ones flagged core (with the members of migrations 0008 and 0012 and the activations of 0014 to 0016)', () => {
    // Later migrations upsert on spec_id: the last row for an id wins, as in the database.
    const rows = [...seedRows(workflowSql, 'indicators'), ...seedRows(membersSql, 'indicators'), ...seedRows(feltSql, 'indicators'), ...seedRows(activatedSql, 'indicators'), ...seedRows(revisedSql, 'indicators'), ...seedRows(institutionalSql, 'indicators')];
    const seeded = new Map(rows.map((r) => [r[0], r[r.length - 1] === 'true']));
    expect([...seeded.keys()].sort()).toEqual(WORKFLOW_INDICATORS.map((w) => w.spec.id).sort());
    for (const w of WORKFLOW_INDICATORS) expect(seeded.get(w.spec.id), w.spec.id).toBe(w.core);
    expect([...seeded.values()].filter(Boolean)).toHaveLength(63);
    const activated = new Set([...seedRows(activatedSql, 'indicators'), ...seedRows(revisedSql, 'indicators'), ...seedRows(institutionalSql, 'indicators')].map((r) => r[0]));
    expect([...activated].sort()).toEqual(Object.keys(ACTIVATED_SPECS).sort());
    // The names the portal shows are the activation's own.
    const names = new Map([...seedRows(activatedSql, 'indicators'), ...seedRows(revisedSql, 'indicators'), ...seedRows(institutionalSql, 'indicators')].map((r) => [r[0], r[1]]));
    for (const [id, spec] of Object.entries(ACTIVATED_SPECS)) expect(names.get(id), id).toBe(spec.name);
  });
});

describe('migration 0009 (no officer names for anonymous clients, SEC-02)', () => {
  it('takes the tables with personal columns away from anon and offers views without them', () => {
    expect(viewsSql).toMatch(/revoke select on public\.indicator_values, public\.raw_values, public\.indicator_validations from anon;/);
    for (const view of ['indicator_values_public', 'raw_values_public', 'indicator_validations_public']) {
      const def = viewsSql.slice(viewsSql.indexOf(`create or replace view public.${view}`), viewsSql.indexOf(';', viewsSql.indexOf(`create or replace view public.${view}`)));
      expect(def).toContain('security_invoker = true');
      expect(def).not.toMatch(/author_name|validated_by_name|validated_by\b|author_id|updated_by/);
    }
    expect(viewsSql).toMatch(/grant select on public\.indicator_values_public, public\.raw_values_public, public\.indicator_validations_public to anon, authenticated;/);
  });
});

describe('migration 0010 (submissions validated against the model, DE-08)', () => {
  it('seeds every unit of the model and every indicator group, and nothing else', () => {
    const model = buildModel();
    const units = seedRows(unitsSql, 'units');
    const expected = ['TZ', ...model.regions.map((r) => r.id), ...model.councils.map((c) => c.id), ...model.sources.map((s) => s.id)].sort();
    expect(units.map((r) => r[0]).sort()).toEqual(expected);
    for (const [id, level, name] of units) {
      const u = model.byId.get(id)!;
      expect(u, id).toBeTruthy();
      expect(level).toBe(u.level);
      expect(name).toBe(u.name);
    }
    const groups = seedRows(unitsSql, 'indicator_groups');
    expect(groups.map((r) => r[0]).sort()).toEqual(ALL_INDICATORS.map((l) => `${l.dimension.key}:${l.indicator.key}`).sort());
    for (const [ref, dim, cat] of groups) {
      const l = ALL_INDICATORS.find((x) => `${x.dimension.key}:${x.indicator.key}` === ref)!;
      expect(dim).toBe(l.dimension.key);
      expect(cat).toBe(l.category.key);
    }
  });

  it('checks a submission on insert and again on review', () => {
    expect(unitsSql).toMatch(/create trigger submissions_validate before insert on public\.submissions/);
    expect(unitsSql).toMatch(/raise exception 'Unknown unit %'/);
    expect(unitsSql).toMatch(/raise exception 'Unknown indicator group %'/);
    const review = unitsSql.slice(unitsSql.indexOf('create or replace function public.review_submission'));
    expect(review.indexOf('perform app.validate_submission(s.unit_id, s.changes)')).toBeLessThan(review.indexOf('insert into public.indicator_values'));
  });
});

describe('migration 0011 (institutions are notified, DE-07)', () => {
  it('writes a notification on every request and on every decision, visible to the institution and to reviewers', () => {
    expect(notificationsSql).toMatch(/create trigger data_requests_notify after insert on public\.data_requests/);
    expect(notificationsSql).toMatch(/create trigger raw_submissions_notify after update of status on public\.raw_submissions/);
    expect(notificationsSql).toMatch(/kind\s+text not null check \(kind in \('request', 'reminder', 'decision'\)\)/);
    expect(notificationsSql).toMatch(/using \(institution_key = \(select app\.current_institution\(\)\) or \(select app\.is_reviewer\(\)\)\)/);
    expect(notificationsSql).toMatch(/grant update \(read_at\) on public\.notifications to authenticated/);
    expect(notificationsSql).toMatch(/revoke all on public\.notifications from anon, authenticated/);
    expect(notificationsSql).toMatch(/create or replace function app\.queue_due_reminders\(p_days integer default 3\)/);
  });
});

describe('migration 0013 (a responsible institution for every indicator, SRC-05)', () => {
  it('seeds the fifteen unassigned indicators with the custodian the site names for their group', async () => {
    const { custodianFor } = await import('@/engine/risk/sources');
    const { leafOfSpec } = await import('@/engine/risk/rawValues');
    const rows = seedRows(custodiansSql, 'indicator_assignments');
    expect(rows).toHaveLength(15);
    const ids = WORKFLOW_INDICATORS.map((w) => w.spec.id);
    for (const [specId, institution] of rows) {
      expect(ids, specId).toContain(specId);
      expect(AUTHORITY_KEYS, institution).toContain(institution);
      const leaf = leafOfSpec(specId)!;
      const [dim, key] = leaf.split(':') as ['hazard' | 'vulnerability' | 'coping', string];
      const custodian = custodianFor(dim, key);
      expect([custodian.by, ...custodian.also], specId).toContain(institution);
    }
    expect(custodiansSql).toContain('on conflict (spec_id) do nothing');
  });
});
