/**
 * ADVANCED REPORTING AND ANALYTICS ENGINE - ENHANCED VERSION
 *
 * Comprehensive reporting system for INFORM Tanzania data.
 *
 * ENHANCED FEATURES:
 * - Multiple report types and templates
 * - Trend analysis over time periods
 * - Statistical analysis (quartiles, standard deviation, correlation)
 * - Comparative analysis between regions/districts
 * - Vulnerability and coping capacity assessments
 * - Executive summaries and dashboards
 * - Data quality reports
 * - Scheduled report generation
 * - Multi-language support (English/Swahili)
 * - Interactive chart data structures
 * - PDF/Excel report structures
 * - Risk hotspot detection
 * - Alert and notification integration
 */

import { INDICATOR_DEFINITIONS, COMPONENT_DEFINITIONS, CATEGORY_DEFINITIONS, DIMENSION_DEFINITIONS } from './advancedSchema.js';
import { TANZANIA_REGIONS_COMPLETE, TANZANIA_DISTRICTS_COMPLETE, TANZANIA_ZONES } from './tanzaniaDistrictsData.js';
import { classifyRisk, classifyWarning } from './formulaEngine.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

export const REPORTING_CONFIG = {
  // Language settings
  languages: {
    default: 'en',
    supported: ['en', 'sw']
  },

  // Report scheduling
  scheduling: {
    enabled: true,
    defaultInterval: 'monthly',
    intervals: ['daily', 'weekly', 'monthly', 'quarterly', 'annually']
  },

  // Visualization settings
  charts: {
    defaultColorScheme: 'risk',
    colorSchemes: {
      risk: ['#2E7D32', '#8BC34A', '#FFC107', '#FF9800', '#D32F2F'],
      dimension: ['#1976D2', '#9C27B0', '#FF5722'],
      category: ['#00BCD4', '#4CAF50', '#FF9800', '#E91E63', '#3F51B5']
    }
  },

  // Statistical settings
  statistics: {
    confidenceLevel: 0.95,
    outlierThreshold: 2.5, // Standard deviations
    trendMinPeriods: 3
  },

  // Alert thresholds
  alerts: {
    riskIncreasePercent: 10,
    highRiskCount: 5,
    dataQualityMin: 70
  }
};

// ============================================================================
// TRANSLATIONS
// ============================================================================

export const TRANSLATIONS = {
  en: {
    reportTypes: {
      RISK_OVERVIEW: 'Risk Overview',
      REGIONAL_PROFILE: 'Regional Profile',
      DISTRICT_PROFILE: 'District Profile',
      COMPARATIVE_ANALYSIS: 'Comparative Analysis',
      TREND_ANALYSIS: 'Trend Analysis',
      VULNERABILITY_ASSESSMENT: 'Vulnerability Assessment',
      COPING_CAPACITY_ASSESSMENT: 'Coping Capacity Assessment',
      HAZARD_EXPOSURE: 'Hazard Exposure Analysis',
      DATA_QUALITY: 'Data Quality Report',
      EXECUTIVE_SUMMARY: 'Executive Summary',
      DASHBOARD: 'Dashboard Report',
      HOTSPOT_ANALYSIS: 'Risk Hotspot Analysis'
    },
    riskLevels: {
      veryLow: 'Very Low',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      veryHigh: 'Very High'
    },
    dimensions: {
      hazard: 'Hazard & Exposure',
      vulnerability: 'Vulnerability',
      copingCapacity: 'Lack of Coping Capacity'
    },
    labels: {
      generatedAt: 'Generated At',
      dataYear: 'Data Year',
      totalAreas: 'Total Areas Assessed',
      averageRisk: 'Average Risk Index',
      recommendations: 'Recommendations',
      findings: 'Key Findings',
      summary: 'Summary',
      distribution: 'Risk Distribution',
      topRisk: 'Highest Risk Areas',
      lowestRisk: 'Lowest Risk Areas'
    }
  },
  sw: {
    reportTypes: {
      RISK_OVERVIEW: 'Muhtasari wa Hatari',
      REGIONAL_PROFILE: 'Wasifu wa Mkoa',
      DISTRICT_PROFILE: 'Wasifu wa Wilaya',
      COMPARATIVE_ANALYSIS: 'Uchambuzi wa Kulinganisha',
      TREND_ANALYSIS: 'Uchambuzi wa Mwenendo',
      VULNERABILITY_ASSESSMENT: 'Tathmini ya Udhaifu',
      COPING_CAPACITY_ASSESSMENT: 'Tathmini ya Uwezo wa Kukabiliana',
      HAZARD_EXPOSURE: 'Uchambuzi wa Hatari',
      DATA_QUALITY: 'Ripoti ya Ubora wa Takwimu',
      EXECUTIVE_SUMMARY: 'Muhtasari wa Utendaji',
      DASHBOARD: 'Ripoti ya Dashibodi',
      HOTSPOT_ANALYSIS: 'Uchambuzi wa Maeneo Hatarishi'
    },
    riskLevels: {
      veryLow: 'Hatari Ndogo Sana',
      low: 'Hatari Ndogo',
      medium: 'Hatari ya Wastani',
      high: 'Hatari Kubwa',
      veryHigh: 'Hatari Kubwa Sana'
    },
    dimensions: {
      hazard: 'Hatari na Mfiduo',
      vulnerability: 'Udhaifu',
      copingCapacity: 'Ukosefu wa Uwezo wa Kukabiliana'
    },
    labels: {
      generatedAt: 'Imetengenezwa Tarehe',
      dataYear: 'Mwaka wa Takwimu',
      totalAreas: 'Jumla ya Maeneo',
      averageRisk: 'Wastani wa Hatari',
      recommendations: 'Mapendekezo',
      findings: 'Matokeo Muhimu',
      summary: 'Muhtasari',
      distribution: 'Usambazaji wa Hatari',
      topRisk: 'Maeneo yenye Hatari Kubwa',
      lowestRisk: 'Maeneo yenye Hatari Ndogo'
    }
  }
};

// ============================================================================
// REPORT TYPES
// ============================================================================

export const REPORT_TYPES = {
  RISK_OVERVIEW: 'risk_overview',
  REGIONAL_PROFILE: 'regional_profile',
  DISTRICT_PROFILE: 'district_profile',
  COMPARATIVE_ANALYSIS: 'comparative_analysis',
  TREND_ANALYSIS: 'trend_analysis',
  VULNERABILITY_ASSESSMENT: 'vulnerability_assessment',
  COPING_CAPACITY_ASSESSMENT: 'coping_capacity_assessment',
  HAZARD_EXPOSURE: 'hazard_exposure',
  DATA_QUALITY: 'data_quality',
  EXECUTIVE_SUMMARY: 'executive_summary',
  DASHBOARD: 'dashboard',
  HOTSPOT_ANALYSIS: 'hotspot_analysis',
  CUSTOM: 'custom'
};

// ============================================================================
// REPORT STORE
// ============================================================================

const reportStore = {
  generated: new Map(),
  scheduled: new Map(),
  templates: new Map()
};

// ============================================================================
// STATISTICAL UTILITIES
// ============================================================================

/**
 * Calculate basic statistics for an array of values
 * @param {number[]} values - Array of numeric values
 * @returns {Object} Statistics
 */
export function calculateStatistics(values) {
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));

  if (validValues.length === 0) {
    return { count: 0, mean: null, median: null, stdDev: null, min: null, max: null };
  }

  const sorted = [...validValues].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / count;

  // Median
  const mid = Math.floor(count / 2);
  const median = count % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  // Standard deviation
  const squaredDiffs = sorted.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / count;
  const stdDev = Math.sqrt(variance);

  // Quartiles
  const q1Index = Math.floor(count * 0.25);
  const q3Index = Math.floor(count * 0.75);

  return {
    count,
    sum: round(sum, 2),
    mean: round(mean, 2),
    median: round(median, 2),
    stdDev: round(stdDev, 3),
    variance: round(variance, 3),
    min: round(sorted[0], 2),
    max: round(sorted[count - 1], 2),
    range: round(sorted[count - 1] - sorted[0], 2),
    q1: round(sorted[q1Index], 2),
    q3: round(sorted[q3Index], 2),
    iqr: round(sorted[q3Index] - sorted[q1Index], 2),
    coefficientOfVariation: mean !== 0 ? round((stdDev / mean) * 100, 2) : null
  };
}

/**
 * Calculate correlation between two arrays
 * @param {number[]} x - First array
 * @param {number[]} y - Second array
 * @returns {number|null} Pearson correlation coefficient
 */
export function calculateCorrelation(x, y) {
  if (x.length !== y.length || x.length < 2) return null;

  const pairs = x.map((xi, i) => [xi, y[i]])
    .filter(([a, b]) => a !== null && b !== null && !isNaN(a) && !isNaN(b));

  if (pairs.length < 2) return null;

  const n = pairs.length;
  const xVals = pairs.map(p => p[0]);
  const yVals = pairs.map(p => p[1]);

  const xMean = xVals.reduce((a, b) => a + b, 0) / n;
  const yMean = yVals.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let xDenom = 0;
  let yDenom = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = xVals[i] - xMean;
    const yDiff = yVals[i] - yMean;
    numerator += xDiff * yDiff;
    xDenom += xDiff * xDiff;
    yDenom += yDiff * yDiff;
  }

  const denominator = Math.sqrt(xDenom * yDenom);
  return denominator === 0 ? null : round(numerator / denominator, 4);
}

/**
 * Detect outliers using IQR method
 * @param {number[]} values - Array of values
 * @returns {Object} Outlier information
 */
export function detectOutliers(values) {
  const stats = calculateStatistics(values);
  if (!stats.q1 || !stats.q3) return { outliers: [], bounds: { lower: null, upper: null } };

  const iqr = stats.iqr;
  const lowerBound = stats.q1 - 1.5 * iqr;
  const upperBound = stats.q3 + 1.5 * iqr;

  const outliers = values
    .map((v, i) => ({ value: v, index: i }))
    .filter(({ value }) => value !== null && (value < lowerBound || value > upperBound));

  return {
    outliers,
    bounds: { lower: round(lowerBound, 2), upper: round(upperBound, 2) },
    outlierCount: outliers.length,
    outlierPercent: values.length > 0 ? round((outliers.length / values.length) * 100, 1) : 0
  };
}

/**
 * Round to specified decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Decimal places
 * @returns {number} Rounded value
 */
function round(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return null;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// ============================================================================
// CHART DATA GENERATORS
// ============================================================================

/**
 * Generate bar chart data for risk distribution
 * @param {Object} distribution - Risk distribution counts
 * @param {string} language - Language code
 * @returns {Object} Chart data
 */
export function generateDistributionChartData(distribution, language = 'en') {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const colors = REPORTING_CONFIG.charts.colorSchemes.risk;

  return {
    type: 'bar',
    labels: [
      t.riskLevels.veryLow,
      t.riskLevels.low,
      t.riskLevels.medium,
      t.riskLevels.high,
      t.riskLevels.veryHigh
    ],
    datasets: [{
      label: t.labels.distribution,
      data: [
        distribution.veryLow || 0,
        distribution.low || 0,
        distribution.medium || 0,
        distribution.high || 0,
        distribution.veryHigh || 0
      ],
      backgroundColor: colors,
      borderColor: colors.map(c => c),
      borderWidth: 1
    }]
  };
}

/**
 * Generate radar chart data for dimension comparison
 * @param {Object[]} units - Units to compare
 * @returns {Object} Chart data
 */
export function generateDimensionRadarData(units) {
  const labels = ['Hazard & Exposure', 'Vulnerability', 'Lack of Coping Capacity'];
  const colors = REPORTING_CONFIG.charts.colorSchemes.dimension;

  return {
    type: 'radar',
    labels,
    datasets: units.map((unit, i) => ({
      label: unit.name,
      data: [
        unit.hazard || 0,
        unit.vulnerability || 0,
        unit.copingCapacity || 0
      ],
      backgroundColor: `${colors[i % colors.length]}40`,
      borderColor: colors[i % colors.length],
      borderWidth: 2
    }))
  };
}

/**
 * Generate trend line chart data
 * @param {Object[]} timeSeries - Array of { period, values }
 * @returns {Object} Chart data
 */
export function generateTrendChartData(timeSeries) {
  return {
    type: 'line',
    labels: timeSeries.map(t => t.period),
    datasets: [{
      label: 'Risk Index',
      data: timeSeries.map(t => t.averageRisk),
      borderColor: '#1976D2',
      backgroundColor: '#1976D240',
      tension: 0.3,
      fill: true
    }]
  };
}

/**
 * Generate geographic heatmap data
 * @param {Object[]} riskData - Risk data with coordinates
 * @returns {Object[]} Heatmap points
 */
export function generateHeatmapData(riskData) {
  return riskData
    .filter(d => d.coordinates || d.lat || d.longitude)
    .map(d => ({
      lat: d.coordinates?.lat || d.lat,
      lng: d.coordinates?.lng || d.longitude,
      intensity: (d.risk || d.riskIndex || 0) / 10,
      adminUnit: d.adminCode || d.adminUnitCode,
      name: d.name || d.adminUnitName
    }));
}

// ============================================================================
// RISK OVERVIEW REPORT - ENHANCED
// ============================================================================

/**
 * Generate national risk overview report
 * @param {Object[]} riskData - Array of risk data by admin unit
 * @param {Object} options - Report options
 * @returns {Object} Risk overview report
 */
export function generateRiskOverviewReport(riskData, options = {}) {
  const { language = 'en', includeCharts = true, includeRecommendations = true } = options;
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const report = {
    id: `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: REPORT_TYPES.RISK_OVERVIEW,
    title: language === 'sw' ? 'Muhtasari wa Hatari - INFORM Tanzania' : 'INFORM Tanzania Risk Overview',
    language,
    generatedAt: new Date().toISOString(),
    dataYear: new Date().getFullYear(),
    country: {
      name: 'United Republic of Tanzania',
      nameSwahili: 'Jamhuri ya Muungano wa Tanzania',
      iso3: 'TZA'
    },

    // Summary statistics
    summary: {
      totalAdminUnits: riskData.length,
      regionsCount: TANZANIA_REGIONS_COMPLETE.length,
      districtsCount: TANZANIA_DISTRICTS_COMPLETE.length,
      zonesCount: Object.keys(TANZANIA_ZONES).length
    },

    // Risk statistics
    statistics: null,

    // Risk distribution
    distribution: {
      veryLow: 0,
      low: 0,
      medium: 0,
      high: 0,
      veryHigh: 0,
      unknown: 0
    },

    // Risk areas
    topRiskAreas: [],
    lowestRiskAreas: [],

    // By dimension
    dimensionAnalysis: {},

    // By zone
    zoneAnalysis: {},

    // By region
    regionalSummary: [],

    // Alerts
    alerts: [],

    // Recommendations
    recommendations: [],

    // Charts
    charts: {}
  };

  // Extract risk values
  const riskValues = riskData
    .map(d => d.risk || d.riskIndex)
    .filter(v => v !== null && v !== undefined);

  // Calculate statistics
  report.statistics = calculateStatistics(riskValues);

  // Calculate distribution
  for (const data of riskData) {
    const riskValue = data.risk || data.riskIndex;
    if (riskValue === null || riskValue === undefined) {
      report.distribution.unknown++;
    } else if (riskValue < 2.0) {
      report.distribution.veryLow++;
    } else if (riskValue < 3.5) {
      report.distribution.low++;
    } else if (riskValue < 5.0) {
      report.distribution.medium++;
    } else if (riskValue < 6.5) {
      report.distribution.high++;
    } else {
      report.distribution.veryHigh++;
    }
  }

  // Sort by risk and get top/bottom areas
  const sorted = [...riskData]
    .filter(d => (d.risk || d.riskIndex) !== null)
    .sort((a, b) => ((b.risk || b.riskIndex) || 0) - ((a.risk || a.riskIndex) || 0));

  report.topRiskAreas = sorted.slice(0, 15).map((d, i) => ({
    rank: i + 1,
    code: d.adminCode || d.adminUnitCode,
    name: d.name || d.adminUnitName || d.adm2Name || d.adm1Name,
    risk: round(d.risk || d.riskIndex, 2),
    classification: classifyRisk(d.risk || d.riskIndex),
    hazard: round(d.hazard || d.dimensions?.HAZARD, 2),
    vulnerability: round(d.vulnerability || d.dimensions?.VULNERABILITY, 2),
    copingCapacity: round(d.lackOfCopingCapacity || d.dimensions?.LACK_OF_COPING_CAPACITY, 2)
  }));

  report.lowestRiskAreas = sorted.slice(-10).reverse().map((d, i) => ({
    rank: sorted.length - 9 + i,
    code: d.adminCode || d.adminUnitCode,
    name: d.name || d.adminUnitName || d.adm2Name || d.adm1Name,
    risk: round(d.risk || d.riskIndex, 2),
    classification: classifyRisk(d.risk || d.riskIndex)
  }));

  // Dimension analysis
  const dimensions = [
    { key: 'hazard', field: 'hazard', altField: 'HAZARD' },
    { key: 'vulnerability', field: 'vulnerability', altField: 'VULNERABILITY' },
    { key: 'copingCapacity', field: 'lackOfCopingCapacity', altField: 'LACK_OF_COPING_CAPACITY' }
  ];

  for (const dim of dimensions) {
    const values = riskData
      .map(d => d[dim.field] || d.dimensions?.[dim.altField])
      .filter(v => v !== null && v !== undefined);

    if (values.length > 0) {
      report.dimensionAnalysis[dim.key] = {
        ...calculateStatistics(values),
        name: t.dimensions[dim.key]
      };
    }
  }

  // Zone analysis
  for (const [zoneId, zone] of Object.entries(TANZANIA_ZONES)) {
    const zoneRegions = zone.regions || [];
    const zoneData = riskData.filter(d => {
      const code = d.adminCode || d.adminUnitCode || '';
      return zoneRegions.some(r => code.startsWith(r));
    });

    if (zoneData.length > 0) {
      const risks = zoneData.map(d => d.risk || d.riskIndex).filter(v => v !== null);
      const stats = calculateStatistics(risks);

      report.zoneAnalysis[zoneId] = {
        id: zoneId,
        name: zone.name,
        adminUnits: zoneData.length,
        ...stats,
        riskClass: classifyRisk(stats.mean)
      };
    }
  }

  // Regional summary
  for (const region of TANZANIA_REGIONS_COMPLETE) {
    const regionData = riskData.filter(d => {
      const code = d.adminCode || d.adminUnitCode || '';
      return code.startsWith(region.code);
    });

    if (regionData.length > 0) {
      const risks = regionData.map(d => d.risk || d.riskIndex).filter(v => v !== null);
      const stats = calculateStatistics(risks);

      report.regionalSummary.push({
        code: region.code,
        name: region.name,
        zone: region.zone,
        districts: regionData.length,
        ...stats,
        riskClass: classifyRisk(stats.mean)
      });
    }
  }

  // Sort regional summary by risk
  report.regionalSummary.sort((a, b) => (b.mean || 0) - (a.mean || 0));

  // Generate alerts
  if (report.distribution.veryHigh > 0) {
    report.alerts.push({
      level: 'critical',
      message: language === 'sw'
        ? `Maeneo ${report.distribution.veryHigh} yana hatari kubwa sana`
        : `${report.distribution.veryHigh} areas are at very high risk`,
      count: report.distribution.veryHigh
    });
  }

  if (report.distribution.high > REPORTING_CONFIG.alerts.highRiskCount) {
    report.alerts.push({
      level: 'warning',
      message: language === 'sw'
        ? `Maeneo ${report.distribution.high} yana hatari kubwa`
        : `${report.distribution.high} areas are at high risk`,
      count: report.distribution.high
    });
  }

  // Generate recommendations
  if (includeRecommendations) {
    report.recommendations = generateRecommendations(report, language);
  }

  // Generate charts
  if (includeCharts) {
    report.charts = {
      distribution: generateDistributionChartData(report.distribution, language),
      dimensionComparison: {
        type: 'bar',
        labels: Object.values(t.dimensions),
        datasets: [{
          label: language === 'sw' ? 'Wastani' : 'Average',
          data: [
            report.dimensionAnalysis.hazard?.mean || 0,
            report.dimensionAnalysis.vulnerability?.mean || 0,
            report.dimensionAnalysis.copingCapacity?.mean || 0
          ],
          backgroundColor: REPORTING_CONFIG.charts.colorSchemes.dimension
        }]
      },
      zoneComparison: {
        type: 'horizontalBar',
        labels: Object.values(report.zoneAnalysis).map(z => z.name),
        datasets: [{
          label: language === 'sw' ? 'Wastani wa Hatari' : 'Average Risk',
          data: Object.values(report.zoneAnalysis).map(z => z.mean || 0),
          backgroundColor: REPORTING_CONFIG.charts.colorSchemes.risk[2]
        }]
      }
    };
  }

  // Store report
  reportStore.generated.set(report.id, report);

  return report;
}

// ============================================================================
// REGIONAL PROFILE REPORT - ENHANCED
// ============================================================================

/**
 * Generate regional profile report
 * @param {string} regionCode - Region code (e.g., 'TZ01')
 * @param {Object[]} riskData - Risk data for region's districts
 * @param {Object} options - Report options
 * @returns {Object} Regional profile report
 */
export function generateRegionalProfileReport(regionCode, riskData, options = {}) {
  const { language = 'en', includeCharts = true } = options;
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const region = TANZANIA_REGIONS_COMPLETE.find(r => r.code === regionCode);
  const districts = TANZANIA_DISTRICTS_COMPLETE.filter(d => d.region === regionCode);

  if (!region) {
    throw new Error(`Region not found: ${regionCode}`);
  }

  const report = {
    id: `RPT-REG-${regionCode}-${Date.now()}`,
    type: REPORT_TYPES.REGIONAL_PROFILE,
    title: language === 'sw'
      ? `Wasifu wa Hatari: Mkoa wa ${region.name}`
      : `Risk Profile: ${region.name} Region`,
    language,
    generatedAt: new Date().toISOString(),

    // Region info
    region: {
      code: region.code,
      name: region.name,
      capital: region.capital,
      zone: region.zone,
      population: region.population,
      populationFormatted: region.population?.toLocaleString(),
      area_km2: region.area_km2,
      areaFormatted: region.area_km2?.toLocaleString() + ' km²',
      coordinates: region.coordinates,
      characteristics: {
        hasCoast: region.hasCoast || false,
        isIsland: region.isIsland || false,
        hasMount: region.hasMount || null,
        hasLake: region.hasLake || null
      },
      neighbors: region.neighbors || []
    },

    // Districts
    districtCount: districts.length,
    districts: districts.map(d => ({
      code: d.code,
      name: d.name,
      population: d.population,
      type: d.type
    })),

    // Risk summary
    riskSummary: {
      overallRisk: null,
      statistics: null,
      classification: null,
      distribution: { veryLow: 0, low: 0, medium: 0, high: 0, veryHigh: 0 }
    },

    // Dimension breakdown
    dimensionBreakdown: {},

    // Top risk districts
    topRiskDistricts: [],

    // All districts ranked
    districtRankings: [],

    // Component analysis
    componentAnalysis: {},

    // Hazard analysis
    hazardAnalysis: {},

    // Vulnerability analysis
    vulnerabilityAnalysis: {},

    // Coping capacity analysis
    copingCapacityAnalysis: {},

    // Comparison to national
    nationalComparison: {},

    // Recommendations
    recommendations: [],

    // Charts
    charts: {}
  };

  // Filter risk data for this region
  const regionRiskData = riskData.filter(d => {
    const code = d.adminCode || d.adminUnitCode || '';
    return code.startsWith(regionCode);
  });

  // Calculate risk summary
  const riskValues = regionRiskData
    .map(d => d.risk || d.riskIndex)
    .filter(v => v !== null && v !== undefined);

  if (riskValues.length > 0) {
    report.riskSummary.statistics = calculateStatistics(riskValues);
    report.riskSummary.overallRisk = report.riskSummary.statistics.mean;
    report.riskSummary.classification = classifyRisk(report.riskSummary.overallRisk);
  }

  // Risk distribution
  for (const data of regionRiskData) {
    const riskValue = data.risk || data.riskIndex;
    if (riskValue === null || riskValue === undefined) continue;

    if (riskValue < 2.0) report.riskSummary.distribution.veryLow++;
    else if (riskValue < 3.5) report.riskSummary.distribution.low++;
    else if (riskValue < 5.0) report.riskSummary.distribution.medium++;
    else if (riskValue < 6.5) report.riskSummary.distribution.high++;
    else report.riskSummary.distribution.veryHigh++;
  }

  // District rankings
  const sortedDistricts = [...regionRiskData]
    .filter(d => (d.risk || d.riskIndex) !== null)
    .sort((a, b) => ((b.risk || b.riskIndex) || 0) - ((a.risk || a.riskIndex) || 0));

  report.districtRankings = sortedDistricts.map((d, i) => ({
    rank: i + 1,
    code: d.adminCode || d.adminUnitCode,
    name: d.name || d.adm2Name,
    risk: round(d.risk || d.riskIndex, 2),
    classification: classifyRisk(d.risk || d.riskIndex),
    hazard: round(d.hazard || d.dimensions?.HAZARD, 2),
    vulnerability: round(d.vulnerability || d.dimensions?.VULNERABILITY, 2),
    copingCapacity: round(d.lackOfCopingCapacity || d.dimensions?.LACK_OF_COPING_CAPACITY, 2)
  }));

  report.topRiskDistricts = report.districtRankings.slice(0, 5);

  // Dimension breakdown
  const dimFields = [
    { id: 'HAZARD', key: 'hazard', name: t.dimensions.hazard },
    { id: 'VULNERABILITY', key: 'vulnerability', name: t.dimensions.vulnerability },
    { id: 'LACK_OF_COPING_CAPACITY', key: 'copingCapacity', name: t.dimensions.copingCapacity }
  ];

  for (const dim of dimFields) {
    const values = regionRiskData
      .map(d => d[dim.key] || d.dimensions?.[dim.id])
      .filter(v => v !== null && v !== undefined);

    if (values.length > 0) {
      report.dimensionBreakdown[dim.id] = {
        name: dim.name,
        ...calculateStatistics(values)
      };
    }
  }

  // National comparison
  const nationalRiskValues = riskData
    .map(d => d.risk || d.riskIndex)
    .filter(v => v !== null);

  if (nationalRiskValues.length > 0 && riskValues.length > 0) {
    const nationalStats = calculateStatistics(nationalRiskValues);

    report.nationalComparison = {
      regionalAverage: report.riskSummary.statistics.mean,
      nationalAverage: nationalStats.mean,
      difference: round(report.riskSummary.statistics.mean - nationalStats.mean, 2),
      percentDifference: round(((report.riskSummary.statistics.mean - nationalStats.mean) / nationalStats.mean) * 100, 1),
      ranking: null,
      isAboveNational: report.riskSummary.statistics.mean > nationalStats.mean
    };

    // Calculate regional ranking
    const regionalAverages = TANZANIA_REGIONS_COMPLETE.map(r => {
      const regData = riskData.filter(d => (d.adminCode || d.adminUnitCode || '').startsWith(r.code));
      const regRisks = regData.map(d => d.risk || d.riskIndex).filter(v => v !== null);
      return { code: r.code, avg: regRisks.length > 0 ? regRisks.reduce((a, b) => a + b, 0) / regRisks.length : null };
    }).filter(r => r.avg !== null).sort((a, b) => b.avg - a.avg);

    const ranking = regionalAverages.findIndex(r => r.code === regionCode) + 1;
    report.nationalComparison.ranking = ranking;
    report.nationalComparison.totalRegions = regionalAverages.length;
  }

  // Generate recommendations
  report.recommendations = generateRegionalRecommendations(report, language);

  // Generate charts
  if (includeCharts) {
    report.charts = {
      districtRiskBar: {
        type: 'horizontalBar',
        labels: report.districtRankings.map(d => d.name),
        datasets: [{
          label: language === 'sw' ? 'Hatari' : 'Risk Index',
          data: report.districtRankings.map(d => d.risk),
          backgroundColor: report.districtRankings.map(d => d.classification?.color || '#9E9E9E')
        }]
      },
      dimensionRadar: generateDimensionRadarData([{
        name: region.name,
        hazard: report.dimensionBreakdown.HAZARD?.mean || 0,
        vulnerability: report.dimensionBreakdown.VULNERABILITY?.mean || 0,
        copingCapacity: report.dimensionBreakdown.LACK_OF_COPING_CAPACITY?.mean || 0
      }]),
      distribution: generateDistributionChartData(report.riskSummary.distribution, language)
    };
  }

  // Store report
  reportStore.generated.set(report.id, report);

  return report;
}

// ============================================================================
// TREND ANALYSIS REPORT
// ============================================================================

/**
 * Generate trend analysis report
 * @param {Object[]} timeSeriesData - Array of { period, data[] }
 * @param {Object} options - Report options
 * @returns {Object} Trend analysis report
 */
export function generateTrendAnalysisReport(timeSeriesData, options = {}) {
  const { language = 'en', adminUnitCode = null } = options;
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  if (timeSeriesData.length < REPORTING_CONFIG.statistics.trendMinPeriods) {
    return {
      error: true,
      message: `Insufficient data for trend analysis. Minimum ${REPORTING_CONFIG.statistics.trendMinPeriods} periods required.`
    };
  }

  const report = {
    id: `RPT-TREND-${Date.now()}`,
    type: REPORT_TYPES.TREND_ANALYSIS,
    title: language === 'sw' ? 'Uchambuzi wa Mwenendo' : 'Risk Trend Analysis',
    language,
    generatedAt: new Date().toISOString(),
    adminUnitCode,

    // Time periods
    periods: timeSeriesData.length,
    startPeriod: timeSeriesData[0]?.period,
    endPeriod: timeSeriesData[timeSeriesData.length - 1]?.period,

    // Period summaries
    periodSummaries: [],

    // Trend analysis
    trend: {
      direction: null,
      slope: null,
      rSquared: null,
      percentChange: null,
      isSignificant: false
    },

    // Volatility
    volatility: null,

    // Period comparisons
    periodComparisons: [],

    // Projections
    projections: [],

    // Key changes
    keyChanges: [],

    // Charts
    charts: {}
  };

  // Calculate period summaries
  const periodRisks = [];

  for (const period of timeSeriesData) {
    const riskValues = period.data
      .map(d => d.risk || d.riskIndex)
      .filter(v => v !== null && v !== undefined);

    const stats = calculateStatistics(riskValues);

    report.periodSummaries.push({
      period: period.period,
      count: period.data.length,
      averageRisk: stats.mean,
      minRisk: stats.min,
      maxRisk: stats.max,
      stdDev: stats.stdDev,
      distribution: calculateDistribution(period.data)
    });

    if (stats.mean !== null) {
      periodRisks.push({ period: period.period, value: stats.mean });
    }
  }

  // Calculate trend using linear regression
  if (periodRisks.length >= 2) {
    const n = periodRisks.length;
    const xMean = (n - 1) / 2;
    const yMean = periodRisks.reduce((sum, p) => sum + p.value, 0) / n;

    let numerator = 0;
    let denominator = 0;
    let ssTotal = 0;
    let ssResidual = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (periodRisks[i].value - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Calculate R-squared
    for (let i = 0; i < n; i++) {
      const predicted = intercept + slope * i;
      ssResidual += Math.pow(periodRisks[i].value - predicted, 2);
      ssTotal += Math.pow(periodRisks[i].value - yMean, 2);
    }

    const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

    // Determine trend direction
    let direction;
    if (Math.abs(slope) < 0.05) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    // Calculate percent change
    const firstValue = periodRisks[0].value;
    const lastValue = periodRisks[n - 1].value;
    const percentChange = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    report.trend = {
      direction,
      slope: round(slope, 4),
      intercept: round(intercept, 2),
      rSquared: round(rSquared, 4),
      percentChange: round(percentChange, 1),
      isSignificant: rSquared > 0.5 && Math.abs(slope) > 0.1,
      absoluteChange: round(lastValue - firstValue, 2)
    };

    // Generate projections (next 2 periods)
    for (let i = 1; i <= 2; i++) {
      const projectedValue = Math.max(0, Math.min(10, intercept + slope * (n - 1 + i)));
      report.projections.push({
        period: i,
        projectedRisk: round(projectedValue, 2),
        classification: classifyRisk(projectedValue)
      });
    }
  }

  // Calculate volatility
  const riskValuesAll = periodRisks.map(p => p.value);
  if (riskValuesAll.length > 1) {
    const stats = calculateStatistics(riskValuesAll);
    report.volatility = {
      stdDev: stats.stdDev,
      coefficientOfVariation: stats.coefficientOfVariation,
      range: stats.range,
      isVolatile: stats.coefficientOfVariation > 15
    };
  }

  // Period comparisons
  for (let i = 1; i < report.periodSummaries.length; i++) {
    const current = report.periodSummaries[i];
    const previous = report.periodSummaries[i - 1];

    if (current.averageRisk !== null && previous.averageRisk !== null) {
      const change = current.averageRisk - previous.averageRisk;
      const percentChange = previous.averageRisk !== 0
        ? (change / previous.averageRisk) * 100 : 0;

      report.periodComparisons.push({
        fromPeriod: previous.period,
        toPeriod: current.period,
        absoluteChange: round(change, 2),
        percentChange: round(percentChange, 1),
        direction: change > 0.1 ? 'increase' : change < -0.1 ? 'decrease' : 'stable'
      });

      // Flag significant changes
      if (Math.abs(percentChange) >= REPORTING_CONFIG.alerts.riskIncreasePercent) {
        report.keyChanges.push({
          period: current.period,
          previousPeriod: previous.period,
          change: round(change, 2),
          percentChange: round(percentChange, 1),
          severity: Math.abs(percentChange) >= 20 ? 'high' : 'medium'
        });
      }
    }
  }

  // Charts
  report.charts = {
    trendLine: generateTrendChartData(report.periodSummaries.map(p => ({
      period: p.period,
      averageRisk: p.averageRisk
    }))),
    periodDistributions: {
      type: 'stackedBar',
      labels: report.periodSummaries.map(p => p.period),
      datasets: [
        { label: 'Very Low', data: report.periodSummaries.map(p => p.distribution?.veryLow || 0), backgroundColor: REPORTING_CONFIG.charts.colorSchemes.risk[0] },
        { label: 'Low', data: report.periodSummaries.map(p => p.distribution?.low || 0), backgroundColor: REPORTING_CONFIG.charts.colorSchemes.risk[1] },
        { label: 'Medium', data: report.periodSummaries.map(p => p.distribution?.medium || 0), backgroundColor: REPORTING_CONFIG.charts.colorSchemes.risk[2] },
        { label: 'High', data: report.periodSummaries.map(p => p.distribution?.high || 0), backgroundColor: REPORTING_CONFIG.charts.colorSchemes.risk[3] },
        { label: 'Very High', data: report.periodSummaries.map(p => p.distribution?.veryHigh || 0), backgroundColor: REPORTING_CONFIG.charts.colorSchemes.risk[4] }
      ]
    }
  };

  // Store report
  reportStore.generated.set(report.id, report);

  return report;
}

/**
 * Calculate risk distribution from data
 * @param {Object[]} data - Risk data
 * @returns {Object} Distribution
 */
function calculateDistribution(data) {
  const dist = { veryLow: 0, low: 0, medium: 0, high: 0, veryHigh: 0 };

  for (const d of data) {
    const risk = d.risk || d.riskIndex;
    if (risk === null || risk === undefined) continue;

    if (risk < 2.0) dist.veryLow++;
    else if (risk < 3.5) dist.low++;
    else if (risk < 5.0) dist.medium++;
    else if (risk < 6.5) dist.high++;
    else dist.veryHigh++;
  }

  return dist;
}

// ============================================================================
// COMPARATIVE ANALYSIS REPORT - ENHANCED
// ============================================================================

/**
 * Generate comparative analysis between regions or districts
 * @param {string[]} codes - Array of admin unit codes to compare
 * @param {Object[]} riskData - Risk data
 * @param {Object} options - Report options
 * @returns {Object} Comparative analysis report
 */
export function generateComparativeReport(codes, riskData, options = {}) {
  const { language = 'en' } = options;
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const report = {
    id: `RPT-COMP-${Date.now()}`,
    type: REPORT_TYPES.COMPARATIVE_ANALYSIS,
    title: language === 'sw' ? 'Uchambuzi wa Kulinganisha' : 'Comparative Analysis',
    language,
    generatedAt: new Date().toISOString(),

    // Units being compared
    units: [],

    // Comparison matrices
    comparison: {
      risk: [],
      hazard: [],
      vulnerability: [],
      copingCapacity: []
    },

    // Rankings
    rankings: {
      overallRisk: [],
      hazard: [],
      vulnerability: [],
      copingCapacity: []
    },

    // Statistical comparison
    statistics: {},

    // Correlations between dimensions
    correlations: {},

    // Key differences
    keyDifferences: [],

    // Strengths and weaknesses per unit
    unitAnalysis: [],

    // Insights
    insights: [],

    // Charts
    charts: {}
  };

  // Get data for each unit
  for (const code of codes) {
    const data = riskData.find(d => (d.adminCode || d.adminUnitCode) === code);
    const region = TANZANIA_REGIONS_COMPLETE.find(r => r.code === code);
    const district = TANZANIA_DISTRICTS_COMPLETE.find(d => d.code === code);
    const unit = region || district;

    if (unit && data) {
      const unitData = {
        code,
        name: unit.name,
        type: region ? 'region' : 'district',
        risk: round(data.risk || data.riskIndex, 2),
        hazard: round(data.hazard || data.dimensions?.HAZARD, 2),
        vulnerability: round(data.vulnerability || data.dimensions?.VULNERABILITY, 2),
        copingCapacity: round(data.lackOfCopingCapacity || data.dimensions?.LACK_OF_COPING_CAPACITY, 2),
        classification: classifyRisk(data.risk || data.riskIndex)
      };

      report.units.push(unitData);

      // Build comparison data
      report.comparison.risk.push({ code, name: unitData.name, value: unitData.risk });
      report.comparison.hazard.push({ code, name: unitData.name, value: unitData.hazard });
      report.comparison.vulnerability.push({ code, name: unitData.name, value: unitData.vulnerability });
      report.comparison.copingCapacity.push({ code, name: unitData.name, value: unitData.copingCapacity });
    }
  }

  // Rankings
  const sortByValue = (arr) => [...arr].filter(a => a.value !== null).sort((a, b) => (b.value || 0) - (a.value || 0));

  report.rankings.overallRisk = sortByValue(report.comparison.risk).map((item, i) => ({ ...item, rank: i + 1 }));
  report.rankings.hazard = sortByValue(report.comparison.hazard).map((item, i) => ({ ...item, rank: i + 1 }));
  report.rankings.vulnerability = sortByValue(report.comparison.vulnerability).map((item, i) => ({ ...item, rank: i + 1 }));
  report.rankings.copingCapacity = sortByValue(report.comparison.copingCapacity).map((item, i) => ({ ...item, rank: i + 1 }));

  // Statistical comparison
  for (const [metric, data] of Object.entries(report.comparison)) {
    const values = data.map(d => d.value).filter(v => v !== null);
    report.statistics[metric] = calculateStatistics(values);
  }

  // Correlations between dimensions
  if (report.units.length >= 3) {
    const hazards = report.units.map(u => u.hazard);
    const vulnerabilities = report.units.map(u => u.vulnerability);
    const copingCapacities = report.units.map(u => u.copingCapacity);

    report.correlations = {
      hazardVulnerability: calculateCorrelation(hazards, vulnerabilities),
      hazardCopingCapacity: calculateCorrelation(hazards, copingCapacities),
      vulnerabilityCopingCapacity: calculateCorrelation(vulnerabilities, copingCapacities)
    };
  }

  // Key differences
  const metrics = ['risk', 'hazard', 'vulnerability', 'copingCapacity'];
  for (const metric of metrics) {
    const values = report.units.map(u => u[metric]).filter(v => v !== null);
    if (values.length >= 2) {
      const range = Math.max(...values) - Math.min(...values);
      if (range > 2) {
        const highest = report.units.find(u => u[metric] === Math.max(...values));
        const lowest = report.units.find(u => u[metric] === Math.min(...values));

        report.keyDifferences.push({
          dimension: metric,
          range: round(range, 2),
          highest: { name: highest?.name, value: highest?.[metric] },
          lowest: { name: lowest?.name, value: lowest?.[metric] },
          insight: `Significant variation in ${metric} between compared areas (range: ${round(range, 2)})`
        });
      }
    }
  }

  // Unit analysis (strengths/weaknesses)
  for (const unit of report.units) {
    const analysis = {
      code: unit.code,
      name: unit.name,
      strengths: [],
      weaknesses: [],
      overallAssessment: ''
    };

    // Determine relative strengths/weaknesses
    const avgRisk = report.statistics.risk?.mean || 5;
    const avgHazard = report.statistics.hazard?.mean || 5;
    const avgVuln = report.statistics.vulnerability?.mean || 5;
    const avgCC = report.statistics.copingCapacity?.mean || 5;

    if (unit.hazard < avgHazard - 0.5) analysis.strengths.push('Lower hazard exposure');
    else if (unit.hazard > avgHazard + 0.5) analysis.weaknesses.push('Higher hazard exposure');

    if (unit.vulnerability < avgVuln - 0.5) analysis.strengths.push('Lower vulnerability');
    else if (unit.vulnerability > avgVuln + 0.5) analysis.weaknesses.push('Higher vulnerability');

    if (unit.copingCapacity < avgCC - 0.5) analysis.strengths.push('Better coping capacity');
    else if (unit.copingCapacity > avgCC + 0.5) analysis.weaknesses.push('Limited coping capacity');

    analysis.overallAssessment = unit.risk > avgRisk
      ? 'Above average risk - attention needed'
      : 'Below average risk - relatively better positioned';

    report.unitAnalysis.push(analysis);
  }

  // Generate insights
  if (report.rankings.overallRisk.length > 0) {
    const highest = report.rankings.overallRisk[0];
    const lowest = report.rankings.overallRisk[report.rankings.overallRisk.length - 1];

    report.insights.push({
      type: 'highest_risk',
      message: `${highest.name} has the highest overall risk (${highest.value?.toFixed(2)})`,
      messageSwahili: `${highest.name} ina hatari kubwa zaidi (${highest.value?.toFixed(2)})`
    });

    report.insights.push({
      type: 'lowest_risk',
      message: `${lowest.name} has the lowest overall risk (${lowest.value?.toFixed(2)})`,
      messageSwahili: `${lowest.name} ina hatari ndogo zaidi (${lowest.value?.toFixed(2)})`
    });

    if (highest.value && lowest.value) {
      const diff = highest.value - lowest.value;
      report.insights.push({
        type: 'gap',
        message: `Risk gap between highest and lowest: ${diff.toFixed(2)} points`,
        messageSwahili: `Tofauti ya hatari: alama ${diff.toFixed(2)}`
      });
    }
  }

  // Charts
  report.charts = {
    comparisonBar: {
      type: 'groupedBar',
      labels: report.units.map(u => u.name),
      datasets: [
        { label: 'Overall Risk', data: report.units.map(u => u.risk), backgroundColor: '#FF5722' },
        { label: 'Hazard', data: report.units.map(u => u.hazard), backgroundColor: '#1976D2' },
        { label: 'Vulnerability', data: report.units.map(u => u.vulnerability), backgroundColor: '#9C27B0' },
        { label: 'Coping Capacity', data: report.units.map(u => u.copingCapacity), backgroundColor: '#4CAF50' }
      ]
    },
    dimensionRadar: generateDimensionRadarData(report.units)
  };

  // Store report
  reportStore.generated.set(report.id, report);

  return report;
}

// ============================================================================
// DATA QUALITY REPORT - ENHANCED
// ============================================================================

/**
 * Generate data quality report
 * @param {Object[]} riskData - Risk data
 * @param {Object} indicatorData - Raw indicator data
 * @param {Object} options - Report options
 * @returns {Object} Data quality report
 */
export function generateDataQualityReport(riskData, indicatorData = {}, options = {}) {
  const { language = 'en' } = options;
  const totalIndicators = Object.keys(INDICATOR_DEFINITIONS).length;
  const totalAdminUnits = TANZANIA_DISTRICTS_COMPLETE.length + TANZANIA_REGIONS_COMPLETE.length;

  const report = {
    id: `RPT-QUALITY-${Date.now()}`,
    type: REPORT_TYPES.DATA_QUALITY,
    title: language === 'sw' ? 'Tathmini ya Ubora wa Takwimu' : 'Data Quality Assessment',
    language,
    generatedAt: new Date().toISOString(),

    // Overall score
    overallScore: 0,
    grade: 'F',

    // Coverage
    coverage: {
      totalIndicators,
      totalAdminUnits,
      recordsWithData: riskData.length,
      coveragePercentage: round((riskData.length / totalAdminUnits) * 100, 1),
      missingUnits: totalAdminUnits - riskData.length
    },

    // Completeness by dimension
    completeness: {
      hazard: { available: 0, missing: 0, percentage: 0 },
      vulnerability: { available: 0, missing: 0, percentage: 0 },
      copingCapacity: { available: 0, missing: 0, percentage: 0 }
    },

    // Indicator coverage
    indicatorCoverage: [],

    // Data freshness
    freshness: {
      current: 0,
      recent: 0,
      stale: 0,
      unknown: 0
    },

    // Outlier detection
    outlierAnalysis: {
      totalOutliers: 0,
      byDimension: {}
    },

    // Issues
    issues: [],

    // Units with missing data
    unitsWithMissingData: [],

    // Recommendations
    recommendations: [],

    // Charts
    charts: {}
  };

  // Calculate completeness
  const dimensionFields = [
    { key: 'hazard', field: 'hazard', altField: 'HAZARD' },
    { key: 'vulnerability', field: 'vulnerability', altField: 'VULNERABILITY' },
    { key: 'copingCapacity', field: 'lackOfCopingCapacity', altField: 'LACK_OF_COPING_CAPACITY' }
  ];

  for (const data of riskData) {
    for (const dim of dimensionFields) {
      if (data[dim.field] !== null && data[dim.field] !== undefined || data.dimensions?.[dim.altField] !== null) {
        report.completeness[dim.key].available++;
      } else {
        report.completeness[dim.key].missing++;

        // Track units with missing data
        const code = data.adminCode || data.adminUnitCode;
        let unit = report.unitsWithMissingData.find(u => u.code === code);
        if (!unit) {
          unit = { code, name: data.name || data.adminUnitName, missingDimensions: [] };
          report.unitsWithMissingData.push(unit);
        }
        unit.missingDimensions.push(dim.key);
      }
    }
  }

  // Calculate percentages
  for (const dim of dimensionFields) {
    const total = report.completeness[dim.key].available + report.completeness[dim.key].missing;
    report.completeness[dim.key].percentage = total > 0
      ? round((report.completeness[dim.key].available / total) * 100, 1)
      : 0;
  }

  // Outlier analysis
  for (const dim of dimensionFields) {
    const values = riskData
      .map(d => d[dim.field] || d.dimensions?.[dim.altField])
      .filter(v => v !== null && v !== undefined);

    const outliers = detectOutliers(values);
    report.outlierAnalysis.byDimension[dim.key] = outliers;
    report.outlierAnalysis.totalOutliers += outliers.outlierCount;
  }

  // Calculate overall score
  const coverageScore = report.coverage.coveragePercentage;
  const completenessScore = (
    report.completeness.hazard.percentage +
    report.completeness.vulnerability.percentage +
    report.completeness.copingCapacity.percentage
  ) / 3;
  const outlierPenalty = Math.min(20, report.outlierAnalysis.totalOutliers * 2);

  report.overallScore = Math.max(0, round((coverageScore + completenessScore) / 2 - outlierPenalty, 1));

  // Assign grade
  if (report.overallScore >= 90) report.grade = 'A';
  else if (report.overallScore >= 80) report.grade = 'B';
  else if (report.overallScore >= 70) report.grade = 'C';
  else if (report.overallScore >= 60) report.grade = 'D';
  else report.grade = 'F';

  // Identify issues
  if (report.coverage.coveragePercentage < 80) {
    report.issues.push({
      severity: 'high',
      type: 'coverage',
      message: `Only ${report.coverage.coveragePercentage}% of admin units have data`,
      messageSwahili: `Ni ${report.coverage.coveragePercentage}% tu ya maeneo yana takwimu`
    });
  }

  for (const [dim, data] of Object.entries(report.completeness)) {
    if (data.percentage < 50) {
      report.issues.push({
        severity: 'high',
        type: 'completeness',
        dimension: dim,
        message: `${dim} dimension has only ${data.percentage}% data completeness`
      });
    } else if (data.percentage < 75) {
      report.issues.push({
        severity: 'medium',
        type: 'completeness',
        dimension: dim,
        message: `${dim} dimension has ${data.percentage}% data completeness`
      });
    }
  }

  if (report.outlierAnalysis.totalOutliers > 10) {
    report.issues.push({
      severity: 'medium',
      type: 'outliers',
      message: `${report.outlierAnalysis.totalOutliers} potential outliers detected in the data`
    });
  }

  // Recommendations
  if (report.coverage.missingUnits > 0) {
    report.recommendations.push({
      priority: 'high',
      message: `Collect data for ${report.coverage.missingUnits} missing admin units`,
      action: 'Prioritize data collection for high-risk areas'
    });
  }

  if (report.issues.filter(i => i.type === 'completeness').length > 0) {
    report.recommendations.push({
      priority: 'medium',
      message: 'Improve indicator coverage across all dimensions',
      action: 'Focus on filling gaps in vulnerability and coping capacity indicators'
    });
  }

  // Charts
  report.charts = {
    completenessBar: {
      type: 'bar',
      labels: ['Hazard', 'Vulnerability', 'Coping Capacity'],
      datasets: [{
        label: 'Completeness %',
        data: [
          report.completeness.hazard.percentage,
          report.completeness.vulnerability.percentage,
          report.completeness.copingCapacity.percentage
        ],
        backgroundColor: ['#1976D2', '#9C27B0', '#4CAF50']
      }]
    },
    qualityGauge: {
      type: 'gauge',
      value: report.overallScore,
      max: 100,
      thresholds: [
        { value: 60, color: '#D32F2F' },
        { value: 70, color: '#FF9800' },
        { value: 80, color: '#FFC107' },
        { value: 90, color: '#8BC34A' },
        { value: 100, color: '#2E7D32' }
      ]
    }
  };

  // Store report
  reportStore.generated.set(report.id, report);

  return report;
}

// ============================================================================
// EXECUTIVE SUMMARY - ENHANCED
// ============================================================================

/**
 * Generate executive summary
 * @param {Object[]} riskData - Risk data
 * @param {Object} options - Report options
 * @returns {Object} Executive summary
 */
export function generateExecutiveSummary(riskData, options = {}) {
  const { language = 'en' } = options;
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const overview = generateRiskOverviewReport(riskData, { language, includeCharts: false });
  const quality = generateDataQualityReport(riskData, {}, { language });

  const riskValues = riskData.map(d => d.risk || d.riskIndex).filter(v => v !== null);
  const stats = calculateStatistics(riskValues);

  const report = {
    id: `RPT-EXEC-${Date.now()}`,
    type: REPORT_TYPES.EXECUTIVE_SUMMARY,
    title: language === 'sw' ? 'Muhtasari wa Utendaji - INFORM Tanzania' : 'INFORM Tanzania Executive Summary',
    language,
    generatedAt: new Date().toISOString(),
    reportPeriod: new Date().getFullYear(),

    // Key statistics
    keyStatistics: {
      totalAreasAssessed: overview.summary.totalAdminUnits,
      averageRiskIndex: stats.mean,
      medianRiskIndex: stats.median,
      highRiskAreas: overview.distribution.high + overview.distribution.veryHigh,
      highRiskPercent: round(((overview.distribution.high + overview.distribution.veryHigh) / overview.summary.totalAdminUnits) * 100, 1),
      dataCoverage: quality.coverage.coveragePercentage + '%',
      dataQualityScore: quality.overallScore,
      dataQualityGrade: quality.grade
    },

    // Risk snapshot
    riskSnapshot: {
      distribution: overview.distribution,
      distributionPercent: {
        veryLow: round((overview.distribution.veryLow / overview.summary.totalAdminUnits) * 100, 1),
        low: round((overview.distribution.low / overview.summary.totalAdminUnits) * 100, 1),
        medium: round((overview.distribution.medium / overview.summary.totalAdminUnits) * 100, 1),
        high: round((overview.distribution.high / overview.summary.totalAdminUnits) * 100, 1),
        veryHigh: round((overview.distribution.veryHigh / overview.summary.totalAdminUnits) * 100, 1)
      },
      topRiskAreas: overview.topRiskAreas.slice(0, 5)
    },

    // Dimension summary
    dimensionSummary: {
      hazard: {
        average: overview.dimensionAnalysis.hazard?.mean,
        assessment: getAssessment(overview.dimensionAnalysis.hazard?.mean, language)
      },
      vulnerability: {
        average: overview.dimensionAnalysis.vulnerability?.mean,
        assessment: getAssessment(overview.dimensionAnalysis.vulnerability?.mean, language)
      },
      copingCapacity: {
        average: overview.dimensionAnalysis.copingCapacity?.mean,
        assessment: getAssessment(overview.dimensionAnalysis.copingCapacity?.mean, language)
      }
    },

    // Critical findings
    criticalFindings: [],

    // Priority actions
    priorityActions: [],

    // Alerts
    alerts: overview.alerts,

    // Data quality summary
    dataQuality: {
      score: quality.overallScore,
      grade: quality.grade,
      coverage: quality.coverage.coveragePercentage,
      issueCount: quality.issues.length,
      criticalIssues: quality.issues.filter(i => i.severity === 'high').length
    }
  };

  // Generate critical findings
  if (overview.distribution.veryHigh > 0) {
    report.criticalFindings.push({
      priority: 1,
      type: 'risk',
      title: language === 'sw' ? 'Maeneo ya Hatari Kubwa Sana' : 'Very High Risk Areas',
      finding: language === 'sw'
        ? `Maeneo ${overview.distribution.veryHigh} yamepimwa kuwa na hatari kubwa sana inayohitaji uangalifu wa haraka.`
        : `${overview.distribution.veryHigh} areas are classified as very high risk, requiring immediate attention.`,
      areas: overview.topRiskAreas.filter(a => a.classification?.label === 'Very High').map(a => a.name)
    });
  }

  if (quality.overallScore < REPORTING_CONFIG.alerts.dataQualityMin) {
    report.criticalFindings.push({
      priority: 2,
      type: 'data_quality',
      title: language === 'sw' ? 'Ubora wa Takwimu' : 'Data Quality Concern',
      finding: language === 'sw'
        ? `Ubora wa takwimu (${quality.overallScore}%) uko chini ya kiwango kinachohitajika.`
        : `Data quality score (${quality.overallScore}%) is below the recommended threshold.`
    });
  }

  // Generate priority actions
  report.priorityActions = overview.recommendations.map((rec, i) => ({
    priority: i + 1,
    action: rec.action,
    rationale: rec.message,
    timeline: rec.priority === 'critical' ? 'Immediate' : rec.priority === 'high' ? 'Short-term' : 'Medium-term'
  }));

  // Store report
  reportStore.generated.set(report.id, report);

  return report;
}

/**
 * Get assessment text for a score
 * @param {number} score - Score value
 * @param {string} language - Language code
 * @returns {string} Assessment text
 */
function getAssessment(score, language = 'en') {
  if (score === null) return language === 'sw' ? 'Hakuna takwimu' : 'No data';

  if (score < 2.0) return language === 'sw' ? 'Nzuri sana' : 'Very good';
  if (score < 3.5) return language === 'sw' ? 'Nzuri' : 'Good';
  if (score < 5.0) return language === 'sw' ? 'Wastani' : 'Moderate';
  if (score < 6.5) return language === 'sw' ? 'Mbaya' : 'Poor';
  return language === 'sw' ? 'Mbaya sana' : 'Very poor';
}

// ============================================================================
// RECOMMENDATION GENERATORS
// ============================================================================

/**
 * Generate recommendations based on report data
 * @param {Object} report - Report data
 * @param {string} language - Language code
 * @returns {Object[]} Recommendations
 */
function generateRecommendations(report, language = 'en') {
  const recommendations = [];

  if (report.distribution.veryHigh > 0) {
    recommendations.push({
      priority: 'critical',
      category: 'emergency',
      message: language === 'sw'
        ? `Maeneo ${report.distribution.veryHigh} yana hatari kubwa sana na yanahitaji uangalifu wa haraka`
        : `${report.distribution.veryHigh} areas are at very high risk and require immediate attention`,
      action: language === 'sw'
        ? 'Anzisha hatua za dharura za maandalizi katika maeneo yaliyoathirika'
        : 'Activate emergency preparedness measures in affected areas',
      indicators: report.topRiskAreas?.slice(0, 3).map(a => a.name)
    });
  }

  if (report.distribution.high > 5) {
    recommendations.push({
      priority: 'high',
      category: 'monitoring',
      message: language === 'sw'
        ? `Maeneo ${report.distribution.high} yana hatari kubwa`
        : `${report.distribution.high} areas are at high risk`,
      action: language === 'sw'
        ? 'Ongeza ufuatiliaji na ugawaji wa rasilimali kwa maeneo yenye hatari kubwa'
        : 'Increase monitoring and resource allocation for high-risk areas'
    });
  }

  // Dimension-specific recommendations
  if (report.dimensionAnalysis?.vulnerability?.mean > 6) {
    recommendations.push({
      priority: 'high',
      category: 'vulnerability',
      message: language === 'sw'
        ? 'Wastani wa udhaifu ni wa juu kitaifa'
        : 'National average vulnerability is high',
      action: language === 'sw'
        ? 'Tekeleza programu za kupunguza udhaifu zikilenga vikundi vilivyo hatarini zaidi'
        : 'Implement vulnerability reduction programs targeting the most at-risk groups'
    });
  }

  if (report.dimensionAnalysis?.copingCapacity?.mean > 6) {
    recommendations.push({
      priority: 'medium',
      category: 'capacity',
      message: language === 'sw'
        ? 'Uwezo wa kukabiliana una upungufu katika maeneo mengi'
        : 'Coping capacity is limited in many areas',
      action: language === 'sw'
        ? 'Imarisha miundombinu na uwezo wa kitaasisi'
        : 'Strengthen infrastructure and institutional capacity'
    });
  }

  return recommendations;
}

/**
 * Generate regional recommendations
 * @param {Object} report - Regional report
 * @param {string} language - Language code
 * @returns {Object[]} Recommendations
 */
function generateRegionalRecommendations(report, language = 'en') {
  const recommendations = [];

  if (report.riskSummary.overallRisk > 6.5) {
    recommendations.push({
      priority: 'critical',
      message: language === 'sw'
        ? 'Mkoa una kiwango cha hatari kubwa sana'
        : 'Region is at very high risk level',
      action: language === 'sw'
        ? 'Uingiliaji kati wa haraka unahitajika katika wilaya zenye hatari kubwa'
        : 'Immediate intervention required in high-risk districts',
      targetDistricts: report.topRiskDistricts?.map(d => d.name)
    });
  } else if (report.riskSummary.overallRisk > 5.0) {
    recommendations.push({
      priority: 'high',
      message: language === 'sw'
        ? 'Mkoa una kiwango cha hatari kubwa'
        : 'Region is at high risk level',
      action: language === 'sw'
        ? 'Ufuatiliaji wa ziada na hatua za maandalizi zinapendekezwa'
        : 'Enhanced monitoring and preparedness measures recommended'
    });
  }

  // Check for disparities
  if (report.districtRankings?.length > 1) {
    const highest = report.districtRankings[0]?.risk;
    const lowest = report.districtRankings[report.districtRankings.length - 1]?.risk;
    const gap = highest - lowest;

    if (gap > 3) {
      recommendations.push({
        priority: 'medium',
        message: language === 'sw'
          ? `Tofauti kubwa ya hatari kati ya wilaya (${round(gap, 1)} pointi)`
          : `Significant risk disparity between districts (${round(gap, 1)} points gap)`,
        action: language === 'sw'
          ? 'Tathmini sababu za tofauti na ushughulikie usawa wa rasilimali'
          : 'Assess causes of disparity and address resource equity'
      });
    }
  }

  return recommendations;
}

// ============================================================================
// REPORT MANAGEMENT
// ============================================================================

/**
 * Get generated report by ID
 * @param {string} reportId - Report ID
 * @returns {Object|null} Report
 */
export function getReport(reportId) {
  return reportStore.generated.get(reportId) || null;
}

/**
 * Get all generated reports
 * @param {Object} filters - Filter options
 * @returns {Object[]} Reports
 */
export function getReports(filters = {}) {
  let reports = Array.from(reportStore.generated.values());

  if (filters.type) {
    reports = reports.filter(r => r.type === filters.type);
  }

  if (filters.fromDate) {
    reports = reports.filter(r => new Date(r.generatedAt) >= new Date(filters.fromDate));
  }

  return reports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
}

/**
 * Delete a report
 * @param {string} reportId - Report ID
 * @returns {boolean} Success
 */
export function deleteReport(reportId) {
  return reportStore.generated.delete(reportId);
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export report to JSON
 * @param {Object} report - Report object
 * @returns {string} JSON string
 */
export function exportReportToJSON(report) {
  return JSON.stringify(report, null, 2);
}

/**
 * Export report to CSV
 * @param {Object} report - Report object
 * @returns {string} CSV string
 */
export function exportReportToCSV(report) {
  let csv = '';

  csv += `"Report Type","${report.type}"\n`;
  csv += `"Generated At","${report.generatedAt}"\n`;
  csv += `"Title","${report.title}"\n\n`;

  if (report.topRiskAreas) {
    csv += '"Top Risk Areas"\n';
    csv += '"Rank","Name","Code","Risk Index","Classification"\n';
    report.topRiskAreas.forEach((area, index) => {
      csv += `${area.rank || index + 1},"${area.name}","${area.code}",${area.risk},"${area.classification?.label || ''}"\n`;
    });
    csv += '\n';
  }

  if (report.statistics) {
    csv += '"Statistics"\n';
    csv += `"Mean","${report.statistics.mean}"\n`;
    csv += `"Median","${report.statistics.median}"\n`;
    csv += `"Std Dev","${report.statistics.stdDev}"\n`;
    csv += `"Min","${report.statistics.min}"\n`;
    csv += `"Max","${report.statistics.max}"\n`;
  }

  return csv;
}

/**
 * Export report structure for PDF generation
 * @param {Object} report - Report object
 * @returns {Object} PDF structure
 */
export function exportReportForPDF(report) {
  return {
    documentTitle: report.title,
    generatedAt: report.generatedAt,
    language: report.language,
    sections: [
      {
        title: 'Summary',
        type: 'text',
        content: report.summary || report.keyStatistics
      },
      {
        title: 'Risk Distribution',
        type: 'chart',
        chartData: report.charts?.distribution
      },
      {
        title: 'Top Risk Areas',
        type: 'table',
        headers: ['Rank', 'Name', 'Risk Index', 'Classification'],
        rows: (report.topRiskAreas || []).map((a, i) => [
          a.rank || i + 1, a.name, a.risk, a.classification?.label
        ])
      },
      {
        title: 'Recommendations',
        type: 'list',
        items: (report.recommendations || []).map(r => ({
          priority: r.priority,
          text: r.message || r.action
        }))
      }
    ],
    footer: {
      text: 'INFORM Tanzania Risk Assessment',
      pageNumbers: true
    }
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // Configuration
  REPORTING_CONFIG,
  TRANSLATIONS,
  REPORT_TYPES,

  // Statistics
  calculateStatistics,
  calculateCorrelation,
  detectOutliers,

  // Chart generators
  generateDistributionChartData,
  generateDimensionRadarData,
  generateTrendChartData,
  generateHeatmapData,

  // Report generators
  generateRiskOverviewReport,
  generateRegionalProfileReport,
  generateTrendAnalysisReport,
  generateComparativeReport,
  generateDataQualityReport,
  generateExecutiveSummary,

  // Report management
  getReport,
  getReports,
  deleteReport,

  // Export
  exportReportToJSON,
  exportReportToCSV,
  exportReportForPDF
};
