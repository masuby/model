/**
 * API CLIENT - Connection to Go Backend
 *
 * Provides HTTP client for communicating with the INFORM Go backend API.
 * Handles authentication, request/response interceptors, and error handling.
 */

// API Configuration
const API_CONFIG = {
  // Base URL - uses Vite proxy in development, direct URL in production
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',

  // Request timeout in milliseconds (reduced for faster fallback)
  timeout: 5000,

  // Retry configuration (minimal retries for faster fallback to mock data)
  maxRetries: 1,
  retryDelay: 500
};

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// Track backend availability (prevents repeated failed requests)
let backendAvailable = null; // null = unknown, true = available, false = unavailable
let lastBackendCheck = 0;
const BACKEND_CHECK_INTERVAL = 30000; // Re-check every 30 seconds

/**
 * Check if backend is available (cached)
 */
export const isBackendAvailable = () => {
  const now = Date.now();
  if (backendAvailable !== null && (now - lastBackendCheck) < BACKEND_CHECK_INTERVAL) {
    return backendAvailable;
  }
  return null; // Unknown, needs check
};

/**
 * Mark backend as available/unavailable
 */
const setBackendStatus = (available) => {
  backendAvailable = available;
  lastBackendCheck = Date.now();
  if (!available) {
    console.log('ℹ️ Backend API unavailable - using local mock data');
  }
};

/**
 * Get authentication token from storage
 */
const getAuthToken = () => {
  return localStorage.getItem('inform_token');
};

/**
 * Set authentication token in storage
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('inform_token', token);
  } else {
    localStorage.removeItem('inform_token');
  }
};

/**
 * Build headers for API requests
 */
const buildHeaders = (customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');

  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    // Handle specific error cases
    if (response.status === 401) {
      // Clear token on unauthorized
      setAuthToken(null);
      localStorage.removeItem('inform_user');
      window.dispatchEvent(new CustomEvent('sessionTimeout'));
    }

    const errorMessage = data?.error || data?.message || `HTTP Error ${response.status}`;
    throw new APIError(errorMessage, response.status, data);
  }

  return data;
};

/**
 * Make HTTP request with retry logic
 */
const makeRequest = async (url, options, retries = 0) => {
  // Skip API call if backend is known to be unavailable (faster fallback)
  if (backendAvailable === false && (Date.now() - lastBackendCheck) < BACKEND_CHECK_INTERVAL) {
    throw new APIError('Backend unavailable', 0, null);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Backend is responding - mark as available
    setBackendStatus(true);

    return await handleResponse(response);

  } catch (error) {
    clearTimeout(timeoutId);

    // Check if this is a network/connection error (backend unavailable)
    if (error.name !== 'APIError') {
      // Mark backend as unavailable for faster subsequent fallbacks
      setBackendStatus(false);

      // Retry only once on network errors
      if (retries < API_CONFIG.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
        return makeRequest(url, options, retries + 1);
      }
    }

    throw error;
  }
};

/**
 * API Client object with HTTP methods
 */
const apiClient = {
  /**
   * GET request
   */
  get: async (endpoint, params = {}, headers = {}) => {
    const url = new URL(`${API_CONFIG.baseURL}${endpoint}`, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    return makeRequest(url.toString(), {
      method: 'GET',
      headers: buildHeaders(headers)
    });
  },

  /**
   * POST request
   */
  post: async (endpoint, data = {}, headers = {}) => {
    const url = `${API_CONFIG.baseURL}${endpoint}`;

    return makeRequest(url, {
      method: 'POST',
      headers: buildHeaders(headers),
      body: JSON.stringify(data)
    });
  },

  /**
   * PUT request
   */
  put: async (endpoint, data = {}, headers = {}) => {
    const url = `${API_CONFIG.baseURL}${endpoint}`;

    return makeRequest(url, {
      method: 'PUT',
      headers: buildHeaders(headers),
      body: JSON.stringify(data)
    });
  },

  /**
   * PATCH request
   */
  patch: async (endpoint, data = {}, headers = {}) => {
    const url = `${API_CONFIG.baseURL}${endpoint}`;

    return makeRequest(url, {
      method: 'PATCH',
      headers: buildHeaders(headers),
      body: JSON.stringify(data)
    });
  },

  /**
   * DELETE request
   */
  delete: async (endpoint, headers = {}) => {
    const url = `${API_CONFIG.baseURL}${endpoint}`;

    return makeRequest(url, {
      method: 'DELETE',
      headers: buildHeaders(headers)
    });
  },

  /**
   * Upload file
   */
  upload: async (endpoint, formData, headers = {}) => {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    const token = getAuthToken();

    const uploadHeaders = { ...headers };
    if (token) {
      uploadHeaders['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - browser will set it with boundary

    return makeRequest(url, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData
    });
  }
};

export default apiClient;

// Export individual methods for convenience
export const { get, post, put, patch, delete: del, upload } = apiClient;
