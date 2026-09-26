/**
 * Illustrative Tanzanian crisis scenarios for the Severity calculator. They are NOT official figures —
 * plausible magnitudes to demonstrate the method. Structural (country) indicators come from the model
 * defaults (see definitions.ts) unless overridden.
 */
import { ALL_SEVERITY_INDICATORS } from './definitions';
import type { SeverityInput } from './engine';

export const STRUCTURAL_DEFAULTS: SeverityInput = Object.fromEntries(
  ALL_SEVERITY_INDICATORS.filter((d) => d.default !== undefined).map((d) => [d.id, d.default]),
) as SeverityInput;

export interface SeverityScenario {
  id: 'riverineFlood' | 'drought' | 'landslide';
  /** Council ids that define the affected area (population/area are filled from NBS 2022). */
  councils: string[];
  input: SeverityInput;
}

export const SEVERITY_SCENARIOS: SeverityScenario[] = [
  {
    id: 'riverineFlood',
    councils: [],
    input: {
      ...STRUCTURAL_DEFAULTS,
      areaAffectedKm2: 14_500,
      peopleInArea: 1_150_000,
      peopleAffected: 210_000,
      displaced: 38_000,
      fatalities: 58,
      levels: { 5: 4_000, 4: 26_000, 3: 70_000, 2: 110_000 },
      groups: ['idps', 'hostCommunities', 'nonHost'],
      accessOfActors: 1,
      accessOfPeople: 1,
      physicalSecurityConstraints: 2,
      dataReliability: 'medium',
      daysSinceUpdate: 12,
    },
  },
  {
    id: 'drought',
    councils: [],
    input: {
      ...STRUCTURAL_DEFAULTS,
      areaAffectedKm2: 95_000,
      peopleInArea: 3_900_000,
      peopleAffected: 1_100_000,
      displaced: 6_000,
      fatalities: 5,
      levels: { 5: 0, 4: 90_000, 3: 380_000, 2: 630_000 },
      groups: ['hostCommunities', 'nonHost'],
      accessOfActors: 0,
      accessOfPeople: 1,
      physicalSecurityConstraints: 1,
      dataReliability: 'high',
      daysSinceUpdate: 45,
    },
  },
  {
    id: 'landslide',
    councils: [],
    input: {
      ...STRUCTURAL_DEFAULTS,
      areaAffectedKm2: 120,
      peopleInArea: 95_000,
      peopleAffected: 9_000,
      displaced: 5_500,
      fatalities: 80,
      levels: { 5: 300, 4: 2_200, 3: 3_500, 2: 3_000 },
      groups: ['idps', 'hostCommunities'],
      accessOfActors: 1,
      accessOfPeople: 1,
      physicalSecurityConstraints: 2,
      dataReliability: 'medium',
      daysSinceUpdate: 5,
    },
  },
];
