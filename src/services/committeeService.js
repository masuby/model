/**
 * COMMITTEE SERVICE
 * Handles committee operations with Go backend API
 */

import apiClient from './apiClient';

/**
 * Get all committees
 * @param {string} type - Optional filter by type ('regional' or 'ward')
 * @returns {Promise<Array>} List of committees
 */
export const getCommittees = async (type = null) => {
  try {
    const params = type ? { type } : {};
    const response = await apiClient.get('/committees', params);

    if (response.success) {
      return {
        success: true,
        data: response.data || []
      };
    }

    throw new Error(response.error || 'Failed to fetch committees');
  } catch (error) {
    console.error('❌ Failed to fetch committees:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get regional committees only
 * @returns {Promise<Array>} List of regional committees
 */
export const getRegionalCommittees = async () => {
  return getCommittees('regional');
};

/**
 * Get ward committees only
 * @returns {Promise<Array>} List of ward committees
 */
export const getWardCommittees = async () => {
  return getCommittees('ward');
};

/**
 * Create a new committee
 * @param {Object} committeeData - Committee data
 * @returns {Promise<Object>} Created committee
 */
export const createCommittee = async (committeeData) => {
  try {
    const response = await apiClient.post('/committees', {
      name: committeeData.name,
      type: committeeData.type,
      adm1_code: committeeData.adm1Code,
      adm1_name: committeeData.adm1Name,
      adm2_code: committeeData.adm2Code || null,
      adm2_name: committeeData.adm2Name || null,
      contact_person: committeeData.contactPerson || '',
      contact_phone: committeeData.contactPhone || '',
      contact_email: committeeData.contactEmail || ''
    });

    if (response.success) {
      return {
        success: true,
        data: response.data
      };
    }

    throw new Error(response.error || 'Failed to create committee');
  } catch (error) {
    console.error('❌ Failed to create committee:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get committee by ID
 * @param {number} id - Committee ID
 * @returns {Promise<Object>} Committee data
 */
export const getCommitteeById = async (id) => {
  try {
    const response = await apiClient.get(`/committees/${id}`);

    if (response.success) {
      return {
        success: true,
        data: response.data
      };
    }

    throw new Error(response.error || 'Committee not found');
  } catch (error) {
    console.error('❌ Failed to fetch committee:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  getCommittees,
  getRegionalCommittees,
  getWardCommittees,
  createCommittee,
  getCommitteeById
};
