/**
 * RISK SCORE SERVICE
 * Handles INFORM risk score operations with Go backend API
 */

import apiClient from './apiClient';

/**
 * Calculate risk scores for a country/year
 * @param {string} iso3 - Country ISO3 code
 * @param {number} year - Year for calculation
 * @returns {Promise<Object>} Calculation results
 */
export const calculateRiskScores = async (iso3 = 'TZA', year = new Date().getFullYear()) => {
  try {
    const response = await apiClient.get('/risk/calculate', { iso3, year });

    if (response.success) {
      console.log(`✅ Risk scores calculated for ${iso3} ${year}:`, response.data?.length || 0, 'locations');
      return {
        success: true,
        data: response.data || [],
        message: response.message
      };
    }

    throw new Error(response.error || 'Failed to calculate risk scores');
  } catch (error) {
    console.error('❌ Failed to calculate risk scores:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get existing risk scores
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} Risk scores
 */
export const getRiskScores = async (filters = {}) => {
  try {
    const params = {};
    if (filters.iso3) params.iso3 = filters.iso3;
    if (filters.adm1Code) params.adm1_code = filters.adm1Code;
    if (filters.year) params.year = filters.year;
    if (filters.resolution) params.resolution = filters.resolution;

    const response = await apiClient.get('/risk/scores', params);

    if (response.success) {
      return {
        success: true,
        data: response.data || []
      };
    }

    throw new Error(response.error || 'Failed to fetch risk scores');
  } catch (error) {
    console.error('❌ Failed to fetch risk scores:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get Tanzania risk scores
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Tanzania risk scores
 */
export const getTanzaniaRiskScores = async (filters = {}) => {
  return getRiskScores({ ...filters, iso3: 'TZA' });
};

/**
 * Get national-level risk scores
 * @param {string} iso3 - Country ISO3 code
 * @param {number} year - Year
 * @returns {Promise<Array>} National risk scores
 */
export const getNationalRiskScores = async (iso3 = 'TZA', year = null) => {
  const filters = { iso3, resolution: 'national' };
  if (year) filters.year = year;
  return getRiskScores(filters);
};

/**
 * Get regional (ADM1) risk scores
 * @param {string} iso3 - Country ISO3 code
 * @param {number} year - Year
 * @returns {Promise<Array>} Regional risk scores
 */
export const getRegionalRiskScores = async (iso3 = 'TZA', year = null) => {
  const filters = { iso3, resolution: 'adm1' };
  if (year) filters.year = year;
  return getRiskScores(filters);
};

/**
 * Get district (ADM2) risk scores
 * @param {string} iso3 - Country ISO3 code
 * @param {string} adm1Code - Region code (optional)
 * @param {number} year - Year
 * @returns {Promise<Array>} District risk scores
 */
export const getDistrictRiskScores = async (iso3 = 'TZA', adm1Code = null, year = null) => {
  const filters = { iso3, resolution: 'adm2' };
  if (adm1Code) filters.adm1Code = adm1Code;
  if (year) filters.year = year;
  return getRiskScores(filters);
};

/**
 * Get risk score for a specific location
 * @param {string} adm1Code - Region code
 * @param {string} adm2Code - District code (optional)
 * @param {number} year - Year
 * @returns {Promise<Object>} Risk score
 */
export const getLocationRiskScore = async (adm1Code, adm2Code = null, year = null) => {
  const filters = { iso3: 'TZA', adm1Code };
  if (year) filters.year = year;

  const response = await getRiskScores(filters);

  if (response.success && response.data.length > 0) {
    // Filter by ADM2 if provided
    if (adm2Code) {
      const match = response.data.find(r => r.adm2_code === adm2Code);
      return {
        success: !!match,
        data: match || null
      };
    }
    // Return first match (should be one for ADM1)
    return {
      success: true,
      data: response.data[0]
    };
  }

  return {
    success: false,
    error: 'Risk score not found',
    data: null
  };
};

/**
 * Get transparency data - formulas
 * @returns {Promise<Array>} Formula documentation
 */
export const getFormulas = async () => {
  try {
    const response = await apiClient.get('/transparency/formulas');

    if (response.success) {
      return {
        success: true,
        data: response.data || []
      };
    }

    throw new Error(response.error || 'Failed to fetch formulas');
  } catch (error) {
    console.error('❌ Failed to fetch formulas:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get transparency data - data flow
 * @returns {Promise<Array>} Data flow documentation
 */
export const getDataFlow = async () => {
  try {
    const response = await apiClient.get('/transparency/dataflow');

    if (response.success) {
      return {
        success: true,
        data: response.data || []
      };
    }

    throw new Error(response.error || 'Failed to fetch data flow');
  } catch (error) {
    console.error('❌ Failed to fetch data flow:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get transparency data - sheet linkages
 * @returns {Promise<Array>} Sheet linkage documentation
 */
export const getSheetLinkages = async () => {
  try {
    const response = await apiClient.get('/transparency/linkages');

    if (response.success) {
      return {
        success: true,
        data: response.data || []
      };
    }

    throw new Error(response.error || 'Failed to fetch sheet linkages');
  } catch (error) {
    console.error('❌ Failed to fetch sheet linkages:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

export default {
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
};
