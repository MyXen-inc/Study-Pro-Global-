const express = require('express');
const { pool } = require('../config/database');
const { optionalAuth, requireSubscription } = require('../middleware/auth');
const { errorResponse, successResponse } = require('../utils/helpers');

const router = express.Router();

// Search universities
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const {
      country,
      level,
      ranking,
      scholarship,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    let query = 'SELECT u.* FROM universities u WHERE 1=1';
    const params = [];

    if (country) {
      query += ' AND u.country = ?';
      params.push(country);
    }

    if (ranking) {
      query += ' AND u.ranking <= ?';
      params.push(parseInt(ranking));
    }

    if (scholarship === 'true') {
      query += ' AND u.has_scholarships = true';
    }

    // Check if user is free tier - limit results
    const isFreeTier = !req.user || req.user.subscriptionType === 'free';
    const effectiveLimit = isFreeTier ? Math.min(parseInt(limit), 5) : parseInt(limit);
    
    // Count total
    const countQuery = query.replace('SELECT u.*', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    const offset = (parseInt(page) - 1) * effectiveLimit;
    query += ' ORDER BY u.ranking ASC LIMIT ? OFFSET ?';
    params.push(effectiveLimit, offset);

    const [universities] = await pool.query(query, params);

    return successResponse(res, {
      universities: universities.map(uni => ({
        id: uni.id,
        name: uni.name,
        country: uni.country,
        description: uni.description,
        ranking: uni.ranking,
        tuitionRange: uni.tuition_range,
        hasScholarships: uni.has_scholarships,
        website: uni.website
      })),
      pagination: {
        page: parseInt(page),
        limit: effectiveLimit,
        total,
        hasMore: offset + universities.length < total
      },
      ...(isFreeTier && { notice: 'Limited results for free tier. Upgrade to see more universities.' })
    });

  } catch (error) {
    console.error('Search universities error:', error);
    return errorResponse(res, 500, 'SEARCH_FAILED', 'Failed to search universities');
  }
});

// Get university details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [universities] = await pool.query(
      'SELECT * FROM universities WHERE id = ?',
      [id]
    );

    if (universities.length === 0) {
      return errorResponse(res, 404, 'UNIVERSITY_NOT_FOUND', 'University not found');
    }

    const university = universities[0];

    // Get programs for this university
    const [programs] = await pool.query(
      'SELECT id, name, level, duration, tuition_fee, requirements FROM programs WHERE university_id = ?',
      [id]
    );

    return successResponse(res, {
      id: university.id,
      name: university.name,
      country: university.country,
      description: university.description,
      ranking: university.ranking,
      tuitionRange: university.tuition_range,
      hasScholarships: university.has_scholarships,
      website: university.website,
      contactEmail: university.contact_email,
      programs: programs.map(prog => ({
        id: prog.id,
        name: prog.name,
        level: prog.level,
        duration: prog.duration,
        tuitionFee: prog.tuition_fee,
        requirements: prog.requirements
      }))
    });

  } catch (error) {
    console.error('Get university error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch university details');
  }
});

// Get all countries (for filters)
router.get('/filters/countries', async (req, res) => {
  try {
    const [countries] = await pool.query(
      'SELECT DISTINCT country FROM universities ORDER BY country'
    );

    return successResponse(res, {
      countries: countries.map(c => c.country)
    });

  } catch (error) {
    console.error('Get countries error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch countries');
  }
});

module.exports = router;
