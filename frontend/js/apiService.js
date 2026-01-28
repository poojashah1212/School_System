/**
 * API Service - Reusable API call handler
 * Handles token retrieval, headers, fetch logic, and error handling
 */
class ApiService {
    constructor() {
        this.baseUrl = '';
    }

    /**
     * Set the base URL for API calls
     * @param {string} url - Base URL for API endpoints
     */
    setBaseUrl(url) {
        this.baseUrl = url;
    }

    /**
     * Get authorization headers with token
     * @returns {Object} Headers object with Authorization
     */
    getAuthHeaders() {
        const token = localStorage.getItem('token');
        const headers = {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    /**
     * Make API request with common error handling
     * @param {string} endpoint - API endpoint (relative to base URL)
     * @param {Object} options - Fetch options (method, headers, body, etc.)
     * @returns {Promise} Response data
     */
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        
        // Merge default options with provided options
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
                ...options.headers
            }
        };

        const fetchOptions = {
            ...defaultOptions,
            ...options,
            headers: defaultOptions.headers
        };

        try {
            const response = await fetch(url, fetchOptions);
            
            // Handle 401 Unauthorized - token expired or invalid
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '../html/login.html';
                throw new Error('Session expired. Please login again.');
            }

            // Handle other HTTP errors
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // If response is not JSON, use default error message
                }
                
                throw new Error(errorMessage);
            }

            // Parse JSON response
            const data = await response.json();
            return data;

        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    /**
     * GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Additional fetch options
     * @returns {Promise} Response data
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options
        });
    }

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @param {Object} options - Additional fetch options
     * @returns {Promise} Response data
     */
    async post(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
            ...options
        });
    }

    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @param {Object} options - Additional fetch options
     * @returns {Promise} Response data
     */
    async put(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
            ...options
        });
    }

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Additional fetch options
     * @returns {Promise} Response data
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options
        });
    }

    /**
     * POST request with FormData (for file uploads)
     * @param {string} endpoint - API endpoint
     * @param {FormData} formData - FormData object
     * @param {Object} options - Additional fetch options
     * @returns {Promise} Response data
     */
    async postFormData(endpoint, formData, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers
                // Don't set Content-Type for FormData - browser sets it automatically
            },
            ...options
        });
    }

    /**
     * PUT request with FormData (for file uploads)
     * @param {string} endpoint - API endpoint
     * @param {FormData} formData - FormData object
     * @param {Object} options - Additional fetch options
     * @returns {Promise} Response data
     */
    async putFormData(endpoint, formData, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: formData,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers
                // Don't set Content-Type for FormData - browser sets it automatically
            },
            ...options
        });
    }
}

// Create singleton instance
const apiService = new ApiService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = apiService;
} else {
    window.apiService = apiService;
}
