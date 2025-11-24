const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const {
  generateUUID,
  calculateProfileCompletion,
  isValidEmail,
  isValidPassword,
  sanitizeUser,
  errorResponse,
  successResponse
} = require('../utils/helpers');

const router = express.Router();

// Register new user
router.post('/register', [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('country').optional().trim(),
  body('academicLevel').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', {
        errors: errors.array()
      });
    }

    const { fullName, email, password, country, academicLevel } = req.body;

    // Check if email already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return errorResponse(res, 409, 'EMAIL_EXISTS', 'Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    // Create user
    const userId = generateUUID();
    const profileComplete = calculateProfileCompletion({
      full_name: fullName,
      email,
      country,
      academic_level: academicLevel
    });

    await pool.query(
      `INSERT INTO users (id, full_name, email, password, country, academic_level, profile_complete)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, fullName, email, hashedPassword, country || null, academicLevel || null, profileComplete]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        userId,
        email,
        subscriptionType: 'free',
        role: 'student'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Get user data
    const [users] = await pool.query(
      'SELECT id, full_name, email, country, academic_level, subscription_type, profile_complete FROM users WHERE id = ?',
      [userId]
    );

    return successResponse(res, {
      message: 'Registration successful',
      token,
      user: {
        id: users[0].id,
        fullName: users[0].full_name,
        email: users[0].email,
        country: users[0].country,
        academicLevel: users[0].academic_level,
        subscriptionType: users[0].subscription_type,
        profileComplete: users[0].profile_complete
      }
    }, 201);

  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse(res, 500, 'REGISTRATION_FAILED', 'Failed to register user');
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', {
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND is_active = true',
      [email]
    );

    if (users.length === 0) {
      return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Check subscription expiry
    let subscriptionType = user.subscription_type;
    if (user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date()) {
      subscriptionType = 'free';
      await pool.query(
        'UPDATE users SET subscription_type = ? WHERE id = ?',
        ['free', user.id]
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        subscriptionType,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return successResponse(res, {
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        country: user.country,
        academicLevel: user.academic_level,
        subscriptionType,
        freeApplicationsUsed: user.free_applications_used,
        profileComplete: user.profile_complete
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 500, 'LOGIN_FAILED', 'Failed to login');
  }
});

// Logout user (client-side token removal, but we can track sessions if needed)
router.post('/logout', verifyToken, async (req, res) => {
  // In a stateless JWT system, logout is handled on the client side
  // by removing the token. If you implement token blacklisting or
  // session management, you would invalidate the token here.
  
  return successResponse(res, {
    message: 'Logged out successfully'
  });
});

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, full_name, email, country, academic_level, phone, address, date_of_birth, subscription_type, subscription_expires_at, free_applications_used, profile_complete, role FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    const user = users[0];
    return successResponse(res, {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      country: user.country,
      academicLevel: user.academic_level,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.date_of_birth,
      subscriptionType: user.subscription_type,
      subscriptionExpiresAt: user.subscription_expires_at,
      freeApplicationsUsed: user.free_applications_used,
      profileComplete: user.profile_complete,
      role: user.role
    });

  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch user data');
  }
});

module.exports = router;
