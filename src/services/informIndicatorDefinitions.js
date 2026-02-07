/**
 * INFORM INDICATOR DEFINITIONS - COMPLETE
 *
 * Based on Tanzania - Country Model Template.xlsx (INFORM SADC 2024)
 *
 * Structure:
 * - 3 Dimensions (HAZARD, VULNERABILITY, COPING_CAPACITY)
 * - 6 Categories (2 per dimension)
 * - 32 Components
 * - 78 Raw Indicators (matching Excel template)
 *
 * Formula: Risk = (Hazard × Vulnerability × Lack_of_Coping_Capacity)^(1/3)
 * Aggregation: Scaled Geometric Mean for categories → dimensions
 */

// ============================================================================
// COMPLETE INDICATOR HIERARCHY FROM EXCEL TEMPLATE
// ============================================================================

export const COMPLETE_HIERARCHY = {
  HAZARD: {
    name: 'Hazard & Exposure',
    code: 'HA',
    color: '#ef4444',
    aggregation: 'MEAN', // Uses Scaled Geometric Mean at dimension level, AVERAGE at category level (per Excel template)
    weight: 1/3,
    categories: {
      NATURAL: {
        name: 'Natural Hazards',
        aggregation: 'MEAN', // Excel uses AVERAGE for category aggregation (=AVERAGE(G4:R4))
        weight: 0.5,
        components: {
          coastal_hazards: {
            name: 'Coastal Hazards',
            code: 'HA.NAT.CH',
            aggregation: 'MEAN', // Excel uses AVERAGEIFS which is AVERAGE
            indicators: ['coastal_erosion', 'sea_level_rise']
          },
          drought: {
            name: 'Drought',
            code: 'HA.NAT.DR',
            aggregation: 'MAX',
            indicators: ['historic_drought_frequency']
          },
          earthquake: {
            name: 'Earthquake',
            code: 'HA.NAT.EQ',
            aggregation: 'MAX',
            indicators: ['earthquake_exposure']
          },
          environmental_degradation: {
            name: 'Environmental Degradation',
            code: 'HA.NAT.ED',
            aggregation: 'MEAN',
            indicators: ['deforestation_treecover_loss', 'soil_erosion']
          },
          flood: {
            name: 'Flood',
            code: 'HA.NAT.FL',
            aggregation: 'MAX',
            indicators: ['flood_exposure']
          },
          heatwave: {
            name: 'Heatwave',
            code: 'HA.NAT.HW',
            aggregation: 'MAX',
            indicators: ['heatwave_exposure']
          },
          landslide: {
            name: 'Landslide',
            code: 'HA.NAT.LS',
            aggregation: 'MAX',
            indicators: ['landslide_exposure']
          },
          lightning: {
            name: 'Lightning',
            code: 'HA.NAT.LT',
            aggregation: 'MAX',
            indicators: ['lightning_casualties']
          },
          storms_cyclone: {
            name: 'Storms & Cyclone',
            code: 'HA.NAT.SC',
            aggregation: 'MEAN', // Excel uses AVERAGEIFS which is AVERAGE
            indicators: ['cyclone_exposure', 'storm_exposure', 'cyclone_max_speed']
          },
          volcano: {
            name: 'Volcano',
            code: 'HA.NAT.VO',
            aggregation: 'MAX',
            indicators: ['volcano_exposure']
          },
          wildfire: {
            name: 'Wildfire',
            code: 'HA.NAT.WF',
            aggregation: 'MEAN', // Excel uses AVERAGEIFS which is AVERAGE
            indicators: ['burned_area', 'fire_weather_index']
          },
          zoonoses_plants_pests: {
            name: 'Zoonoses, Plants & Pests',
            code: 'HA.NAT.ZP',
            aggregation: 'MEAN', // Excel uses AVERAGEIFS which is AVERAGE
            indicators: ['animal_diseases', 'plant_diseases', 'pests']
          }
        }
      },
      HUMAN: {
        name: 'Human Hazards',
        aggregation: 'MEAN', // Excel uses AVERAGE for category aggregation (=AVERAGE(T4:X4))
        weight: 0.5,
        components: {
          conflict_intensity: {
            name: 'Conflict Intensity',
            code: 'HA.HUM.CI',
            aggregation: 'MAX',
            indicators: ['conflict_barometer']
          },
          conflict_risk: {
            name: 'Conflict Risk',
            code: 'HA.HUM.CR',
            aggregation: 'MAX',
            indicators: ['gcri_conflict_probability']
          },
          hazardous_material: {
            name: 'Hazardous Material',
            code: 'HA.HUM.HM',
            aggregation: 'MAX',
            indicators: ['hazardous_material']
          },
          internal_violence: {
            name: 'Internal Violence',
            code: 'HA.HUM.IV',
            aggregation: 'MEAN', // Excel uses AVERAGEIFS which is AVERAGE
            indicators: ['violence_events', 'violence_fatalities']
          },
          vehicle_accidents: {
            name: 'Vehicle Accidents',
            code: 'HA.HUM.VA',
            aggregation: 'MAX',
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
    aggregation: 'MEAN',
    weight: 1/3,
    categories: {
      SOCIO_ECONOMIC: {
        name: 'Socio-Economic Vulnerability',
        aggregation: 'MEAN',
        weight: 0.5,
        components: {
          development_poverty: {
            name: 'Development & Poverty',
            code: 'VU.SE.DP',
            aggregation: 'MEAN',
            indicators: ['hdi', 'gender_development_index', 'multidimensional_poverty', 'wealth_inequality']
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
            indicators: ['informal_settlements', 'homes_high_risk_areas', 'urban_population']
          },
          livelihoods: {
            name: 'Livelihoods',
            code: 'VU.SE.LV',
            aggregation: 'MEAN',
            indicators: ['food_insufficient', 'food_ipc_classification']
          }
        }
      },
      VULNERABLE_GROUPS: {
        name: 'Vulnerable Groups',
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
            name: 'Children Health & Nutrition',
            code: 'VU.VG.CH',
            aggregation: 'MEAN',
            indicators: ['neonatal_mortality', 'infant_mortality', 'child_mortality', 'children_underweight']
          },
          economic_vulnerability: {
            name: 'Economic Vulnerability',
            code: 'VU.VG.EV',
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
    aggregation: 'MEAN',
    weight: 1/3,
    invert: true, // CC is inverted to get LCC (Lack of Coping Capacity)
    categories: {
      INFRASTRUCTURE: {
        name: 'Infrastructure',
        aggregation: 'MEAN',
        weight: 0.5,
        components: {
          access_healthcare: {
            name: 'Access to Health Care',
            code: 'CC.INF.AH',
            aggregation: 'MEAN',
            indicators: ['health_expenditure_capita', 'bcg_immunization', 'dtp3_immunization',
                        'measles_immunization', 'physicians_density', 'health_facilities_density']
          },
          economic_capacity: {
            name: 'Economic Capacity',
            code: 'CC.INF.EC',
            aggregation: 'MEAN',
            indicators: ['household_income', 'international_wealth_index', 'gni_per_capita']
          },
          wash: {
            name: 'WASH',
            code: 'CC.INF.WS',
            aggregation: 'MEAN',
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
        aggregation: 'MEAN',
        weight: 0.5,
        components: {
          drr_implementation: {
            name: 'DRR Implementation',
            code: 'CC.INS.DR',
            aggregation: 'MEAN',
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
// ALL 84 RAW INDICATORS
// ============================================================================

export const ALL_INDICATORS = {
  // HAZARD - NATURAL
  coastal_erosion: { id: 'coastal_erosion', name: 'Coastal Erosion', dimension: 'HAZARD', category: 'NATURAL', component: 'coastal_hazards', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  sea_level_rise: { id: 'sea_level_rise', name: 'Sea Level Rise', dimension: 'HAZARD', category: 'NATURAL', component: 'coastal_hazards', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  historic_drought_frequency: { id: 'historic_drought_frequency', name: 'Historic Drought Frequency', dimension: 'HAZARD', category: 'NATURAL', component: 'drought', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  earthquake_exposure: { id: 'earthquake_exposure', name: 'Earthquake Exposure', dimension: 'HAZARD', category: 'NATURAL', component: 'earthquake', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  deforestation_treecover_loss: { id: 'deforestation_treecover_loss', name: 'Deforestation - Treecover Loss', dimension: 'HAZARD', category: 'NATURAL', component: 'environmental_degradation', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  soil_erosion: { id: 'soil_erosion', name: 'Soil Erosion', dimension: 'HAZARD', category: 'NATURAL', component: 'environmental_degradation', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  flood_exposure: { id: 'flood_exposure', name: 'Flood Exposure', dimension: 'HAZARD', category: 'NATURAL', component: 'flood', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  heatwave_exposure: { id: 'heatwave_exposure', name: 'Heatwave Exposure', dimension: 'HAZARD', category: 'NATURAL', component: 'heatwave', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  landslide_exposure: { id: 'landslide_exposure', name: 'Landslide Exposure', dimension: 'HAZARD', category: 'NATURAL', component: 'landslide', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  lightning_casualties: { id: 'lightning_casualties', name: 'Lightning Casualties', dimension: 'HAZARD', category: 'NATURAL', component: 'lightning', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  cyclone_exposure: { id: 'cyclone_exposure', name: 'Cyclone Exposure', dimension: 'HAZARD', category: 'NATURAL', component: 'storms_cyclone', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  storm_exposure: { id: 'storm_exposure', name: 'Storm Exposure', dimension: 'HAZARD', category: 'NATURAL', component: 'storms_cyclone', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  cyclone_max_speed: { id: 'cyclone_max_speed', name: 'Cyclone Max Speed', dimension: 'HAZARD', category: 'NATURAL', component: 'storms_cyclone', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  volcano_exposure: { id: 'volcano_exposure', name: 'Volcano Exposure', dimension: 'HAZARD', category: 'NATURAL', component: 'volcano', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  burned_area: { id: 'burned_area', name: 'Burned Area', dimension: 'HAZARD', category: 'NATURAL', component: 'wildfire', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  fire_weather_index: { id: 'fire_weather_index', name: 'Fire Weather Index', dimension: 'HAZARD', category: 'NATURAL', component: 'wildfire', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  animal_diseases: { id: 'animal_diseases', name: 'Animal Diseases', dimension: 'HAZARD', category: 'NATURAL', component: 'zoonoses_plants_pests', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  plant_diseases: { id: 'plant_diseases', name: 'Plant Diseases', dimension: 'HAZARD', category: 'NATURAL', component: 'zoonoses_plants_pests', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  pests: { id: 'pests', name: 'Pests', dimension: 'HAZARD', category: 'NATURAL', component: 'zoonoses_plants_pests', unit: 'index (0-10)', polarity: 'NEGATIVE' },

  // HAZARD - HUMAN
  conflict_barometer: { id: 'conflict_barometer', name: 'Conflict Barometer', dimension: 'HAZARD', category: 'HUMAN', component: 'conflict_intensity', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  gcri_conflict_probability: { id: 'gcri_conflict_probability', name: 'GCRI Conflict Probability', dimension: 'HAZARD', category: 'HUMAN', component: 'conflict_risk', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  hazardous_material: { id: 'hazardous_material', name: 'Hazardous Material', dimension: 'HAZARD', category: 'HUMAN', component: 'hazardous_material', unit: 'index (0-10)', polarity: 'NEGATIVE' },
  violence_events: { id: 'violence_events', name: 'Number of Violence Events', dimension: 'HAZARD', category: 'HUMAN', component: 'internal_violence', unit: 'events', polarity: 'NEGATIVE' },
  violence_fatalities: { id: 'violence_fatalities', name: 'Violence Fatalities', dimension: 'HAZARD', category: 'HUMAN', component: 'internal_violence', unit: 'deaths', polarity: 'NEGATIVE' },
  vehicle_accidents: { id: 'vehicle_accidents', name: 'Vehicle Accidents', dimension: 'HAZARD', category: 'HUMAN', component: 'vehicle_accidents', unit: 'index (0-10)', polarity: 'NEGATIVE' },

  // VULNERABILITY - SOCIO-ECONOMIC
  hdi: { id: 'hdi', name: 'Human Development Index', dimension: 'VULNERABILITY', category: 'SOCIO_ECONOMIC', component: 'development_poverty', unit: 'index (0-1)', polarity: 'POSITIVE' },
  gender_development_index: { id: 'gender_development_index', name: 'Gender Development Index', dimension: 'VULNERABILITY', category: 'SOCIO_ECONOMIC', component: 'development_poverty', unit: 'index (0-1)', polarity: 'POSITIVE' },
  multidimensional_poverty: { id: 'multidimensional_poverty', name: 'Multidimensional Poverty Index', dimension: 'VULNERABILITY', category: 'SOCIO_ECONOMIC', component: 'development_poverty', unit: 'index (0-1)', polarity: 'NEGATIVE' },
  wealth_inequality: { id: 'wealth_inequality', name: 'Wealth Inequality', dimension: 'VULNERABILITY', category: 'SOCIO_ECONOMIC', component: 'development_poverty', unit: 'Gini coefficient', polarity: 'NEGATIVE' },
  oda_received: { id: 'oda_received', name: 'Net ODA Received (% of GNI)', dimension: 'VULNERABILITY', category: 'SOCIO_ECONOMIC', component: 'economic_dependency', unit: '%', polarity: 'NEGATIVE' },
  personal_remittances: { id: 'personal_remittances', name: 'Personal Remittances', dimension: 'VULNERABILITY', category: 'SOCIO_ECONOMIC', component: 'economic_dependency', unit: '% of GDP', polarity: 'NEGATIVE' },
  dependency_ratio: { id: 'dependency_ratio', name: 'Dependency Ratio', dimension: 'VULNERABILITY', category: 'SOCIO_ECONOMIC', component: 'economic_dependency', unit: 'ratio', polarity: 'NEGATIVE' },
  informal_settlements: { id: 'informal_settlements', name: 'Population in Informal Settlements', dimension: 'VULNERABILITY', category: 'SOCIO_ECONOMIC', component: 'habitat', unit: '%', polarity: 'NEGATIVE' },
  homes_high_risk_areas: { id: 'homes_high_risk_areas', name: 'Homes in High-Risk Areas', dimension: 'VULNERABILITY', category: 'SOCIO_ECONOMIC', component: 'habitat', unit: 'count', polarity: 'NEGATIVE' },
  urban_population: { id: 'urban_population', name: 'Urban Population', dimension: 'VULNERABILITY', category: 'SOCIO_ECONOMIC', component: 'habitat', unit: '%', polarity: 'NEGATIVE' },
  food_insufficient: { id: 'food_insufficient', name: 'Food Security - Insufficient Food', dimension: 'VULNERABILITY', category: 'SOCIO_ECONOMIC', component: 'livelihoods', unit: '%', polarity: 'NEGATIVE' },
  food_ipc_classification: { id: 'food_ipc_classification', name: 'Food Security - IPC Classification', dimension: 'VULNERABILITY', category: 'SOCIO_ECONOMIC', component: 'livelihoods', unit: 'IPC phase', polarity: 'NEGATIVE' },

  // VULNERABILITY - VULNERABLE GROUPS
  internal_displaced: { id: 'internal_displaced', name: 'Internal Displaced People', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'displaced_people', unit: 'count', polarity: 'NEGATIVE' },
  refugees_asylum_seekers: { id: 'refugees_asylum_seekers', name: 'Refugees and Asylum Seekers', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'displaced_people', unit: 'count', polarity: 'NEGATIVE' },
  life_expectancy: { id: 'life_expectancy', name: 'Life Expectancy', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'health_conditions', unit: 'years', polarity: 'POSITIVE' },
  cholera_cases: { id: 'cholera_cases', name: 'Cholera Reported Cases', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'health_conditions', unit: 'cases', polarity: 'NEGATIVE' },
  malaria_mortality: { id: 'malaria_mortality', name: 'Malaria Mortality Rate', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'health_conditions', unit: 'per 100,000', polarity: 'NEGATIVE' },
  malaria_prevalence: { id: 'malaria_prevalence', name: 'Malaria Prevalence', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'health_conditions', unit: '%', polarity: 'NEGATIVE' },
  measles_incidence: { id: 'measles_incidence', name: 'Measles Incidence', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'health_conditions', unit: 'per 100,000', polarity: 'NEGATIVE' },
  tuberculosis_incidence: { id: 'tuberculosis_incidence', name: 'Tuberculosis Incidence', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'health_conditions', unit: 'per 100,000', polarity: 'NEGATIVE' },
  dst_prevalence: { id: 'dst_prevalence', name: 'DST Prevalence', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'health_conditions', unit: '%', polarity: 'NEGATIVE' },
  people_disabilities: { id: 'people_disabilities', name: 'People Living with Disabilities', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'health_conditions', unit: '%', polarity: 'NEGATIVE' },
  people_chronic_illness: { id: 'people_chronic_illness', name: 'People with Chronic Illness', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'health_conditions', unit: '%', polarity: 'NEGATIVE' },
  neonatal_mortality: { id: 'neonatal_mortality', name: 'Neonatal Mortality', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'children_health', unit: 'per 1,000', polarity: 'NEGATIVE' },
  infant_mortality: { id: 'infant_mortality', name: 'Infant Mortality', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'children_health', unit: 'per 1,000', polarity: 'NEGATIVE' },
  child_mortality: { id: 'child_mortality', name: 'Child Mortality', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'children_health', unit: 'per 1,000', polarity: 'NEGATIVE' },
  children_underweight: { id: 'children_underweight', name: 'Children Underweight', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'children_health', unit: '%', polarity: 'NEGATIVE' },
  people_affected_disasters: { id: 'people_affected_disasters', name: 'People Affected by Disasters', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'economic_vulnerability', unit: 'count', polarity: 'NEGATIVE' },
  unemployed_population: { id: 'unemployed_population', name: 'Unemployed Population (15-59)', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'economic_vulnerability', unit: '%', polarity: 'NEGATIVE' },
  female_headed_households: { id: 'female_headed_households', name: 'Female Headed Households', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'economic_vulnerability', unit: '%', polarity: 'NEGATIVE' },
  child_headed_households: { id: 'child_headed_households', name: 'Child Headed Households', dimension: 'VULNERABILITY', category: 'VULNERABLE_GROUPS', component: 'economic_vulnerability', unit: '%', polarity: 'NEGATIVE' },

  // COPING CAPACITY - INFRASTRUCTURE
  health_expenditure_capita: { id: 'health_expenditure_capita', name: 'Health Expenditure per Capita', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'access_healthcare', unit: 'USD', polarity: 'POSITIVE' },
  bcg_immunization: { id: 'bcg_immunization', name: 'BCG Immunization Coverage', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'access_healthcare', unit: '%', polarity: 'POSITIVE' },
  dtp3_immunization: { id: 'dtp3_immunization', name: 'DTP3 Immunization Coverage', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'access_healthcare', unit: '%', polarity: 'POSITIVE' },
  measles_immunization: { id: 'measles_immunization', name: 'Measles Immunization Coverage', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'access_healthcare', unit: '%', polarity: 'POSITIVE' },
  physicians_density: { id: 'physicians_density', name: 'Physicians Density', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'access_healthcare', unit: 'per 10,000', polarity: 'POSITIVE' },
  health_facilities_density: { id: 'health_facilities_density', name: 'Health Facilities Density', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'access_healthcare', unit: 'per 10,000', polarity: 'POSITIVE' },
  household_income: { id: 'household_income', name: 'Household Income', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'economic_capacity', unit: 'USD', polarity: 'POSITIVE' },
  international_wealth_index: { id: 'international_wealth_index', name: 'International Wealth Index', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'economic_capacity', unit: 'index', polarity: 'POSITIVE' },
  gni_per_capita: { id: 'gni_per_capita', name: 'GNI per Capita', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'economic_capacity', unit: 'USD', polarity: 'POSITIVE' },
  basic_sanitation: { id: 'basic_sanitation', name: 'Basic Sanitation Access', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'wash', unit: '%', polarity: 'POSITIVE' },
  basic_drinking_water: { id: 'basic_drinking_water', name: 'Basic Drinking Water Access', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'wash', unit: '%', polarity: 'POSITIVE' },
  unpaved_roads: { id: 'unpaved_roads', name: 'Percentage of Unpaved Roads', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'communication', unit: '%', polarity: 'NEGATIVE' },
  access_electricity: { id: 'access_electricity', name: 'Access to Electricity', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'communication', unit: '%', polarity: 'POSITIVE' },
  internet_access: { id: 'internet_access', name: 'Internet Access', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'communication', unit: '%', polarity: 'POSITIVE' },
  cellphone_ownership: { id: 'cellphone_ownership', name: 'Cellphone Ownership', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'communication', unit: '%', polarity: 'POSITIVE' },
  adult_literacy: { id: 'adult_literacy', name: 'Adult Literacy Rate', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'education', unit: '%', polarity: 'POSITIVE' },
  mean_years_school: { id: 'mean_years_school', name: 'Mean Years at School', dimension: 'COPING_CAPACITY', category: 'INFRASTRUCTURE', component: 'education', unit: 'years', polarity: 'POSITIVE' },

  // COPING CAPACITY - INSTITUTIONAL
  sendai_framework: { id: 'sendai_framework', name: 'Sendai Framework Implementation', dimension: 'COPING_CAPACITY', category: 'INSTITUTIONAL', component: 'drr_implementation', unit: 'index (0-10)', polarity: 'POSITIVE' },
  traditional_knowledge: { id: 'traditional_knowledge', name: 'Traditional Community Knowledge', dimension: 'COPING_CAPACITY', category: 'INSTITUTIONAL', component: 'drr_implementation', unit: 'index (0-10)', polarity: 'POSITIVE' },
  early_warning_system: { id: 'early_warning_system', name: 'Early Warning System', dimension: 'COPING_CAPACITY', category: 'INSTITUTIONAL', component: 'drr_implementation', unit: 'index (0-10)', polarity: 'POSITIVE' },
  government_effectiveness: { id: 'government_effectiveness', name: 'Government Effectiveness', dimension: 'COPING_CAPACITY', category: 'INSTITUTIONAL', component: 'governance', unit: 'index (-2.5 to 2.5)', polarity: 'POSITIVE' },
  subnational_corruption: { id: 'subnational_corruption', name: 'Subnational Corruption Index', dimension: 'COPING_CAPACITY', category: 'INSTITUTIONAL', component: 'governance', unit: 'index (0-10)', polarity: 'NEGATIVE' }
};

// ============================================================================
// COMPONENT DEFINITIONS (32 components)
// ============================================================================

export const ALL_COMPONENTS = {};

// Build components from hierarchy
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
        indicators: comp.indicators
      };
    }
  }
}

// ============================================================================
// EXCEL CODE MAPPING (for import/export with Tanzania Country Model Template)
// Maps Excel codes (e.g., HA.NAT.FL-EXP) to internal IDs (e.g., flood_exposure)
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
  'VU.SE.POV-GDI': 'gender_development_index',
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

// Reverse mapping: internal ID → Excel code
export const ID_TO_EXCEL_CODE = Object.fromEntries(
  Object.entries(EXCEL_CODE_MAP).map(([code, id]) => [id, code])
);

/**
 * Convert Excel indicator data to internal format
 */
export function convertExcelToInternal(excelData) {
  const internal = {};
  for (const [excelCode, value] of Object.entries(excelData)) {
    const internalId = EXCEL_CODE_MAP[excelCode];
    if (internalId) {
      internal[internalId] = { value: parseFloat(value) };
    }
  }
  return internal;
}

/**
 * Convert internal indicator data to Excel format
 */
export function convertInternalToExcel(internalData) {
  const excel = {};
  for (const [id, data] of Object.entries(internalData)) {
    const excelCode = ID_TO_EXCEL_CODE[id];
    if (excelCode) {
      excel[excelCode] = data?.value ?? data;
    }
  }
  return excel;
}

// ============================================================================
// STATISTICS
// ============================================================================

export const STATISTICS = {
  dimensions: 3,
  categories: 6,
  components: Object.keys(ALL_COMPONENTS).length,
  indicators: Object.keys(ALL_INDICATORS).length
};

console.log(`📊 INFORM Tanzania: ${STATISTICS.dimensions} Dimensions, ${STATISTICS.categories} Categories, ${STATISTICS.components} Components, ${STATISTICS.indicators} Indicators`);

export default {
  COMPLETE_HIERARCHY,
  ALL_INDICATORS,
  ALL_COMPONENTS,
  STATISTICS,
  EXCEL_CODE_MAP,
  ID_TO_EXCEL_CODE,
  convertExcelToInternal,
  convertInternalToExcel
};
