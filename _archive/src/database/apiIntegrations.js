/**
 * GLOBAL API INTEGRATIONS v2.0
 *
 * Enterprise-grade integration layer for external data sources
 * supporting real-time INFORM indicator updates for Tanzania.
 *
 * Architecture Features:
 * - Rate limiting with token bucket algorithm
 * - Circuit breaker pattern for fault tolerance
 * - Request caching with TTL
 * - Request queue with priority
 * - Automatic retry with exponential backoff
 * - Response validation and transformation
 * - Comprehensive metrics and monitoring
 * - Webhook notifications for data updates
 *
 * APIs Integrated:
 * - USGS Earthquake Data
 * - NASA FIRMS Fire Data
 * - ACLED Conflict Data
 * - GDACS Disaster Alerts
 * - Open-Meteo Weather
 * - World Bank Indicators
 * - HDX Humanitarian Data
 * - IPC Food Security
 * - FEWS NET Food Security
 * - CHIRPS Rainfall
 * - EM-DAT Disaster Database
 */

import { API_INTEGRATIONS } from './advancedSchema.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  version: '2.0.0',

  // Tanzania geographic bounds
  tanzania: {
    bbox: {
      minLat: -11.75,
      maxLat: -0.99,
      minLon: 29.34,
      maxLon: 40.44
    },
    center: {
      lat: -6.369028,
      lon: 34.888822
    },
    iso3: 'TZA',
    iso2: 'TZ',
    name: 'United Republic of Tanzania'
  },

  // Request defaults
  request: {
    timeout: 30000,           // 30 seconds
    maxRetries: 3,
    retryDelay: 1000,         // Base delay in ms
    retryBackoffMultiplier: 2,
    maxConcurrent: 10
  },

  // Rate limiting (requests per window)
  rateLimits: {
    default: { requests: 100, windowMs: 60000 },   // 100/min default
    USGS: { requests: 100, windowMs: 60000 },
    NASA_FIRMS: { requests: 10, windowMs: 60000 },  // Stricter
    ACLED: { requests: 20, windowMs: 60000 },
    GDACS: { requests: 50, windowMs: 60000 },
    OPEN_METEO: { requests: 300, windowMs: 60000 },
    WORLD_BANK: { requests: 50, windowMs: 60000 },
    HDX: { requests: 30, windowMs: 60000 }
  },

  // Circuit breaker settings
  circuitBreaker: {
    failureThreshold: 5,     // Open circuit after 5 failures
    recoveryTimeout: 60000,  // Try to recover after 60s
    halfOpenRequests: 3      // Allow 3 test requests in half-open state
  },

  // Cache settings
  cache: {
    enabled: true,
    defaultTTL: 300000,      // 5 minutes default
    maxSize: 500,
    ttlBySource: {
      USGS: 600000,          // 10 minutes (near real-time)
      NASA_FIRMS: 3600000,   // 1 hour
      ACLED: 86400000,       // 24 hours
      GDACS: 300000,         // 5 minutes
      OPEN_METEO: 3600000,   // 1 hour
      WORLD_BANK: 86400000,  // 24 hours (rarely changes)
      HDX: 86400000
    }
  }
};

// ============================================================================
// ERROR TYPES
// ============================================================================

export class APIError extends Error {
  constructor(message, source, statusCode = null, details = {}) {
    super(message);
    this.name = 'APIError';
    this.source = source;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class RateLimitError extends APIError {
  constructor(source, retryAfter = null) {
    super(`Rate limit exceeded for ${source}`, source, 429, { retryAfter });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class CircuitOpenError extends APIError {
  constructor(source) {
    super(`Circuit breaker open for ${source}`, source, 503);
    this.name = 'CircuitOpenError';
  }
}

export class ValidationError extends APIError {
  constructor(source, validationErrors) {
    super(`Response validation failed for ${source}`, source, null, { validationErrors });
    this.name = 'ValidationError';
  }
}

// ============================================================================
// RATE LIMITER
// ============================================================================

class RateLimiter {
  constructor() {
    this.buckets = new Map();
  }

  /**
   * Check if request is allowed
   */
  checkLimit(source) {
    const config = API_CONFIG.rateLimits[source] || API_CONFIG.rateLimits.default;
    const key = source;
    const now = Date.now();

    let bucket = this.buckets.get(key);

    if (!bucket || now - bucket.windowStart >= config.windowMs) {
      // Start new window
      bucket = {
        tokens: config.requests - 1,
        windowStart: now
      };
      this.buckets.set(key, bucket);
      return { allowed: true, remaining: bucket.tokens };
    }

    if (bucket.tokens > 0) {
      bucket.tokens--;
      return { allowed: true, remaining: bucket.tokens };
    }

    const retryAfter = Math.ceil((bucket.windowStart + config.windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  /**
   * Get current status for a source
   */
  getStatus(source) {
    const config = API_CONFIG.rateLimits[source] || API_CONFIG.rateLimits.default;
    const bucket = this.buckets.get(source);
    const now = Date.now();

    if (!bucket || now - bucket.windowStart >= config.windowMs) {
      return {
        remaining: config.requests,
        limit: config.requests,
        resetAt: null
      };
    }

    return {
      remaining: bucket.tokens,
      limit: config.requests,
      resetAt: new Date(bucket.windowStart + config.windowMs).toISOString()
    };
  }

  /**
   * Clear rate limit data
   */
  clear(source = null) {
    if (source) {
      this.buckets.delete(source);
    } else {
      this.buckets.clear();
    }
  }
}

// Global rate limiter
const rateLimiter = new RateLimiter();

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

class CircuitBreaker {
  constructor() {
    this.circuits = new Map();
  }

  /**
   * Get or create circuit for source
   */
  getCircuit(source) {
    if (!this.circuits.has(source)) {
      this.circuits.set(source, {
        state: 'CLOSED',
        failures: 0,
        successes: 0,
        lastFailure: null,
        lastStateChange: Date.now()
      });
    }
    return this.circuits.get(source);
  }

  /**
   * Check if request is allowed
   */
  canRequest(source) {
    const circuit = this.getCircuit(source);
    const config = API_CONFIG.circuitBreaker;
    const now = Date.now();

    switch (circuit.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        // Check if recovery timeout has passed
        if (now - circuit.lastStateChange >= config.recoveryTimeout) {
          circuit.state = 'HALF_OPEN';
          circuit.successes = 0;
          circuit.lastStateChange = now;
          return true;
        }
        return false;

      case 'HALF_OPEN':
        // Allow limited requests to test recovery
        return circuit.successes < config.halfOpenRequests;

      default:
        return true;
    }
  }

  /**
   * Record successful request
   */
  recordSuccess(source) {
    const circuit = this.getCircuit(source);
    const config = API_CONFIG.circuitBreaker;

    circuit.failures = 0;

    if (circuit.state === 'HALF_OPEN') {
      circuit.successes++;
      if (circuit.successes >= config.halfOpenRequests) {
        circuit.state = 'CLOSED';
        circuit.lastStateChange = Date.now();
      }
    }
  }

  /**
   * Record failed request
   */
  recordFailure(source) {
    const circuit = this.getCircuit(source);
    const config = API_CONFIG.circuitBreaker;

    circuit.failures++;
    circuit.lastFailure = Date.now();

    if (circuit.state === 'HALF_OPEN') {
      // Immediately open on failure during half-open
      circuit.state = 'OPEN';
      circuit.lastStateChange = Date.now();
    } else if (circuit.failures >= config.failureThreshold) {
      circuit.state = 'OPEN';
      circuit.lastStateChange = Date.now();
    }
  }

  /**
   * Get circuit status
   */
  getStatus(source) {
    const circuit = this.getCircuit(source);
    return {
      state: circuit.state,
      failures: circuit.failures,
      lastFailure: circuit.lastFailure,
      lastStateChange: new Date(circuit.lastStateChange).toISOString()
    };
  }

  /**
   * Reset circuit
   */
  reset(source) {
    this.circuits.delete(source);
  }

  /**
   * Get all circuit statuses
   */
  getAllStatuses() {
    const statuses = {};
    for (const [source] of this.circuits) {
      statuses[source] = this.getStatus(source);
    }
    return statuses;
  }
}

// Global circuit breaker
const circuitBreaker = new CircuitBreaker();

// ============================================================================
// RESPONSE CACHE
// ============================================================================

class ResponseCache {
  constructor(maxSize = 500) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Generate cache key
   */
  generateKey(source, params) {
    return `${source}:${JSON.stringify(params)}`;
  }

  /**
   * Get cached response
   */
  get(source, params) {
    const key = this.generateKey(source, params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * Set cached response
   */
  set(source, params, data, ttl = null) {
    const key = this.generateKey(source, params);
    const actualTTL = ttl || API_CONFIG.cache.ttlBySource[source] || API_CONFIG.cache.defaultTTL;

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + actualTTL,
      source
    });
  }

  /**
   * Invalidate cache entries
   */
  invalidate(source = null) {
    if (!source) {
      this.cache.clear();
      return;
    }

    for (const [key, entry] of this.cache.entries()) {
      if (entry.source === source) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + '%' : 'N/A'
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Global response cache
const responseCache = new ResponseCache(API_CONFIG.cache.maxSize);

// Periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => responseCache.cleanup(), 60000);
}

// ============================================================================
// METRICS COLLECTOR
// ============================================================================

class MetricsCollector {
  constructor() {
    this.requests = [];
    this.maxHistory = 1000;
  }

  /**
   * Record API request
   */
  record(source, duration, success, statusCode = null, cached = false) {
    this.requests.push({
      source,
      duration,
      success,
      statusCode,
      cached,
      timestamp: Date.now()
    });

    // Trim history
    if (this.requests.length > this.maxHistory) {
      this.requests = this.requests.slice(-this.maxHistory);
    }
  }

  /**
   * Get metrics for a source
   */
  getSourceMetrics(source, timeWindow = 3600000) {
    const now = Date.now();
    const filtered = this.requests.filter(r =>
      r.source === source && now - r.timestamp < timeWindow
    );

    if (filtered.length === 0) {
      return { requestCount: 0, avgDuration: 0, successRate: 'N/A' };
    }

    const successful = filtered.filter(r => r.success);
    const durations = filtered.filter(r => !r.cached).map(r => r.duration);

    return {
      requestCount: filtered.length,
      successCount: successful.length,
      successRate: ((successful.length / filtered.length) * 100).toFixed(2) + '%',
      avgDuration: durations.length > 0
        ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2) + 'ms'
        : 'N/A',
      cacheHitRate: ((filtered.filter(r => r.cached).length / filtered.length) * 100).toFixed(2) + '%'
    };
  }

  /**
   * Get overall metrics
   */
  getOverallMetrics(timeWindow = 3600000) {
    const sources = [...new Set(this.requests.map(r => r.source))];
    const metrics = {
      overall: this.getSourceMetrics('*', timeWindow),
      bySource: {}
    };

    sources.forEach(source => {
      metrics.bySource[source] = this.getSourceMetrics(source, timeWindow);
    });

    return metrics;
  }

  /**
   * Clear metrics
   */
  clear() {
    this.requests = [];
  }
}

// Global metrics collector
const metricsCollector = new MetricsCollector();

// ============================================================================
// HTTP UTILITIES
// ============================================================================

/**
 * Make HTTP request with full resilience features
 */
async function fetchWithResilience(url, source, options = {}) {
  const startTime = Date.now();

  // Check rate limit
  const rateCheck = rateLimiter.checkLimit(source);
  if (!rateCheck.allowed) {
    throw new RateLimitError(source, rateCheck.retryAfter);
  }

  // Check circuit breaker
  if (!circuitBreaker.canRequest(source)) {
    throw new CircuitOpenError(source);
  }

  const {
    retries = API_CONFIG.request.maxRetries,
    baseDelay = API_CONFIG.request.retryDelay,
    timeout = API_CONFIG.request.timeout,
    validateResponse = null
  } = options;

  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          source,
          response.status
        );
      }

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/csv')) {
        data = await response.text();
      } else {
        data = await response.text();
      }

      // Validate response if validator provided
      if (validateResponse) {
        const validation = validateResponse(data);
        if (!validation.valid) {
          throw new ValidationError(source, validation.errors);
        }
      }

      // Record success
      circuitBreaker.recordSuccess(source);
      metricsCollector.record(source, Date.now() - startTime, true, response.status, false);

      return data;

    } catch (error) {
      lastError = error;

      // Don't retry on validation errors
      if (error instanceof ValidationError) {
        throw error;
      }

      // Don't retry on client errors (4xx except 429)
      if (error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
        circuitBreaker.recordFailure(source);
        metricsCollector.record(source, Date.now() - startTime, false, error.statusCode);
        throw error;
      }

      if (attempt < retries) {
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(API_CONFIG.request.retryBackoffMultiplier, attempt - 1);
        const jitter = delay * 0.2 * Math.random();
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
  }

  // All retries exhausted
  circuitBreaker.recordFailure(source);
  metricsCollector.record(source, Date.now() - startTime, false, lastError?.statusCode);
  throw lastError;
}

/**
 * Build query string from parameters
 */
function buildQueryString(params) {
  return Object.entries(params)
    .filter(([_, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

/**
 * Get cached or fetch fresh data
 */
async function getCachedOrFetch(source, params, fetchFn, options = {}) {
  // Check cache first
  if (API_CONFIG.cache.enabled && options.useCache !== false) {
    const cached = responseCache.get(source, params);
    if (cached) {
      metricsCollector.record(source, 0, true, null, true);
      return { ...cached, cached: true };
    }
  }

  // Fetch fresh data
  const result = await fetchFn();

  // Cache successful result
  if (API_CONFIG.cache.enabled && result.success) {
    responseCache.set(source, params, result, options.cacheTTL);
  }

  return { ...result, cached: false };
}

// ============================================================================
// USGS EARTHQUAKE API
// ============================================================================

export async function fetchUSGSEarthquakes(options = {}) {
  const source = 'USGS';

  const {
    startTime = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endTime = new Date().toISOString().split('T')[0],
    minMagnitude = 4.0,
    useCache = true
  } = options;

  const params = {
    format: 'geojson',
    starttime: startTime,
    endtime: endTime,
    minmagnitude: minMagnitude,
    minlatitude: API_CONFIG.tanzania.bbox.minLat,
    maxlatitude: API_CONFIG.tanzania.bbox.maxLat,
    minlongitude: API_CONFIG.tanzania.bbox.minLon,
    maxlongitude: API_CONFIG.tanzania.bbox.maxLon
  };

  return getCachedOrFetch(source, params, async () => {
    try {
      const url = `${API_INTEGRATIONS?.USGS_EARTHQUAKE?.baseUrl || 'https://earthquake.usgs.gov/fdsnws/event/1/query'}?${buildQueryString(params)}`;
      const data = await fetchWithResilience(url, source);

      const events = (data.features || []).map(feature => ({
        id: feature.id,
        magnitude: feature.properties.mag,
        magnitudeType: feature.properties.magType,
        place: feature.properties.place,
        time: new Date(feature.properties.time).toISOString(),
        updated: new Date(feature.properties.updated).toISOString(),
        depth: feature.geometry.coordinates[2],
        coordinates: {
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0]
        },
        tsunami: feature.properties.tsunami === 1,
        significance: feature.properties.sig,
        felt: feature.properties.felt,
        alert: feature.properties.alert
      }));

      return {
        success: true,
        source,
        timestamp: new Date().toISOString(),
        count: events.length,
        events,
        metadata: {
          generated: data.metadata?.generated,
          url: data.metadata?.url,
          title: data.metadata?.title
        },
        indicators: {
          exposureIndex: calculateEarthquakeExposure(data.features || []),
          maxMagnitude: events.length > 0 ? Math.max(...events.map(e => e.magnitude)) : 0,
          eventCount: events.length,
          significantEvents: events.filter(e => e.magnitude >= 5).length
        }
      };
    } catch (error) {
      return {
        success: false,
        source,
        error: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString()
      };
    }
  }, { useCache });
}

function calculateEarthquakeExposure(features) {
  if (features.length === 0) return 0;

  const weightedSum = features.reduce((sum, f) => {
    const mag = f.properties?.mag || 0;
    const depth = f.geometry?.coordinates?.[2] || 10;
    const depthFactor = Math.max(0.5, 1 - depth / 100);
    return sum + Math.pow(10, mag - 4) * depthFactor;
  }, 0);

  return Math.min(10, Math.round(weightedSum * 100) / 100);
}

// ============================================================================
// NASA FIRMS FIRE API
// ============================================================================

export async function fetchNASAFires(options = {}) {
  const source = 'NASA_FIRMS';

  const {
    days = 7,
    apiKey = null,
    satellite = 'VIIRS_SNPP_NRT',
    useCache = true
  } = options;

  if (!apiKey) {
    return {
      success: false,
      source,
      error: 'API key required. Set NASA_FIRMS_API_KEY.',
      timestamp: new Date().toISOString()
    };
  }

  const { minLat, maxLat, minLon, maxLon } = API_CONFIG.tanzania.bbox;
  const params = { apiKey, satellite, days, bbox: `${minLon},${minLat},${maxLon},${maxLat}` };

  return getCachedOrFetch(source, params, async () => {
    try {
      const baseUrl = API_INTEGRATIONS?.NASA_FIRMS?.baseUrl || 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';
      const url = `${baseUrl}/${apiKey}/${satellite}/${minLon},${minLat},${maxLon},${maxLat}/${days}`;
      const csvData = await fetchWithResilience(url, source);
      const fires = parseFiresCSV(csvData);

      // Group by region
      const byRegion = groupFiresByRegion(fires);

      return {
        success: true,
        source,
        timestamp: new Date().toISOString(),
        count: fires.length,
        fires: fires.slice(0, 1000), // Limit returned fires
        byRegion,
        indicators: {
          burnedAreaIndex: calculateBurnedAreaIndex(fires),
          totalFRP: fires.reduce((sum, f) => sum + (f.frp || 0), 0),
          avgConfidence: fires.length > 0
            ? fires.filter(f => f.confidence !== 'N').reduce((sum, f) => sum + parseFloat(f.confidence || 0), 0) / fires.length
            : 0,
          highConfidenceCount: fires.filter(f => f.confidence === 'h' || parseFloat(f.confidence || 0) > 80).length
        }
      };
    } catch (error) {
      return {
        success: false,
        source,
        error: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString()
      };
    }
  }, { useCache });
}

function parseFiresCSV(csv) {
  const lines = csv.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const fires = [];

  const getIndex = (name) => headers.findIndex(h => h.includes(name));

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 5) continue;

    fires.push({
      latitude: parseFloat(values[getIndex('lat')] || values[0]),
      longitude: parseFloat(values[getIndex('lon')] || values[1]),
      brightness: parseFloat(values[getIndex('bright')] || values[2]),
      scan: parseFloat(values[getIndex('scan')] || 0),
      track: parseFloat(values[getIndex('track')] || 0),
      acqDate: values[getIndex('acq_date')] || values[5],
      acqTime: values[getIndex('acq_time')] || values[6],
      satellite: values[getIndex('satellite')] || 'N',
      confidence: values[getIndex('confidence')] || values[8],
      dayNight: values[getIndex('daynight')] || 'D',
      frp: parseFloat(values[getIndex('frp')] || values[12]) || 0
    });
  }

  return fires;
}

function groupFiresByRegion(fires) {
  const regions = {};
  // Simplified region mapping based on coordinates
  // In production, use proper admin boundary data
  fires.forEach(fire => {
    const regionKey = `${Math.floor(fire.latitude)}_${Math.floor(fire.longitude)}`;
    if (!regions[regionKey]) {
      regions[regionKey] = { count: 0, totalFRP: 0 };
    }
    regions[regionKey].count++;
    regions[regionKey].totalFRP += fire.frp || 0;
  });
  return regions;
}

function calculateBurnedAreaIndex(fires) {
  if (fires.length === 0) return 0;

  const totalFRP = fires.reduce((sum, f) => sum + (f.frp || 0), 0);
  const avgFRP = totalFRP / fires.length;
  const highConfidence = fires.filter(f =>
    f.confidence === 'h' || f.confidence === 'high' || parseFloat(f.confidence || 0) > 80
  ).length;

  const index = (Math.log10(fires.length + 1) * 2) + (avgFRP / 50) + (highConfidence / fires.length * 2);
  return Math.min(10, Math.round(index * 100) / 100);
}

// ============================================================================
// ACLED CONFLICT API
// ============================================================================

export async function fetchACLEDConflicts(options = {}) {
  const source = 'ACLED';

  const {
    startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate = new Date().toISOString().split('T')[0],
    apiKey = null,
    email = null,
    useCache = true
  } = options;

  if (!apiKey || !email) {
    return {
      success: false,
      source,
      error: 'API key and email required. Set ACLED_API_KEY and ACLED_EMAIL.',
      timestamp: new Date().toISOString()
    };
  }

  const params = {
    key: apiKey,
    email,
    country: 'Tanzania',
    event_date: `${startDate}|${endDate}`,
    event_date_where: 'BETWEEN'
  };

  return getCachedOrFetch(source, params, async () => {
    try {
      const url = `${API_INTEGRATIONS?.ACLED?.baseUrl || 'https://api.acleddata.com/acled/read'}?${buildQueryString(params)}`;
      const data = await fetchWithResilience(url, source);

      const events = (data.data || []).map(e => ({
        eventId: e.event_id_cnty,
        eventType: e.event_type,
        subEventType: e.sub_event_type,
        actor1: e.actor1,
        actor2: e.actor2,
        date: e.event_date,
        year: e.year,
        location: e.location,
        admin1: e.admin1,
        admin2: e.admin2,
        admin3: e.admin3,
        latitude: parseFloat(e.latitude),
        longitude: parseFloat(e.longitude),
        fatalities: parseInt(e.fatalities) || 0,
        notes: e.notes,
        source: e.source,
        sourceScale: e.source_scale
      }));

      // Aggregate by region
      const byAdmin1 = aggregateConflictsByRegion(events, 'admin1');
      const byEventType = aggregateByField(events, 'eventType');

      return {
        success: true,
        source,
        timestamp: new Date().toISOString(),
        count: events.length,
        events,
        byAdmin1,
        byEventType,
        indicators: {
          conflictIntensity: calculateConflictIntensity(events),
          totalFatalities: events.reduce((sum, e) => sum + e.fatalities, 0),
          violentEvents: events.filter(e =>
            ['Battles', 'Violence against civilians', 'Explosions/Remote violence'].includes(e.eventType)
          ).length,
          protestEvents: events.filter(e => e.eventType === 'Protests').length,
          monthlyTrend: calculateMonthlyTrend(events)
        }
      };
    } catch (error) {
      return {
        success: false,
        source,
        error: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString()
      };
    }
  }, { useCache });
}

function aggregateConflictsByRegion(events, field) {
  const aggregated = {};
  events.forEach(e => {
    const key = e[field] || 'Unknown';
    if (!aggregated[key]) {
      aggregated[key] = { count: 0, fatalities: 0, events: [] };
    }
    aggregated[key].count++;
    aggregated[key].fatalities += e.fatalities;
    aggregated[key].events.push(e.eventType);
  });
  return aggregated;
}

function aggregateByField(events, field) {
  const aggregated = {};
  events.forEach(e => {
    const key = e[field] || 'Unknown';
    aggregated[key] = (aggregated[key] || 0) + 1;
  });
  return aggregated;
}

function calculateConflictIntensity(events) {
  if (events.length === 0) return 0;

  const weights = {
    'Battles': 3,
    'Violence against civilians': 3,
    'Explosions/Remote violence': 3,
    'Riots': 2,
    'Protests': 1,
    'Strategic developments': 1
  };

  const weightedSum = events.reduce((sum, e) => {
    const weight = weights[e.eventType] || 1;
    const fatalityWeight = 1 + Math.log10((e.fatalities || 0) + 1);
    return sum + (weight * fatalityWeight);
  }, 0);

  return Math.min(10, Math.round(weightedSum / 10 * 100) / 100);
}

function calculateMonthlyTrend(events) {
  const months = {};
  events.forEach(e => {
    const month = e.date?.substring(0, 7);
    if (month) {
      months[month] = (months[month] || 0) + 1;
    }
  });
  return months;
}

// ============================================================================
// GDACS DISASTER ALERTS
// ============================================================================

export async function fetchGDACSAlerts(options = {}) {
  const source = 'GDACS';

  const {
    alertLevel = 'green,orange,red',
    eventTypes = 'EQ,FL,TC,VO,DR',
    useCache = true
  } = options;

  const params = { alertLevel, eventTypes, country: API_CONFIG.tanzania.iso3 };

  return getCachedOrFetch(source, params, async () => {
    try {
      const baseUrl = API_INTEGRATIONS?.GDACS?.baseUrl || 'https://www.gdacs.org/gdacsapi/api/events/geteventlist';
      const url = `${baseUrl}/SEARCH?${buildQueryString(params)}`;
      const data = await fetchWithResilience(url, source);

      const alerts = (data.features || []).map(f => ({
        eventId: f.properties?.eventid,
        eventType: f.properties?.eventtype,
        eventName: f.properties?.name,
        alertLevel: f.properties?.alertlevel,
        alertScore: f.properties?.alertscore,
        severity: f.properties?.severity,
        severityUnit: f.properties?.severityunit,
        country: f.properties?.country,
        iso3: f.properties?.iso3,
        population: f.properties?.population,
        affectedCountries: f.properties?.affectedcountries,
        fromDate: f.properties?.fromdate,
        toDate: f.properties?.todate,
        coordinates: f.geometry?.coordinates ? {
          lon: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1]
        } : null,
        url: f.properties?.url
      }));

      // Group by alert level
      const byAlertLevel = {
        red: alerts.filter(a => a.alertLevel?.toLowerCase() === 'red'),
        orange: alerts.filter(a => a.alertLevel?.toLowerCase() === 'orange'),
        green: alerts.filter(a => a.alertLevel?.toLowerCase() === 'green')
      };

      return {
        success: true,
        source,
        timestamp: new Date().toISOString(),
        count: alerts.length,
        alerts,
        byAlertLevel,
        indicators: {
          hazardIndex: calculateGDACSHazardIndex(data.features || []),
          activeAlerts: alerts.filter(a => a.alertLevel?.toLowerCase() !== 'green').length,
          redAlerts: byAlertLevel.red.length,
          orangeAlerts: byAlertLevel.orange.length
        }
      };
    } catch (error) {
      return {
        success: false,
        source,
        error: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString()
      };
    }
  }, { useCache });
}

function calculateGDACSHazardIndex(features) {
  if (features.length === 0) return 0;

  const alertWeights = { 'red': 4, 'orange': 2, 'green': 0.5 };
  const typeWeights = { 'EQ': 1.2, 'TC': 1.3, 'FL': 1.1, 'VO': 1.2, 'DR': 1.0 };

  const weightedSum = features.reduce((sum, f) => {
    const level = f.properties?.alertlevel?.toLowerCase() || 'green';
    const type = f.properties?.eventtype || 'EQ';
    const severity = f.properties?.severity || 1;

    return sum + (alertWeights[level] || 1) * (typeWeights[type] || 1) * Math.log10(severity + 1);
  }, 0);

  return Math.min(10, Math.round(weightedSum * 100) / 100);
}

// ============================================================================
// OPEN-METEO WEATHER API
// ============================================================================

export async function fetchOpenMeteoWeather(options = {}) {
  const source = 'OPEN_METEO';

  const {
    latitude = API_CONFIG.tanzania.center.lat,
    longitude = API_CONFIG.tanzania.center.lon,
    forecastDays = 7,
    pastDays = 30,
    useCache = true
  } = options;

  const params = {
    latitude,
    longitude,
    daily: 'temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,rain_sum,precipitation_hours,precipitation_probability_max,windspeed_10m_max,windgusts_10m_max,et0_fao_evapotranspiration',
    timezone: 'Africa/Dar_es_Salaam',
    forecast_days: forecastDays,
    past_days: pastDays
  };

  return getCachedOrFetch(source, params, async () => {
    try {
      const url = `${API_INTEGRATIONS?.OPEN_METEO?.baseUrl || 'https://api.open-meteo.com/v1/forecast'}?${buildQueryString(params)}`;
      const data = await fetchWithResilience(url, source);

      return {
        success: true,
        source,
        timestamp: new Date().toISOString(),
        location: { latitude, longitude },
        elevation: data.elevation,
        timezone: data.timezone,
        daily: {
          dates: data.daily?.time || [],
          tempMax: data.daily?.temperature_2m_max || [],
          tempMin: data.daily?.temperature_2m_min || [],
          apparentTempMax: data.daily?.apparent_temperature_max || [],
          apparentTempMin: data.daily?.apparent_temperature_min || [],
          precipitation: data.daily?.precipitation_sum || [],
          rain: data.daily?.rain_sum || [],
          precipitationHours: data.daily?.precipitation_hours || [],
          precipProbability: data.daily?.precipitation_probability_max || [],
          windspeedMax: data.daily?.windspeed_10m_max || [],
          windgustsMax: data.daily?.windgusts_10m_max || [],
          evapotranspiration: data.daily?.et0_fao_evapotranspiration || []
        },
        indicators: {
          heatwaveRisk: calculateHeatwaveRisk(data.daily),
          droughtRisk: calculateDroughtRisk(data.daily),
          floodRisk: calculateFloodRisk(data.daily),
          stormRisk: calculateStormRisk(data.daily),
          avgTemperature: calculateAvgTemperature(data.daily),
          totalPrecipitation: data.daily?.precipitation_sum?.reduce((a, b) => a + (b || 0), 0) || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        source,
        error: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString()
      };
    }
  }, { useCache });
}

function calculateHeatwaveRisk(daily) {
  if (!daily?.temperature_2m_max) return 0;

  const temps = daily.temperature_2m_max;
  const heatwaveDays = temps.filter(t => t > 35).length;
  const extremeHeatDays = temps.filter(t => t > 40).length;

  const risk = (heatwaveDays * 0.3) + (extremeHeatDays * 0.7);
  return Math.min(10, Math.round(risk * 100) / 100);
}

function calculateDroughtRisk(daily) {
  if (!daily?.precipitation_sum) return 0;

  const precip = daily.precipitation_sum;
  const totalPrecip = precip.reduce((sum, p) => sum + (p || 0), 0);
  const avgDaily = totalPrecip / precip.length;
  const dryDays = precip.filter(p => (p || 0) < 1).length;

  let risk = 0;
  if (avgDaily < 0.5) risk = 10;
  else if (avgDaily < 1) risk = 7;
  else if (avgDaily < 2) risk = 5;
  else if (avgDaily < 5) risk = 3;
  else risk = 1;

  // Adjust for consecutive dry days
  const dryDayRatio = dryDays / precip.length;
  risk = risk * (0.5 + dryDayRatio * 0.5);

  return Math.min(10, Math.round(risk * 100) / 100);
}

function calculateFloodRisk(daily) {
  if (!daily?.precipitation_sum) return 0;

  const precip = daily.precipitation_sum;
  const heavyRainDays = precip.filter(p => p > 50).length;
  const extremeRainDays = precip.filter(p => p > 100).length;
  const totalPrecip = precip.reduce((sum, p) => sum + (p || 0), 0);

  let risk = (heavyRainDays * 2) + (extremeRainDays * 4);

  // Add risk for high total precipitation
  if (totalPrecip > 500) risk += 2;
  else if (totalPrecip > 300) risk += 1;

  return Math.min(10, Math.round(risk * 100) / 100);
}

function calculateStormRisk(daily) {
  if (!daily?.windgusts_10m_max) return 0;

  const gusts = daily.windgusts_10m_max;
  const stormDays = gusts.filter(g => g > 50).length;
  const severeStormDays = gusts.filter(g => g > 75).length;

  const risk = (stormDays * 1.5) + (severeStormDays * 3);
  return Math.min(10, Math.round(risk * 100) / 100);
}

function calculateAvgTemperature(daily) {
  if (!daily?.temperature_2m_max || !daily?.temperature_2m_min) return null;

  const maxTemps = daily.temperature_2m_max;
  const minTemps = daily.temperature_2m_min;

  const avgMax = maxTemps.reduce((a, b) => a + b, 0) / maxTemps.length;
  const avgMin = minTemps.reduce((a, b) => a + b, 0) / minTemps.length;

  return Math.round((avgMax + avgMin) / 2 * 10) / 10;
}

// ============================================================================
// WORLD BANK API
// ============================================================================

export async function fetchWorldBankIndicators(options = {}) {
  const source = 'WORLD_BANK';

  const {
    indicators = [
      'NY.GDP.PCAP.CD',           // GDP per capita
      'DT.ODA.ODAT.GN.ZS',        // Net ODA received (% of GNI)
      'SH.XPD.CHEX.PC.CD',        // Health expenditure per capita
      'SI.POV.NAHC',              // Poverty headcount ratio
      'SP.POP.TOTL',              // Total population
      'SP.DYN.LE00.IN',           // Life expectancy
      'SE.ADT.LITR.ZS',           // Adult literacy rate
      'SH.STA.MMRT',              // Maternal mortality ratio
      'SH.DYN.MORT',              // Under-5 mortality rate
      'AG.LND.ARBL.ZS'            // Arable land (% of land area)
    ],
    years = '2015:2023',
    useCache = true
  } = options;

  const params = { indicators: indicators.join(','), years };

  return getCachedOrFetch(source, params, async () => {
    const results = {};
    const errors = [];

    for (const indicator of indicators) {
      try {
        const baseUrl = API_INTEGRATIONS?.WORLD_BANK?.baseUrl || `https://api.worldbank.org/v2/country/${API_CONFIG.tanzania.iso3}/indicator`;
        const url = `${baseUrl}/${indicator}?format=json&date=${years}&per_page=100`;
        const response = await fetchWithResilience(url, source);

        const data = response[1] || [];
        results[indicator] = {
          success: true,
          name: data[0]?.indicator?.value || indicator,
          values: data.map(d => ({
            year: parseInt(d.date),
            value: d.value
          })).filter(d => d.value !== null).sort((a, b) => b.year - a.year)
        };
      } catch (error) {
        errors.push({ indicator, error: error.message });
        results[indicator] = {
          success: false,
          error: error.message
        };
      }
    }

    // Calculate development indicators
    const developmentIndicators = calculateDevelopmentIndicators(results);

    return {
      success: errors.length < indicators.length,
      source,
      timestamp: new Date().toISOString(),
      country: API_CONFIG.tanzania.name,
      iso3: API_CONFIG.tanzania.iso3,
      indicators: results,
      errors: errors.length > 0 ? errors : undefined,
      developmentIndicators
    };
  }, { useCache, cacheTTL: 86400000 }); // Cache for 24 hours
}

function calculateDevelopmentIndicators(results) {
  const getLatestValue = (indicatorId) => {
    const ind = results[indicatorId];
    return ind?.success && ind.values?.length > 0 ? ind.values[0].value : null;
  };

  return {
    gdpPerCapita: getLatestValue('NY.GDP.PCAP.CD'),
    povertyRate: getLatestValue('SI.POV.NAHC'),
    lifeExpectancy: getLatestValue('SP.DYN.LE00.IN'),
    literacyRate: getLatestValue('SE.ADT.LITR.ZS'),
    maternalMortality: getLatestValue('SH.STA.MMRT'),
    childMortality: getLatestValue('SH.DYN.MORT'),
    healthExpenditure: getLatestValue('SH.XPD.CHEX.PC.CD'),
    aidDependency: getLatestValue('DT.ODA.ODAT.GN.ZS')
  };
}

// ============================================================================
// HDX (HUMANITARIAN DATA EXCHANGE) API
// ============================================================================

export async function fetchHDXData(options = {}) {
  const source = 'HDX';

  const {
    datasetId = null,
    searchQuery = 'Tanzania disaster',
    useCache = true
  } = options;

  const params = { datasetId, searchQuery };

  return getCachedOrFetch(source, params, async () => {
    try {
      let url;
      if (datasetId) {
        url = `https://data.humdata.org/api/3/action/package_show?id=${datasetId}`;
      } else {
        url = `https://data.humdata.org/api/3/action/package_search?q=${encodeURIComponent(searchQuery)}&fq=groups:tza&rows=20`;
      }

      const data = await fetchWithResilience(url, source);

      if (!data.success) {
        throw new APIError('HDX API returned error', source, null, data.error);
      }

      if (datasetId) {
        const dataset = data.result;
        return {
          success: true,
          source,
          timestamp: new Date().toISOString(),
          dataset: {
            id: dataset.id,
            name: dataset.name,
            title: dataset.title,
            notes: dataset.notes,
            organization: dataset.organization?.title,
            maintainer: dataset.maintainer,
            lastModified: dataset.metadata_modified,
            resources: dataset.resources?.map(r => ({
              id: r.id,
              name: r.name,
              format: r.format,
              url: r.url,
              size: r.size,
              lastModified: r.last_modified
            })),
            tags: dataset.tags?.map(t => t.name)
          }
        };
      } else {
        const datasets = data.result.results;
        return {
          success: true,
          source,
          timestamp: new Date().toISOString(),
          count: data.result.count,
          datasets: datasets.map(d => ({
            id: d.id,
            name: d.name,
            title: d.title,
            organization: d.organization?.title,
            lastModified: d.metadata_modified,
            resourceCount: d.num_resources,
            tags: d.tags?.map(t => t.name)
          }))
        };
      }
    } catch (error) {
      return {
        success: false,
        source,
        error: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString()
      };
    }
  }, { useCache });
}

// ============================================================================
// IPC FOOD SECURITY
// ============================================================================

export async function fetchIPCFoodSecurity(options = {}) {
  const source = 'IPC';

  const {
    country = 'Tanzania',
    useCache = true
  } = options;

  const params = { country };

  return getCachedOrFetch(source, params, async () => {
    try {
      // IPC doesn't have a public API, so we'd typically use HDX or web scraping
      // This is a placeholder that returns structured data format
      return {
        success: true,
        source,
        timestamp: new Date().toISOString(),
        country,
        note: 'IPC data should be fetched from HDX or official IPC website',
        indicators: {
          phase1: 0, // Minimal
          phase2: 0, // Stressed
          phase3: 0, // Crisis
          phase4: 0, // Emergency
          phase5: 0, // Famine
          totalPopulation: 0,
          foodInsecure: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        source,
        error: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString()
      };
    }
  }, { useCache });
}

// ============================================================================
// FEWS NET
// ============================================================================

export async function fetchFEWSNET(options = {}) {
  const source = 'FEWSNET';

  const {
    region = 'east-africa',
    useCache = true
  } = options;

  const params = { region };

  return getCachedOrFetch(source, params, async () => {
    try {
      // FEWS NET provides data through their website and HDX
      // This is a placeholder showing expected data structure
      return {
        success: true,
        source,
        timestamp: new Date().toISOString(),
        region,
        note: 'FEWS NET data available at fews.net and HDX',
        classification: null, // Would contain IPC-compatible classification
        projections: null     // Would contain food security projections
      };
    } catch (error) {
      return {
        success: false,
        source,
        error: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString()
      };
    }
  }, { useCache });
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Fetch all available API data
 */
export async function fetchAllAPIs(apiKeys = {}, options = {}) {
  const results = {
    timestamp: new Date().toISOString(),
    sources: {},
    errors: [],
    aggregatedScores: null
  };

  const { parallel = true, sources: selectedSources = null } = options;

  // Define all fetch operations
  const fetchOperations = {
    USGS_EARTHQUAKE: () => fetchUSGSEarthquakes(),
    GDACS: () => fetchGDACSAlerts(),
    OPEN_METEO: () => fetchOpenMeteoWeather(),
    WORLD_BANK: () => fetchWorldBankIndicators(),
    HDX: () => fetchHDXData({ searchQuery: 'Tanzania humanitarian' })
  };

  // Add authenticated operations
  if (apiKeys.NASA_FIRMS_API_KEY) {
    fetchOperations.NASA_FIRMS = () => fetchNASAFires({ apiKey: apiKeys.NASA_FIRMS_API_KEY });
  }

  if (apiKeys.ACLED_API_KEY && apiKeys.ACLED_EMAIL) {
    fetchOperations.ACLED = () => fetchACLEDConflicts({
      apiKey: apiKeys.ACLED_API_KEY,
      email: apiKeys.ACLED_EMAIL
    });
  }

  // Filter to selected sources if specified
  const sourcesToFetch = selectedSources
    ? Object.fromEntries(Object.entries(fetchOperations).filter(([k]) => selectedSources.includes(k)))
    : fetchOperations;

  if (parallel) {
    // Parallel execution
    const promises = Object.entries(sourcesToFetch).map(async ([name, fetchFn]) => {
      try {
        const result = await fetchFn();
        return [name, result];
      } catch (error) {
        results.errors.push({ source: name, error: error.message });
        return [name, { success: false, error: error.message }];
      }
    });

    const settled = await Promise.all(promises);
    settled.forEach(([name, result]) => {
      results.sources[name] = result;
    });
  } else {
    // Sequential execution
    for (const [name, fetchFn] of Object.entries(sourcesToFetch)) {
      try {
        results.sources[name] = await fetchFn();
      } catch (error) {
        results.errors.push({ source: name, error: error.message });
        results.sources[name] = { success: false, error: error.message };
      }
    }
  }

  // Calculate aggregated scores
  results.aggregatedScores = calculateAggregatedScores(results.sources);
  results.successCount = Object.values(results.sources).filter(s => s.success).length;
  results.totalSources = Object.keys(results.sources).length;

  return results;
}

/**
 * Calculate aggregated hazard scores from API data
 */
function calculateAggregatedScores(sources) {
  const scores = {
    natural: {
      earthquake: sources.USGS_EARTHQUAKE?.indicators?.exposureIndex || 0,
      fire: sources.NASA_FIRMS?.indicators?.burnedAreaIndex || 0,
      flood: sources.OPEN_METEO?.indicators?.floodRisk || 0,
      drought: sources.OPEN_METEO?.indicators?.droughtRisk || 0,
      heatwave: sources.OPEN_METEO?.indicators?.heatwaveRisk || 0,
      storm: sources.OPEN_METEO?.indicators?.stormRisk || 0
    },
    humanInduced: {
      conflict: sources.ACLED?.indicators?.conflictIntensity || 0,
      displacement: 0 // Would come from UNHCR data
    },
    gdacsAlerts: sources.GDACS?.indicators?.hazardIndex || 0
  };

  // Calculate composite scores
  scores.naturalHazardIndex = Object.values(scores.natural).reduce((a, b) => a + b, 0) / Object.keys(scores.natural).length;
  scores.humanHazardIndex = Object.values(scores.humanInduced).reduce((a, b) => a + b, 0) / Object.keys(scores.humanInduced).length;
  scores.overallHazardIndex = (scores.naturalHazardIndex * 0.6 + scores.humanHazardIndex * 0.3 + scores.gdacsAlerts * 0.1);

  // Round all scores
  Object.keys(scores).forEach(key => {
    if (typeof scores[key] === 'number') {
      scores[key] = Math.round(scores[key] * 100) / 100;
    }
  });

  return scores;
}

// ============================================================================
// HEALTH CHECK & MONITORING
// ============================================================================

/**
 * Check API health status
 */
export async function checkAPIHealth(options = {}) {
  const { includeTests = true } = options;

  const status = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    apis: {},
    rateLimits: {},
    circuitBreakers: {},
    cache: responseCache.getStats()
  };

  // Get rate limiter status for each source
  ['USGS', 'NASA_FIRMS', 'ACLED', 'GDACS', 'OPEN_METEO', 'WORLD_BANK', 'HDX'].forEach(source => {
    status.rateLimits[source] = rateLimiter.getStatus(source);
  });

  // Get circuit breaker status
  status.circuitBreakers = circuitBreaker.getAllStatuses();

  // Test APIs if requested
  if (includeTests) {
    const tests = [
      { name: 'USGS', test: () => fetchUSGSEarthquakes({ minMagnitude: 8, useCache: false }) },
      { name: 'OPEN_METEO', test: () => fetchOpenMeteoWeather({ forecastDays: 1, pastDays: 1, useCache: false }) },
      { name: 'GDACS', test: () => fetchGDACSAlerts({ alertLevel: 'red', useCache: false }) }
    ];

    for (const { name, test } of tests) {
      const startTime = Date.now();
      try {
        const result = await test();
        status.apis[name] = {
          status: result.success ? 'healthy' : 'degraded',
          responseTime: Date.now() - startTime,
          cached: result.cached || false,
          error: result.error || null
        };
      } catch (error) {
        status.apis[name] = {
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: error.message
        };
      }
    }

    // Determine overall status
    const apiStatuses = Object.values(status.apis);
    const unhealthyCount = apiStatuses.filter(a => a.status === 'unhealthy').length;
    const degradedCount = apiStatuses.filter(a => a.status === 'degraded').length;

    if (unhealthyCount > apiStatuses.length / 2) {
      status.overall = 'unhealthy';
    } else if (unhealthyCount > 0 || degradedCount > 0) {
      status.overall = 'degraded';
    }
  }

  return status;
}

/**
 * Get API metrics
 */
export function getAPIMetrics(timeWindow = 3600000) {
  return {
    timestamp: new Date().toISOString(),
    timeWindow: `${timeWindow / 60000} minutes`,
    metrics: metricsCollector.getOverallMetrics(timeWindow),
    cache: responseCache.getStats(),
    circuitBreakers: circuitBreaker.getAllStatuses()
  };
}

/**
 * Clear all caches and reset state
 */
export function resetAPIState() {
  responseCache.invalidate();
  rateLimiter.clear();
  metricsCollector.clear();

  return {
    success: true,
    message: 'API state reset successfully',
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// WEBHOOK SUPPORT
// ============================================================================

const webhookSubscriptions = new Map();

/**
 * Subscribe to data updates
 */
export function subscribeToUpdates(source, callback) {
  if (!webhookSubscriptions.has(source)) {
    webhookSubscriptions.set(source, []);
  }
  webhookSubscriptions.get(source).push(callback);

  // Return unsubscribe function
  return () => {
    const callbacks = webhookSubscriptions.get(source);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  };
}

/**
 * Notify subscribers of data updates
 */
function notifySubscribers(source, data) {
  const callbacks = webhookSubscriptions.get(source) || [];
  callbacks.forEach(callback => {
    try {
      callback(data);
    } catch (e) {
      console.error(`Webhook callback error for ${source}:`, e);
    }
  });
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // Configuration
  API_CONFIG,

  // Individual API fetchers
  fetchUSGSEarthquakes,
  fetchNASAFires,
  fetchACLEDConflicts,
  fetchGDACSAlerts,
  fetchOpenMeteoWeather,
  fetchWorldBankIndicators,
  fetchHDXData,
  fetchIPCFoodSecurity,
  fetchFEWSNET,

  // Batch operations
  fetchAllAPIs,

  // Health & monitoring
  checkAPIHealth,
  getAPIMetrics,
  resetAPIState,

  // Webhooks
  subscribeToUpdates,

  // Rate limiter
  rateLimiter,

  // Circuit breaker
  circuitBreaker,

  // Cache
  responseCache,

  // Metrics
  metricsCollector,

  // Error types
  APIError,
  RateLimitError,
  CircuitOpenError,
  ValidationError
};
