/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error types
 */
const ErrorTypes = {
  BAD_REQUEST: (message, details = {}) => new APIError(message || 'Bad request', 400, 'BAD_REQUEST', details),
  UNAUTHORIZED: (message) => new APIError(message || 'Unauthorized', 401, 'UNAUTHORIZED'),
  FORBIDDEN: (message) => new APIError(message || 'Forbidden', 403, 'FORBIDDEN'),
  NOT_FOUND: (message) => new APIError(message || 'Resource not found', 404, 'NOT_FOUND'),
  CONFLICT: (message) => new APIError(message || 'Conflict', 409, 'CONFLICT'),
  VALIDATION_ERROR: (message, details = {}) => new APIError(message || 'Validation error', 422, 'VALIDATION_ERROR', details),
  INTERNAL_ERROR: (message) => new APIError(message || 'Internal server error', 500, 'INTERNAL_ERROR'),
  SERVICE_UNAVAILABLE: (message) => new APIError(message || 'Service unavailable', 503, 'SERVICE_UNAVAILABLE')
};

/**
 * Async handler wrapper to avoid try-catch in every route
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found handler - 404 for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = ErrorTypes.NOT_FOUND(`Endpoint not found: ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Global error handler middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error values
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'A record with this value already exists';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    code = 'FOREIGN_KEY_ERROR';
    message = 'Referenced resource does not exist';
  }

  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  }

  // Build error response
  const errorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(err.details && Object.keys(err.details).length > 0 && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  };

  // Add request ID for tracking (if available)
  if (req.requestId) {
    errorResponse.error.requestId = req.requestId;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Request ID middleware
 */
const addRequestId = (req, res, next) => {
  req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

module.exports = {
  APIError,
  ErrorTypes,
  asyncHandler,
  notFoundHandler,
  globalErrorHandler,
  addRequestId
};
