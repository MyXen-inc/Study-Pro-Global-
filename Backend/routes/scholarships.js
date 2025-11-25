const express = require('express');
const { pool } = require('../config/database');
const { optionalAuth, verifyToken, requireSubscription } = require('../middleware/auth');
const { errorResponse, successResponse } = require('../utils/helpers');

const router = express.Router();

// Get scholarships
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { country, level, page = 1, limit = 10 } = req.query;

    let query = 'SELECT * FROM scholarships WHERE 1=1';
    const params = [];

    if (country) {
      query += ' AND country = ?';
      params.push(country);
    }

    if (level) {
      query += ' AND level = ?';
      params.push(level);
    }

    // Only show non-expired scholarships
    query += ' AND (deadline IS NULL OR deadline >= CURDATE())';

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY deadline ASC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [scholarships] = await pool.query(query, params);

    return successResponse(res, {
      scholarships: scholarships.map(s => ({
        id: s.id,
        name: s.name,
        country: s.country,
        amount: s.amount,
        level: s.level,
        eligibility: s.eligibility,
        deadline: s.deadline,
        description: s.description,
        applicationUrl: s.application_url
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: offset + scholarships.length < total
      }
    });

  } catch (error) {
    console.error('Get scholarships error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch scholarships');
  }
});

// Get scholarship details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [scholarships] = await pool.query(
      'SELECT * FROM scholarships WHERE id = ?',
      [id]
    );

    if (scholarships.length === 0) {
      return errorResponse(res, 404, 'SCHOLARSHIP_NOT_FOUND', 'Scholarship not found');
    }

    const scholarship = scholarships[0];

    return successResponse(res, {
      id: scholarship.id,
      name: scholarship.name,
      country: scholarship.country,
      amount: scholarship.amount,
      level: scholarship.level,
      eligibility: scholarship.eligibility,
      deadline: scholarship.deadline,
      description: scholarship.description,
      applicationUrl: scholarship.application_url
    });

  } catch (error) {
    console.error('Get scholarship details error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch scholarship details');
  }
});

// Auto-match scholarships (Premium feature)
router.post('/auto-match', requireSubscription('global'), async (req, res) => {
  try {
    // Get user profile
    const [users] = await pool.query(
      'SELECT country, academic_level FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    const user = users[0];

    // Find matching scholarships
    let query = `
      SELECT * FROM scholarships 
      WHERE (deadline IS NULL OR deadline >= CURDATE())
    `;
    const params = [];

    if (user.country) {
      query += ' AND (country = ? OR country = "Global")';
      params.push(user.country);
    }

    if (user.academic_level) {
      query += ' AND (level = ? OR level IS NULL)';
      params.push(user.academic_level);
    }

    query += ' ORDER BY deadline ASC LIMIT 20';

    const [scholarships] = await pool.query(query, params);

    // Calculate match scores (simple algorithm)
    const matches = scholarships.map(s => {
      let score = 50; // Base score
      
      if (s.country === user.country) score += 30;
      if (s.level === user.academic_level) score += 20;
      
      const reasons = [];
      if (s.country === user.country) reasons.push('Country match');
      if (s.level === user.academic_level) reasons.push('Academic level match');
      if (s.deadline) reasons.push(`Deadline: ${s.deadline}`);

      return {
        scholarship: {
          id: s.id,
          name: s.name,
          country: s.country,
          amount: s.amount,
          level: s.level,
          deadline: s.deadline,
          applicationUrl: s.application_url
        },
        matchScore: Math.min(score, 100),
        reasons
      };
    });

    // Sort by match score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return successResponse(res, {
      matches: matches.slice(0, 10) // Top 10 matches
    });

  } catch (error) {
    console.error('Auto-match scholarships error:', error);
    return errorResponse(res, 500, 'MATCH_FAILED', 'Failed to match scholarships');
  }
});

// Apply for scholarship
router.post('/:id/apply', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { applicationData } = req.body;

    // Check if scholarship exists
    const [scholarships] = await pool.query(
      'SELECT * FROM scholarships WHERE id = ?',
      [id]
    );

    if (scholarships.length === 0) {
      return errorResponse(res, 404, 'SCHOLARSHIP_NOT_FOUND', 'Scholarship not found');
    }

    const scholarship = scholarships[0];

    // Check if deadline has passed
    if (scholarship.deadline && new Date(scholarship.deadline) < new Date()) {
      return errorResponse(res, 400, 'DEADLINE_PASSED', 'The scholarship deadline has passed');
    }

    // Check if already applied
    const [existingApplications] = await pool.query(
      'SELECT id FROM scholarship_applications WHERE user_id = ? AND scholarship_id = ?',
      [req.user.userId, id]
    );

    if (existingApplications.length > 0) {
      return errorResponse(res, 409, 'ALREADY_APPLIED', 'You have already applied for this scholarship');
    }

    // Create application
    const { generateUUID } = require('../utils/helpers');
    const applicationId = generateUUID();

    await pool.query(
      `INSERT INTO scholarship_applications (id, user_id, scholarship_id, status, application_data)
       VALUES (?, ?, ?, 'pending', ?)`,
      [applicationId, req.user.userId, id, JSON.stringify(applicationData || {})]
    );

    return successResponse(res, {
      message: 'Scholarship application submitted successfully',
      applicationId,
      scholarshipName: scholarship.name,
      status: 'pending'
    }, 201);

  } catch (error) {
    console.error('Apply for scholarship error:', error);
    return errorResponse(res, 500, 'APPLICATION_FAILED', 'Failed to apply for scholarship');
  }
});

// Get user's scholarship applications
router.get('/my-applications', verifyToken, async (req, res) => {
  try {
    const [applications] = await pool.query(
      `SELECT sa.*, s.name as scholarship_name, s.country, s.amount, s.deadline
       FROM scholarship_applications sa
       JOIN scholarships s ON sa.scholarship_id = s.id
       WHERE sa.user_id = ?
       ORDER BY sa.submitted_at DESC`,
      [req.user.userId]
    );

    return successResponse(res, {
      applications: applications.map(app => ({
        id: app.id,
        scholarshipId: app.scholarship_id,
        scholarshipName: app.scholarship_name,
        country: app.country,
        amount: app.amount,
        deadline: app.deadline,
        status: app.status,
        submittedAt: app.submitted_at
      }))
    });

  } catch (error) {
    console.error('Get scholarship applications error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch scholarship applications');
  }
});

module.exports = router;
