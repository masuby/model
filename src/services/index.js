/**
 * SERVICES INDEX
 * Central export for all API services connecting to Go backend
 */

// API Client (base HTTP client)
export { default as apiClient, setAuthToken, APIError } from './apiClient';

// Authentication Service
export { default as authService, USER_ROLES, INSTITUTIONS, REGIONS, ROLE_PERMISSIONS } from './authService';

// Committee Service (Go Backend API)
export {
  default as committeeService,
  getCommittees,
  getRegionalCommittees,
  getWardCommittees,
  createCommittee,
  getCommitteeById
} from './committeeService';

// Committee Supabase Service (Supabase + localStorage fallback)
export {
  default as committeeSupabaseService,
  getCommittees as getCommitteesSupabase,
  getRegionalCommittees as getRegionalCommitteesSupabase,
  getWardCommittees as getWardCommitteesSupabase,
  getCommitteeById as getCommitteeByIdSupabase,
  getCommitteeByAdm1,
  createCommittee as createCommitteeSupabase,
  updateCommittee,
  submitCommitteeDataEntry,
  getCommitteeSubmissions,
  subscribeToCommitteeData
} from './committeeSupabaseService';

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

// Warning Service (Module 03 - Early Warning System)
export {
  default as warningService,
  createHazardForecast,
  getHazardForecasts,
  createWarning,
  getWarnings,
  getActiveWarnings,
  validateWarning,
  generateWarningsForHazard,
  calculateWarningScore,
  classifyWarningLevel,
  determineResponseLevel,
  generateRecommendedActions,
  subscribeToWarnings,
  subscribeToForecasts,
  WARNING_THRESHOLDS,
  WARNING_COLORS,
  HAZARD_TYPES
} from './warningService';
