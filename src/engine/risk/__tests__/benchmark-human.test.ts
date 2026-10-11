/**
 * The Benchmark 2026's human-hazard datasets: road crashes per 100 km2 (police records shared among
 * councils by population, so the big cities carry them) and hazardous-material sites per 100 km2
 * (OpenStreetMap, the 2022 census mapping and the NEMC certificates of July-September 2026).
 */
import { describe, expect, it } from 'vitest';
import { BENCHMARK_ACTIVATIONS, BENCHMARK_DATASETS } from '../benchmark';
import { buildModel, indicatorValue } from '../model';

const model = buildModel();
const value = (name: string, key: 'vehicleAccidents' | 'hazardousMaterial') => indicatorValue(model.councils.find((c) => c.name === name)!, 'hazard', key)!;

describe('road crashes', () => {
  it('are densest in the big cities and sparsest in the large rural councils', () => {
    expect(BENCHMARK_DATASETS['road-crashes']).toMatchObject({ indicator: 'HA.HUM.ACC', unit: 'crashes per 100 km2', values: 195, institution: 'TPF' });
    expect(BENCHMARK_ACTIVATIONS['HA.HUM.ACC']).toMatchObject({ transform: 'Logarithm', normalisation: 'Data range', keyed_at: 'Adm2' });
    for (const city of ['Temeke Municipal', 'Kinondoni Municipal', 'Ubungo Municipal', 'Dar es Salaam City', 'Mwanza City', 'Arusha City', 'Mbeya City']) expect(value(city, 'vehicleAccidents'), city).toBeGreaterThan(6);
    expect(value('Mjini Municipal', 'vehicleAccidents')).toBe(10);
    expect(value('Sikonge District', 'vehicleAccidents')).toBe(0);
    expect(value('Mwanza City', 'vehicleAccidents')).toBeGreaterThan(value('Misungwi District', 'vehicleAccidents'));
  });
});

describe('hazardous-material sites', () => {
  it('cover every council, the cities and their industrial towns first', () => {
    expect(BENCHMARK_DATASETS['hazmat-sites']).toMatchObject({ indicator: 'HA.HUM.HMAT', unit: 'sites per 100 km2', values: 195, institution: 'NEMC' });
    expect(BENCHMARK_ACTIVATIONS['HA.HUM.HMAT']).toMatchObject({ transform: 'Logarithm', normalisation: 'Data range', sign: 'Increase Risk' });
    expect(model.councils.every((c) => indicatorValue(c, 'hazard', 'hazardousMaterial') !== null)).toBe(true);
    for (const city of ['Temeke Municipal', 'Kinondoni Municipal', 'Dar es Salaam City', 'Mwanza City', 'Arusha City', 'Moshi Municipal', 'Mbeya City']) expect(value(city, 'hazardousMaterial'), city).toBeGreaterThan(7.5);
    expect(value('Kibaha Town', 'hazardousMaterial')).toBeGreaterThan(value('Kibaha District', 'hazardousMaterial'));
    expect(value('Liwale District', 'hazardousMaterial')).toBe(0);
  });
});
