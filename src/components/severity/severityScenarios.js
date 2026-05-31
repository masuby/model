/**
 * Curated sample crisis scenarios for the INFORM Severity calculator.
 * Each is a complete set of raw values for the 24 IASC v6 indicators
 * (see informSeverityDefinitions.js) so the engine returns a full,
 * non-preliminary score. These are illustrative Tanzania scenarios — the
 * "dataset" the Severity module visualises; users can also edit any value.
 *
 * baseline_inform_risk defaults to Tanzania's national INFORM Risk (≈4.1),
 * the canonical link between the Risk and Severity products.
 */

export const SEVERITY_SCENARIOS = [
  {
    id: 'rufiji_floods',
    name: 'Rufiji & Coastal Floods (severe)',
    description: 'Rapid-onset riverine + coastal flooding across 12 districts.',
    values: {
      people_in_scope: 850000, people_affected_pct: 42, people_in_need: 320000,
      people_in_dire_need: 85000, geographic_scope: 12,
      deaths: 89, injuries: 1200, displaced_pct: 35, living_conditions_degradation: 3.5,
      food_insecurity_ipc: 3, water_access_loss: 60, sanitation_access_loss: 70,
      shelter_damage: 45, health_service_loss: 40, education_disruption: 55,
      baseline_inform_risk: 4.1, vulnerable_groups_present: 30, recent_shocks_cumulative: 4,
      physical_access_constraint: 3, bureaucratic_constraint: 1.5, access_to_affected_pct: 65,
      active_conflict: 0.5, security_incidents: 3, staff_safety_index: 1.5,
      data_availability: 3, assessment_recency: 14, reporting_quality: 3.2
    }
  },
  {
    id: 'central_drought',
    name: 'Central Regions Drought (moderate, slow-onset)',
    description: 'Prolonged dry spell driving food insecurity across 18 districts.',
    values: {
      people_in_scope: 1200000, people_affected_pct: 28, people_in_need: 450000,
      people_in_dire_need: 60000, geographic_scope: 18,
      deaths: 12, injuries: 30, displaced_pct: 8, living_conditions_degradation: 2.5,
      food_insecurity_ipc: 4, water_access_loss: 55, sanitation_access_loss: 30,
      shelter_damage: 5, health_service_loss: 20, education_disruption: 25,
      baseline_inform_risk: 4.1, vulnerable_groups_present: 35, recent_shocks_cumulative: 5,
      physical_access_constraint: 1.5, bureaucratic_constraint: 1, access_to_affected_pct: 80,
      active_conflict: 0, security_incidents: 0, staff_safety_index: 0.5,
      data_availability: 3.5, assessment_recency: 30, reporting_quality: 3.5
    }
  },
  {
    id: 'urban_fire',
    name: 'Localized Urban Fire (minor)',
    description: 'Single-ward settlement fire — contained, well-resourced response.',
    values: {
      people_in_scope: 2500, people_affected_pct: 3, people_in_need: 800,
      people_in_dire_need: 120, geographic_scope: 1,
      deaths: 4, injuries: 25, displaced_pct: 60, living_conditions_degradation: 2,
      food_insecurity_ipc: 2, water_access_loss: 10, sanitation_access_loss: 15,
      shelter_damage: 80, health_service_loss: 5, education_disruption: 10,
      baseline_inform_risk: 4.1, vulnerable_groups_present: 20, recent_shocks_cumulative: 1,
      physical_access_constraint: 0.5, bureaucratic_constraint: 0.5, access_to_affected_pct: 95,
      active_conflict: 0, security_incidents: 0, staff_safety_index: 0.5,
      data_availability: 4, assessment_recency: 3, reporting_quality: 4
    }
  }
];
