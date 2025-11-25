/**
 * Study Pro Global - Frontend Configuration
 * 
 * Centralized configuration for API endpoints and application settings
 */

const CONFIG = {
  API: {
    BASE_URL: window.location.hostname === 'localhost' 
      ? 'http://localhost:3000/api/v1'
      : 'https://api.studyproglobal.com.bd/api/v1',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3
  },
  
  STORAGE: {
    TOKEN_KEY: 'studypro_token',
    USER_KEY: 'studypro_user'
  },
  
  APP: {
    NAME: 'Study Pro Global',
    VERSION: '1.0.0',
    SUPPORT_EMAIL: 'info@studyproglobal.com.bd'
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
