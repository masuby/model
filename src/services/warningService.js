/**
 * WARNING SERVICE
 *
 * Handles early warning system operations for Module 03
 * Integrates with Go backend API and Supabase
 *
 * Features:
 * - Hazard forecast CRUD operations
 * - Warning generation and management
 * - Risk-informed warning calculations
 * - Real-time updates via WebSocket
 */

import apiClient from './apiClient';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ============================================================================
// CONFIGURATION
// ============================================================================

const LOCAL_STORAGE_KEYS = {
  HAZARD_FORECASTS: 'warning_hazard_forecasts',
  WARNINGS: 'warning_active_warnings',
  WARNING_HISTORY: 'warning_history'
};

// Warning level thresholds (0-10 scale)
export const WARNING_THRESHOLDS = {
  MONITOR: 2.5,
  ADVISORY: 5.0,
  WARNING: 7.5,
  MAJOR_WARNING: 9.0
};

// Warning level colors
export const WARNING_COLORS = {
  monitor: '#4CAF50',        // Green
  advisory: '#FFEB3B',       // Yellow
  warning: '#FF9800',        // Orange
  major_warning: '#F44336',  // Red
  emergency: '#9C27B0'       // Purple
};

// Institution definitions
export const INSTITUTIONS = {
  TMA: { id: 'TMA', name: 'Tanzania Meteorological Authority', hazardTypes: ['flood', 'drought', 'cyclone', 'heavy_rain', 'strong_wind', 'heatwave'] },
  MOW: { id: 'MOW', name: 'Ministry of Water', hazardTypes: ['flood', 'dam_overflow', 'water_shortage'] },
  MOH: { id: 'MOH', name: 'Ministry of Health', hazardTypes: ['disease_outbreak', 'epidemic', 'health_emergency'] },
  MOA: { id: 'MOA', name: 'Ministry of Agriculture', hazardTypes: ['drought', 'pest_outbreak', 'crop_disease', 'food_insecurity'] },
  GST: { id: 'GST', name: 'Geological Survey of Tanzania', hazardTypes: ['earthquake', 'landslide', 'volcanic_activity'] }
};

// Hazard types with metadata
export const HAZARD_TYPES = {
  flood: { name: 'Flood', icon: '🌊', category: 'natural', institution: 'TMA' },
  drought: { name: 'Drought', icon: '☀️', category: 'natural', institution: 'TMA' },
  cyclone: { name: 'Tropical Cyclone', icon: '🌀', category: 'natural', institution: 'TMA' },
  heavy_rain: { name: 'Heavy Rainfall', icon: '🌧️', category: 'natural', institution: 'TMA' },
  strong_wind: { name: 'Strong Winds', icon: '💨', category: 'natural', institution: 'TMA' },
  earthquake: { name: 'Earthquake', icon: '🌍', category: 'natural', institution: 'GST' },
  landslide: { name: 'Landslide', icon: '⛰️', category: 'natural', institution: 'GST' },
  disease_outbreak: { name: 'Disease Outbreak', icon: '🦠', category: 'health', institution: 'MOH' },
  dam_overflow: { name: 'Dam Overflow', icon: '🚧', category: 'infrastructure', institution: 'MOW' },
  pest_outbreak: { name: 'Pest Outbreak', icon: '🦗', category: 'agriculture', institution: 'MOA' }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if using backend API or localStorage fallback
 */
function isUsingBackend() {
  return true; // Always try backend first, fallback handled in API client
}

/**
 * Check if using Supabase
 */
function isUsingSupabase() {
  return isSupabaseConfigured && supabase !== null;
}

/**
 * Get data from localStorage
 */
function getLocalData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

/**
 * Save data to localStorage
 */
function saveLocalData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
}

/**
 * Calculate warning score from hazard and risk context
 * Formula: WarningScore = sqrt(HazardIntensity * RiskSensitivity)
 * where RiskSensitivity = sqrt(Vulnerability * LackOfCopingCapacity)
 */
export function calculateWarningScore(hazardIntensity, vulnerability, copingCapacity) {
  const lackOfCoping = 10 - copingCapacity;
  const riskSensitivity = Math.sqrt(vulnerability * lackOfCoping);
  const warningScore = Math.sqrt(hazardIntensity * riskSensitivity);
  return Math.min(10, Math.max(0, warningScore));
}

/**
 * Classify warning level based on score
 */
export function classifyWarningLevel(score) {
  if (score < WARNING_THRESHOLDS.MONITOR) {
    return { level: 'monitor', label: 'Monitor', color: WARNING_COLORS.monitor };
  } else if (score < WARNING_THRESHOLDS.ADVISORY) {
    return { level: 'advisory', label: 'Advisory', color: WARNING_COLORS.advisory };
  } else if (score < WARNING_THRESHOLDS.WARNING) {
    return { level: 'warning', label: 'Warning', color: WARNING_COLORS.warning };
  } else if (score < WARNING_THRESHOLDS.MAJOR_WARNING) {
    return { level: 'major_warning', label: 'Major Warning', color: WARNING_COLORS.major_warning };
  } else {
    return { level: 'emergency', label: 'Emergency', color: WARNING_COLORS.emergency };
  }
}

/**
 * Determine response level based on warning level
 */
export function determineResponseLevel(warningLevel) {
  switch (warningLevel) {
    case 'monitor':
      return { level: 'none', description: 'Routine monitoring' };
    case 'advisory':
      return { level: 'preparedness', description: 'Increase monitoring, inform stakeholders' };
    case 'warning':
      return { level: 'partial', description: 'Activate response protocols, pre-position resources' };
    case 'major_warning':
    case 'emergency':
      return { level: 'full', description: 'Full response activation, evacuations if needed' };
    default:
      return { level: 'none', description: 'No action required' };
  }
}

/**
 * Generate recommended actions based on hazard type and warning level
 */
export function generateRecommendedActions(hazardType, warningLevel, districtRisk) {
  const actions = [];
  const hazard = HAZARD_TYPES[hazardType];

  // Base actions for all warnings
  if (warningLevel !== 'monitor') {
    actions.push('Monitor official communications from PMO-DMD');
    actions.push('Review emergency contact lists');
  }

  // Hazard-specific actions
  switch (hazardType) {
    case 'flood':
    case 'heavy_rain':
      if (warningLevel === 'advisory') {
        actions.push('Clear drainage channels');
        actions.push('Prepare emergency supplies');
      } else if (warningLevel === 'warning') {
        actions.push('Move valuables to higher ground');
        actions.push('Avoid low-lying areas');
        actions.push('Pre-position emergency response teams');
      } else if (warningLevel === 'major_warning' || warningLevel === 'emergency') {
        actions.push('EVACUATE flood-prone areas immediately');
        actions.push('Activate emergency shelters');
        actions.push('Deploy search and rescue teams');
      }
      break;

    case 'drought':
      if (warningLevel === 'advisory') {
        actions.push('Review water conservation measures');
        actions.push('Check livestock water supplies');
      } else if (warningLevel === 'warning') {
        actions.push('Implement water rationing');
        actions.push('Prepare food assistance distribution');
      } else if (warningLevel === 'major_warning' || warningLevel === 'emergency') {
        actions.push('Activate emergency food distribution');
        actions.push('Deploy mobile health clinics');
        actions.push('Assess livestock emergency feeding needs');
      }
      break;

    case 'disease_outbreak':
      if (warningLevel === 'advisory') {
        actions.push('Increase disease surveillance');
        actions.push('Review isolation protocols');
      } else if (warningLevel === 'warning') {
        actions.push('Activate disease response teams');
        actions.push('Pre-position medical supplies');
      } else if (warningLevel === 'major_warning' || warningLevel === 'emergency') {
        actions.push('Implement quarantine measures');
        actions.push('Deploy emergency medical teams');
        actions.push('Activate all health facilities');
      }
      break;

    case 'earthquake':
      actions.push('Review building evacuation routes');
      if (warningLevel === 'warning' || warningLevel === 'major_warning') {
        actions.push('Pre-position search and rescue equipment');
        actions.push('Alert emergency medical services');
      }
      break;

    default:
      actions.push('Follow local authority guidance');
  }

  return actions;
}

// ============================================================================
// HAZARD FORECAST OPERATIONS
// ============================================================================

/**
 * Create a new hazard forecast
 */
export async function createHazardForecast(forecastData) {
  try {
    // Try backend API first
    const response = await apiClient.post('/hazard-forecasts', {
      hazard_type: forecastData.hazardType,
      institution: forecastData.institution,
      institution_name: INSTITUTIONS[forecastData.institution]?.name || forecastData.institution,
      intensity_level: forecastData.intensityLevel,
      intensity_value: forecastData.intensityValue,
      intensity_unit: forecastData.intensityUnit,
      confidence: forecastData.confidence || 'medium',
      spatial_extent: JSON.stringify(forecastData.spatialExtent),
      valid_from: forecastData.validFrom,
      valid_to: forecastData.validTo,
      forecast_day: forecastData.forecastDay,
      description: forecastData.description,
      data_source: forecastData.dataSource
    });

    console.log('✅ Hazard forecast created via API');
    return response.data;
  } catch (error) {
    console.warn('⚠️ Backend API unavailable, using localStorage fallback');

    // Fallback to localStorage
    const forecasts = getLocalData(LOCAL_STORAGE_KEYS.HAZARD_FORECASTS);
    const newForecast = {
      id: Date.now(),
      ...forecastData,
      institution_name: INSTITUTIONS[forecastData.institution]?.name || forecastData.institution,
      status: 'submitted',
      created_at: new Date().toISOString()
    };

    forecasts.push(newForecast);
    saveLocalData(LOCAL_STORAGE_KEYS.HAZARD_FORECASTS, forecasts);

    return newForecast;
  }
}

/**
 * Get hazard forecasts with filters
 */
export async function getHazardForecasts(filters = {}) {
  try {
    const response = await apiClient.get('/hazard-forecasts', filters);
    return response.data || [];
  } catch (error) {
    console.warn('⚠️ Using localStorage fallback for hazard forecasts');

    let forecasts = getLocalData(LOCAL_STORAGE_KEYS.HAZARD_FORECASTS);

    // Apply filters
    if (filters.institution) {
      forecasts = forecasts.filter(f => f.institution === filters.institution);
    }
    if (filters.hazard_type) {
      forecasts = forecasts.filter(f => f.hazardType === filters.hazard_type);
    }
    if (filters.forecast_day) {
      forecasts = forecasts.filter(f => f.forecastDay === parseInt(filters.forecast_day));
    }

    return forecasts;
  }
}

// ============================================================================
// WARNING OPERATIONS
// ============================================================================

/**
 * Create a risk-informed warning from hazard forecast and risk context
 */
export async function createWarning(hazardForecastId, districtRisk, hazardIntensity) {
  // Calculate warning components
  const warningScore = calculateWarningScore(
    hazardIntensity,
    districtRisk.vulnerability || districtRisk.scores?.vulnerability || 5,
    districtRisk.copingCapacity || districtRisk.scores?.copingCapacity || 5
  );

  const warningClassification = classifyWarningLevel(warningScore);
  const responseLevel = determineResponseLevel(warningClassification.level);
  const recommendedActions = generateRecommendedActions(
    districtRisk.hazardType,
    warningClassification.level,
    districtRisk
  );

  const warningData = {
    hazard_forecast_id: hazardForecastId,
    adm1_code: districtRisk.adm1Code,
    adm1_name: districtRisk.adm1Name,
    adm2_code: districtRisk.adm2Code,
    adm2_name: districtRisk.adm2Name,
    hazard_intensity: hazardIntensity,
    vulnerability_score: districtRisk.vulnerability || districtRisk.scores?.vulnerability || 5,
    coping_capacity_score: districtRisk.copingCapacity || districtRisk.scores?.copingCapacity || 5,
    baseline_risk_score: districtRisk.riskScore || districtRisk.scores?.risk || 5,
    baseline_risk_class: districtRisk.riskClass || 'Medium',
    population_affected: districtRisk.population || 0,
    vulnerable_population: districtRisk.vulnerablePopulation || 0,
    infrastructure_at_risk: JSON.stringify(districtRisk.infrastructure || {}),
    recommended_actions: JSON.stringify(recommendedActions),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  };

  try {
    const response = await apiClient.post('/warnings', warningData);
    console.log('✅ Warning created via API');
    return {
      ...response.data,
      warningScore,
      warningLevel: warningClassification.level,
      warningLabel: warningClassification.label,
      warningColor: warningClassification.color,
      responseLevel: responseLevel.level,
      responseDescription: responseLevel.description,
      recommendedActions
    };
  } catch (error) {
    console.warn('⚠️ Backend API unavailable, using localStorage fallback');

    // Fallback to localStorage
    const warnings = getLocalData(LOCAL_STORAGE_KEYS.WARNINGS);
    const newWarning = {
      id: Date.now(),
      warning_id: `TZA-${new Date().toISOString().split('T')[0]}-${Date.now() % 10000}`,
      ...warningData,
      warning_score: warningScore,
      warning_level: warningClassification.level,
      warning_color: warningClassification.color,
      response_level: responseLevel.level,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    warnings.push(newWarning);
    saveLocalData(LOCAL_STORAGE_KEYS.WARNINGS, warnings);

    return {
      ...newWarning,
      warningScore,
      warningLevel: warningClassification.level,
      warningLabel: warningClassification.label,
      warningColor: warningClassification.color,
      responseLevel: responseLevel.level,
      responseDescription: responseLevel.description,
      recommendedActions
    };
  }
}

/**
 * Get warnings with filters
 */
export async function getWarnings(filters = {}) {
  try {
    const response = await apiClient.get('/warnings', filters);
    return response.data || [];
  } catch (error) {
    console.warn('⚠️ Using localStorage fallback for warnings');

    let warnings = getLocalData(LOCAL_STORAGE_KEYS.WARNINGS);

    // Apply filters
    if (filters.adm1_code) {
      warnings = warnings.filter(w => w.adm1_code === filters.adm1_code);
    }
    if (filters.warning_level) {
      warnings = warnings.filter(w => w.warning_level === filters.warning_level);
    }
    if (filters.status) {
      warnings = warnings.filter(w => w.status === filters.status);
    }

    return warnings;
  }
}

/**
 * Get active warnings (non-expired)
 */
export async function getActiveWarnings() {
  try {
    const response = await apiClient.get('/warnings/active');
    return response.data || [];
  } catch (error) {
    console.warn('⚠️ Using localStorage fallback for active warnings');

    const warnings = getLocalData(LOCAL_STORAGE_KEYS.WARNINGS);
    const now = new Date();

    return warnings.filter(w =>
      ['pending', 'validated', 'disseminated'].includes(w.status) &&
      new Date(w.expires_at) > now
    );
  }
}

/**
 * Validate a warning (PMO action)
 */
export async function validateWarning(warningId, action, notes = '') {
  try {
    const response = await apiClient.put(`/warnings/${warningId}/validate`, {
      action,
      notes
    });
    console.log(`✅ Warning ${action}d via API`);
    return response;
  } catch (error) {
    console.warn('⚠️ Using localStorage fallback for warning validation');

    const warnings = getLocalData(LOCAL_STORAGE_KEYS.WARNINGS);
    const warningIndex = warnings.findIndex(w => w.id === warningId);

    if (warningIndex >= 0) {
      warnings[warningIndex].status = action === 'validate' ? 'validated' : 'rejected';
      warnings[warningIndex].validation_notes = notes;
      warnings[warningIndex].validated_at = new Date().toISOString();
      saveLocalData(LOCAL_STORAGE_KEYS.WARNINGS, warnings);
    }

    return { success: true, message: `Warning ${action}d` };
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Generate warnings for all affected districts from a hazard forecast
 */
export async function generateWarningsForHazard(hazardForecast, riskData, hazardIntensity) {
  const affectedRegions = JSON.parse(hazardForecast.spatial_extent || hazardForecast.spatialExtent || '[]');
  const warnings = [];

  for (const regionName of affectedRegions) {
    // Find matching districts in risk data
    let matchingDistricts = [];

    if (riskData?.subnational?.adm2) {
      matchingDistricts = riskData.subnational.adm2.filter(d =>
        d.admin?.adm1Name === regionName ||
        d.admin?.adm2Name === regionName ||
        d.adm1Name === regionName
      );
    }

    if (matchingDistricts.length === 0 && riskData?.subnational?.adm1) {
      matchingDistricts = riskData.subnational.adm1.filter(d =>
        d.admin?.adm1Name === regionName ||
        d.adm1Name === regionName
      );
    }

    for (const district of matchingDistricts) {
      try {
        const districtRisk = {
          adm1Code: district.admin?.adm1Code || district.adm1Code,
          adm1Name: district.admin?.adm1Name || district.adm1Name,
          adm2Code: district.admin?.adm2Code || district.adm2Code,
          adm2Name: district.admin?.adm2Name || district.adm2Name,
          vulnerability: district.scores?.vulnerability || district.vulnerability || 5,
          copingCapacity: district.scores?.copingCapacity || district.copingCapacity || 5,
          riskScore: district.scores?.risk || district.riskScore || 5,
          riskClass: district.classification?.label || district.riskClass || 'Medium',
          population: district.population || 0,
          hazardType: hazardForecast.hazard_type || hazardForecast.hazardType
        };

        const warning = await createWarning(hazardForecast.id, districtRisk, hazardIntensity);
        warnings.push(warning);
      } catch (error) {
        console.error(`Failed to create warning for ${regionName}:`, error);
      }
    }
  }

  return warnings;
}

// ============================================================================
// SUPABASE INTEGRATION (Real-time)
// ============================================================================

/**
 * Subscribe to real-time warning updates
 */
export function subscribeToWarnings(callback) {
  if (!isUsingSupabase()) {
    console.log('ℹ️ Supabase not configured, real-time updates unavailable');
    return null;
  }

  const subscription = supabase
    .channel('warnings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'warnings' }, (payload) => {
      console.log('🔔 Warning update received:', payload);
      callback(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Subscribe to hazard forecast updates
 */
export function subscribeToForecasts(callback) {
  if (!isUsingSupabase()) {
    console.log('ℹ️ Supabase not configured, real-time updates unavailable');
    return null;
  }

  const subscription = supabase
    .channel('hazard_forecasts')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hazard_forecasts' }, (payload) => {
      console.log('🔔 Hazard forecast update received:', payload);
      callback(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Constants
  WARNING_THRESHOLDS,
  WARNING_COLORS,
  INSTITUTIONS,
  HAZARD_TYPES,

  // Calculation functions
  calculateWarningScore,
  classifyWarningLevel,
  determineResponseLevel,
  generateRecommendedActions,

  // Hazard forecast operations
  createHazardForecast,
  getHazardForecasts,

  // Warning operations
  createWarning,
  getWarnings,
  getActiveWarnings,
  validateWarning,
  generateWarningsForHazard,

  // Real-time subscriptions
  subscribeToWarnings,
  subscribeToForecasts
};
