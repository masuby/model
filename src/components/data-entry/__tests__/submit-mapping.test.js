/**
 * Guard: the raw-entry submit must map EVERY used workbook component onto an engine DIMENSION_TREE leaf,
 * or that indicator silently drops when a sector submits actual values. (The recheck caught "&" vs "and"
 * and the "Env. Degradation" abbreviation - this keeps them caught.)
 */
import { describe, it, expect } from 'vitest';
import { DIMENSION_TREE, DIM_KEYS } from '../../inform-risk/riskModel';
import { ALL_SPECS } from '../../../services/standardise';

const norm = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '');
const LEAF = (() => {
  const m = {};
  for (const dim of DIM_KEYS) for (const c of DIMENSION_TREE[dim].components) for (const i of c.indicators) m[norm(i.label)] = { dim, k: i.k };
  m[norm('Environmental Degradation')] = { dim: 'hazard', k: 'environmentalDegradation' };
  return m;
})();

describe('raw-entry submit -> engine mapping', () => {
  it('every USED workbook component maps to a DIMENSION_TREE leaf', () => {
    const used = [...new Set(Object.values(ALL_SPECS).filter((s) => s.use === 'Yes').map((s) => s.component))];
    const unmapped = used.filter((c) => !LEAF[norm(c)]);
    expect(unmapped).toEqual([]);
    expect(used.length).toBe(26);
  });
});
