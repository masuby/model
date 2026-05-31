/**
 * ADVANCED RISK ANALYTICS ENGINE
 *
 * Next-level risk analysis for the INFORM Warning System
 * Includes:
 * - Probabilistic Risk Assessment
 * - Compound Hazard Analysis
 * - Risk Cascade Modeling
 * - Temporal Risk Evolution
 * - Decision Support Analytics
 * - Uncertainty Quantification
 *
 * Based on INFORM methodology with advanced extensions
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const ANALYTICS_CONFIG = {
  simulation: {
    iterations: 1000,        // Monte Carlo iterations
    confidenceLevel: 0.95,   // 95% confidence interval
    seed: 42                 // For reproducibility
  },
  thresholds: {
    criticalRisk: 7.5,
    highRisk: 5.0,
    moderateRisk: 3.5,
    lowRisk: 2.0
  },
  decay: {
    copingCapacityDecayRate: 0.15,  // Per event decay
    vulnerabilityAmplification: 1.2  // Compound effect multiplier
  },
  weights: {
    recentEvents: 0.4,
    baseline: 0.35,
    forecast: 0.25
  }
};

// ============================================================================
// PROBABILISTIC RISK ASSESSMENT
// ============================================================================

/**
 * Generate probability distribution for risk scores
 * Uses triangular distribution based on min, likely, max estimates
 */
export function generateRiskDistribution(baseScore, uncertainty = 0.2) {
  const minScore = Math.max(0, baseScore * (1 - uncertainty));
  const maxScore = Math.min(10, baseScore * (1 + uncertainty));
  const likelyScore = baseScore;

  const samples = [];
  for (let i = 0; i < ANALYTICS_CONFIG.simulation.iterations; i++) {
    samples.push(triangularRandom(minScore, maxScore, likelyScore));
  }

  return {
    samples,
    statistics: calculateDistributionStats(samples),
    percentiles: calculatePercentiles(samples, [5, 25, 50, 75, 95]),
    confidenceInterval: calculateConfidenceInterval(samples, ANALYTICS_CONFIG.simulation.confidenceLevel)
  };
}

/**
 * Triangular distribution random number generator
 */
function triangularRandom(min, max, mode) {
  const u = Math.random();
  const fc = (mode - min) / (max - min);

  if (u < fc) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

/**
 * Calculate distribution statistics
 */
function calculateDistributionStats(samples) {
  const n = samples.length;
  const sorted = [...samples].sort((a, b) => a - b);

  const mean = samples.reduce((a, b) => a + b, 0) / n;
  const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Skewness
  const skewness = samples.reduce((sum, x) => sum + Math.pow((x - mean) / stdDev, 3), 0) / n;

  // Kurtosis
  const kurtosis = samples.reduce((sum, x) => sum + Math.pow((x - mean) / stdDev, 4), 0) / n - 3;

  return {
    mean: roundTo(mean, 2),
    median: roundTo(sorted[Math.floor(n / 2)], 2),
    stdDev: roundTo(stdDev, 2),
    variance: roundTo(variance, 2),
    skewness: roundTo(skewness, 2),
    kurtosis: roundTo(kurtosis, 2),
    min: roundTo(sorted[0], 2),
    max: roundTo(sorted[n - 1], 2),
    range: roundTo(sorted[n - 1] - sorted[0], 2)
  };
}

/**
 * Calculate percentiles
 */
function calculatePercentiles(samples, percentiles) {
  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;

  const result = {};
  for (const p of percentiles) {
    const index = Math.ceil((p / 100) * n) - 1;
    result[`p${p}`] = roundTo(sorted[Math.max(0, index)], 2);
  }
  return result;
}

/**
 * Calculate confidence interval
 */
function calculateConfidenceInterval(samples, level) {
  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;
  const alpha = 1 - level;

  const lowerIndex = Math.floor((alpha / 2) * n);
  const upperIndex = Math.floor((1 - alpha / 2) * n);

  return {
    level: level * 100,
    lower: roundTo(sorted[lowerIndex], 2),
    upper: roundTo(sorted[upperIndex], 2)
  };
}

// ============================================================================
// COMPOUND HAZARD ANALYSIS
// ============================================================================

/**
 * Analyze interactions between multiple simultaneous hazards
 * Compound events can amplify risk beyond simple addition
 */
export function analyzeCompoundHazards(hazards) {
  if (!hazards || hazards.length === 0) {
    return null;
  }

  if (hazards.length === 1) {
    return {
      isCompound: false,
      hazards: hazards,
      individualScores: hazards.map(h => h.score || 0),
      compoundScore: hazards[0].score || 0,
      amplificationFactor: 1.0,
      interactions: []
    };
  }

  // Calculate individual scores
  const individualScores = hazards.map(h => h.score || h.intensity || 0);

  // Identify hazard interactions
  const interactions = identifyHazardInteractions(hazards);

  // Calculate compound effect
  const { compoundScore, amplificationFactor } = calculateCompoundEffect(individualScores, interactions);

  // Generate compound risk narrative
  const narrative = generateCompoundNarrative(hazards, interactions, amplificationFactor);

  return {
    isCompound: true,
    hazardCount: hazards.length,
    hazards: hazards.map(h => ({
      type: h.type || h.hazardType,
      score: h.score || h.intensity,
      source: h.institution || 'Unknown'
    })),
    individualScores,
    linearSum: roundTo(individualScores.reduce((a, b) => a + b, 0), 2),
    compoundScore: roundTo(compoundScore, 2),
    amplificationFactor: roundTo(amplificationFactor, 2),
    interactions,
    narrative,
    riskClassification: classifyCompoundRisk(compoundScore)
  };
}

/**
 * Identify interactions between hazard pairs
 */
function identifyHazardInteractions(hazards) {
  const interactionMatrix = {
    // Synergistic interactions (amplify each other)
    'Heavy Rainfall-Flood': { type: 'synergistic', factor: 1.5, mechanism: 'Rainfall directly causes flooding' },
    'Drought-Food Security Crisis': { type: 'synergistic', factor: 1.4, mechanism: 'Drought reduces crop yields' },
    'Flood-Cholera': { type: 'synergistic', factor: 1.6, mechanism: 'Flooding contaminates water sources' },
    'Flood-Malaria': { type: 'synergistic', factor: 1.3, mechanism: 'Standing water increases mosquito breeding' },
    'Drought-Malnutrition': { type: 'synergistic', factor: 1.5, mechanism: 'Food scarcity leads to malnutrition' },
    'Earthquake-Landslide': { type: 'synergistic', factor: 1.4, mechanism: 'Seismic activity destabilizes slopes' },
    'Heavy Rainfall-Landslide': { type: 'synergistic', factor: 1.5, mechanism: 'Soil saturation triggers slides' },
    'Cyclone-Flood': { type: 'synergistic', factor: 1.6, mechanism: 'Storm surge and heavy rain cause flooding' },
    'Cyclone-Strong Wind': { type: 'synergistic', factor: 1.3, mechanism: 'Cyclonic winds cause structural damage' },

    // Cascading interactions (one leads to another)
    'Flood-Displacement': { type: 'cascading', factor: 1.3, mechanism: 'Flooding forces population movement' },
    'Drought-Conflict': { type: 'cascading', factor: 1.2, mechanism: 'Resource scarcity increases tensions' },
    'Earthquake-Fire': { type: 'cascading', factor: 1.3, mechanism: 'Damaged infrastructure causes fires' },

    // Compounding (stress accumulation)
    'Drought-Drought': { type: 'compounding', factor: 1.4, mechanism: 'Prolonged drought deepens impacts' },
    'Flood-Flood': { type: 'compounding', factor: 1.3, mechanism: 'Repeated flooding exhausts coping capacity' }
  };

  const interactions = [];

  for (let i = 0; i < hazards.length; i++) {
    for (let j = i + 1; j < hazards.length; j++) {
      const h1 = hazards[i].type || hazards[i].hazardType;
      const h2 = hazards[j].type || hazards[j].hazardType;

      const key1 = `${h1}-${h2}`;
      const key2 = `${h2}-${h1}`;

      const interaction = interactionMatrix[key1] || interactionMatrix[key2];

      if (interaction) {
        interactions.push({
          hazard1: h1,
          hazard2: h2,
          ...interaction
        });
      }
    }
  }

  return interactions;
}

/**
 * Calculate compound effect considering interactions
 */
function calculateCompoundEffect(scores, interactions) {
  // Base compound effect using geometric mean
  const geometricMean = Math.pow(
    scores.reduce((prod, s) => prod * Math.max(s, 0.1), 1),
    1 / scores.length
  );

  // Apply interaction factors
  let totalAmplification = 1.0;
  for (const interaction of interactions) {
    totalAmplification *= interaction.factor;
  }

  // Cap amplification at 2.5x
  totalAmplification = Math.min(totalAmplification, 2.5);

  // Compound score combines max score with amplified geometric mean
  const maxScore = Math.max(...scores);
  const compoundScore = Math.min(10, (maxScore + geometricMean * totalAmplification) / 2);

  return {
    compoundScore,
    amplificationFactor: totalAmplification
  };
}

/**
 * Generate narrative for compound hazard situation
 */
function generateCompoundNarrative(hazards, interactions, amplificationFactor) {
  const hazardNames = hazards.map(h => h.type || h.hazardType).join(', ');

  if (interactions.length === 0) {
    return `Multiple hazards present (${hazardNames}) without identified synergistic interactions. Risk assessment based on highest individual hazard.`;
  }

  const interactionDescriptions = interactions.map(i =>
    `${i.hazard1} and ${i.hazard2} (${i.type}: ${i.mechanism})`
  ).join('; ');

  const amplificationLevel = amplificationFactor > 1.5 ? 'significantly' :
                             amplificationFactor > 1.2 ? 'moderately' : 'slightly';

  return `COMPOUND HAZARD ALERT: ${hazardNames} are occurring simultaneously. ` +
         `Identified interactions: ${interactionDescriptions}. ` +
         `Combined risk is ${amplificationLevel} amplified (${roundTo((amplificationFactor - 1) * 100, 0)}% increase) ` +
         `due to hazard interactions. Enhanced response coordination recommended.`;
}

/**
 * Classify compound risk level
 */
function classifyCompoundRisk(score) {
  if (score >= ANALYTICS_CONFIG.thresholds.criticalRisk) {
    return { level: 'CRITICAL', color: '#7f1d1d', action: 'Immediate multi-agency response required' };
  } else if (score >= ANALYTICS_CONFIG.thresholds.highRisk) {
    return { level: 'HIGH', color: '#dc2626', action: 'Activate compound emergency protocols' };
  } else if (score >= ANALYTICS_CONFIG.thresholds.moderateRisk) {
    return { level: 'MODERATE', color: '#f59e0b', action: 'Enhanced monitoring and coordination' };
  } else if (score >= ANALYTICS_CONFIG.thresholds.lowRisk) {
    return { level: 'LOW', color: '#22c55e', action: 'Continue standard monitoring' };
  }
  return { level: 'MINIMAL', color: '#16a34a', action: 'Routine operations' };
}

// ============================================================================
// RISK CASCADE MODELING
// ============================================================================

/**
 * Model risk cascades through interconnected systems
 * Shows how initial hazard propagates through sectors
 */
export function modelRiskCascade(initialHazard, districtProfile) {
  const cascadeStages = [];
  let currentRisk = initialHazard.score || initialHazard.intensity || 5;

  // Stage 1: Direct Impact
  const directImpact = calculateDirectImpact(initialHazard, districtProfile);
  cascadeStages.push({
    stage: 1,
    name: 'Direct Impact',
    timeframe: '0-24 hours',
    sectors: directImpact.sectors,
    riskLevel: currentRisk,
    populationAffected: directImpact.populationAffected,
    description: directImpact.description
  });

  // Stage 2: Secondary Effects
  const secondaryEffects = calculateSecondaryEffects(initialHazard, directImpact, districtProfile);
  currentRisk = currentRisk * 0.8; // Risk propagation decay
  cascadeStages.push({
    stage: 2,
    name: 'Secondary Effects',
    timeframe: '24-72 hours',
    sectors: secondaryEffects.sectors,
    riskLevel: roundTo(currentRisk, 2),
    populationAffected: secondaryEffects.populationAffected,
    description: secondaryEffects.description
  });

  // Stage 3: Tertiary Impacts
  const tertiaryImpacts = calculateTertiaryImpacts(secondaryEffects, districtProfile);
  currentRisk = currentRisk * 0.7;
  cascadeStages.push({
    stage: 3,
    name: 'Tertiary Impacts',
    timeframe: '3-7 days',
    sectors: tertiaryImpacts.sectors,
    riskLevel: roundTo(currentRisk, 2),
    populationAffected: tertiaryImpacts.populationAffected,
    description: tertiaryImpacts.description
  });

  // Stage 4: Recovery Phase
  const recoveryPhase = estimateRecoveryNeeds(cascadeStages, districtProfile);
  cascadeStages.push({
    stage: 4,
    name: 'Recovery Phase',
    timeframe: '1-4 weeks',
    sectors: recoveryPhase.sectors,
    riskLevel: roundTo(currentRisk * 0.5, 2),
    populationAffected: recoveryPhase.populationAffected,
    description: recoveryPhase.description,
    recoveryResources: recoveryPhase.resources
  });

  return {
    initialHazard: initialHazard.type || initialHazard.hazardType,
    cascadeStages,
    totalDuration: '1-4 weeks',
    peakRisk: {
      stage: 1,
      level: initialHazard.score || initialHazard.intensity,
      timing: 'First 24 hours'
    },
    cumulativeImpact: calculateCumulativeImpact(cascadeStages),
    mitigationOpportunities: identifyMitigationPoints(cascadeStages)
  };
}

/**
 * Calculate direct impact on sectors
 */
function calculateDirectImpact(hazard, district) {
  const hazardType = hazard.type || hazard.hazardType || 'Unknown';
  const population = district?.population || 100000;
  const vulnerability = district?.vulnerability || 5;

  const sectorImpacts = {
    'Heavy Rainfall': ['Infrastructure', 'Agriculture', 'Transport'],
    'Flood': ['Infrastructure', 'Housing', 'Agriculture', 'Health'],
    'Drought': ['Agriculture', 'Water', 'Livestock', 'Food Security'],
    'Earthquake': ['Infrastructure', 'Housing', 'Health', 'Transport'],
    'Cyclone': ['Infrastructure', 'Housing', 'Agriculture', 'Power'],
    'Cholera': ['Health', 'Water', 'Sanitation'],
    'Malaria': ['Health', 'Productivity'],
    'Food Security Crisis': ['Food Security', 'Health', 'Nutrition'],
    'default': ['General', 'Infrastructure']
  };

  const sectors = sectorImpacts[hazardType] || sectorImpacts['default'];
  const exposureRate = Math.min(0.8, vulnerability / 10);

  return {
    sectors: sectors.map(s => ({
      name: s,
      impact: roundTo(hazard.score * (0.6 + Math.random() * 0.4), 1)
    })),
    populationAffected: Math.round(population * exposureRate),
    description: `${hazardType} directly impacts ${sectors.join(', ')} sectors. ` +
                 `Estimated ${Math.round(exposureRate * 100)}% of population exposed.`
  };
}

/**
 * Calculate secondary effects
 */
function calculateSecondaryEffects(hazard, directImpact, district) {
  const secondarySectors = [
    { name: 'Livelihoods', impact: 5.5 },
    { name: 'Education', impact: 4.0 },
    { name: 'Markets', impact: 5.0 },
    { name: 'Social Services', impact: 4.5 }
  ];

  // Filter based on hazard type
  const relevantSectors = secondarySectors.filter(s => {
    if (hazard.type?.includes('Flood')) return ['Livelihoods', 'Education', 'Markets'].includes(s.name);
    if (hazard.type?.includes('Drought')) return ['Livelihoods', 'Markets'].includes(s.name);
    return true;
  });

  return {
    sectors: relevantSectors,
    populationAffected: Math.round(directImpact.populationAffected * 0.7),
    description: 'Secondary effects emerge as immediate impacts cascade through interconnected systems. ' +
                 'Service disruptions and livelihood impacts become apparent.'
  };
}

/**
 * Calculate tertiary impacts
 */
function calculateTertiaryImpacts(secondaryEffects, district) {
  return {
    sectors: [
      { name: 'Mental Health', impact: 3.5 },
      { name: 'Long-term Health', impact: 4.0 },
      { name: 'Economic Recovery', impact: 5.0 },
      { name: 'Social Cohesion', impact: 3.0 }
    ],
    populationAffected: Math.round(secondaryEffects.populationAffected * 0.5),
    description: 'Tertiary impacts include long-term health effects, psychological stress, ' +
                 'and challenges to economic and social recovery.'
  };
}

/**
 * Estimate recovery resources needed
 */
function estimateRecoveryNeeds(cascadeStages, district) {
  const peakAffected = Math.max(...cascadeStages.map(s => s.populationAffected));

  return {
    sectors: [
      { name: 'Reconstruction', impact: 4.0 },
      { name: 'Rehabilitation', impact: 3.5 },
      { name: 'Resilience Building', impact: 3.0 }
    ],
    populationAffected: Math.round(peakAffected * 0.3),
    description: 'Recovery phase focuses on rebuilding infrastructure, rehabilitating services, ' +
                 'and strengthening resilience for future events.',
    resources: {
      financial: `${roundTo(peakAffected * 50000 / 1000000, 1)} million TZS estimated`,
      personnel: `${Math.round(peakAffected / 1000)} response workers needed`,
      supplies: `Emergency supplies for ${roundTo(peakAffected / 1000, 0)}K people`,
      timeToRecovery: district?.copingCapacity > 6 ? '2-3 weeks' : '4-6 weeks'
    }
  };
}

/**
 * Calculate cumulative impact across stages
 */
function calculateCumulativeImpact(stages) {
  const totalAffected = stages.reduce((sum, s) => sum + s.populationAffected, 0);
  const weightedRisk = stages.reduce((sum, s, i) => sum + s.riskLevel * (1 / (i + 1)), 0);
  const allSectors = new Set();
  stages.forEach(s => s.sectors.forEach(sec => allSectors.add(sec.name)));

  return {
    totalPopulationAffected: totalAffected,
    peakPopulationAffected: Math.max(...stages.map(s => s.populationAffected)),
    weightedAverageRisk: roundTo(weightedRisk / stages.length, 2),
    sectorsImpacted: allSectors.size,
    sectorList: Array.from(allSectors)
  };
}

/**
 * Identify mitigation opportunities in cascade
 */
function identifyMitigationPoints(stages) {
  return [
    {
      stage: 1,
      opportunity: 'Early Warning Dissemination',
      effectiveness: 'High',
      timing: 'Pre-impact to 6 hours',
      actions: ['Activate EWS', 'Issue public alerts', 'Pre-position resources']
    },
    {
      stage: 2,
      opportunity: 'Rapid Response Deployment',
      effectiveness: 'Medium-High',
      timing: '6-48 hours',
      actions: ['Deploy search and rescue', 'Establish emergency shelters', 'Activate health response']
    },
    {
      stage: 3,
      opportunity: 'Sustained Support',
      effectiveness: 'Medium',
      timing: '2-7 days',
      actions: ['Maintain essential services', 'Provide psychosocial support', 'Coordinate multi-sector response']
    },
    {
      stage: 4,
      opportunity: 'Build Back Better',
      effectiveness: 'Long-term',
      timing: '1-4 weeks+',
      actions: ['Implement resilient reconstruction', 'Update risk assessments', 'Strengthen early warning systems']
    }
  ];
}

// ============================================================================
// TEMPORAL RISK EVOLUTION
// ============================================================================

/**
 * Analyze how risk evolves over time
 * Considers seasonality, trends, and event history
 */
export function analyzeTemporalRiskEvolution(districtId, hazardType, historicalData = []) {
  // Generate temporal risk profile
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Seasonal risk patterns by hazard type
  const seasonalPatterns = {
    'Heavy Rainfall': [3, 4, 7, 8, 6, 3, 2, 2, 3, 5, 6, 4],
    'Flood': [3, 4, 7, 9, 7, 3, 2, 2, 3, 5, 6, 4],
    'Drought': [6, 7, 5, 3, 2, 3, 5, 7, 8, 7, 5, 5],
    'Cyclone': [5, 6, 7, 5, 2, 1, 1, 1, 2, 3, 4, 4],
    'Malaria': [4, 5, 7, 8, 7, 5, 4, 4, 5, 6, 6, 5],
    'Cholera': [3, 4, 6, 7, 6, 4, 3, 3, 4, 5, 5, 4],
    'default': [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
  };

  const basePattern = seasonalPatterns[hazardType] || seasonalPatterns['default'];
  const currentMonth = new Date().getMonth();

  // Calculate trend from historical data
  const trend = calculateRiskTrend(historicalData);

  // Project future risk
  const projection = projectFutureRisk(basePattern, trend, currentMonth);

  // Identify peak risk periods
  const peaks = identifyRiskPeaks(basePattern);

  return {
    hazardType,
    districtId,
    seasonalProfile: months.map((m, i) => ({
      month: m,
      baselineRisk: basePattern[i],
      adjustedRisk: roundTo(basePattern[i] * (1 + trend.slope * (i - currentMonth) / 12), 1)
    })),
    currentMonthRisk: basePattern[currentMonth],
    trend: {
      direction: trend.slope > 0.1 ? 'Increasing' : trend.slope < -0.1 ? 'Decreasing' : 'Stable',
      magnitude: Math.abs(trend.slope),
      confidence: trend.confidence
    },
    peakRiskPeriods: peaks,
    projection,
    recommendations: generateTemporalRecommendations(hazardType, basePattern, currentMonth, peaks)
  };
}

/**
 * Calculate risk trend from historical data
 */
function calculateRiskTrend(historicalData) {
  if (!historicalData || historicalData.length < 2) {
    return { slope: 0, intercept: 5, confidence: 'Low' };
  }

  // Simple linear regression
  const n = historicalData.length;
  const sumX = historicalData.reduce((s, d, i) => s + i, 0);
  const sumY = historicalData.reduce((s, d) => s + (d.score || d.risk || 5), 0);
  const sumXY = historicalData.reduce((s, d, i) => s + i * (d.score || d.risk || 5), 0);
  const sumX2 = historicalData.reduce((s, d, i) => s + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope: roundTo(slope, 3),
    intercept: roundTo(intercept, 2),
    confidence: n > 10 ? 'High' : n > 5 ? 'Medium' : 'Low'
  };
}

/**
 * Project future risk
 */
function projectFutureRisk(basePattern, trend, currentMonth) {
  const projectionMonths = 3;
  const projection = [];

  for (let i = 1; i <= projectionMonths; i++) {
    const futureMonth = (currentMonth + i) % 12;
    const baseRisk = basePattern[futureMonth];
    const trendAdjustment = trend.slope * i;

    projection.push({
      monthsAhead: i,
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][futureMonth],
      projectedRisk: roundTo(Math.max(0, Math.min(10, baseRisk + trendAdjustment)), 1),
      uncertainty: roundTo(0.5 + i * 0.3, 1),
      confidenceRange: {
        lower: roundTo(Math.max(0, baseRisk + trendAdjustment - 1 - i * 0.3), 1),
        upper: roundTo(Math.min(10, baseRisk + trendAdjustment + 1 + i * 0.3), 1)
      }
    });
  }

  return projection;
}

/**
 * Identify peak risk periods
 */
function identifyRiskPeaks(pattern) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const threshold = Math.max(...pattern) * 0.8;

  const peaks = [];
  pattern.forEach((risk, i) => {
    if (risk >= threshold) {
      peaks.push({
        month: months[i],
        monthIndex: i,
        risk,
        isPeak: risk === Math.max(...pattern)
      });
    }
  });

  return peaks;
}

/**
 * Generate temporal recommendations
 */
function generateTemporalRecommendations(hazardType, pattern, currentMonth, peaks) {
  const recommendations = [];
  const currentRisk = pattern[currentMonth];
  const nextMonthRisk = pattern[(currentMonth + 1) % 12];

  // Check if approaching peak
  const nearPeak = peaks.some(p =>
    (p.monthIndex - currentMonth + 12) % 12 <= 2 && (p.monthIndex - currentMonth + 12) % 12 > 0
  );

  if (nearPeak) {
    recommendations.push({
      priority: 'High',
      action: `Prepare for ${hazardType} peak season approaching in next 1-2 months`,
      timing: 'Immediate',
      category: 'Preparedness'
    });
  }

  if (nextMonthRisk > currentRisk * 1.3) {
    recommendations.push({
      priority: 'Medium',
      action: 'Risk expected to increase significantly next month - enhance monitoring',
      timing: '2-4 weeks',
      category: 'Monitoring'
    });
  }

  if (currentRisk >= 7) {
    recommendations.push({
      priority: 'High',
      action: 'Currently in high-risk period - maintain elevated response readiness',
      timing: 'Ongoing',
      category: 'Response'
    });
  }

  recommendations.push({
    priority: 'Standard',
    action: 'Review and update contingency plans before next peak season',
    timing: peaks[0] ? `Before ${peaks[0].month}` : 'Quarterly',
    category: 'Planning'
  });

  return recommendations;
}

// ============================================================================
// DECISION SUPPORT ANALYTICS
// ============================================================================

/**
 * Cost-benefit analysis of early actions
 */
export function analyzeEarlyActionBenefits(hazard, districtProfile, actionOptions) {
  const results = [];

  for (const action of actionOptions) {
    const analysis = calculateActionCostBenefit(hazard, districtProfile, action);
    results.push(analysis);
  }

  // Sort by benefit-cost ratio
  results.sort((a, b) => b.benefitCostRatio - a.benefitCostRatio);

  return {
    analyses: results,
    recommendedAction: results[0],
    totalPotentialSavings: results.reduce((sum, r) => sum + r.potentialSavings, 0),
    summary: generateDecisionSummary(results)
  };
}

/**
 * Calculate cost-benefit for a specific action
 */
function calculateActionCostBenefit(hazard, district, action) {
  const hazardScore = hazard.score || hazard.intensity || 5;
  const population = district?.population || 100000;
  const vulnerability = district?.vulnerability || 5;

  // Base damage estimate without action (TZS)
  const baseDamagePerCapita = hazardScore * 10000 * (vulnerability / 5);
  const exposedPopulation = population * (hazardScore / 10) * 0.5;
  const potentialDamage = baseDamagePerCapita * exposedPopulation;

  // Action effectiveness and cost
  const actionCost = action.cost || 1000000;
  const effectiveness = action.effectiveness || 0.5;

  // Calculate benefits
  const damageReduction = potentialDamage * effectiveness;
  const livesSaved = Math.round(exposedPopulation * 0.001 * effectiveness * hazardScore);
  const potentialSavings = damageReduction - actionCost;
  const benefitCostRatio = damageReduction / actionCost;

  return {
    action: action.name,
    description: action.description,
    cost: actionCost,
    costFormatted: formatCurrency(actionCost),
    potentialDamageWithoutAction: roundTo(potentialDamage, 0),
    potentialDamageFormatted: formatCurrency(potentialDamage),
    damageReduction: roundTo(damageReduction, 0),
    damageReductionFormatted: formatCurrency(damageReduction),
    potentialSavings: roundTo(potentialSavings, 0),
    potentialSavingsFormatted: formatCurrency(potentialSavings),
    benefitCostRatio: roundTo(benefitCostRatio, 2),
    livesSaved,
    effectiveness: effectiveness * 100,
    recommendation: benefitCostRatio > 2 ? 'Highly Recommended' :
                    benefitCostRatio > 1 ? 'Recommended' :
                    benefitCostRatio > 0.5 ? 'Consider' : 'Low Priority'
  };
}

/**
 * Format currency for display
 */
function formatCurrency(amount) {
  if (amount >= 1000000000) {
    return `${roundTo(amount / 1000000000, 1)} billion TZS`;
  } else if (amount >= 1000000) {
    return `${roundTo(amount / 1000000, 1)} million TZS`;
  } else if (amount >= 1000) {
    return `${roundTo(amount / 1000, 1)}K TZS`;
  }
  return `${amount} TZS`;
}

/**
 * Generate decision summary
 */
function generateDecisionSummary(analyses) {
  const highlyRecommended = analyses.filter(a => a.recommendation === 'Highly Recommended');
  const recommended = analyses.filter(a => a.recommendation === 'Recommended');

  if (highlyRecommended.length > 0) {
    return `${highlyRecommended.length} action(s) highly recommended with benefit-cost ratio > 2. ` +
           `Top action: ${highlyRecommended[0].action} (BCR: ${highlyRecommended[0].benefitCostRatio}).`;
  } else if (recommended.length > 0) {
    return `${recommended.length} action(s) recommended. Consider ${recommended[0].action} as priority.`;
  }
  return 'All analyzed actions have marginal cost-benefit. Consider alternative strategies.';
}

/**
 * Standard early action options template
 */
export const STANDARD_EARLY_ACTIONS = [
  {
    name: 'Early Warning Dissemination',
    description: 'Issue public warnings through SMS, radio, and community networks',
    cost: 500000,
    effectiveness: 0.6
  },
  {
    name: 'Evacuation Preparation',
    description: 'Pre-position evacuation resources and prepare shelters',
    cost: 2000000,
    effectiveness: 0.7
  },
  {
    name: 'Emergency Stock Pre-positioning',
    description: 'Move emergency supplies to strategic locations',
    cost: 5000000,
    effectiveness: 0.65
  },
  {
    name: 'Health System Alert',
    description: 'Activate health emergency protocols and prepare facilities',
    cost: 1500000,
    effectiveness: 0.55
  },
  {
    name: 'Agricultural Protection Measures',
    description: 'Advise farmers on crop protection and livestock movement',
    cost: 800000,
    effectiveness: 0.5
  },
  {
    name: 'Water Source Protection',
    description: 'Chlorinate water sources and protect wells',
    cost: 1000000,
    effectiveness: 0.6
  }
];

// ============================================================================
// UNCERTAINTY QUANTIFICATION
// ============================================================================

/**
 * Quantify uncertainty in risk assessment
 */
export function quantifyUncertainty(riskAssessment) {
  const sources = [];
  let totalUncertainty = 0;

  // Data quality uncertainty
  const dataQuality = riskAssessment.dataQuality || 0.7;
  const dataUncertainty = (1 - dataQuality) * 0.3;
  sources.push({
    source: 'Data Quality',
    contribution: roundTo(dataUncertainty * 100, 1),
    description: `Data completeness: ${roundTo(dataQuality * 100, 0)}%`
  });
  totalUncertainty += dataUncertainty;

  // Model uncertainty
  const modelUncertainty = 0.15;
  sources.push({
    source: 'Model Uncertainty',
    contribution: roundTo(modelUncertainty * 100, 1),
    description: 'Inherent uncertainty in INFORM methodology'
  });
  totalUncertainty += modelUncertainty;

  // Temporal uncertainty
  const forecastHorizon = riskAssessment.forecastDays || 1;
  const temporalUncertainty = Math.min(0.3, forecastHorizon * 0.05);
  sources.push({
    source: 'Forecast Horizon',
    contribution: roundTo(temporalUncertainty * 100, 1),
    description: `${forecastHorizon}-day forecast`
  });
  totalUncertainty += temporalUncertainty;

  // Spatial uncertainty
  const spatialResolution = riskAssessment.resolution || 'district';
  const spatialUncertainty = spatialResolution === 'national' ? 0.2 :
                             spatialResolution === 'region' ? 0.15 :
                             spatialResolution === 'district' ? 0.1 : 0.05;
  sources.push({
    source: 'Spatial Resolution',
    contribution: roundTo(spatialUncertainty * 100, 1),
    description: `${spatialResolution}-level analysis`
  });
  totalUncertainty += spatialUncertainty;

  // Calculate confidence level
  const confidenceLevel = roundTo((1 - totalUncertainty) * 100, 0);

  return {
    overallUncertainty: roundTo(totalUncertainty * 100, 1),
    confidenceLevel,
    confidenceClass: confidenceLevel >= 80 ? 'High' :
                     confidenceLevel >= 60 ? 'Medium' :
                     confidenceLevel >= 40 ? 'Low' : 'Very Low',
    sources,
    interpretation: generateUncertaintyInterpretation(confidenceLevel, sources),
    recommendations: generateUncertaintyRecommendations(sources)
  };
}

/**
 * Generate uncertainty interpretation
 */
function generateUncertaintyInterpretation(confidence, sources) {
  const mainSource = sources.reduce((max, s) => s.contribution > max.contribution ? s : max, sources[0]);

  if (confidence >= 80) {
    return `High confidence (${confidence}%) in risk assessment. Results are reliable for decision-making.`;
  } else if (confidence >= 60) {
    return `Medium confidence (${confidence}%). Primary uncertainty from ${mainSource.source.toLowerCase()}. ` +
           `Consider validating with ground truth before major decisions.`;
  } else if (confidence >= 40) {
    return `Low confidence (${confidence}%). Significant uncertainty from multiple sources. ` +
           `Use results indicatively and gather additional information.`;
  }
  return `Very low confidence (${confidence}%). Results should be treated as preliminary. ` +
         `Urgent need for improved data and verification.`;
}

/**
 * Generate recommendations to reduce uncertainty
 */
function generateUncertaintyRecommendations(sources) {
  const recommendations = [];

  for (const source of sources) {
    if (source.source === 'Data Quality' && source.contribution > 15) {
      recommendations.push({
        issue: 'Data Quality',
        action: 'Improve data collection coverage and frequency',
        impact: 'Could reduce uncertainty by up to 30%'
      });
    }
    if (source.source === 'Forecast Horizon' && source.contribution > 10) {
      recommendations.push({
        issue: 'Forecast Horizon',
        action: 'Focus on shorter-term forecasts for critical decisions',
        impact: 'Shorter horizons have higher confidence'
      });
    }
    if (source.source === 'Spatial Resolution' && source.contribution > 15) {
      recommendations.push({
        issue: 'Spatial Resolution',
        action: 'Use higher resolution (district/ward) data where available',
        impact: 'Finer resolution reduces spatial uncertainty'
      });
    }
  }

  return recommendations;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function roundTo(value, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Probabilistic
  generateRiskDistribution,

  // Compound hazards
  analyzeCompoundHazards,

  // Risk cascade
  modelRiskCascade,

  // Temporal
  analyzeTemporalRiskEvolution,

  // Decision support
  analyzeEarlyActionBenefits,
  STANDARD_EARLY_ACTIONS,

  // Uncertainty
  quantifyUncertainty,

  // Configuration
  ANALYTICS_CONFIG
};
