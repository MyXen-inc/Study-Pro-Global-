const express = require('express');
const { pool } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');
const { errorResponse, successResponse } = require('../utils/helpers');

const router = express.Router();

// Get all programs with pagination and filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      level,
      university_id,
      search,
      page = 1,
      limit = 10
    } = req.query;

    let query = `
      SELECT p.*, u.name as university_name, u.country as university_country
      FROM programs p
      JOIN universities u ON p.university_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (level) {
      query += ' AND p.level = ?';
      params.push(level);
    }

    if (university_id) {
      query += ' AND p.university_id = ?';
      params.push(university_id);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.requirements LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Count total
    const countQuery = query.replace('SELECT p.*, u.name as university_name, u.country as university_country', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [programs] = await pool.query(query, params);

    return successResponse(res, {
      programs: programs.map(prog => ({
        id: prog.id,
        name: prog.name,
        level: prog.level,
        duration: prog.duration,
        tuitionFee: prog.tuition_fee,
        requirements: prog.requirements,
        university: {
          id: prog.university_id,
          name: prog.university_name,
          country: prog.university_country
        }
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: offset + programs.length < total
      }
    });

  } catch (error) {
    console.error('Get programs error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch programs');
  }
});

// Search programs
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const {
      field,
      degree_level,
      country,
      min_fee,
      max_fee,
      page = 1,
      limit = 10
    } = req.query;

    let query = `
      SELECT p.*, u.name as university_name, u.country as university_country
      FROM programs p
      JOIN universities u ON p.university_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (field) {
      query += ' AND p.name LIKE ?';
      params.push(`%${field}%`);
    }

    if (degree_level) {
      query += ' AND p.level = ?';
      params.push(degree_level);
    }

    if (country) {
      query += ' AND u.country = ?';
      params.push(country);
    }

    if (min_fee) {
      query += ' AND p.tuition_fee >= ?';
      params.push(parseFloat(min_fee));
    }

    if (max_fee) {
      query += ' AND p.tuition_fee <= ?';
      params.push(parseFloat(max_fee));
    }

    // Count total
    const countQuery = query.replace('SELECT p.*, u.name as university_name, u.country as university_country', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY p.tuition_fee ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [programs] = await pool.query(query, params);

    return successResponse(res, {
      programs: programs.map(prog => ({
        id: prog.id,
        name: prog.name,
        level: prog.level,
        duration: prog.duration,
        tuitionFee: prog.tuition_fee,
        requirements: prog.requirements,
        university: {
          id: prog.university_id,
          name: prog.university_name,
          country: prog.university_country
        }
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: offset + programs.length < total
      }
    });

  } catch (error) {
    console.error('Search programs error:', error);
    return errorResponse(res, 500, 'SEARCH_FAILED', 'Failed to search programs');
  }
});

// Get program details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [programs] = await pool.query(
      `SELECT p.*, u.name as university_name, u.country as university_country, u.website as university_website
       FROM programs p
       JOIN universities u ON p.university_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (programs.length === 0) {
      return errorResponse(res, 404, 'PROGRAM_NOT_FOUND', 'Program not found');
    }

    const program = programs[0];

    return successResponse(res, {
      id: program.id,
      name: program.name,
      level: program.level,
      duration: program.duration,
      tuitionFee: program.tuition_fee,
      requirements: program.requirements,
      university: {
        id: program.university_id,
        name: program.university_name,
        country: program.university_country,
        website: program.university_website
      }
    });

  } catch (error) {
    console.error('Get program details error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch program details');
  }
});

// Get program requirements
router.get('/:id/requirements', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [programs] = await pool.query(
      'SELECT requirements FROM programs WHERE id = ?',
      [id]
    );

    if (programs.length === 0) {
      return errorResponse(res, 404, 'PROGRAM_NOT_FOUND', 'Program not found');
    }

    return successResponse(res, {
      programId: id,
      requirements: programs[0].requirements
    });

  } catch (error) {
    console.error('Get program requirements error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch program requirements');
  }
});

module.exports = router;
