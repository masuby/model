/**
 * The data control view (admin and PMO-DMD): who serves which indicator, how far each institution is,
 * and where every live value of every indicator group comes from. Pure functions over the workflow
 * data and the model, so the screen is one table of facts and the tests can check the arithmetic.
 */
import type { Institution } from '@/data-layer/types';
import { ALL_INDICATORS } from '@/engine/risk/hierarchy';
import { DATA_NOTES, type DataNote } from '@/engine/risk/notes';
import { isBenchmarkStamp } from '@/engine/risk/stamps';
import type { EditRef, RiskModel } from '@/engine/risk/types';
import { indicatorStatuses, suggestedOwner, WORKFLOW_INDICATORS, type IndicatorStatus, type WorkflowData, type WorkflowIndicator } from './workflow';

export interface InstitutionRow {
  key: string;
  label: string;
  fullName: string;
  kind: Institution['kind'];
  /** The indicators assigned to the institution, in workflow order. */
  assigned: WorkflowIndicator[];
  core: number;
  advanced: number;
  openRequests: number;
  overdue: number;
  /** Submissions of the institution's indicators waiting for review. */
  pending: number;
  /** Assigned indicators with at least one approved value. */
  updated: number;
  lastUpdate: string | null;
  /** Unassigned indicators whose usual source is this institution. */
  suggested: WorkflowIndicator[];
}

export interface Distribution {
  rows: InstitutionRow[];
  unassigned: WorkflowIndicator[];
  statuses: Map<string, IndicatorStatus>;
  totals: { institutions: number; serving: number; assigned: number; total: number; core: number; coreTotal: number; openRequests: number; overdue: number; pending: number };
}

/** The distribution of data-serving responsibilities across the institutions, with each one's progress. */
export function distribution(data: WorkflowData, institutions: readonly Institution[], today = new Date()): Distribution {
  const statuses = indicatorStatuses(data, today);
  const byKey = new Map<string, InstitutionRow>();
  for (const i of institutions) byKey.set(i.key, { key: i.key, label: i.label, fullName: i.fullName, kind: i.kind, assigned: [], core: 0, advanced: 0, openRequests: 0, overdue: 0, pending: 0, updated: 0, lastUpdate: null, suggested: [] });
  const unassigned: WorkflowIndicator[] = [];
  for (const w of WORKFLOW_INDICATORS) {
    const s = statuses.get(w.spec.id)!;
    if (!s.owner) {
      unassigned.push(w);
      const usual = suggestedOwner(w);
      if (usual && byKey.has(usual)) byKey.get(usual)!.suggested.push(w);
      continue;
    }
    let row = byKey.get(s.owner);
    if (!row) {
      // An institution the register no longer lists still shows what it holds.
      row = { key: s.owner, label: s.owner, fullName: s.owner, kind: 'national', assigned: [], core: 0, advanced: 0, openRequests: 0, overdue: 0, pending: 0, updated: 0, lastUpdate: null, suggested: [] };
      byKey.set(s.owner, row);
    }
    row.assigned.push(w);
    if (w.core) row.core++;
    else row.advanced++;
    if (s.openRequest) row.openRequests++;
    if (s.overdue) row.overdue++;
    row.pending += s.pending;
    if (s.lastUpdate) {
      row.updated++;
      if (!row.lastUpdate || s.lastUpdate > row.lastUpdate) row.lastUpdate = s.lastUpdate;
    }
  }
  const rows = [...byKey.values()].sort((a, b) => b.assigned.length - a.assigned.length || b.suggested.length - a.suggested.length || a.label.localeCompare(b.label));
  const totals = {
    institutions: rows.length,
    serving: rows.filter((r) => r.assigned.length > 0).length,
    assigned: WORKFLOW_INDICATORS.length - unassigned.length,
    total: WORKFLOW_INDICATORS.length,
    core: WORKFLOW_INDICATORS.filter((w) => w.core && statuses.get(w.spec.id)!.owner).length,
    coreTotal: WORKFLOW_INDICATORS.filter((w) => w.core).length,
    openRequests: rows.reduce((n, r) => n + r.openRequests, 0),
    overdue: rows.reduce((n, r) => n + r.overdue, 0),
    pending: rows.reduce((n, r) => n + r.pending, 0),
  };
  return { rows, unassigned, statuses, totals };
}

export interface GroupControl {
  dim: 'hazard' | 'vulnerability' | 'coping';
  category: string;
  key: string;
  /** Councils whose live value is the workbook's. */
  workbook: number;
  /** Councils carrying a Benchmark 2026 value (prepared from public datasets, shipped with the release). */
  benchmark: number;
  /** Councils carrying a value an institution submitted through the Data portal and PMO-DMD approved. */
  institutional: number;
  /** Councils whose workbook value is withheld (the validation quarantine), not replaced. */
  withheld: number;
  /** Councils with no value at all. */
  empty: number;
  notes: DataNote[];
}

/** Where the live value of every indicator group comes from, council by council. */
export function valuesControl(model: RiskModel): GroupControl[] {
  return ALL_INDICATORS.map((l) => {
    const dim = l.dimension.key;
    const ref = `${dim}:${l.indicator.key}` as EditRef;
    let workbook = 0;
    let benchmark = 0;
    let institutional = 0;
    let withheld = 0;
    let empty = 0;
    for (const c of model.councils) {
      const stamp = c.edits[ref];
      if (stamp && isBenchmarkStamp(stamp)) benchmark++;
      else if (stamp) institutional++;
      else if (c.quarantined?.[ref]) withheld++;
      else if (typeof c.dims[dim].categories[l.category.key]?.indicators[l.indicator.key] === 'number') workbook++;
      else empty++;
    }
    return { dim, category: l.category.key, key: l.indicator.key, workbook, benchmark, institutional, withheld, empty, notes: DATA_NOTES.filter((n) => n.ref === ref) };
  });
}
