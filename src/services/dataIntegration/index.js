/**
 * DATA INTEGRATION MODULE
 *
 * Central module for all external data source integrations
 * Supports TCVMP (PMO-DMD), RCMRD, NBS, Google Earth Engine,
 * OpenStreetMap, World Bank, UNEP GAR, ESA WorldCover, and more
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

// Risk Data Connector (DRM Portal, UNEP GAR, UNDRR, METEOR)
export {
  default as RiskDataConnector,
  getRiskDataConnector,
  resetRiskDataConnector,
  RISK_DATA_SOURCES
} from './riskDataConnector';

// Exposure Data Connector (ESA WorldCover, SRTM, WorldPop, FAO, NBS)
export {
  default as ExposureDataConnector,
  getExposureDataConnector,
  resetExposureDataConnector,
  EXPOSURE_DATA_SOURCES,
  LAND_COVER_CLASSES
} from './exposureDataConnector';

// Infrastructure Connector (OpenStreetMap, World Bank, GCA)
export {
  default as InfrastructureConnector,
  getInfrastructureConnector,
  resetInfrastructureConnector,
  INFRASTRUCTURE_DATA_SOURCES
} from './infrastructureConnector';

// Climate Data Connector (UNDRR, World Bank Climate, Copernicus, TMA)
export {
  default as ClimateDataConnector,
  getClimateDataConnector,
  resetClimateDataConnector,
  CLIMATE_DATA_SOURCES,
  CLIMATE_SCENARIOS
} from './climateDataConnector';

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
      gee: { available: false },
      risk: { connected: false },
      exposure: { connected: false },
      infrastructure: { connected: false },
      climate: { connected: false }
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

    // Initialize Risk Data Connector (DRM Portal, UNEP GAR, UNDRR, METEOR)
    try {
      const { getRiskDataConnector } = await import('./riskDataConnector');
      this.connectors.risk = getRiskDataConnector();
      results.risk = await this.connectors.risk.connectAll();
      const anyRiskConnected = Object.values(results.risk).some(r => r.success);
      this.status.risk = { connected: anyRiskConnected, sources: results.risk };
    } catch (error) {
      console.warn('[DataIntegration] Risk data initialization failed:', error.message);
      results.risk = { success: false, error: error.message };
    }

    // Initialize Exposure Data Connector (ESA WorldCover, SRTM, WorldPop, FAO)
    try {
      const { getExposureDataConnector } = await import('./exposureDataConnector');
      this.connectors.exposure = getExposureDataConnector();
      results.exposure = await this.connectors.exposure.connectAll();
      const anyExposureConnected = Object.values(results.exposure).some(r => r.success);
      this.status.exposure = { connected: anyExposureConnected, sources: results.exposure };
    } catch (error) {
      console.warn('[DataIntegration] Exposure data initialization failed:', error.message);
      results.exposure = { success: false, error: error.message };
    }

    // Initialize Infrastructure Connector (OpenStreetMap, World Bank)
    try {
      const { getInfrastructureConnector } = await import('./infrastructureConnector');
      this.connectors.infrastructure = getInfrastructureConnector();
      results.infrastructure = await this.connectors.infrastructure.connectAll();
      const anyInfraConnected = results.infrastructure.osm || results.infrastructure.worldbank;
      this.status.infrastructure = { connected: anyInfraConnected, sources: results.infrastructure };
    } catch (error) {
      console.warn('[DataIntegration] Infrastructure initialization failed:', error.message);
      results.infrastructure = { success: false, error: error.message };
    }

    // Initialize Climate Data Connector
    try {
      const { getClimateDataConnector } = await import('./climateDataConnector');
      this.connectors.climate = getClimateDataConnector();
      results.climate = await this.connectors.climate.connectAll();
      const anyClimateConnected = Object.values(results.climate).some(v => v === true);
      this.status.climate = { connected: anyClimateConnected, sources: results.climate };
    } catch (error) {
      console.warn('[DataIntegration] Climate data initialization failed:', error.message);
      results.climate = { success: false, error: error.message };
    }

    this.initialized = true;

    // Count total available layers (including sample data)
    const allLayers = this.getAllAvailableLayers();
    const totalLayers = Object.values(allLayers).reduce((sum, arr) => sum + arr.length, 0);

    // Update status with layer counts
    this.status.totalLayers = totalLayers;
    this.status.sampleMode = !Object.values(this.status).some(s => s.connected || s.available);

    console.log('[DataIntegration] Initialization complete:', this.status);
    console.log(`[DataIntegration] Total layers available: ${totalLayers} (${this.status.sampleMode ? 'sample mode' : 'live mode'})`);

    return {
      success: true, // Always success - sample data available as fallback
      status: this.status,
      details: results,
      totalLayers,
      sampleMode: this.status.sampleMode
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
   * Returns sample data when live connections are not available
   */
  getAllAvailableLayers() {
    const layers = {
      hazard: [],
      exposure: [],
      vulnerability: [],
      coping: [],
      infrastructure: [],
      climate: []
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

    // Risk Data layers (DRM, UNEP GAR, METEOR, DesInventar)
    if (this.connectors.risk) {
      const riskLayers = this.connectors.risk.getAllLayers();
      riskLayers.forEach(layer => {
        if (layer.category === 'hazard') {
          layers.hazard.push({ ...layer, source: layer.sourceName });
        } else if (layer.category === 'impact') {
          layers.vulnerability.push({ ...layer, source: layer.sourceName });
        }
      });
    }

    // Exposure Data layers (ESA WorldCover, SRTM, WorldPop, FAO)
    if (this.connectors.exposure) {
      const exposureLayers = this.connectors.exposure.getAllLayers();
      exposureLayers.forEach(layer => {
        layers.exposure.push({ ...layer, source: layer.sourceName });
      });
    }

    // Infrastructure layers (OpenStreetMap, World Bank)
    if (this.connectors.infrastructure) {
      const infraLayers = this.connectors.infrastructure.getAllLayers();
      infraLayers.forEach(layer => {
        if (layer.category === 'critical_infrastructure') {
          layers.coping.push({ ...layer, source: layer.sourceName });
        } else {
          layers.infrastructure.push({ ...layer, source: layer.sourceName });
        }
      });
    }

    // Climate datasets
    if (this.connectors.climate) {
      const climateLayers = this.connectors.climate.getAllDatasets();
      climateLayers.forEach(dataset => {
        layers.climate.push({ ...dataset, source: dataset.sourceName });
      });
    }

    // If no layers from live connections, provide sample layers for UI display
    if (Object.values(layers).every(arr => arr.length === 0)) {
      return this.getSampleLayers();
    }

    return layers;
  }

  /**
   * Get sample layers for display when connections are not available
   */
  getSampleLayers() {
    return {
      hazard: [
        { id: 'flood_hazard', name: 'Flood Hazard Index', source: 'TCVMP (PMO-DMD)', category: 'hazard', status: 'offline' },
        { id: 'drought_hazard', name: 'Drought Hazard Index', source: 'TCVMP (PMO-DMD)', category: 'hazard', status: 'offline' },
        { id: 'landslide_susceptibility', name: 'Landslide Susceptibility', source: 'UNEP GAR', category: 'hazard', status: 'offline' },
        { id: 'river_flooding', name: 'River Flooding (100yr)', source: 'UNEP GAR', category: 'hazard', status: 'offline' },
        { id: 'earthquake_pga', name: 'Seismic Hazard (PGA)', source: 'METEOR', category: 'hazard', status: 'offline' },
        { id: 'historical_floods', name: 'Historical Flood Events', source: 'DRM Portal', category: 'hazard', status: 'offline' }
      ],
      exposure: [
        { id: 'population_density', name: 'Population Density 2020', source: 'WorldPop', category: 'exposure', status: 'offline' },
        { id: 'land_cover', name: 'Land Cover 2021', source: 'ESA WorldCover', category: 'exposure', status: 'offline' },
        { id: 'elevation', name: 'Elevation (SRTM 30m)', source: 'NASA SRTM', category: 'exposure', status: 'offline' },
        { id: 'crop_areas', name: 'Agricultural Areas', source: 'FAO', category: 'exposure', status: 'offline' },
        { id: 'livestock', name: 'Livestock Density', source: 'FAO GLW', category: 'exposure', status: 'offline' },
        { id: 'built_up', name: 'Built-up Areas', source: 'ESA WorldCover', category: 'exposure', status: 'offline' }
      ],
      vulnerability: [
        { id: 'poverty_rate', name: 'Poverty Rate', source: 'NBS Tanzania', category: 'vulnerability', status: 'offline' },
        { id: 'food_insecurity', name: 'Food Insecurity Index', source: 'WFP', category: 'vulnerability', status: 'offline' },
        { id: 'malnutrition', name: 'Malnutrition Rate', source: 'UNICEF', category: 'vulnerability', status: 'offline' },
        { id: 'disaster_mortality', name: 'Historical Disaster Mortality', source: 'DesInventar', category: 'vulnerability', status: 'offline' }
      ],
      coping: [
        { id: 'health_facilities', name: 'Health Facilities', source: 'OpenStreetMap', category: 'coping', status: 'offline' },
        { id: 'schools', name: 'Educational Facilities', source: 'OpenStreetMap', category: 'coping', status: 'offline' },
        { id: 'emergency_services', name: 'Emergency Services', source: 'OpenStreetMap', category: 'coping', status: 'offline' },
        { id: 'governance', name: 'Governance Index', source: 'World Bank', category: 'coping', status: 'offline' }
      ],
      infrastructure: [
        { id: 'roads', name: 'Road Network', source: 'OpenStreetMap', category: 'infrastructure', status: 'offline' },
        { id: 'railways', name: 'Railway Lines', source: 'OpenStreetMap', category: 'infrastructure', status: 'offline' },
        { id: 'airports', name: 'Airports', source: 'OpenStreetMap', category: 'infrastructure', status: 'offline' },
        { id: 'ports', name: 'Ports & Harbors', source: 'OpenStreetMap', category: 'infrastructure', status: 'offline' },
        { id: 'power_grid', name: 'Power Infrastructure', source: 'OpenStreetMap', category: 'infrastructure', status: 'offline' },
        { id: 'water_supply', name: 'Water Supply Points', source: 'OpenStreetMap', category: 'infrastructure', status: 'offline' }
      ],
      climate: [
        { id: 'temp_change', name: 'Temperature Change (SSP2-4.5)', source: 'CMIP6', category: 'climate', status: 'offline' },
        { id: 'precip_change', name: 'Precipitation Change', source: 'CMIP6', category: 'climate', status: 'offline' },
        { id: 'sea_level_rise', name: 'Sea Level Rise Projection', source: 'IPCC', category: 'climate', status: 'offline' },
        { id: 'extreme_heat', name: 'Extreme Heat Days', source: 'Copernicus', category: 'climate', status: 'offline' },
        { id: 'drought_projection', name: 'Drought Frequency', source: 'World Bank Climate', category: 'climate', status: 'offline' }
      ]
    };
  }

  /**
   * Get OpenStreetMap infrastructure data
   */
  async getOSMInfrastructure(layerId, regionName) {
    if (!this.connectors.infrastructure) {
      throw new Error('Infrastructure connector not initialized');
    }
    return this.connectors.infrastructure.getInfrastructure(layerId, regionName);
  }

  /**
   * Get critical infrastructure for a region
   */
  async getCriticalInfrastructure(regionName) {
    if (!this.connectors.infrastructure) {
      throw new Error('Infrastructure connector not initialized');
    }
    return this.connectors.infrastructure.getCriticalInfrastructure(regionName);
  }

  /**
   * Get climate projections
   */
  async getClimateProjections(variable, scenario, period) {
    if (!this.connectors.climate) {
      throw new Error('Climate connector not initialized');
    }
    return this.connectors.climate.getClimateProjections(variable, scenario, period);
  }

  /**
   * Get regional hazard data
   */
  async getRegionalHazardData(regionName, hazardTypes) {
    if (!this.connectors.risk) {
      throw new Error('Risk connector not initialized');
    }
    return this.connectors.risk.getRegionalHazardData(regionName, hazardTypes);
  }

  /**
   * Get population and land cover exposure data
   */
  async getExposureData(regionName) {
    if (!this.connectors.exposure) {
      throw new Error('Exposure connector not initialized');
    }
    const [population, landCover, livestock] = await Promise.all([
      this.connectors.exposure.getPopulationData(regionName),
      this.connectors.exposure.getLandCoverData(regionName),
      this.connectors.exposure.getLivestockData(regionName)
    ]);
    return { population, landCover, livestock };
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
