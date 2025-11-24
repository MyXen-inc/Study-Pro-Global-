const crypto = require('crypto');

// Generate UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Calculate profile completion percentage
function calculateProfileCompletion(user) {
  const fields = [
    'full_name',
    'email',
    'country',
    'academic_level',
    'phone',
    'address',
    'date_of_birth'
  ];

  const completed = fields.filter(field => user[field] && user[field] !== '').length;
  return Math.round((completed / fields.length) * 100);
}

// Format date to MySQL datetime
function formatDateTime(date) {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

// Add years to date
function addYears(date, years) {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function isValidPassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Sanitize user object (remove sensitive data)
function sanitizeUser(user) {
  const { password, ...sanitized } = user;
  return sanitized;
}

// Get subscription features
function getSubscriptionFeatures(planId) {
  const plans = {
    free: {
      applications: 3,
      universities: 'limited',
      regions: [],
      aiSupport: 'basic',
      autoScholarshipMatch: false,
      premiumSupport: false
    },
    asia: {
      applications: 5,
      universities: 'full',
      regions: ['Asia'],
      aiSupport: 'full',
      autoScholarshipMatch: false,
      premiumSupport: false
    },
    europe: {
      applications: 5,
      universities: 'full',
      regions: ['Europe'],
      aiSupport: 'full',
      autoScholarshipMatch: false,
      premiumSupport: false
    },
    global: {
      applications: 'unlimited',
      universities: 'full',
      regions: ['Asia', 'Europe', 'North America', 'UK', 'Australia'],
      aiSupport: 'premium',
      autoScholarshipMatch: true,
      premiumSupport: true,
      ukBonus: true
    }
  };

  return plans[planId] || plans.free;
}

// Error response helper
function errorResponse(res, statusCode, code, message, details = {}) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...details
    }
  });
}

// Success response helper
function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data
  });
}

module.exports = {
  generateUUID,
  calculateProfileCompletion,
  formatDateTime,
  addYears,
  isValidEmail,
  isValidPassword,
  sanitizeUser,
  getSubscriptionFeatures,
  errorResponse,
  successResponse
};
