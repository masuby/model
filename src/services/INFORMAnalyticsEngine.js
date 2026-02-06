/**
 * INFORM ANALYTICS ENGINE
 *
 * Next-generation analytics engine for INFORM Risk Assessment
 * Features:
 * - Pattern Detection & Anomaly Analysis
 * - Trend Forecasting with Statistical Models
 * - Cross-dimensional Correlation Analysis
 * - Data Quality Scoring & Validation
 * - Smart Insights Generation
 * - Comparative Analysis Engine
 *
 * Built with precision algorithms that transform raw data into actionable intelligence
 */

import {
  INDICATOR_DEFINITIONS,
  DIMENSION_STRUCTURE,
  RISK_CLASSIFICATION,
  calculateINFORMRisk,
  classifyRisk
} from './informCalculationService';

// ============================================================================
// CORE ANALYTICS CONFIGURATION
// ============================================================================

const ANALYTICS_CONFIG = {
  ANOMALY_THRESHOLD: 1.5,      // Standard deviations for anomaly detection
  TREND_WINDOW: 6,             // Months for trend calculation
  CONFIDENCE_LEVELS: {
    HIGH: 0.95,
    MEDIUM: 0.80,
    LOW: 0.65
  },
  CORRELATION_THRESHOLD: 0.7,  // Minimum for significant correlation
  INSIGHT_PRIORITY_WEIGHTS: {
    CRITICAL: 100,
    HIGH: 75,
    MEDIUM: 50,
    LOW: 25
  }
};

// ============================================================================
// STATISTICAL UTILITIES
// ============================================================================

/**
 * Calculate mean of array
 */
export const mean = (arr) => {
  const valid = arr.filter(v => v != null && !isNaN(v));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
};

/**
 * Calculate standard deviation
 */
export const standardDeviation = (arr) => {
  const avg = mean(arr);
  if (avg === null) return null;
  const valid = arr.filter(v => v != null && !isNaN(v));
  const squaredDiffs = valid.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / valid.length);
};

/**
 * Calculate percentile value
 */
export const percentile = (arr, p) => {
  const sorted = [...arr].filter(v => v != null).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
};

/**
 * Calculate z-score
 */
export const zScore = (value, arr) => {
  const avg = mean(arr);
  const std = standardDeviation(arr);
  if (avg === null || std === null || std === 0) return 0;
  return (value - avg) / std;
};

/**
 * Pearson correlation coefficient
 */
export const correlation = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return null;
  const n = arr1.length;
  const mean1 = mean(arr1);
  const mean2 = mean(arr2);
  if (mean1 === null || mean2 === null) return null;

  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;

  for (let i = 0; i < n; i++) {
    if (arr1[i] != null && arr2[i] != null) {
      const d1 = arr1[i] - mean1;
      const d2 = arr2[i] - mean2;
      numerator += d1 * d2;
      denom1 += d1 * d1;
      denom2 += d2 * d2;
    }
  }

  const denom = Math.sqrt(denom1 * denom2);
  return denom === 0 ? 0 : numerator / denom;
};

/**
 * Linear regression for trend analysis
 */
export const linearRegression = (data) => {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  const xMean = (n - 1) / 2;
  const yMean = mean(data.map(d => d.value));
  if (yMean === null) return { slope: 0, intercept: 0, r2: 0 };

  let ssXY = 0;
  let ssXX = 0;
  let ssYY = 0;

  data.forEach((d, i) => {
    const dx = i - xMean;
    const dy = d.value - yMean;
    ssXY += dx * dy;
    ssXX += dx * dx;
    ssYY += dy * dy;
  });

  const slope = ssXX !== 0 ? ssXY / ssXX : 0;
  const intercept = yMean - slope * xMean;
  const r2 = ssYY !== 0 ? (ssXY * ssXY) / (ssXX * ssYY) : 0;

  return { slope, intercept, r2 };
};

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

/**
 * Detect anomalies in data using z-score method
 */
export function detectAnomalies(dataPoints, threshold = ANALYTICS_CONFIG.ANOMALY_THRESHOLD) {
  const values = dataPoints.map(d => d.value);
  const avg = mean(values);
  const std = standardDeviation(values);

  if (avg === null || std === null) return { anomalies: [], stats: null };

  const anomalies = dataPoints
    .map((point, idx) => ({
      ...point,
      zScore: zScore(point.value, values),
      deviation: Math.abs(point.value - avg),
      isAnomaly: Math.abs(zScore(point.value, values)) > threshold
    }))
    .filter(p => p.isAnomaly)
    .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));

  return {
    anomalies,
    stats: {
      mean: avg,
      std,
      threshold,
      totalPoints: dataPoints.length,
      anomalyCount: anomalies.length,
      anomalyRate: (anomalies.length / dataPoints.length * 100).toFixed(1)
    }
  };
}

/**
 * Detect regional outliers
 */
export function detectRegionalOutliers(regions) {
  const riskValues = regions.map(r => r.risk || r.calculated?.riskScore).filter(v => v != null);

  return regions.map(region => {
    const risk = region.risk || region.calculated?.riskScore;
    if (risk == null) return { ...region, outlierStatus: 'unknown' };

    const z = zScore(risk, riskValues);
    return {
      ...region,
      zScore: z,
      outlierStatus: Math.abs(z) > 2 ? 'extreme' : Math.abs(z) > 1.5 ? 'moderate' : 'normal',
      deviationPercent: ((risk - mean(riskValues)) / mean(riskValues) * 100).toFixed(1)
    };
  });
}

// ============================================================================
// TREND ANALYSIS
// ============================================================================

/**
 * Analyze trend from historical data
 */
export function analyzeTrend(historicalData) {
  if (!historicalData?.length || historicalData.length < 2) {
    return { trend: 'stable', confidence: 'low', details: null };
  }

  const regression = linearRegression(historicalData);
  const lastValue = historicalData[historicalData.length - 1]?.value;
  const firstValue = historicalData[0]?.value;

  // Calculate percentage change
  const percentChange = firstValue !== 0
    ? ((lastValue - firstValue) / firstValue * 100)
    : 0;

  // Determine trend direction and strength
  let trend, strength;
  const absSlope = Math.abs(regression.slope);

  if (absSlope < 0.05) {
    trend = 'stable';
    strength = 'none';
  } else if (regression.slope > 0) {
    trend = 'increasing';
    strength = absSlope > 0.3 ? 'strong' : absSlope > 0.1 ? 'moderate' : 'weak';
  } else {
    trend = 'decreasing';
    strength = absSlope > 0.3 ? 'strong' : absSlope > 0.1 ? 'moderate' : 'weak';
  }

  // Confidence based on R-squared
  const confidence = regression.r2 > 0.8 ? 'high' : regression.r2 > 0.5 ? 'medium' : 'low';

  return {
    trend,
    strength,
    confidence,
    details: {
      slope: regression.slope.toFixed(4),
      r2: regression.r2.toFixed(3),
      percentChange: percentChange.toFixed(1),
      dataPoints: historicalData.length,
      projection: {
        nextValue: lastValue + regression.slope,
        sixMonthValue: lastValue + (regression.slope * 6)
      }
    }
  };
}

/**
 * Forecast future values using exponential smoothing
 */
export function forecastRisk(historicalData, periodsAhead = 3) {
  if (!historicalData?.length) return [];

  const alpha = 0.3; // Smoothing factor
  let smoothed = historicalData[0]?.value || 0;

  historicalData.forEach(d => {
    smoothed = alpha * d.value + (1 - alpha) * smoothed;
  });

  const forecast = [];
  const lastDate = new Date(historicalData[historicalData.length - 1]?.date || Date.now());

  for (let i = 1; i <= periodsAhead; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setMonth(forecastDate.getMonth() + i);

    forecast.push({
      date: forecastDate.toISOString(),
      value: Math.max(0, Math.min(10, smoothed)),
      type: 'forecast',
      confidence: Math.max(0.5, 1 - (i * 0.1))
    });
  }

  return forecast;
}

// ============================================================================
// CORRELATION ANALYSIS
// ============================================================================

/**
 * Calculate correlation matrix between dimensions
 */
export function calculateCorrelationMatrix(data) {
  const dimensions = ['hazard', 'vulnerability', 'coping'];
  const matrix = {};

  dimensions.forEach(d1 => {
    matrix[d1] = {};
    dimensions.forEach(d2 => {
      const arr1 = data.map(r => r[`${d1}Score`] || r.calculated?.[`${d1}Score`]);
      const arr2 = data.map(r => r[`${d2}Score`] || r.calculated?.[`${d2}Score`]);
      matrix[d1][d2] = correlation(arr1, arr2);
    });
  });

  return matrix;
}

/**
 * Find significant correlations between indicators
 */
export function findSignificantCorrelations(submissions) {
  const correlations = [];
  const indicators = Object.keys(INDICATOR_DEFINITIONS);

  for (let i = 0; i < indicators.length; i++) {
    for (let j = i + 1; j < indicators.length; j++) {
      const ind1 = indicators[i];
      const ind2 = indicators[j];

      const values1 = submissions.map(s => s.indicators?.[ind1]?.value).filter(v => v != null);
      const values2 = submissions.map(s => s.indicators?.[ind2]?.value).filter(v => v != null);

      if (values1.length >= 3 && values2.length >= 3) {
        const corr = correlation(values1, values2);
        if (Math.abs(corr) >= ANALYTICS_CONFIG.CORRELATION_THRESHOLD) {
          correlations.push({
            indicator1: INDICATOR_DEFINITIONS[ind1]?.name || ind1,
            indicator2: INDICATOR_DEFINITIONS[ind2]?.name || ind2,
            correlation: corr,
            strength: Math.abs(corr) > 0.9 ? 'very strong' : Math.abs(corr) > 0.8 ? 'strong' : 'moderate',
            direction: corr > 0 ? 'positive' : 'negative'
          });
        }
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

// ============================================================================
// DATA QUALITY SCORING
// ============================================================================

/**
 * Calculate comprehensive data quality score
 */
export function calculateDataQualityScore(submission) {
  const scores = {
    completeness: 0,
    consistency: 0,
    timeliness: 0,
    validity: 0
  };

  const indicators = submission?.indicators || {};
  const totalIndicators = Object.keys(INDICATOR_DEFINITIONS).length;
  const providedIndicators = Object.keys(indicators).filter(k => indicators[k]?.value != null).length;

  // Completeness: How many indicators are filled
  scores.completeness = Math.min(100, (providedIndicators / totalIndicators) * 100);

  // Consistency: Check if values are within expected ranges
  let validCount = 0;
  let totalChecked = 0;
  Object.entries(indicators).forEach(([key, data]) => {
    if (data?.value != null) {
      totalChecked++;
      if (data.value >= 0 && data.value <= 10) validCount++;
    }
  });
  scores.consistency = totalChecked > 0 ? (validCount / totalChecked) * 100 : 0;

  // Timeliness: How recent is the data
  const submittedAt = new Date(submission?.submittedAt || Date.now());
  const ageInDays = (Date.now() - submittedAt.getTime()) / (1000 * 60 * 60 * 24);
  scores.timeliness = Math.max(0, 100 - (ageInDays * 2)); // Decay 2% per day

  // Validity: Are all required dimensions represented
  const hasDimensions = {
    hazard: Object.keys(indicators).some(k => INDICATOR_DEFINITIONS[k]?.dimension === 'HAZARD'),
    vulnerability: Object.keys(indicators).some(k => INDICATOR_DEFINITIONS[k]?.dimension === 'VULNERABILITY'),
    coping: Object.keys(indicators).some(k => INDICATOR_DEFINITIONS[k]?.dimension === 'COPING_CAPACITY')
  };
  scores.validity = (Object.values(hasDimensions).filter(Boolean).length / 3) * 100;

  // Overall score (weighted average)
  const overall = (
    scores.completeness * 0.35 +
    scores.consistency * 0.25 +
    scores.timeliness * 0.20 +
    scores.validity * 0.20
  );

  return {
    overall: Math.round(overall),
    breakdown: scores,
    grade: overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : overall >= 60 ? 'D' : 'F',
    recommendations: generateQualityRecommendations(scores)
  };
}

/**
 * Generate recommendations for improving data quality
 */
function generateQualityRecommendations(scores) {
  const recommendations = [];

  if (scores.completeness < 80) {
    recommendations.push({
      priority: 'high',
      area: 'completeness',
      message: 'More indicators should be filled for comprehensive risk assessment'
    });
  }

  if (scores.consistency < 90) {
    recommendations.push({
      priority: 'medium',
      area: 'consistency',
      message: 'Some values may be outside expected ranges (0-10)'
    });
  }

  if (scores.timeliness < 70) {
    recommendations.push({
      priority: 'high',
      area: 'timeliness',
      message: 'Data may be outdated. Consider updating with recent information'
    });
  }

  if (scores.validity < 100) {
    recommendations.push({
      priority: 'critical',
      area: 'validity',
      message: 'All three dimensions (Hazard, Vulnerability, Coping) must have data'
    });
  }

  return recommendations.sort((a, b) => {
    const priority = { critical: 4, high: 3, medium: 2, low: 1 };
    return priority[b.priority] - priority[a.priority];
  });
}

// ============================================================================
// SMART INSIGHTS GENERATION
// ============================================================================

/**
 * Generate intelligent insights from approved data
 */
export function generateSmartInsights(approvedData, nationalBaseline = null) {
  const insights = [];

  if (!approvedData?.length) {
    return [{
      type: 'info',
      priority: 'low',
      title: 'No Data Yet',
      message: 'Submit and approve committee data to see intelligent insights',
      icon: '📊'
    }];
  }

  // 1. Risk distribution analysis
  const riskScores = approvedData.map(d => d.calculated?.riskScore).filter(v => v != null);
  if (riskScores.length) {
    const avgRisk = mean(riskScores);
    const highRiskCount = riskScores.filter(r => r >= 5).length;
    const highRiskPercent = (highRiskCount / riskScores.length * 100).toFixed(0);

    if (highRiskPercent > 30) {
      insights.push({
        type: 'warning',
        priority: 'critical',
        title: 'High Risk Concentration',
        message: `${highRiskPercent}% of verified areas are classified as High or Very High risk. Immediate attention required.`,
        icon: '🚨',
        metric: { value: highRiskPercent, unit: '%', label: 'High Risk Areas' }
      });
    }

    // Average risk insight
    const riskClass = classifyRisk(avgRisk);
    insights.push({
      type: 'metric',
      priority: 'high',
      title: 'Average Verified Risk',
      message: `Average risk across ${approvedData.length} verified areas is ${avgRisk.toFixed(2)} (${riskClass?.label || 'Unknown'})`,
      icon: '📈',
      metric: { value: avgRisk.toFixed(2), unit: '/10', label: 'Avg Risk' }
    });
  }

  // 2. Dimension dominance analysis
  const dimensionAverages = {
    hazard: mean(approvedData.map(d => d.calculated?.hazardScore).filter(v => v != null)),
    vulnerability: mean(approvedData.map(d => d.calculated?.vulnerabilityScore).filter(v => v != null)),
    coping: mean(approvedData.map(d => d.calculated?.lackOfCopingScore).filter(v => v != null))
  };

  const maxDimension = Object.entries(dimensionAverages)
    .filter(([_, v]) => v != null)
    .sort((a, b) => b[1] - a[1])[0];

  if (maxDimension) {
    const dimensionNames = {
      hazard: 'Hazard & Exposure',
      vulnerability: 'Vulnerability',
      coping: 'Lack of Coping Capacity'
    };

    insights.push({
      type: 'insight',
      priority: 'medium',
      title: 'Primary Risk Driver',
      message: `${dimensionNames[maxDimension[0]]} is the dominant risk factor (${maxDimension[1].toFixed(2)}/10 average)`,
      icon: '🎯',
      recommendation: `Focus interventions on reducing ${dimensionNames[maxDimension[0]].toLowerCase()}`
    });
  }

  // 3. Regional comparison
  const regionGroups = {};
  approvedData.forEach(d => {
    const region = d.adm1Name;
    if (!regionGroups[region]) regionGroups[region] = [];
    regionGroups[region].push(d.calculated?.riskScore);
  });

  const regionRisks = Object.entries(regionGroups)
    .map(([region, scores]) => ({ region, avgRisk: mean(scores.filter(v => v != null)) }))
    .filter(r => r.avgRisk != null)
    .sort((a, b) => b.avgRisk - a.avgRisk);

  if (regionRisks.length >= 2) {
    const highest = regionRisks[0];
    const lowest = regionRisks[regionRisks.length - 1];

    insights.push({
      type: 'comparison',
      priority: 'high',
      title: 'Regional Disparity',
      message: `${highest.region} has the highest average risk (${highest.avgRisk.toFixed(2)}) while ${lowest.region} has the lowest (${lowest.avgRisk.toFixed(2)})`,
      icon: '🗺️',
      data: { highest, lowest, gap: (highest.avgRisk - lowest.avgRisk).toFixed(2) }
    });
  }

  // 4. Data coverage
  insights.push({
    type: 'coverage',
    priority: 'medium',
    title: 'Verification Coverage',
    message: `${approvedData.length} areas have committee-verified data integrated into the risk profile`,
    icon: '✅',
    metric: { value: approvedData.length, unit: 'areas', label: 'Verified' }
  });

  // 5. Recent activity
  const recentSubmissions = approvedData.filter(d => {
    const approvedAt = new Date(d.approvedAt);
    const daysSince = (Date.now() - approvedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });

  if (recentSubmissions.length > 0) {
    insights.push({
      type: 'activity',
      priority: 'low',
      title: 'Recent Verifications',
      message: `${recentSubmissions.length} new area(s) verified in the past 7 days`,
      icon: '🆕'
    });
  }

  return insights.sort((a, b) => {
    const priority = ANALYTICS_CONFIG.INSIGHT_PRIORITY_WEIGHTS;
    return (priority[b.priority?.toUpperCase()] || 0) - (priority[a.priority?.toUpperCase()] || 0);
  });
}

// ============================================================================
// COMPARATIVE ANALYSIS
// ============================================================================

/**
 * Compare risk profiles across regions
 */
export function compareRegions(region1Data, region2Data) {
  const comparison = {
    region1: extractRegionMetrics(region1Data),
    region2: extractRegionMetrics(region2Data),
    differences: {},
    analysis: []
  };

  // Calculate differences
  ['hazard', 'vulnerability', 'coping', 'risk'].forEach(metric => {
    const v1 = comparison.region1[metric];
    const v2 = comparison.region2[metric];
    if (v1 != null && v2 != null) {
      comparison.differences[metric] = {
        absolute: v1 - v2,
        percentage: ((v1 - v2) / v2 * 100).toFixed(1),
        higherRegion: v1 > v2 ? region1Data.adm1Name : region2Data.adm1Name
      };
    }
  });

  return comparison;
}

/**
 * Extract key metrics from region data
 */
function extractRegionMetrics(regionData) {
  const calc = regionData?.calculated || regionData;
  return {
    name: regionData?.adm1Name || 'Unknown',
    hazard: calc?.hazardScore || calc?.hazard,
    vulnerability: calc?.vulnerabilityScore || calc?.vulnerability,
    coping: calc?.lackOfCopingScore || calc?.coping,
    risk: calc?.riskScore || calc?.risk,
    classification: calc?.riskClass || classifyRisk(calc?.riskScore || calc?.risk)?.label
  };
}

/**
 * Generate benchmark comparison against national average
 */
export function benchmarkAgainstNational(regionData, nationalData) {
  const regionMetrics = extractRegionMetrics(regionData);
  const nationalMetrics = {
    hazard: nationalData?.hazardExposure,
    vulnerability: nationalData?.vulnerability,
    coping: nationalData?.lackCopingCapacity,
    risk: nationalData?.risk
  };

  const benchmark = {
    region: regionMetrics.name,
    comparisons: {}
  };

  ['hazard', 'vulnerability', 'coping', 'risk'].forEach(metric => {
    const regional = regionMetrics[metric];
    const national = nationalMetrics[metric];

    if (regional != null && national != null) {
      const diff = regional - national;
      benchmark.comparisons[metric] = {
        regional,
        national,
        difference: diff.toFixed(2),
        percentDiff: ((diff / national) * 100).toFixed(1),
        status: diff > 0.5 ? 'above' : diff < -0.5 ? 'below' : 'similar'
      };
    }
  });

  return benchmark;
}

// ============================================================================
// RISK EVOLUTION TRACKING
// ============================================================================

/**
 * Track risk evolution over time
 */
export function trackRiskEvolution(approvedData) {
  // Group by month
  const byMonth = {};

  approvedData.forEach(d => {
    const date = new Date(d.approvedAt || d.submittedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!byMonth[monthKey]) {
      byMonth[monthKey] = { submissions: [], riskScores: [], date: monthKey };
    }

    byMonth[monthKey].submissions.push(d);
    if (d.calculated?.riskScore != null) {
      byMonth[monthKey].riskScores.push(d.calculated.riskScore);
    }
  });

  // Calculate monthly statistics
  const evolution = Object.values(byMonth)
    .map(month => ({
      ...month,
      avgRisk: mean(month.riskScores),
      count: month.submissions.length,
      minRisk: Math.min(...month.riskScores.filter(v => v != null)),
      maxRisk: Math.max(...month.riskScores.filter(v => v != null))
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    timeline: evolution,
    trend: analyzeTrend(evolution.map(e => ({ value: e.avgRisk, date: e.date }))),
    summary: {
      totalMonths: evolution.length,
      totalSubmissions: approvedData.length,
      latestAvgRisk: evolution[evolution.length - 1]?.avgRisk
    }
  };
}

// ============================================================================
// RISK HOTSPOT DETECTION
// ============================================================================

/**
 * Identify risk hotspots
 */
export function identifyHotspots(approvedData, threshold = 5.0) {
  const hotspots = approvedData
    .filter(d => (d.calculated?.riskScore || 0) >= threshold)
    .map(d => ({
      id: d.id,
      region: d.adm1Name,
      district: d.adm2Name || d.adm1Name,
      riskScore: d.calculated?.riskScore,
      classification: d.calculated?.riskClass,
      dominantFactor: getDominantFactor(d.calculated),
      urgency: d.calculated?.riskScore >= 6.5 ? 'critical' : 'high'
    }))
    .sort((a, b) => b.riskScore - a.riskScore);

  return {
    hotspots,
    count: hotspots.length,
    criticalCount: hotspots.filter(h => h.urgency === 'critical').length,
    regions: [...new Set(hotspots.map(h => h.region))]
  };
}

/**
 * Get the dominant factor driving risk
 */
function getDominantFactor(calculated) {
  if (!calculated) return null;

  const factors = {
    'Hazard & Exposure': calculated.hazardScore,
    'Vulnerability': calculated.vulnerabilityScore,
    'Lack of Coping Capacity': calculated.lackOfCopingScore
  };

  const sorted = Object.entries(factors)
    .filter(([_, v]) => v != null)
    .sort((a, b) => b[1] - a[1]);

  return sorted[0] ? { name: sorted[0][0], score: sorted[0][1] } : null;
}

// ============================================================================
// EXPORT ANALYTICS ENGINE
// ============================================================================

export default {
  // Statistics
  mean,
  standardDeviation,
  percentile,
  zScore,
  correlation,
  linearRegression,

  // Anomaly Detection
  detectAnomalies,
  detectRegionalOutliers,

  // Trend Analysis
  analyzeTrend,
  forecastRisk,

  // Correlation Analysis
  calculateCorrelationMatrix,
  findSignificantCorrelations,

  // Data Quality
  calculateDataQualityScore,

  // Smart Insights
  generateSmartInsights,

  // Comparative Analysis
  compareRegions,
  benchmarkAgainstNational,

  // Evolution Tracking
  trackRiskEvolution,

  // Hotspot Detection
  identifyHotspots
};
