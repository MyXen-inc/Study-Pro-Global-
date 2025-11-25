const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Get current log level from environment
const getCurrentLevel = () => {
  const level = process.env.LOG_LEVEL || 'info';
  return LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : LOG_LEVELS.info;
};

// Format timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Format log message
const formatMessage = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

// Get color for log level
const getColor = (level) => {
  switch (level) {
    case 'error': return COLORS.red;
    case 'warn': return COLORS.yellow;
    case 'info': return COLORS.green;
    case 'http': return COLORS.cyan;
    case 'debug': return COLORS.gray;
    default: return COLORS.reset;
  }
};

// Write to file (if configured)
const writeToFile = (formattedMessage) => {
  const logFilePath = process.env.LOG_FILE_PATH;
  if (!logFilePath) return;

  try {
    // Ensure directory exists
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Append to log file
    fs.appendFileSync(logFilePath, formattedMessage + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }
};

// Log function
const log = (level, message, meta = {}) => {
  if (LOG_LEVELS[level] > getCurrentLevel()) return;

  const formattedMessage = formatMessage(level, message, meta);

  // Console output with colors (only in development)
  if (process.env.NODE_ENV !== 'production') {
    const color = getColor(level);
    console.log(`${color}${formattedMessage}${COLORS.reset}`);
  } else {
    console.log(formattedMessage);
  }

  // Write to file
  writeToFile(formattedMessage);
};

// Logger object with methods for each level
const logger = {
  error: (message, meta = {}) => log('error', message, meta),
  warn: (message, meta = {}) => log('warn', message, meta),
  info: (message, meta = {}) => log('info', message, meta),
  http: (message, meta = {}) => log('http', message, meta),
  debug: (message, meta = {}) => log('debug', message, meta),

  // Request logging middleware
  requestLogger: (req, res, next) => {
    const start = Date.now();

    // Log request
    logger.http(`${req.method} ${req.originalUrl}`, {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    // Log response on finish
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 400 ? 'warn' : 'http';

      log(level, `${req.method} ${req.originalUrl} ${res.statusCode}`, {
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length')
      });
    });

    next();
  },

  // Error logging helper
  logError: (error, req = null) => {
    const meta = {
      stack: error.stack,
      ...(req && {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress
      })
    };

    logger.error(error.message, meta);
  },

  // Database query logging
  logQuery: (query, params = [], duration = 0) => {
    logger.debug(`SQL Query: ${query}`, {
      params: params.length > 0 ? params : undefined,
      duration: `${duration}ms`
    });
  },

  // API response logging
  logResponse: (req, statusCode, data) => {
    logger.debug(`Response: ${statusCode}`, {
      path: req.originalUrl,
      method: req.method,
      bodySize: JSON.stringify(data).length
    });
  }
};

// Audit logger for sensitive operations
const auditLog = {
  log: (action, userId, details = {}) => {
    const auditEntry = {
      timestamp: getTimestamp(),
      action,
      userId,
      ...details
    };

    logger.info(`AUDIT: ${action}`, auditEntry);

    // Write to separate audit log file if configured
    const auditLogPath = process.env.AUDIT_LOG_PATH;
    if (auditLogPath) {
      try {
        const auditDir = path.dirname(auditLogPath);
        if (!fs.existsSync(auditDir)) {
          fs.mkdirSync(auditDir, { recursive: true });
        }
        fs.appendFileSync(auditLogPath, JSON.stringify(auditEntry) + '\n');
      } catch (error) {
        logger.error('Failed to write audit log:', { error: error.message });
      }
    }
  },

  // Common audit events
  userLogin: (userId, ip) => auditLog.log('USER_LOGIN', userId, { ip }),
  userLogout: (userId) => auditLog.log('USER_LOGOUT', userId, {}),
  userRegister: (userId, email) => auditLog.log('USER_REGISTER', userId, { email }),
  passwordChange: (userId) => auditLog.log('PASSWORD_CHANGE', userId, {}),
  subscriptionChange: (userId, oldPlan, newPlan) => auditLog.log('SUBSCRIPTION_CHANGE', userId, { oldPlan, newPlan }),
  applicationSubmit: (userId, applicationId) => auditLog.log('APPLICATION_SUBMIT', userId, { applicationId }),
  paymentComplete: (userId, paymentId, amount) => auditLog.log('PAYMENT_COMPLETE', userId, { paymentId, amount })
};

module.exports = {
  logger,
  auditLog,
  LOG_LEVELS
};
