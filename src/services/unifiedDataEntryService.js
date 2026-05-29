/**
 * UNIFIED DATA ENTRY SERVICE
 * Provides high-level linkage between committees and institutions
 * Links to Excel templates: Generic - Country Model Template, Tanzania - Country Model Template
 *
 * This service coordinates:
 * - Committee data entry (Regional/Ward committees - Vulnerability & Coping Capacity)
 * - Institution data entry (TMA, MoW, MoH, MoA, GST - Hazard data)
 * - Excel template synchronization
 * - PMO review and approval workflow
 */

import { createDataEntry, bulkCreateDataEntries } from './dataEntryService';
import { getIndicators } from './indicatorService';

// Excel Template Sheet Mappings
// Maps our indicator system to the Excel template structure
const EXCEL_TEMPLATE_MAPPINGS = {
  // Generic - Country Model Template sheets
  generic: {
    'HA': 'Hazard & Exposure',
    'VU': 'Vulnerability',
    'CC': 'Lack of Coping Capacity',
    'Overview': 'Risk Overview'
  },
  // Tanzania - Country Model Template sheets
  tanzania: {
    'TZ_Hazard': 'Tanzania Hazard Data',
    'TZ_Vulnerability': 'Tanzania Vulnerability Data',
    'TZ_CopingCapacity': 'Tanzania Coping Capacity',
    'TZ_Overview': 'Tanzania Risk Overview'
  }
};

// Institution to Indicator Category Mapping
// Each institution is responsible for specific hazard categories
const INSTITUTION_INDICATOR_MAP = {
  TMA: {
    name: 'Tanzania Meteorological Authority',
    dimension: 'HAZARD',
    indicators: [
      { code: 'HA.NAT.FL', name: 'Flood Probability', unit: '%', source: 'TMA Forecasts' },
      { code: 'HA.NAT.DR', name: 'Drought Probability', unit: '%', source: 'TMA Analysis' },
      { code: 'HA.NAT.TC', name: 'Tropical Cyclone Frequency', unit: 'events/year', source: 'TMA Records' },
      { code: 'HA.NAT.HR', name: 'Heavy Rainfall Intensity', unit: 'mm/day', source: 'TMA Stations' },
      { code: 'HA.NAT.WS', name: 'Strong Wind Speed', unit: 'km/h', source: 'TMA Observations' }
    ],
    excelSheet: 'HA'
  },
  MOW: {
    name: 'Ministry of Water',
    dimension: 'HAZARD',
    indicators: [
      { code: 'HA.NAT.RF', name: 'River Flood Exposure', unit: '% area', source: 'MoW Monitoring' },
      { code: 'HA.NAT.WS', name: 'Water Scarcity Index', unit: '0-10', source: 'MoW Assessment' },
      { code: 'HA.NAT.DP', name: 'Drought Physical Exposure', unit: '% pop', source: 'MoW Analysis' }
    ],
    excelSheet: 'HA'
  },
  MOH: {
    name: 'Ministry of Health',
    dimension: 'HAZARD',
    indicators: [
      { code: 'HA.HUM.EP', name: 'Epidemic Vulnerability', unit: '0-10', source: 'MoH Surveillance' },
      { code: 'CC.INS.HC', name: 'Health System Capacity', unit: '0-10', source: 'MoH Assessment' },
      { code: 'HA.HUM.DP', name: 'Disease Prevalence', unit: 'per 1000', source: 'MoH Records' }
    ],
    excelSheet: 'HA'
  },
  MOA: {
    name: 'Ministry of Agriculture',
    dimension: 'VULNERABILITY',
    indicators: [
      { code: 'VU.VG.FS', name: 'Food Security Index', unit: '0-10', source: 'MoA Analysis' },
      { code: 'HA.NAT.CF', name: 'Crop Failure Risk', unit: '%', source: 'MoA Monitoring' },
      { code: 'HA.NAT.AD', name: 'Agricultural Drought Exposure', unit: '% area', source: 'MoA Assessment' },
      { code: 'HA.NAT.PO', name: 'Pest Outbreak Risk', unit: '0-10', source: 'MoA Surveillance' }
    ],
    excelSheet: 'VU'
  },
  GST: {
    name: 'Geological Survey of Tanzania',
    dimension: 'HAZARD',
    indicators: [
      { code: 'HA.NAT.EQ', name: 'Earthquake Hazard', unit: 'MMI', source: 'GST Seismology' },
      { code: 'HA.NAT.LS', name: 'Landslide Hazard', unit: '0-10', source: 'GST Mapping' },
      { code: 'HA.NAT.VL', name: 'Volcanic Risk', unit: '0-10', source: 'GST Monitoring' },
      { code: 'HA.NAT.TS', name: 'Tsunami Exposure', unit: '% coast', source: 'GST Assessment' }
    ],
    excelSheet: 'HA'
  }
};

// Committee to Indicator Category Mapping
// Committees provide vulnerability and coping capacity data
const COMMITTEE_INDICATOR_MAP = {
  regional: {
    dimensions: ['VULNERABILITY', 'COPING_CAPACITY'],
    indicators: [
      // Vulnerability - Socio-Economic
      { code: 'VU.SE.DD', name: 'Development & Deprivation', category: 'Socio-Economic', dimension: 'VULNERABILITY' },
      { code: 'VU.SE.IE', name: 'Inequality', category: 'Socio-Economic', dimension: 'VULNERABILITY' },
      { code: 'VU.SE.AC', name: 'Aid Dependency', category: 'Socio-Economic', dimension: 'VULNERABILITY' },
      // Vulnerability - Vulnerable Groups
      { code: 'VU.VG.UP', name: 'Uprooted People', category: 'Vulnerable Groups', dimension: 'VULNERABILITY' },
      { code: 'VU.VG.FS', name: 'Food Security', category: 'Vulnerable Groups', dimension: 'VULNERABILITY' },
      { code: 'VU.VG.HC', name: 'Health Conditions', category: 'Vulnerable Groups', dimension: 'VULNERABILITY' },
      { code: 'VU.VG.CF', name: 'Children Under Five', category: 'Vulnerable Groups', dimension: 'VULNERABILITY' },
      { code: 'VU.VG.RP', name: 'Recent Shocks', category: 'Vulnerable Groups', dimension: 'VULNERABILITY' },
      // Coping Capacity - Institutional
      { code: 'CC.INS.DR', name: 'DRR Capacity', category: 'Institutional', dimension: 'COPING_CAPACITY' },
      { code: 'CC.INS.GV', name: 'Governance', category: 'Institutional', dimension: 'COPING_CAPACITY' },
      // Coping Capacity - Infrastructure
      { code: 'CC.INF.CM', name: 'Communication', category: 'Infrastructure', dimension: 'COPING_CAPACITY' },
      { code: 'CC.INF.PI', name: 'Physical Infrastructure', category: 'Infrastructure', dimension: 'COPING_CAPACITY' },
      { code: 'CC.INF.HA', name: 'Access to Health System', category: 'Infrastructure', dimension: 'COPING_CAPACITY' }
    ]
  },
  ward: {
    dimensions: ['VULNERABILITY', 'COPING_CAPACITY'],
    indicators: [
      // Similar indicators but at ward/district level
      { code: 'VU.SE.DD', name: 'Development & Deprivation', category: 'Socio-Economic', dimension: 'VULNERABILITY' },
      { code: 'VU.VG.FS', name: 'Food Security', category: 'Vulnerable Groups', dimension: 'VULNERABILITY' },
      { code: 'VU.VG.HC', name: 'Health Conditions', category: 'Vulnerable Groups', dimension: 'VULNERABILITY' },
      { code: 'CC.INS.DR', name: 'DRR Capacity', category: 'Institutional', dimension: 'COPING_CAPACITY' },
      { code: 'CC.INF.CM', name: 'Communication', category: 'Infrastructure', dimension: 'COPING_CAPACITY' },
      { code: 'CC.INF.PI', name: 'Physical Infrastructure', category: 'Infrastructure', dimension: 'COPING_CAPACITY' }
    ]
  }
};

// Submission status workflow
const SUBMISSION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_REVISION: 'needs_revision'
};

/**
 * Get indicators available for a specific institution
 * @param {string} institutionKey - Institution code (TMA, MOW, MOH, MOA, GST)
 * @returns {Array} List of indicators
 */
export const getInstitutionIndicators = (institutionKey) => {
  const mapping = INSTITUTION_INDICATOR_MAP[institutionKey];
  if (!mapping) {
    console.warn(`No indicator mapping found for institution: ${institutionKey}`);
    return [];
  }
  return mapping.indicators;
};

/**
 * Get indicators available for a committee type
 * @param {string} committeeType - 'regional' or 'ward'
 * @returns {Array} List of indicators
 */
export const getCommitteeIndicators = (committeeType) => {
  const mapping = COMMITTEE_INDICATOR_MAP[committeeType] || COMMITTEE_INDICATOR_MAP.regional;
  return mapping.indicators;
};

/**
 * Get indicators grouped by dimension for a committee
 * @param {string} committeeType - 'regional' or 'ward'
 * @returns {Object} Indicators grouped by dimension
 */
export const getCommitteeIndicatorsByDimension = (committeeType) => {
  const indicators = getCommitteeIndicators(committeeType);
  return {
    VULNERABILITY: indicators.filter(i => i.dimension === 'VULNERABILITY'),
    COPING_CAPACITY: indicators.filter(i => i.dimension === 'COPING_CAPACITY')
  };
};

/**
 * Submit committee data entry
 * @param {Object} params - Submission parameters
 * @param {Object} params.user - User object with committee info
 * @param {Array} params.indicatorValues - Array of {indicatorCode, value, confidence, notes}
 * @param {string} params.dataSource - Data source description
 * @param {number} params.year - Data year
 * @param {number} params.quarter - Data quarter (optional)
 * @returns {Promise<Object>} Submission result
 */
export const submitCommitteeData = async ({
  user,
  indicatorValues,
  dataSource,
  year,
  quarter = null
}) => {
  try {
    const submissionId = `COM_${user.committeeId}_${Date.now()}`;
    const submittedAt = new Date().toISOString();

    // Prepare data entries for each indicator
    const entries = indicatorValues.map(iv => ({
      indicatorCode: iv.indicatorCode,
      country: 'Tanzania',
      iso3: 'TZA',
      adm1Code: user.adm1Code,
      adm1Name: user.adm1Name,
      adm2Code: user.adm2Code || null,
      adm2Name: user.adm2Name || null,
      rawValue: iv.value,
      year,
      quarter,
      dataSource: dataSource || `Committee Submission - ${user.committeeName}`,
      notes: iv.notes || '',
      confidence: iv.confidence || 'medium',
      submittedBy: user.id,
      submissionId,
      submittedAt,
      status: SUBMISSION_STATUS.SUBMITTED
    }));

    // Store in localStorage for mock/offline support
    const storageKey = `committee_submissions_${user.committeeId}`;
    const existingSubmissions = JSON.parse(localStorage.getItem(storageKey) || '[]');

    const newSubmission = {
      id: submissionId,
      submittedAt,
      year,
      quarter,
      indicatorCount: indicatorValues.length,
      status: 'pending',
      reviewedBy: null,
      reviewNotes: null,
      entries
    };

    existingSubmissions.unshift(newSubmission);
    localStorage.setItem(storageKey, JSON.stringify(existingSubmissions));

    // Also attempt API submission
    try {
      const apiResult = await bulkCreateDataEntries(entries);
      console.log('✅ Committee data submitted to API:', apiResult);
    } catch (apiError) {
      console.warn('API submission failed, data saved locally:', apiError.message);
    }

    return {
      success: true,
      submissionId,
      message: `Successfully submitted ${indicatorValues.length} indicators for review`,
      data: newSubmission
    };
  } catch (error) {
    console.error('❌ Committee data submission failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Submit institution hazard data
 * @param {Object} params - Submission parameters
 * @param {Object} params.user - User object with institution info
 * @param {string} params.institutionKey - Institution code
 * @param {Array} params.indicatorValues - Array of {indicatorCode, value, regionCode, notes}
 * @param {string} params.dataSource - Data source description
 * @param {number} params.year - Data year
 * @param {number} params.quarter - Data quarter (optional)
 * @returns {Promise<Object>} Submission result
 */
export const submitInstitutionData = async ({
  user,
  institutionKey,
  indicatorValues,
  dataSource,
  year,
  quarter = null
}) => {
  try {
    const submissionId = `INS_${institutionKey}_${Date.now()}`;
    const submittedAt = new Date().toISOString();

    // Prepare data entries
    const entries = indicatorValues.map(iv => ({
      indicatorCode: iv.indicatorCode,
      country: 'Tanzania',
      iso3: 'TZA',
      adm1Code: iv.regionCode || null,
      adm1Name: iv.regionName || null,
      adm2Code: null,
      adm2Name: null,
      rawValue: iv.value,
      year,
      quarter,
      dataSource: dataSource || `${INSTITUTION_INDICATOR_MAP[institutionKey]?.name} - Official Data`,
      notes: iv.notes || '',
      submittedBy: user?.id,
      institution: institutionKey,
      submissionId,
      submittedAt,
      status: SUBMISSION_STATUS.SUBMITTED
    }));

    // Store in localStorage for mock/offline support
    const storageKey = `institution_submissions_${institutionKey}`;
    const existingSubmissions = JSON.parse(localStorage.getItem(storageKey) || '[]');

    const newSubmission = {
      id: submissionId,
      submittedAt,
      year,
      quarter,
      indicatorCount: indicatorValues.length,
      status: 'pending',
      reviewedBy: null,
      reviewNotes: null,
      entries
    };

    existingSubmissions.unshift(newSubmission);
    localStorage.setItem(storageKey, JSON.stringify(existingSubmissions));

    // Attempt API submission
    try {
      const apiResult = await bulkCreateDataEntries(entries);
      console.log('✅ Institution data submitted to API:', apiResult);
    } catch (apiError) {
      console.warn('API submission failed, data saved locally:', apiError.message);
    }

    return {
      success: true,
      submissionId,
      message: `Successfully submitted ${indicatorValues.length} hazard indicators for review`,
      data: newSubmission
    };
  } catch (error) {
    console.error('❌ Institution data submission failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all pending submissions for PMO review
 * @returns {Promise<Object>} Pending submissions grouped by source
 */
export const getPendingSubmissions = async () => {
  try {
    const committeeSubmissions = [];
    const institutionSubmissions = [];

    // Get committee submissions from localStorage
    const committeeKeys = Object.keys(localStorage).filter(k => k.startsWith('committee_submissions_'));
    for (const key of committeeKeys) {
      const submissions = JSON.parse(localStorage.getItem(key) || '[]');
      const pending = submissions.filter(s => s.status === 'pending');
      committeeSubmissions.push(...pending);
    }

    // Get institution submissions from localStorage
    const institutionKeys = Object.keys(localStorage).filter(k => k.startsWith('institution_submissions_'));
    for (const key of institutionKeys) {
      const submissions = JSON.parse(localStorage.getItem(key) || '[]');
      const pending = submissions.filter(s => s.status === 'pending');
      institutionSubmissions.push(...pending);
    }

    return {
      success: true,
      data: {
        committees: committeeSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
        institutions: institutionSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
        totalPending: committeeSubmissions.length + institutionSubmissions.length
      }
    };
  } catch (error) {
    console.error('❌ Failed to get pending submissions:', error);
    return {
      success: false,
      error: error.message,
      data: { committees: [], institutions: [], totalPending: 0 }
    };
  }
};

/**
 * PMO Review submission
 * @param {string} submissionId - Submission ID
 * @param {string} action - 'approve' or 'reject'
 * @param {string} reviewNotes - Review notes
 * @param {Object} reviewer - Reviewer user object
 * @returns {Promise<Object>} Review result
 */
export const reviewSubmission = async (submissionId, action, reviewNotes, reviewer) => {
  try {
    const isCommittee = submissionId.startsWith('COM_');
    const prefix = isCommittee ? 'committee_submissions_' : 'institution_submissions_';

    // Find and update the submission in localStorage
    const storageKeys = Object.keys(localStorage).filter(k => k.startsWith(prefix));

    for (const key of storageKeys) {
      const submissions = JSON.parse(localStorage.getItem(key) || '[]');
      const index = submissions.findIndex(s => s.id === submissionId);

      if (index !== -1) {
        submissions[index].status = action === 'approve' ? 'approved' : 'rejected';
        submissions[index].reviewedBy = reviewer?.name || 'PMO Officer';
        submissions[index].reviewedAt = new Date().toISOString();
        submissions[index].reviewNotes = reviewNotes;

        localStorage.setItem(key, JSON.stringify(submissions));

        return {
          success: true,
          message: `Submission ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
          data: submissions[index]
        };
      }
    }

    return {
      success: false,
      error: 'Submission not found'
    };
  } catch (error) {
    console.error('❌ Review submission failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get Excel template mapping for an entity
 * @param {string} entityType - 'committee' or 'institution'
 * @param {string} entityKey - Committee type or institution code
 * @returns {Object} Excel template mapping info
 */
export const getExcelTemplateMapping = (entityType, entityKey) => {
  if (entityType === 'institution') {
    const mapping = INSTITUTION_INDICATOR_MAP[entityKey];
    return {
      templateSheet: mapping?.excelSheet,
      dimension: mapping?.dimension,
      indicators: mapping?.indicators || []
    };
  } else if (entityType === 'committee') {
    const mapping = COMMITTEE_INDICATOR_MAP[entityKey] || COMMITTEE_INDICATOR_MAP.regional;
    return {
      templateSheets: ['VU', 'CC'],
      dimensions: mapping.dimensions,
      indicators: mapping.indicators
    };
  }
  return null;
};

/**
 * Get the data flow overview
 * Shows how data flows from committees/institutions to final INFORM scores
 * @returns {Object} Data flow diagram information
 */
export const getDataFlowOverview = () => {
  return {
    sources: [
      {
        type: 'institution',
        entities: Object.keys(INSTITUTION_INDICATOR_MAP).map(key => ({
          code: key,
          name: INSTITUTION_INDICATOR_MAP[key].name,
          provides: INSTITUTION_INDICATOR_MAP[key].dimension
        }))
      },
      {
        type: 'committee',
        entities: [
          { code: 'regional', name: 'Regional Committees (26)', provides: ['VULNERABILITY', 'COPING_CAPACITY'] },
          { code: 'ward', name: 'Ward Committees', provides: ['VULNERABILITY', 'COPING_CAPACITY'] }
        ]
      }
    ],
    workflow: [
      { step: 1, action: 'Data Entry', actors: ['Committees', 'Institutions'] },
      { step: 2, action: 'Submit for Review', actors: ['Committees', 'Institutions'] },
      { step: 3, action: 'PMO Review & Approval', actors: ['PMO Officers'] },
      { step: 4, action: 'Excel Template Update', actors: ['System'] },
      { step: 5, action: 'Risk Score Calculation', actors: ['System'] },
      { step: 6, action: 'Dashboard Publication', actors: ['System'] }
    ],
    outputs: [
      { name: 'Hazard & Exposure Index', dimension: 'HAZARD' },
      { name: 'Vulnerability Index', dimension: 'VULNERABILITY' },
      { name: 'Lack of Coping Capacity Index', dimension: 'COPING_CAPACITY' },
      { name: 'INFORM Risk Index', dimension: 'OVERALL' }
    ]
  };
};

export default {
  // Institution functions
  getInstitutionIndicators,
  submitInstitutionData,

  // Committee functions
  getCommitteeIndicators,
  getCommitteeIndicatorsByDimension,
  submitCommitteeData,

  // PMO review functions
  getPendingSubmissions,
  reviewSubmission,

  // Metadata functions
  getExcelTemplateMapping,
  getDataFlowOverview,

  // Constants
  INSTITUTION_INDICATOR_MAP,
  COMMITTEE_INDICATOR_MAP,
  EXCEL_TEMPLATE_MAPPINGS,
  SUBMISSION_STATUS
};
