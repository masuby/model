/**
 * INFORM SEVERITY INDEX — Definitions (Tanzania Operational Model)
 *
 * Authentic implementation of the JRC / IASC INFORM Severity Index v6 (2023)
 * methodology, adapted for Tanzania subnational use.
 *
 * Reference:
 *   https://drmkc.jrc.ec.europa.eu/inform-index/INFORM-Severity
 *
 * Structure:
 *   • 3 dimensions, each scored 0–5:
 *       IMPACT         — magnitude of the crisis + severity of consequences
 *       CONDITIONS     — pre-existing conditions of the affected people
 *       COMPLEXITY     — operational/political complexity for response
 *   • Each dimension has components; each component has indicators with
 *     refMin/refMax/transform/polarity (same shape as the Risk engine).
 *   • Final Severity = arithmetic mean of the 3 dimensions (per IASC spec —
 *     NOT geometric, unlike INFORM Risk).
 *   • Score 0–5 maps to 5 classes: 1 Very Low → 5 Extreme.
 */

// ============================================================================
// HIERARCHY
// ============================================================================

export const SEVERITY_HIERARCHY = {
  IMPACT: {
    name: 'Impact of the Crisis',
    code: 'IMP',
    color: '#dc2626',
    description: 'Magnitude (people in scope / affected / in need) and severity of consequences for affected people',
    weight: 1 / 3,                 // arithmetic mean
    aggregation: 'MEAN',
    components: {
      magnitude: {
        name: 'Magnitude (people affected & scope)',
        code: 'IMP.MAG',
        aggregation: 'MEAN',
        indicators: [
          'people_in_scope', 'people_affected_pct', 'people_in_need',
          'people_in_dire_need', 'geographic_scope'
        ]
      },
      severity_consequences: {
        name: 'Severity of consequences',
        code: 'IMP.CONS',
        aggregation: 'MEAN',
        indicators: [
          'deaths', 'injuries', 'displaced_pct', 'living_conditions_degradation'
        ]
      }
    }
  },

  CONDITIONS: {
    name: 'Conditions of People Affected',
    code: 'CON',
    color: '#f97316',
    description: 'Pre-existing vulnerability and lack of coping capacity of the affected population (links to baseline INFORM Risk).',
    weight: 1 / 3,
    aggregation: 'MEAN',
    components: {
      living_conditions: {
        name: 'Living conditions deprivation',
        code: 'CON.LC',
        aggregation: 'MEAN',
        indicators: [
          'food_insecurity_ipc', 'water_access_loss', 'sanitation_access_loss',
          'shelter_damage', 'health_service_loss', 'education_disruption'
        ]
      },
      vulnerability_baseline: {
        name: 'Pre-existing vulnerability',
        code: 'CON.VB',
        aggregation: 'MEAN',
        indicators: [
          'baseline_inform_risk', 'vulnerable_groups_present', 'recent_shocks_cumulative'
        ]
      }
    }
  },

  COMPLEXITY: {
    name: 'Complexity of the Crisis',
    code: 'CMX',
    color: '#7c3aed',
    description: 'Operational, political and security complexity that constrains response.',
    weight: 1 / 3,
    aggregation: 'MEAN',
    components: {
      access: {
        name: 'Humanitarian access',
        code: 'CMX.ACC',
        aggregation: 'MEAN',
        indicators: [
          'physical_access_constraint', 'bureaucratic_constraint', 'access_to_affected_pct'
        ]
      },
      safety_security: {
        name: 'Safety & security',
        code: 'CMX.SAF',
        aggregation: 'MEAN',
        indicators: [
          'active_conflict', 'security_incidents', 'staff_safety_index'
        ]
      },
      information: {
        name: 'Information availability',
        code: 'CMX.INF',
        aggregation: 'MEAN',
        indicators: [
          'data_availability', 'assessment_recency', 'reporting_quality'
        ]
      }
    }
  }
};

// ============================================================================
// INDICATORS
//
// All indicators are normalized to a 0–5 scale at ingest (INFORM Severity
// uses 0–5, not 0–10 like Risk).
//   polarity NEGATIVE — higher raw value = higher severity
//   polarity POSITIVE — higher raw value = lower severity (inverted at ingest)
//   transform: 'none' | 'log1p' (large counts) | 'pctpop' (% of pop)
// ============================================================================

function indSev(id, name, dim, cmp, opts = {}) {
  return {
    id, name,
    dimension: dim, component: cmp,
    unit: opts.unit ?? 'index (0-5)',
    polarity: opts.polarity ?? 'NEGATIVE',
    refMin: opts.refMin ?? 0,
    refMax: opts.refMax ?? 5,
    transform: opts.transform ?? 'none',
    informCore: opts.informCore ?? true
  };
}

export const SEVERITY_INDICATORS = {
  // ─── IMPACT — MAGNITUDE ──────────────────────────────────────────────────
  people_in_scope:           indSev('people_in_scope',           'People in scope (count)',                'IMPACT', 'magnitude', { transform: 'log1p', refMin: 100, refMax: 10000000, unit: 'persons' }),
  people_affected_pct:       indSev('people_affected_pct',       'People affected (% of pop)',             'IMPACT', 'magnitude', { refMin: 0,  refMax: 100, unit: '%' }),
  people_in_need:            indSev('people_in_need',            'People in need (count)',                 'IMPACT', 'magnitude', { transform: 'log1p', refMin: 10, refMax: 5000000, unit: 'persons' }),
  people_in_dire_need:       indSev('people_in_dire_need',       'People in dire need (count)',            'IMPACT', 'magnitude', { transform: 'log1p', refMin: 1,  refMax: 1000000, unit: 'persons' }),
  geographic_scope:          indSev('geographic_scope',          'Geographic scope (# wards/districts)',   'IMPACT', 'magnitude', { refMin: 0,  refMax: 50,  unit: 'admin units' }),

  // ─── IMPACT — SEVERITY OF CONSEQUENCES ───────────────────────────────────
  deaths:                            indSev('deaths',                            'Deaths',                                'IMPACT', 'severity_consequences', { transform: 'log1p', refMin: 0, refMax: 10000, unit: 'persons' }),
  injuries:                          indSev('injuries',                          'Injuries',                              'IMPACT', 'severity_consequences', { transform: 'log1p', refMin: 0, refMax: 50000, unit: 'persons' }),
  displaced_pct:                     indSev('displaced_pct',                     'Displaced (% of affected)',             'IMPACT', 'severity_consequences', { refMin: 0, refMax: 100, unit: '%' }),
  living_conditions_degradation:     indSev('living_conditions_degradation',     'Living conditions degradation index',   'IMPACT', 'severity_consequences', { refMin: 0, refMax: 5, unit: 'index 0-5' }),

  // ─── CONDITIONS — LIVING CONDITIONS ──────────────────────────────────────
  food_insecurity_ipc:       indSev('food_insecurity_ipc',       'Food insecurity (IPC/CH phase)',         'CONDITIONS', 'living_conditions',     { refMin: 1, refMax: 5, unit: 'IPC 1-5' }),
  water_access_loss:         indSev('water_access_loss',         'Water access loss (% affected)',         'CONDITIONS', 'living_conditions',     { refMin: 0, refMax: 100, unit: '%' }),
  sanitation_access_loss:    indSev('sanitation_access_loss',    'Sanitation access loss (% affected)',    'CONDITIONS', 'living_conditions',     { refMin: 0, refMax: 100, unit: '%' }),
  shelter_damage:            indSev('shelter_damage',            'Shelter damage (% of affected HHs)',     'CONDITIONS', 'living_conditions',     { refMin: 0, refMax: 100, unit: '%' }),
  health_service_loss:       indSev('health_service_loss',       'Health service disruption (%)',          'CONDITIONS', 'living_conditions',     { refMin: 0, refMax: 100, unit: '%' }),
  education_disruption:      indSev('education_disruption',      'Education disruption (% schools)',       'CONDITIONS', 'living_conditions',     { refMin: 0, refMax: 100, unit: '%' }),

  // ─── CONDITIONS — VULNERABILITY BASELINE ─────────────────────────────────
  // Pulls from Module 02 INFORM Risk — the canonical linkage between the two
  // INFORM products. baseline_inform_risk is on the 0–10 Risk scale; we
  // rescale to 0–5 here.
  baseline_inform_risk:      indSev('baseline_inform_risk',      'Baseline INFORM Risk (rescaled 0-5)',    'CONDITIONS', 'vulnerability_baseline', { refMin: 0, refMax: 10, unit: 'risk score' }),
  vulnerable_groups_present: indSev('vulnerable_groups_present', 'Vulnerable groups present (% affected)', 'CONDITIONS', 'vulnerability_baseline', { refMin: 0, refMax: 100, unit: '%' }),
  recent_shocks_cumulative:  indSev('recent_shocks_cumulative',  'Recent shocks cumulative (last 3 yrs)',  'CONDITIONS', 'vulnerability_baseline', { refMin: 0, refMax: 10, unit: 'shock-count' }),

  // ─── COMPLEXITY — ACCESS ─────────────────────────────────────────────────
  physical_access_constraint: indSev('physical_access_constraint', 'Physical access constraint',           'COMPLEXITY', 'access',          { refMin: 0, refMax: 5, unit: 'index 0-5' }),
  bureaucratic_constraint:    indSev('bureaucratic_constraint',    'Bureaucratic / permit constraint',     'COMPLEXITY', 'access',          { refMin: 0, refMax: 5, unit: 'index 0-5' }),
  access_to_affected_pct:     indSev('access_to_affected_pct',     'Access to affected population (%)',    'COMPLEXITY', 'access',          { polarity: 'POSITIVE', refMin: 0, refMax: 100, unit: '%' }),

  // ─── COMPLEXITY — SAFETY & SECURITY ──────────────────────────────────────
  active_conflict:           indSev('active_conflict',           'Active conflict in operational area',    'COMPLEXITY', 'safety_security', { refMin: 0, refMax: 5, unit: 'index 0-5' }),
  security_incidents:        indSev('security_incidents',        'Security incidents (last 30 days)',      'COMPLEXITY', 'safety_security', { transform: 'log1p', refMin: 0, refMax: 100, unit: 'count' }),
  staff_safety_index:        indSev('staff_safety_index',        'Staff safety risk index',                'COMPLEXITY', 'safety_security', { refMin: 0, refMax: 5, unit: 'index 0-5' }),

  // ─── COMPLEXITY — INFORMATION ────────────────────────────────────────────
  data_availability:         indSev('data_availability',         'Data availability for assessment',       'COMPLEXITY', 'information',     { polarity: 'POSITIVE', refMin: 0, refMax: 5, unit: 'index 0-5' }),
  assessment_recency:        indSev('assessment_recency',        'Days since last needs assessment',       'COMPLEXITY', 'information',     { refMin: 0, refMax: 180, unit: 'days' }),
  reporting_quality:         indSev('reporting_quality',         'Reporting quality',                      'COMPLEXITY', 'information',     { polarity: 'POSITIVE', refMin: 0, refMax: 5, unit: 'index 0-5' })
};

// Component index derived from hierarchy
export const SEVERITY_COMPONENTS = {};
for (const [dimId, dim] of Object.entries(SEVERITY_HIERARCHY)) {
  for (const [compId, comp] of Object.entries(dim.components)) {
    SEVERITY_COMPONENTS[compId] = {
      id: compId,
      code: comp.code,
      name: comp.name,
      dimension: dimId,
      aggregation: comp.aggregation,
      indicators: comp.indicators
    };
  }
}

// ============================================================================
// CLASSIFICATION (IASC INFORM Severity Index — 5 classes on 0–5 scale)
//
// Thresholds are upper bounds (exclusive); the last class extends to 5.
// ============================================================================

export const SEVERITY_CLASS_LABELS = [
  { label: 'Very Low',  labelSw: 'Athari Ndogo Sana',  color: '#2E7D32', level: 1 },
  { label: 'Low',       labelSw: 'Athari Ndogo',        color: '#8BC34A', level: 2 },
  { label: 'High',      labelSw: 'Athari Kubwa',        color: '#FFC107', level: 3 },
  { label: 'Very High', labelSw: 'Athari Kubwa Sana',   color: '#FF9800', level: 4 },
  { label: 'Extreme',   labelSw: 'Athari ya Hatari',    color: '#D32F2F', level: 5 }
];

export const SEVERITY_THRESHOLDS = {
  // 0-1=VL, 1-2=L, 2-3=H, 3-4=VH, 4-5=Extreme — per IASC spec
  SEVERITY:   [1.0, 2.0, 3.0, 4.0, 5.0],
  IMPACT:     [1.0, 2.0, 3.0, 4.0, 5.0],
  CONDITIONS: [1.0, 2.0, 3.0, 4.0, 5.0],
  COMPLEXITY: [1.0, 2.0, 3.0, 4.0, 5.0]
};

// ============================================================================
// STATS
// ============================================================================

export const SEVERITY_STATS = {
  dimensions: Object.keys(SEVERITY_HIERARCHY).length,
  components: Object.keys(SEVERITY_COMPONENTS).length,
  indicators: Object.keys(SEVERITY_INDICATORS).length
};

export default {
  SEVERITY_HIERARCHY,
  SEVERITY_INDICATORS,
  SEVERITY_COMPONENTS,
  SEVERITY_CLASS_LABELS,
  SEVERITY_THRESHOLDS,
  SEVERITY_STATS
};
