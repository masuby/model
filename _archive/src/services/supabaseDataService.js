/**
 * SUPABASE DATA SERVICE
 *
 * Provides database operations for INFORM Tanzania using Supabase
 * Falls back to localStorage when Supabase is not configured
 *
 * Features:
 * - CRUD operations for submissions
 * - Real-time subscriptions
 * - Automatic fallback to localStorage
 * - INFORM risk calculation integration
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
// Use the complete INFORM calculation engine with all 78 indicators
import { calculateINFORMRisk, classifyRisk } from './informCalculationEngine';

// ============================================================================
// CONFIGURATION
// ============================================================================

const LOCAL_STORAGE_KEYS = {
  SUBMISSIONS: 'committee_submissions',
  APPROVED_DATA: 'inform_approved_risk_data',
  PENDING: 'all_pending_submissions'
};

// ============================================================================
// HELPER: Check if using Supabase or localStorage
// ============================================================================

export function isUsingSupabase() {
  return isSupabaseConfigured && supabase !== null;
}

// ============================================================================
// SUBMISSIONS CRUD
// ============================================================================

/**
 * Create a new submission
 */
export async function createSubmission(submissionData) {
  // Calculate INFORM risk scores
  const calculation = calculateINFORMRisk(submissionData.indicators || {});

  const enrichedData = {
    ...submissionData,
    hazard_score: calculation.dimensions?.HAZARD?.score,
    vulnerability_score: calculation.dimensions?.VULNERABILITY?.score,
    coping_score: calculation.dimensions?.COPING_CAPACITY?.score,
    risk_score: calculation.risk,
    risk_class: calculation.classification?.label,
    submitted_at: new Date().toISOString(),
    status: 'pending'
  };

  if (isUsingSupabase()) {
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        source_type: enrichedData.sourceType || 'committee',
        source_id: enrichedData.committeeId || enrichedData.sourceId,
        source_name: enrichedData.committeeName || enrichedData.sourceName,
        region_code: enrichedData.adm1Code || enrichedData.regionCode,
        district_code: enrichedData.adm2Code || enrichedData.districtCode,
        region_name: enrichedData.adm1Name || enrichedData.regionName,
        district_name: enrichedData.adm2Name || enrichedData.districtName,
        indicators: enrichedData.indicators,
        hazard_score: enrichedData.hazard_score,
        vulnerability_score: enrichedData.vulnerability_score,
        coping_score: enrichedData.coping_score,
        risk_score: enrichedData.risk_score,
        risk_class: enrichedData.risk_class,
        submitted_by_name: enrichedData.submittedBy,
        submitted_by_email: enrichedData.submittedByEmail,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return transformSupabaseSubmission(data);
  }

  // Fallback to localStorage
  return createLocalSubmission(enrichedData);
}

/**
 * Get all submissions (with optional filters)
 */
export async function getSubmissions(filters = {}) {
  if (isUsingSupabase()) {
    let query = supabase
      .from('submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.regionCode) {
      query = query.eq('region_code', filters.regionCode);
    }
    if (filters.sourceType) {
      query = query.eq('source_type', filters.sourceType);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(transformSupabaseSubmission);
  }

  // Fallback to localStorage
  return getLocalSubmissions(filters);
}

/**
 * Get single submission by ID
 */
export async function getSubmissionById(id) {
  if (isUsingSupabase()) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return transformSupabaseSubmission(data);
  }

  // Fallback to localStorage
  const all = await getLocalSubmissions();
  return all.find(s => s.id === id);
}

/**
 * Update submission status (for PMO review)
 */
export async function updateSubmissionStatus(id, status, reviewData = {}) {
  if (isUsingSupabase()) {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        status,
        reviewed_by_name: reviewData.reviewerName,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewData.notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformSupabaseSubmission(data);
  }

  // Fallback to localStorage
  return updateLocalSubmissionStatus(id, status, reviewData);
}

/**
 * Approve submission and add to official risk data
 * Recalculates INFORM scores using official methodology
 */
export async function approveSubmission(id, approver) {
  const submission = await getSubmissionById(id);
  if (!submission) throw new Error('Submission not found');

  // Recalculate INFORM scores using official methodology
  const calculation = calculateINFORMRisk(submission.indicators || {});
  const riskClassification = classifyRisk(calculation.risk);

  // Update submission status
  await updateSubmissionStatus(id, 'approved', {
    reviewerName: approver?.name || approver?.email,
    notes: 'Approved and added to official risk profile'
  });

  // Prepare scores from calculation
  const scores = {
    hazardScore: calculation.dimensions?.HAZARD?.score,
    vulnerabilityScore: calculation.dimensions?.VULNERABILITY?.score,
    copingScore: calculation.dimensions?.COPING_CAPACITY?.score,
    riskScore: calculation.risk,
    riskClass: riskClassification?.label
  };

  // Create approved risk data entry
  if (isUsingSupabase()) {
    const { data, error } = await supabase
      .from('approved_risk_data')
      .insert({
        submission_id: id,
        region_code: submission.adm1Code || submission.regionCode,
        district_code: submission.adm2Code || submission.districtCode,
        region_name: submission.adm1Name || submission.regionName,
        district_name: submission.adm2Name || submission.districtName,
        hazard_score: scores.hazardScore,
        vulnerability_score: scores.vulnerabilityScore,
        coping_score: scores.copingScore,
        risk_score: scores.riskScore,
        risk_class: scores.riskClass,
        // Store both indicators AND calculated dimensions for Risk Module
        dimension_details: {
          indicators: submission.indicators,
          dimensions: calculation.dimensions
        },
        source_type: submission.sourceType,
        source_name: submission.committeeName || submission.sourceName,
        approved_by_name: approver?.name || approver?.email,
        methodology: 'INFORM 2024'
      })
      .select()
      .single();

    if (error) throw error;
    return { submission, approvedData: data, calculation };
  }

  // Fallback to localStorage
  return approveLocalSubmission(submission, approver, calculation);
}

/**
 * Reject submission
 */
export async function rejectSubmission(id, reviewer, reason) {
  return updateSubmissionStatus(id, 'rejected', {
    reviewerName: reviewer?.name || reviewer?.email,
    notes: reason
  });
}

// ============================================================================
// APPROVED RISK DATA
// ============================================================================

/**
 * Get all approved risk data
 */
export async function getApprovedRiskData() {
  if (isUsingSupabase()) {
    const { data, error } = await supabase
      .from('approved_risk_data')
      .select('*')
      .eq('is_current', true)
      .order('approved_at', { ascending: false });

    if (error) throw error;
    return data.map(transformApprovedData);
  }

  // Fallback to localStorage
  return getLocalApprovedData();
}

/**
 * Get approved data for specific region
 */
export async function getApprovedDataForRegion(regionCode) {
  if (isUsingSupabase()) {
    const { data, error } = await supabase
      .from('approved_risk_data')
      .select('*')
      .eq('region_code', regionCode)
      .eq('is_current', true);

    if (error) throw error;
    return data.map(transformApprovedData);
  }

  // Fallback to localStorage
  const all = await getLocalApprovedData();
  return all.filter(d => d.adm1Code === regionCode || d.regionCode === regionCode);
}

// ============================================================================
// ADMIN UNITS
// ============================================================================

/**
 * Get all regions
 */
export async function getRegions() {
  if (isUsingSupabase()) {
    const { data, error } = await supabase
      .from('admin_units')
      .select('*')
      .eq('level', 1)
      .order('name');

    if (error) throw error;
    return data;
  }

  // Return hardcoded Tanzania regions
  return getTanzaniaRegions();
}

/**
 * Get districts for a region
 */
export async function getDistricts(regionCode) {
  if (isUsingSupabase()) {
    let query = supabase
      .from('admin_units')
      .select('*')
      .eq('level', 2);

    if (regionCode) {
      query = query.eq('parent_code', regionCode);
    }

    const { data, error } = await query.order('name');
    if (error) throw error;
    return data;
  }

  // Return empty for localStorage (no district data)
  return [];
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to submission changes
 */
export function subscribeToSubmissions(callback) {
  if (!isUsingSupabase()) {
    console.warn('Real-time subscriptions require Supabase');
    return { unsubscribe: () => {} };
  }

  const subscription = supabase
    .channel('submissions-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'submissions'
      },
      (payload) => {
        callback({
          type: payload.eventType,
          data: transformSupabaseSubmission(payload.new || payload.old)
        });
      }
    )
    .subscribe();

  return {
    unsubscribe: () => subscription.unsubscribe()
  };
}

/**
 * Subscribe to approved data changes
 */
export function subscribeToApprovedData(callback) {
  if (!isUsingSupabase()) {
    return { unsubscribe: () => {} };
  }

  const subscription = supabase
    .channel('approved-data-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'approved_risk_data'
      },
      (payload) => {
        callback({
          type: payload.eventType,
          data: transformApprovedData(payload.new || payload.old)
        });
      }
    )
    .subscribe();

  return {
    unsubscribe: () => subscription.unsubscribe()
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get submission statistics
 */
export async function getSubmissionStats() {
  if (isUsingSupabase()) {
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('status, region_code');

    if (error) throw error;

    return {
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      approved: submissions.filter(s => s.status === 'approved').length,
      rejected: submissions.filter(s => s.status === 'rejected').length,
      byRegion: submissions.reduce((acc, s) => {
        acc[s.region_code] = (acc[s.region_code] || 0) + 1;
        return acc;
      }, {})
    };
  }

  // Fallback to localStorage
  const submissions = await getLocalSubmissions();
  return {
    total: submissions.length,
    pending: submissions.filter(s => (s.status || 'pending') === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    byRegion: {}
  };
}

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

function transformSupabaseSubmission(data) {
  if (!data) return null;
  return {
    id: data.id,
    sourceType: data.source_type,
    committeeId: data.source_id,
    committeeName: data.source_name,
    adm1Code: data.region_code,
    adm1Name: data.region_name,
    adm2Code: data.district_code,
    adm2Name: data.district_name,
    indicators: data.indicators,
    indicatorCount: Object.keys(data.indicators || {}).length,
    hazardScore: data.hazard_score,
    vulnerabilityScore: data.vulnerability_score,
    copingScore: data.coping_score,
    riskScore: data.risk_score,
    riskClass: data.risk_class,
    status: data.status,
    submittedBy: data.submitted_by_name,
    submittedByEmail: data.submitted_by_email,
    submittedAt: data.submitted_at,
    reviewedBy: data.reviewed_by_name,
    reviewedAt: data.reviewed_at,
    reviewNotes: data.review_notes,
    scores: {
      riskScore: data.risk_score,
      riskClass: data.risk_class
    },
    calculated: {
      hazardScore: data.hazard_score,
      vulnerabilityScore: data.vulnerability_score,
      lackOfCopingScore: data.coping_score,
      riskScore: data.risk_score,
      riskClass: data.risk_class
    }
  };
}

function transformApprovedData(data) {
  if (!data) return null;

  // Extract indicators and dimensions from dimension_details
  const details = data.dimension_details || {};
  const indicators = details.indicators || details; // Handle both old and new format
  const dimensions = details.dimensions || null;

  return {
    id: data.id,
    submissionId: data.submission_id,
    adm1Code: data.region_code,
    adm1Name: data.region_name,
    adm2Code: data.district_code,
    adm2Name: data.district_name,
    committeeName: data.source_name,
    indicators,
    calculated: {
      hazardScore: data.hazard_score,
      vulnerabilityScore: data.vulnerability_score,
      lackOfCopingScore: data.coping_score,
      dimensions, // Include full dimension breakdown for Risk Module
      riskScore: data.risk_score,
      riskClass: data.risk_class
    },
    approvedBy: data.approved_by_name,
    approvedAt: data.approved_at,
    methodology: data.methodology
  };
}

// ============================================================================
// LOCAL STORAGE FALLBACK
// ============================================================================

function createLocalSubmission(data) {
  const submission = {
    id: Date.now().toString(),
    ...data,
    scores: {
      riskScore: data.risk_score,
      riskClass: data.risk_class
    }
  };

  // Store in committee-specific key
  const key = `committee_submissions_${data.committeeId || 'general'}`;
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push(submission);
  localStorage.setItem(key, JSON.stringify(existing));

  // Also add to global pending
  const pending = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.PENDING) || '[]');
  pending.push(submission);
  localStorage.setItem(LOCAL_STORAGE_KEYS.PENDING, JSON.stringify(pending));

  return submission;
}

function getLocalSubmissions(filters = {}) {
  const allSubmissions = [];
  const seenIds = new Set();

  // Scan all committee_submissions_* keys
  Object.keys(localStorage)
    .filter(k => k.startsWith('committee_submissions_'))
    .forEach(key => {
      const subs = JSON.parse(localStorage.getItem(key) || '[]');
      subs.forEach(s => {
        if (!seenIds.has(s.id)) {
          seenIds.add(s.id);
          allSubmissions.push(s);
        }
      });
    });

  // Also check global pending
  const globalPending = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.PENDING) || '[]');
  globalPending.forEach(s => {
    if (!seenIds.has(s.id)) {
      seenIds.add(s.id);
      allSubmissions.push(s);
    }
  });

  // Apply filters
  let filtered = allSubmissions;
  if (filters.status) {
    filtered = filtered.filter(s => (s.status || 'pending') === filters.status);
  }
  if (filters.regionCode) {
    filtered = filtered.filter(s => s.adm1Code === filters.regionCode || s.regionCode === filters.regionCode);
  }

  // Sort by date
  return filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

function updateLocalSubmissionStatus(id, status, reviewData) {
  // Update in all localStorage keys
  Object.keys(localStorage)
    .filter(k => k.startsWith('committee_submissions_'))
    .forEach(key => {
      const subs = JSON.parse(localStorage.getItem(key) || '[]');
      const idx = subs.findIndex(s => s.id === id || s.id === String(id));
      if (idx !== -1) {
        subs[idx].status = status;
        subs[idx].reviewedBy = reviewData.reviewerName;
        subs[idx].reviewedAt = new Date().toISOString();
        subs[idx].reviewNotes = reviewData.notes;
        localStorage.setItem(key, JSON.stringify(subs));
      }
    });

  // Also update in global pending
  const pending = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.PENDING) || '[]');
  const pendingIdx = pending.findIndex(s => s.id === id || s.id === String(id));
  if (pendingIdx !== -1) {
    pending[pendingIdx].status = status;
    pending[pendingIdx].reviewedBy = reviewData.reviewerName;
    pending[pendingIdx].reviewedAt = new Date().toISOString();
    localStorage.setItem(LOCAL_STORAGE_KEYS.PENDING, JSON.stringify(pending));
  }

  return { id, status, ...reviewData };
}

function approveLocalSubmission(submission, approver, calculation) {
  // Build calculated scores structure that Risk Module expects
  const calculated = {
    hazardScore: calculation?.dimensions?.HAZARD?.score,
    vulnerabilityScore: calculation?.dimensions?.VULNERABILITY?.score,
    lackOfCopingScore: calculation?.dimensions?.COPING_CAPACITY?.score,
    riskScore: calculation?.risk,
    riskClass: calculation?.classification?.label,
    dimensions: calculation?.dimensions
  };

  // Store in approved data with proper structure
  const approvedData = {
    id: `approved_${Date.now()}`,
    submissionId: submission.id,
    committeeId: submission.committeeId,
    committeeName: submission.committeeName,
    adm1Code: submission.adm1Code,
    adm1Name: submission.adm1Name,
    adm2Code: submission.adm2Code,
    adm2Name: submission.adm2Name,
    indicators: submission.indicators,
    calculated,  // Risk Module expects this structure
    submittedBy: submission.submittedBy,
    submittedAt: submission.submittedAt,
    approvedBy: approver?.name || approver?.email,
    approvedAt: new Date().toISOString(),
    methodology: 'INFORM 2024'
  };

  const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.APPROVED_DATA) || '[]');
  existing.push(approvedData);
  localStorage.setItem(LOCAL_STORAGE_KEYS.APPROVED_DATA, JSON.stringify(existing));

  return { submission, approvedData, calculation };
}

function getLocalApprovedData() {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.APPROVED_DATA) || '[]');
}

// ============================================================================
// TANZANIA REGIONS (Fallback data)
// ============================================================================

function getTanzaniaRegions() {
  return [
    { code: 'TZ-01', name: 'Arusha', population: 1694310 },
    { code: 'TZ-02', name: 'Dar es Salaam', population: 4364541 },
    { code: 'TZ-03', name: 'Dodoma', population: 2083588 },
    { code: 'TZ-04', name: 'Geita', population: 1739530 },
    { code: 'TZ-05', name: 'Iringa', population: 941238 },
    { code: 'TZ-06', name: 'Kagera', population: 2458023 },
    { code: 'TZ-07', name: 'Katavi', population: 564604 },
    { code: 'TZ-08', name: 'Kigoma', population: 2127930 },
    { code: 'TZ-09', name: 'Kilimanjaro', population: 1640087 },
    { code: 'TZ-10', name: 'Lindi', population: 864652 },
    { code: 'TZ-11', name: 'Manyara', population: 1425131 },
    { code: 'TZ-12', name: 'Mara', population: 1743830 },
    { code: 'TZ-13', name: 'Mbeya', population: 2707410 },
    { code: 'TZ-14', name: 'Morogoro', population: 2218492 },
    { code: 'TZ-15', name: 'Mtwara', population: 1270854 },
    { code: 'TZ-16', name: 'Mwanza', population: 2772509 },
    { code: 'TZ-17', name: 'Njombe', population: 702097 },
    { code: 'TZ-18', name: 'Pwani', population: 1098668 },
    { code: 'TZ-19', name: 'Rukwa', population: 1004539 },
    { code: 'TZ-20', name: 'Ruvuma', population: 1376891 },
    { code: 'TZ-21', name: 'Shinyanga', population: 1534808 },
    { code: 'TZ-22', name: 'Simiyu', population: 1584157 },
    { code: 'TZ-23', name: 'Singida', population: 1370637 },
    { code: 'TZ-24', name: 'Songwe', population: 998862 },
    { code: 'TZ-25', name: 'Tabora', population: 2291623 },
    { code: 'TZ-26', name: 'Tanga', population: 2045205 }
  ];
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  isUsingSupabase,

  // Submissions
  createSubmission,
  getSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  approveSubmission,
  rejectSubmission,

  // Approved Data
  getApprovedRiskData,
  getApprovedDataForRegion,

  // Admin Units
  getRegions,
  getDistricts,

  // Real-time
  subscribeToSubmissions,
  subscribeToApprovedData,

  // Statistics
  getSubmissionStats
};
