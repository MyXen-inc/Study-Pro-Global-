const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const {
  calculateProfileCompletion,
  errorResponse,
  successResponse
} = require('../utils/helpers');

const router = express.Router();

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, full_name, email, country, academic_level, phone, address, date_of_birth, subscription_type, subscription_expires_at, free_applications_used, profile_complete, created_at FROM users WHERE id = ?',
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
      memberSince: user.created_at
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch profile');
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

// Upload document
router.post('/documents', verifyToken, async (req, res) => {
  try {
    // This is a placeholder. In production, you would use multer for file upload
    // and AWS S3 or similar for storage
    
    return successResponse(res, {
      message: 'Document upload endpoint - Implement with multer and S3',
      documentId: 'placeholder',
      url: 'https://example.com/placeholder.pdf',
      type: 'cv'
    }, 201);

  } catch (error) {
    console.error('Document upload error:', error);
    return errorResponse(res, 500, 'UPLOAD_FAILED', 'Failed to upload document');
  }
});

// Get user documents
router.get('/documents', verifyToken, async (req, res) => {
  try {
    const [documents] = await pool.query(
      'SELECT id, document_type, file_url, file_name, file_size, uploaded_at FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC',
      [req.user.userId]
    );

    return successResponse(res, {
      documents: documents.map(doc => ({
        id: doc.id,
        documentType: doc.document_type,
        fileUrl: doc.file_url,
        fileName: doc.file_name,
        fileSize: doc.file_size,
        uploadedAt: doc.uploaded_at
      }))
    });

  } catch (error) {
    console.error('Get documents error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch documents');
  }
});

module.exports = router;
