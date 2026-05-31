/**
 * TANZANIA INFORM DATABASE SEED DATA
 *
 * Comprehensive seed data for Tanzania administrative units,
 * risk indicators, population data, and infrastructure.
 *
 * Based on:
 * - Tanzania Country Model Template.xlsx
 * - 2022 Population and Housing Census
 * - INFORM Risk Index 2024
 */

// ============================================================================
// TANZANIA ADMINISTRATIVE UNITS
// ============================================================================

export const TANZANIA_REGIONS = [
  { adm1_name: 'Arusha', adm1_code: 'TZ01', population: 2356255, area_km2: 34526, centroid_lat: -3.3869, centroid_lng: 36.6833 },
  { adm1_name: 'Dar es Salaam', adm1_code: 'TZ02', population: 5383728, area_km2: 1393, centroid_lat: -6.7924, centroid_lng: 39.2083 },
  { adm1_name: 'Dodoma', adm1_code: 'TZ03', population: 2083588, area_km2: 41311, centroid_lat: -6.1722, centroid_lng: 35.7500 },
  { adm1_name: 'Geita', adm1_code: 'TZ04', population: 1945912, area_km2: 20054, centroid_lat: -2.8712, centroid_lng: 32.2306 },
  { adm1_name: 'Iringa', adm1_code: 'TZ05', population: 1192728, area_km2: 35743, centroid_lat: -7.7667, centroid_lng: 35.7000 },
  { adm1_name: 'Kagera', adm1_code: 'TZ06', population: 2989299, area_km2: 25265, centroid_lat: -1.5000, centroid_lng: 31.5000 },
  { adm1_name: 'Katavi', adm1_code: 'TZ07', population: 564604, area_km2: 45843, centroid_lat: -6.4167, centroid_lng: 31.2500 },
  { adm1_name: 'Kigoma', adm1_code: 'TZ08', population: 2470967, area_km2: 37040, centroid_lat: -4.8769, centroid_lng: 29.6269 },
  { adm1_name: 'Kilimanjaro', adm1_code: 'TZ09', population: 1861934, area_km2: 13250, centroid_lat: -3.3333, centroid_lng: 37.3333 },
  { adm1_name: 'Lindi', adm1_code: 'TZ10', population: 907161, area_km2: 66046, centroid_lat: -9.8000, centroid_lng: 39.7167 },
  { adm1_name: 'Manyara', adm1_code: 'TZ11', population: 1892502, area_km2: 44522, centroid_lat: -4.5000, centroid_lng: 36.0000 },
  { adm1_name: 'Mara', adm1_code: 'TZ12', population: 2372015, area_km2: 21760, centroid_lat: -1.7500, centroid_lng: 34.0000 },
  { adm1_name: 'Mbeya', adm1_code: 'TZ13', population: 2343754, area_km2: 35954, centroid_lat: -8.9000, centroid_lng: 33.4333 },
  { adm1_name: 'Morogoro', adm1_code: 'TZ14', population: 2218492, area_km2: 70624, centroid_lat: -6.8167, centroid_lng: 37.6667 },
  { adm1_name: 'Mtwara', adm1_code: 'TZ15', population: 1320018, area_km2: 16707, centroid_lat: -10.2667, centroid_lng: 40.1833 },
  { adm1_name: 'Mwanza', adm1_code: 'TZ16', population: 3112283, area_km2: 9467, centroid_lat: -2.5167, centroid_lng: 32.9000 },
  { adm1_name: 'Njombe', adm1_code: 'TZ17', population: 838782, area_km2: 21347, centroid_lat: -9.3333, centroid_lng: 34.7667 },
  { adm1_name: 'Pemba North', adm1_code: 'TZ18', population: 118957, area_km2: 574, centroid_lat: -5.0333, centroid_lng: 39.7667 },
  { adm1_name: 'Pemba South', adm1_code: 'TZ19', population: 176153, area_km2: 332, centroid_lat: -5.2500, centroid_lng: 39.7500 },
  { adm1_name: 'Pwani', adm1_code: 'TZ20', population: 1098668, area_km2: 32547, centroid_lat: -7.3333, centroid_lng: 38.8333 },
  { adm1_name: 'Rukwa', adm1_code: 'TZ21', population: 1540519, area_km2: 22792, centroid_lat: -7.9333, centroid_lng: 31.4333 },
  { adm1_name: 'Ruvuma', adm1_code: 'TZ22', population: 1376891, area_km2: 63669, centroid_lat: -10.5000, centroid_lng: 36.0000 },
  { adm1_name: 'Shinyanga', adm1_code: 'TZ23', population: 1932952, area_km2: 18901, centroid_lat: -3.6667, centroid_lng: 33.4167 },
  { adm1_name: 'Simiyu', adm1_code: 'TZ24', population: 2120108, area_km2: 23807, centroid_lat: -3.0000, centroid_lng: 34.2000 },
  { adm1_name: 'Singida', adm1_code: 'TZ25', population: 1512636, area_km2: 49340, centroid_lat: -4.8167, centroid_lng: 34.7500 },
  { adm1_name: 'Songwe', adm1_code: 'TZ26', population: 998862, area_km2: 13180, centroid_lat: -8.6667, centroid_lng: 32.6667 },
  { adm1_name: 'Tabora', adm1_code: 'TZ27', population: 2291623, area_km2: 76150, centroid_lat: -5.0167, centroid_lng: 32.8000 },
  { adm1_name: 'Tanga', adm1_code: 'TZ28', population: 2229655, area_km2: 26808, centroid_lat: -5.0667, centroid_lng: 39.1000 },
  { adm1_name: 'Zanzibar North', adm1_code: 'TZ29', population: 204990, area_km2: 470, centroid_lat: -5.9333, centroid_lng: 39.2833 },
  { adm1_name: 'Zanzibar South', adm1_code: 'TZ30', population: 175502, area_km2: 854, centroid_lat: -6.2500, centroid_lng: 39.4333 },
  { adm1_name: 'Zanzibar Urban West', adm1_code: 'TZ31', population: 593678, area_km2: 230, centroid_lat: -6.1600, centroid_lng: 39.1900 }
];

// Sample districts (comprehensive list would include all 184 districts)
export const TANZANIA_DISTRICTS = [
  // Arusha Region
  { adm1_name: 'Arusha', adm2_name: 'Arusha City', adm2_code: 'TZ0101', population: 416442, area_km2: 93 },
  { adm1_name: 'Arusha', adm2_name: 'Arusha Rural', adm2_code: 'TZ0102', population: 323198, area_km2: 1447 },
  { adm1_name: 'Arusha', adm2_name: 'Karatu', adm2_code: 'TZ0103', population: 230166, area_km2: 3302 },
  { adm1_name: 'Arusha', adm2_name: 'Longido', adm2_code: 'TZ0104', population: 123153, area_km2: 7782 },
  { adm1_name: 'Arusha', adm2_name: 'Meru', adm2_code: 'TZ0105', population: 268144, area_km2: 1325 },
  { adm1_name: 'Arusha', adm2_name: 'Monduli', adm2_code: 'TZ0106', population: 158929, area_km2: 6419 },
  { adm1_name: 'Arusha', adm2_name: 'Ngorongoro', adm2_code: 'TZ0107', population: 174587, area_km2: 14036 },

  // Dar es Salaam Region
  { adm1_name: 'Dar es Salaam', adm2_name: 'Ilala', adm2_code: 'TZ0201', population: 1220611, area_km2: 210 },
  { adm1_name: 'Dar es Salaam', adm2_name: 'Kinondoni', adm2_code: 'TZ0202', population: 1775049, area_km2: 531 },
  { adm1_name: 'Dar es Salaam', adm2_name: 'Temeke', adm2_code: 'TZ0203', population: 1368881, area_km2: 656 },
  { adm1_name: 'Dar es Salaam', adm2_name: 'Kigamboni', adm2_code: 'TZ0204', population: 500000, area_km2: 400 },
  { adm1_name: 'Dar es Salaam', adm2_name: 'Ubungo', adm2_code: 'TZ0205', population: 519187, area_km2: 260 },

  // Dodoma Region
  { adm1_name: 'Dodoma', adm2_name: 'Bahi', adm2_code: 'TZ0301', population: 221645, area_km2: 5948 },
  { adm1_name: 'Dodoma', adm2_name: 'Chamwino', adm2_code: 'TZ0302', population: 330543, area_km2: 8076 },
  { adm1_name: 'Dodoma', adm2_name: 'Chemba', adm2_code: 'TZ0303', population: 235711, area_km2: 7652 },
  { adm1_name: 'Dodoma', adm2_name: 'Dodoma Urban', adm2_code: 'TZ0304', population: 410956, area_km2: 2576 },
  { adm1_name: 'Dodoma', adm2_name: 'Kondoa', adm2_code: 'TZ0305', population: 269704, area_km2: 13210 },
  { adm1_name: 'Dodoma', adm2_name: 'Kongwa', adm2_code: 'TZ0306', population: 309973, area_km2: 4041 },
  { adm1_name: 'Dodoma', adm2_name: 'Mpwapwa', adm2_code: 'TZ0307', population: 305056, area_km2: 7479 },

  // Kilimanjaro Region
  { adm1_name: 'Kilimanjaro', adm2_name: 'Hai', adm2_code: 'TZ0901', population: 210533, area_km2: 2112 },
  { adm1_name: 'Kilimanjaro', adm2_name: 'Moshi Municipal', adm2_code: 'TZ0902', population: 184292, area_km2: 59 },
  { adm1_name: 'Kilimanjaro', adm2_name: 'Moshi Rural', adm2_code: 'TZ0903', population: 466737, area_km2: 1713 },
  { adm1_name: 'Kilimanjaro', adm2_name: 'Mwanga', adm2_code: 'TZ0904', population: 131442, area_km2: 2502 },
  { adm1_name: 'Kilimanjaro', adm2_name: 'Rombo', adm2_code: 'TZ0905', population: 260963, area_km2: 1414 },
  { adm1_name: 'Kilimanjaro', adm2_name: 'Same', adm2_code: 'TZ0906', population: 269807, area_km2: 5186 },
  { adm1_name: 'Kilimanjaro', adm2_name: 'Siha', adm2_code: 'TZ0907', population: 116160, area_km2: 1264 },

  // Morogoro Region
  { adm1_name: 'Morogoro', adm2_name: 'Gairo', adm2_code: 'TZ1401', population: 193717, area_km2: 2896 },
  { adm1_name: 'Morogoro', adm2_name: 'Kilombero', adm2_code: 'TZ1402', population: 407880, area_km2: 14018 },
  { adm1_name: 'Morogoro', adm2_name: 'Kilosa', adm2_code: 'TZ1403', population: 438175, area_km2: 14245 },
  { adm1_name: 'Morogoro', adm2_name: 'Morogoro Municipal', adm2_code: 'TZ1404', population: 315866, area_km2: 260 },
  { adm1_name: 'Morogoro', adm2_name: 'Morogoro Rural', adm2_code: 'TZ1405', population: 286248, area_km2: 11925 },
  { adm1_name: 'Morogoro', adm2_name: 'Mvomero', adm2_code: 'TZ1406', population: 312109, area_km2: 7325 },
  { adm1_name: 'Morogoro', adm2_name: 'Ulanga', adm2_code: 'TZ1407', population: 265203, area_km2: 18832 },

  // Tanga Region
  { adm1_name: 'Tanga', adm2_name: 'Handeni', adm2_code: 'TZ2801', population: 276646, area_km2: 7080 },
  { adm1_name: 'Tanga', adm2_name: 'Kilindi', adm2_code: 'TZ2802', population: 236833, area_km2: 6439 },
  { adm1_name: 'Tanga', adm2_name: 'Korogwe', adm2_code: 'TZ2803', population: 242038, area_km2: 3756 },
  { adm1_name: 'Tanga', adm2_name: 'Lushoto', adm2_code: 'TZ2804', population: 492441, area_km2: 3500 },
  { adm1_name: 'Tanga', adm2_name: 'Mkinga', adm2_code: 'TZ2805', population: 118065, area_km2: 2749 },
  { adm1_name: 'Tanga', adm2_name: 'Muheza', adm2_code: 'TZ2806', population: 204461, area_km2: 4922 },
  { adm1_name: 'Tanga', adm2_name: 'Pangani', adm2_code: 'TZ2807', population: 54025, area_km2: 1830 },
  { adm1_name: 'Tanga', adm2_name: 'Tanga City', adm2_code: 'TZ2808', population: 273332, area_km2: 536 },

  // Mwanza Region
  { adm1_name: 'Mwanza', adm2_name: 'Ilemela', adm2_code: 'TZ1601', population: 343001, area_km2: 247 },
  { adm1_name: 'Mwanza', adm2_name: 'Kwimba', adm2_code: 'TZ1602', population: 489073, area_km2: 3903 },
  { adm1_name: 'Mwanza', adm2_name: 'Magu', adm2_code: 'TZ1603', population: 299759, area_km2: 3070 },
  { adm1_name: 'Mwanza', adm2_name: 'Misungwi', adm2_code: 'TZ1604', population: 351607, area_km2: 1947 },
  { adm1_name: 'Mwanza', adm2_name: 'Nyamagana', adm2_code: 'TZ1605', population: 363452, area_km2: 256 },
  { adm1_name: 'Mwanza', adm2_name: 'Sengerema', adm2_code: 'TZ1606', population: 663034, area_km2: 8817 },
  { adm1_name: 'Mwanza', adm2_name: 'Ukerewe', adm2_code: 'TZ1607', population: 345147, area_km2: 640 },

  // Pwani Region
  { adm1_name: 'Pwani', adm2_name: 'Bagamoyo', adm2_code: 'TZ2001', population: 311740, area_km2: 9842 },
  { adm1_name: 'Pwani', adm2_name: 'Kibaha Urban', adm2_code: 'TZ2002', population: 128488, area_km2: 743 },
  { adm1_name: 'Pwani', adm2_name: 'Kibaha Rural', adm2_code: 'TZ2003', population: 100793, area_km2: 1812 },
  { adm1_name: 'Pwani', adm2_name: 'Kisarawe', adm2_code: 'TZ2004', population: 101598, area_km2: 4464 },
  { adm1_name: 'Pwani', adm2_name: 'Mafia', adm2_code: 'TZ2005', population: 46438, area_km2: 518 },
  { adm1_name: 'Pwani', adm2_name: 'Mkuranga', adm2_code: 'TZ2006', population: 222921, area_km2: 2432 },
  { adm1_name: 'Pwani', adm2_name: 'Rufiji', adm2_code: 'TZ2007', population: 217274, area_km2: 13339 },

  // Lindi Region
  { adm1_name: 'Lindi', adm2_name: 'Kilwa', adm2_code: 'TZ1001', population: 190744, area_km2: 13920 },
  { adm1_name: 'Lindi', adm2_name: 'Lindi Municipal', adm2_code: 'TZ1002', population: 41549, area_km2: 547 },
  { adm1_name: 'Lindi', adm2_name: 'Lindi Rural', adm2_code: 'TZ1003', population: 194143, area_km2: 7538 },
  { adm1_name: 'Lindi', adm2_name: 'Liwale', adm2_code: 'TZ1004', population: 91380, area_km2: 36084 },
  { adm1_name: 'Lindi', adm2_name: 'Nachingwea', adm2_code: 'TZ1005', population: 178464, area_km2: 7070 },
  { adm1_name: 'Lindi', adm2_name: 'Ruangwa', adm2_code: 'TZ1006', population: 130881, area_km2: 2086 },

  // Mtwara Region
  { adm1_name: 'Mtwara', adm2_name: 'Masasi', adm2_code: 'TZ1501', population: 246840, area_km2: 8971 },
  { adm1_name: 'Mtwara', adm2_name: 'Mtwara Municipal', adm2_code: 'TZ1502', population: 108299, area_km2: 163 },
  { adm1_name: 'Mtwara', adm2_name: 'Mtwara Rural', adm2_code: 'TZ1503', population: 228003, area_km2: 3597 },
  { adm1_name: 'Mtwara', adm2_name: 'Nanyumbu', adm2_code: 'TZ1504', population: 151855, area_km2: 3919 },
  { adm1_name: 'Mtwara', adm2_name: 'Newala', adm2_code: 'TZ1505', population: 205492, area_km2: 2126 },
  { adm1_name: 'Mtwara', adm2_name: 'Tandahimba', adm2_code: 'TZ1506', population: 227529, area_km2: 1879 }
];

// ============================================================================
// INFORM RISK INDICATORS (National Level - 2024)
// ============================================================================

export const TANZANIA_NATIONAL_RISK = {
  year: 2024,

  // HAZARD AND EXPOSURE
  coastal_hazards: 0,
  drought: 4.3,
  earthquake: 9.35,
  environmental_degradation: 4.35,
  flood: 3.9,
  heatwave: null,
  landslide: 5.4,
  lightning: null,
  storms_cyclone: 0,
  volcano: 0,
  wildfire: 4.75,
  zoonoses: null,
  natural_hazard_aggregate: 3.544,

  conflict_intensity: 0,
  conflict_risk: 0.7,
  hazardous_material: null,
  internal_violence: 1.35,
  vehicle_accidents: null,
  human_hazard_aggregate: 0.683,

  hazard_exposure_total: 2.2,

  // VULNERABILITY
  development_poverty: 7.7,
  economic_dependency: 3.97,
  habitat: 4.9,
  livelihoods: 10,
  socio_economic_aggregate: 6.64,

  displaced_people: 0,
  health_conditions: 4.53,
  children_health_nutrition: 7.5,
  economic_vulnerability: null,
  vulnerable_groups_aggregate: 4.01,

  vulnerability_total: 5.5,

  // LACK OF COPING CAPACITY
  access_health: 3.96,
  economic_capacity: 9.87,
  wash: 7.0,
  communication: 4.45,
  education: 6.3,
  infrastructure_aggregate: 6.32,

  drr_implementation: 6.5,
  governance: 4.45,
  institutional_aggregate: 5.48,

  lack_coping_capacity_total: 5.9,

  // FINAL RISK
  risk_index: 4.2,
  risk_class: 'Medium',

  // Metadata
  data_source: 'Tanzania Country Model Template 2024',
  data_quality: 'High'
};

// ============================================================================
// SAMPLE DISTRICT RISK DATA
// ============================================================================

export const DISTRICT_RISK_SAMPLES = [
  // Dar es Salaam - Lower risk (urban, better coping capacity)
  { adm2_name: 'Ilala', risk_index: 3.2, hazard_exposure_total: 2.5, vulnerability_total: 4.0, lack_coping_capacity_total: 4.5 },
  { adm2_name: 'Kinondoni', risk_index: 3.3, hazard_exposure_total: 2.6, vulnerability_total: 4.1, lack_coping_capacity_total: 4.4 },
  { adm2_name: 'Temeke', risk_index: 3.5, hazard_exposure_total: 2.8, vulnerability_total: 4.3, lack_coping_capacity_total: 4.6 },

  // Arusha - Medium risk
  { adm2_name: 'Arusha City', risk_index: 3.8, hazard_exposure_total: 3.0, vulnerability_total: 4.5, lack_coping_capacity_total: 5.0 },
  { adm2_name: 'Karatu', risk_index: 4.0, hazard_exposure_total: 3.5, vulnerability_total: 5.0, lack_coping_capacity_total: 5.2 },
  { adm2_name: 'Longido', risk_index: 4.5, hazard_exposure_total: 4.0, vulnerability_total: 5.5, lack_coping_capacity_total: 5.8 },

  // Dodoma - Medium-High risk
  { adm2_name: 'Dodoma Urban', risk_index: 4.0, hazard_exposure_total: 3.2, vulnerability_total: 5.2, lack_coping_capacity_total: 5.5 },
  { adm2_name: 'Kondoa', risk_index: 4.1, hazard_exposure_total: 3.5, vulnerability_total: 5.3, lack_coping_capacity_total: 5.6 },
  { adm2_name: 'Mpwapwa', risk_index: 4.2, hazard_exposure_total: 3.6, vulnerability_total: 5.4, lack_coping_capacity_total: 5.7 },
  { adm2_name: 'Chamwino', risk_index: 4.3, hazard_exposure_total: 3.7, vulnerability_total: 5.5, lack_coping_capacity_total: 5.8 },

  // Kilimanjaro - Lower risk (better development)
  { adm2_name: 'Moshi Municipal', risk_index: 3.5, hazard_exposure_total: 3.0, vulnerability_total: 4.0, lack_coping_capacity_total: 4.5 },
  { adm2_name: 'Moshi Rural', risk_index: 3.9, hazard_exposure_total: 3.5, vulnerability_total: 4.5, lack_coping_capacity_total: 5.0 },
  { adm2_name: 'Hai', risk_index: 3.7, hazard_exposure_total: 3.2, vulnerability_total: 4.2, lack_coping_capacity_total: 4.8 },

  // Tanga - Medium risk (coastal + inland)
  { adm2_name: 'Tanga City', risk_index: 4.1, hazard_exposure_total: 3.8, vulnerability_total: 5.0, lack_coping_capacity_total: 5.3 },
  { adm2_name: 'Muheza', risk_index: 4.4, hazard_exposure_total: 4.0, vulnerability_total: 5.3, lack_coping_capacity_total: 5.6 },
  { adm2_name: 'Korogwe', risk_index: 4.3, hazard_exposure_total: 3.9, vulnerability_total: 5.2, lack_coping_capacity_total: 5.5 },

  // Morogoro - Medium-High risk (flood prone)
  { adm2_name: 'Morogoro Municipal', risk_index: 4.0, hazard_exposure_total: 3.5, vulnerability_total: 5.0, lack_coping_capacity_total: 5.3 },
  { adm2_name: 'Morogoro Rural', risk_index: 4.5, hazard_exposure_total: 4.2, vulnerability_total: 5.5, lack_coping_capacity_total: 5.8 },
  { adm2_name: 'Kilosa', risk_index: 4.6, hazard_exposure_total: 4.5, vulnerability_total: 5.6, lack_coping_capacity_total: 5.9 },

  // Lindi - Higher risk (remote, poor infrastructure)
  { adm2_name: 'Lindi Municipal', risk_index: 4.7, hazard_exposure_total: 4.0, vulnerability_total: 6.0, lack_coping_capacity_total: 6.2 },
  { adm2_name: 'Lindi Rural', risk_index: 5.0, hazard_exposure_total: 4.5, vulnerability_total: 6.3, lack_coping_capacity_total: 6.5 },

  // Mtwara - Higher risk
  { adm2_name: 'Mtwara Municipal', risk_index: 4.5, hazard_exposure_total: 3.8, vulnerability_total: 5.8, lack_coping_capacity_total: 6.0 },
  { adm2_name: 'Mtwara Rural', risk_index: 4.8, hazard_exposure_total: 4.2, vulnerability_total: 6.0, lack_coping_capacity_total: 6.3 }
];

// ============================================================================
// DEFAULT USERS
// ============================================================================

export const DEFAULT_USERS = [
  {
    email: 'admin@pmo.go.tz',
    name: 'System Administrator',
    role: 'admin',
    department: 'IT Department',
    phone: '+255 26 2322480',
    permissions: ['all']
  },
  {
    email: 'dmd@pmo.go.tz',
    name: 'DMD Officer',
    role: 'pmo_officer',
    department: 'Disaster Management Department',
    phone: '+255 26 2322480',
    permissions: ['canIssueWarnings', 'canApproveWarnings', 'canViewReports', 'canManageUsers']
  },
  {
    email: 'eocc@pmo.go.tz',
    name: 'EOCC Officer',
    role: 'pmo_officer',
    department: 'Emergency Operations Control Centre',
    phone: '+255 26 2322480',
    permissions: ['canIssueWarnings', 'canViewReports']
  },
  {
    email: 'regional.arusha@pmo.go.tz',
    name: 'Arusha Regional Officer',
    role: 'regional_officer',
    assigned_region: 'Arusha',
    department: "Regional Commissioner's Office",
    permissions: ['canViewReports', 'canSubmitData']
  },
  {
    email: 'regional.dar@pmo.go.tz',
    name: 'Dar es Salaam Regional Officer',
    role: 'regional_officer',
    assigned_region: 'Dar es Salaam',
    department: "Regional Commissioner's Office",
    permissions: ['canViewReports', 'canSubmitData']
  },
  {
    email: 'guest@inform.tz',
    name: 'Guest User',
    role: 'public_user',
    department: 'Public',
    permissions: ['canViewPublic']
  }
];

// ============================================================================
// INFRASTRUCTURE SEED DATA
// ============================================================================

export const INFRASTRUCTURE_SAMPLES = [
  { adm2_name: 'Ilala', hospitals: 8, health_centers: 25, dispensaries: 45, emergency_shelters: 12, fire_stations: 4, mobile_coverage_percent: 98 },
  { adm2_name: 'Kinondoni', hospitals: 6, health_centers: 22, dispensaries: 38, emergency_shelters: 10, fire_stations: 3, mobile_coverage_percent: 97 },
  { adm2_name: 'Temeke', hospitals: 5, health_centers: 20, dispensaries: 35, emergency_shelters: 8, fire_stations: 2, mobile_coverage_percent: 95 },
  { adm2_name: 'Arusha City', hospitals: 4, health_centers: 15, dispensaries: 28, emergency_shelters: 6, fire_stations: 2, mobile_coverage_percent: 92 },
  { adm2_name: 'Dodoma Urban', hospitals: 3, health_centers: 12, dispensaries: 22, emergency_shelters: 5, fire_stations: 2, mobile_coverage_percent: 90 },
  { adm2_name: 'Moshi Municipal', hospitals: 3, health_centers: 10, dispensaries: 18, emergency_shelters: 4, fire_stations: 1, mobile_coverage_percent: 88 },
  { adm2_name: 'Tanga City', hospitals: 3, health_centers: 12, dispensaries: 20, emergency_shelters: 5, fire_stations: 2, mobile_coverage_percent: 85 },
  { adm2_name: 'Mtwara Municipal', hospitals: 2, health_centers: 8, dispensaries: 15, emergency_shelters: 3, fire_stations: 1, mobile_coverage_percent: 75 },
  { adm2_name: 'Lindi Municipal', hospitals: 1, health_centers: 5, dispensaries: 12, emergency_shelters: 2, fire_stations: 1, mobile_coverage_percent: 70 }
];

// ============================================================================
// EXPORT ALL SEED DATA
// ============================================================================

export default {
  TANZANIA_REGIONS,
  TANZANIA_DISTRICTS,
  TANZANIA_NATIONAL_RISK,
  DISTRICT_RISK_SAMPLES,
  DEFAULT_USERS,
  INFRASTRUCTURE_SAMPLES
};
