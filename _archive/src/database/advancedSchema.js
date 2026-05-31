/**
 * ADVANCED INFORM TANZANIA DATABASE SCHEMA
 *
 * Comprehensive schema mapping all Excel sheets and their relationships.
 * Implements the complete INFORM methodology with:
 * - 80+ indicators from INDICATOR sheet
 * - Multi-level aggregations (Indicator → Component → Category → Dimension → RISK)
 * - Data collection framework for all 184 districts
 * - Global API integration points
 * - Normalization and scoring system
 * - Data quality tracking
 *
 * Data Flow:
 * RAW_INDICATORS → NORMALIZED → COMPONENTS → CATEGORIES → DIMENSIONS → RISK_INDEX
 *
 * @version 2.0.0
 * @author INFORM Tanzania Team
 */

import { VALIDATORS, ENUMS } from './schema.js';

// ============================================================================
// SCHEMA CONFIGURATION
// ============================================================================

export const ADVANCED_SCHEMA_CONFIG = {
  version: '2.0.0',
  name: 'INFORM Tanzania Advanced Schema',
  methodology: 'INFORM Risk Index 2023',

  // Scoring configuration
  scoring: {
    minValue: 0,
    maxValue: 10,
    precision: 4,
    riskClasses: [
      { class: 'Very Low', min: 0, max: 2.0, color: '#3b82f6' },
      { class: 'Low', min: 2.0, max: 3.5, color: '#22c55e' },
      { class: 'Medium', min: 3.5, max: 5.0, color: '#f59e0b' },
      { class: 'High', min: 5.0, max: 6.5, color: '#ef4444' },
      { class: 'Very High', min: 6.5, max: 10.0, color: '#7f1d1d' }
    ]
  },

  // Data quality thresholds
  dataQuality: {
    excellent: { min: 90, label: 'Excellent' },
    good: { min: 70, label: 'Good' },
    fair: { min: 50, label: 'Fair' },
    poor: { min: 0, label: 'Poor' }
  },

  // Freshness thresholds (days)
  freshness: {
    current: 30,      // Data < 30 days old
    recent: 90,       // Data < 90 days old
    stale: 365,       // Data < 1 year old
    outdated: Infinity // Data > 1 year old
  }
};

// ============================================================================
// ENUMERATIONS & CONSTANTS
// ============================================================================

export const DIMENSION_TYPES = {
  HAZARD: 'HAZARD',
  VULNERABILITY: 'VULNERABILITY',
  LACK_OF_COPING_CAPACITY: 'LACK_OF_COPING_CAPACITY'
};

export const CATEGORY_TYPES = {
  // Hazard categories
  NATURAL: 'NATURAL',
  HUMAN: 'HUMAN',
  // Vulnerability categories
  SOCIO_ECONOMIC: 'SOCIO_ECONOMIC',
  VULNERABLE_GROUPS: 'VULNERABLE_GROUPS',
  // Coping capacity categories
  INFRASTRUCTURE: 'INFRASTRUCTURE',
  INSTITUTIONAL: 'INSTITUTIONAL'
};

export const POLARITY = {
  POSITIVE: 'positive',   // Higher value = better (needs inversion for risk)
  NEGATIVE: 'negative',   // Higher value = worse (direct risk contribution)
  NEUTRAL: 'neutral'      // Context-dependent
};

export const AGGREGATION_METHODS = {
  ARITHMETIC_MEAN: 'arithmetic_mean',
  GEOMETRIC_MEAN: 'geometric_mean',
  WEIGHTED_MEAN: 'weighted_mean',
  MAX: 'max',
  MIN: 'min',
  SUM: 'sum',
  MEDIAN: 'median'
};

export const RESOLUTION_LEVELS = {
  NATIONAL: 'National',
  ADM1: 'ADM1',      // Regional level (31 regions)
  ADM2: 'ADM2',      // District level (184 districts)
  ADM3: 'ADM3',      // Ward level
  POINT: 'Point'     // GPS coordinates
};

export const DATA_COLLECTION_PRIORITY = {
  CRITICAL: { level: 1, label: 'Critical', updateFrequency: 'daily' },
  HIGH: { level: 2, label: 'High', updateFrequency: 'weekly' },
  MEDIUM: { level: 3, label: 'Medium', updateFrequency: 'monthly' },
  LOW: { level: 4, label: 'Low', updateFrequency: 'quarterly' },
  BASELINE: { level: 5, label: 'Baseline', updateFrequency: 'annual' }
};

// ============================================================================
// INDICATOR DEFINITION HELPERS
// ============================================================================

/**
 * Creates a standardized indicator definition
 */
function defineIndicator({
  id,
  name,
  component,
  category,
  dimension,
  unit,
  resolution = RESOLUTION_LEVELS.ADM2,
  source,
  sourceUrl = null,
  apiEndpoint = null,
  dataYear = null,
  polarity = POLARITY.NEGATIVE,
  transform = null,
  normalization = {},
  thresholds = {},
  priority = DATA_COLLECTION_PRIORITY.MEDIUM,
  dependencies = [],
  description = null
}) {
  return {
    id,
    name,
    description: description || `${name} indicator for INFORM Tanzania`,

    // Hierarchy
    component,
    category,
    dimension,

    // Data specifications
    unit,
    resolution,
    polarity,
    transform, // 'invert', 'log', 'sqrt', etc.

    // Data sources
    source,
    sourceUrl,
    apiEndpoint,
    dataYear,

    // Normalization parameters (min-max for 0-10 scaling)
    normalization: {
      method: normalization.method || 'min_max',
      refMin: normalization.refMin ?? 0,
      refMax: normalization.refMax ?? 100,
      globalMin: normalization.globalMin ?? null,
      globalMax: normalization.globalMax ?? null,
      ...normalization
    },

    // Alert thresholds
    thresholds: {
      warning: thresholds.warning ?? 5.0,
      critical: thresholds.critical ?? 7.0,
      emergency: thresholds.emergency ?? 8.5,
      ...thresholds
    },

    // Data collection
    priority,
    dependencies,

    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Validates an indicator value
 */
export function validateIndicatorValue(indicatorId, value) {
  const indicator = INDICATOR_DEFINITIONS[indicatorId];
  if (!indicator) {
    return { valid: false, error: `Unknown indicator: ${indicatorId}` };
  }

  if (value === null || value === undefined) {
    return { valid: true, warning: 'Missing value' };
  }

  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: 'Value must be a number' };
  }

  // Check against normalization bounds if defined
  const { refMin, refMax } = indicator.normalization;
  if (value < refMin || value > refMax) {
    return {
      valid: true,
      warning: `Value ${value} outside expected range [${refMin}, ${refMax}]`
    };
  }

  return { valid: true };
}

/**
 * Normalizes a raw value to 0-10 scale
 */
export function normalizeValue(indicatorId, rawValue) {
  const indicator = INDICATOR_DEFINITIONS[indicatorId];
  if (!indicator || rawValue === null || rawValue === undefined) {
    return null;
  }

  const { refMin, refMax, method } = indicator.normalization;
  let normalized;

  switch (method) {
    case 'min_max':
      normalized = ((rawValue - refMin) / (refMax - refMin)) * 10;
      break;
    case 'log':
      const logMin = Math.log(refMin + 1);
      const logMax = Math.log(refMax + 1);
      normalized = ((Math.log(rawValue + 1) - logMin) / (logMax - logMin)) * 10;
      break;
    case 'percentile':
      // Requires distribution data - fallback to min_max
      normalized = ((rawValue - refMin) / (refMax - refMin)) * 10;
      break;
    default:
      normalized = ((rawValue - refMin) / (refMax - refMin)) * 10;
  }

  // Clamp to 0-10 range
  normalized = Math.max(0, Math.min(10, normalized));

  // Apply inversion for positive polarity indicators
  if (indicator.polarity === POLARITY.POSITIVE || indicator.transform === 'invert') {
    normalized = 10 - normalized;
  }

  return Math.round(normalized * 10000) / 10000;
}

/**
 * Gets risk class from normalized score
 */
export function getRiskClass(score) {
  if (score === null || score === undefined) return null;

  for (const riskClass of ADVANCED_SCHEMA_CONFIG.scoring.riskClasses) {
    if (score >= riskClass.min && score < riskClass.max) {
      return riskClass;
    }
  }
  return ADVANCED_SCHEMA_CONFIG.scoring.riskClasses[4]; // Very High
}

// ============================================================================
// INDICATOR DEFINITIONS (80+ indicators)
// ============================================================================

export const INDICATOR_DEFINITIONS = {
  // ==========================================================================
  // HAZARD AND EXPOSURE - NATURAL (18 indicators)
  // ==========================================================================

  'HA.NAT.CH-ERO': defineIndicator({
    id: 'HA.NAT.CH-ERO',
    name: 'Coastal Erosion',
    component: 'coastal_hazards',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'meters/year',
    resolution: RESOLUTION_LEVELS.ADM2,
    source: 'Digital Earth Africa',
    sourceUrl: 'https://docs.digitalearthafrica.org/en/latest/data_specs/Coastlines_specs.html',
    dataYear: '2000-2022',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 50 },
    thresholds: { warning: 5, critical: 15, emergency: 30 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Rate of coastal erosion affecting coastal districts'
  }),

  'HA.NAT.CH-SEA': defineIndicator({
    id: 'HA.NAT.CH-SEA',
    name: 'Sea Level Rise',
    component: 'coastal_hazards',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'mm',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'NASA Sea Level',
    sourceUrl: 'https://sealevel.nasa.gov/',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 20, critical: 50, emergency: 80 },
    priority: DATA_COLLECTION_PRIORITY.LOW,
    description: 'Sea level rise measurements affecting coastal areas'
  }),

  'HA.NAT.DR-FRE': defineIndicator({
    id: 'HA.NAT.DR-FRE',
    name: 'Historic Drought Frequency',
    component: 'drought',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'events',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'FEWS NET',
    sourceUrl: 'https://fews.net/',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 10 },
    thresholds: { warning: 3, critical: 5, emergency: 8 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Number of drought events in the past decade'
  }),

  'HA.NAT.DR-SPI': defineIndicator({
    id: 'HA.NAT.DR-SPI',
    name: 'Standardized Precipitation Index',
    component: 'drought',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.ADM2,
    source: 'TMA/CHIRPS',
    sourceUrl: 'https://www.chc.ucsb.edu/data/chirps',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: -3, refMax: 0, method: 'min_max' },
    thresholds: { warning: -1, critical: -1.5, emergency: -2 },
    priority: DATA_COLLECTION_PRIORITY.CRITICAL,
    description: 'Drought severity based on precipitation deficit'
  }),

  'HA.NAT.EQ-EXP': defineIndicator({
    id: 'HA.NAT.EQ-EXP',
    name: 'Earthquake Exposure',
    component: 'earthquake',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.ADM2,
    source: 'USGS',
    sourceUrl: 'https://earthquake.usgs.gov/',
    apiEndpoint: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 10 },
    thresholds: { warning: 3, critical: 5, emergency: 7 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Earthquake hazard exposure based on historical seismicity'
  }),

  'HA.NAT.ED-DEF': defineIndicator({
    id: 'HA.NAT.ED-DEF',
    name: 'Deforestation - Treecover Loss',
    component: 'environmental_degradation',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM2,
    source: 'Global Forest Watch',
    sourceUrl: 'https://www.globalforestwatch.org/',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 50 },
    thresholds: { warning: 10, critical: 25, emergency: 40 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Percentage of tree cover lost in the past year'
  }),

  'HA.NAT.DE-ERO': defineIndicator({
    id: 'HA.NAT.DE-ERO',
    name: 'Soil Erosion',
    component: 'environmental_degradation',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'Mg/ha/yr',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'ISRIC',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 20, critical: 50, emergency: 80 },
    priority: DATA_COLLECTION_PRIORITY.LOW,
    description: 'Annual soil loss rate per hectare'
  }),

  'HA.NAT.FL-EXP': defineIndicator({
    id: 'HA.NAT.FL-EXP',
    name: 'Flood Exposure',
    component: 'flood',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM2,
    source: 'Global Flood Database',
    sourceUrl: 'https://global-flood-database.cloudtostreet.ai/',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 10, critical: 30, emergency: 60 },
    priority: DATA_COLLECTION_PRIORITY.CRITICAL,
    description: 'Percentage of population in flood-prone areas'
  }),

  'HA.NAT.FL-FRE': defineIndicator({
    id: 'HA.NAT.FL-FRE',
    name: 'Flood Frequency',
    component: 'flood',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'events/year',
    resolution: RESOLUTION_LEVELS.ADM2,
    source: 'EM-DAT/TMA',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 5 },
    thresholds: { warning: 1, critical: 2, emergency: 4 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Average annual flood events'
  }),

  'HA.NAT.HW-EXP': defineIndicator({
    id: 'HA.NAT.HW-EXP',
    name: 'Heatwave Exposure',
    component: 'heatwave',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'days',
    resolution: RESOLUTION_LEVELS.ADM2,
    source: 'ERA5/Copernicus',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 60 },
    thresholds: { warning: 14, critical: 30, emergency: 45 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Number of extreme heat days per year'
  }),

  'HA.NAT.LS-EXP': defineIndicator({
    id: 'HA.NAT.LS-EXP',
    name: 'Landslide Exposure',
    component: 'landslide',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM2,
    source: 'NASA LHASA',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 50 },
    thresholds: { warning: 10, critical: 25, emergency: 40 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Percentage area prone to landslides'
  }),

  'HA.NAT.LI-CAS': defineIndicator({
    id: 'HA.NAT.LI-CAS',
    name: 'Lightning Casualties',
    component: 'lightning',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'casualties',
    resolution: RESOLUTION_LEVELS.ADM2,
    source: 'TMA',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 50 },
    thresholds: { warning: 5, critical: 15, emergency: 30 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Annual lightning-related casualties'
  }),

  'HA.NAT.ST-TC': defineIndicator({
    id: 'HA.NAT.ST-TC',
    name: 'Tropical Cyclone Exposure',
    component: 'storms_cyclone',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'IBTrACS',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 10 },
    thresholds: { warning: 2, critical: 5, emergency: 8 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Exposure to tropical cyclone tracks'
  }),

  'HA.NAT.ST-TC2': defineIndicator({
    id: 'HA.NAT.ST-TC2',
    name: 'Cyclone Exposure - Max Speed',
    component: 'storms_cyclone',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'km/h',
    resolution: RESOLUTION_LEVELS.ADM2,
    source: 'IBTrACS',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 250 },
    thresholds: { warning: 60, critical: 120, emergency: 180 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Maximum cyclone wind speed exposure'
  }),

  'HA.NAT.ST-ST': defineIndicator({
    id: 'HA.NAT.ST-ST',
    name: 'Storm Exposure',
    component: 'storms_cyclone',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'EM-DAT',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 10 },
    thresholds: { warning: 2, critical: 5, emergency: 8 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'General storm exposure index'
  }),

  'HA.NAT.VC-EXP': defineIndicator({
    id: 'HA.NAT.VC-EXP',
    name: 'Volcano Exposure',
    component: 'volcano',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'GVP Smithsonian',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 10 },
    thresholds: { warning: 2, critical: 5, emergency: 8 },
    priority: DATA_COLLECTION_PRIORITY.LOW,
    description: 'Volcanic hazard exposure index'
  }),

  'HA.NAT.WF-BURN': defineIndicator({
    id: 'HA.NAT.WF-BURN',
    name: 'Burned Area',
    component: 'wildfire',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'km2',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'FIRMS/NASA',
    sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/',
    apiEndpoint: 'https://firms.modaps.eosdis.nasa.gov/api/',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 1000, method: 'log' },
    thresholds: { warning: 100, critical: 500, emergency: 800 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Total burned area in square kilometers'
  }),

  'HA.NAT.WF-FWI': defineIndicator({
    id: 'HA.NAT.WF-FWI',
    name: 'Fire Weather Index',
    component: 'wildfire',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'Copernicus CAMS',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 25, critical: 50, emergency: 75 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Fire weather danger index'
  }),

  'HA.NAT.ZPP-AD': defineIndicator({
    id: 'HA.NAT.ZPP-AD',
    name: 'Animal Diseases',
    component: 'zoonoses',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'OIE-WAHIS',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 10 },
    thresholds: { warning: 3, critical: 5, emergency: 8 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Animal disease outbreak risk index'
  }),

  'HA.NAT.ZPP-PD': defineIndicator({
    id: 'HA.NAT.ZPP-PD',
    name: 'Plant Diseases',
    component: 'zoonoses',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'FAO',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 10 },
    thresholds: { warning: 3, critical: 5, emergency: 8 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Plant disease and crop pest risk index'
  }),

  'HA.NAT.ZPP-PE': defineIndicator({
    id: 'HA.NAT.ZPP-PE',
    name: 'Pests',
    component: 'zoonoses',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'FAO',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 10 },
    thresholds: { warning: 3, critical: 5, emergency: 8 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Pest infestation risk (locusts, armyworms, etc.)'
  }),

  // ==========================================================================
  // HAZARD AND EXPOSURE - HUMAN (6 indicators)
  // ==========================================================================

  'HA.HUM.CR-GCRI': defineIndicator({
    id: 'HA.HUM.CR-GCRI',
    name: 'Conflict Probability (GCRI)',
    component: 'conflict_risk',
    category: CATEGORY_TYPES.HUMAN,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'probability',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'JRC GCRI',
    sourceUrl: 'https://drmkc.jrc.ec.europa.eu/inform-index',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 1 },
    thresholds: { warning: 0.3, critical: 0.5, emergency: 0.7 },
    priority: DATA_COLLECTION_PRIORITY.LOW,
    description: 'Global Conflict Risk Index probability score'
  }),

  'HA.HUM.CI-CBAR': defineIndicator({
    id: 'HA.HUM.CI-CBAR',
    name: 'Conflict Barometer',
    component: 'conflict_intensity',
    category: CATEGORY_TYPES.HUMAN,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'level',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'HIIK',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 5 },
    thresholds: { warning: 2, critical: 3, emergency: 4 },
    priority: DATA_COLLECTION_PRIORITY.LOW,
    description: 'Conflict intensity level (1-5 scale)'
  }),

  'HA.HUM.HMAT': defineIndicator({
    id: 'HA.HUM.HMAT',
    name: 'Hazardous Material',
    component: 'hazardous_material',
    category: CATEGORY_TYPES.HUMAN,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'UNEP',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 10 },
    thresholds: { warning: 3, critical: 5, emergency: 7 },
    priority: DATA_COLLECTION_PRIORITY.LOW,
    description: 'Hazardous material incident risk'
  }),

  'HA.HUM.VIO-EVE': defineIndicator({
    id: 'HA.HUM.VIO-EVE',
    name: 'Violence Events',
    component: 'internal_violence',
    category: CATEGORY_TYPES.HUMAN,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'events',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'ACLED',
    sourceUrl: 'https://acleddata.com/',
    apiEndpoint: 'https://api.acleddata.com/acled/read',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 100, method: 'log' },
    thresholds: { warning: 10, critical: 50, emergency: 80 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Number of violent events recorded'
  }),

  'HA.HUM.VIO-FAT': defineIndicator({
    id: 'HA.HUM.VIO-FAT',
    name: 'Violence Fatalities',
    component: 'internal_violence',
    category: CATEGORY_TYPES.HUMAN,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'deaths',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'ACLED',
    apiEndpoint: 'https://api.acleddata.com/acled/read',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 500, method: 'log' },
    thresholds: { warning: 10, critical: 50, emergency: 100 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Number of fatalities from violent events'
  }),

  'HA.HUM.ACC': defineIndicator({
    id: 'HA.HUM.ACC',
    name: 'Vehicle Accidents',
    component: 'vehicle_accidents',
    category: CATEGORY_TYPES.HUMAN,
    dimension: DIMENSION_TYPES.HAZARD,
    unit: 'per 100k',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'WHO/NTSA',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 50 },
    thresholds: { warning: 15, critical: 25, emergency: 40 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Road traffic fatality rate per 100,000'
  }),

  // ==========================================================================
  // VULNERABILITY - SOCIO-ECONOMIC (12 indicators)
  // ==========================================================================

  'VU.SE.POV-HDI': defineIndicator({
    id: 'VU.SE.POV-HDI',
    name: 'Human Development Index',
    component: 'development_poverty',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'UNDP',
    sourceUrl: 'https://hdr.undp.org/',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 1 },
    thresholds: { warning: 0.55, critical: 0.45, emergency: 0.35 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Human Development Index (higher = better)'
  }),

  'VU.SE.POV-MPI': defineIndicator({
    id: 'VU.SE.POV-MPI',
    name: 'Multidimensional Poverty Index',
    component: 'development_poverty',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'OPHI/UNDP',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 1 },
    thresholds: { warning: 0.3, critical: 0.5, emergency: 0.7 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Multidimensional poverty headcount'
  }),

  'VU.SE.POV-GDI': defineIndicator({
    id: 'VU.SE.POV-GDI',
    name: 'Gender Development Index',
    component: 'development_poverty',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'UNDP',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 1 },
    thresholds: { warning: 0.9, critical: 0.8, emergency: 0.7 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Gender development index (higher = better equality)'
  }),

  'VU.SE.POV-GINI': defineIndicator({
    id: 'VU.SE.POV-GINI',
    name: 'Wealth Inequality (Gini)',
    component: 'development_poverty',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'coefficient',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'World Bank',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 35, critical: 45, emergency: 55 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Income inequality coefficient (0-100)'
  }),

  'VU.SE.DEP-ODA': defineIndicator({
    id: 'VU.SE.DEP-ODA',
    name: 'Aid Dependency (ODA)',
    component: 'economic_dependency',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: '% of GNI',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'OECD',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 30 },
    thresholds: { warning: 10, critical: 15, emergency: 25 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Official development assistance as % of GNI'
  }),

  'VU.SE.DEP-REM': defineIndicator({
    id: 'VU.SE.DEP-REM',
    name: 'Remittance Dependency',
    component: 'economic_dependency',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: '% of GNI',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'World Bank',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 30 },
    thresholds: { warning: 10, critical: 15, emergency: 25 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Personal remittances received as % of GNI'
  }),

  'VU.SE.DEP-DR': defineIndicator({
    id: 'VU.SE.DEP-DR',
    name: 'Dependency Ratio',
    component: 'economic_dependency',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'ratio',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'NBS Census',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 150 },
    thresholds: { warning: 80, critical: 100, emergency: 120 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Age dependency ratio (dependents per 100 working-age)'
  }),

  'VU.SE.HAB-INF': defineIndicator({
    id: 'VU.SE.HAB-INF',
    name: 'Informal Settlements',
    component: 'habitat',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'UN-Habitat',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 30, critical: 50, emergency: 70 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Population living in informal settlements'
  }),

  'VU.SE.HAB-RISK': defineIndicator({
    id: 'VU.SE.HAB-RISK',
    name: 'Homes in High-Risk Areas',
    component: 'habitat',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'count',
    resolution: RESOLUTION_LEVELS.ADM2,
    source: 'TMA/NBS',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 10000, method: 'log' },
    thresholds: { warning: 1000, critical: 5000, emergency: 8000 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Number of homes in flood/landslide prone areas'
  }),

  'VU.SE.HAB-URB': defineIndicator({
    id: 'VU.SE.HAB-URB',
    name: 'Urban Population',
    component: 'habitat',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'NBS',
    polarity: POLARITY.NEUTRAL,
    normalization: { refMin: 0, refMax: 100 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Urban population percentage'
  }),

  'VU.SE.LV-FS': defineIndicator({
    id: 'VU.SE.LV-FS',
    name: 'Food Insecurity',
    component: 'livelihoods',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'WFP/FEWS NET',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 20, critical: 40, emergency: 60 },
    priority: DATA_COLLECTION_PRIORITY.CRITICAL,
    description: 'Population experiencing food insecurity'
  }),

  'VU.SE.LV-IPC': defineIndicator({
    id: 'VU.SE.LV-IPC',
    name: 'IPC Food Classification',
    component: 'livelihoods',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'phase',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'IPC',
    sourceUrl: 'https://www.ipcinfo.org/',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 1, refMax: 5 },
    thresholds: { warning: 2, critical: 3, emergency: 4 },
    priority: DATA_COLLECTION_PRIORITY.CRITICAL,
    description: 'IPC phase classification (1-5)'
  }),

  // ==========================================================================
  // VULNERABILITY - VULNERABLE GROUPS (14 indicators)
  // ==========================================================================

  'VU.VG.DP-IDP': defineIndicator({
    id: 'VU.VG.DP-IDP',
    name: 'Internally Displaced Persons',
    component: 'displaced_people',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'persons',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'UNHCR/IOM',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 100000, method: 'log' },
    thresholds: { warning: 5000, critical: 20000, emergency: 50000 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Number of internally displaced persons'
  }),

  'VU.VG.DP-REF': defineIndicator({
    id: 'VU.VG.DP-REF',
    name: 'Refugees',
    component: 'displaced_people',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'persons',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'UNHCR',
    sourceUrl: 'https://www.unhcr.org/',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 500000, method: 'log' },
    thresholds: { warning: 50000, critical: 150000, emergency: 300000 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Refugee population hosted'
  }),

  'VU.VG.HC-LEXP': defineIndicator({
    id: 'VU.VG.HC-LEXP',
    name: 'Life Expectancy',
    component: 'health_conditions',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'years',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'WHO/NBS',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 40, refMax: 80 },
    thresholds: { warning: 60, critical: 55, emergency: 50 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Life expectancy at birth'
  }),

  'VU.VG.HC-MALAPREV': defineIndicator({
    id: 'VU.VG.HC-MALAPREV',
    name: 'Malaria Prevalence',
    component: 'health_conditions',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'WHO/MoH',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 50 },
    thresholds: { warning: 10, critical: 25, emergency: 40 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Malaria prevalence rate'
  }),

  'VU.VG.HC-MALAMORT': defineIndicator({
    id: 'VU.VG.HC-MALAMORT',
    name: 'Malaria Mortality Rate',
    component: 'health_conditions',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'per 100k',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'WHO',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 20, critical: 50, emergency: 80 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Malaria mortality rate per 100,000'
  }),

  'VU.VG.HC-TUB': defineIndicator({
    id: 'VU.VG.HC-TUB',
    name: 'Tuberculosis Incidence',
    component: 'health_conditions',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'per 100k',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'WHO',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 500 },
    thresholds: { warning: 100, critical: 250, emergency: 400 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'TB incidence rate per 100,000'
  }),

  'VU.VG.HC-CHO': defineIndicator({
    id: 'VU.VG.HC-CHO',
    name: 'Cholera Cases',
    component: 'health_conditions',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'cases',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'MoH',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 1000, method: 'log' },
    thresholds: { warning: 50, critical: 200, emergency: 500 },
    priority: DATA_COLLECTION_PRIORITY.CRITICAL,
    description: 'Annual cholera cases reported'
  }),

  'VU.VG.CH-MORTNEO': defineIndicator({
    id: 'VU.VG.CH-MORTNEO',
    name: 'Neonatal Mortality',
    component: 'children_health',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'per 1000',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'DHS/UNICEF',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 50 },
    thresholds: { warning: 15, critical: 25, emergency: 35 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Deaths within first 28 days per 1,000 live births'
  }),

  'VU.VG.CH-MORTINF': defineIndicator({
    id: 'VU.VG.CH-MORTINF',
    name: 'Infant Mortality',
    component: 'children_health',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'per 1000',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'DHS/UNICEF',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 30, critical: 50, emergency: 75 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Deaths within first year per 1,000 live births'
  }),

  'VU.VG.CH-MORTCH': defineIndicator({
    id: 'VU.VG.CH-MORTCH',
    name: 'Child Mortality (Under-5)',
    component: 'children_health',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'per 1000',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'DHS/UNICEF',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 150 },
    thresholds: { warning: 40, critical: 80, emergency: 120 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Deaths before age 5 per 1,000 live births'
  }),

  'VU.VG.CH-UW': defineIndicator({
    id: 'VU.VG.CH-UW',
    name: 'Children Underweight',
    component: 'children_health',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'DHS',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 50 },
    thresholds: { warning: 15, critical: 25, emergency: 35 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Children under 5 who are underweight'
  }),

  'VU.VG.CH-STN': defineIndicator({
    id: 'VU.VG.CH-STN',
    name: 'Child Stunting',
    component: 'children_health',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'DHS',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 60 },
    thresholds: { warning: 20, critical: 35, emergency: 50 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Children under 5 with stunting (low height-for-age)'
  }),

  'VU.VG.ECO-UNEMP': defineIndicator({
    id: 'VU.VG.ECO-UNEMP',
    name: 'Unemployment',
    component: 'economic_vulnerable',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'ILO/NBS',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 50 },
    thresholds: { warning: 10, critical: 20, emergency: 35 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Unemployment rate'
  }),

  'VU.VG.ECO-DISAFF': defineIndicator({
    id: 'VU.VG.ECO-DISAFF',
    name: 'Disaster Affected People',
    component: 'economic_vulnerable',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    unit: 'persons',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'EM-DAT',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 100000, method: 'log' },
    thresholds: { warning: 5000, critical: 25000, emergency: 50000 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'People affected by disasters annually'
  }),

  // ==========================================================================
  // LACK OF COPING CAPACITY - INFRASTRUCTURE (20 indicators)
  // ==========================================================================

  'CC.INF.HC-EXP': defineIndicator({
    id: 'CC.INF.HC-EXP',
    name: 'Health Expenditure per Capita',
    component: 'access_health',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: 'USD',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'WHO',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 500, method: 'log' },
    thresholds: { warning: 50, critical: 30, emergency: 15 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Current health expenditure per capita in USD'
  }),

  'CC.INF.HC-PHY': defineIndicator({
    id: 'CC.INF.HC-PHY',
    name: 'Physicians Density',
    component: 'access_health',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: 'per 10k',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'WHO',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 30 },
    thresholds: { warning: 5, critical: 2, emergency: 0.5 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Physicians per 10,000 population'
  }),

  'CC.INF.HC-NUR': defineIndicator({
    id: 'CC.INF.HC-NUR',
    name: 'Nurses and Midwives Density',
    component: 'access_health',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: 'per 10k',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'WHO/MoH',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 50 },
    thresholds: { warning: 10, critical: 5, emergency: 2 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Nurses and midwives per 10,000 population'
  }),

  'CC.INF.HC-FAC': defineIndicator({
    id: 'CC.INF.HC-FAC',
    name: 'Health Facility Density',
    component: 'access_health',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: 'per 100k',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'MoH',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 20 },
    thresholds: { warning: 5, critical: 3, emergency: 1 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Health facilities per 100,000 population'
  }),

  'CC.INF.HC-BCG': defineIndicator({
    id: 'CC.INF.HC-BCG',
    name: 'BCG Immunization Coverage',
    component: 'access_health',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'WHO/MoH',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 80, critical: 60, emergency: 40 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'BCG vaccination coverage among infants'
  }),

  'CC.INF.HC-DTP': defineIndicator({
    id: 'CC.INF.HC-DTP',
    name: 'DTP3 Immunization Coverage',
    component: 'access_health',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'WHO/MoH',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 80, critical: 60, emergency: 40 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'DTP3 vaccination coverage among infants'
  }),

  'CC.INF.HC-MEASLES': defineIndicator({
    id: 'CC.INF.HC-MEASLES',
    name: 'Measles Immunization Coverage',
    component: 'access_health',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'WHO/MoH',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 85, critical: 70, emergency: 50 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Measles vaccination coverage among children'
  }),

  'CC.INF.ECO-GDP': defineIndicator({
    id: 'CC.INF.ECO-GDP',
    name: 'GDP per Capita',
    component: 'economic_capacity',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: 'USD',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'World Bank',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 5000, method: 'log' },
    thresholds: { warning: 1000, critical: 500, emergency: 250 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'GDP per capita in current USD'
  }),

  'CC.INF.ECO-IWI': defineIndicator({
    id: 'CC.INF.ECO-IWI',
    name: 'International Wealth Index',
    component: 'economic_capacity',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'DHS',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 40, critical: 25, emergency: 10 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'International Wealth Index score'
  }),

  'CC.INF.ECO-INC': defineIndicator({
    id: 'CC.INF.ECO-INC',
    name: 'Household Income',
    component: 'economic_capacity',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: 'TZS',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'NBS HBS',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 5000000, method: 'log' },
    thresholds: { warning: 1000000, critical: 500000, emergency: 200000 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Average monthly household income in TZS'
  }),

  'CC.INF.WASH-SAN': defineIndicator({
    id: 'CC.INF.WASH-SAN',
    name: 'Basic Sanitation Access',
    component: 'wash',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'JMP/WHO/UNICEF',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 50, critical: 30, emergency: 15 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Population with access to basic sanitation'
  }),

  'CC.INF.WASH-WF': defineIndicator({
    id: 'CC.INF.WASH-WF',
    name: 'Basic Water Access',
    component: 'wash',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'JMP/WHO/UNICEF',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 60, critical: 40, emergency: 20 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Population with access to safe drinking water'
  }),

  'CC.INF.COM-ROAD': defineIndicator({
    id: 'CC.INF.COM-ROAD',
    name: 'Unpaved Roads',
    component: 'communication',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'TANROADS',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 60, critical: 80, emergency: 95 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Percentage of roads that are unpaved'
  }),

  'CC.INF.COM-ELEC': defineIndicator({
    id: 'CC.INF.COM-ELEC',
    name: 'Electricity Access',
    component: 'communication',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'TANESCO/REA',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 30, critical: 15, emergency: 5 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Population with access to electricity'
  }),

  'CC.INF.COM-INT': defineIndicator({
    id: 'CC.INF.COM-INT',
    name: 'Internet Access',
    component: 'communication',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'TCRA',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 20, critical: 10, emergency: 3 },
    priority: DATA_COLLECTION_PRIORITY.LOW,
    description: 'Population with internet access'
  }),

  'CC.INF.COM-PHONE': defineIndicator({
    id: 'CC.INF.COM-PHONE',
    name: 'Mobile Phone Ownership',
    component: 'communication',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'TCRA/DHS',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 50, critical: 30, emergency: 15 },
    priority: DATA_COLLECTION_PRIORITY.LOW,
    description: 'Households with mobile phone'
  }),

  'CC.INF.EDU-YRS': defineIndicator({
    id: 'CC.INF.EDU-YRS',
    name: 'Mean Years of Schooling',
    component: 'education',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: 'years',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'UNESCO/MoE',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 12 },
    thresholds: { warning: 6, critical: 4, emergency: 2 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Average years of schooling for adults 25+'
  }),

  'CC.INF.EDU-ALIT': defineIndicator({
    id: 'CC.INF.EDU-ALIT',
    name: 'Adult Literacy Rate',
    component: 'education',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'UNESCO',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 70, critical: 50, emergency: 30 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Adult literacy rate (15+ years)'
  }),

  'CC.INF.EDU-PRI': defineIndicator({
    id: 'CC.INF.EDU-PRI',
    name: 'Primary School Enrollment',
    component: 'education',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'UNESCO/MoE',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 80, critical: 60, emergency: 40 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Net primary school enrollment rate'
  }),

  'CC.INF.EDU-SEC': defineIndicator({
    id: 'CC.INF.EDU-SEC',
    name: 'Secondary School Enrollment',
    component: 'education',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'UNESCO/MoE',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 50, critical: 30, emergency: 15 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Net secondary school enrollment rate'
  }),

  // ==========================================================================
  // LACK OF COPING CAPACITY - INSTITUTIONAL (8 indicators)
  // ==========================================================================

  'CC.INS.DRR-SEN': defineIndicator({
    id: 'CC.INS.DRR-SEN',
    name: 'Sendai Framework Progress',
    component: 'drr_implementation',
    category: CATEGORY_TYPES.INSTITUTIONAL,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: 'score',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'UNDRR',
    sourceUrl: 'https://sendaimonitor.undrr.org/',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 50, critical: 30, emergency: 15 },
    priority: DATA_COLLECTION_PRIORITY.LOW,
    description: 'Sendai Framework implementation score'
  }),

  'CC.INS.DRR-TCK': defineIndicator({
    id: 'CC.INS.DRR-TCK',
    name: 'Traditional Community Knowledge',
    component: 'drr_implementation',
    category: CATEGORY_TYPES.INSTITUTIONAL,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'PMO-DMD',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 10 },
    thresholds: { warning: 5, critical: 3, emergency: 1 },
    priority: DATA_COLLECTION_PRIORITY.LOW,
    description: 'Integration of traditional DRR knowledge'
  }),

  'CC.INS.DRR-EWS': defineIndicator({
    id: 'CC.INS.DRR-EWS',
    name: 'Early Warning System Coverage',
    component: 'drr_implementation',
    category: CATEGORY_TYPES.INSTITUTIONAL,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'TMA/PMO-DMD',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 50, critical: 30, emergency: 15 },
    priority: DATA_COLLECTION_PRIORITY.HIGH,
    description: 'Population covered by early warning systems'
  }),

  'CC.INS.DRR-PLAN': defineIndicator({
    id: 'CC.INS.DRR-PLAN',
    name: 'DRR Plans in Place',
    component: 'drr_implementation',
    category: CATEGORY_TYPES.INSTITUTIONAL,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: '%',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'PMO-DMD',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: 0, refMax: 100 },
    thresholds: { warning: 60, critical: 40, emergency: 20 },
    priority: DATA_COLLECTION_PRIORITY.MEDIUM,
    description: 'Percentage of districts with DRR plans'
  }),

  'CC.INS.GOV-EFF': defineIndicator({
    id: 'CC.INS.GOV-EFF',
    name: 'Government Effectiveness',
    component: 'governance',
    category: CATEGORY_TYPES.INSTITUTIONAL,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'World Bank WGI',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: -2.5, refMax: 2.5 },
    thresholds: { warning: 0, critical: -0.5, emergency: -1 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Government effectiveness index (-2.5 to +2.5)'
  }),

  'CC.INS.GOV-SCI': defineIndicator({
    id: 'CC.INS.GOV-SCI',
    name: 'Subnational Corruption Index',
    component: 'governance',
    category: CATEGORY_TYPES.INSTITUTIONAL,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.ADM1,
    source: 'Afrobarometer',
    polarity: POLARITY.NEGATIVE,
    normalization: { refMin: 0, refMax: 10 },
    thresholds: { warning: 4, critical: 6, emergency: 8 },
    priority: DATA_COLLECTION_PRIORITY.LOW,
    description: 'Perceived corruption at subnational level'
  }),

  'CC.INS.GOV-RULE': defineIndicator({
    id: 'CC.INS.GOV-RULE',
    name: 'Rule of Law',
    component: 'governance',
    category: CATEGORY_TYPES.INSTITUTIONAL,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'World Bank WGI',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: -2.5, refMax: 2.5 },
    thresholds: { warning: 0, critical: -0.5, emergency: -1 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Rule of law index (-2.5 to +2.5)'
  }),

  'CC.INS.GOV-VOI': defineIndicator({
    id: 'CC.INS.GOV-VOI',
    name: 'Voice and Accountability',
    component: 'governance',
    category: CATEGORY_TYPES.INSTITUTIONAL,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    unit: 'index',
    resolution: RESOLUTION_LEVELS.NATIONAL,
    source: 'World Bank WGI',
    polarity: POLARITY.POSITIVE,
    transform: 'invert',
    normalization: { refMin: -2.5, refMax: 2.5 },
    thresholds: { warning: 0, critical: -0.5, emergency: -1 },
    priority: DATA_COLLECTION_PRIORITY.BASELINE,
    description: 'Voice and accountability index'
  })
};

// ============================================================================
// COMPONENT DEFINITIONS (Aggregation Level 1)
// ============================================================================

/**
 * Creates a standardized component definition
 */
function defineComponent({
  id,
  name,
  category,
  dimension,
  aggregation = AGGREGATION_METHODS.ARITHMETIC_MEAN,
  indicators,
  weight = 1.0,
  description = null
}) {
  return {
    id,
    name,
    description: description || `${name} component`,
    category,
    dimension,
    aggregation,
    weight,
    indicators,

    // Derived
    indicatorCount: indicators.length,

    // Metadata
    createdAt: new Date().toISOString()
  };
}

export const COMPONENT_DEFINITIONS = {
  // ==========================================================================
  // HAZARD - NATURAL (13 components)
  // ==========================================================================

  coastal_hazards: defineComponent({
    id: 'coastal_hazards',
    name: 'Coastal Hazards',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    indicators: ['HA.NAT.CH-ERO', 'HA.NAT.CH-SEA'],
    description: 'Coastal erosion and sea level rise hazards'
  }),

  drought: defineComponent({
    id: 'drought',
    name: 'Drought',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    indicators: ['HA.NAT.DR-FRE', 'HA.NAT.DR-SPI'],
    description: 'Drought frequency and severity'
  }),

  earthquake: defineComponent({
    id: 'earthquake',
    name: 'Earthquake',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    indicators: ['HA.NAT.EQ-EXP'],
    description: 'Seismic hazard exposure'
  }),

  environmental_degradation: defineComponent({
    id: 'environmental_degradation',
    name: 'Environmental Degradation',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['HA.NAT.ED-DEF', 'HA.NAT.DE-ERO'],
    description: 'Deforestation and soil erosion'
  }),

  flood: defineComponent({
    id: 'flood',
    name: 'Flood',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    indicators: ['HA.NAT.FL-EXP', 'HA.NAT.FL-FRE'],
    description: 'Flood exposure and frequency'
  }),

  heatwave: defineComponent({
    id: 'heatwave',
    name: 'Heatwave',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    indicators: ['HA.NAT.HW-EXP'],
    description: 'Extreme heat exposure'
  }),

  landslide: defineComponent({
    id: 'landslide',
    name: 'Landslide',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    indicators: ['HA.NAT.LS-EXP'],
    description: 'Landslide hazard exposure'
  }),

  lightning: defineComponent({
    id: 'lightning',
    name: 'Lightning',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    indicators: ['HA.NAT.LI-CAS'],
    description: 'Lightning strike hazard'
  }),

  storms_cyclone: defineComponent({
    id: 'storms_cyclone',
    name: 'Storms and Cyclone',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    indicators: ['HA.NAT.ST-TC', 'HA.NAT.ST-TC2', 'HA.NAT.ST-ST'],
    description: 'Tropical cyclones and severe storms'
  }),

  volcano: defineComponent({
    id: 'volcano',
    name: 'Volcano',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    indicators: ['HA.NAT.VC-EXP'],
    description: 'Volcanic hazard exposure'
  }),

  wildfire: defineComponent({
    id: 'wildfire',
    name: 'Wildfire',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['HA.NAT.WF-BURN', 'HA.NAT.WF-FWI'],
    description: 'Wildfire occurrence and conditions'
  }),

  zoonoses: defineComponent({
    id: 'zoonoses',
    name: 'Zoonoses, Plants and Pests',
    category: CATEGORY_TYPES.NATURAL,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['HA.NAT.ZPP-AD', 'HA.NAT.ZPP-PD', 'HA.NAT.ZPP-PE'],
    description: 'Animal/plant diseases and pest infestations'
  }),

  // ==========================================================================
  // HAZARD - HUMAN (5 components)
  // ==========================================================================

  conflict_risk: defineComponent({
    id: 'conflict_risk',
    name: 'Conflict Risk',
    category: CATEGORY_TYPES.HUMAN,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    indicators: ['HA.HUM.CR-GCRI'],
    description: 'Probability of conflict occurrence'
  }),

  conflict_intensity: defineComponent({
    id: 'conflict_intensity',
    name: 'Conflict Intensity',
    category: CATEGORY_TYPES.HUMAN,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    indicators: ['HA.HUM.CI-CBAR'],
    description: 'Intensity of ongoing conflicts'
  }),

  hazardous_material: defineComponent({
    id: 'hazardous_material',
    name: 'Hazardous Material',
    category: CATEGORY_TYPES.HUMAN,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    indicators: ['HA.HUM.HMAT'],
    description: 'Hazardous material incident risk'
  }),

  internal_violence: defineComponent({
    id: 'internal_violence',
    name: 'Internal Violence',
    category: CATEGORY_TYPES.HUMAN,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['HA.HUM.VIO-EVE', 'HA.HUM.VIO-FAT'],
    description: 'Violent incidents and fatalities'
  }),

  vehicle_accidents: defineComponent({
    id: 'vehicle_accidents',
    name: 'Vehicle Accidents',
    category: CATEGORY_TYPES.HUMAN,
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    indicators: ['HA.HUM.ACC'],
    description: 'Road traffic accident risk'
  }),

  // ==========================================================================
  // VULNERABILITY - SOCIO-ECONOMIC (4 components)
  // ==========================================================================

  development_poverty: defineComponent({
    id: 'development_poverty',
    name: 'Development and Poverty',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['VU.SE.POV-HDI', 'VU.SE.POV-MPI', 'VU.SE.POV-GDI', 'VU.SE.POV-GINI'],
    description: 'Human development and poverty levels'
  }),

  economic_dependency: defineComponent({
    id: 'economic_dependency',
    name: 'Economic Dependency',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['VU.SE.DEP-ODA', 'VU.SE.DEP-REM', 'VU.SE.DEP-DR'],
    description: 'External economic dependencies'
  }),

  habitat: defineComponent({
    id: 'habitat',
    name: 'Habitat',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['VU.SE.HAB-INF', 'VU.SE.HAB-RISK', 'VU.SE.HAB-URB'],
    description: 'Housing and settlement conditions'
  }),

  livelihoods: defineComponent({
    id: 'livelihoods',
    name: 'Livelihoods',
    category: CATEGORY_TYPES.SOCIO_ECONOMIC,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['VU.SE.LV-FS', 'VU.SE.LV-IPC'],
    description: 'Food security and livelihoods'
  }),

  // ==========================================================================
  // VULNERABILITY - VULNERABLE GROUPS (4 components)
  // ==========================================================================

  displaced_people: defineComponent({
    id: 'displaced_people',
    name: 'Displaced People',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['VU.VG.DP-IDP', 'VU.VG.DP-REF'],
    description: 'IDPs and refugees'
  }),

  health_conditions: defineComponent({
    id: 'health_conditions',
    name: 'Health Conditions',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['VU.VG.HC-LEXP', 'VU.VG.HC-MALAPREV', 'VU.VG.HC-MALAMORT', 'VU.VG.HC-TUB', 'VU.VG.HC-CHO'],
    description: 'Disease burden and health outcomes'
  }),

  children_health: defineComponent({
    id: 'children_health',
    name: 'Children Health and Nutrition',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['VU.VG.CH-MORTNEO', 'VU.VG.CH-MORTINF', 'VU.VG.CH-MORTCH', 'VU.VG.CH-UW', 'VU.VG.CH-STN'],
    description: 'Child mortality and malnutrition'
  }),

  economic_vulnerable: defineComponent({
    id: 'economic_vulnerable',
    name: 'Economic Vulnerability',
    category: CATEGORY_TYPES.VULNERABLE_GROUPS,
    dimension: DIMENSION_TYPES.VULNERABILITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['VU.VG.ECO-UNEMP', 'VU.VG.ECO-DISAFF'],
    description: 'Unemployment and disaster-affected populations'
  }),

  // ==========================================================================
  // COPING CAPACITY - INFRASTRUCTURE (5 components)
  // ==========================================================================

  access_health: defineComponent({
    id: 'access_health',
    name: 'Access to Health Care',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['CC.INF.HC-EXP', 'CC.INF.HC-PHY', 'CC.INF.HC-NUR', 'CC.INF.HC-FAC', 'CC.INF.HC-BCG', 'CC.INF.HC-DTP', 'CC.INF.HC-MEASLES'],
    description: 'Healthcare access and services'
  }),

  economic_capacity: defineComponent({
    id: 'economic_capacity',
    name: 'Economic Capacity',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['CC.INF.ECO-GDP', 'CC.INF.ECO-IWI', 'CC.INF.ECO-INC'],
    description: 'Economic resources and wealth'
  }),

  wash: defineComponent({
    id: 'wash',
    name: 'WASH',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['CC.INF.WASH-SAN', 'CC.INF.WASH-WF'],
    description: 'Water, sanitation, and hygiene'
  }),

  communication: defineComponent({
    id: 'communication',
    name: 'Communication',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['CC.INF.COM-ROAD', 'CC.INF.COM-ELEC', 'CC.INF.COM-INT', 'CC.INF.COM-PHONE'],
    description: 'Transportation and communication infrastructure'
  }),

  education: defineComponent({
    id: 'education',
    name: 'Education',
    category: CATEGORY_TYPES.INFRASTRUCTURE,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['CC.INF.EDU-YRS', 'CC.INF.EDU-ALIT', 'CC.INF.EDU-PRI', 'CC.INF.EDU-SEC'],
    description: 'Education access and attainment'
  }),

  // ==========================================================================
  // COPING CAPACITY - INSTITUTIONAL (2 components)
  // ==========================================================================

  drr_implementation: defineComponent({
    id: 'drr_implementation',
    name: 'DRR Implementation',
    category: CATEGORY_TYPES.INSTITUTIONAL,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['CC.INS.DRR-SEN', 'CC.INS.DRR-TCK', 'CC.INS.DRR-EWS', 'CC.INS.DRR-PLAN'],
    description: 'Disaster risk reduction implementation'
  }),

  governance: defineComponent({
    id: 'governance',
    name: 'Governance',
    category: CATEGORY_TYPES.INSTITUTIONAL,
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    indicators: ['CC.INS.GOV-EFF', 'CC.INS.GOV-SCI', 'CC.INS.GOV-RULE', 'CC.INS.GOV-VOI'],
    description: 'Governance quality and effectiveness'
  })
};

// ============================================================================
// CATEGORY DEFINITIONS (Aggregation Level 2)
// ============================================================================

/**
 * Creates a standardized category definition
 */
function defineCategory({
  id,
  name,
  dimension,
  aggregation = AGGREGATION_METHODS.ARITHMETIC_MEAN,
  components,
  weight = 0.5,
  description = null
}) {
  return {
    id,
    name,
    description: description || `${name} category`,
    dimension,
    aggregation,
    weight, // Weight within dimension
    components,

    // Derived
    componentCount: components.length,

    // Metadata
    createdAt: new Date().toISOString()
  };
}

export const CATEGORY_DEFINITIONS = {
  NATURAL: defineCategory({
    id: 'NATURAL',
    name: 'Natural Hazards',
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    weight: 0.5,
    components: [
      'coastal_hazards', 'drought', 'earthquake', 'environmental_degradation',
      'flood', 'heatwave', 'landslide', 'lightning', 'storms_cyclone',
      'volcano', 'wildfire', 'zoonoses'
    ],
    description: 'Natural disaster hazards and environmental risks'
  }),

  HUMAN: defineCategory({
    id: 'HUMAN',
    name: 'Human Hazards',
    dimension: DIMENSION_TYPES.HAZARD,
    aggregation: AGGREGATION_METHODS.MAX,
    weight: 0.5,
    components: [
      'conflict_risk', 'conflict_intensity', 'hazardous_material',
      'internal_violence', 'vehicle_accidents'
    ],
    description: 'Human-caused hazards and conflicts'
  }),

  SOCIO_ECONOMIC: defineCategory({
    id: 'SOCIO_ECONOMIC',
    name: 'Socio-Economic Vulnerability',
    dimension: DIMENSION_TYPES.VULNERABILITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    weight: 0.5,
    components: ['development_poverty', 'economic_dependency', 'habitat', 'livelihoods'],
    description: 'Socio-economic vulnerability factors'
  }),

  VULNERABLE_GROUPS: defineCategory({
    id: 'VULNERABLE_GROUPS',
    name: 'Vulnerable Groups',
    dimension: DIMENSION_TYPES.VULNERABILITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    weight: 0.5,
    components: ['displaced_people', 'health_conditions', 'children_health', 'economic_vulnerable'],
    description: 'Vulnerable population groups'
  }),

  INFRASTRUCTURE: defineCategory({
    id: 'INFRASTRUCTURE',
    name: 'Infrastructure',
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    weight: 0.5,
    components: ['access_health', 'economic_capacity', 'wash', 'communication', 'education'],
    description: 'Physical infrastructure capacity'
  }),

  INSTITUTIONAL: defineCategory({
    id: 'INSTITUTIONAL',
    name: 'Institutional',
    dimension: DIMENSION_TYPES.LACK_OF_COPING_CAPACITY,
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    weight: 0.5,
    components: ['drr_implementation', 'governance'],
    description: 'Institutional and governance capacity'
  })
};

// ============================================================================
// DIMENSION DEFINITIONS (Aggregation Level 3)
// ============================================================================

/**
 * Creates a standardized dimension definition
 */
function defineDimension({
  id,
  name,
  aggregation = AGGREGATION_METHODS.ARITHMETIC_MEAN,
  categories,
  weight = 1/3,
  description = null
}) {
  return {
    id,
    name,
    description: description || `${name} dimension`,
    aggregation,
    weight, // Weight in final INFORM Risk calculation
    categories,

    // Derived
    categoryCount: categories.length,

    // Metadata
    createdAt: new Date().toISOString()
  };
}

export const DIMENSION_DEFINITIONS = {
  HAZARD: defineDimension({
    id: 'HAZARD',
    name: 'Hazard and Exposure',
    aggregation: AGGREGATION_METHODS.MAX,
    weight: 1/3,
    categories: ['NATURAL', 'HUMAN'],
    description: 'Exposure to natural and human-caused hazards'
  }),

  VULNERABILITY: defineDimension({
    id: 'VULNERABILITY',
    name: 'Vulnerability',
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    weight: 1/3,
    categories: ['SOCIO_ECONOMIC', 'VULNERABLE_GROUPS'],
    description: 'Socio-economic vulnerability and susceptibility'
  }),

  LACK_OF_COPING_CAPACITY: defineDimension({
    id: 'LACK_OF_COPING_CAPACITY',
    name: 'Lack of Coping Capacity',
    aggregation: AGGREGATION_METHODS.ARITHMETIC_MEAN,
    weight: 1/3,
    categories: ['INFRASTRUCTURE', 'INSTITUTIONAL'],
    description: 'Lack of capacity to cope with and recover from disasters'
  })
};

// ============================================================================
// INFORM RISK INDEX FORMULA
// ============================================================================

export const INFORM_FORMULA = {
  name: 'INFORM Risk Index',
  version: '2023',

  // Final aggregation formula: geometric mean of three dimensions
  formula: 'Risk = ∛(Hazard × Vulnerability × LackOfCopingCapacity)',

  // Alternative formulas for different contexts
  alternatives: {
    arithmetic: 'Risk = (H + V + CC) / 3',
    weighted: 'Risk = w1×H + w2×V + w3×CC',
    maxBased: 'Risk = max(H, V, CC)'
  },

  // Calculate risk index
  calculate: (hazard, vulnerability, lackOfCopingCapacity) => {
    if ([hazard, vulnerability, lackOfCopingCapacity].some(v => v === null || v === undefined)) {
      return null;
    }
    // Geometric mean (cube root of product)
    return Math.pow(hazard * vulnerability * lackOfCopingCapacity, 1/3);
  },

  // Get risk class from index
  classify: (riskIndex) => getRiskClass(riskIndex)
};

// ============================================================================
// GLOBAL API INTEGRATIONS
// ============================================================================

export const API_INTEGRATIONS = {
  // Hazard APIs
  USGS_EARTHQUAKE: {
    id: 'usgs_earthquake',
    name: 'USGS Earthquake API',
    baseUrl: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
    indicators: ['HA.NAT.EQ-EXP'],
    updateFrequency: 'real-time',
    authRequired: false,
    rateLimit: { requests: 100, period: 'minute' },
    documentation: 'https://earthquake.usgs.gov/fdsnws/event/1/'
  },

  NASA_FIRMS: {
    id: 'nasa_firms',
    name: 'NASA FIRMS Fire Data',
    baseUrl: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
    indicators: ['HA.NAT.WF-BURN'],
    updateFrequency: 'daily',
    authRequired: true,
    apiKeyEnv: 'NASA_FIRMS_API_KEY',
    rateLimit: { requests: 10, period: 'minute' },
    documentation: 'https://firms.modaps.eosdis.nasa.gov/api/'
  },

  ACLED: {
    id: 'acled',
    name: 'ACLED Conflict Data',
    baseUrl: 'https://api.acleddata.com/acled/read',
    indicators: ['HA.HUM.VIO-EVE', 'HA.HUM.VIO-FAT'],
    updateFrequency: 'weekly',
    authRequired: true,
    apiKeyEnv: 'ACLED_API_KEY',
    rateLimit: { requests: 60, period: 'hour' },
    documentation: 'https://acleddata.com/acleddatanew/wp-content/uploads/dlm_uploads/2023/11/API-User-Guide-July-2023.pdf'
  },

  GDACS: {
    id: 'gdacs',
    name: 'Global Disaster Alert (GDACS)',
    baseUrl: 'https://www.gdacs.org/gdacsapi/api/events/geteventlist',
    indicators: ['HA.NAT.FL-EXP', 'HA.NAT.ST-TC'],
    updateFrequency: 'real-time',
    authRequired: false,
    rateLimit: { requests: 30, period: 'minute' },
    documentation: 'https://www.gdacs.org/Knowledge/overview.aspx'
  },

  OPEN_METEO: {
    id: 'open_meteo',
    name: 'Open-Meteo Weather API',
    baseUrl: 'https://api.open-meteo.com/v1/forecast',
    indicators: ['HA.NAT.HW-EXP', 'HA.NAT.DR-SPI'],
    updateFrequency: 'hourly',
    authRequired: false,
    rateLimit: { requests: 10000, period: 'day' },
    documentation: 'https://open-meteo.com/en/docs'
  },

  WORLD_BANK: {
    id: 'world_bank',
    name: 'World Bank Data API',
    baseUrl: 'https://api.worldbank.org/v2/country/TZA/indicator',
    indicators: ['CC.INF.ECO-GDP', 'VU.SE.DEP-ODA', 'VU.SE.POV-GINI'],
    updateFrequency: 'annual',
    authRequired: false,
    rateLimit: { requests: 100, period: 'minute' },
    documentation: 'https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information'
  },

  INFORM_GLOBAL: {
    id: 'inform_global',
    name: 'INFORM Global Risk Index',
    baseUrl: 'https://drmkc.jrc.ec.europa.eu/inform-index/API',
    indicators: ['HA.HUM.CR-GCRI'],
    updateFrequency: 'annual',
    authRequired: false,
    documentation: 'https://drmkc.jrc.ec.europa.eu/inform-index'
  },

  HDX: {
    id: 'hdx',
    name: 'Humanitarian Data Exchange',
    baseUrl: 'https://data.humdata.org/api/3/action',
    indicators: ['VU.VG.DP-IDP', 'VU.VG.DP-REF'],
    updateFrequency: 'weekly',
    authRequired: false,
    rateLimit: { requests: 100, period: 'minute' },
    documentation: 'https://data.humdata.org/documentation'
  },

  IPC: {
    id: 'ipc',
    name: 'IPC Food Security',
    baseUrl: 'https://api.ipcinfo.org/api',
    indicators: ['VU.SE.LV-IPC'],
    updateFrequency: 'quarterly',
    authRequired: true,
    documentation: 'https://www.ipcinfo.org/'
  },

  CHIRPS: {
    id: 'chirps',
    name: 'CHIRPS Rainfall Data',
    baseUrl: 'https://data.chc.ucsb.edu/products/CHIRPS-2.0/',
    indicators: ['HA.NAT.DR-SPI'],
    updateFrequency: 'daily',
    authRequired: false,
    documentation: 'https://www.chc.ucsb.edu/data/chirps'
  }
};

// ============================================================================
// DATA COLLECTION SOURCES (Tanzania-Specific)
// ============================================================================

export const TANZANIA_DATA_SOURCES = {
  NBS: {
    id: 'nbs',
    name: 'National Bureau of Statistics',
    type: 'government',
    ministry: 'Ministry of Finance',
    website: 'https://www.nbs.go.tz',
    indicators: ['VU.SE.DEP-DR', 'VU.SE.HAB-URB', 'CC.INF.ECO-INC', 'VU.VG.ECO-UNEMP'],
    updateFrequency: 'annual',
    contactEmail: 'dg@nbs.go.tz',
    dataFormats: ['Excel', 'PDF', 'CSV']
  },

  TMA: {
    id: 'tma',
    name: 'Tanzania Meteorological Authority',
    type: 'government',
    ministry: 'Ministry of Works and Transport',
    website: 'https://www.meteo.go.tz',
    indicators: ['HA.NAT.DR-FRE', 'HA.NAT.DR-SPI', 'HA.NAT.FL-EXP', 'HA.NAT.HW-EXP', 'HA.NAT.LI-CAS'],
    updateFrequency: 'daily',
    contactEmail: 'met@meteo.go.tz',
    hasAPI: true
  },

  PMO_DMD: {
    id: 'pmo_dmd',
    name: "Prime Minister's Office - Disaster Management",
    type: 'government',
    ministry: "Prime Minister's Office",
    indicators: ['CC.INS.DRR-EWS', 'CC.INS.DRR-TCK', 'CC.INS.DRR-PLAN', 'VU.VG.ECO-DISAFF'],
    updateFrequency: 'quarterly',
    contactEmail: 'ps@pmo.go.tz'
  },

  MOH: {
    id: 'moh',
    name: 'Ministry of Health',
    type: 'government',
    website: 'https://www.moh.go.tz',
    indicators: ['VU.VG.HC-MALAPREV', 'VU.VG.HC-CHO', 'CC.INF.HC-FAC', 'CC.INF.HC-NUR',
                 'VU.VG.CH-MORTNEO', 'VU.VG.CH-MORTINF', 'CC.INF.HC-BCG', 'CC.INF.HC-DTP'],
    updateFrequency: 'quarterly',
    contactEmail: 'ps@moh.go.tz',
    dataSystem: 'DHIS2'
  },

  TANROADS: {
    id: 'tanroads',
    name: 'Tanzania National Roads Agency',
    type: 'government',
    ministry: 'Ministry of Works and Transport',
    website: 'https://www.tanroads.go.tz',
    indicators: ['CC.INF.COM-ROAD'],
    updateFrequency: 'annual'
  },

  TCRA: {
    id: 'tcra',
    name: 'Tanzania Communications Regulatory Authority',
    type: 'government',
    website: 'https://www.tcra.go.tz',
    indicators: ['CC.INF.COM-INT', 'CC.INF.COM-PHONE'],
    updateFrequency: 'quarterly'
  },

  REA: {
    id: 'rea',
    name: 'Rural Energy Agency',
    type: 'government',
    ministry: 'Ministry of Energy',
    website: 'https://www.rea.go.tz',
    indicators: ['CC.INF.COM-ELEC'],
    updateFrequency: 'quarterly'
  },

  MOE: {
    id: 'moe',
    name: 'Ministry of Education',
    type: 'government',
    website: 'https://www.moe.go.tz',
    indicators: ['CC.INF.EDU-YRS', 'CC.INF.EDU-PRI', 'CC.INF.EDU-SEC'],
    updateFrequency: 'annual'
  },

  DHS: {
    id: 'dhs',
    name: 'Demographic and Health Survey',
    type: 'survey',
    website: 'https://dhsprogram.com',
    indicators: ['VU.VG.CH-UW', 'VU.VG.CH-STN', 'VU.SE.POV-HDI', 'CC.INF.ECO-IWI'],
    updateFrequency: '5-yearly',
    lastSurvey: '2022',
    nextSurvey: '2027'
  },

  CENSUS: {
    id: 'census',
    name: 'National Population Census',
    type: 'survey',
    source: 'NBS',
    indicators: ['VU.SE.DEP-DR', 'VU.SE.HAB-URB'],
    updateFrequency: '10-yearly',
    lastCensus: '2022',
    nextCensus: '2032'
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets all indicators for a component
 */
export function getComponentIndicators(componentId) {
  const component = COMPONENT_DEFINITIONS[componentId];
  if (!component) return [];
  return component.indicators.map(id => INDICATOR_DEFINITIONS[id]).filter(Boolean);
}

/**
 * Gets all components for a category
 */
export function getCategoryComponents(categoryId) {
  const category = CATEGORY_DEFINITIONS[categoryId];
  if (!category) return [];
  return category.components.map(id => COMPONENT_DEFINITIONS[id]).filter(Boolean);
}

/**
 * Gets all categories for a dimension
 */
export function getDimensionCategories(dimensionId) {
  const dimension = DIMENSION_DEFINITIONS[dimensionId];
  if (!dimension) return [];
  return dimension.categories.map(id => CATEGORY_DEFINITIONS[id]).filter(Boolean);
}

/**
 * Gets complete indicator hierarchy
 */
export function getIndicatorHierarchy(indicatorId) {
  const indicator = INDICATOR_DEFINITIONS[indicatorId];
  if (!indicator) return null;

  const component = COMPONENT_DEFINITIONS[indicator.component];
  const category = CATEGORY_DEFINITIONS[indicator.category];
  const dimension = DIMENSION_DEFINITIONS[indicator.dimension];

  return {
    indicator,
    component,
    category,
    dimension
  };
}

/**
 * Gets all indicators by priority
 */
export function getIndicatorsByPriority(priorityLevel) {
  return Object.values(INDICATOR_DEFINITIONS)
    .filter(ind => ind.priority.level === priorityLevel)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Gets all indicators that have API endpoints
 */
export function getAPIIndicators() {
  return Object.values(INDICATOR_DEFINITIONS)
    .filter(ind => ind.apiEndpoint)
    .map(ind => ({
      id: ind.id,
      name: ind.name,
      endpoint: ind.apiEndpoint,
      source: ind.source
    }));
}

/**
 * Gets data quality score for a set of indicator values
 */
export function calculateDataQuality(indicatorValues) {
  const totalIndicators = Object.keys(INDICATOR_DEFINITIONS).length;
  const providedIndicators = Object.keys(indicatorValues).filter(
    key => indicatorValues[key] !== null && indicatorValues[key] !== undefined
  ).length;

  const completeness = (providedIndicators / totalIndicators) * 100;

  for (const [level, config] of Object.entries(ADVANCED_SCHEMA_CONFIG.dataQuality)) {
    if (completeness >= config.min) {
      return {
        score: completeness,
        level,
        label: config.label,
        providedIndicators,
        totalIndicators,
        missingIndicators: totalIndicators - providedIndicators
      };
    }
  }

  return {
    score: 0,
    level: 'poor',
    label: 'Poor',
    providedIndicators: 0,
    totalIndicators,
    missingIndicators: totalIndicators
  };
}

/**
 * Gets schema statistics
 */
export function getSchemaStats() {
  return {
    version: ADVANCED_SCHEMA_CONFIG.version,
    indicators: Object.keys(INDICATOR_DEFINITIONS).length,
    components: Object.keys(COMPONENT_DEFINITIONS).length,
    categories: Object.keys(CATEGORY_DEFINITIONS).length,
    dimensions: Object.keys(DIMENSION_DEFINITIONS).length,
    apiIntegrations: Object.keys(API_INTEGRATIONS).length,
    dataSources: Object.keys(TANZANIA_DATA_SOURCES).length,

    byDimension: {
      HAZARD: Object.values(INDICATOR_DEFINITIONS).filter(i => i.dimension === DIMENSION_TYPES.HAZARD).length,
      VULNERABILITY: Object.values(INDICATOR_DEFINITIONS).filter(i => i.dimension === DIMENSION_TYPES.VULNERABILITY).length,
      LACK_OF_COPING_CAPACITY: Object.values(INDICATOR_DEFINITIONS).filter(i => i.dimension === DIMENSION_TYPES.LACK_OF_COPING_CAPACITY).length
    },

    byPriority: {
      critical: getIndicatorsByPriority(1).length,
      high: getIndicatorsByPriority(2).length,
      medium: getIndicatorsByPriority(3).length,
      low: getIndicatorsByPriority(4).length,
      baseline: getIndicatorsByPriority(5).length
    }
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Configuration
  ADVANCED_SCHEMA_CONFIG,

  // Enumerations
  DIMENSION_TYPES,
  CATEGORY_TYPES,
  POLARITY,
  AGGREGATION_METHODS,
  RESOLUTION_LEVELS,
  DATA_COLLECTION_PRIORITY,

  // Schema definitions
  INDICATOR_DEFINITIONS,
  COMPONENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
  DIMENSION_DEFINITIONS,

  // Formula
  INFORM_FORMULA,

  // External integrations
  API_INTEGRATIONS,
  TANZANIA_DATA_SOURCES,

  // Utility functions
  validateIndicatorValue,
  normalizeValue,
  getRiskClass,
  getComponentIndicators,
  getCategoryComponents,
  getDimensionCategories,
  getIndicatorHierarchy,
  getIndicatorsByPriority,
  getAPIIndicators,
  calculateDataQuality,
  getSchemaStats
};
