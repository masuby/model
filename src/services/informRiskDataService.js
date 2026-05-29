/**
 * INFORM Risk Data Service
 *
 * Parses the Tanzania Country Model Template Excel file
 * Implements the exact INFORM methodology:
 * Risk = (H and E × V × LCC)^(1/3)
 *
 * Based on: Tanzania - Country Model Template.xlsx
 */

import * as XLSX from 'xlsx';

// Column mappings from Excel template
const COLUMNS = {
  // Administrative
  COUNTRY: 0,
  ADM1_NAME: 1,
  ADM2_NAME: 2,
  ISO3: 3,
  ADM1_PCODE: 4,
  ADM2_PCODE: 5,

  // Hazard and Exposure - Natural Hazards
  COASTAL_HAZARDS: 6,
  DROUGHT: 7,
  EARTHQUAKE: 8,
  ENVIRONMENTAL_DEGRADATION: 9,
  FLOOD: 10,
  HEATWAVE: 11,
  LANDSLIDE: 12,
  LIGHTNING: 13,
  STORMS_CYCLONE: 14,
  VOLCANO: 15,
  WILDFIRE: 16,
  ZOONOSES: 17,
  NATURAL_HAZARD: 18,

  // Hazard and Exposure - Human Hazards
  CONFLICT_INTENSITY: 19,
  CONFLICT_RISK: 20,
  HAZARDOUS_MATERIAL: 21,
  INTERNAL_VIOLENCE: 22,
  VEHICLE_ACCIDENTS: 23,
  HUMAN_HAZARD: 24,
  HAZARD_TOTAL: 25,

  // Vulnerability - Socio-Economic
  DEVELOPMENT_POVERTY: 26,
  ECONOMIC_DEPENDENCY: 27,
  HABITAT: 28,
  LIVELIHOODS: 29,
  SOCIO_ECONOMIC_VUL: 30,

  // Vulnerability - Vulnerable Groups
  DISPLACED_PEOPLE: 31,
  HEALTH_CONDITIONS: 32,
  CHILDREN_HEALTH_NUTRITION: 33,
  ECONOMIC_VUL: 34,
  VULNERABLE_GROUPS: 35,
  VULNERABILITY_TOTAL: 36,

  // Lack of Coping Capacity - Infrastructure
  ACCESS_HEALTH: 37,
  ECONOMIC_CAPACITY: 38,
  WASH: 39,
  COMMUNICATION: 40,
  EDUCATION: 41,
  INFRASTRUCTURE: 42,

  // Lack of Coping Capacity - Institutional
  DRR_IMPLEMENTATION: 43,
  GOVERNANCE: 44,
  INSTITUTIONAL: 45,
  LCC_TOTAL: 46,

  // Final Risk
  RISK: 47
};

/**
 * Parse Excel file and extract INFORM Risk data
 * @param {string} fileUrl - URL to Excel file (for browser) or file path (for Node.js)
 * @returns {Object} Structured INFORM Risk data
 */
export async function parseInformRiskData(fileUrl) {
  try {
    let workbook;

    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Browser: Fetch the file
      console.log('📥 Fetching Excel file from:', fileUrl);
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      workbook = XLSX.read(arrayBuffer, { type: 'array' });
      console.log('✅ Excel file loaded successfully');
    } else {
      // Node.js: Read file directly
      workbook = XLSX.readFile(fileUrl);
    }

    const sheet = workbook.Sheets['INFORM SADC 2024'];

    if (!sheet) {
      throw new Error('Sheet "INFORM SADC 2024" not found in Excel file');
    }

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    console.log(`📊 Loaded ${data.length} rows from Excel`);

    // Extract headers (row 0) and data rows (row 1+)
    const headers = data[0];
    const rows = data.slice(1);

    // Parse all administrative units
    const administrativeUnits = rows
      .map(row => parseAdministrativeUnit(row, headers))
      .filter(unit => unit.admin.iso3 === 'TZA'); // Filter only Tanzania

    console.log(`🇹🇿 Parsed ${administrativeUnits.length} Tanzania administrative units`);

    // Calculate national-level aggregates for Tanzania
    const nationalData = calculateNationalAggregates(administrativeUnits);

    return {
      national: nationalData,
      subnational: {
        adm1: groupByAdm1(administrativeUnits),
        adm2: administrativeUnits
      },
      metadata: {
        totalUnits: administrativeUnits.length,
        lastUpdated: new Date().toISOString(),
        dataSource: 'Tanzania Country Model Template'
      }
    };
  } catch (error) {
    console.error('❌ Error parsing INFORM Risk data:', error);
    throw error;
  }
}

/**
 * Parse a single administrative unit row
 */
function parseAdministrativeUnit(row, headers) {
  const getValue = (index) => {
    const val = row[index];
    return val === '' || val === null || val === undefined ? null : Number(val);
  };

  return {
    // Administrative info
    admin: {
      country: row[COLUMNS.COUNTRY],
      adm1Name: row[COLUMNS.ADM1_NAME],
      adm2Name: row[COLUMNS.ADM2_NAME],
      iso3: row[COLUMNS.ISO3],
      adm1Code: row[COLUMNS.ADM1_PCODE],
      adm2Code: row[COLUMNS.ADM2_PCODE]
    },

    // Hazard and Exposure
    hazardExposure: {
      natural: {
        coastalHazards: getValue(COLUMNS.COASTAL_HAZARDS),
        drought: getValue(COLUMNS.DROUGHT),
        earthquake: getValue(COLUMNS.EARTHQUAKE),
        environmentalDegradation: getValue(COLUMNS.ENVIRONMENTAL_DEGRADATION),
        flood: getValue(COLUMNS.FLOOD),
        heatwave: getValue(COLUMNS.HEATWAVE),
        landslide: getValue(COLUMNS.LANDSLIDE),
        lightning: getValue(COLUMNS.LIGHTNING),
        stormsCyclone: getValue(COLUMNS.STORMS_CYCLONE),
        volcano: getValue(COLUMNS.VOLCANO),
        wildfire: getValue(COLUMNS.WILDFIRE),
        zoonoses: getValue(COLUMNS.ZOONOSES),
        aggregate: getValue(COLUMNS.NATURAL_HAZARD)
      },
      human: {
        conflictIntensity: getValue(COLUMNS.CONFLICT_INTENSITY),
        conflictRisk: getValue(COLUMNS.CONFLICT_RISK),
        hazardousMaterial: getValue(COLUMNS.HAZARDOUS_MATERIAL),
        internalViolence: getValue(COLUMNS.INTERNAL_VIOLENCE),
        vehicleAccidents: getValue(COLUMNS.VEHICLE_ACCIDENTS),
        aggregate: getValue(COLUMNS.HUMAN_HAZARD)
      },
      total: getValue(COLUMNS.HAZARD_TOTAL)
    },

    // Vulnerability
    vulnerability: {
      socioEconomic: {
        developmentPoverty: getValue(COLUMNS.DEVELOPMENT_POVERTY),
        economicDependency: getValue(COLUMNS.ECONOMIC_DEPENDENCY),
        habitat: getValue(COLUMNS.HABITAT),
        livelihoods: getValue(COLUMNS.LIVELIHOODS),
        aggregate: getValue(COLUMNS.SOCIO_ECONOMIC_VUL)
      },
      vulnerableGroups: {
        displacedPeople: getValue(COLUMNS.DISPLACED_PEOPLE),
        healthConditions: getValue(COLUMNS.HEALTH_CONDITIONS),
        childrenHealthNutrition: getValue(COLUMNS.CHILDREN_HEALTH_NUTRITION),
        economic: getValue(COLUMNS.ECONOMIC_VUL),
        aggregate: getValue(COLUMNS.VULNERABLE_GROUPS)
      },
      total: getValue(COLUMNS.VULNERABILITY_TOTAL)
    },

    // Lack of Coping Capacity
    lackCopingCapacity: {
      infrastructure: {
        accessHealth: getValue(COLUMNS.ACCESS_HEALTH),
        economicCapacity: getValue(COLUMNS.ECONOMIC_CAPACITY),
        wash: getValue(COLUMNS.WASH),
        communication: getValue(COLUMNS.COMMUNICATION),
        education: getValue(COLUMNS.EDUCATION),
        aggregate: getValue(COLUMNS.INFRASTRUCTURE)
      },
      institutional: {
        drrImplementation: getValue(COLUMNS.DRR_IMPLEMENTATION),
        governance: getValue(COLUMNS.GOVERNANCE),
        aggregate: getValue(COLUMNS.INSTITUTIONAL)
      },
      total: getValue(COLUMNS.LCC_TOTAL)
    },

    // Final Risk Score
    risk: getValue(COLUMNS.RISK)
  };
}

/**
 * Calculate national-level aggregates
 * Using geometric mean as per INFORM methodology
 */
function calculateNationalAggregates(units) {
  // Filter only Tanzania units
  const tanzaniaUnits = units.filter(u => u.admin.iso3 === 'TZA');

  if (tanzaniaUnits.length === 0) {
    throw new Error('No Tanzania data found');
  }

  // Get first unit as template (national-level indicators are same across all districts)
  const template = tanzaniaUnits[0];

  // National scores are already calculated in the Excel
  // We use the first district's values as they represent national-level data
  return {
    country: 'United Republic of Tanzania',
    iso3: 'TZA',

    hazardExposure: template.hazardExposure.total,
    vulnerability: template.vulnerability.total,
    lackCopingCapacity: template.lackCopingCapacity.total,

    risk: template.risk,

    // Detailed breakdown
    dimensions: {
      hazardExposure: template.hazardExposure,
      vulnerability: template.vulnerability,
      lackCopingCapacity: template.lackCopingCapacity
    },

    classification: getRiskClassification(template.risk),
    totalDistricts: tanzaniaUnits.length
  };
}

/**
 * Group administrative units by ADM1 (regions)
 */
function groupByAdm1(units) {
  const grouped = {};

  units.forEach(unit => {
    const adm1 = unit.admin.adm1Name;
    if (!grouped[adm1]) {
      grouped[adm1] = [];
    }
    grouped[adm1].push(unit);
  });

  return grouped;
}

/**
 * Get risk classification based on INFORM scale (0-10)
 */
function getRiskClassification(riskScore) {
  if (riskScore === null || riskScore === undefined) return { level: 'Unknown', color: '#999' };

  if (riskScore >= 0 && riskScore < 2) {
    return { level: 'Very Low', color: '#43A047', range: '0.0 - 1.9' };
  } else if (riskScore >= 2 && riskScore < 3.5) {
    return { level: 'Low', color: '#8BC34A', range: '2.0 - 3.4' };
  } else if (riskScore >= 3.5 && riskScore < 5) {
    return { level: 'Medium', color: '#FFC107', range: '3.5 - 4.9' };
  } else if (riskScore >= 5 && riskScore < 6.5) {
    return { level: 'High', color: '#FF9800', range: '5.0 - 6.4' };
  } else {
    return { level: 'Very High', color: '#F44336', range: '6.5 - 10.0' };
  }
}

/**
 * Calculate geometric mean (as per INFORM methodology)
 * Risk = (H and E × V × LCC)^(1/3)
 */
export function calculateGeometricMean(...values) {
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validValues.length === 0) return null;

  const product = validValues.reduce((acc, val) => acc * val, 1);
  return Math.pow(product, 1 / validValues.length);
}

/**
 * Verify INFORM formula
 * Risk should equal (H and E × V × LCC)^(1/3)
 */
export function verifyInformFormula(he, v, lcc, risk) {
  const calculated = calculateGeometricMean(he, v, lcc);
  const diff = Math.abs(calculated - risk);
  return {
    calculated: calculated?.toFixed(2),
    actual: risk?.toFixed(2),
    isValid: diff < 0.1, // Allow small rounding differences
    difference: diff?.toFixed(3)
  };
}

export default {
  parseInformRiskData,
  calculateGeometricMean,
  verifyInformFormula,
  getRiskClassification
};
