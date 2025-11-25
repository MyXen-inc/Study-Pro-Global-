/**
 * Study Pro Global - Frontend Configuration
 * API and application configuration settings
 */

const CONFIG = {
  // API Configuration
  API: {
    // Base URL for the API - change this for production
    BASE_URL: window.location.hostname === 'localhost' 
      ? 'http://localhost:3000/api/v1'
      : 'https://www.studyproglobal.com.bd/api/v1',
    
    // Request timeout in milliseconds
    TIMEOUT: 30000,
    
    // API version
    VERSION: 'v1'
  },

  // Authentication Configuration
  AUTH: {
    // Token storage key in localStorage
    TOKEN_KEY: 'studypro_token',
    
    // User data storage key
    USER_KEY: 'studypro_user',
    
    // Token refresh threshold (refresh when less than 1 hour remaining)
    REFRESH_THRESHOLD: 3600000
  },

  // Payment Configuration
  PAYMENT: {
    // $myxn Token wallet address for crypto payments
    CRYPTO_WALLET: 'CHXoAEvTi3FAEZMkWDJJmUSRXxYAoeco4bDMDZQJVWen',
    
    // Supported payment methods
    METHODS: {
      CRYPTO: 'myxn_token',
      CARD: 'credit_card'
    }
  },

  // Application Settings
  APP: {
    NAME: 'Study Pro Global',
    VERSION: '1.0.0',
    DEFAULT_LANGUAGE: 'en',
    
    // Pagination defaults
    ITEMS_PER_PAGE: 10,
    
    // Free tier limits
    FREE_APPLICATIONS: 3,
    FREE_UNIVERSITY_RESULTS: 5
  },

  // Feature Flags
  FEATURES: {
    AI_CHAT: true,
    CRYPTO_PAYMENT: true,
    AUTO_SCHOLARSHIP_MATCHING: true
  },

  // Subscription Plans
  PLANS: {
    FREE: {
      id: 'free',
      name: 'Free',
      price: 0,
      applications: 3,
      features: ['Basic AI Support', 'Limited University Search', '3 Applications']
    },
    ASIA: {
      id: 'asia',
      name: 'Country Focus Pack (Asia)',
      price: 25,
      applications: 5,
      features: ['Asian Universities', 'Full AI Support', '5 Applications', 'Scholarship Access']
    },
    EUROPE: {
      id: 'europe',
      name: 'Country Focus Pack (Europe)',
      price: 50,
      applications: 5,
      features: ['European Universities', 'Full AI Support', '5 Applications', 'Scholarship Access']
    },
    GLOBAL: {
      id: 'global',
      name: 'Global Application Pack',
      price: 100,
      applications: 'unlimited',
      features: ['Worldwide Access', 'Premium Support', 'Unlimited Applications', 'Auto Scholarship Matching', 'Interview Support']
    }
  },

  // Countries list for forms
  COUNTRIES: [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
    'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'China', 'Colombia',
    'Denmark', 'Egypt', 'Ethiopia', 'Finland', 'France', 'Germany', 'Ghana',
    'Greece', 'Hong Kong', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Italy', 'Japan', 'Jordan', 'Kenya', 'Kuwait', 'Lebanon', 'Malaysia',
    'Mexico', 'Morocco', 'Nepal', 'Netherlands', 'New Zealand', 'Nigeria',
    'Norway', 'Oman', 'Pakistan', 'Philippines', 'Poland', 'Portugal', 'Qatar',
    'Russia', 'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea', 'Spain',
    'Sri Lanka', 'Sweden', 'Switzerland', 'Taiwan', 'Thailand', 'Turkey', 'UAE',
    'UK', 'USA', 'Ukraine', 'Vietnam'
  ],

  // Academic Levels
  ACADEMIC_LEVELS: [
    { value: 'highschool', label: 'High School' },
    { value: 'bachelor', label: "Bachelor's" },
    { value: 'master', label: "Master's" },
    { value: 'phd', label: 'PhD' }
  ],

  // Study Destinations
  DESTINATIONS: [
    { value: 'usa', label: 'United States', flag: '🇺🇸' },
    { value: 'uk', label: 'United Kingdom', flag: '🇬🇧' },
    { value: 'canada', label: 'Canada', flag: '🇨🇦' },
    { value: 'australia', label: 'Australia', flag: '🇦🇺' },
    { value: 'germany', label: 'Germany', flag: '🇩🇪' },
    { value: 'france', label: 'France', flag: '🇫🇷' },
    { value: 'netherlands', label: 'Netherlands', flag: '🇳🇱' },
    { value: 'singapore', label: 'Singapore', flag: '🇸🇬' },
    { value: 'japan', label: 'Japan', flag: '🇯🇵' },
    { value: 'south-korea', label: 'South Korea', flag: '🇰🇷' }
  ]
};

// Freeze configuration to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.AUTH);
Object.freeze(CONFIG.PAYMENT);
Object.freeze(CONFIG.APP);
Object.freeze(CONFIG.FEATURES);
Object.freeze(CONFIG.PLANS);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
