/**
 * COMMITTEE SUPABASE SERVICE
 * Handles committee operations with Supabase database
 * Provides real-time sync and persistent storage
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Get all committees from Supabase
 * @param {string} type - Optional filter by type ('regional' or 'ward')
 * @returns {Promise<Object>} List of committees
 */
export const getCommittees = async (type = null) => {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Supabase not configured, using fallback');
    return getCommitteesFromStorage(type);
  }

  try {
    let query = supabase
      .from('committees')
      .select('*')
      .eq('is_active', true)
      .order('adm1_code', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Failed to fetch committees from Supabase:', error);
    return getCommitteesFromStorage(type);
  }
};

/**
 * Get regional committees only
 */
export const getRegionalCommittees = async () => {
  return getCommittees('regional');
};

/**
 * Get ward committees only
 */
export const getWardCommittees = async () => {
  return getCommittees('ward');
};

/**
 * Get committee by ID
 * @param {number} id - Committee ID
 */
export const getCommitteeById = async (id) => {
  if (!isSupabaseConfigured || !supabase) {
    return getCommitteeByIdFromStorage(id);
  }

  try {
    const { data, error } = await supabase
      .from('committees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Failed to fetch committee:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get committee by ADM1 code
 * @param {string} adm1Code - ADM1 code (e.g., 'TZ01')
 */
export const getCommitteeByAdm1 = async (adm1Code) => {
  if (!isSupabaseConfigured || !supabase) {
    return getCommitteeByAdm1FromStorage(adm1Code);
  }

  try {
    const { data, error } = await supabase
      .from('committees')
      .select('*')
      .eq('adm1_code', adm1Code)
      .eq('type', 'regional')
      .single();

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Failed to fetch committee by ADM1:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create a new committee
 * @param {Object} committeeData - Committee data
 */
export const createCommittee = async (committeeData) => {
  if (!isSupabaseConfigured || !supabase) {
    return createCommitteeInStorage(committeeData);
  }

  try {
    const { data, error } = await supabase
      .from('committees')
      .insert([{
        name: committeeData.name,
        type: committeeData.type,
        adm1_code: committeeData.adm1Code,
        adm1_name: committeeData.adm1Name,
        adm2_code: committeeData.adm2Code || null,
        adm2_name: committeeData.adm2Name || null,
        contact_person: committeeData.contactPerson || '',
        contact_phone: committeeData.contactPhone || '',
        contact_email: committeeData.contactEmail || '',
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Failed to create committee:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update committee
 * @param {number} id - Committee ID
 * @param {Object} updates - Fields to update
 */
export const updateCommittee = async (id, updates) => {
  if (!isSupabaseConfigured || !supabase) {
    return updateCommitteeInStorage(id, updates);
  }

  try {
    const { data, error } = await supabase
      .from('committees')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Failed to update committee:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Submit committee data entry to Supabase
 * @param {Object} params - Submission parameters
 */
export const submitCommitteeDataEntry = async ({
  committeeId,
  userId,
  userName,
  indicatorValues,
  year,
  quarter = null,
  dataSource
}) => {
  if (!isSupabaseConfigured || !supabase) {
    return submitCommitteeDataToStorage({ committeeId, userId, userName, indicatorValues, year, quarter, dataSource });
  }

  try {
    // Get committee info
    const { data: committee } = await supabase
      .from('committees')
      .select('*')
      .eq('id', committeeId)
      .single();

    // Create data entries
    const entries = indicatorValues.map(iv => ({
      indicator_code: iv.indicatorCode,
      country: 'Tanzania',
      iso3: 'TZA',
      adm1_code: committee?.adm1_code,
      adm1_name: committee?.adm1_name,
      adm2_code: committee?.adm2_code || null,
      adm2_name: committee?.adm2_name || null,
      raw_value: iv.value,
      year,
      quarter,
      data_source: dataSource || `${committee?.name} - Committee Submission`,
      notes: iv.notes || '',
      entered_by_id: userId,
      entered_by: userName,
      status: 'submitted'
    }));

    const { data, error } = await supabase
      .from('data_entries')
      .insert(entries)
      .select();

    if (error) throw error;

    return {
      success: true,
      message: `Successfully submitted ${indicatorValues.length} indicators`,
      data
    };
  } catch (error) {
    console.error('Failed to submit committee data:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get committee submissions
 * @param {number} committeeId - Committee ID
 */
export const getCommitteeSubmissions = async (committeeId) => {
  if (!isSupabaseConfigured || !supabase) {
    return getCommitteeSubmissionsFromStorage(committeeId);
  }

  try {
    const { data: committee } = await supabase
      .from('committees')
      .select('adm1_code, adm2_code')
      .eq('id', committeeId)
      .single();

    if (!committee) {
      return { success: false, error: 'Committee not found', data: [] };
    }

    let query = supabase
      .from('data_entries')
      .select('*')
      .eq('adm1_code', committee.adm1_code)
      .order('created_at', { ascending: false });

    if (committee.adm2_code) {
      query = query.eq('adm2_code', committee.adm2_code);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Failed to get committee submissions:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Subscribe to committee data changes
 * @param {number} committeeId - Committee ID
 * @param {Function} callback - Callback function for updates
 */
export const subscribeToCommitteeData = (committeeId, callback) => {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Supabase not configured, real-time disabled');
    return { unsubscribe: () => {} };
  }

  const subscription = supabase
    .channel(`committee_${committeeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'data_entries'
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(subscription);
    }
  };
};

// ============================================================================
// LOCAL STORAGE FALLBACKS
// ============================================================================

const COMMITTEES_STORAGE_KEY = 'inform_committees';
const SUBMISSIONS_STORAGE_KEY = 'inform_committee_submissions';

// All 31 Tanzania regions for fallback
const DEFAULT_COMMITTEES = [
  // Mainland (26)
  { id: 1, name: 'Dodoma Regional Disaster Committee', type: 'regional', adm1_code: 'TZ01', adm1_name: 'Dodoma', is_active: true },
  { id: 2, name: 'Arusha Regional Disaster Committee', type: 'regional', adm1_code: 'TZ02', adm1_name: 'Arusha', is_active: true },
  { id: 3, name: 'Kilimanjaro Regional Disaster Committee', type: 'regional', adm1_code: 'TZ03', adm1_name: 'Kilimanjaro', is_active: true },
  { id: 4, name: 'Tanga Regional Disaster Committee', type: 'regional', adm1_code: 'TZ04', adm1_name: 'Tanga', is_active: true },
  { id: 5, name: 'Morogoro Regional Disaster Committee', type: 'regional', adm1_code: 'TZ05', adm1_name: 'Morogoro', is_active: true },
  { id: 6, name: 'Pwani Regional Disaster Committee', type: 'regional', adm1_code: 'TZ06', adm1_name: 'Pwani', is_active: true },
  { id: 7, name: 'Dar es Salaam Regional Disaster Committee', type: 'regional', adm1_code: 'TZ07', adm1_name: 'Dar es Salaam', is_active: true },
  { id: 8, name: 'Lindi Regional Disaster Committee', type: 'regional', adm1_code: 'TZ08', adm1_name: 'Lindi', is_active: true },
  { id: 9, name: 'Mtwara Regional Disaster Committee', type: 'regional', adm1_code: 'TZ09', adm1_name: 'Mtwara', is_active: true },
  { id: 10, name: 'Ruvuma Regional Disaster Committee', type: 'regional', adm1_code: 'TZ10', adm1_name: 'Ruvuma', is_active: true },
  { id: 11, name: 'Iringa Regional Disaster Committee', type: 'regional', adm1_code: 'TZ11', adm1_name: 'Iringa', is_active: true },
  { id: 12, name: 'Mbeya Regional Disaster Committee', type: 'regional', adm1_code: 'TZ12', adm1_name: 'Mbeya', is_active: true },
  { id: 13, name: 'Singida Regional Disaster Committee', type: 'regional', adm1_code: 'TZ13', adm1_name: 'Singida', is_active: true },
  { id: 14, name: 'Tabora Regional Disaster Committee', type: 'regional', adm1_code: 'TZ14', adm1_name: 'Tabora', is_active: true },
  { id: 15, name: 'Rukwa Regional Disaster Committee', type: 'regional', adm1_code: 'TZ15', adm1_name: 'Rukwa', is_active: true },
  { id: 16, name: 'Kigoma Regional Disaster Committee', type: 'regional', adm1_code: 'TZ16', adm1_name: 'Kigoma', is_active: true },
  { id: 17, name: 'Shinyanga Regional Disaster Committee', type: 'regional', adm1_code: 'TZ17', adm1_name: 'Shinyanga', is_active: true },
  { id: 18, name: 'Kagera Regional Disaster Committee', type: 'regional', adm1_code: 'TZ18', adm1_name: 'Kagera', is_active: true },
  { id: 19, name: 'Mwanza Regional Disaster Committee', type: 'regional', adm1_code: 'TZ19', adm1_name: 'Mwanza', is_active: true },
  { id: 20, name: 'Mara Regional Disaster Committee', type: 'regional', adm1_code: 'TZ20', adm1_name: 'Mara', is_active: true },
  { id: 21, name: 'Manyara Regional Disaster Committee', type: 'regional', adm1_code: 'TZ21', adm1_name: 'Manyara', is_active: true },
  { id: 22, name: 'Njombe Regional Disaster Committee', type: 'regional', adm1_code: 'TZ22', adm1_name: 'Njombe', is_active: true },
  { id: 23, name: 'Katavi Regional Disaster Committee', type: 'regional', adm1_code: 'TZ23', adm1_name: 'Katavi', is_active: true },
  { id: 24, name: 'Simiyu Regional Disaster Committee', type: 'regional', adm1_code: 'TZ24', adm1_name: 'Simiyu', is_active: true },
  { id: 25, name: 'Geita Regional Disaster Committee', type: 'regional', adm1_code: 'TZ25', adm1_name: 'Geita', is_active: true },
  { id: 26, name: 'Songwe Regional Disaster Committee', type: 'regional', adm1_code: 'TZ26', adm1_name: 'Songwe', is_active: true },
  // Zanzibar (5)
  { id: 27, name: 'Kaskazini Unguja Regional Disaster Committee', type: 'regional', adm1_code: 'TZ27', adm1_name: 'Kaskazini Unguja', is_active: true },
  { id: 28, name: 'Kusini Unguja Regional Disaster Committee', type: 'regional', adm1_code: 'TZ28', adm1_name: 'Kusini Unguja', is_active: true },
  { id: 29, name: 'Mjini Magharibi Regional Disaster Committee', type: 'regional', adm1_code: 'TZ29', adm1_name: 'Mjini Magharibi', is_active: true },
  { id: 30, name: 'Kaskazini Pemba Regional Disaster Committee', type: 'regional', adm1_code: 'TZ30', adm1_name: 'Kaskazini Pemba', is_active: true },
  { id: 31, name: 'Kusini Pemba Regional Disaster Committee', type: 'regional', adm1_code: 'TZ31', adm1_name: 'Kusini Pemba', is_active: true }
];

function initializeStorage() {
  if (!localStorage.getItem(COMMITTEES_STORAGE_KEY)) {
    localStorage.setItem(COMMITTEES_STORAGE_KEY, JSON.stringify(DEFAULT_COMMITTEES));
  }
}

function getCommitteesFromStorage(type = null) {
  initializeStorage();
  const committees = JSON.parse(localStorage.getItem(COMMITTEES_STORAGE_KEY) || '[]');
  const filtered = type ? committees.filter(c => c.type === type && c.is_active) : committees.filter(c => c.is_active);
  return { success: true, data: filtered };
}

function getCommitteeByIdFromStorage(id) {
  initializeStorage();
  const committees = JSON.parse(localStorage.getItem(COMMITTEES_STORAGE_KEY) || '[]');
  const committee = committees.find(c => c.id === id);
  return committee ? { success: true, data: committee } : { success: false, error: 'Not found' };
}

function getCommitteeByAdm1FromStorage(adm1Code) {
  initializeStorage();
  const committees = JSON.parse(localStorage.getItem(COMMITTEES_STORAGE_KEY) || '[]');
  const committee = committees.find(c => c.adm1_code === adm1Code && c.type === 'regional');
  return committee ? { success: true, data: committee } : { success: false, error: 'Not found' };
}

function createCommitteeInStorage(data) {
  initializeStorage();
  const committees = JSON.parse(localStorage.getItem(COMMITTEES_STORAGE_KEY) || '[]');
  const newCommittee = {
    id: Date.now(),
    name: data.name,
    type: data.type,
    adm1_code: data.adm1Code,
    adm1_name: data.adm1Name,
    adm2_code: data.adm2Code || null,
    adm2_name: data.adm2Name || null,
    contact_person: data.contactPerson || '',
    contact_phone: data.contactPhone || '',
    contact_email: data.contactEmail || '',
    is_active: true,
    created_at: new Date().toISOString()
  };
  committees.push(newCommittee);
  localStorage.setItem(COMMITTEES_STORAGE_KEY, JSON.stringify(committees));
  return { success: true, data: newCommittee };
}

function updateCommitteeInStorage(id, updates) {
  initializeStorage();
  const committees = JSON.parse(localStorage.getItem(COMMITTEES_STORAGE_KEY) || '[]');
  const index = committees.findIndex(c => c.id === id);
  if (index === -1) return { success: false, error: 'Not found' };
  committees[index] = { ...committees[index], ...updates, updated_at: new Date().toISOString() };
  localStorage.setItem(COMMITTEES_STORAGE_KEY, JSON.stringify(committees));
  return { success: true, data: committees[index] };
}

function submitCommitteeDataToStorage({ committeeId, userId, userName, indicatorValues, year, quarter, dataSource }) {
  const key = `${SUBMISSIONS_STORAGE_KEY}_${committeeId}`;
  const submissions = JSON.parse(localStorage.getItem(key) || '[]');
  const submission = {
    id: `SUB_${Date.now()}`,
    committeeId,
    userId,
    userName,
    indicatorValues,
    year,
    quarter,
    dataSource,
    status: 'submitted',
    created_at: new Date().toISOString()
  };
  submissions.unshift(submission);
  localStorage.setItem(key, JSON.stringify(submissions));
  return { success: true, data: submission };
}

function getCommitteeSubmissionsFromStorage(committeeId) {
  const key = `${SUBMISSIONS_STORAGE_KEY}_${committeeId}`;
  const submissions = JSON.parse(localStorage.getItem(key) || '[]');
  return { success: true, data: submissions };
}

export default {
  getCommittees,
  getRegionalCommittees,
  getWardCommittees,
  getCommitteeById,
  getCommitteeByAdm1,
  createCommittee,
  updateCommittee,
  submitCommitteeDataEntry,
  getCommitteeSubmissions,
  subscribeToCommitteeData
};
