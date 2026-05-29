/**
 * TCVMP CONNECTOR
 *
 * Connector for Tanzania Comprehensive Vulnerability Mapping Platform (PMO-DMD)
 * Provides hazard, exposure, and vulnerability layers via WMS/WFS
 */

import WMSWFSClient from './wmsWfsClient';
import { DATA_SOURCES } from './dataSourceRegistry';

// ============================================================================
// TCVMP CONFIGURATION
// ============================================================================

const TCVMP_CONFIG = {
  baseUrl: 'https://tcvmp.pmo.go.tz',
  wmsEndpoint: 'https://tcvmp.pmo.go.tz/ows/',
  wfsEndpoint: 'https://tcvmp.pmo.go.tz/ows/',
  timeout: 60000,
  retries: 3
};

// Layer name mappings (actual TCVMP layer names)
const LAYER_MAPPINGS = {
  // Hazard layers
  flood_hazard: {
    wmsLayer: 'tz_flood_hazard',
    wfsTypename: 'tcvmp:flood_hazard',
    title: 'Flood Hazard Index',
    category: 'hazard',
    unit: 'index',
    scale: [0, 10],
    style: 'flood_style'
  },
  drought_hazard: {
    wmsLayer: 'tz_drought_hazard',
    wfsTypename: 'tcvmp:drought_hazard',
    title: 'Drought Hazard Index',
    category: 'hazard',
    unit: 'index',
    scale: [0, 10],
    style: 'drought_style'
  },
  landslide_hazard: {
    wmsLayer: 'tz_landslide_susceptibility',
    wfsTypename: 'tcvmp:landslide_susceptibility',
    title: 'Landslide Susceptibility',
    category: 'hazard',
    unit: 'index',
    scale: [0, 10],
    style: 'landslide_style'
  },
  earthquake_hazard: {
    wmsLayer: 'tz_seismic_hazard',
    wfsTypename: 'tcvmp:seismic_hazard',
    title: 'Seismic Hazard (PGA)',
    category: 'hazard',
    unit: 'g',
    scale: [0, 1],
    style: 'seismic_style'
  },
  cyclone_hazard: {
    wmsLayer: 'tz_cyclone_hazard',
    wfsTypename: 'tcvmp:cyclone_hazard',
    title: 'Tropical Cyclone Hazard',
    category: 'hazard',
    unit: 'index',
    scale: [0, 10],
    style: 'cyclone_style'
  },

  // Exposure layers
  population_exposure: {
    wmsLayer: 'tz_population_density',
    wfsTypename: 'tcvmp:population',
    title: 'Population Density',
    category: 'exposure',
    unit: 'people/km2',
    scale: [0, 10000],
    style: 'population_style'
  },
  infrastructure_exposure: {
    wmsLayer: 'tz_critical_infrastructure',
    wfsTypename: 'tcvmp:infrastructure',
    title: 'Critical Infrastructure',
    category: 'exposure',
    unit: 'count',
    scale: [0, 100],
    style: 'infrastructure_style'
  },
  agricultural_exposure: {
    wmsLayer: 'tz_agricultural_land',
    wfsTypename: 'tcvmp:agriculture',
    title: 'Agricultural Land',
    category: 'exposure',
    unit: 'hectares',
    scale: [0, 100000],
    style: 'agriculture_style'
  },

  // Vulnerability layers
  socioeconomic_vulnerability: {
    wmsLayer: 'tz_socioeconomic_vulnerability',
    wfsTypename: 'tcvmp:socioeconomic_vuln',
    title: 'Socioeconomic Vulnerability',
    category: 'vulnerability',
    unit: 'index',
    scale: [0, 10],
    style: 'vulnerability_style'
  },
  physical_vulnerability: {
    wmsLayer: 'tz_physical_vulnerability',
    wfsTypename: 'tcvmp:physical_vuln',
    title: 'Physical Vulnerability',
    category: 'vulnerability',
    unit: 'index',
    scale: [0, 10],
    style: 'vulnerability_style'
  },

  // Administrative boundaries
  regions: {
    wmsLayer: 'tz_regions',
    wfsTypename: 'tcvmp:tz_regions',
    title: 'Tanzania Regions',
    category: 'admin',
    unit: 'boundary',
    style: 'admin_style'
  },
  districts: {
    wmsLayer: 'tz_districts',
    wfsTypename: 'tcvmp:tz_districts',
    title: 'Tanzania Districts',
    category: 'admin',
    unit: 'boundary',
    style: 'admin_style'
  }
};

// ============================================================================
// TCVMP CONNECTOR CLASS
// ============================================================================

class TCVMPConnector {
  constructor(options = {}) {
    this.config = { ...TCVMP_CONFIG, ...options };
    this.client = new WMSWFSClient(this.config.wmsEndpoint, {
      timeout: this.config.timeout,
      retries: this.config.retries
    });
    this.connected = false;
    this.capabilities = null;
    this.availableLayers = [];
  }

  // ==========================================================================
  // CONNECTION METHODS
  // ==========================================================================

  /**
   * Initialize connection and fetch capabilities
   */
  async connect() {
    try {
      console.log('[TCVMP] Connecting to PMO-DMD TCVMP service...');

      // Test connection
      const testResult = await this.client.testConnection();

      if (!testResult.success) {
        throw new Error(`Connection failed: ${testResult.error}`);
      }

      // Get WMS capabilities
      this.capabilities = await this.client.getWMSCapabilities();

      // Map available layers
      this.availableLayers = this.capabilities.layers.map(layer => ({
        ...layer,
        mapping: this.findLayerMapping(layer.name)
      })).filter(l => l.mapping);

      this.connected = true;
      console.log(`[TCVMP] Connected. ${this.availableLayers.length} layers available.`);

      return {
        success: true,
        layerCount: this.availableLayers.length,
        layers: this.availableLayers.map(l => l.name)
      };

    } catch (error) {
      console.error('[TCVMP] Connection failed:', error);
      this.connected = false;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find layer mapping by name
   */
  findLayerMapping(layerName) {
    for (const [key, mapping] of Object.entries(LAYER_MAPPINGS)) {
      if (mapping.wmsLayer === layerName || mapping.wfsTypename.includes(layerName)) {
        return { id: key, ...mapping };
      }
    }
    return null;
  }

  /**
   * Check connection status
   */
  isConnected() {
    return this.connected;
  }

  // ==========================================================================
  // LAYER METHODS
  // ==========================================================================

  /**
   * Get available hazard layers
   */
  getHazardLayers() {
    return Object.entries(LAYER_MAPPINGS)
      .filter(([_, layer]) => layer.category === 'hazard')
      .map(([id, layer]) => ({ id, ...layer }));
  }

  /**
   * Get available exposure layers
   */
  getExposureLayers() {
    return Object.entries(LAYER_MAPPINGS)
      .filter(([_, layer]) => layer.category === 'exposure')
      .map(([id, layer]) => ({ id, ...layer }));
  }

  /**
   * Get available vulnerability layers
   */
  getVulnerabilityLayers() {
    return Object.entries(LAYER_MAPPINGS)
      .filter(([_, layer]) => layer.category === 'vulnerability')
      .map(([id, layer]) => ({ id, ...layer }));
  }

  /**
   * Get all layers by category
   */
  getLayersByCategory(category) {
    return Object.entries(LAYER_MAPPINGS)
      .filter(([_, layer]) => layer.category === category)
      .map(([id, layer]) => ({ id, ...layer }));
  }

  // ==========================================================================
  // DATA RETRIEVAL METHODS
  // ==========================================================================

  /**
   * Get WMS layer URL for map display
   */
  getWMSLayerUrl(layerId, bbox, options = {}) {
    const layer = LAYER_MAPPINGS[layerId];
    if (!layer) {
      throw new Error(`Unknown layer: ${layerId}`);
    }

    return this.client.getMapUrl(layer.wmsLayer, bbox, {
      style: layer.style,
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
    const layer = LAYER_MAPPINGS[layerId];
    if (!layer) {
      throw new Error(`Unknown layer: ${layerId}`);
    }

    return this.client.getLegendUrl(layer.wmsLayer, options);
  }

  /**
   * Get features as GeoJSON for a specific layer
   */
  async getFeatures(layerId, options = {}) {
    const layer = LAYER_MAPPINGS[layerId];
    if (!layer) {
      throw new Error(`Unknown layer: ${layerId}`);
    }

    return this.client.getFeatures(layer.wfsTypename, {
      bbox: options.bbox,
      maxFeatures: options.maxFeatures || 1000,
      filter: options.filter,
      ...options
    });
  }

  /**
   * Get hazard data for a specific region
   */
  async getRegionHazardData(regionName, hazardType = 'all') {
    try {
      const hazardLayers = hazardType === 'all'
        ? this.getHazardLayers()
        : [LAYER_MAPPINGS[hazardType]].filter(Boolean);

      const results = {};

      for (const layer of hazardLayers) {
        const features = await this.getFeatures(layer.id || hazardType, {
          filter: `region_name='${regionName}'`,
          maxFeatures: 100
        });

        if (features && features.features) {
          results[layer.id || hazardType] = {
            layerInfo: layer,
            features: features.features,
            statistics: this.calculateStatistics(features.features, 'hazard_value')
          };
        }
      }

      return results;

    } catch (error) {
      console.error('[TCVMP] Failed to get region hazard data:', error);
      throw error;
    }
  }

  /**
   * Get district-level data
   */
  async getDistrictData(districtName) {
    try {
      const allLayers = ['flood_hazard', 'drought_hazard', 'population_exposure', 'socioeconomic_vulnerability'];
      const results = {};

      for (const layerId of allLayers) {
        if (LAYER_MAPPINGS[layerId]) {
          try {
            const features = await this.getFeatures(layerId, {
              filter: `district_name='${districtName}'`,
              maxFeatures: 10
            });

            if (features && features.features && features.features.length > 0) {
              results[layerId] = {
                value: features.features[0].properties?.value || features.features[0].properties?.score || 0,
                properties: features.features[0].properties
              };
            }
          } catch (err) {
            console.warn(`[TCVMP] Could not fetch ${layerId} for ${districtName}:`, err.message);
          }
        }
      }

      return results;

    } catch (error) {
      console.error('[TCVMP] Failed to get district data:', error);
      throw error;
    }
  }

  /**
   * Calculate statistics from features
   */
  calculateStatistics(features, valueField) {
    const values = features
      .map(f => parseFloat(f.properties?.[valueField]))
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
   * Get INFORM-formatted hazard scores by district
   */
  async getINFORMHazardScores(options = {}) {
    try {
      const results = {
        natural: {},
        human: {}
      };

      // Natural hazards
      const naturalLayers = ['flood_hazard', 'drought_hazard', 'landslide_hazard', 'earthquake_hazard', 'cyclone_hazard'];

      for (const layerId of naturalLayers) {
        if (LAYER_MAPPINGS[layerId]) {
          const features = await this.getFeatures(layerId, {
            maxFeatures: options.maxFeatures || 500
          });

          if (features && features.features) {
            results.natural[layerId] = this.aggregateByDistrict(features.features);
          }
        }
      }

      return results;

    } catch (error) {
      console.error('[TCVMP] Failed to get INFORM hazard scores:', error);
      throw error;
    }
  }

  /**
   * Aggregate features by district
   */
  aggregateByDistrict(features) {
    const byDistrict = {};

    features.forEach(feature => {
      const district = feature.properties?.district_name ||
                      feature.properties?.district ||
                      feature.properties?.adm2_name;

      if (district) {
        if (!byDistrict[district]) {
          byDistrict[district] = { values: [], properties: feature.properties };
        }
        const value = parseFloat(feature.properties?.value || feature.properties?.score || 0);
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
    });

    return byDistrict;
  }

  // ==========================================================================
  // METADATA METHODS
  // ==========================================================================

  /**
   * Get layer metadata
   */
  getLayerMetadata(layerId) {
    const layer = LAYER_MAPPINGS[layerId];
    if (!layer) return null;

    return {
      id: layerId,
      source: 'TCVMP',
      sourceUrl: this.config.baseUrl,
      ...layer,
      wmsUrl: `${this.config.wmsEndpoint}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${layer.wmsLayer}`,
      wfsUrl: `${this.config.wfsEndpoint}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAME=${layer.wfsTypename}`
    };
  }

  /**
   * Get all layer metadata
   */
  getAllLayerMetadata() {
    return Object.keys(LAYER_MAPPINGS).map(id => this.getLayerMetadata(id));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let tcvmpInstance = null;

/**
 * Get TCVMP connector instance
 */
export function getTCVMPConnector(options = {}) {
  if (!tcvmpInstance) {
    tcvmpInstance = new TCVMPConnector(options);
  }
  return tcvmpInstance;
}

/**
 * Reset connector instance
 */
export function resetTCVMPConnector() {
  tcvmpInstance = null;
}

export default TCVMPConnector;
export { LAYER_MAPPINGS, TCVMP_CONFIG };
