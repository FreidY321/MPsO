/**
 * API Wrapper Module
 * Provides a centralized interface for all API calls with automatic JWT token handling
 * Requirements: 8.1, 10.2
 */

const API_CONFIG = {
  baseURL: 'http://localhost:3000/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * Get JWT token from localStorage
 */
function getAuthToken() {
  return localStorage.getItem('authToken');
}

/**
 * Build headers with authentication token
 */
function buildHeaders(customHeaders = {}) {
  const headers = { ...API_CONFIG.headers, ...customHeaders };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Handle API response
 * @param {Response} response - Fetch API response object
 * @returns {Promise<any>} Parsed response data
 */
async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  
  // Parse JSON response
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  // Handle error responses
  if (!response.ok) {
    const error = new Error(data.error?.message || data.message || 'API request failed');
    error.status = response.status;
    error.data = data;
    
    // Handle authentication errors
    if (response.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('login.html')) {
        window.location.href = '/pages/login.html';
      }
    }
    
    throw error;
  }
  
  return data;
}

/**
 * Make API request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
async function request(endpoint, options = {}) {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  const config = {
    ...options,
    headers: buildHeaders(options.headers)
  };
  
  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
  config.signal = controller.signal;
  
  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    return await handleResponse(response);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server did not respond in time');
    }
    
    throw error;
  }
}

/**
 * API methods
 */
const api = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<any>}
   */
  get: async (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return request(url, {
      method: 'GET'
    });
  },
  
  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<any>}
   */
  post: async (endpoint, data = {}) => {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<any>}
   */
  put: async (endpoint, data = {}) => {
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>}
   */
  delete: async (endpoint) => {
    return request(endpoint, {
      method: 'DELETE'
    });
  },
  
  /**
   * POST request with FormData (for file uploads)
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data
   * @returns {Promise<any>}
   */
  postFormData: async (endpoint, formData) => {
    const token = getAuthToken();
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData - browser will set it with boundary
    return request(endpoint, {
      method: 'POST',
      headers,
      body: formData
    });
  },
  
  /**
   * Download file (e.g., PDF)
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Blob>}
   */
  downloadFile: async (endpoint) => {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    
    const headers = {};
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      const error = new Error('File download failed');
      error.status = response.status;
      throw error;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/pdf';
    const blob = new Blob([arrayBuffer], { type: contentType });
    return blob;
  }
};

// Export for use in other modules
window.api = api;

