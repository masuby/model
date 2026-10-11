/**
 * The council registry (data-source/council_registry.csv) is the permanent record of the 195 council
 * identifiers and of every council's link to its INFORM workbook unit. The bundled index must equal it,
 * so a re-export of the boundaries can never renumber a council or move its data to another council.
 */
import { describe, expect, it } from 'vitest';
import registryCsv from '../../../../data-source/council_registry.csv?raw';
import councilIndex from '@/data/tanzania-councils-index.json';
import dataset from '@/data/tanzania-inform-risk.json';

interface Row { code: string; name: string; type: string; region: string; workbook_unit: string; link: string; formerly: string; parent: string }
const csv = (registryCsv as string).trim().split('\n');
const cols = csv[0].split(',');
const registry: Row[] = csv.slice(1).map((ln: string) => Object.fromEntries(cols.map((c: string, i: number) => [c, ln.split(',')[i] ?? ''])) as unknown as Row);
const index = councilIndex as Array<{ code: string; name: string; reg: string; src: string; isNew?: boolean; parent?: string; formerly?: string }>;
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const units = (dataset as { subnational: { adm2: Array<{ admin: { adm2Name: string } }> } }).subnational.adm2.map((u) => u.admin.adm2Name);

describe('council registry', () => {
  it('holds the 195 councils with contiguous, frozen identifiers', () => {
    expect(registry.map((r) => r.code)).toEqual(Array.from({ length: 195 }, (_, i) => `C${String(i + 1).padStart(3, '0')}`));
  });
  it('is what the app bundles (name, region, workbook unit, inheritance)', () => {
    expect(index).toHaveLength(registry.length);
    for (const [i, r] of registry.entries()) {
      expect(index[i].code).toBe(r.code);
      expect(index[i].name).toBe(r.name);
      expect(index[i].reg).toBe(r.region);
      expect(key(index[i].src)).toBe(key(r.workbook_unit));
      expect(Boolean(index[i].isNew)).toBe(r.link === 'inherits');
      expect(index[i].formerly ?? '').toBe(r.formerly);
    }
  });
  it('links every council to an existing workbook unit, and uses every unit', () => {
    const have = new Set(units.map(key));
    have.add('butiama'); // the workbook spells it 'Butiam'
    for (const r of registry) expect(have.has(key(r.workbook_unit)), `${r.name} -> ${r.workbook_unit}`).toBe(true);
    const used = new Set(registry.map((r) => key(r.workbook_unit)));
    expect(units.filter((u) => !used.has(key(u)) && key(u) !== 'butiam')).toEqual([]);
  });
  it('gives urban councils their own urban or township unit', () => {
    const expectUnit = (name: string, unit: string) => expect(key(registry.find((r) => r.name === name)!.workbook_unit)).toBe(key(unit));
    expectUnit('Kasulu Town', 'Kasulu Township Authority');
    expectUnit('Kigoma Ujiji Municipal', 'Kigoma Urban');
    expectUnit('Kahama Municipal', 'Kahama Township Authority');
    expectUnit('Mtwara Mikindani Municipal', 'Mtwara Urban');
    expectUnit('Njombe Town', 'Njombe Urban');
    expectUnit('Makambako Town', 'Makambako Township Authority');
    expectUnit('Mafinga Town', 'Mafinga Township Authority');
    expectUnit('Babati Town', 'Babati Urban');
    expectUnit('Handeni Town', 'Handeni Mji');
    expectUnit('Kibaha Town', 'Kibaha Urban');
    expectUnit('Korogwe Town', 'Korogwe Township Authority');
    expectUnit('Masasi Town', 'Masasi Township Authority');
  });
  it('records renamed councils with their former name, not as new councils', () => {
    const renamed = registry.filter((r) => r.link === 'renamed');
    expect(renamed.map((r) => [r.name, r.workbook_unit, r.formerly])).toEqual([
      ['Dar es Salaam City', 'Ilala', 'Ilala Municipal Council'],
      ['Mtama District', 'Lindi', 'Lindi District Council'],
      ['Mwanza City', 'Nyamagana', 'Nyamagana Municipal Council'],
    ]);
  });
  it('types every mainland council as PO-RALG does (6 city, 20 municipal, 21 town, 137 district)', () => {
    const zanzibar = new Set(['Kaskazini Unguja', 'Kusini Unguja', 'Mjini Magharibi', 'Kaskazini Pemba', 'Kusini Pemba']);
    const mainland = registry.filter((r) => !zanzibar.has(r.region));
    const count = (t: string) => mainland.filter((r) => r.type === t).length;
    expect(mainland).toHaveLength(184);
    expect([count('City'), count('Municipal'), count('Town'), count('District')]).toEqual([6, 20, 21, 137]);
  });
});
