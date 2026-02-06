/**
 * INFORM CALCULATION SERVICE
 *
 * Implements the official INFORM methodology from:
 * - Generic - Country Model Template - online only.xlsx
 * - Tanzania - Country Model Template.xlsx
 *
 * Formula: Risk = (Hazard × Vulnerability × Lack of Coping Capacity)^(1/3)
 *
 * Aggregation Methods:
 * - Hazard & Exposure: MAX (worst-case scenario)
 * - Vulnerability: Arithmetic Mean
 * - Lack of Coping Capacity: Arithmetic Mean (then inverted)
 * - Final Risk: Geometric Mean of 3 dimensions
 */

// ============================================================================
// INDICATOR DEFINITIONS - Based on official INFORM methodology
// ============================================================================

export const INDICATOR_DEFINITIONS = {
  // HAZARD & EXPOSURE DIMENSION
  flood_exposure: {
    id: 'flood_exposure',
    code: 'HA.NAT.FL',
    name: 'Flood Exposure',
    dimension: 'HAZARD',
    category: 'Natural',
    aggregation: 'MAX',
    polarity: 'NEGATIVE', // Higher = worse
    weight: 1.0,
    unit: 'index (0-10)',
    description: 'Physical exposure to flood hazard'
  },
  drought_exposure: {
    id: 'drought_exposure',
    code: 'HA.NAT.DR',
    name: 'Drought Exposure',
    dimension: 'HAZARD',
    category: 'Natural',
    aggregation: 'MAX',
    polarity: 'NEGATIVE',
    weight: 1.0,
    unit: 'index (0-10)',
    description: 'Physical exposure to drought hazard'
  },
  earthquake_exposure: {
    id: 'earthquake_exposure',
    code: 'HA.NAT.EQ',
    name: 'Earthquake Exposure',
    dimension: 'HAZARD',
    category: 'Natural',
    aggregation: 'MAX',
    polarity: 'NEGATIVE',
    weight: 1.0,
    unit: 'index (0-10)',
    description: 'Physical exposure to seismic hazard'
  },
  conflict_intensity: {
    id: 'conflict_intensity',
    code: 'HA.HUM.CI',
    name: 'Conflict Intensity',
    dimension: 'HAZARD',
    category: 'Human',
    aggregation: 'MAX',
    polarity: 'NEGATIVE',
    weight: 1.0,
    unit: 'index (0-10)',
    description: 'Current conflict intensity level'
  },

  // VULNERABILITY DIMENSION
  development_deprivation: {
    id: 'development_deprivation',
    code: 'VU.SEV.DEP',
    name: 'Development & Deprivation',
    dimension: 'VULNERABILITY',
    category: 'Socio-Economic',
    aggregation: 'MEAN',
    polarity: 'NEGATIVE',
    weight: 1.0,
    unit: 'index (0-10)',
    description: 'Socio-economic vulnerability based on HDI and poverty'
  },
  inequality: {
    id: 'inequality',
    code: 'VU.SEV.INE',
    name: 'Inequality',
    dimension: 'VULNERABILITY',
    category: 'Socio-Economic',
    aggregation: 'MEAN',
    polarity: 'NEGATIVE',
    weight: 1.0,
    unit: 'index (0-10)',
    description: 'Economic and gender inequality'
  },
  food_security: {
    id: 'food_security',
    code: 'VU.VGR.FS',
    name: 'Food Security',
    dimension: 'VULNERABILITY',
    category: 'Vulnerable Groups',
    aggregation: 'MEAN',
    polarity: 'NEGATIVE',
    weight: 1.0,
    unit: 'index (0-10)',
    description: 'Food insecurity and malnutrition levels'
  },
  health_conditions: {
    id: 'health_conditions',
    code: 'VU.VGR.HC',
    name: 'Health Conditions',
    dimension: 'VULNERABILITY',
    category: 'Vulnerable Groups',
    aggregation: 'MEAN',
    polarity: 'NEGATIVE',
    weight: 1.0,
    unit: 'index (0-10)',
    description: 'Population health vulnerability'
  },

  // COPING CAPACITY DIMENSION (Note: Higher CC = BETTER, so we invert for LCC)
  drr_capacity: {
    id: 'drr_capacity',
    code: 'CC.INS.DRR',
    name: 'DRR Capacity',
    dimension: 'COPING_CAPACITY',
    category: 'Institutional',
    aggregation: 'MEAN',
    polarity: 'POSITIVE', // Higher = better coping
    weight: 1.0,
    unit: 'index (0-10)',
    description: 'Disaster risk reduction institutional capacity'
  },
  governance: {
    id: 'governance',
    code: 'CC.INS.GOV',
    name: 'Governance',
    dimension: 'COPING_CAPACITY',
    category: 'Institutional',
    aggregation: 'MEAN',
    polarity: 'POSITIVE',
    weight: 1.0,
    unit: 'index (0-10)',
    description: 'Government effectiveness and rule of law'
  },
  communication: {
    id: 'communication',
    code: 'CC.INF.COM',
    name: 'Communication',
    dimension: 'COPING_CAPACITY',
    category: 'Infrastructure',
    aggregation: 'MEAN',
    polarity: 'POSITIVE',
    weight: 1.0,
    unit: 'index (0-10)',
    description: 'Access to communication infrastructure'
  },
  physical_infrastructure: {
    id: 'physical_infrastructure',
    code: 'CC.INF.PHY',
    name: 'Physical Infrastructure',
    dimension: 'COPING_CAPACITY',
    category: 'Infrastructure',
    aggregation: 'MEAN',
    polarity: 'POSITIVE',
    weight: 1.0,
    unit: 'index (0-10)',
    description: 'Quality of physical infrastructure (roads, utilities)'
  }
};

// ============================================================================
// DIMENSION STRUCTURE
// ============================================================================

export const DIMENSION_STRUCTURE = {
  HAZARD: {
    name: 'Hazard & Exposure',
    code: 'HA',
    color: '#ef4444',
    aggregation: 'MAX', // Worst-case for hazards
    weight: 1/3,
    categories: {
      Natural: {
        indicators: ['flood_exposure', 'drought_exposure', 'earthquake_exposure'],
        aggregation: 'MAX',
        weight: 0.5
      },
      Human: {
        indicators: ['conflict_intensity'],
        aggregation: 'MAX',
        weight: 0.5
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
      'Socio-Economic': {
        indicators: ['development_deprivation', 'inequality'],
        aggregation: 'MEAN',
        weight: 0.5
      },
      'Vulnerable Groups': {
        indicators: ['food_security', 'health_conditions'],
        aggregation: 'MEAN',
        weight: 0.5
      }
    }
  },
  COPING_CAPACITY: {
    name: 'Lack of Coping Capacity',
    code: 'CC',
    color: '#22c55e',
    aggregation: 'MEAN',
    weight: 1/3,
    invert: true, // CC is inverted to get LCC
    categories: {
      Institutional: {
        indicators: ['drr_capacity', 'governance'],
        aggregation: 'MEAN',
        weight: 0.5
      },
      Infrastructure: {
        indicators: ['communication', 'physical_infrastructure'],
        aggregation: 'MEAN',
        weight: 0.5
      }
    }
  }
};

// ============================================================================
// RISK CLASSIFICATION (INFORM Standard)
// ============================================================================

export const RISK_CLASSIFICATION = [
  { min: 0.0, max: 2.0, label: 'Very Low', labelSwahili: 'Hatari Ndogo Sana', color: '#2E7D32' },
  { min: 2.0, max: 3.5, label: 'Low', labelSwahili: 'Hatari Ndogo', color: '#8BC34A' },
  { min: 3.5, max: 5.0, label: 'Medium', labelSwahili: 'Hatari ya Wastani', color: '#FFC107' },
  { min: 5.0, max: 6.5, label: 'High', labelSwahili: 'Hatari Kubwa', color: '#FF9800' },
  { min: 6.5, max: 10.0, label: 'Very High', labelSwahili: 'Hatari Kubwa Sana', color: '#D32F2F' }
];

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Round to specified decimal places
 */
export function roundTo(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return null;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Clamp value to 0-10 INFORM scale
 */
export function clamp(value, min = 0, max = 10) {
  if (value === null || value === undefined || isNaN(value)) return null;
  return Math.min(max, Math.max(min, value));
}

/**
 * Calculate arithmetic mean of values
 */
export function arithmeticMean(values) {
  const valid = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

/**
 * Calculate maximum of values (for hazard aggregation)
 */
export function maxValue(values) {
  const valid = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (valid.length === 0) return null;
  return Math.max(...valid);
}

/**
 * Calculate geometric mean (for final INFORM Risk)
 * Formula: (v1 × v2 × v3)^(1/3)
 */
export function geometricMean(values) {
  const valid = values.filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0);
  if (valid.length === 0) return null;

  // Use logarithmic method for numerical stability
  const logSum = valid.reduce((acc, val) => acc + Math.log(val), 0);
  return Math.exp(logSum / valid.length);
}

/**
 * Aggregate values using specified method
 */
export function aggregate(values, method = 'MEAN') {
  switch (method) {
    case 'MAX':
      return maxValue(values);
    case 'MEAN':
    case 'ARITHMETIC_MEAN':
      return arithmeticMean(values);
    case 'GEOMETRIC_MEAN':
      return geometricMean(values);
    default:
      return arithmeticMean(values);
  }
}

/**
 * Calculate category score from indicator values
 */
export function calculateCategoryScore(categoryDef, indicatorValues) {
  const values = categoryDef.indicators
    .map(id => indicatorValues[id]?.value)
    .filter(v => v !== null && v !== undefined && !isNaN(v));

  if (values.length === 0) return null;
  return aggregate(values, categoryDef.aggregation);
}

/**
 * Calculate dimension score from categories
 */
export function calculateDimensionScore(dimensionDef, indicatorValues) {
  const categoryScores = [];

  for (const [categoryName, categoryDef] of Object.entries(dimensionDef.categories)) {
    const score = calculateCategoryScore(categoryDef, indicatorValues);
    if (score !== null) {
      categoryScores.push({
        name: categoryName,
        score: score,
        weight: categoryDef.weight
      });
    }
  }

  if (categoryScores.length === 0) return { score: null, categories: {} };

  // Calculate weighted dimension score
  let dimensionScore;
  if (dimensionDef.aggregation === 'MAX') {
    dimensionScore = Math.max(...categoryScores.map(c => c.score));
  } else {
    // Weighted arithmetic mean
    const totalWeight = categoryScores.reduce((sum, c) => sum + c.weight, 0);
    dimensionScore = categoryScores.reduce((sum, c) => sum + (c.score * c.weight), 0) / totalWeight;
  }

  // Invert if this is Coping Capacity (to get Lack of Coping Capacity)
  if (dimensionDef.invert) {
    dimensionScore = 10 - dimensionScore;
  }

  return {
    score: roundTo(dimensionScore, 2),
    categories: Object.fromEntries(categoryScores.map(c => [c.name, roundTo(c.score, 2)]))
  };
}

/**
 * Calculate complete INFORM Risk from indicator values
 *
 * @param {Object} indicatorValues - Object with indicator values: { indicator_id: { value: number, ... } }
 * @returns {Object} Complete risk calculation result
 */
export function calculateINFORMRisk(indicatorValues) {
  const result = {
    dimensions: {},
    risk: null,
    classification: null,
    metadata: {
      calculatedAt: new Date().toISOString(),
      methodology: 'INFORM 2024',
      formula: 'Risk = (H × V × LCC)^(1/3)',
      indicatorCount: Object.keys(indicatorValues).length
    }
  };

  // Calculate each dimension
  const dimensionScores = [];

  for (const [dimId, dimDef] of Object.entries(DIMENSION_STRUCTURE)) {
    const dimResult = calculateDimensionScore(dimDef, indicatorValues);

    result.dimensions[dimId] = {
      name: dimDef.name,
      code: dimDef.code,
      color: dimDef.color,
      score: dimResult.score,
      categories: dimResult.categories,
      weight: dimDef.weight
    };

    if (dimResult.score !== null) {
      dimensionScores.push(dimResult.score);
    }
  }

  // Calculate final INFORM Risk using geometric mean
  if (dimensionScores.length === 3) {
    const hazard = result.dimensions.HAZARD.score;
    const vulnerability = result.dimensions.VULNERABILITY.score;
    const lcc = result.dimensions.COPING_CAPACITY.score; // Already inverted

    // INFORM Formula: Risk = (H × V × LCC)^(1/3)
    result.risk = roundTo(Math.pow(hazard * vulnerability * lcc, 1/3), 2);

    // Classify risk
    result.classification = classifyRisk(result.risk);
  }

  return result;
}

/**
 * Classify risk score into INFORM categories
 */
export function classifyRisk(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return null;
  }

  for (const level of RISK_CLASSIFICATION) {
    if (score >= level.min && score < level.max) {
      return {
        label: level.label,
        labelSwahili: level.labelSwahili,
        color: level.color,
        min: level.min,
        max: level.max
      };
    }
  }

  // Handle edge case of exactly 10
  if (score >= 10) {
    const lastLevel = RISK_CLASSIFICATION[RISK_CLASSIFICATION.length - 1];
    return {
      label: lastLevel.label,
      labelSwahili: lastLevel.labelSwahili,
      color: lastLevel.color,
      min: lastLevel.min,
      max: lastLevel.max
    };
  }

  return null;
}

/**
 * Get risk color for a score
 */
export function getRiskColor(score) {
  const classification = classifyRisk(score);
  return classification?.color || '#666';
}

/**
 * Validate indicator values
 */
export function validateIndicatorValues(indicatorValues) {
  const errors = [];
  const warnings = [];

  for (const [id, data] of Object.entries(indicatorValues)) {
    const def = INDICATOR_DEFINITIONS[id];
    if (!def) {
      warnings.push(`Unknown indicator: ${id}`);
      continue;
    }

    const value = data?.value;
    if (value === null || value === undefined) {
      warnings.push(`Missing value for ${def.name}`);
      continue;
    }

    if (isNaN(value)) {
      errors.push(`Invalid value for ${def.name}: not a number`);
      continue;
    }

    if (value < 0 || value > 10) {
      errors.push(`Value out of range for ${def.name}: ${value} (must be 0-10)`);
    }
  }

  // Check for minimum required indicators
  const hasHazard = Object.keys(indicatorValues).some(id =>
    INDICATOR_DEFINITIONS[id]?.dimension === 'HAZARD' &&
    indicatorValues[id]?.value != null
  );
  const hasVulnerability = Object.keys(indicatorValues).some(id =>
    INDICATOR_DEFINITIONS[id]?.dimension === 'VULNERABILITY' &&
    indicatorValues[id]?.value != null
  );
  const hasCoping = Object.keys(indicatorValues).some(id =>
    INDICATOR_DEFINITIONS[id]?.dimension === 'COPING_CAPACITY' &&
    indicatorValues[id]?.value != null
  );

  if (!hasHazard) errors.push('At least one Hazard indicator is required');
  if (!hasVulnerability) errors.push('At least one Vulnerability indicator is required');
  if (!hasCoping) errors.push('At least one Coping Capacity indicator is required');

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    completeness: {
      hazard: hasHazard,
      vulnerability: hasVulnerability,
      copingCapacity: hasCoping
    }
  };
}

/**
 * Format calculation result for display
 */
export function formatCalculationResult(result) {
  if (!result) return null;

  return {
    summary: {
      riskScore: result.risk,
      riskClass: result.classification?.label,
      riskColor: result.classification?.color,
      hazardScore: result.dimensions.HAZARD?.score,
      vulnerabilityScore: result.dimensions.VULNERABILITY?.score,
      lackOfCopingScore: result.dimensions.COPING_CAPACITY?.score
    },
    dimensions: result.dimensions,
    formula: {
      expression: `Risk = (${result.dimensions.HAZARD?.score} × ${result.dimensions.VULNERABILITY?.score} × ${result.dimensions.COPING_CAPACITY?.score})^(1/3)`,
      result: result.risk
    },
    metadata: result.metadata
  };
}

// ============================================================================
// APPROVED DATA MANAGEMENT
// ============================================================================

const APPROVED_DATA_KEY = 'inform_approved_risk_data';

/**
 * Store approved risk data for a region/district
 */
export function storeApprovedRiskData(submission, calculatedResult, approver) {
  const existing = getApprovedRiskData();

  // Create approved data entry
  const approvedEntry = {
    id: submission.id,
    committeeId: submission.committeeId,
    committeeName: submission.committeeName,
    adm1Code: submission.adm1Code,
    adm1Name: submission.adm1Name,
    adm2Code: submission.adm2Code,
    adm2Name: submission.adm2Name,

    // Original indicator values
    indicators: submission.indicators,

    // System-calculated scores using INFORM methodology
    calculated: {
      hazardScore: calculatedResult.dimensions.HAZARD?.score,
      vulnerabilityScore: calculatedResult.dimensions.VULNERABILITY?.score,
      lackOfCopingScore: calculatedResult.dimensions.COPING_CAPACITY?.score,
      riskScore: calculatedResult.risk,
      riskClass: calculatedResult.classification?.label,
      riskColor: calculatedResult.classification?.color,
      dimensions: calculatedResult.dimensions
    },

    // Metadata
    submittedBy: submission.submittedBy,
    submittedAt: submission.submittedAt,
    approvedBy: approver?.name || approver?.email,
    approvedAt: new Date().toISOString(),
    methodology: 'INFORM 2024',
    status: 'approved'
  };

  // Remove any previous entry for the same area
  const filtered = existing.filter(d =>
    !(d.adm1Code === submission.adm1Code &&
      d.adm2Code === submission.adm2Code)
  );

  filtered.push(approvedEntry);
  localStorage.setItem(APPROVED_DATA_KEY, JSON.stringify(filtered));

  return approvedEntry;
}

/**
 * Get all approved risk data
 */
export function getApprovedRiskData() {
  try {
    return JSON.parse(localStorage.getItem(APPROVED_DATA_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Get approved data for a specific region
 */
export function getApprovedDataForRegion(adm1Name, adm2Name = null) {
  const all = getApprovedRiskData();
  return all.filter(d =>
    d.adm1Name === adm1Name &&
    (adm2Name === null || d.adm2Name === adm2Name)
  );
}

/**
 * Convert approved data to Module02InformRisk format
 */
export function convertToRiskModuleFormat(approvedData) {
  return approvedData.map(d => ({
    admin: {
      country: 'United Republic of Tanzania',
      adm1Name: d.adm1Name,
      adm2Name: d.adm2Name || d.adm1Name,
      iso3: 'TZA',
      adm1Code: d.adm1Code,
      adm2Code: d.adm2Code
    },
    hazardExposure: {
      total: d.calculated.hazardScore,
      natural: d.calculated.dimensions?.HAZARD?.categories?.Natural,
      human: d.calculated.dimensions?.HAZARD?.categories?.Human
    },
    vulnerability: {
      total: d.calculated.vulnerabilityScore,
      socioEconomic: d.calculated.dimensions?.VULNERABILITY?.categories?.['Socio-Economic'],
      vulnerableGroups: d.calculated.dimensions?.VULNERABILITY?.categories?.['Vulnerable Groups']
    },
    lackCopingCapacity: {
      total: d.calculated.lackOfCopingScore,
      institutional: d.calculated.dimensions?.COPING_CAPACITY?.categories?.Institutional,
      infrastructure: d.calculated.dimensions?.COPING_CAPACITY?.categories?.Infrastructure
    },
    risk: d.calculated.riskScore,
    classification: d.calculated.riskClass,
    _committeeSource: {
      committeeName: d.committeeName,
      submittedAt: d.submittedAt,
      approvedAt: d.approvedAt,
      approvedBy: d.approvedBy,
      methodology: d.methodology
    }
  }));
}

export default {
  // Definitions
  INDICATOR_DEFINITIONS,
  DIMENSION_STRUCTURE,
  RISK_CLASSIFICATION,

  // Calculation functions
  calculateINFORMRisk,
  calculateDimensionScore,
  calculateCategoryScore,
  classifyRisk,
  getRiskColor,
  validateIndicatorValues,
  formatCalculationResult,

  // Utility functions
  roundTo,
  clamp,
  arithmeticMean,
  maxValue,
  geometricMean,
  aggregate,

  // Data management
  storeApprovedRiskData,
  getApprovedRiskData,
  getApprovedDataForRegion,
  convertToRiskModuleFormat
};
