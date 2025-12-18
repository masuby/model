/**
 * DATABASE CONTEXT
 *
 * Provides database access throughout the application.
 * Initializes the database on app startup and provides
 * access to all database services.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Import from focused database modules for cleaner separation
import { initAndSeedDatabase, isDatabaseReady, getDatabaseHealth } from '../database/init.js';
import {
  AdminUnits,
  RiskIndicators,
  Warnings,
  Bulletins,
  Users,
  AuditLogs,
  getDatabaseStats
} from '../database/services.js';
import {
  calculateRiskIndex,
  calculateWarningScore,
  calculateAllAggregates,
  classifyRisk,
  classifyWarning
} from '../database/formulas.js';

// Create context
const DatabaseContext = createContext(null);

/**
 * Database Provider Component
 */
export function DatabaseProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Initialize database on mount
  useEffect(() => {
    const initDb = async () => {
      try {
        setIsLoading(true);
        console.log('🗄️ Initializing INFORM Tanzania Database...');

        // Check if already initialized
        if (isDatabaseReady()) {
          console.log('✅ Database already initialized');
          setStats(getDatabaseStats());
          setIsReady(true);
        } else {
          // Initialize and seed
          console.log('📥 Seeding database with Tanzania data...');
          const result = await initAndSeedDatabase({ forceReseed: false });
          setStats(result);
          setIsReady(true);
          console.log('✅ Database ready:', result);
        }
      } catch (err) {
        console.error('❌ Database initialization failed:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initDb();
  }, []);

  // Database service methods
  const value = {
    // Status
    isReady,
    isLoading,
    error,
    stats,

    // Admin Units
    getRegions: AdminUnits.getRegions,
    getDistricts: AdminUnits.getDistricts,
    getDistrictsByRegion: AdminUnits.getDistrictsByRegion,
    getRegionByName: AdminUnits.getRegionByName,
    getDistrictByName: AdminUnits.getDistrictByName,

    // Risk Data
    getRiskData: RiskIndicators.getByAdminUnit,
    getLatestRisk: RiskIndicators.getLatest,
    getHighRiskAreas: RiskIndicators.getHighRiskAreas,
    getAllRiskData: RiskIndicators.getByYear,

    // Warnings
    getActiveWarnings: Warnings.getActive,
    getWarningsByStatus: Warnings.getByStatus,
    createWarning: Warnings.create,
    approveWarning: Warnings.approve,
    publishWarning: Warnings.publish,
    cancelWarning: Warnings.cancel,
    getWarningStats: Warnings.getStatistics,

    // Bulletins
    createBulletin: Bulletins.create,
    publishBulletin: Bulletins.publish,
    getLatestBulletins: Bulletins.getLatest,

    // Users
    getUserByEmail: Users.getByEmail,
    authenticateUser: Users.authenticate,

    // Audit
    logAudit: AuditLogs.log,
    getRecentLogs: AuditLogs.getRecent,

    // Formulas
    calculateRiskIndex,
    calculateWarningScore,
    calculateAllAggregates,
    classifyRisk,
    classifyWarning,

    // Health
    getDatabaseHealth,
    getDatabaseStats,

    // Refresh stats
    refreshStats: () => setStats(getDatabaseStats())
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

/**
 * Hook to use database context
 */
export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

/**
 * Hook to check if database is ready
 */
export function useDatabaseReady() {
  const { isReady, isLoading, error } = useDatabase();
  return { isReady, isLoading, error };
}

export default DatabaseContext;
