require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { testConnection, initializeDatabase } = require('./config/database');
const { logger } = require('./utils/logger');
const { addRequestId } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Add request ID to all requests
app.use(addRequestId);

// Request logging
app.use(logger.requestLogger);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://www.studyproglobal.com.bd',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const universityRoutes = require('./routes/universities');
const programRoutes = require('./routes/programs');
const applicationRoutes = require('./routes/applications');
const subscriptionRoutes = require('./routes/subscriptions');
const paymentRoutes = require('./routes/payments');
const scholarshipRoutes = require('./routes/scholarships');
const courseRoutes = require('./routes/courses');
const consultationRoutes = require('./routes/consultations');
const supportRoutes = require('./routes/support');
const chatRoutes = require('./routes/chat');

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/universities', universityRoutes);
app.use('/api/v1/programs', programRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/scholarships', scholarshipRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/consultations', consultationRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    const dbConnected = await testConnection();
    dbStatus = dbConnected ? 'connected' : 'disconnected';
  } catch (error) {
    dbStatus = 'error';
  }

  res.json({
    success: true,
    message: 'Study Pro Global API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: process.uptime(),
    database: dbStatus,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Study Pro Global API',
    version: '1.0.0',
    documentation: '/api/v1/docs'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }

    // Initialize database tables
    await initializeDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log('\n🚀 Study Pro Global API Server');
      console.log(`📍 Running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`✅ Server started successfully at ${new Date().toISOString()}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
  });
});
