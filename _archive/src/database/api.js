/**
 * API INTEGRATIONS - External Data Sources Entry Point
 *
 * Integration with external APIs (USGS, NASA, ACLED, etc.).
 * This is the primary entry point for API integration operations.
 */

// ============================================================================
// API INTEGRATIONS
// ============================================================================

export {
  // Configuration
  API_CONFIG,

  // Error classes
  APIError,
  RateLimitError,
  CircuitOpenError,
  ValidationError,

  // Metrics
  getAPIMetrics,

  // State management
  resetAPIState,

  // Real-time updates
  subscribeToUpdates
} from './apiIntegrations.js';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import apiIntegrations from './apiIntegrations.js';

export default apiIntegrations;
