/**
 * INFORM INDICATOR DEFINITIONS — Tanzania Subnational Model
 *
 * Operational catalog: maps directly to the Tanzania Excel template
 * (TZ_INFORM_model.xlsx, sheet "INFORM SADC 2024"). Aggregation methods
 * mirror the Excel formulas verbatim so that this engine produces the same
 * numbers the spreadsheet does for the same inputs.
 *
 * Methodology background: INFORM Concept and Methodology v2017 (JRC;
 * Vernaccini). Where the Tanzania Excel deviates from the PDF (notably:
 * Excel uses arithmetic mean at category level, PDF specifies geometric
 * mean for Natural Hazards and Vulnerable Groups), we follow the EXCEL.
 * The PDF deviations are documented in the per-component comments.
 *
 * EXCEL PIPELINE — operational source of truth:
 *
 *   Indicators (raw + transform + normalize → 0–10)
 *      ↓  AVERAGEIFS  (arithmetic mean over indicators whose header
 *                      matches the component name)
 *   Components (0–10)
 *      ↓  =AVERAGE(...)
 *   Categories (0–10)
 *      ↓  =ROUND((10 - GEOMEAN(((10-cat1)/10*9+1), ((10-cat2)/10*9+1))) / 9*10, 1)
 *   Dimensions (0–10, rounded to 1 dp)
 *      ↓  =ROUND(H^(1/3) * V^(1/3) * LCC^(1/3), 1)
 *   RISK (0–10, rounded to 1 dp)
 *
 * Each indicator declares:
 *   refMin / refMax  — bounds for min-max normalization to 0–10
 *   polarity         — NEGATIVE (higher raw = higher risk; e.g. flood exposure)
 *                      POSITIVE (higher raw = lower risk; e.g. HDI, electricity)
 *   transform        — 'none' | 'log' | 'log1p' | 'sqrt' | 'sqr'
 *   informCore       — true if part of INFORM 2017 Core (PDF Annex 2)
 *   tanzaniaExtension — true if Tanzania-specific subnational extension
 *
 * Aggregation methods:
 *   MEAN     — arithmetic mean   (Excel: AVERAGE / AVERAGEIFS)
 *   GEOMEAN  — INFORM scaled geometric mean (Excel formula in Box 6 / footnote 33)
 *   WMEAN    — weighted arithmetic mean (available but unused — kept for future
 *              PDF-strict mode)
 *   MAX      — maximum (available but unused at category level by Excel)
 */

// ============================================================================
// INDICATOR HIERARCHY
// Aggregation rules sourced from PDF Tables 5, 7, 11, 13, 16, 18.
// Where the Tanzania model adds extra components beyond INFORM Core, those
// components carry tanzaniaExtension: true so they can be excluded when
// computing the INFORM 2017 Core score.
// ============================================================================

export const COMPLETE_HIERARCHY = {
  HAZARD: {
    name: 'Hazard & Exposure',
    code: 'HA',
    color: '#ef4444',
    aggregation: 'GEOMEAN',  // PDF §4.2.1.1, p.18: "aggregated with the geometric mean"
    weight: 1 / 3,
    categories: {
      NATURAL: {
        name: 'Natural Hazards',
        // Excel: =AVERAGE(G3:R3). PDF Table 5 calls for geometric average, but
        // the Tanzania operational template uses arithmetic mean.
        aggregation: 'MEAN',
        weight: 0.5,
        components: {
          coastal_hazards: {
            name: 'Coastal Hazards',
            code: 'HA.NAT.CH',
            aggregation: 'MEAN',  // Excel: AVERAGEIFS across matching indicators
            tanzaniaExtension: true,
            indicators: ['coastal_erosion', 'sea_level_rise']
          },
          drought: {
            name: 'Drought',
            code: 'HA.NAT.DR',
            aggregation: 'MEAN',
            indicators: ['historic_drought_frequency']
          },
          earthquake: {
            name: 'Earthquake',
            code: 'HA.NAT.EQ',
            aggregation: 'MEAN',
            indicators: ['earthquake_exposure']
          },
          environmental_degradation: {
            name: 'Environmental Degradation',
            code: 'HA.NAT.ED',
            aggregation: 'MEAN',
            tanzaniaExtension: true,
            indicators: ['deforestation_treecover_loss', 'soil_erosion']
          },
          flood: {
            name: 'Flood',
            code: 'HA.NAT.FL',
            aggregation: 'MEAN',
            indicators: ['flood_exposure']
          },
          heatwave: {
            name: 'Heatwave',
            code: 'HA.NAT.HW',
            aggregation: 'MEAN',
            tanzaniaExtension: true,
            indicators: ['heatwave_exposure']
          },
          landslide: {
            name: 'Landslide',
            code: 'HA.NAT.LS',
            aggregation: 'MEAN',
            tanzaniaExtension: true,  // PDF Box 1: allowed as subnational extension
            indicators: ['landslide_exposure']
          },
          lightning: {
            name: 'Lightning',
            code: 'HA.NAT.LT',
            aggregation: 'MEAN',
            tanzaniaExtension: true,
            indicators: ['lightning_casualties']
          },
          storms_cyclone: {
            name: 'Storms & Cyclone',
            code: 'HA.NAT.SC',
            aggregation: 'MEAN',
            indicators: ['cyclone_exposure', 'storm_exposure', 'cyclone_max_speed']
          },
          volcano: {
            name: 'Volcano',
            code: 'HA.NAT.VO',
            aggregation: 'MEAN',
            tanzaniaExtension: true,
            indicators: ['volcano_exposure']
          },
          wildfire: {
            name: 'Wildfire',
            code: 'HA.NAT.WF',
            aggregation: 'MEAN',
            tanzaniaExtension: true,  // PDF Box 1: allowed as subnational extension
            indicators: ['burned_area', 'fire_weather_index']
          },
          zoonoses_plants_pests: {
            name: 'Zoonoses, Plants & Pests',
            code: 'HA.NAT.ZP',
            aggregation: 'MEAN',
            tanzaniaExtension: true,  // PDF §5.2: biological hazards excluded from Core
            indicators: ['animal_diseases', 'plant_diseases', 'pests']
          }
        }
      },
      HUMAN: {
        name: 'Human Hazards',
        // Excel: =AVERAGE(T3:X3). PDF Table 7 calls for MAX of Current vs Projected.
        aggregation: 'MEAN',
        weight: 0.5,
        components: {
          conflict_intensity: {
            name: 'Conflict Intensity',
            code: 'HA.HUM.CI',
            aggregation: 'MEAN',
            indicators: ['conflict_barometer']
          },
          conflict_risk: {
            name: 'Projected Conflict Risk',
            code: 'HA.HUM.CR',
            aggregation: 'MEAN',
            indicators: ['gcri_conflict_probability']
          },
          hazardous_material: {
            name: 'Hazardous Material',
            code: 'HA.HUM.HM',
            aggregation: 'MEAN',
            tanzaniaExtension: true,  // PDF §5.2: technological hazards excluded from Core
            indicators: ['hazardous_material']
          },
          internal_violence: {
            name: 'Internal Violence',
            code: 'HA.HUM.IV',
            aggregation: 'MEAN',
            tanzaniaExtension: true,
            indicators: ['violence_events', 'violence_fatalities']
          },
          vehicle_accidents: {
            name: 'Vehicle Accidents',
            code: 'HA.HUM.VA',
            aggregation: 'MEAN',
            tanzaniaExtension: true,
            indicators: ['vehicle_accidents']
          }
        }
      }
    }
  },

  VULNERABILITY: {
    name: 'Vulnerability',
    code: 'VU',
    color: '#f97316',
    aggregation: 'GEOMEAN',  // PDF §4.3.2: "aggregated through the geometric average"
    weight: 1 / 3,
    categories: {
      SOCIO_ECONOMIC: {
        name: 'Socio-Economic Vulnerability',
        // Excel: =AVERAGE(AA3:AD3). PDF Table 11 specifies 50/25/25 weighted
        // arithmetic average; Tanzania template uses unweighted mean.
        aggregation: 'MEAN',
        weight: 0.5,
        components: {
          development_poverty: {
            name: 'Development & Poverty',
            code: 'VU.SE.DP',
            // Excel uses arithmetic mean here too; PDF would say GEOMEAN(HDI, MPI).
            aggregation: 'MEAN',
            indicators: ['hdi', 'gender_inequality_index', 'multidimensional_poverty', 'wealth_inequality']
          },
          economic_dependency: {
            name: 'Economic Dependency',
            code: 'VU.SE.ED',
            aggregation: 'MEAN',
            indicators: ['oda_received', 'personal_remittances', 'dependency_ratio']
          },
          habitat: {
            name: 'Habitat',
            code: 'VU.SE.HA',
            aggregation: 'MEAN',
            tanzaniaExtension: true,
            indicators: ['informal_settlements', 'homes_high_risk_areas', 'urban_population']
          },
          livelihoods: {
            name: 'Livelihoods',
            code: 'VU.SE.LV',
            aggregation: 'MEAN',
            tanzaniaExtension: true,
            indicators: ['food_insufficient', 'food_ipc_classification']
          }
        }
      },
      VULNERABLE_GROUPS: {
        name: 'Vulnerable Groups',
        // Excel: =AVERAGE(AF3:AI3). PDF Table 13 specifies GEOMEAN; Tanzania uses arithmetic.
        aggregation: 'MEAN',
        weight: 0.5,
        components: {
          displaced_people: {
            name: 'Displaced People',
            code: 'VU.VG.DP',
            aggregation: 'MEAN',
            indicators: ['internal_displaced', 'refugees_asylum_seekers']
          },
          health_conditions: {
            name: 'Health Conditions',
            code: 'VU.VG.HC',
            aggregation: 'MEAN',
            indicators: ['life_expectancy', 'cholera_cases', 'malaria_mortality', 'malaria_prevalence',
                         'measles_incidence', 'tuberculosis_incidence', 'dst_prevalence',
                         'people_disabilities', 'people_chronic_illness']
          },
          children_health: {
            name: 'Children Under 5',
            code: 'VU.VG.CH',
            aggregation: 'MEAN',
            indicators: ['neonatal_mortality', 'infant_mortality', 'child_mortality', 'children_underweight']
          },
          economic_vulnerability: {
            name: 'Recent Shocks',
            code: 'VU.VG.RS',
            aggregation: 'MEAN',
            indicators: ['people_affected_disasters', 'unemployed_population',
                         'female_headed_households', 'child_headed_households']
          }
        }
      }
    }
  },

  COPING_CAPACITY: {
    name: 'Coping Capacity',
    code: 'CC',
    color: '#22c55e',
    aggregation: 'GEOMEAN',  // PDF §4.4.2: geometric mean
    weight: 1 / 3,
    // CC indicators are POSITIVE polarity (higher = more capacity); the engine
    // inverts them per-indicator at ingest, then aggregates. No second
    // inversion at dimension level (fixes the historic double-inversion bug).
    categories: {
      INFRASTRUCTURE: {
        name: 'Infrastructure',
        aggregation: 'MEAN',  // PDF Table 18: ARITHMETIC AVERAGE
        weight: 0.5,
        components: {
          access_healthcare: {
            name: 'Access to Health Care',
            code: 'CC.INF.AH',
            aggregation: 'MEAN',
            indicators: ['health_expenditure_capita', 'bcg_immunization', 'dtp3_immunization',
                         'measles_immunization', 'physicians_density', 'health_facilities_density',
                         'maternal_mortality']  // PDF §3.5: MMR added in 2017
          },
          economic_capacity: {
            name: 'Economic Capacity',
            code: 'CC.INF.EC',
            aggregation: 'MEAN',
            tanzaniaExtension: true,
            indicators: ['household_income', 'international_wealth_index', 'gni_per_capita']
          },
          wash: {
            name: 'WASH',
            code: 'CC.INF.WS',
            aggregation: 'MEAN',
            tanzaniaExtension: true,  // in INFORM Core under Physical Infrastructure
            indicators: ['basic_sanitation', 'basic_drinking_water']
          },
          communication: {
            name: 'Communication',
            code: 'CC.INF.CM',
            aggregation: 'MEAN',
            indicators: ['unpaved_roads', 'access_electricity', 'internet_access', 'cellphone_ownership']
          },
          education: {
            name: 'Education',
            code: 'CC.INF.ED',
            aggregation: 'MEAN',
            indicators: ['adult_literacy', 'mean_years_school']
          }
        }
      },
      INSTITUTIONAL: {
        name: 'Institutional',
        aggregation: 'MEAN',  // PDF Table 16: ARITHMETIC AVERAGE
        weight: 0.5,
        components: {
          drr_implementation: {
            name: 'DRR Implementation',
            code: 'CC.INS.DR',
            aggregation: 'MEAN',
            // PDF Table 15: HFA self-assessment (Sendai aspirational in 2017).
            // Tanzania extends with traditional_knowledge and early_warning_system.
            indicators: ['sendai_framework', 'traditional_knowledge', 'early_warning_system']
          },
          governance: {
            name: 'Governance',
            code: 'CC.INS.GV',
            aggregation: 'MEAN',
            indicators: ['government_effectiveness', 'subnational_corruption']
          }
        }
      }
    }
  }
};

// ============================================================================
// RAW INDICATORS — ~80 indicators
// refMin/refMax: bounds for min-max normalization to 0–10 (PDF Tables 4/6/10/12/15/17).
// polarity:
//   NEGATIVE — higher raw = higher risk (most hazards, mortality rates, poverty)
//   POSITIVE — higher raw = lower risk (capacity, income, literacy, HDI, immunization)
// transform: 'none' | 'log' | 'log1p' | 'sqrt' | 'sqr'
// informCore: true if part of INFORM 2017 Core (PDF Annex 2)
// ============================================================================

function ind(id, name, dim, cat, comp, opts = {}) {
  return {
    id, name,
    dimension: dim, category: cat, component: comp,
    unit: opts.unit ?? 'index (0-10)',
    polarity: opts.polarity ?? 'NEGATIVE',
    refMin: opts.refMin ?? 0,
    refMax: opts.refMax ?? 10,
    transform: opts.transform ?? 'none',
    informCore: opts.informCore ?? false,
    tanzaniaExtension: opts.tanzaniaExtension ?? false
  };
}

export const ALL_INDICATORS = {
  // ─── HAZARD — NATURAL ────────────────────────────────────────────────────
  coastal_erosion:              ind('coastal_erosion',              'Coastal Erosion',                'HAZARD', 'NATURAL', 'coastal_hazards',         { tanzaniaExtension: true }),
  sea_level_rise:               ind('sea_level_rise',               'Sea Level Rise',                 'HAZARD', 'NATURAL', 'coastal_hazards',         { tanzaniaExtension: true }),
  historic_drought_frequency:   ind('historic_drought_frequency',   'Historic Drought Frequency',     'HAZARD', 'NATURAL', 'drought',                 { informCore: true, refMax: 0.3, unit: 'frequency 0-0.3' }),
  earthquake_exposure:          ind('earthquake_exposure',          'Earthquake Exposure',            'HAZARD', 'NATURAL', 'earthquake',              { informCore: true }),
  deforestation_treecover_loss: ind('deforestation_treecover_loss', 'Deforestation - Treecover Loss', 'HAZARD', 'NATURAL', 'environmental_degradation', { tanzaniaExtension: true }),
  soil_erosion:                 ind('soil_erosion',                 'Soil Erosion',                   'HAZARD', 'NATURAL', 'environmental_degradation', { tanzaniaExtension: true }),
  flood_exposure:               ind('flood_exposure',               'Flood Exposure',                 'HAZARD', 'NATURAL', 'flood',                   { informCore: true }),
  heatwave_exposure:            ind('heatwave_exposure',            'Heatwave Exposure',              'HAZARD', 'NATURAL', 'heatwave',                { tanzaniaExtension: true }),
  landslide_exposure:           ind('landslide_exposure',           'Landslide Exposure',             'HAZARD', 'NATURAL', 'landslide',               { tanzaniaExtension: true }),
  lightning_casualties:         ind('lightning_casualties',         'Lightning Casualties',           'HAZARD', 'NATURAL', 'lightning',               { tanzaniaExtension: true }),
  cyclone_exposure:             ind('cyclone_exposure',             'Cyclone Exposure',               'HAZARD', 'NATURAL', 'storms_cyclone',          { informCore: true }),
  storm_exposure:               ind('storm_exposure',               'Storm Exposure',                 'HAZARD', 'NATURAL', 'storms_cyclone',          { informCore: true }),
  cyclone_max_speed:            ind('cyclone_max_speed',            'Cyclone Max Speed',              'HAZARD', 'NATURAL', 'storms_cyclone',          { informCore: true }),
  volcano_exposure:             ind('volcano_exposure',             'Volcano Exposure',               'HAZARD', 'NATURAL', 'volcano',                 { tanzaniaExtension: true }),
  burned_area:                  ind('burned_area',                  'Burned Area',                    'HAZARD', 'NATURAL', 'wildfire',                { tanzaniaExtension: true }),
  fire_weather_index:           ind('fire_weather_index',           'Fire Weather Index',             'HAZARD', 'NATURAL', 'wildfire',                { tanzaniaExtension: true }),
  animal_diseases:              ind('animal_diseases',              'Animal Diseases',                'HAZARD', 'NATURAL', 'zoonoses_plants_pests',   { tanzaniaExtension: true }),
  plant_diseases:               ind('plant_diseases',               'Plant Diseases',                 'HAZARD', 'NATURAL', 'zoonoses_plants_pests',   { tanzaniaExtension: true }),
  pests:                        ind('pests',                        'Pests',                          'HAZARD', 'NATURAL', 'zoonoses_plants_pests',   { tanzaniaExtension: true }),

  // ─── HAZARD — HUMAN ──────────────────────────────────────────────────────
  // PDF Table 6: Conflict Barometer 4-5 → INFORM 8-10 (Table 9)
  conflict_barometer:           ind('conflict_barometer',           'Conflict Barometer',             'HAZARD', 'HUMAN', 'conflict_intensity',        { informCore: true, refMin: 4, refMax: 5 }),
  // PDF Table 6: GCRI VC 0-0.95 (probability)
  gcri_conflict_probability:    ind('gcri_conflict_probability',    'GCRI Conflict Probability',      'HAZARD', 'HUMAN', 'conflict_risk',             { informCore: true, refMax: 0.95, unit: 'probability' }),
  hazardous_material:           ind('hazardous_material',           'Hazardous Material',             'HAZARD', 'HUMAN', 'hazardous_material',        { tanzaniaExtension: true }),
  violence_events:              ind('violence_events',              'Violence Events',                'HAZARD', 'HUMAN', 'internal_violence',         { tanzaniaExtension: true, transform: 'log1p', refMax: 1000, unit: 'count' }),
  violence_fatalities:          ind('violence_fatalities',          'Violence Fatalities',            'HAZARD', 'HUMAN', 'internal_violence',         { tanzaniaExtension: true, transform: 'log1p', refMax: 10000, unit: 'deaths' }),
  vehicle_accidents:            ind('vehicle_accidents',            'Vehicle Accidents',              'HAZARD', 'HUMAN', 'vehicle_accidents',         { tanzaniaExtension: true }),

  // ─── VULNERABILITY — SOCIO-ECONOMIC ──────────────────────────────────────
  // PDF Table 10
  hdi:                          ind('hdi',                          'Human Development Index',        'VULNERABILITY', 'SOCIO_ECONOMIC', 'development_poverty',  { informCore: true, polarity: 'POSITIVE', refMin: 0.3, refMax: 0.95, unit: 'index 0-1' }),
  // FIX: this was mislabeled "Gender Development Index" with POSITIVE polarity.
  // PDF Annex 2 #25 specifies Gender INEQUALITY Index with NEGATIVE polarity.
  gender_inequality_index:      ind('gender_inequality_index',      'Gender Inequality Index',        'VULNERABILITY', 'SOCIO_ECONOMIC', 'development_poverty',  { informCore: true, polarity: 'NEGATIVE', refMax: 0.75, unit: 'index 0-1' }),
  multidimensional_poverty:     ind('multidimensional_poverty',     'Multidimensional Poverty Index', 'VULNERABILITY', 'SOCIO_ECONOMIC', 'development_poverty',  { informCore: true, refMin: 0.05, refMax: 0.5, unit: 'index 0-1' }),
  wealth_inequality:            ind('wealth_inequality',            'Wealth Inequality (Gini)',       'VULNERABILITY', 'SOCIO_ECONOMIC', 'development_poverty',  { informCore: true, refMin: 25, refMax: 65, unit: 'Gini index' }),
  oda_received:                 ind('oda_received',                 'Net ODA Received (% of GNI)',    'VULNERABILITY', 'SOCIO_ECONOMIC', 'economic_dependency',  { informCore: true, refMax: 15, unit: '%' }),
  personal_remittances:         ind('personal_remittances',         'Personal Remittances (% of GDP)','VULNERABILITY', 'SOCIO_ECONOMIC', 'economic_dependency',  { tanzaniaExtension: true, refMax: 30, unit: '%' }),
  dependency_ratio:             ind('dependency_ratio',             'Dependency Ratio',               'VULNERABILITY', 'SOCIO_ECONOMIC', 'economic_dependency',  { tanzaniaExtension: true, refMin: 30, refMax: 110, unit: 'ratio' }),
  informal_settlements:         ind('informal_settlements',         'Population in Informal Settlements', 'VULNERABILITY', 'SOCIO_ECONOMIC', 'habitat',          { tanzaniaExtension: true, refMax: 100, unit: '%' }),
  homes_high_risk_areas:        ind('homes_high_risk_areas',        'Homes in High-Risk Areas',       'VULNERABILITY', 'SOCIO_ECONOMIC', 'habitat',              { tanzaniaExtension: true, transform: 'log1p', refMax: 100000, unit: 'count' }),
  urban_population:             ind('urban_population',             'Urban Population',               'VULNERABILITY', 'SOCIO_ECONOMIC', 'habitat',              { tanzaniaExtension: true, refMax: 100, unit: '%' }),
  food_insufficient:            ind('food_insufficient',            'Food Insufficient',              'VULNERABILITY', 'SOCIO_ECONOMIC', 'livelihoods',          { tanzaniaExtension: true, refMax: 100, unit: '%' }),
  food_ipc_classification:      ind('food_ipc_classification',      'IPC Food Security Phase',        'VULNERABILITY', 'SOCIO_ECONOMIC', 'livelihoods',          { tanzaniaExtension: true, refMin: 1, refMax: 5, unit: 'IPC 1-5' }),

  // ─── VULNERABILITY — VULNERABLE GROUPS ───────────────────────────────────
  // PDF Table 12
  internal_displaced:           ind('internal_displaced',           'Internally Displaced People',    'VULNERABILITY', 'VULNERABLE_GROUPS', 'displaced_people',  { informCore: true, transform: 'log1p', refMin: 1000, refMax: 1000000, unit: 'count' }),
  refugees_asylum_seekers:      ind('refugees_asylum_seekers',      'Refugees & Asylum Seekers',      'VULNERABILITY', 'VULNERABLE_GROUPS', 'displaced_people',  { informCore: true, transform: 'log1p', refMin: 1000, refMax: 1000000, unit: 'count' }),
  life_expectancy:              ind('life_expectancy',              'Life Expectancy',                'VULNERABILITY', 'VULNERABLE_GROUPS', 'health_conditions', { tanzaniaExtension: true, polarity: 'POSITIVE', refMin: 40, refMax: 85, unit: 'years' }),
  cholera_cases:                ind('cholera_cases',                'Cholera Reported Cases',         'VULNERABILITY', 'VULNERABLE_GROUPS', 'health_conditions', { tanzaniaExtension: true, transform: 'log1p', refMax: 10000, unit: 'cases' }),
  malaria_mortality:            ind('malaria_mortality',            'Malaria Mortality Rate',         'VULNERABILITY', 'VULNERABLE_GROUPS', 'health_conditions', { informCore: true, refMax: 120, unit: 'per 100k' }),
  malaria_prevalence:           ind('malaria_prevalence',           'Malaria Prevalence',             'VULNERABILITY', 'VULNERABLE_GROUPS', 'health_conditions', { tanzaniaExtension: true, refMax: 100, unit: '%' }),
  measles_incidence:            ind('measles_incidence',            'Measles Incidence',              'VULNERABILITY', 'VULNERABLE_GROUPS', 'health_conditions', { tanzaniaExtension: true, refMax: 500, unit: 'per 100k' }),
  tuberculosis_incidence:       ind('tuberculosis_incidence',       'Tuberculosis Prevalence',        'VULNERABILITY', 'VULNERABLE_GROUPS', 'health_conditions', { informCore: true, refMax: 550, unit: 'per 100k' }),
  dst_prevalence:               ind('dst_prevalence',               'DST Prevalence',                 'VULNERABILITY', 'VULNERABLE_GROUPS', 'health_conditions', { tanzaniaExtension: true, refMax: 100, unit: '%' }),
  people_disabilities:          ind('people_disabilities',          'People Living with Disabilities','VULNERABILITY', 'VULNERABLE_GROUPS', 'health_conditions', { tanzaniaExtension: true, refMax: 100, unit: '%' }),
  people_chronic_illness:       ind('people_chronic_illness',       'People with Chronic Illness',    'VULNERABILITY', 'VULNERABLE_GROUPS', 'health_conditions', { tanzaniaExtension: true, refMax: 100, unit: '%' }),
  neonatal_mortality:           ind('neonatal_mortality',           'Neonatal Mortality',             'VULNERABILITY', 'VULNERABLE_GROUPS', 'children_health',   { tanzaniaExtension: true, refMax: 50, unit: 'per 1000' }),
  infant_mortality:             ind('infant_mortality',             'Infant Mortality',               'VULNERABILITY', 'VULNERABLE_GROUPS', 'children_health',   { tanzaniaExtension: true, refMax: 100, unit: 'per 1000' }),
  child_mortality:              ind('child_mortality',              'Child Mortality',                'VULNERABILITY', 'VULNERABLE_GROUPS', 'children_health',   { informCore: true, refMax: 130, unit: 'per 1000' }),
  children_underweight:         ind('children_underweight',         'Children Underweight',           'VULNERABILITY', 'VULNERABLE_GROUPS', 'children_health',   { informCore: true, refMax: 45, unit: '%' }),
  people_affected_disasters:    ind('people_affected_disasters',    'People Affected by Disasters',   'VULNERABILITY', 'VULNERABLE_GROUPS', 'economic_vulnerability', { informCore: true, refMax: 10, unit: '% of pop' }),
  unemployed_population:        ind('unemployed_population',        'Unemployed Population',          'VULNERABILITY', 'VULNERABLE_GROUPS', 'economic_vulnerability', { tanzaniaExtension: true, refMax: 50, unit: '%' }),
  female_headed_households:     ind('female_headed_households',     'Female-Headed Households',       'VULNERABILITY', 'VULNERABLE_GROUPS', 'economic_vulnerability', { tanzaniaExtension: true, refMax: 100, unit: '%' }),
  child_headed_households:      ind('child_headed_households',      'Child-Headed Households',        'VULNERABILITY', 'VULNERABLE_GROUPS', 'economic_vulnerability', { tanzaniaExtension: true, refMax: 100, unit: '%' }),

  // ─── COPING CAPACITY — INFRASTRUCTURE ────────────────────────────────────
  // PDF Table 17
  health_expenditure_capita:    ind('health_expenditure_capita',    'Health Expenditure per Capita',  'COPING_CAPACITY', 'INFRASTRUCTURE', 'access_healthcare', { informCore: true, polarity: 'POSITIVE', refMin: 50, refMax: 3000, unit: 'USD' }),
  bcg_immunization:             ind('bcg_immunization',             'BCG Immunization Coverage',      'COPING_CAPACITY', 'INFRASTRUCTURE', 'access_healthcare', { tanzaniaExtension: true, polarity: 'POSITIVE', refMin: 60, refMax: 99, unit: '%' }),
  dtp3_immunization:            ind('dtp3_immunization',            'DTP3 Immunization Coverage',     'COPING_CAPACITY', 'INFRASTRUCTURE', 'access_healthcare', { tanzaniaExtension: true, polarity: 'POSITIVE', refMin: 60, refMax: 99, unit: '%' }),
  measles_immunization:         ind('measles_immunization',         'Measles Immunization Coverage',  'COPING_CAPACITY', 'INFRASTRUCTURE', 'access_healthcare', { informCore: true, polarity: 'POSITIVE', refMin: 60, refMax: 99, unit: '%' }),
  physicians_density:           ind('physicians_density',           'Physicians Density',             'COPING_CAPACITY', 'INFRASTRUCTURE', 'access_healthcare', { informCore: true, polarity: 'POSITIVE', refMin: 0, refMax: 4, unit: 'per 10k' }),
  health_facilities_density:    ind('health_facilities_density',    'Health Facilities Density',      'COPING_CAPACITY', 'INFRASTRUCTURE', 'access_healthcare', { tanzaniaExtension: true, polarity: 'POSITIVE', refMin: 0, refMax: 10, unit: 'per 10k' }),
  maternal_mortality:           ind('maternal_mortality',           'Maternal Mortality Rate',        'COPING_CAPACITY', 'INFRASTRUCTURE', 'access_healthcare', { informCore: true, polarity: 'NEGATIVE', refMin: 0, refMax: 1000, unit: 'per 100k' }),  // PDF §3.5: added in 2017
  household_income:             ind('household_income',             'Household Income',               'COPING_CAPACITY', 'INFRASTRUCTURE', 'economic_capacity', { tanzaniaExtension: true, polarity: 'POSITIVE', refMin: 100, refMax: 10000, transform: 'log', unit: 'USD' }),
  international_wealth_index:   ind('international_wealth_index',   'International Wealth Index',     'COPING_CAPACITY', 'INFRASTRUCTURE', 'economic_capacity', { tanzaniaExtension: true, polarity: 'POSITIVE', refMin: 0, refMax: 100, unit: 'index' }),
  gni_per_capita:               ind('gni_per_capita',               'GNI per Capita',                 'COPING_CAPACITY', 'INFRASTRUCTURE', 'economic_capacity', { tanzaniaExtension: true, polarity: 'POSITIVE', refMin: 200, refMax: 100000, transform: 'log', unit: 'USD' }),
  basic_sanitation:             ind('basic_sanitation',             'Basic Sanitation Access',        'COPING_CAPACITY', 'INFRASTRUCTURE', 'wash',              { informCore: true, polarity: 'POSITIVE', refMin: 10, refMax: 100, unit: '%' }),
  basic_drinking_water:         ind('basic_drinking_water',         'Basic Drinking Water Access',    'COPING_CAPACITY', 'INFRASTRUCTURE', 'wash',              { informCore: true, polarity: 'POSITIVE', refMin: 50, refMax: 100, unit: '%' }),
  unpaved_roads:                ind('unpaved_roads',                'Unpaved Roads (% of network)',   'COPING_CAPACITY', 'INFRASTRUCTURE', 'communication',     { tanzaniaExtension: true, polarity: 'NEGATIVE', refMax: 100, unit: '%' }),
  access_electricity:           ind('access_electricity',           'Access to Electricity',          'COPING_CAPACITY', 'INFRASTRUCTURE', 'communication',     { informCore: true, polarity: 'POSITIVE', refMin: 30, refMax: 100, transform: 'sqr', unit: '%' }),
  internet_access:              ind('internet_access',              'Internet Access',                'COPING_CAPACITY', 'INFRASTRUCTURE', 'communication',     { informCore: true, polarity: 'POSITIVE', refMin: 0, refMax: 100, unit: '%' }),
  cellphone_ownership:          ind('cellphone_ownership',          'Mobile Cellular Subscriptions',  'COPING_CAPACITY', 'INFRASTRUCTURE', 'communication',     { informCore: true, polarity: 'POSITIVE', refMin: 5, refMax: 200, unit: 'per 100' }),
  adult_literacy:               ind('adult_literacy',               'Adult Literacy Rate',            'COPING_CAPACITY', 'INFRASTRUCTURE', 'communication',     { informCore: true, polarity: 'POSITIVE', refMin: 0, refMax: 100, unit: '%' }),
  mean_years_school:            ind('mean_years_school',            'Mean Years of Schooling',        'COPING_CAPACITY', 'INFRASTRUCTURE', 'education',         { tanzaniaExtension: true, polarity: 'POSITIVE', refMin: 0, refMax: 14, unit: 'years' }),

  // ─── COPING CAPACITY — INSTITUTIONAL ─────────────────────────────────────
  // PDF Table 15
  sendai_framework:             ind('sendai_framework',             'Sendai Framework / HFA Implementation', 'COPING_CAPACITY', 'INSTITUTIONAL', 'drr_implementation', { informCore: true, polarity: 'POSITIVE', refMin: 1, refMax: 5, unit: 'index 1-5' }),
  traditional_knowledge:        ind('traditional_knowledge',        'Traditional Community Knowledge',       'COPING_CAPACITY', 'INSTITUTIONAL', 'drr_implementation', { tanzaniaExtension: true, polarity: 'POSITIVE' }),
  early_warning_system:         ind('early_warning_system',         'Early Warning System',                  'COPING_CAPACITY', 'INSTITUTIONAL', 'drr_implementation', { tanzaniaExtension: true, polarity: 'POSITIVE' }),
  government_effectiveness:     ind('government_effectiveness',     'Government Effectiveness',              'COPING_CAPACITY', 'INSTITUTIONAL', 'governance',         { informCore: true, polarity: 'POSITIVE', refMin: -2.5, refMax: 2.5, unit: 'WGI index' }),
  // FIX: previously labeled NEGATIVE; the underlying TI CPI is POSITIVE
  // (higher = less corrupt). Tanzania Excel stores the inverted "corruption
  // perception" so it stays NEGATIVE; we honor the operational catalog but
  // expose the corrected polarity for the canonical TI score via the
  // `informCore` variant later.
  subnational_corruption:       ind('subnational_corruption',       'Subnational Corruption Index',          'COPING_CAPACITY', 'INSTITUTIONAL', 'governance',         { informCore: true, polarity: 'NEGATIVE', refMin: 0, refMax: 100, unit: 'CPI inverted' })
};

// ============================================================================
// COMPONENT INDEX — derived from hierarchy
// ============================================================================

export const ALL_COMPONENTS = {};
for (const [dimId, dim] of Object.entries(COMPLETE_HIERARCHY)) {
  for (const [catId, cat] of Object.entries(dim.categories)) {
    for (const [compId, comp] of Object.entries(cat.components)) {
      ALL_COMPONENTS[compId] = {
        id: compId,
        code: comp.code,
        name: comp.name,
        dimension: dimId,
        category: catId,
        aggregation: comp.aggregation,
        weight: comp.weight ?? null,
        indicators: comp.indicators,
        tanzaniaExtension: comp.tanzaniaExtension ?? false
      };
    }
  }
}

// ============================================================================
// EXCEL CODE MAPPING — Tanzania Excel template column codes ↔ internal IDs
// ============================================================================

export const EXCEL_CODE_MAP = {
  // HAZARD - NATURAL
  'HA.NAT.CH-ERO': 'coastal_erosion',
  'HA.NAT.CH-SEA': 'sea_level_rise',
  'HA.NAT.DR-FRE': 'historic_drought_frequency',
  'HA.NAT.EQ-EXP': 'earthquake_exposure',
  'HA.NAT.ED-DEF': 'deforestation_treecover_loss',
  'HA.NAT.DE-ERO': 'soil_erosion',
  'HA.NAT.FL-EXP': 'flood_exposure',
  'HA.NAT.HW-EXP': 'heatwave_exposure',
  'HA.NAT.LS-EXP': 'landslide_exposure',
  'HA.NAT.LI-CAS': 'lightning_casualties',
  'HA.NAT.ST-TC': 'cyclone_exposure',
  'HA.NAT.ST-ST': 'storm_exposure',
  'HA.NAT.ST-TC2': 'cyclone_max_speed',
  'HA.NAT.VC-EXP': 'volcano_exposure',
  'HA.NAT.WF-BURN': 'burned_area',
  'HA.NAT.WF-FWI': 'fire_weather_index',
  'HA.NAT.ZPP-AD': 'animal_diseases',
  'HA.NAT.ZPP-PD': 'plant_diseases',
  'HA.NAT.ZPP-PE': 'pests',

  // HAZARD - HUMAN
  'HA.HUM.CI-CBAR': 'conflict_barometer',
  'HA.HUM.CR-GCRI': 'gcri_conflict_probability',
  'HA.HUM.HMAT': 'hazardous_material',
  'HA.HUM.VIO-EVE': 'violence_events',
  'HA.HUM.VIO-FAT': 'violence_fatalities',
  'HA.HUM.ACC': 'vehicle_accidents',

  // VULNERABILITY - SOCIO-ECONOMIC
  'VU.SE.POV-HDI': 'hdi',
  'VU.SE.POV-GDI': 'gender_inequality_index',  // Excel column is mislabeled GDI; stores GII
  'VU.SE.POV-MPI': 'multidimensional_poverty',
  'VU.SE.POV-GINI': 'wealth_inequality',
  'VU.SE.DEP-ODA': 'oda_received',
  'VU.SE.DEP-REM': 'personal_remittances',
  'VU.SE.DEP-DR': 'dependency_ratio',
  'VU.SE.HAB-INF': 'informal_settlements',
  'VU.SE.HAB-RISK': 'homes_high_risk_areas',
  'VU.SE.HAB-URB': 'urban_population',
  'VU.SE.LV-FS': 'food_insufficient',
  'VU.SE.LV-IPC': 'food_ipc_classification',

  // VULNERABILITY - VULNERABLE GROUPS
  'VU.VG.DP-IDP': 'internal_displaced',
  'VU.VG.DP-REF': 'refugees_asylum_seekers',
  'VU.VG.HC-LEXP': 'life_expectancy',
  'VU.VG.HC-CHO': 'cholera_cases',
  'VU.VG.HC-MALAMORT': 'malaria_mortality',
  'VU.VG.HC-MALAPREV': 'malaria_prevalence',
  'VU.VG.HC-MEASLES': 'measles_incidence',
  'VU.VG.HC-TUB': 'tuberculosis_incidence',
  'VU.VG.HC-DST': 'dst_prevalence',
  'VU.VG.HC-DISAB': 'people_disabilities',
  'VU.VG.HC-CHR': 'people_chronic_illness',
  'VU.VG.CH-MORTNEO': 'neonatal_mortality',
  'VU.VG.CH-MORTINF': 'infant_mortality',
  'VU.VG.CH-MORTCH': 'child_mortality',
  'VU.VG.CH-UW': 'children_underweight',
  'VU.VG.ECO-DISAFF': 'people_affected_disasters',
  'VU.VG.ECO-UNEMP': 'unemployed_population',
  'VU.VG.ECO-FEMHH': 'female_headed_households',
  'VU.VG.ECO-CHILDHH': 'child_headed_households',

  // COPING CAPACITY - INFRASTRUCTURE
  'CC.INF.HC-EXP': 'health_expenditure_capita',
  'CC.INF.HC-BCG': 'bcg_immunization',
  'CC.INF.HC-DTP': 'dtp3_immunization',
  'CC.INF.HC-MEASLES': 'measles_immunization',
  'CC.INF.HC-PHY': 'physicians_density',
  'CC.INF.HC-FAC': 'health_facilities_density',
  'CC.INF.HC-MMR': 'maternal_mortality',
  'CC.INF.ECO-INC': 'household_income',
  'CC.INF.ECO-IWI': 'international_wealth_index',
  'CC.INF.ECO-GDP': 'gni_per_capita',
  'CC.INF.WASH-SAN': 'basic_sanitation',
  'CC.INF.WASH-WF': 'basic_drinking_water',
  'CC.INF.COM-ROAD': 'unpaved_roads',
  'CC.INF.COM-ELEC': 'access_electricity',
  'CC.INF.COM-INT': 'internet_access',
  'CC.INF.COM-PHONE': 'cellphone_ownership',
  'CC.INF.EDU-ALIT': 'adult_literacy',
  'CC.INF.EDU-YRS': 'mean_years_school',

  // COPING CAPACITY - INSTITUTIONAL
  'CC.INS.DRR-SEN': 'sendai_framework',
  'CC.INS.DRR-TCK': 'traditional_knowledge',
  'CC.INS.DRR-EWS': 'early_warning_system',
  'CC.INS.GOV-EFF': 'government_effectiveness',
  'CC.INS.GOV-SCI': 'subnational_corruption'
};

export const ID_TO_EXCEL_CODE = Object.fromEntries(
  Object.entries(EXCEL_CODE_MAP).map(([code, id]) => [id, code])
);

export function convertExcelToInternal(excelData) {
  const internal = {};
  for (const [excelCode, value] of Object.entries(excelData)) {
    const internalId = EXCEL_CODE_MAP[excelCode];
    if (internalId !== undefined) {
      internal[internalId] = { value: parseFloat(value) };
    }
  }
  return internal;
}

export function convertInternalToExcel(internalData) {
  const excel = {};
  for (const [id, data] of Object.entries(internalData)) {
    const excelCode = ID_TO_EXCEL_CODE[id];
    if (excelCode !== undefined) {
      excel[excelCode] = data?.value ?? data;
    }
  }
  return excel;
}

// ============================================================================
// RISK CLASSIFICATION THRESHOLDS
//
// Two threshold tables are exposed:
// 1. TANZANIA_THRESHOLDS — operational, sourced from TZ_INFORM_model.xlsx
//    "Thresholds" sheet (per-dimension bands derived from PDF Tables 21/22
//    tuned to Tanzania's subnational distribution).
// 2. INFORM_GLOBAL_THRESHOLDS — PDF Tables 20/21/22, for global comparison.
//
// Each table is an array per level [VeryLow, Low, Medium, High, VeryHigh]
// representing the UPPER bound of each class (exclusive); the last class
// extends to 10.
// ============================================================================

export const TANZANIA_THRESHOLDS = {
  // From TZ_INFORM_model.xlsx Thresholds sheet, columns E:G rows 2-5
  HAZARD:        [1.3, 2.0, 3.3, 4.7, 10],
  VULNERABILITY: [2.5, 3.3, 4.1, 5.0, 10],
  COPING_CAPACITY: [4.1, 5.3, 6.7, 7.7, 10],  // operational: lack-of-coping interpretation
  RISK:          [2.5, 3.4, 4.3, 5.9, 10]
};

export const INFORM_GLOBAL_THRESHOLDS = {
  // PDF Table 21 (dimensions) and Table 20 (risk)
  HAZARD:        [1.4, 2.6, 4.0, 6.0, 10],
  VULNERABILITY: [1.9, 3.2, 4.7, 6.3, 10],
  COPING_CAPACITY: [3.1, 4.6, 5.9, 7.3, 10],
  RISK:          [2.0, 3.5, 5.0, 6.5, 10]
};

export const RISK_CLASS_LABELS = [
  { label: 'Very Low',  labelSw: 'Hatari Ndogo Sana', color: '#2E7D32', level: 1 },
  { label: 'Low',       labelSw: 'Hatari Ndogo',      color: '#8BC34A', level: 2 },
  { label: 'Medium',    labelSw: 'Hatari ya Wastani', color: '#FFC107', level: 3 },
  { label: 'High',      labelSw: 'Hatari Kubwa',      color: '#FF9800', level: 4 },
  { label: 'Very High', labelSw: 'Hatari Kubwa Sana', color: '#D32F2F', level: 5 }
];

// ============================================================================
// STATISTICS
// ============================================================================

export const STATISTICS = {
  dimensions: 3,
  categories: 6,
  components: Object.keys(ALL_COMPONENTS).length,
  indicators: Object.keys(ALL_INDICATORS).length,
  informCoreIndicators: Object.values(ALL_INDICATORS).filter(i => i.informCore).length,
  tanzaniaExtensions: Object.values(ALL_INDICATORS).filter(i => i.tanzaniaExtension).length
};

export default {
  COMPLETE_HIERARCHY,
  ALL_INDICATORS,
  ALL_COMPONENTS,
  EXCEL_CODE_MAP,
  ID_TO_EXCEL_CODE,
  TANZANIA_THRESHOLDS,
  INFORM_GLOBAL_THRESHOLDS,
  RISK_CLASS_LABELS,
  STATISTICS,
  convertExcelToInternal,
  convertInternalToExcel
};
