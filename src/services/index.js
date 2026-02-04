/**
 * SERVICES INDEX
 * Central export for all API services connecting to Go backend
 */

// API Client (base HTTP client)
export { default as apiClient, setAuthToken, APIError } from './apiClient';

// Authentication Service
export { default as authService, USER_ROLES, INSTITUTIONS, REGIONS, ROLE_PERMISSIONS } from './authService';

// Committee Service
export {
  default as committeeService,
  getCommittees,
  getRegionalCommittees,
  getWardCommittees,
  createCommittee,
  getCommitteeById
} from './committeeService';

// Indicator Service
export {
  default as indicatorService,
  getIndicators,
  getIndicator,
  getIndicatorsByDimension,
  getHazardIndicators,
  getVulnerabilityIndicators,
  getCopingCapacityIndicators
} from './indicatorService';

// Data Entry Service
export {
  default as dataEntryService,
  createDataEntry,
  getDataEntries,
  getTanzaniaDataEntries,
  getRegionalDataEntries,
  getPendingDataEntries,
  getVerifiedDataEntries,
  verifyDataEntry,
  approveDataEntry,
  rejectDataEntry,
  bulkCreateDataEntries
} from './dataEntryService';

// Risk Score Service
export {
  default as riskScoreService,
  calculateRiskScores,
  getRiskScores,
  getTanzaniaRiskScores,
  getNationalRiskScores,
  getRegionalRiskScores,
  getDistrictRiskScores,
  getLocationRiskScore,
  getFormulas,
  getDataFlow,
  getSheetLinkages
} from './riskScoreService';

// Unified Data Entry Service (Committee & Institution linkage)
export {
  default as unifiedDataEntryService,
  getInstitutionIndicators,
  getCommitteeIndicators,
  getCommitteeIndicatorsByDimension,
  submitCommitteeData,
  submitInstitutionData,
  getPendingSubmissions,
  reviewSubmission,
  getExcelTemplateMapping,
  getDataFlowOverview,
  INSTITUTION_INDICATOR_MAP,
  COMMITTEE_INDICATOR_MAP,
  EXCEL_TEMPLATE_MAPPINGS,
  SUBMISSION_STATUS
} from './unifiedDataEntryService';
