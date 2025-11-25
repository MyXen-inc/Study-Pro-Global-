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

// Update user profile
router.put('/profile', verifyToken, [
  body('fullName').optional().trim(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
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

    const { fullName, phone, address, dateOfBirth, country, academicLevel } = req.body;

    // Get current user data
    const [currentUser] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (currentUser.length === 0) {
      return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    // Build update query
    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (dateOfBirth !== undefined) updates.date_of_birth = dateOfBirth;
    if (country !== undefined) updates.country = country;
    if (academicLevel !== undefined) updates.academic_level = academicLevel;

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, 400, 'NO_UPDATES', 'No fields to update');
    }

    // Calculate new profile completion
    const updatedUser = { ...currentUser[0], ...updates };
    updates.profile_complete = calculateProfileCompletion(updatedUser);

    // Update user
    const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const updateValues = [...Object.values(updates), req.user.userId];

    await pool.query(
      `UPDATE users SET ${updateFields} WHERE id = ?`,
      updateValues
    );

    // Get updated user
    const [users] = await pool.query(
      'SELECT id, full_name, email, country, academic_level, phone, address, date_of_birth, subscription_type, profile_complete FROM users WHERE id = ?',
      [req.user.userId]
    );

    return successResponse(res, {
      message: 'Profile updated successfully',
      user: {
        id: users[0].id,
        fullName: users[0].full_name,
        email: users[0].email,
        country: users[0].country,
        academicLevel: users[0].academic_level,
        phone: users[0].phone,
        address: users[0].address,
        dateOfBirth: users[0].date_of_birth,
        subscriptionType: users[0].subscription_type,
        profileComplete: users[0].profile_complete
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, 500, 'UPDATE_FAILED', 'Failed to update profile');
  }
});

// Forgot password - request reset
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', {
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Check if user exists
    const [users] = await pool.query(
      'SELECT id, full_name FROM users WHERE email = ?',
      [email]
    );

    // Always return success to prevent email enumeration
    if (users.length === 0) {
      return successResponse(res, {
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    // Generate reset token
    const resetToken = generateUUID();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token (in production, store hashed token)
    await pool.query(
      `UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?`,
      [resetToken, resetExpires, users[0].id]
    );

    // In production, send email with reset link
    // For now, just log the token
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return successResponse(res, {
      message: 'If an account exists with this email, you will receive a password reset link.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(res, 500, 'REQUEST_FAILED', 'Failed to process password reset request');
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', {
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // Find user with valid reset token
    const [users] = await pool.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return errorResponse(res, 400, 'INVALID_TOKEN', 'Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, users[0].id]
    );

    return successResponse(res, {
      message: 'Password reset successfully. Please login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, 500, 'RESET_FAILED', 'Failed to reset password');
  }
});

// Refresh token
router.post('/refresh', verifyToken, async (req, res) => {
  try {
    // Get current user
    const [users] = await pool.query(
      'SELECT id, email, subscription_type, role FROM users WHERE id = ? AND is_active = true',
      [req.user.userId]
    );

    if (users.length === 0) {
      return errorResponse(res, 401, 'INVALID_USER', 'User not found or inactive');
    }

    const user = users[0];

    // Generate new token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        subscriptionType: user.subscription_type,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return successResponse(res, {
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse(res, 500, 'REFRESH_FAILED', 'Failed to refresh token');
  }
});

module.exports = router;
