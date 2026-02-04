/**
 * INDICATOR SERVICE
 * Handles INFORM indicator operations with Go backend API
 */

import apiClient from './apiClient';

/**
 * Get all indicators
 * @param {Object} filters - Optional filters
 * @param {string} filters.dimension - Filter by dimension (HAZARD, VULNERABILITY, COPING_CAPACITY)
 * @param {string} filters.resolution - Filter by resolution (national, adm1, adm2)
 * @returns {Promise<Array>} List of indicators
 */
export const getIndicators = async (filters = {}) => {
  try {
    const params = {};
    if (filters.dimension) params.dimension = filters.dimension;
    if (filters.resolution) params.resolution = filters.resolution;

    const response = await apiClient.get('/indicators', params);

    if (response.success) {
      return {
        success: true,
        data: response.data || []
      };
    }

    throw new Error(response.error || 'Failed to fetch indicators');
  } catch (error) {
    console.error('❌ Failed to fetch indicators:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get indicator by ID or code
 * @param {string|number} idOrCode - Indicator ID or code
 * @returns {Promise<Object>} Indicator data
 */
export const getIndicator = async (idOrCode) => {
  try {
    const response = await apiClient.get(`/indicators/${idOrCode}`);

    if (response.success) {
      return {
        success: true,
        data: response.data
      };
    }

    throw new Error(response.error || 'Indicator not found');
  } catch (error) {
    console.error('❌ Failed to fetch indicator:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get indicators grouped by dimension
 * @returns {Promise<Object>} Indicators grouped by dimension
 */
export const getIndicatorsByDimension = async () => {
  try {
    const response = await getIndicators();

    if (!response.success) {
      throw new Error(response.error);
    }

    const grouped = {
      HAZARD: [],
      VULNERABILITY: [],
      COPING_CAPACITY: []
    };

    response.data.forEach(indicator => {
      if (grouped[indicator.dimension]) {
        grouped[indicator.dimension].push(indicator);
      }
    });

    return {
      success: true,
      data: grouped
    };
  } catch (error) {
    console.error('❌ Failed to group indicators:', error.message);
    return {
      success: false,
      error: error.message,
      data: { HAZARD: [], VULNERABILITY: [], COPING_CAPACITY: [] }
    };
  }
};

/**
 * Get hazard indicators
 * @returns {Promise<Array>} Hazard indicators
 */
export const getHazardIndicators = async () => {
  return getIndicators({ dimension: 'HAZARD' });
};

/**
 * Get vulnerability indicators
 * @returns {Promise<Array>} Vulnerability indicators
 */
export const getVulnerabilityIndicators = async () => {
  return getIndicators({ dimension: 'VULNERABILITY' });
};

/**
 * Get coping capacity indicators
 * @returns {Promise<Array>} Coping capacity indicators
 */
export const getCopingCapacityIndicators = async () => {
  return getIndicators({ dimension: 'COPING_CAPACITY' });
};

export default {
  getIndicators,
  getIndicator,
  getIndicatorsByDimension,
  getHazardIndicators,
  getVulnerabilityIndicators,
  getCopingCapacityIndicators
};
