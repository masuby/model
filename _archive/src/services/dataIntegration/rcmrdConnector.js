/**
 * RCMRD CONNECTOR
 *
 * Connector for Regional Centre for Mapping of Resources for Development
 * Provides sensitivity, adaptive capacity, and vulnerability indices
 */

import WMSWFSClient from './wmsWfsClient';

// ============================================================================
// RCMRD CONFIGURATION
// ============================================================================

const RCMRD_CONFIG = {
  // GeoPortal (GeoNode-based)
  geoportal: {
    baseUrl: 'https://geoportal.rcmrd.org',
    wmsEndpoint: 'https://geoportal.rcmrd.org/geoserver/ows',
    wfsEndpoint: 'https://geoportal.rcmrd.org/geoserver/ows',
    restEndpoint: 'https://geoportal.rcmrd.org/api/v2/datasets/'
  },
  // OpenData (ArcGIS-based)
  opendata: {
    baseUrl: 'https://opendata.rcmrd.org',
    restEndpoint: 'https://opendata.rcmrd.org/datasets/'
  },
  timeout: 45000,
  retries: 3
};

// Layer mappings for RCMRD GeoPortal
const GEOPORTAL_LAYERS = {
  // Vulnerability indices
  sensitivity_index: {
    wmsLayer: 'geonode:tz_sensitivity',
    wfsTypename: 'geonode:tz_sensitivity',
    title: 'Sensitivity Index',
    category: 'vulnerability',
    description: 'Composite sensitivity indicator',
    unit: 'index',
    scale: [0, 1]
  },
  adaptive_capacity: {
    wmsLayer: 'geonode:tz_adaptive_capacity',
    wfsTypename: 'geonode:tz_adaptive_capacity',
    title: 'Adaptive Capacity Index',
    category: 'coping',
    description: 'Ability to adapt to climate change',
    unit: 'index',
    scale: [0, 1]
  },
  climate_vulnerability: {
    wmsLayer: 'geonode:tz_climate_vulnerability',
    wfsTypename: 'geonode:tz_climate_vulnerability',
    title: 'Climate Vulnerability Index',
    category: 'vulnerability',
    description: 'Overall climate vulnerability',
    unit: 'index',
    scale: [0, 1]
  },
  exposure_index: {
    wmsLayer: 'geonode:tz_exposure',
    wfsTypename: 'geonode:tz_exposure',
    title: 'Exposure Index',
    category: 'exposure',
    description: 'Population and asset exposure',
    unit: 'index',
    scale: [0, 1]
  },

  // Climate data
  precipitation_anomaly: {
    wmsLayer: 'geonode:tz_precip_anomaly',
    wfsTypename: 'geonode:tz_precip_anomaly',
    title: 'Precipitation Anomaly',
    category: 'climate',
    description: 'Deviation from normal precipitation',
    unit: 'mm',
    scale: [-500, 500]
  },
  temperature_anomaly: {
    wmsLayer: 'geonode:tz_temp_anomaly',
    wfsTypename: 'geonode:tz_temp_anomaly',
    title: 'Temperature Anomaly',
    category: 'climate',
    description: 'Deviation from normal temperature',
    unit: 'celsius',
    scale: [-5, 5]
  },

  // NDVI/Vegetation
  ndvi: {
    wmsLayer: 'geonode:tz_ndvi',
    wfsTypename: 'geonode:tz_ndvi',
    title: 'Normalized Difference Vegetation Index',
    category: 'environment',
    description: 'Vegetation health indicator',
    unit: 'index',
    scale: [-1, 1]
  },

  // Land cover
  landcover: {
    wmsLayer: 'geonode:tz_landcover',
    wfsTypename: 'geonode:tz_landcover',
    title: 'Land Cover',
    category: 'environment',
    description: 'Land use classification',
    unit: 'class',
    scale: [1, 20]
  }
};

// OpenData dataset IDs
const OPENDATA_DATASETS = {
  vulnerability_index: {
    id: 'd49aa80b236541c0b0ab9c792bd1ae3b',
    name: 'Tanzania Vulnerability Index',
    format: 'GeoJSON'
  },
  food_security: {
    id: 'food_security_tz_2024',
    name: 'Food Security Classification',
    format: 'GeoJSON'
  },
  livelihood_zones: {
    id: 'livelihood_zones_tz',
    name: 'Livelihood Zones',
    format: 'GeoJSON'
  }
};

// ============================================================================
// RCMRD CONNECTOR CLASS
// ============================================================================

class RCMRDConnector {
  constructor(options = {}) {
    this.config = { ...RCMRD_CONFIG, ...options };

    // GeoPortal client
    this.geoportalClient = new WMSWFSClient(this.config.geoportal.wmsEndpoint, {
      timeout: this.config.timeout,
      retries: this.config.retries
    });

    this.connected = false;
    this.capabilities = null;
    this.availableLayers = [];
    this.restDatasets = [];
  }

  // ==========================================================================
  // CONNECTION METHODS
  // ==========================================================================

  /**
   * Initialize connection to RCMRD services
   */
  async connect() {
    try {
      console.log('[RCMRD] Connecting to RCMRD GeoPortal...');

      const results = {
        geoportal: { success: false },
        opendata: { success: false }
      };

      // Connect to GeoPortal (WMS/WFS)
      try {
        const testResult = await this.geoportalClient.testConnection();
        if (testResult.success) {
          this.capabilities = await this.geoportalClient.getWMSCapabilities();
          this.availableLayers = this.mapAvailableLayers(this.capabilities.layers);
          results.geoportal = {
            success: true,
            layerCount: this.availableLayers.length
          };
        }
      } catch (err) {
        console.warn('[RCMRD] GeoPortal WMS connection failed:', err.message);
      }

      // Get REST API datasets
      try {
        this.restDatasets = await this.fetchRESTDatasets();
        results.opendata = {
          success: true,
          datasetCount: this.restDatasets.length
        };
      } catch (err) {
        console.warn('[RCMRD] REST API fetch failed:', err.message);
      }

      this.connected = results.geoportal.success || results.opendata.success;

      console.log(`[RCMRD] Connection status:`, results);

      return {
        success: this.connected,
        ...results
      };

    } catch (error) {
      console.error('[RCMRD] Connection failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Map available layers from capabilities
   */
  mapAvailableLayers(layers) {
    return layers.map(layer => {
      const mapping = this.findLayerMapping(layer.name);
      return {
        ...layer,
        mapping
      };
    }).filter(l => l.mapping);
  }

  /**
   * Find layer mapping
   */
  findLayerMapping(layerName) {
    for (const [key, mapping] of Object.entries(GEOPORTAL_LAYERS)) {
      if (mapping.wmsLayer === layerName ||
          mapping.wfsTypename === layerName ||
          layerName.includes(key)) {
        return { id: key, ...mapping };
      }
    }
    return null;
  }

  /**
   * Fetch REST API datasets list
   */
  async fetchRESTDatasets() {
    try {
      const response = await fetch(this.config.geoportal.restEndpoint, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.datasets || data.results || [];

    } catch (error) {
      console.warn('[RCMRD] Failed to fetch REST datasets:', error.message);
      return [];
    }
  }

  // ==========================================================================
  // LAYER METHODS
  // ==========================================================================

  /**
   * Get vulnerability layers
   */
  getVulnerabilityLayers() {
    return Object.entries(GEOPORTAL_LAYERS)
      .filter(([_, layer]) => layer.category === 'vulnerability')
      .map(([id, layer]) => ({ id, ...layer }));
  }

  /**
   * Get coping capacity layers
   */
  getCopingCapacityLayers() {
    return Object.entries(GEOPORTAL_LAYERS)
      .filter(([_, layer]) => layer.category === 'coping')
      .map(([id, layer]) => ({ id, ...layer }));
  }

  /**
   * Get all layers by category
   */
  getLayersByCategory(category) {
    return Object.entries(GEOPORTAL_LAYERS)
      .filter(([_, layer]) => layer.category === category)
      .map(([id, layer]) => ({ id, ...layer }));
  }

  /**
   * Get all available layers
   */
  getAllLayers() {
    return Object.entries(GEOPORTAL_LAYERS)
      .map(([id, layer]) => ({ id, ...layer }));
  }

  // ==========================================================================
  // DATA RETRIEVAL METHODS
  // ==========================================================================

  /**
   * Get WMS layer URL for map display
   */
  getWMSLayerUrl(layerId, bbox, options = {}) {
    const layer = GEOPORTAL_LAYERS[layerId];
    if (!layer) {
      throw new Error(`Unknown layer: ${layerId}`);
    }

    return this.geoportalClient.getMapUrl(layer.wmsLayer, bbox, {
      format: options.format || 'image/png',
      transparent: true,
      width: options.width || 512,
      height: options.height || 512,
      ...options
    });
  }

  /**
   * Get layer legend URL
   */
  getLegendUrl(layerId, options = {}) {
    const layer = GEOPORTAL_LAYERS[layerId];
    if (!layer) {
      throw new Error(`Unknown layer: ${layerId}`);
    }

    return this.geoportalClient.getLegendUrl(layer.wmsLayer, options);
  }

  /**
   * Get features as GeoJSON
   */
  async getFeatures(layerId, options = {}) {
    const layer = GEOPORTAL_LAYERS[layerId];
    if (!layer) {
      throw new Error(`Unknown layer: ${layerId}`);
    }

    return this.geoportalClient.getFeatures(layer.wfsTypename, {
      bbox: options.bbox,
      maxFeatures: options.maxFeatures || 500,
      filter: options.filter,
      ...options
    });
  }

  /**
   * Get sensitivity data for a region
   */
  async getSensitivityData(regionName) {
    try {
      const features = await this.getFeatures('sensitivity_index', {
        filter: `region_name='${regionName}'`,
        maxFeatures: 50
      });

      return {
        layer: 'sensitivity_index',
        region: regionName,
        features: features?.features || [],
        statistics: this.calculateStatistics(features?.features || [], 'sensitivity')
      };

    } catch (error) {
      console.error('[RCMRD] Failed to get sensitivity data:', error);
      throw error;
    }
  }

  /**
   * Get adaptive capacity data
   */
  async getAdaptiveCapacityData(regionName) {
    try {
      const features = await this.getFeatures('adaptive_capacity', {
        filter: `region_name='${regionName}'`,
        maxFeatures: 50
      });

      return {
        layer: 'adaptive_capacity',
        region: regionName,
        features: features?.features || [],
        statistics: this.calculateStatistics(features?.features || [], 'adaptive_cap')
      };

    } catch (error) {
      console.error('[RCMRD] Failed to get adaptive capacity data:', error);
      throw error;
    }
  }

  /**
   * Calculate statistics
   */
  calculateStatistics(features, valueField) {
    const values = features
      .map(f => parseFloat(f.properties?.[valueField] || f.properties?.value))
      .filter(v => !isNaN(v));

    if (values.length === 0) {
      return { min: null, max: null, mean: null, count: 0 };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      mean: sum / values.length,
      count: values.length
    };
  }

  // ==========================================================================
  // INFORM INTEGRATION METHODS
  // ==========================================================================

  /**
   * Get INFORM-formatted vulnerability scores
   */
  async getINFORMVulnerabilityScores(options = {}) {
    try {
      const results = {
        sensitivity: {},
        adaptive_capacity: {},
        climate_vulnerability: {}
      };

      // Get sensitivity index
      try {
        const sensitivityFeatures = await this.getFeatures('sensitivity_index', {
          maxFeatures: options.maxFeatures || 300
        });
        if (sensitivityFeatures?.features) {
          results.sensitivity = this.aggregateByDistrict(sensitivityFeatures.features, 'sensitivity');
        }
      } catch (err) {
        console.warn('[RCMRD] Failed to get sensitivity:', err.message);
      }

      // Get adaptive capacity
      try {
        const adaptiveFeatures = await this.getFeatures('adaptive_capacity', {
          maxFeatures: options.maxFeatures || 300
        });
        if (adaptiveFeatures?.features) {
          results.adaptive_capacity = this.aggregateByDistrict(adaptiveFeatures.features, 'adaptive_cap');
        }
      } catch (err) {
        console.warn('[RCMRD] Failed to get adaptive capacity:', err.message);
      }

      // Get climate vulnerability
      try {
        const vulnFeatures = await this.getFeatures('climate_vulnerability', {
          maxFeatures: options.maxFeatures || 300
        });
        if (vulnFeatures?.features) {
          results.climate_vulnerability = this.aggregateByDistrict(vulnFeatures.features, 'vulnerability');
        }
      } catch (err) {
        console.warn('[RCMRD] Failed to get climate vulnerability:', err.message);
      }

      return results;

    } catch (error) {
      console.error('[RCMRD] Failed to get INFORM vulnerability scores:', error);
      throw error;
    }
  }

  /**
   * Aggregate features by district
   */
  aggregateByDistrict(features, valueField) {
    const byDistrict = {};

    features.forEach(feature => {
      const district = feature.properties?.district_name ||
                      feature.properties?.district ||
                      feature.properties?.adm2_name ||
                      feature.properties?.NAME_2;

      if (district) {
        if (!byDistrict[district]) {
          byDistrict[district] = { values: [], properties: feature.properties };
        }
        const value = parseFloat(feature.properties?.[valueField] || feature.properties?.value || 0);
        if (!isNaN(value)) {
          byDistrict[district].values.push(value);
        }
      }
    });

    // Calculate mean for each district
    Object.keys(byDistrict).forEach(district => {
      const values = byDistrict[district].values;
      byDistrict[district].score = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;

      // Normalize to 0-10 INFORM scale
      byDistrict[district].informScore = byDistrict[district].score * 10;
    });

    return byDistrict;
  }

  /**
   * Calculate Lack of Coping Capacity from Adaptive Capacity
   * LCC = 10 - (Adaptive Capacity * 10)
   */
  calculateLackOfCopingCapacity(adaptiveCapacity) {
    if (typeof adaptiveCapacity === 'object') {
      const result = {};
      Object.entries(adaptiveCapacity).forEach(([district, data]) => {
        result[district] = {
          ...data,
          lackOfCopingCapacity: 10 - (data.score * 10)
        };
      });
      return result;
    }
    return 10 - (adaptiveCapacity * 10);
  }

  // ==========================================================================
  // OPENDATA METHODS
  // ==========================================================================

  /**
   * Get dataset from OpenData portal
   */
  async getOpenDataset(datasetId) {
    const dataset = OPENDATA_DATASETS[datasetId] || { id: datasetId };
    const url = `${this.config.opendata.restEndpoint}${dataset.id}`;

    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();

    } catch (error) {
      console.error('[RCMRD] Failed to get OpenData dataset:', error);
      throw error;
    }
  }

  // ==========================================================================
  // METADATA METHODS
  // ==========================================================================

  /**
   * Get layer metadata
   */
  getLayerMetadata(layerId) {
    const layer = GEOPORTAL_LAYERS[layerId];
    if (!layer) return null;

    return {
      id: layerId,
      source: 'RCMRD',
      sourceUrl: this.config.geoportal.baseUrl,
      ...layer,
      wmsUrl: `${this.config.geoportal.wmsEndpoint}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${layer.wmsLayer}`,
      wfsUrl: `${this.config.geoportal.wfsEndpoint}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAME=${layer.wfsTypename}`
    };
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.connected,
      geoportalLayers: this.availableLayers.length,
      restDatasets: this.restDatasets.length
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let rcmrdInstance = null;

/**
 * Get RCMRD connector instance
 */
export function getRCMRDConnector(options = {}) {
  if (!rcmrdInstance) {
    rcmrdInstance = new RCMRDConnector(options);
  }
  return rcmrdInstance;
}

/**
 * Reset connector instance
 */
export function resetRCMRDConnector() {
  rcmrdInstance = null;
}

export default RCMRDConnector;
export { GEOPORTAL_LAYERS, OPENDATA_DATASETS, RCMRD_CONFIG };
