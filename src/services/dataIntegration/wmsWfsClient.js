/**
 * WMS/WFS CLIENT
 *
 * Generic OGC Web Map Service and Web Feature Service client
 * Handles GetCapabilities, GetMap, GetFeature requests
 */

// ============================================================================
// WMS/WFS CLIENT CLASS
// ============================================================================

class WMSWFSClient {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.options = {
      timeout: 30000,
      retries: 3,
      cacheEnabled: true,
      cacheTTL: 300000, // 5 minutes
      ...options
    };
    this.cache = new Map();
    this.capabilities = null;
  }

  // ==========================================================================
  // CORE REQUEST METHODS
  // ==========================================================================

  /**
   * Make HTTP request with retry logic
   */
  async request(url, options = {}) {
    const cacheKey = url;

    // Check cache
    if (this.options.cacheEnabled && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.options.cacheTTL) {
        console.log(`[WMS/WFS] Cache hit: ${url.substring(0, 80)}...`);
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    let lastError;
    for (let attempt = 1; attempt <= this.options.retries; attempt++) {
      try {
        console.log(`[WMS/WFS] Request (attempt ${attempt}): ${url.substring(0, 80)}...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Accept': 'application/json, application/xml, text/xml, */*',
            ...options.headers
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        let data;

        if (contentType.includes('json')) {
          data = await response.json();
        } else if (contentType.includes('xml')) {
          const text = await response.text();
          data = this.parseXML(text);
        } else {
          data = await response.text();
        }

        // Cache successful response
        if (this.options.cacheEnabled) {
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
        }

        return data;

      } catch (error) {
        lastError = error;
        console.warn(`[WMS/WFS] Attempt ${attempt} failed:`, error.message);

        if (attempt < this.options.retries) {
          await this.sleep(1000 * attempt); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Parse XML response to JS object (simplified)
   */
  parseXML(xmlString) {
    // In browser environment, use DOMParser
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'text/xml');
      return this.xmlToJson(doc);
    }

    // Return raw XML string if no parser available
    return { raw: xmlString };
  }

  /**
   * Convert XML document to JSON
   */
  xmlToJson(xml) {
    const obj = {};

    if (xml.nodeType === 1) { // Element
      if (xml.attributes.length > 0) {
        obj['@attributes'] = {};
        for (let i = 0; i < xml.attributes.length; i++) {
          const attr = xml.attributes.item(i);
          obj['@attributes'][attr.nodeName] = attr.nodeValue;
        }
      }
    } else if (xml.nodeType === 3) { // Text
      return xml.nodeValue.trim();
    }

    if (xml.hasChildNodes()) {
      for (let i = 0; i < xml.childNodes.length; i++) {
        const item = xml.childNodes.item(i);
        const nodeName = item.nodeName;

        if (typeof obj[nodeName] === 'undefined') {
          obj[nodeName] = this.xmlToJson(item);
        } else {
          if (!Array.isArray(obj[nodeName])) {
            obj[nodeName] = [obj[nodeName]];
          }
          obj[nodeName].push(this.xmlToJson(item));
        }
      }
    }

    return obj;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // WMS METHODS
  // ==========================================================================

  /**
   * Get WMS Capabilities
   */
  async getWMSCapabilities() {
    const url = `${this.baseUrl}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0`;
    const capabilities = await this.request(url);
    this.capabilities = this.parseWMSCapabilities(capabilities);
    return this.capabilities;
  }

  /**
   * Parse WMS GetCapabilities response
   */
  parseWMSCapabilities(data) {
    const layers = [];

    // Extract layers from capabilities
    const extractLayers = (obj, path = '') => {
      if (!obj) return;

      if (obj.Layer) {
        const layerData = Array.isArray(obj.Layer) ? obj.Layer : [obj.Layer];
        layerData.forEach(layer => {
          if (layer.Name && typeof layer.Name === 'string') {
            layers.push({
              name: layer.Name,
              title: layer.Title || layer.Name,
              abstract: layer.Abstract || '',
              bbox: this.extractBBox(layer),
              styles: this.extractStyles(layer),
              queryable: layer['@attributes']?.queryable === '1'
            });
          }
          extractLayers(layer, path);
        });
      }
    };

    extractLayers(data.WMS_Capabilities || data.WMT_MS_Capabilities || data);

    return {
      service: 'WMS',
      version: data.WMS_Capabilities?.['@attributes']?.version || '1.3.0',
      layers,
      raw: data
    };
  }

  /**
   * Extract bounding box from layer
   */
  extractBBox(layer) {
    if (layer.BoundingBox) {
      const bbox = Array.isArray(layer.BoundingBox) ? layer.BoundingBox[0] : layer.BoundingBox;
      return {
        minx: parseFloat(bbox['@attributes']?.minx || 0),
        miny: parseFloat(bbox['@attributes']?.miny || 0),
        maxx: parseFloat(bbox['@attributes']?.maxx || 0),
        maxy: parseFloat(bbox['@attributes']?.maxy || 0),
        crs: bbox['@attributes']?.CRS || 'EPSG:4326'
      };
    }
    return null;
  }

  /**
   * Extract styles from layer
   */
  extractStyles(layer) {
    if (!layer.Style) return [];
    const styles = Array.isArray(layer.Style) ? layer.Style : [layer.Style];
    return styles.map(s => ({
      name: s.Name || 'default',
      title: s.Title || s.Name
    }));
  }

  /**
   * Get WMS map image URL
   */
  getMapUrl(layerName, bbox, options = {}) {
    const params = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: options.version || '1.3.0',
      REQUEST: 'GetMap',
      LAYERS: layerName,
      STYLES: options.style || '',
      CRS: options.crs || 'EPSG:4326',
      BBOX: bbox.join(','),
      WIDTH: options.width || 512,
      HEIGHT: options.height || 512,
      FORMAT: options.format || 'image/png',
      TRANSPARENT: options.transparent !== false ? 'TRUE' : 'FALSE'
    });

    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * Get WMS Legend URL
   */
  getLegendUrl(layerName, options = {}) {
    const params = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: options.version || '1.3.0',
      REQUEST: 'GetLegendGraphic',
      LAYER: layerName,
      FORMAT: options.format || 'image/png',
      WIDTH: options.width || 20,
      HEIGHT: options.height || 20
    });

    return `${this.baseUrl}?${params.toString()}`;
  }

  // ==========================================================================
  // WFS METHODS
  // ==========================================================================

  /**
   * Get WFS Capabilities
   */
  async getWFSCapabilities() {
    const url = `${this.baseUrl}?SERVICE=WFS&REQUEST=GetCapabilities&VERSION=2.0.0`;
    const capabilities = await this.request(url);
    return this.parseWFSCapabilities(capabilities);
  }

  /**
   * Parse WFS GetCapabilities response
   */
  parseWFSCapabilities(data) {
    const featureTypes = [];

    const extractFeatureTypes = (obj) => {
      if (!obj) return;

      if (obj.FeatureType) {
        const types = Array.isArray(obj.FeatureType) ? obj.FeatureType : [obj.FeatureType];
        types.forEach(ft => {
          featureTypes.push({
            name: ft.Name || '',
            title: ft.Title || ft.Name || '',
            abstract: ft.Abstract || '',
            defaultCRS: ft.DefaultCRS || 'EPSG:4326',
            bbox: this.extractWFSBBox(ft)
          });
        });
      }

      // Recursively search
      Object.values(obj).forEach(val => {
        if (typeof val === 'object' && val !== null) {
          extractFeatureTypes(val);
        }
      });
    };

    extractFeatureTypes(data);

    return {
      service: 'WFS',
      version: '2.0.0',
      featureTypes,
      raw: data
    };
  }

  /**
   * Extract WFS bounding box
   */
  extractWFSBBox(featureType) {
    if (featureType.WGS84BoundingBox) {
      const bbox = featureType.WGS84BoundingBox;
      return {
        lowerCorner: bbox.LowerCorner,
        upperCorner: bbox.UpperCorner
      };
    }
    return null;
  }

  /**
   * Get features as GeoJSON
   */
  async getFeatures(typeName, options = {}) {
    const params = new URLSearchParams({
      SERVICE: 'WFS',
      VERSION: options.version || '2.0.0',
      REQUEST: 'GetFeature',
      TYPENAME: typeName,
      OUTPUTFORMAT: 'application/json',
      SRSNAME: options.crs || 'EPSG:4326'
    });

    // Add optional parameters
    if (options.bbox) {
      params.append('BBOX', options.bbox.join(','));
    }
    if (options.maxFeatures) {
      params.append('COUNT', options.maxFeatures);
    }
    if (options.filter) {
      params.append('CQL_FILTER', options.filter);
    }
    if (options.propertyName) {
      params.append('PROPERTYNAME', options.propertyName.join(','));
    }

    const url = `${this.baseUrl}?${params.toString()}`;
    return this.request(url);
  }

  /**
   * Describe feature type (get schema)
   */
  async describeFeatureType(typeName) {
    const params = new URLSearchParams({
      SERVICE: 'WFS',
      VERSION: '2.0.0',
      REQUEST: 'DescribeFeatureType',
      TYPENAME: typeName,
      OUTPUTFORMAT: 'application/json'
    });

    const url = `${this.baseUrl}?${params.toString()}`;
    return this.request(url);
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get available layers
   */
  async getAvailableLayers() {
    try {
      const wmsCapabilities = await this.getWMSCapabilities();
      const wfsCapabilities = await this.getWFSCapabilities();

      return {
        wms: wmsCapabilities.layers,
        wfs: wfsCapabilities.featureTypes
      };
    } catch (error) {
      console.error('[WMS/WFS] Failed to get available layers:', error);
      throw error;
    }
  }

  /**
   * Test connection to the service
   */
  async testConnection() {
    try {
      await this.getWMSCapabilities();
      return { success: true, service: 'WMS' };
    } catch (wmsError) {
      try {
        await this.getWFSCapabilities();
        return { success: true, service: 'WFS' };
      } catch (wfsError) {
        return {
          success: false,
          error: `WMS: ${wmsError.message}, WFS: ${wfsError.message}`
        };
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.capabilities = null;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create WMS/WFS client for a data source
 */
export function createClient(dataSource) {
  const baseUrl = dataSource.capabilities?.wms ||
                  dataSource.capabilities?.wfs ||
                  dataSource.baseUrl + '/ows/';

  return new WMSWFSClient(baseUrl, {
    sourceId: dataSource.id,
    sourceName: dataSource.name
  });
}

/**
 * Create client from URL
 */
export function createClientFromUrl(url, options = {}) {
  return new WMSWFSClient(url, options);
}

export default WMSWFSClient;
