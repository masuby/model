/**
 * GOLDEN — the full pipeline raw → risk reproduces the workbook's stored Hazard / Vulnerability /
 * Coping / Risk for every one of the 170 source units (standardise → component AVERAGEIFS → category
 * AVERAGE → dimension scaled GEOMEAN → risk cube-root).
 */
import { describe, expect, it } from 'vitest';
import { computeFromRaw } from '../standardise';
import pipeJson from './fixtures/pipeline.fixture.json';

export interface PipelineRow {
  district: string;
  raw: Record<string, number | string | null>;
  hazard: number;
  vulnerability: number;
  coping: number;
  risk: number;
}
const pipe = pipeJson as unknown as PipelineRow[];

describe('full pipeline raw → risk reproduces the workbook', () => {
  it(`matches stored H / V / C / Risk for all ${pipe.length} districts`, () => {
    const off = (got: number | null | undefined, exp: number) => got == null || Math.abs(got - exp) > 0.051;
    const bad = pipe
      .map((row) => ({ row, r: computeFromRaw(row.raw) }))
      .filter(({ row, r }) => off(r.dimension.H, row.hazard) || off(r.dimension.V, row.vulnerability) || off(r.dimension.C, row.coping) || off(r.risk, row.risk))
      .map(({ row, r }) => ({ d: row.district, got: { ...r.dimension, risk: r.risk } }));
    expect(bad.slice(0, 8)).toEqual([]);
  });

  it('is comprehensive (all 170 districts, real raw)', () => {
    expect(pipe.length).toBeGreaterThanOrEqual(170);
    expect(Object.keys(pipe[0].raw).length).toBeGreaterThan(15);
  });
});
