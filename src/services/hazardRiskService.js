/**
 * TANZANIA INFORM RISK INDEX SERVICE
 *
 * Operational Decision Support System for Disaster Risk Reduction
 *
 * Designed for: PMO-DMD, Regional Disaster Management Committees, TMA
 *
 * Based on:
 * - INFORM Risk Index Methodology (DRMKC/JRC European Commission)
 * - WMO Multi-Hazard Early Warning System Guidelines
 * - Sendai Framework for Disaster Risk Reduction 2015-2030
 * - Tanzania Disaster Management Act 2015
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *                        INFORM RISK INDEX FORMULA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   RISK = (HAZARD × EXPOSURE × VULNERABILITY)^(1/3)
 *
 *   Where:
 *   ├── HAZARD & EXPOSURE: Physical risk dimension
 *   └── VULNERABILITY: Combined sensitivity and lack of coping capacity
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *                           ALERT LEVELS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   Level 4 (RED):    Risk ≥ 8.0  → Emergency Response Activation
 *   Level 3 (ORANGE): Risk ≥ 6.0  → Preparedness & Standby
 *   Level 2 (YELLOW): Risk ≥ 4.0  → Enhanced Monitoring
 *   Level 1 (GREEN):  Risk < 4.0  → Normal Operations
 *
 * @author PMO-DMD Tanzania / INFORM Technical Team
 * @version 3.0.0 - February 2026
 */

// ═══════════════════════════════════════════════════════════════════════════
// PART 1: FLOOD HAZARD MONITORING INDICATORS
// ═══════════════════════════════════════════════════════════════════════════

export const FLOOD_MONITORING = {

  // Meteorological Triggers (from TMA)
  meteorological: {
    daily_rainfall: {
      id: 'daily_rainfall',
      name: 'Observed Rainfall (24hr)',
      description: 'Accumulated rainfall in last 24 hours from TMA stations',
      source: 'Tanzania Meteorological Authority (TMA)',
      unit: 'mm',
      updateFrequency: 'Every 6 hours',
      alertLevels: {
        green: { max: 50, action: 'Normal monitoring' },
        yellow: { min: 50, max: 100, action: 'Increased monitoring, alert local committees' },
        orange: { min: 100, max: 150, action: 'Activate preparedness measures, pre-position supplies' },
        red: { min: 150, action: 'Issue flood warning, activate emergency response' }
      },
      weight: 0.35
    },
    rainfall_forecast: {
      id: 'rainfall_forecast',
      name: '72-hour Rainfall Forecast',
      description: 'Predicted rainfall for next 3 days',
      source: 'TMA / ECMWF',
      unit: 'mm',
      updateFrequency: 'Daily',
      alertLevels: {
        green: { max: 75, action: 'Continue routine monitoring' },
        yellow: { min: 75, max: 150, action: 'Pre-alert regional committees' },
        orange: { min: 150, max: 250, action: 'Issue watch, prepare evacuation plans' },
        red: { min: 250, action: 'Issue warning, begin evacuations in high-risk areas' }
      },
      weight: 0.25
    },
    cumulative_rainfall: {
      id: 'cumulative_rainfall',
      name: 'Cumulative Seasonal Rainfall',
      description: 'Total rainfall since season start vs. normal',
      source: 'CHIRPS / TMA',
      unit: '% of normal',
      updateFrequency: 'Weekly',
      alertLevels: {
        green: { max: 120, action: 'Normal' },
        yellow: { min: 120, max: 150, action: 'Saturated soils expected' },
        orange: { min: 150, max: 180, action: 'High runoff risk' },
        red: { min: 180, action: 'Extreme flood risk' }
      },
      weight: 0.15
    }
  },

  // Hydrological Triggers (from Water Authorities)
  hydrological: {
    river_level: {
      id: 'river_level',
      name: 'River Water Level',
      description: 'Current level at key gauging stations',
      source: 'WAMI-RUVU Basin / PBWO / Lake Victoria Basin',
      unit: 'meters above datum',
      updateFrequency: 'Every 3 hours during rains',
      alertLevels: {
        green: { status: 'normal', action: 'Routine monitoring' },
        yellow: { status: 'rising', action: 'Alert downstream communities' },
        orange: { status: 'high', action: 'Prepare flood gates, sandbagging' },
        red: { status: 'critical', action: 'Evacuate flood plains' }
      },
      weight: 0.30
    },
    dam_reservoir: {
      id: 'dam_reservoir',
      name: 'Dam/Reservoir Level',
      description: 'Water level in major dams (Mtera, Kidatu, Nyumba ya Mungu)',
      source: 'TANESCO / MOWI',
      unit: '% of capacity',
      updateFrequency: 'Daily',
      alertLevels: {
        green: { max: 75, action: 'Normal operations' },
        yellow: { min: 75, max: 85, action: 'Increase monitoring, prepare spillway' },
        orange: { min: 85, max: 95, action: 'Controlled release, alert downstream' },
        red: { min: 95, action: 'Emergency spillway opening, evacuate downstream' }
      },
      weight: 0.20
    },
    soil_saturation: {
      id: 'soil_saturation',
      name: 'Soil Moisture Saturation',
      description: 'Ground water content affecting runoff',
      source: 'NASA SMAP / ESA SMOS',
      unit: '% saturation',
      updateFrequency: 'Daily',
      alertLevels: {
        green: { max: 60, action: 'Soil can absorb more rain' },
        yellow: { min: 60, max: 75, action: 'Reduced infiltration capacity' },
        orange: { min: 75, max: 90, action: 'High runoff expected' },
        red: { min: 90, action: 'Flash flood conditions' }
      },
      weight: 0.10
    }
  },

  // Historical/Baseline Data
  baseline: {
    flood_hazard_zone: {
      id: 'flood_hazard_zone',
      name: 'Flood Hazard Zone Classification',
      description: 'Areas classified by flood return period',
      source: 'PMO-DMD Hazard Maps / UNEP GAR',
      categories: {
        zone_1: { returnPeriod: '10 years', description: 'Frequently flooded' },
        zone_2: { returnPeriod: '50 years', description: 'Occasionally flooded' },
        zone_3: { returnPeriod: '100 years', description: 'Rarely flooded' },
        zone_4: { returnPeriod: '>100 years', description: 'Very low flood risk' }
      },
      weight: 0.40
    },
    historical_events: {
      id: 'historical_events',
      name: 'Historical Flood Events',
      description: 'Past flood occurrences and impacts (1990-2025)',
      source: 'DesInventar / PMO-DMD Archives',
      weight: 0.30
    },
    topographic_risk: {
      id: 'topographic_risk',
      name: 'Topographic Flood Risk',
      description: 'Elevation, slope, drainage density',
      source: 'SRTM 30m DEM / HydroSHEDS',
      weight: 0.30
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PART 2: DROUGHT MONITORING INDICATORS
// ═══════════════════════════════════════════════════════════════════════════

export const DROUGHT_MONITORING = {

  // Meteorological Drought Indicators
  meteorological: {
    spi_3: {
      id: 'spi_3',
      name: 'SPI-3 (3-month)',
      description: 'Standardized Precipitation Index - short term drought',
      source: 'TMA / FEWS NET',
      unit: 'index (-3 to +3)',
      updateFrequency: 'Monthly',
      interpretation: {
        normal: { range: [-0.99, 0.99], action: 'Normal conditions' },
        mild_drought: { range: [-1.49, -1.0], action: 'Monitor agricultural areas' },
        moderate_drought: { range: [-1.99, -1.5], action: 'Issue drought watch, water conservation' },
        severe_drought: { range: [-2.49, -2.0], action: 'Activate drought response, prioritize water' },
        extreme_drought: { range: [-3.0, -2.5], action: 'Emergency water supply, food assistance' }
      },
      weight: 0.25
    },
    spei_3: {
      id: 'spei_3',
      name: 'SPEI-3 (3-month)',
      description: 'Standardized Precipitation Evapotranspiration Index',
      source: 'Calculated from CHIRPS + MODIS ET',
      unit: 'index (-3 to +3)',
      updateFrequency: 'Monthly',
      weight: 0.20
    },
    rainfall_deficit: {
      id: 'rainfall_deficit',
      name: 'Seasonal Rainfall Deficit',
      description: 'Cumulative rainfall vs. long-term average',
      source: 'TMA / CHIRPS',
      unit: '% of normal',
      updateFrequency: 'Dekadal (10-day)',
      interpretation: {
        normal: { range: [85, 115], action: 'Normal season' },
        below_normal: { range: [70, 84], action: 'Possible crop stress' },
        poor: { range: [50, 69], action: 'Likely crop failure, monitor food security' },
        very_poor: { range: [0, 49], action: 'Widespread crop failure, food emergency' }
      },
      weight: 0.20
    }
  },

  // Agricultural Drought Indicators
  agricultural: {
    ndvi: {
      id: 'ndvi',
      name: 'NDVI (Vegetation Health)',
      description: 'Normalized Difference Vegetation Index',
      source: 'MODIS Terra/Aqua',
      unit: 'index (0 to 1)',
      updateFrequency: '16-day composite',
      interpretation: {
        good: { range: [0.5, 1.0], description: 'Healthy vegetation' },
        fair: { range: [0.35, 0.49], description: 'Moderate stress' },
        poor: { range: [0.2, 0.34], description: 'Significant stress' },
        very_poor: { range: [0, 0.19], description: 'Severe stress/crop failure' }
      },
      weight: 0.20
    },
    vci: {
      id: 'vci',
      name: 'VCI (Vegetation Condition Index)',
      description: 'Current NDVI relative to historical min/max',
      source: 'FEWS NET / RCMRD',
      unit: '% (0-100)',
      updateFrequency: 'Dekadal',
      interpretation: {
        good: { range: [50, 100], description: 'Above average conditions' },
        fair: { range: [35, 49], description: 'Normal to below average' },
        poor: { range: [20, 34], description: 'Drought conditions' },
        very_poor: { range: [0, 19], description: 'Severe drought' }
      },
      weight: 0.15
    },
    dry_spell_days: {
      id: 'dry_spell_days',
      name: 'Consecutive Dry Days',
      description: 'Days without significant rainfall (>2mm)',
      source: 'TMA Stations',
      unit: 'days',
      updateFrequency: 'Daily',
      interpretation: {
        normal: { range: [0, 10], description: 'Normal dry period' },
        watch: { range: [11, 15], description: 'Extended dry spell' },
        warning: { range: [16, 21], description: 'Crop stress likely' },
        emergency: { range: [22, 999], description: 'Severe crop damage' }
      },
      weight: 0.10
    }
  },

  // Baseline/Long-term
  baseline: {
    aridity_zone: {
      id: 'aridity_zone',
      name: 'Aridity Zone Classification',
      description: 'Climate-based drought susceptibility',
      source: 'CGIAR-CSI Aridity Index',
      categories: {
        arid: { ai: '<0.2', regions: 'Central Tanzania, Dodoma, Singida' },
        semi_arid: { ai: '0.2-0.5', regions: 'Shinyanga, parts of Manyara' },
        dry_subhumid: { ai: '0.5-0.65', regions: 'Coastal areas, Lake regions' },
        humid: { ai: '>0.65', regions: 'Southern Highlands, Kagera' }
      },
      weight: 0.40
    },
    drought_frequency: {
      id: 'drought_frequency',
      name: 'Historical Drought Frequency',
      description: 'Number of drought events per decade (1980-2025)',
      source: 'DesInventar / TMA Climate Analysis',
      weight: 0.30
    },
    rainfed_dependency: {
      id: 'rainfed_dependency',
      name: 'Rainfed Agriculture Dependency',
      description: '% of agriculture without irrigation',
      source: 'Ministry of Agriculture / FAO',
      weight: 0.30
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PART 3: EXPOSURE ASSESSMENT
// ═══════════════════════════════════════════════════════════════════════════

export const EXPOSURE_ASSESSMENT = {

  population: {
    id: 'population_exposed',
    name: 'Population in Hazard Zones',
    description: 'Number of people living in flood/drought prone areas',
    source: 'NBS Census 2022 / WorldPop',
    unit: 'people',
    weight: 0.35
  },

  agricultural_assets: {
    id: 'agricultural_assets',
    name: 'Agricultural Assets at Risk',
    description: 'Cropland, livestock, irrigation infrastructure',
    source: 'Ministry of Agriculture / FAO',
    components: {
      cropland_hectares: 'Hectares of cultivated land',
      livestock_value: 'Estimated livestock value (cattle, goats, sheep)',
      irrigation_infrastructure: 'Irrigation schemes and equipment'
    },
    floodWeight: 0.25,
    droughtWeight: 0.40
  },

  critical_infrastructure: {
    id: 'critical_infrastructure',
    name: 'Critical Infrastructure',
    description: 'Roads, bridges, health facilities, schools, water points',
    source: 'OpenStreetMap / Sector Ministries',
    components: {
      roads_km: 'Kilometers of roads in hazard zones',
      bridges: 'Number of bridges at risk',
      health_facilities: 'Hospitals, health centers, dispensaries',
      schools: 'Primary and secondary schools',
      water_points: 'Boreholes, wells, water supply systems'
    },
    floodWeight: 0.30,
    droughtWeight: 0.15
  },

  economic_activities: {
    id: 'economic_activities',
    name: 'Economic Activities',
    description: 'Livelihoods dependent on climate-sensitive sectors',
    source: 'NBS Economic Surveys',
    weight: 0.10
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PART 4: VULNERABILITY ASSESSMENT
// ═══════════════════════════════════════════════════════════════════════════

export const VULNERABILITY_ASSESSMENT = {

  // Socioeconomic Sensitivity
  sensitivity: {
    poverty_rate: {
      id: 'poverty_rate',
      name: 'Basic Needs Poverty Rate',
      description: 'Population below poverty line',
      source: 'NBS Household Budget Survey 2022',
      unit: '%',
      weight: 0.30
    },
    food_insecurity: {
      id: 'food_insecurity',
      name: 'Food Insecurity (IPC Phase)',
      description: 'Integrated Phase Classification',
      source: 'WFP / FEWS NET / Government',
      phases: {
        phase_1: 'Minimal - Households meet food needs',
        phase_2: 'Stressed - Marginally able to meet food needs',
        phase_3: 'Crisis - Food consumption gaps, acute malnutrition',
        phase_4: 'Emergency - Large food gaps, very high malnutrition',
        phase_5: 'Famine - Extreme food gaps, death'
      },
      weight: 0.35
    },
    water_access: {
      id: 'water_access',
      name: 'Access to Safe Water',
      description: 'Population with access to improved water source',
      source: 'NBS / RUWASA',
      unit: '%',
      weight: 0.20
    },
    health_status: {
      id: 'health_status',
      name: 'Health Vulnerability',
      description: 'Under-5 mortality, malnutrition, disease burden',
      source: 'DHS / Ministry of Health',
      weight: 0.15
    }
  },

  // Lack of Coping Capacity
  coping_capacity: {
    early_warning: {
      id: 'early_warning',
      name: 'Early Warning System Coverage',
      description: 'Population receiving timely hazard warnings',
      source: 'TMA / PMO-DMD',
      unit: '% coverage',
      weight: 0.25
    },
    drm_governance: {
      id: 'drm_governance',
      name: 'DRM Governance',
      description: 'Functionality of disaster management committees',
      source: 'PMO-DMD Assessment',
      levels: {
        functional: 'Active committee, trained members, resources',
        partially_functional: 'Committee exists, limited capacity',
        weak: 'Committee exists on paper only',
        none: 'No disaster management structure'
      },
      weight: 0.25
    },
    infrastructure_access: {
      id: 'infrastructure_access',
      name: 'Infrastructure Access',
      description: 'Road access, communication, markets',
      source: 'NBS / OpenStreetMap',
      weight: 0.20
    },
    social_protection: {
      id: 'social_protection',
      name: 'Social Protection Coverage',
      description: 'Access to TASAF, insurance, savings groups',
      source: 'TASAF / Social Protection Programme',
      unit: '% of poor households',
      weight: 0.15
    },
    irrigation: {
      id: 'irrigation',
      name: 'Irrigation Coverage',
      description: 'Agricultural land under irrigation',
      source: 'Ministry of Agriculture',
      unit: '% of cultivated land',
      droughtWeight: 0.30,
      floodWeight: 0.05
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PART 5: RISK CALCULATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class INFORMRiskService {

  constructor() {
    this.floodMonitoring = FLOOD_MONITORING;
    this.droughtMonitoring = DROUGHT_MONITORING;
    this.exposureData = EXPOSURE_ASSESSMENT;
    this.vulnerabilityData = VULNERABILITY_ASSESSMENT;
  }

  /**
   * Calculate FLOOD RISK INDEX
   * Returns risk score (0-10) and recommended response level
   */
  calculateFloodRisk(regionData) {
    // 1. Hazard Score (current conditions + baseline)
    const hazardScore = this._calculateFloodHazard(regionData);

    // 2. Exposure Score
    const exposureScore = this._calculateExposure(regionData, 'flood');

    // 3. Vulnerability Score (sensitivity + lack of coping)
    const { sensitivity, lackOfCoping, vulnerabilityScore } = this._calculateVulnerability(regionData, 'flood');

    // 4. INFORM Risk Formula
    const riskIndex = Math.pow(hazardScore * exposureScore * vulnerabilityScore, 1/3);
    const normalizedRisk = Math.min(10, Math.max(0, riskIndex));

    // 5. Determine Alert Level and Response
    const alertLevel = this._getAlertLevel(normalizedRisk);

    return {
      riskIndex: Math.round(normalizedRisk * 10) / 10,
      alertLevel,
      components: {
        hazard: Math.round(hazardScore * 10) / 10,
        exposure: Math.round(exposureScore * 10) / 10,
        vulnerability: Math.round(vulnerabilityScore * 10) / 10,
        sensitivity: Math.round(sensitivity * 10) / 10,
        lackOfCoping: Math.round(lackOfCoping * 10) / 10
      },
      formula: `RISK = (${hazardScore.toFixed(1)} × ${exposureScore.toFixed(1)} × ${vulnerabilityScore.toFixed(1)})^(1/3) = ${normalizedRisk.toFixed(1)}`,
      responseActions: this._getFloodResponseActions(alertLevel.level),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate DROUGHT RISK INDEX
   */
  calculateDroughtRisk(regionData) {
    const hazardScore = this._calculateDroughtHazard(regionData);
    const exposureScore = this._calculateExposure(regionData, 'drought');
    const { sensitivity, lackOfCoping, vulnerabilityScore } = this._calculateVulnerability(regionData, 'drought');

    const riskIndex = Math.pow(hazardScore * exposureScore * vulnerabilityScore, 1/3);
    const normalizedRisk = Math.min(10, Math.max(0, riskIndex));
    const alertLevel = this._getAlertLevel(normalizedRisk);

    return {
      riskIndex: Math.round(normalizedRisk * 10) / 10,
      alertLevel,
      components: {
        hazard: Math.round(hazardScore * 10) / 10,
        exposure: Math.round(exposureScore * 10) / 10,
        vulnerability: Math.round(vulnerabilityScore * 10) / 10,
        sensitivity: Math.round(sensitivity * 10) / 10,
        lackOfCoping: Math.round(lackOfCoping * 10) / 10
      },
      formula: `RISK = (${hazardScore.toFixed(1)} × ${exposureScore.toFixed(1)} × ${vulnerabilityScore.toFixed(1)})^(1/3) = ${normalizedRisk.toFixed(1)}`,
      responseActions: this._getDroughtResponseActions(alertLevel.level),
      timestamp: new Date().toISOString()
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE CALCULATION METHODS
  // ─────────────────────────────────────────────────────────────────────────

  _calculateFloodHazard(data) {
    let meteoScore = 0, hydroScore = 0, baselineScore = 0;

    // Meteorological (40% of hazard)
    const meteo = this.floodMonitoring.meteorological;
    meteoScore += this._normalizeIndicator(data?.meteorological?.daily_rainfall, meteo.daily_rainfall) * 0.35;
    meteoScore += this._normalizeIndicator(data?.meteorological?.rainfall_forecast, meteo.rainfall_forecast) * 0.25;
    meteoScore += this._normalizeIndicator(data?.meteorological?.cumulative_rainfall, meteo.cumulative_rainfall) * 0.15;

    // Hydrological (35% of hazard)
    const hydro = this.floodMonitoring.hydrological;
    hydroScore += this._normalizeIndicator(data?.hydrological?.river_level, hydro.river_level) * 0.30;
    hydroScore += this._normalizeIndicator(data?.hydrological?.dam_reservoir, hydro.dam_reservoir) * 0.20;
    hydroScore += this._normalizeIndicator(data?.hydrological?.soil_saturation, hydro.soil_saturation) * 0.10;

    // Baseline (25% of hazard)
    baselineScore = (data?.baseline?.flood_hazard_zone || 5) / 10;

    return (meteoScore * 0.40 + hydroScore * 0.35 + baselineScore * 0.25) * 10;
  }

  _calculateDroughtHazard(data) {
    let meteoScore = 0, agriScore = 0, baselineScore = 0;

    // Meteorological drought (45%)
    meteoScore += this._normalizeDroughtIndicator(data?.meteorological?.spi_3, 'spi') * 0.25;
    meteoScore += this._normalizeDroughtIndicator(data?.meteorological?.spei_3, 'spei') * 0.20;
    meteoScore += this._normalizeDroughtIndicator(data?.meteorological?.rainfall_deficit, 'deficit') * 0.20;

    // Agricultural drought (35%)
    agriScore += this._normalizeDroughtIndicator(data?.agricultural?.ndvi, 'ndvi') * 0.20;
    agriScore += this._normalizeDroughtIndicator(data?.agricultural?.vci, 'vci') * 0.15;
    agriScore += this._normalizeDroughtIndicator(data?.agricultural?.dry_spell_days, 'drydays') * 0.10;

    // Baseline (20%)
    baselineScore = (data?.baseline?.drought_susceptibility || 5) / 10;

    return (meteoScore * 0.45 + agriScore * 0.35 + baselineScore * 0.20) * 10;
  }

  _calculateExposure(data, hazardType) {
    const exp = data?.exposure || {};
    let score = 0;

    score += (exp.population || 5) / 10 * 0.35;
    score += (exp.agricultural || 5) / 10 * (hazardType === 'drought' ? 0.40 : 0.25);
    score += (exp.infrastructure || 5) / 10 * (hazardType === 'flood' ? 0.30 : 0.15);
    score += (exp.economic || 5) / 10 * 0.10;

    return score * 10;
  }

  _calculateVulnerability(data, hazardType) {
    const sens = data?.sensitivity || {};
    const cope = data?.coping || {};

    // Sensitivity
    let sensitivity = 0;
    sensitivity += (sens.poverty || 5) / 10 * 0.30;
    sensitivity += (sens.food_insecurity || 5) / 10 * 0.35;
    sensitivity += (10 - (sens.water_access || 5)) / 10 * 0.20;
    sensitivity += (sens.health_vulnerability || 5) / 10 * 0.15;
    sensitivity *= 10;

    // Coping Capacity (higher = better, so we invert)
    let coping = 0;
    coping += (cope.early_warning || 5) / 10 * 0.25;
    coping += (cope.governance || 5) / 10 * 0.25;
    coping += (cope.infrastructure || 5) / 10 * 0.20;
    coping += (cope.social_protection || 5) / 10 * 0.15;
    coping += (cope.irrigation || 5) / 10 * (hazardType === 'drought' ? 0.30 : 0.05);
    coping *= 10;

    const lackOfCoping = 10 - coping;
    const vulnerabilityScore = (sensitivity + lackOfCoping) / 2;

    return { sensitivity, lackOfCoping, coping, vulnerabilityScore };
  }

  _normalizeIndicator(value, indicator) {
    if (value === undefined || value === null) return 0.5;
    const levels = indicator.alertLevels;
    if (!levels) return value / 10;

    if (value >= (levels.red?.min || 150)) return 1.0;
    if (value >= (levels.orange?.min || 100)) return 0.75;
    if (value >= (levels.yellow?.min || 50)) return 0.5;
    return 0.25;
  }

  _normalizeDroughtIndicator(value, type) {
    if (value === undefined || value === null) return 0.5;

    if (type === 'spi' || type === 'spei') {
      if (value <= -2.0) return 1.0;
      if (value <= -1.5) return 0.75;
      if (value <= -1.0) return 0.5;
      return 0.25;
    }

    if (type === 'ndvi') {
      if (value <= 0.2) return 1.0;
      if (value <= 0.3) return 0.75;
      if (value <= 0.4) return 0.5;
      return 0.25;
    }

    if (type === 'vci') {
      if (value <= 20) return 1.0;
      if (value <= 35) return 0.75;
      if (value <= 50) return 0.5;
      return 0.25;
    }

    if (type === 'deficit') {
      if (value <= 50) return 1.0;
      if (value <= 70) return 0.75;
      if (value <= 85) return 0.5;
      return 0.25;
    }

    if (type === 'drydays') {
      if (value >= 21) return 1.0;
      if (value >= 15) return 0.75;
      if (value >= 10) return 0.5;
      return 0.25;
    }

    return value / 10;
  }

  _getAlertLevel(riskScore) {
    if (riskScore >= 8) {
      return {
        level: 4,
        name: 'RED',
        color: '#B71C1C',
        status: 'EMERGENCY',
        description: 'Activate full emergency response'
      };
    }
    if (riskScore >= 6) {
      return {
        level: 3,
        name: 'ORANGE',
        color: '#E65100',
        status: 'ALERT',
        description: 'High preparedness, standby for response'
      };
    }
    if (riskScore >= 4) {
      return {
        level: 2,
        name: 'YELLOW',
        color: '#F9A825',
        status: 'WATCH',
        description: 'Enhanced monitoring, issue advisories'
      };
    }
    return {
      level: 1,
      name: 'GREEN',
      color: '#2E7D32',
      status: 'NORMAL',
      description: 'Routine monitoring and preparedness'
    };
  }

  _getFloodResponseActions(level) {
    const actions = {
      4: [
        'Activate National Emergency Response Plan',
        'Deploy search and rescue teams',
        'Open emergency shelters',
        'Distribute emergency supplies',
        'Coordinate with Tanzania Red Cross',
        'Request international assistance if needed'
      ],
      3: [
        'Convene Emergency Management Committee',
        'Pre-position relief supplies',
        'Issue public warnings via SMS and radio',
        'Prepare evacuation routes and shelters',
        'Alert health facilities for surge capacity'
      ],
      2: [
        'Increase monitoring frequency',
        'Alert Regional and District committees',
        'Issue flood watch to at-risk communities',
        'Review contingency plans',
        'Check emergency stockpiles'
      ],
      1: [
        'Continue routine monitoring',
        'Maintain early warning systems',
        'Conduct preparedness training',
        'Update contingency plans'
      ]
    };
    return actions[level] || actions[1];
  }

  _getDroughtResponseActions(level) {
    const actions = {
      4: [
        'Declare drought emergency',
        'Activate food assistance programs',
        'Deploy water trucking to affected areas',
        'Livestock destocking programs',
        'Coordinate with WFP and partners'
      ],
      3: [
        'Activate drought contingency plan',
        'Scale up social protection programs',
        'Assess food security situation',
        'Prepare supplementary feeding',
        'Mobilize water point rehabilitation'
      ],
      2: [
        'Intensify agricultural monitoring',
        'Issue drought watch to farmers',
        'Promote water conservation',
        'Assess livestock conditions',
        'Review food reserves'
      ],
      1: [
        'Routine seasonal monitoring',
        'Support climate-smart agriculture',
        'Maintain water infrastructure',
        'Update drought contingency plan'
      ]
    };
    return actions[level] || actions[1];
  }

  /**
   * Get all monitoring indicators
   */
  getIndicators(hazardType) {
    if (hazardType === 'flood') {
      return {
        meteorological: this.floodMonitoring.meteorological,
        hydrological: this.floodMonitoring.hydrological,
        baseline: this.floodMonitoring.baseline
      };
    }
    return {
      meteorological: this.droughtMonitoring.meteorological,
      agricultural: this.droughtMonitoring.agricultural,
      baseline: this.droughtMonitoring.baseline
    };
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    return {
      flood: {
        meteorological: Object.keys(this.floodMonitoring.meteorological).length,
        hydrological: Object.keys(this.floodMonitoring.hydrological).length,
        baseline: Object.keys(this.floodMonitoring.baseline).length,
        total: Object.keys(this.floodMonitoring.meteorological).length +
               Object.keys(this.floodMonitoring.hydrological).length +
               Object.keys(this.floodMonitoring.baseline).length
      },
      drought: {
        meteorological: Object.keys(this.droughtMonitoring.meteorological).length,
        agricultural: Object.keys(this.droughtMonitoring.agricultural).length,
        baseline: Object.keys(this.droughtMonitoring.baseline).length,
        total: Object.keys(this.droughtMonitoring.meteorological).length +
               Object.keys(this.droughtMonitoring.agricultural).length +
               Object.keys(this.droughtMonitoring.baseline).length
      },
      exposure: Object.keys(this.exposureData).length,
      vulnerability: {
        sensitivity: Object.keys(this.vulnerabilityData.sensitivity).length,
        coping: Object.keys(this.vulnerabilityData.coping_capacity).length
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

let serviceInstance = null;

export function getHazardRiskService() {
  if (!serviceInstance) {
    serviceInstance = new INFORMRiskService();
  }
  return serviceInstance;
}

export function resetHazardRiskService() {
  serviceInstance = null;
}

// Legacy exports for backward compatibility
export const FLOOD_DATA = FLOOD_MONITORING;
export const DROUGHT_DATA = DROUGHT_MONITORING;
export const EXPOSURE_DATA = EXPOSURE_ASSESSMENT;
export const VULNERABILITY_DATA = VULNERABILITY_ASSESSMENT;
export const COPING_CAPACITY_DATA = VULNERABILITY_ASSESSMENT.coping_capacity;

// New structured exports
export const FLOOD_INDICATORS = FLOOD_MONITORING;
export const DROUGHT_INDICATORS = DROUGHT_MONITORING;
export const EXPOSURE_INDICATORS = EXPOSURE_ASSESSMENT;
export const VULNERABILITY_INDICATORS = VULNERABILITY_ASSESSMENT.sensitivity;
export const COPING_INDICATORS = VULNERABILITY_ASSESSMENT.coping_capacity;

export default INFORMRiskService;
