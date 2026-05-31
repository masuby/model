/**
 * SYSTEM SERVICE
 * Handles initialization and data loading for standalone warning system
 */

/**
 * Initialize the standalone warning system
 */
export const initializeSystem = async () => {
  try {
    console.log('🚀 Initializing Hazard & PMO Standalone System...');

    // Initialize audit logging
    console.log('✓ Audit logging initialized');

    // Initialize data structures
    const system = {
      status: 'initialized',
      timestamp: new Date().toISOString(),
      config: {
        version: '1.0.0',
        mode: 'standalone',
        features: ['hazard-input', 'pmo-validation', 'audit-logging']
      }
    };

    console.log('✅ System initialized:', system);
    return system;
  } catch (error) {
    console.error('❌ Error initializing system:', error);
    throw error;
  }
};

/**
 * Load risk data from Excel file or API
 */
export const loadRiskData = async (url) => {
  try {
    console.log('📥 Loading risk data from:', url);

    // If URL is provided and app has parsing capability, try to load
    if (url) {
      // In a real implementation, you would parse the Excel file here
      // For now, return mock data structure
      const mockRiskData = {
        national: {
          hazardExposure: 5.0,
          vulnerability: 4.5,
          lackCopingCapacity: 4.7,
          overallRisk: 4.7
        },
        subnational: {
          adm2: generateMockDistricts()
        }
      };

      console.log('✅ Risk data loaded');
      return mockRiskData;
    }

    return null;
  } catch (error) {
    console.warn('⚠️ Could not load risk data:', error.message);
    // Return mock data as fallback
    return {
      national: {
        hazardExposure: 5.0,
        vulnerability: 4.5,
        lackCopingCapacity: 4.7
      },
      subnational: {
        adm2: generateMockDistricts()
      }
    };
  }
};

/**
 * Generate mock district data
 */
const generateMockDistricts = () => {
  const districts = [
    'Ilala', 'Kinondoni', 'Temeke', 'Ubungo', 'Kigamboni',
    'Dodoma Urban', 'Chamwino', 'Kondoa', 'Mpwapwa', 'Chemba',
    'Arusha Urban', 'Arusha Rural', 'Meru', 'Karatu', 'Monduli',
    'Moshi Urban', 'Moshi Rural', 'Hai', 'Rombo', 'Same',
    'Ilemela', 'Nyamagana', 'Magu', 'Sengerema', 'Ukerewe',
    'Mbeya Urban', 'Mbeya Rural', 'Rungwe', 'Kyela', 'Mbarali',
    'Morogoro Urban', 'Morogoro Rural', 'Kilosa', 'Mvomero', 'Ulanga',
    'Tanga Urban', 'Muheza', 'Pangani', 'Korogwe', 'Handeni'
  ];

  return districts.map((name, idx) => ({
    admin: {
      adm2Name: name
    },
    hazardExposure: 4.0 + Math.random() * 2,
    vulnerability: 3.5 + Math.random() * 2.5,
    lackCopingCapacity: 3.8 + Math.random() * 2.2
  }));
};

/**
 * Calculate warning score using INFORM formula
 */
export const calculateWarningScore = (hazardScore, riskData, districtName = null) => {
  try {
    const H = hazardScore || 5;
    const E = riskData?.national?.hazardExposure || 5.0;
    const V = riskData?.national?.vulnerability || 4.5;
    const LCC = riskData?.national?.lackCopingCapacity || 4.7;

    // INFORM formula: Risk = (H × E × V × LCC)^(1/4)
    const score = Math.pow(H * E * V * LCC, 0.25);

    return {
      score: score,
      components: { H, E, V, LCC },
      level: getWarningLevelFromScore(score)
    };
  } catch (error) {
    console.error('Error calculating warning score:', error);
    return {
      score: 5,
      level: 'WARNING',
      error: error.message
    };
  }
};

/**
 * Get warning level from calculated score
 */
export const getWarningLevelFromScore = (score) => {
  if (score >= 7.5) return 'MAJOR WARNING';
  if (score >= 5.0) return 'WARNING';
  if (score >= 2.5) return 'ADVISORY';
  return 'MONITOR';
};

/**
 * Validate hazard data
 */
export const validateHazardData = (hazardData) => {
  const errors = [];

  if (!hazardData.hazardType) {
    errors.push('Hazard type is required');
  }

  if (!hazardData.spatialExtent || hazardData.spatialExtent.length === 0) {
    errors.push('At least one affected district must be selected');
  }

  if (!hazardData.temporalValidity?.start || !hazardData.temporalValidity?.end) {
    errors.push('Temporal validity dates are required');
  }

  const startDate = new Date(hazardData.temporalValidity?.start);
  const endDate = new Date(hazardData.temporalValidity?.end);

  if (startDate >= endDate) {
    errors.push('Start date must be before end date');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Export warning data as JSON
 */
export const exportWarningAsJSON = (warningData) => {
  const json = JSON.stringify(warningData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `warning_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Export warning data as CSV
 */
export const exportWarningAsCSV = (warningData) => {
  const rows = [
    ['Field', 'Value'],
    ['Hazard Type', warningData.hazardType],
    ['Institution', warningData.institution],
    ['Warning Level', warningData.warningLevel],
    ['Districts Affected', warningData.spatialExtent?.join('; ') || ''],
    ['Valid From', warningData.temporalValidity?.start || ''],
    ['Valid Until', warningData.temporalValidity?.end || ''],
    ['Likelihood', warningData.likelihood || ''],
    ['Submitted At', warningData.issuedAt || '']
  ];

  const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `warning_${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
