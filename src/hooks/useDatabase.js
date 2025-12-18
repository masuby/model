/**
 * INFORM TANZANIA DATABASE HOOKS
 *
 * React hooks for accessing the database from components.
 * Provides easy-to-use interfaces for all database operations.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  initAndSeedDatabase,
  isDatabaseReady,
  getDatabaseHealth,
  getDatabaseStats,
  AdminUnits,
  RiskIndicators,
  Warnings,
  Bulletins,
  Users,
  AuditLogs,
  SMSLogs,
  SeverityEvents,
  PopulationData,
  Infrastructure,
  ClimateProjections,
  read,
  readById,
  create,
  update,
  remove
} from '../database/index.js';

import {
  calculateRiskIndex,
  calculateWarningScore,
  calculateAllAggregates,
  classifyRisk,
  classifyWarning,
  roundTo
} from '../database/informFormulas.js';

// ============================================================================
// DATABASE INITIALIZATION HOOK
// ============================================================================

/**
 * Hook to initialize the database on app startup
 */
export function useInitDatabase(options = {}) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);

        // Check if already initialized
        if (isDatabaseReady()) {
          setIsReady(true);
          setStats(getDatabaseStats());
        } else {
          // Initialize and seed
          const result = initAndSeedDatabase(options);
          setIsReady(true);
          setStats(result);
        }
      } catch (err) {
        console.error('Database initialization failed:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  return { isReady, isLoading, error, stats };
}

// ============================================================================
// ADMINISTRATIVE UNITS HOOKS
// ============================================================================

/**
 * Hook to get all regions
 */
export function useRegions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRegions(AdminUnits.getRegions());
    setLoading(false);
  }, []);

  return { regions, loading };
}

/**
 * Hook to get all districts
 */
export function useDistricts(regionId = null) {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (regionId) {
      setDistricts(AdminUnits.getDistrictsByRegion(regionId));
    } else {
      setDistricts(AdminUnits.getDistricts());
    }
    setLoading(false);
  }, [regionId]);

  return { districts, loading };
}

/**
 * Hook to get a specific admin unit
 */
export function useAdminUnit(id) {
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setUnit(readById('administrative_units', id));
    }
    setLoading(false);
  }, [id]);

  return { unit, loading };
}

// ============================================================================
// RISK INDICATORS HOOKS
// ============================================================================

/**
 * Hook to get risk data for an admin unit
 */
export function useRiskData(adminUnitId, year = null) {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminUnitId) {
      const data = year
        ? RiskIndicators.getByAdminUnit(adminUnitId, year)
        : RiskIndicators.getLatest(adminUnitId);
      setRiskData(Array.isArray(data) ? data[0] : data);
    }
    setLoading(false);
  }, [adminUnitId, year]);

  return { riskData, loading };
}

/**
 * Hook to get all risk data for a year
 */
export function useAllRiskData(year = 2024) {
  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = RiskIndicators.getByYear(year);
    setRiskData(data);
    setLoading(false);
  }, [year]);

  return { riskData, loading };
}

/**
 * Hook to get high-risk areas
 */
export function useHighRiskAreas(threshold = 5.0) {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = RiskIndicators.getHighRiskAreas(threshold);
    setAreas(data);
    setLoading(false);
  }, [threshold]);

  return { areas, loading };
}

/**
 * Hook to calculate risk with INFORM formula
 */
export function useRiskCalculation() {
  const calculate = useCallback((hazardExposure, vulnerability, lackCopingCapacity) => {
    const riskIndex = calculateRiskIndex(hazardExposure, vulnerability, lackCopingCapacity);
    const riskClass = classifyRisk(riskIndex);
    return {
      riskIndex: roundTo(riskIndex, 2),
      riskClass: riskClass.label,
      color: riskClass.color
    };
  }, []);

  const calculateFromIndicators = useCallback((indicators) => {
    return calculateAllAggregates(indicators);
  }, []);

  return { calculate, calculateFromIndicators };
}

// ============================================================================
// WARNINGS HOOKS
// ============================================================================

/**
 * Hook to get active warnings
 */
export function useActiveWarnings() {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setWarnings(Warnings.getActive());
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, []);

  return { warnings, loading, refresh };
}

/**
 * Hook to manage warnings
 */
export function useWarnings() {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setWarnings(read('warnings', {}, { sort: ['created_at', 'desc'] }));
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, []);

  const createWarning = useCallback((warningData, riskProfile) => {
    const warning = Warnings.create(warningData, riskProfile);
    refresh();
    return warning;
  }, [refresh]);

  const approveWarning = useCallback((id, userId) => {
    const warning = Warnings.approve(id, userId);
    refresh();
    return warning;
  }, [refresh]);

  const publishWarning = useCallback((id) => {
    const warning = Warnings.publish(id);
    refresh();
    return warning;
  }, [refresh]);

  const cancelWarning = useCallback((id) => {
    const warning = Warnings.cancel(id);
    refresh();
    return warning;
  }, [refresh]);

  const getStatistics = useCallback(() => {
    return Warnings.getStatistics();
  }, []);

  return {
    warnings,
    loading,
    refresh,
    createWarning,
    approveWarning,
    publishWarning,
    cancelWarning,
    getStatistics
  };
}

/**
 * Hook to calculate warning score
 */
export function useWarningCalculation() {
  const calculate = useCallback((hazardIntensity, vulnerability, lackCopingCapacity) => {
    const warningScore = calculateWarningScore(hazardIntensity, vulnerability, lackCopingCapacity);
    const warningLevel = classifyWarning(warningScore);
    return {
      score: roundTo(warningScore, 2),
      level: warningLevel.label,
      color: warningLevel.color,
      icon: warningLevel.icon
    };
  }, []);

  return { calculate };
}

// ============================================================================
// BULLETINS HOOKS
// ============================================================================

/**
 * Hook to manage bulletins
 */
export function useBulletins() {
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setBulletins(Bulletins.getLatest(20));
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, []);

  const createBulletin = useCallback((bulletinData) => {
    const bulletin = Bulletins.create(bulletinData);
    refresh();
    return bulletin;
  }, [refresh]);

  const publishBulletin = useCallback((id) => {
    const bulletin = Bulletins.publish(id);
    refresh();
    return bulletin;
  }, [refresh]);

  return { bulletins, loading, refresh, createBulletin, publishBulletin };
}

// ============================================================================
// POPULATION AND INFRASTRUCTURE HOOKS
// ============================================================================

/**
 * Hook to get population data
 */
export function usePopulationData(adminUnitId) {
  const [population, setPopulation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminUnitId) {
      setPopulation(PopulationData.getLatest(adminUnitId));
    }
    setLoading(false);
  }, [adminUnitId]);

  return { population, loading };
}

/**
 * Hook to get infrastructure data
 */
export function useInfrastructure(adminUnitId) {
  const [infrastructure, setInfrastructure] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminUnitId) {
      setInfrastructure(Infrastructure.getByAdminUnit(adminUnitId));
    }
    setLoading(false);
  }, [adminUnitId]);

  return { infrastructure, loading };
}

// ============================================================================
// AUDIT AND SMS LOGS HOOKS
// ============================================================================

/**
 * Hook to get recent audit logs
 */
export function useAuditLogs(limit = 50) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLogs(AuditLogs.getRecent(limit));
  }, [limit]);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, []);

  const addLog = useCallback((eventType, eventData) => {
    AuditLogs.log(eventType, eventData);
    refresh();
  }, [refresh]);

  return { logs, loading, refresh, addLog };
}

/**
 * Hook to get SMS statistics
 */
export function useSMSStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setStats(SMSLogs.getStatistics());
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, []);

  return { stats, loading, refresh };
}

// ============================================================================
// DATABASE HEALTH HOOK
// ============================================================================

/**
 * Hook to get database health status
 */
export function useDatabaseHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHealth(getDatabaseHealth());
    setLoading(false);
  }, []);

  return { health, loading };
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  useInitDatabase,
  useRegions,
  useDistricts,
  useAdminUnit,
  useRiskData,
  useAllRiskData,
  useHighRiskAreas,
  useRiskCalculation,
  useActiveWarnings,
  useWarnings,
  useWarningCalculation,
  useBulletins,
  usePopulationData,
  useInfrastructure,
  useAuditLogs,
  useSMSStats,
  useDatabaseHealth
};
