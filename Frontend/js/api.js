/**
 * Study Pro Global - API Client
 * Handles all API communications with the backend
 */

const API = {
  /**
   * Make an API request
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {object} options - Fetch options
   * @returns {Promise<object>} - API response
   */
  async request(endpoint, options = {}) {
    const url = `${CONFIG.API.BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    // Add authorization header if token exists
    const token = Auth.getToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return { success: true, data: await response.text() };
      }

      const data = await response.json();

      // Handle API errors
      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401) {
          Auth.logout();
          window.location.href = '#login';
        }
        throw new APIError(data.error?.message || 'Request failed', data.error?.code, response.status);
      }

      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new APIError('Request timeout', 'TIMEOUT', 408);
      }

      if (error instanceof APIError) {
        throw error;
      }

      throw new APIError(error.message || 'Network error', 'NETWORK_ERROR', 0);
    }
  },

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = Object.keys(params).length 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request(`${endpoint}${queryString}`, { method: 'GET' });
  },

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // ========== Auth Endpoints ==========
  auth: {
    async register(userData) {
      return API.post('/auth/register', userData);
    },

    async login(credentials) {
      return API.post('/auth/login', credentials);
    },

    async logout() {
      return API.post('/auth/logout');
    },

    async getProfile() {
      return API.get('/auth/me');
    },

    async forgotPassword(email) {
      return API.post('/auth/forgot-password', { email });
    },

    async resetPassword(token, password) {
      return API.post('/auth/reset-password', { token, password });
    }
  },

  // ========== User Endpoints ==========
  users: {
    async getProfile() {
      return API.get('/users/profile');
    },

    async updateProfile(data) {
      return API.put('/users/profile', data);
    },

    async getDocuments() {
      return API.get('/users/documents');
    },

    async uploadDocument(formData) {
      const token = Auth.getToken();
      return fetch(`${CONFIG.API.BASE_URL}/users/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      }).then(r => r.json());
    }
  },

  // ========== University Endpoints ==========
  universities: {
    async search(params = {}) {
      return API.get('/universities/search', params);
    },

    async getById(id) {
      return API.get(`/universities/${id}`);
    },

    async getPrograms(id) {
      return API.get(`/universities/${id}/programs`);
    },

    async getCountries() {
      return API.get('/universities/filters/countries');
    }
  },

  // ========== Program Endpoints ==========
  programs: {
    async list(params = {}) {
      return API.get('/programs', params);
    },

    async search(params = {}) {
      return API.get('/programs/search', params);
    },

    async getById(id) {
      return API.get(`/programs/${id}`);
    },

    async getRequirements(id) {
      return API.get(`/programs/${id}/requirements`);
    }
  },

  // ========== Application Endpoints ==========
  applications: {
    async create(data) {
      return API.post('/applications', data);
    },

    async list(params = {}) {
      return API.get('/applications', params);
    },

    async getById(id) {
      return API.get(`/applications/${id}`);
    },

    async update(id, data) {
      return API.put(`/applications/${id}`, data);
    },

    async getStatus(id) {
      return API.get(`/applications/${id}/status`);
    }
  },

  // ========== Scholarship Endpoints ==========
  scholarships: {
    async list(params = {}) {
      return API.get('/scholarships', params);
    },

    async getById(id) {
      return API.get(`/scholarships/${id}`);
    },

    async getEligible() {
      return API.get('/scholarships/eligible');
    },

    async apply(id, data = {}) {
      return API.post(`/scholarships/${id}/apply`, data);
    },

    async autoMatch() {
      return API.post('/scholarships/auto-match');
    }
  },

  // ========== Course Endpoints ==========
  courses: {
    async list(params = {}) {
      return API.get('/courses', params);
    },

    async getById(id) {
      return API.get(`/courses/${id}`);
    },

    async enroll(id) {
      return API.post(`/courses/${id}/enroll`);
    },

    async getMyCourses() {
      return API.get('/courses/my/enrollments');
    }
  },

  // ========== Subscription Endpoints ==========
  subscriptions: {
    async getPlans() {
      return API.get('/subscriptions/plans');
    },

    async create(data) {
      return API.post('/subscriptions', data);
    },

    async getMySubscriptions() {
      return API.get('/subscriptions/my-subscriptions');
    },

    async activate(subscriptionId) {
      return API.post(`/subscriptions/${subscriptionId}/activate`);
    }
  },

  // ========== Payment Endpoints ==========
  payments: {
    async create(data) {
      return API.post('/payments/create', data);
    },

    async verify(data) {
      return API.post('/payments/verify', data);
    },

    async getHistory(params = {}) {
      return API.get('/payments/history', params);
    }
  },

  // ========== Consultation Endpoints ==========
  consultations: {
    async book(data) {
      return API.post('/consultations/book', data);
    },

    async list(params = {}) {
      return API.get('/consultations', params);
    },

    async getById(id) {
      return API.get(`/consultations/${id}`);
    },

    async reschedule(id, data) {
      return API.put(`/consultations/${id}/reschedule`, data);
    },

    async cancel(id) {
      return API.delete(`/consultations/${id}/cancel`);
    }
  },

  // ========== Support Endpoints ==========
  support: {
    async createTicket(data) {
      return API.post('/support/tickets', data);
    },

    async getTickets(params = {}) {
      return API.get('/support/tickets', params);
    },

    async getTicket(id) {
      return API.get(`/support/tickets/${id}`);
    },

    async replyToTicket(id, data) {
      return API.post(`/support/tickets/${id}/reply`, data);
    },

    async closeTicket(id) {
      return API.post(`/support/tickets/${id}/close`);
    }
  },

  // ========== Chat Endpoints ==========
  chat: {
    async sendMessage(data) {
      return API.post('/chat/message', data);
    },

    async getConversations(params = {}) {
      return API.get('/chat/conversations', params);
    },

    async getConversation(id) {
      return API.get(`/chat/conversations/${id}`);
    }
  }
};

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', status = 0) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API, APIError };
}
