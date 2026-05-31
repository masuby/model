/**
 * WARNING LOGIC SERVICE
 *
 * Core calculation engine for risk-informed early warning
 *
 * Formula: Effective Impact = Hazard Intensity × Risk Sensitivity
 * where Risk Sensitivity = (Vulnerability × Lack of Coping Capacity)^(1/2)
 */

/**
 * Normalize warning level to 0-10 scale
 */
export function normalizeHazardIntensity(warningLevel, quantitativeValue = null) {
  // Warning level mapping
  const warningLevelMap = {
    'Advisory': 3.5,
    'Warning': 6.5,
    'Major Warning': 9,
    // Legacy intensity levels (for backward compatibility)
    'Very Low': 2,
    'Low': 3.5,
    'Moderate': 5,
    'High': 7,
    'Very High': 9
  };

  if (warningLevelMap[warningLevel]) {
    return warningLevelMap[warningLevel];
  }

  // If quantitative value provided, normalize it
  // This would be hazard-specific (e.g., rainfall mm, earthquake magnitude, etc.)
  if (quantitativeValue !== null) {
    // Example for rainfall: 0-200mm mapped to 0-10
    // This would be customized per hazard type
    return Math.min(10, (quantitativeValue / 200) * 10);
  }

  return 5; // Default to moderate
}

/**
 * Calculate risk sensitivity from vulnerability and coping capacity
 */
export function calculateRiskSensitivity(riskProfile) {
  const vulnerability = riskProfile.vulnerability?.total || 5;
  const lackCopingCapacity = riskProfile.lackCopingCapacity?.total || 5;

  // Geometric mean of V and LCC
  return Math.sqrt(vulnerability * lackCopingCapacity);
}

/**
 * Calculate warning score for a hazard in a specific district
 *
 * @param {Object} hazard - Hazard data from institutional input
 * @param {Object} districtRisk - Risk profile from Module 02
 * @returns {Object} Warning score and classification
 */
export function calculateWarningScore(hazard, districtRisk) {
  // Step 1: Normalize hazard intensity
  const hazardScore = normalizeHazardIntensity(
    hazard.warningLevel,
    hazard.quantitativeValue
  );

  // Step 2: Get risk sensitivity from district profile
  const riskSensitivity = calculateRiskSensitivity(districtRisk);

  // Step 3: Calculate effective impact (geometric mean)
  // This represents the risk-conditioned hazard impact
  const warningScore = Math.sqrt(hazardScore * riskSensitivity);

  // Step 4: Classify warning level
  const warningLevel = classifyWarningLevel(warningScore);

  // Step 5: Get recommended actions
  const actions = getRecommendedActions(warningLevel);

  return {
    score: warningScore,
    level: warningLevel,
    hazardComponent: hazardScore,
    riskComponent: riskSensitivity,
    actions: actions,
    confidence: hazard.confidence || 'Medium'
  };
}

/**
 * Classify warning level based on score
 */
export function classifyWarningLevel(score) {
  if (score < 2.5) {
    return 'Monitor';
  } else if (score < 5.0) {
    return 'Advisory';
  } else if (score < 7.5) {
    return 'Warning';
  } else {
    return 'Major Warning';
  }
}

/**
 * Get warning level properties (color, icon, etc.)
 */
export function getWarningProperties(level) {
  const properties = {
    'Monitor': {
      color: '#4CAF50',
      icon: '🟢',
      priority: 1,
      description: 'Conditions may develop - routine monitoring'
    },
    'Advisory': {
      color: '#FFC107',
      icon: '🟡',
      priority: 2,
      description: 'Minor impacts possible - increase monitoring'
    },
    'Warning': {
      color: '#FF9800',
      icon: '🟠',
      priority: 3,
      description: 'Significant impacts likely - activate protocols'
    },
    'Major Warning': {
      color: '#F44336',
      icon: '🔴',
      priority: 4,
      description: 'Severe impacts expected - full activation'
    }
  };

  return properties[level] || properties['Monitor'];
}

/**
 * Get recommended actions for each warning level
 */
export function getRecommendedActions(level) {
  const actions = {
    'Monitor': [
      'Continue routine monitoring',
      'Review preparedness plans',
      'Maintain regular communication'
    ],
    'Advisory': [
      'Increase monitoring frequency',
      'Inform stakeholders and at-risk communities',
      'Review and update response plans',
      'Check resource availability',
      'Prepare communication messages'
    ],
    'Warning': [
      'Activate early warning protocols',
      'Pre-position emergency resources',
      'Issue public warnings',
      'Prepare evacuation plans if needed',
      'Coordinate with emergency services',
      'Brief decision-makers'
    ],
    'Major Warning': [
      'Full response activation',
      'Implement evacuations if required',
      'Deploy emergency resources',
      'Activate emergency operations center',
      'Issue mass media alerts',
      'Coordinate multi-agency response',
      'Prepare for post-impact assessment'
    ]
  };

  return actions[level] || actions['Monitor'];
}

/**
 * Enhanced warning matrix considering multiple factors
 */
export function calculateDetailedWarning(hazard, districtRisk, populationData) {
  // Basic warning score
  const baseWarning = calculateWarningScore(hazard, districtRisk);

  // Enhance based on vulnerable populations
  const vulnerablePopulation = Object.values(populationData.vulnerableGroups || {})
    .reduce((sum, val) => sum + val, 0);
  const vulnerabilityFactor = vulnerablePopulation / populationData.total;

  // Enhance based on coping resources
  const copingResources = districtRisk.lackCopingCapacity?.infrastructure?.aggregate || 5;
  const copingFactor = copingResources / 10; // Normalize to 0-1

  // Adjust warning score
  let adjustedScore = baseWarning.score;

  // Increase if high vulnerable population
  if (vulnerabilityFactor > 0.4) {
    adjustedScore *= 1.15;
  }

  // Increase if low coping capacity
  if (copingFactor > 0.7) {
    adjustedScore *= 1.1;
  }

  // Cap at 10
  adjustedScore = Math.min(10, adjustedScore);

  return {
    ...baseWarning,
    score: adjustedScore,
    level: classifyWarningLevel(adjustedScore),
    adjustments: {
      vulnerabilityFactor,
      copingFactor,
      adjustment: ((adjustedScore / baseWarning.score) - 1) * 100
    }
  };
}

/**
 * Compare warning across multiple districts
 */
export function compareWarnings(warnings) {
  const sorted = warnings.sort((a, b) => b.score - a.score);

  return {
    highest: sorted[0],
    lowest: sorted[sorted.length - 1],
    average: warnings.reduce((sum, w) => sum + w.score, 0) / warnings.length,
    distribution: {
      monitor: warnings.filter(w => w.level === 'Monitor').length,
      advisory: warnings.filter(w => w.level === 'Advisory').length,
      warning: warnings.filter(w => w.level === 'Warning').length,
      major: warnings.filter(w => w.level === 'Major Warning').length
    }
  };
}

/**
 * Validate warning logic (for testing/calibration)
 */
export function validateWarning(hazard, districtRisk, expectedLevel) {
  const warning = calculateWarningScore(hazard, districtRisk);

  return {
    calculated: warning.level,
    expected: expectedLevel,
    match: warning.level === expectedLevel,
    score: warning.score,
    hazardComponent: warning.hazardComponent,
    riskComponent: warning.riskComponent
  };
}

export default {
  calculateWarningScore,
  classifyWarningLevel,
  getWarningProperties,
  getRecommendedActions,
  normalizeHazardIntensity,
  calculateRiskSensitivity,
  calculateDetailedWarning,
  compareWarnings,
  validateWarning
};
