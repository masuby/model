/**
 * RISK DATA CONNECTOR
 *
 * Integrates multiple hazard and risk data sources:
 * - Tanzania DRM Portal (historical floods, disaster impacts)
 * - UNEP Global Risk Assessment (GAR) - river flooding, landslides
 * - UNDRR Desinventar Sendai - disaster impact database
 * - METEOR Explorer - landslide susceptibility
 */

import WMSWFSClient from './wmsWfsClient';

// ============================================================================
// DATA SOURCE CONFIGURATIONS
// ============================================================================

export const RISK_DATA_SOURCES = {
  // Tanzania Disaster Risk Management Portal
  DRM_PORTAL: {
    id: 'drm_portal',
    name: 'Tanzania DRM Portal',
    description: 'Official Tanzania disaster risk management data portal',
    baseUrl: 'https://drm.pmo.go.tz',
    type: 'wms_wfs',
    layers: {
      historical_floods: {
        name: 'Historical Floods',
        wmsLayer: 'tz_historical_floods',
        wfsTypename: 'drm:historical_floods',
        format: 'GeoTIFF',
        category: 'hazard',
        informComponent: 'natural_hazard'
      },
      flood_extent: {
        name: 'Flood Extent Areas',
        wmsLayer: 'tz_flood_extent',
        wfsTypename: 'drm:flood_extent',
        format: 'GeoTIFF',
        category: 'hazard',
        informComponent: 'natural_hazard'
      },
      disaster_events: {
        name: 'Disaster Events Database',
        wmsLayer: 'tz_disaster_events',
        wfsTypename: 'drm:disaster_events',
        format: 'database',
        category: 'impact',
        informComponent: 'lack_of_coping_capacity'
      }
    }
  },

  // UNEP Global Risk Assessment (GAR)
  UNEP_GAR: {
    id: 'unep_gar',
    name: 'UNEP Global Assessment Report',
    description: 'Global hazard and risk assessment data from UNEP',
    baseUrl: 'https://risk.preventionweb.net',
    apiEndpoint: 'https://risk.preventionweb.net/capraviewer/main',
    type: 'wms',
    layers: {
      river_flooding: {
        name: 'River Flooding Hazard',
        wmsLayer: 'FL_FLHT_RP100_M',
        format: 'GeoTIFF',
        category: 'hazard',
        returnPeriod: 100,
        unit: 'meters',
        informComponent: 'natural_hazard'
      },
      coastal_flooding: {
        name: 'Coastal Flooding Hazard',
        wmsLayer: 'CF_FLHT_RP100_M',
        format: 'GeoTIFF',
        category: 'hazard',
        returnPeriod: 100,
        unit: 'meters',
        informComponent: 'natural_hazard'
      },
      landslide_susceptibility: {
        name: 'Landslide Susceptibility',
        wmsLayer: 'LS_SUSC',
        format: 'GeoTIFF',
        category: 'hazard',
        unit: 'index',
        scale: [0, 5],
        informComponent: 'natural_hazard'
      },
      earthquake_hazard: {
        name: 'Seismic Hazard (PGA)',
        wmsLayer: 'EQ_PGA_RP475',
        format: 'GeoTIFF',
        category: 'hazard',
        returnPeriod: 475,
        unit: 'g',
        informComponent: 'natural_hazard'
      },
      tropical_cyclone: {
        name: 'Tropical Cyclone Wind Speed',
        wmsLayer: 'TC_WIND_RP100',
        format: 'GeoTIFF',
        category: 'hazard',
        returnPeriod: 100,
        unit: 'm/s',
        informComponent: 'natural_hazard'
      }
    }
  },

  // UNDRR Desinventar Sendai Database
  DESINVENTAR: {
    id: 'desinventar',
    name: 'UNDRR DesInventar Sendai',
    description: 'Disaster impact and loss database from UNDRR',
    baseUrl: 'https://www.desinventar.net',
    apiEndpoint: 'https://www.desinventar.net/DesInventar/api',
    countryCode: 'TZA',
    type: 'api',
    datasets: {
      disaster_events: {
        name: 'Disaster Events',
        endpoint: '/events',
        fields: ['date', 'type', 'location', 'deaths', 'injured', 'affected', 'houses_destroyed'],
        category: 'impact',
        informComponent: 'lack_of_coping_capacity'
      },
      mortality: {
        name: 'Disaster Mortality',
        endpoint: '/mortality',
        fields: ['year', 'hazard_type', 'deaths', 'missing'],
        category: 'impact',
        informComponent: 'vulnerability'
      },
      economic_losses: {
        name: 'Economic Losses',
        endpoint: '/losses',
        fields: ['year', 'hazard_type', 'direct_loss', 'indirect_loss'],
        category: 'impact',
        informComponent: 'vulnerability'
      }
    }
  },

  // METEOR Project Explorer
  METEOR: {
    id: 'meteor',
    name: 'METEOR Explorer',
    description: 'Multi-hazard exposure and risk assessment',
    baseUrl: 'https://meteor-explorer.org',
    wmsEndpoint: 'https://meteor-explorer.org/geoserver/wms',
    type: 'wms',
    layers: {
      landslide_susceptibility: {
        name: 'Landslide Susceptibility Index',
        wmsLayer: 'meteor:landslide_susceptibility_tza',
        format: 'GeoTIFF',
        category: 'hazard',
        unit: 'index',
        scale: [0, 5],
        informComponent: 'natural_hazard'
      },
      earthquake_hazard: {
        name: 'Earthquake Ground Shaking',
        wmsLayer: 'meteor:pga_475yr_tza',
        format: 'GeoTIFF',
        category: 'hazard',
        returnPeriod: 475,
        unit: 'g',
        informComponent: 'natural_hazard'
      },
      flood_hazard: {
        name: 'Flood Hazard Index',
        wmsLayer: 'meteor:flood_hazard_tza',
        format: 'GeoTIFF',
        category: 'hazard',
        unit: 'index',
        informComponent: 'natural_hazard'
      },
      multi_hazard: {
        name: 'Multi-Hazard Index',
        wmsLayer: 'meteor:multi_hazard_tza',
        format: 'GeoTIFF',
        category: 'hazard',
        unit: 'index',
        informComponent: 'natural_hazard'
      }
    }
  }
};

// ============================================================================
// RISK DATA CONNECTOR CLASS
// ============================================================================

class RiskDataConnector {
  constructor(options = {}) {
    this.options = options;
    this.clients = {};
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes
    this.connected = {};
  }

  // ==========================================================================
  // CONNECTION METHODS
  // ==========================================================================

  /**
   * Initialize connection to a specific data source
   */
  async connectSource(sourceId) {
    const source = RISK_DATA_SOURCES[sourceId];
    if (!source) {
      throw new Error(`Unknown risk data source: ${sourceId}`);
    }

    try {
      console.log(`[RiskData] Connecting to ${source.name}...`);

      if (source.type === 'wms' || source.type === 'wms_wfs') {
        const endpoint = source.wmsEndpoint || `${source.baseUrl}/geoserver/wms`;
        this.clients[sourceId] = new WMSWFSClient(endpoint, {
          timeout: 60000,
          retries: 3
        });

        const testResult = await this.clients[sourceId].testConnection();
        this.connected[sourceId] = testResult.success;

        if (testResult.success) {
          console.log(`[RiskData] ✓ Connected to ${source.name}`);
        } else {
          console.warn(`[RiskData] ⚠ ${source.name}: ${testResult.error}`);
        }
      } else if (source.type === 'api') {
        // Test API connection
        this.connected[sourceId] = await this.testApiConnection(source);
      }

      return {
        success: this.connected[sourceId],
        source: source.name
      };

    } catch (error) {
      console.error(`[RiskData] Failed to connect to ${source.name}:`, error);
      this.connected[sourceId] = false;
      return {
        success: false,
        source: source.name,
        error: error.message
      };
    }
  }

  /**
   * Connect to all risk data sources
   */
  async connectAll() {
    const results = {};
    for (const sourceId of Object.keys(RISK_DATA_SOURCES)) {
      results[sourceId] = await this.connectSource(sourceId);
    }
    return results;
  }

  /**
   * Test API connection
   */
  async testApiConnection(source) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(source.apiEndpoint || source.baseUrl, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // ==========================================================================
  // DATA RETRIEVAL METHODS
  // ==========================================================================

  /**
   * Get WMS layer URL for map display
   */
  getWMSLayerUrl(sourceId, layerId, bbox, options = {}) {
    const source = RISK_DATA_SOURCES[sourceId];
    if (!source || !source.layers[layerId]) {
      throw new Error(`Unknown layer: ${sourceId}/${layerId}`);
    }

    const layer = source.layers[layerId];
    const client = this.clients[sourceId];

    if (!client) {
      throw new Error(`Not connected to ${source.name}`);
    }

    return client.getMapUrl(layer.wmsLayer, bbox, {
      format: 'image/png',
      transparent: true,
      width: options.width || 512,
      height: options.height || 512,
      ...options
    });
  }

  /**
   * Get hazard data for a specific region
   */
  async getRegionalHazardData(regionName, hazardTypes = ['flood', 'landslide', 'earthquake']) {
    const results = {
      region: regionName,
      hazards: {},
      timestamp: new Date().toISOString()
    };

    for (const hazardType of hazardTypes) {
      const hazardData = await this.getHazardByType(regionName, hazardType);
      if (hazardData) {
        results.hazards[hazardType] = hazardData;
      }
    }

    return results;
  }

  /**
   * Get specific hazard data by type
   */
  async getHazardByType(regionName, hazardType) {
    const cacheKey = `hazard_${regionName}_${hazardType}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    // Map hazard type to sources
    const sourceMapping = {
      flood: [
        { source: 'DRM_PORTAL', layer: 'historical_floods' },
        { source: 'UNEP_GAR', layer: 'river_flooding' },
        { source: 'METEOR', layer: 'flood_hazard' }
      ],
      landslide: [
        { source: 'UNEP_GAR', layer: 'landslide_susceptibility' },
        { source: 'METEOR', layer: 'landslide_susceptibility' }
      ],
      earthquake: [
        { source: 'UNEP_GAR', layer: 'earthquake_hazard' },
        { source: 'METEOR', layer: 'earthquake_hazard' }
      ],
      cyclone: [
        { source: 'UNEP_GAR', layer: 'tropical_cyclone' }
      ]
    };

    const sources = sourceMapping[hazardType] || [];
    const results = [];

    for (const { source, layer } of sources) {
      if (this.connected[source] && this.clients[source]) {
        try {
          const sourceConfig = RISK_DATA_SOURCES[source];
          const layerConfig = sourceConfig.layers[layer];

          // Try to get features
          const features = await this.clients[source].getFeatures(
            layerConfig.wfsTypename || layerConfig.wmsLayer,
            {
              filter: `region_name='${regionName}' OR adm1_name='${regionName}'`,
              maxFeatures: 100
            }
          );

          if (features && features.features && features.features.length > 0) {
            results.push({
              source: source,
              sourceName: sourceConfig.name,
              layer: layer,
              layerName: layerConfig.name,
              features: features.features,
              statistics: this.calculateStatistics(features.features)
            });
          }
        } catch (error) {
          console.warn(`[RiskData] Could not fetch ${layer} from ${source}:`, error.message);
        }
      }
    }

    const data = results.length > 0 ? {
      hazardType,
      sources: results,
      combinedScore: this.calculateCombinedScore(results)
    } : null;

    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  /**
   * Get disaster impact data from DesInventar
   */
  async getDisasterImpacts(options = {}) {
    const source = RISK_DATA_SOURCES.DESINVENTAR;

    // This would connect to the actual DesInventar API
    // For now, return structure with simulated data
    const impacts = {
      source: source.name,
      countryCode: source.countryCode,
      summary: {
        totalEvents: 0,
        totalDeaths: 0,
        totalAffected: 0,
        totalHousesDestroyed: 0
      },
      byHazard: {},
      byYear: {},
      byRegion: {}
    };

    // Attempt API connection if available
    if (this.connected.DESINVENTAR) {
      try {
        const response = await fetch(
          `${source.apiEndpoint}/events?country=${source.countryCode}&limit=${options.limit || 1000}`
        );

        if (response.ok) {
          const data = await response.json();
          impacts.events = data.events || [];
          impacts.summary = this.summarizeImpacts(impacts.events);
        }
      } catch (error) {
        console.warn('[RiskData] Could not fetch DesInventar data:', error.message);
      }
    }

    return impacts;
  }

  // ==========================================================================
  // INFORM INTEGRATION METHODS
  // ==========================================================================

  /**
   * Get INFORM-formatted natural hazard scores
   */
  async getINFORMNaturalHazardScores(regionName = null) {
    const scores = {
      flood: { score: 0, sources: [], confidence: 0 },
      drought: { score: 0, sources: [], confidence: 0 },
      earthquake: { score: 0, sources: [], confidence: 0 },
      landslide: { score: 0, sources: [], confidence: 0 },
      cyclone: { score: 0, sources: [], confidence: 0 }
    };

    for (const hazardType of Object.keys(scores)) {
      const hazardData = await this.getHazardByType(regionName, hazardType);

      if (hazardData && hazardData.combinedScore !== undefined) {
        scores[hazardType] = {
          score: hazardData.combinedScore,
          sources: hazardData.sources.map(s => s.sourceName),
          confidence: hazardData.sources.length / 3 // More sources = higher confidence
        };
      }
    }

    // Calculate composite natural hazard score
    const hazardValues = Object.values(scores).filter(s => s.score > 0);
    const compositeScore = hazardValues.length > 0
      ? Math.max(...hazardValues.map(s => s.score)) // Use max approach for natural hazards
      : 0;

    return {
      individual: scores,
      composite: compositeScore,
      timestamp: new Date().toISOString()
    };
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Calculate statistics from features
   */
  calculateStatistics(features, valueField = 'value') {
    const values = features
      .map(f => parseFloat(f.properties?.[valueField] || f.properties?.score || 0))
      .filter(v => !isNaN(v));

    if (values.length === 0) {
      return { min: 0, max: 0, mean: 0, count: 0 };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      mean: sum / values.length,
      count: values.length
    };
  }

  /**
   * Calculate combined score from multiple sources
   */
  calculateCombinedScore(results) {
    if (results.length === 0) return 0;

    // Weight by source reliability and combine
    const weights = {
      'UNEP_GAR': 1.0,
      'METEOR': 0.9,
      'DRM_PORTAL': 0.8,
      'DESINVENTAR': 0.7
    };

    let totalWeight = 0;
    let weightedSum = 0;

    for (const result of results) {
      const weight = weights[result.source] || 0.5;
      const score = result.statistics?.mean || 0;
      weightedSum += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Summarize disaster impacts
   */
  summarizeImpacts(events) {
    return events.reduce((summary, event) => ({
      totalEvents: summary.totalEvents + 1,
      totalDeaths: summary.totalDeaths + (event.deaths || 0),
      totalAffected: summary.totalAffected + (event.affected || 0),
      totalHousesDestroyed: summary.totalHousesDestroyed + (event.houses_destroyed || 0)
    }), {
      totalEvents: 0,
      totalDeaths: 0,
      totalAffected: 0,
      totalHousesDestroyed: 0
    });
  }

  /**
   * Get all available layers
   */
  getAllLayers() {
    const layers = [];

    for (const [sourceId, source] of Object.entries(RISK_DATA_SOURCES)) {
      const sourceLayers = source.layers || source.datasets;
      if (sourceLayers) {
        for (const [layerId, layer] of Object.entries(sourceLayers)) {
          layers.push({
            sourceId,
            sourceName: source.name,
            layerId,
            ...layer,
            connected: this.connected[sourceId] || false
          });
        }
      }
    }

    return layers;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return Object.entries(RISK_DATA_SOURCES).map(([id, source]) => ({
      id,
      name: source.name,
      description: source.description,
      connected: this.connected[id] || false,
      type: source.type,
      layerCount: Object.keys(source.layers || source.datasets || {}).length
    }));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let riskDataInstance = null;

export function getRiskDataConnector(options = {}) {
  if (!riskDataInstance) {
    riskDataInstance = new RiskDataConnector(options);
  }
  return riskDataInstance;
}

export function resetRiskDataConnector() {
  riskDataInstance = null;
}

export default RiskDataConnector;
