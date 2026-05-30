/**
 * IMPACT ASSESSMENT SERVICE
 *
 * Estimates potential impacts of hazards based on:
 * - Population exposure
 * - Infrastructure at risk
 * - Vulnerable groups
 * - Coping resources
 *
 * Links warning (Module 03) to severity assessment (Module 04)
 */

import { calculateWarningScore, getWarningProperties } from './warningLogic';

/**
 * Assess overall impact for a hazard across affected districts
 */
export function assessImpact(hazard, affectedDistricts, riskData) {
  let totalPopulation = 0;
  let vulnerablePopulation = 0;
  let infrastructureAtRisk = [];
  let estimatedSeverity = [];
  let warningsByLevel = {
    monitor: [],
    advisory: [],
    warning: [],
    major: []
  };

  affectedDistricts.forEach(district => {
    const warningScore = calculateWarningScore(hazard, district);

    // Population exposure
    const pop = district.populationData || estimatePopulation(district);
    totalPopulation += pop.total;
    vulnerablePopulation += sumVulnerableGroups(pop);

    // Categorize by warning level
    const levelKey = warningScore.level.toLowerCase().replace(' ', '');
    if (warningsByLevel[levelKey]) {
      warningsByLevel[levelKey].push(district.admin.adm2Name);
    }

    // Infrastructure assessment (only for Warning and above)
    if (warningScore.score >= 5.0) {
      const infra = assessInfrastructure(district, warningScore.score);
      infrastructureAtRisk.push(infra);
    }

    // Severity projection
    const severity = projectSeverity(warningScore, district);
    estimatedSeverity.push(severity);
  });

  // Calculate overall metrics
  const averageWarning = estimatedSeverity.reduce((sum, s) => sum + s.warningScore, 0) / estimatedSeverity.length;
  const maxWarning = Math.max(...estimatedSeverity.map(s => s.warningScore));

  return {
    totalPopulation,
    vulnerablePopulation,
    vulnerabilityPercentage: ((vulnerablePopulation / totalPopulation) * 100).toFixed(1),
    infrastructureAtRisk,
    estimatedSeverity,
    warningDistribution: warningsByLevel,
    overallMetrics: {
      averageWarning: averageWarning.toFixed(2),
      maxWarning: maxWarning.toFixed(2),
      criticalDistricts: estimatedSeverity.filter(s => s.warningScore >= 7.5).length
    },
    recommendedResponse: determineResponse(maxWarning, warningsByLevel)
  };
}

/**
 * Sum vulnerable groups (children, elderly, disabled, displaced)
 */
function sumVulnerableGroups(populationData) {
  if (!populationData || !populationData.vulnerableGroups) {
    return 0;
  }

  const groups = populationData.vulnerableGroups;
  return (groups.children || 0) +
         (groups.elderly || 0) +
         (groups.disabled || 0) +
         (groups.displaced || 0);
}

/**
 * Estimate population if not available (fallback)
 */
function estimatePopulation(district) {
  // Default estimates based on typical Tanzania district
  return {
    total: 250000,
    vulnerableGroups: {
      children: 75000,  // ~30%
      elderly: 12500,   // ~5%
      disabled: 7500,   // ~3%
      displaced: 0
    }
  };
}

/**
 * Assess infrastructure at risk
 */
function assessInfrastructure(district, warningScore) {
  const resources = district.copingResources || {};

  // Estimate proportion at risk based on warning score
  const riskProportion = Math.min(1, (warningScore - 5) / 5); // 5-10 score maps to 0-100% risk

  return {
    district: district.admin.adm2Name,
    healthFacilities: {
      total: resources.healthFacilities || 0,
      atRisk: Math.round((resources.healthFacilities || 0) * riskProportion)
    },
    emergencyShelters: {
      total: resources.emergencyShelters || 0,
      atRisk: Math.round((resources.emergencyShelters || 0) * riskProportion)
    },
    waterPoints: {
      total: resources.waterPoints || 0,
      atRisk: Math.round((resources.waterPoints || 0) * riskProportion)
    },
    warningScore
  };
}

/**
 * Project severity level (links to Module 04)
 */
export function projectSeverity(warningScore, district) {
  // Severity is function of warning + vulnerability
  const vulnerability = district.vulnerability?.total || 5;
  const severityScore = Math.sqrt(warningScore.score * vulnerability);

  let severityClass;
  if (severityScore < 3) {
    severityClass = 'Minor';
  } else if (severityScore < 5) {
    severityClass = 'Moderate';
  } else if (severityClass < 7) {
    severityClass = 'Severe';
  } else {
    severityClass = 'Critical';
  }

  return {
    district: district.admin.adm2Name,
    warningScore: warningScore.score,
    vulnerabilityScore: vulnerability,
    severityScore: severityScore,
    severityClass: severityClass,
    confidenceLevel: warningScore.confidence
  };
}

/**
 * Determine recommended response level
 */
function determineResponse(maxWarning, warningDistribution) {
  if (maxWarning >= 7.5 || warningDistribution.major.length > 0) {
    return {
      level: 'Full Activation',
      priority: 'Immediate',
      actions: [
        'Activate National Emergency Operations Center',
        'Deploy pre-positioned resources',
        'Coordinate multi-agency response',
        'Issue mass media alerts',
        'Prepare evacuation if needed',
        'Mobilize emergency services',
        'Alert regional and district authorities'
      ],
      coordination: 'PMO-DMD leads with full inter-ministerial support'
    };
  } else if (maxWarning >= 5.0 || warningDistribution.warning.length > 0) {
    return {
      level: 'Partial Activation',
      priority: 'High',
      actions: [
        'Activate sector-specific response protocols',
        'Pre-position critical resources',
        'Issue targeted warnings to affected areas',
        'Brief regional authorities',
        'Standby emergency services',
        'Prepare communication messages'
      ],
      coordination: 'Sector ministries coordinate with PMO-DMD oversight'
    };
  } else if (maxWarning >= 2.5 || warningDistribution.advisory.length > 0) {
    return {
      level: 'Enhanced Monitoring',
      priority: 'Medium',
      actions: [
        'Increase monitoring frequency',
        'Inform at-risk communities',
        'Review response plans',
        'Check resource availability',
        'Prepare sector advisories'
      ],
      coordination: 'Sector ministries lead with PMO-DMD monitoring'
    };
  } else {
    return {
      level: 'Routine Operations',
      priority: 'Low',
      actions: [
        'Continue standard monitoring',
        'Maintain situational awareness',
        'Update preparedness plans'
      ],
      coordination: 'Sector ministries routine operations'
    };
  }
}

/**
 * Estimate economic impact (basic model)
 */
export function estimateEconomicImpact(severity, populationAffected) {
  // Very rough estimates (would need detailed economic data)
  const impactPerCapita = {
    'Minor': 10000,      // TZS per person
    'Moderate': 50000,
    'Severe': 200000,
    'Critical': 500000
  };

  const perCapita = impactPerCapita[severity] || 50000;
  const totalImpact = perCapita * populationAffected;

  return {
    estimatedLoss: totalImpact,
    currency: 'TZS',
    confidenceLevel: 'Low', // This is a very rough estimate
    note: 'Detailed economic assessment required for accurate impact'
  };
}

/**
 * Assess sectoral impacts
 */
export function assessSectoralImpact(hazard, severity) {
  const sectors = {
    health: {
      impactLevel: 'Medium',
      concerns: [
        'Disease outbreak risk',
        'Health facility disruption',
        'Emergency care demand'
      ]
    },
    water: {
      impactLevel: 'High',
      concerns: [
        'Water source contamination',
        'Infrastructure damage',
        'Access disruption'
      ]
    },
    agriculture: {
      impactLevel: 'High',
      concerns: [
        'Crop damage',
        'Livestock impact',
        'Food security'
      ]
    },
    infrastructure: {
      impactLevel: 'Medium',
      concerns: [
        'Road damage',
        'Bridge collapse risk',
        'Power outages'
      ]
    },
    education: {
      impactLevel: 'Low',
      concerns: [
        'School closures',
        'Learning disruption'
      ]
    }
  };

  // Adjust impact levels based on hazard type
  if (hazard.hazardType === 'Heavy Rainfall' || hazard.hazardType === 'Flood') {
    sectors.water.impactLevel = 'Very High';
    sectors.infrastructure.impactLevel = 'High';
  } else if (hazard.hazardType === 'Drought') {
    sectors.agriculture.impactLevel = 'Very High';
    sectors.water.impactLevel = 'Very High';
  } else if (hazard.hazardType === 'Disease Outbreak') {
    sectors.health.impactLevel = 'Very High';
  }

  return sectors;
}

/**
 * Generate impact report summary
 */
export function generateImpactSummary(impact, hazard) {
  const summary = {
    overview: {
      hazardType: hazard.hazardType,
      affectedAreas: impact.warningDistribution,
      totalPopulation: impact.totalPopulation,
      vulnerablePopulation: impact.vulnerablePopulation,
      criticalDistricts: impact.overallMetrics.criticalDistricts
    },
    response: impact.recommendedResponse,
    severity: impact.estimatedSeverity,
    infrastructure: impact.infrastructureAtRisk,
    confidence: hazard.confidence,
    generatedAt: new Date().toISOString()
  };

  return summary;
}

export default {
  assessImpact,
  projectSeverity,
  estimateEconomicImpact,
  assessSectoralImpact,
  generateImpactSummary
};
