const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const {
  generateUUID,
  getSubscriptionFeatures,
  errorResponse,
  successResponse
} = require('../utils/helpers');

const router = express.Router();

// Submit application
router.post('/', verifyToken, [
  body('universityId').notEmpty().withMessage('University ID is required'),
  body('programId').notEmpty().withMessage('Program ID is required'),
  body('personalStatement').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', {
        errors: errors.array()
      });
    }

    const { universityId, programId, personalStatement, documents } = req.body;

    // Get user data
    const [users] = await pool.query(
      'SELECT subscription_type, free_applications_used FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    const user = users[0];
    const features = getSubscriptionFeatures(user.subscription_type);

    // Check application limits
    if (features.applications !== 'unlimited') {
      const [applicationCount] = await pool.query(
        'SELECT COUNT(*) as count FROM applications WHERE user_id = ?',
        [req.user.userId]
      );

      if (applicationCount[0].count >= features.applications) {
        return errorResponse(res, 403, 'APPLICATION_LIMIT_REACHED', 
          `You have reached your application limit (${features.applications}). Please upgrade your subscription.`);
      }
    }

    // Check if university exists
    const [universities] = await pool.query(
      'SELECT * FROM universities WHERE id = ?',
      [universityId]
    );

    if (universities.length === 0) {
      return errorResponse(res, 404, 'UNIVERSITY_NOT_FOUND', 'University not found');
    }

    // Check if program exists
    const [programs] = await pool.query(
      'SELECT * FROM programs WHERE id = ? AND university_id = ?',
      [programId, universityId]
    );

    if (programs.length === 0) {
      return errorResponse(res, 404, 'PROGRAM_NOT_FOUND', 'Program not found');
    }

    // Create application
    const applicationId = generateUUID();
    
    await pool.query(
      `INSERT INTO applications (id, user_id, university_id, program_id, personal_statement, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [applicationId, req.user.userId, universityId, programId, personalStatement || null]
    );

    // Update free applications count if free tier
    if (user.subscription_type === 'free') {
      await pool.query(
        'UPDATE users SET free_applications_used = free_applications_used + 1 WHERE id = ?',
        [req.user.userId]
      );
    }

    return successResponse(res, {
      message: 'Application submitted successfully',
      applicationId,
      status: 'pending',
      submittedAt: new Date().toISOString()
    }, 201);

  } catch (error) {
    console.error('Submit application error:', error);
    return errorResponse(res, 500, 'SUBMISSION_FAILED', 'Failed to submit application');
  }
});

// Get user applications
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT 
        a.id, a.status, a.submitted_at, a.updated_at,
        u.id as university_id, u.name as university_name, u.country,
        p.id as program_id, p.name as program_name, p.level
      FROM applications a
      JOIN universities u ON a.university_id = u.id
      JOIN programs p ON a.program_id = p.id
      WHERE a.user_id = ?
    `;
    const params = [req.user.userId];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY a.submitted_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [applications] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM applications WHERE user_id = ?';
    const countParams = [req.user.userId];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    return successResponse(res, {
      applications: applications.map(app => ({
        id: app.id,
        status: app.status,
        submittedAt: app.submitted_at,
        lastUpdated: app.updated_at,
        university: {
          id: app.university_id,
          name: app.university_name,
          country: app.country
        },
        program: {
          id: app.program_id,
          name: app.program_name,
          level: app.level
        }
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: offset + applications.length < total
      }
    });

  } catch (error) {
    console.error('Get applications error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch applications');
  }
});

// Get application details
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [applications] = await pool.query(
      `SELECT 
        a.*,
        u.name as university_name, u.country, u.website,
        p.name as program_name, p.level, p.duration
       FROM applications a
       JOIN universities u ON a.university_id = u.id
       JOIN programs p ON a.program_id = p.id
       WHERE a.id = ? AND a.user_id = ?`,
      [id, req.user.userId]
    );

    if (applications.length === 0) {
      return errorResponse(res, 404, 'APPLICATION_NOT_FOUND', 'Application not found');
    }

    const app = applications[0];

    return successResponse(res, {
      id: app.id,
      status: app.status,
      personalStatement: app.personal_statement,
      submittedAt: app.submitted_at,
      updatedAt: app.updated_at,
      university: {
        id: app.university_id,
        name: app.university_name,
        country: app.country,
        website: app.website
      },
      program: {
        id: app.program_id,
        name: app.program_name,
        level: app.level,
        duration: app.duration
      }
    });

  } catch (error) {
    console.error('Get application details error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch application details');
  }
});

module.exports = router;
