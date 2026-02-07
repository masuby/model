/**
 * DATA INTEGRATION MODULE
 *
 * Central module for all external data source integrations
 * Supports TCVMP (PMO-DMD), RCMRD, NBS, and Google Earth Engine
 */

// Data Source Registry
export {
  DATA_SOURCES,
  LAYER_CATEGORIES,
  INFORM_LAYER_MAPPING,
  getLayersByCategory,
  getActiveDataSources,
  getDataSource,
  getWMSWFSSources
} from './dataSourceRegistry';

// WMS/WFS Client
export {
  default as WMSWFSClient,
  createClient,
  createClientFromUrl
} from './wmsWfsClient';

// TCVMP Connector (PMO-DMD)
export {
  default as TCVMPConnector,
  getTCVMPConnector,
  resetTCVMPConnector,
  LAYER_MAPPINGS as TCVMP_LAYERS,
  TCVMP_CONFIG
} from './tcvmpConnector';

// RCMRD Connector
export {
  default as RCMRDConnector,
  getRCMRDConnector,
  resetRCMRDConnector,
  GEOPORTAL_LAYERS as RCMRD_LAYERS,
  OPENDATA_DATASETS as RCMRD_DATASETS,
  RCMRD_CONFIG
} from './rcmrdConnector';

// Google Earth Engine Integration
export {
  default as GEEClient,
  getGEEClient,
  resetGEEClient,
  GEE_CONFIG,
  GEE_DATASETS,
  GEE_RECIPES,
  getINFORMMapping,
  getRecipe,
  listRecipes
} from './geeIntegration';

// ============================================================================
// UNIFIED DATA SERVICE
// ============================================================================

class DataIntegrationService {
  constructor() {
    this.connectors = {};
    this.initialized = false;
    this.status = {
      tcvmp: { connected: false },
      rcmrd: { connected: false },
      gee: { available: false }
    };
  }

  /**
   * Initialize all data connectors
   */
  async initialize() {
    console.log('[DataIntegration] Initializing all connectors...');

    const results = {};

    // Initialize TCVMP
    try {
      const { getTCVMPConnector } = await import('./tcvmpConnector');
      this.connectors.tcvmp = getTCVMPConnector();
      results.tcvmp = await this.connectors.tcvmp.connect();
      this.status.tcvmp = { connected: results.tcvmp.success, ...results.tcvmp };
    } catch (error) {
      console.warn('[DataIntegration] TCVMP initialization failed:', error.message);
      results.tcvmp = { success: false, error: error.message };
    }

    // Initialize RCMRD
    try {
      const { getRCMRDConnector } = await import('./rcmrdConnector');
      this.connectors.rcmrd = getRCMRDConnector();
      results.rcmrd = await this.connectors.rcmrd.connect();
      this.status.rcmrd = { connected: results.rcmrd.success, ...results.rcmrd };
    } catch (error) {
      console.warn('[DataIntegration] RCMRD initialization failed:', error.message);
      results.rcmrd = { success: false, error: error.message };
    }

    // Check GEE backend
    try {
      const { getGEEClient } = await import('./geeIntegration');
      this.connectors.gee = getGEEClient();
      results.gee = await this.connectors.gee.checkBackend();
      this.status.gee = { available: results.gee.available, ...results.gee };
    } catch (error) {
      console.warn('[DataIntegration] GEE check failed:', error.message);
      results.gee = { available: false, error: error.message };
    }

    this.initialized = true;
    console.log('[DataIntegration] Initialization complete:', this.status);

    return {
      success: Object.values(this.status).some(s => s.connected || s.available),
      status: this.status,
      details: results
    };
  }

  /**
   * Get connector by name
   */
  getConnector(name) {
    return this.connectors[name] || null;
  }

  /**
   * Get all available layers across all sources
   */
  getAllAvailableLayers() {
    const layers = {
      hazard: [],
      exposure: [],
      vulnerability: [],
      coping: []
    };

    // TCVMP layers
    if (this.connectors.tcvmp?.isConnected()) {
      layers.hazard.push(...this.connectors.tcvmp.getHazardLayers().map(l => ({
        ...l, source: 'TCVMP'
      })));
      layers.exposure.push(...this.connectors.tcvmp.getExposureLayers().map(l => ({
        ...l, source: 'TCVMP'
      })));
      layers.vulnerability.push(...this.connectors.tcvmp.getVulnerabilityLayers().map(l => ({
        ...l, source: 'TCVMP'
      })));
    }

    // RCMRD layers
    if (this.connectors.rcmrd?.connected) {
      layers.vulnerability.push(...this.connectors.rcmrd.getVulnerabilityLayers().map(l => ({
        ...l, source: 'RCMRD'
      })));
      layers.coping.push(...this.connectors.rcmrd.getCopingCapacityLayers().map(l => ({
        ...l, source: 'RCMRD'
      })));
    }

    // GEE datasets
    if (this.connectors.gee) {
      const geeDatasets = this.connectors.gee.getAvailableDatasets();
      geeDatasets.forEach(dataset => {
        if (layers[dataset.category]) {
          layers[dataset.category].push({
            ...dataset,
            source: 'GEE'
          });
        }
      });
    }

    return layers;
  }

  /**
   * Get WMS URL for a layer
   */
  getWMSUrl(source, layerId, bbox, options = {}) {
    const connector = this.connectors[source.toLowerCase()];
    if (!connector) {
      throw new Error(`Unknown source: ${source}`);
    }

    if (source === 'TCVMP' && connector.getWMSLayerUrl) {
      return connector.getWMSLayerUrl(layerId, bbox, options);
    }
    if (source === 'RCMRD' && connector.getWMSLayerUrl) {
      return connector.getWMSLayerUrl(layerId, bbox, options);
    }

    throw new Error(`WMS not supported for source: ${source}`);
  }

  /**
   * Get features from a layer
   */
  async getFeatures(source, layerId, options = {}) {
    const connector = this.connectors[source.toLowerCase()];
    if (!connector) {
      throw new Error(`Unknown source: ${source}`);
    }

    if (connector.getFeatures) {
      return connector.getFeatures(layerId, options);
    }

    throw new Error(`Feature retrieval not supported for source: ${source}`);
  }

  /**
   * Get INFORM scores from all sources
   */
  async getINFORMScores(options = {}) {
    const scores = {
      hazard: {},
      vulnerability: {},
      copingCapacity: {}
    };

    // Get hazard scores from TCVMP
    if (this.connectors.tcvmp?.isConnected()) {
      try {
        const hazardScores = await this.connectors.tcvmp.getINFORMHazardScores(options);
        scores.hazard = { ...scores.hazard, ...hazardScores };
      } catch (error) {
        console.warn('[DataIntegration] Failed to get TCVMP hazard scores:', error.message);
      }
    }

    // Get vulnerability scores from RCMRD
    if (this.connectors.rcmrd?.connected) {
      try {
        const vulnScores = await this.connectors.rcmrd.getINFORMVulnerabilityScores(options);
        scores.vulnerability = vulnScores.sensitivity || {};
        scores.copingCapacity = this.connectors.rcmrd.calculateLackOfCopingCapacity(
          vulnScores.adaptive_capacity || {}
        );
      } catch (error) {
        console.warn('[DataIntegration] Failed to get RCMRD vulnerability scores:', error.message);
      }
    }

    return scores;
  }

  /**
   * Get status of all connections
   */
  getStatus() {
    return {
      initialized: this.initialized,
      ...this.status
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let dataIntegrationInstance = null;

/**
 * Get DataIntegration service instance
 */
export function getDataIntegrationService() {
  if (!dataIntegrationInstance) {
    dataIntegrationInstance = new DataIntegrationService();
  }
  return dataIntegrationInstance;
}

/**
 * Reset DataIntegration service
 */
export function resetDataIntegrationService() {
  dataIntegrationInstance = null;
}

export default DataIntegrationService;
