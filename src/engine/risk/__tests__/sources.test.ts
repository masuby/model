/**
 * Core provenance is the workbook's own metadata: every indicator group with data resolves to the workbook
 * component behind it (names matched like the hierarchy does), the six empty groups are labelled as having
 * no data, and the Tanzanian custodian is never shown as the source of a value it did not supply.
 */
import { describe, expect, it } from 'vitest';
import workbookSources from '@/data/inform-workbook-sources.json';
import { ALL_INDICATORS, leafForWorkbookComponent } from '../hierarchy';
import { custodianFor, EMPTY_IN_WORKBOOK, sourceFor, workbookIndicatorsFor } from '../sources';
import { usedSpecs } from '../standardise';

const components = Object.values((workbookSources as { components: Record<string, { component: string; indicators: string[] }> }).components);

describe('Core provenance comes from the workbook metadata', () => {
  it('every workbook component with data resolves to a leaf whose Core source is that component', () => {
    expect(components.length).toBe(26);
    for (const c of components) {
      const leaf = leafForWorkbookComponent(c.component);
      expect(leaf, c.component).not.toBeNull();
      const src = sourceFor(leaf!.dimension.key, leaf!.indicator.key);
      expect(src.dataset, c.component).not.toBe(EMPTY_IN_WORKBOOK.dataset);
      expect(src.resolution, c.component).not.toBe('none');
      expect(workbookIndicatorsFor(leaf!.dimension.key, leaf!.indicator.key).map((i) => i.id)).toEqual(c.indicators);
    }
  });

  it('exactly the six empty groups have no source and the `none` resolution', () => {
    const empty = ALL_INDICATORS.filter((l) => sourceFor(l.dimension.key, l.indicator.key).resolution === 'none')
      .map((l) => l.indicator.key)
      .sort();
    expect(empty).toEqual(['economic', 'hazardousMaterial', 'heatwave', 'lightning', 'vehicleAccidents', 'zoonoses']);
  });

  it('every used workbook indicator belongs to exactly one leaf source', () => {
    const ids = ALL_INDICATORS.flatMap((l) => workbookIndicatorsFor(l.dimension.key, l.indicator.key).map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(usedSpecs().map((s) => s.id).filter((id) => !ids.includes(id))).toEqual([]);
  });

  it('the Core source is always the workbook and the custodian always a Tanzanian institution', () => {
    for (const l of ALL_INDICATORS) {
      expect(sourceFor(l.dimension.key, l.indicator.key).by).toBe('INFORM');
      expect(custodianFor(l.dimension.key, l.indicator.key).by).not.toBe('INFORM');
    }
  });
});
