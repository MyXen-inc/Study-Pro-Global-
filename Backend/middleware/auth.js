const jwt = require('jsonwebtoken');

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
};

// Optional authentication (for endpoints that work with or without auth)
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token is invalid, but we don't fail the request
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

// Check subscription level
const requireSubscription = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const subscriptionLevels = {
      'free': 0,
      'asia': 1,
      'europe': 2,
      'global': 3
    };

    const userLevel = subscriptionLevels[req.user.subscriptionType] || 0;
    const requiredLevel = subscriptionLevels[minLevel] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_REQUIRED',
          message: `This feature requires ${minLevel} subscription or higher`,
          requiredPlan: minLevel,
          currentPlan: req.user.subscriptionType
        }
      });
    }

    next();
  };
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required'
      }
    });
  }
  next();
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireSubscription,
  requireAdmin
};
