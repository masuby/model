/**
 * Illustrative Tanzanian crisis scenarios for the Severity calculator. They are NOT official figures  - 
 * plausible magnitudes chosen to demonstrate the method across the severity scale. The affected area is
 * defined by real councils: `peopleInArea` and `areaAffectedKm2` equal those councils' NBS 2022 census
 * population and polygon area (as the calculator's "use census population & area" would compute), so the
 * map, the numbers and the pre-crisis INFORM Risk context all agree. Structural (country) indicators come
 * from the model defaults (see definitions.ts).
 */
import { ALL_SEVERITY_INDICATORS } from './definitions';
import type { SeverityInput } from './engine';

export const STRUCTURAL_DEFAULTS: SeverityInput = Object.fromEntries(
  ALL_SEVERITY_INDICATORS.filter((d) => d.default !== undefined).map((d) => [d.id, d.default]),
) as SeverityInput;

export interface SeverityScenario {
  id: 'riverineFlood' | 'drought' | 'landslide';
  /** Council ids that define the affected area. */
  councils: string[];
  input: SeverityInput;
}

export const SEVERITY_SCENARIOS: SeverityScenario[] = [
  {
    // Major riverine flood across the Rufiji basin and the Kilombero valley.
    id: 'riverineFlood',
    councils: ['C049', 'C051', 'C037', 'C038', 'C039', 'C040'],
    input: {
      ...STRUCTURAL_DEFAULTS,
      areaAffectedKm2: 49_571,
      peopleInArea: 1_396_525,
      peopleAffected: 480_000,
      displaced: 120_000,
      fatalities: 160,
      levels: { 5: 30_000, 4: 110_000, 3: 170_000, 2: 150_000 },
      groups: ['idps', 'hostCommunities', 'nonHost'],
      accessOfActors: 2,
      accessOfPeople: 2,
      physicalSecurityConstraints: 3,
      dataReliability: 'medium',
      daysSinceUpdate: 7,
    },
  },
  {
    // Slow-onset drought across the central semi-arid corridor (Dodoma and Singida).
    id: 'drought',
    councils: ['C003', 'C004', 'C005', 'C007', 'C095', 'C097'],
    input: {
      ...STRUCTURAL_DEFAULTS,
      areaAffectedKm2: 43_995,
      peopleInArea: 2_346_147,
      peopleAffected: 820_000,
      displaced: 4_000,
      fatalities: 3,
      levels: { 5: 0, 4: 70_000, 3: 260_000, 2: 490_000 },
      groups: ['hostCommunities', 'nonHost'],
      accessOfActors: 0,
      accessOfPeople: 1,
      physicalSecurityConstraints: 1,
      dataReliability: 'high',
      daysSinceUpdate: 30,
    },
  },
  {
    // Localised rainfall-triggered landslide in one highland council.
    id: 'landslide',
    councils: ['C152'],
    input: {
      ...STRUCTURAL_DEFAULTS,
      areaAffectedKm2: 3_570,
      peopleInArea: 367_391,
      peopleAffected: 8_000,
      displaced: 5_000,
      fatalities: 60,
      levels: { 5: 200, 4: 1_800, 3: 3_000, 2: 3_000 },
      groups: ['idps', 'hostCommunities'],
      accessOfActors: 1,
      accessOfPeople: 1,
      physicalSecurityConstraints: 2,
      dataReliability: 'medium',
      daysSinceUpdate: 4,
    },
  },
];
