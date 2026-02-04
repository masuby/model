/**
 * DATA ENTRY SERVICE
 * Handles data entry operations with Go backend API
 */

import apiClient from './apiClient';

/**
 * Create a new data entry
 * @param {Object} entryData - Data entry information
 * @returns {Promise<Object>} Created data entry
 */
export const createDataEntry = async (entryData) => {
  try {
    const response = await apiClient.post('/data', {
      indicator_code: entryData.indicatorCode,
      country: entryData.country || 'Tanzania',
      iso3: entryData.iso3 || 'TZA',
      adm1_code: entryData.adm1Code || null,
      adm1_name: entryData.adm1Name || null,
      adm2_code: entryData.adm2Code || null,
      adm2_name: entryData.adm2Name || null,
      raw_value: entryData.rawValue,
      year: entryData.year,
      quarter: entryData.quarter || null,
      data_source: entryData.dataSource || '',
      notes: entryData.notes || ''
    });

    if (response.success) {
      console.log('✅ Data entry created:', response.data?.id);
      return {
        success: true,
        data: response.data
      };
    }

    throw new Error(response.error || 'Failed to create data entry');
  } catch (error) {
    console.error('❌ Failed to create data entry:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get data entries with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} List of data entries
 */
export const getDataEntries = async (filters = {}) => {
  try {
    const params = {};
    if (filters.indicatorCode) params.indicator_code = filters.indicatorCode;
    if (filters.iso3) params.iso3 = filters.iso3;
    if (filters.adm1Code) params.adm1_code = filters.adm1Code;
    if (filters.year) params.year = filters.year;
    if (filters.status) params.status = filters.status;

    const response = await apiClient.get('/data', params);

    if (response.success) {
      return {
        success: true,
        data: response.data || []
      };
    }

    throw new Error(response.error || 'Failed to fetch data entries');
  } catch (error) {
    console.error('❌ Failed to fetch data entries:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get data entries for Tanzania
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Tanzania data entries
 */
export const getTanzaniaDataEntries = async (filters = {}) => {
  return getDataEntries({ ...filters, iso3: 'TZA' });
};

/**
 * Get data entries by region
 * @param {string} adm1Code - Region code (e.g., 'TZ01')
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Regional data entries
 */
export const getRegionalDataEntries = async (adm1Code, filters = {}) => {
  return getDataEntries({ ...filters, adm1Code, iso3: 'TZA' });
};

/**
 * Get pending data entries (for review)
 * @returns {Promise<Array>} Pending data entries
 */
export const getPendingDataEntries = async () => {
  return getDataEntries({ status: 'submitted' });
};

/**
 * Get verified data entries
 * @returns {Promise<Array>} Verified data entries
 */
export const getVerifiedDataEntries = async () => {
  return getDataEntries({ status: 'verified' });
};

/**
 * Verify a data entry
 * @param {number} entryId - Data entry ID
 * @param {string} action - 'verify' or 'reject'
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} Result
 */
export const verifyDataEntry = async (entryId, action, notes = '') => {
  try {
    const response = await apiClient.put(`/data/${entryId}/verify`, {
      action,
      notes
    });

    if (response.success) {
      console.log(`✅ Data entry ${entryId} ${action}ed`);
      return {
        success: true,
        message: response.message
      };
    }

    throw new Error(response.error || `Failed to ${action} data entry`);
  } catch (error) {
    console.error(`❌ Failed to ${action} data entry:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Approve a data entry
 * @param {number} entryId - Data entry ID
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} Result
 */
export const approveDataEntry = async (entryId, notes = '') => {
  return verifyDataEntry(entryId, 'verify', notes);
};

/**
 * Reject a data entry
 * @param {number} entryId - Data entry ID
 * @param {string} notes - Rejection reason
 * @returns {Promise<Object>} Result
 */
export const rejectDataEntry = async (entryId, notes = '') => {
  return verifyDataEntry(entryId, 'reject', notes);
};

/**
 * Bulk create data entries
 * @param {Array} entries - Array of data entry objects
 * @returns {Promise<Object>} Results summary
 */
export const bulkCreateDataEntries = async (entries) => {
  const results = {
    success: true,
    created: 0,
    failed: 0,
    errors: []
  };

  for (const entry of entries) {
    const result = await createDataEntry(entry);
    if (result.success) {
      results.created++;
    } else {
      results.failed++;
      results.errors.push({ entry, error: result.error });
    }
  }

  results.success = results.failed === 0;
  console.log(`📊 Bulk import: ${results.created} created, ${results.failed} failed`);

  return results;
};

export default {
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
};
