const express = require('express');
const { pool } = require('../config/database');
const { optionalAuth, verifyToken } = require('../middleware/auth');
const { errorResponse, successResponse } = require('../utils/helpers');

const router = express.Router();

// Get courses
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;

    let query = 'SELECT * FROM courses WHERE is_active = true';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [courses] = await pool.query(query, params);

    return successResponse(res, {
      courses: courses.map(c => ({
        id: c.id,
        title: c.title,
        type: c.type,
        price: c.price,
        description: c.description,
        duration: c.duration
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: offset + courses.length < total
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch courses');
  }
});

// Get course details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [courses] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND is_active = true',
      [id]
    );

    if (courses.length === 0) {
      return errorResponse(res, 404, 'COURSE_NOT_FOUND', 'Course not found');
    }

    const course = courses[0];

    return successResponse(res, {
      id: course.id,
      title: course.title,
      type: course.type,
      price: course.price,
      description: course.description,
      duration: course.duration,
      content: course.content
    });

  } catch (error) {
    console.error('Get course details error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch course details');
  }
});

// Enroll in course
router.post('/:id/enroll', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course exists
    const [courses] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND is_active = true',
      [id]
    );

    if (courses.length === 0) {
      return errorResponse(res, 404, 'COURSE_NOT_FOUND', 'Course not found');
    }

    const course = courses[0];

    // Check if already enrolled
    const [existingEnrollment] = await pool.query(
      'SELECT id FROM course_enrollments WHERE user_id = ? AND course_id = ?',
      [req.user.userId, id]
    );

    if (existingEnrollment.length > 0) {
      return errorResponse(res, 409, 'ALREADY_ENROLLED', 'You are already enrolled in this course');
    }

    // For paid courses, check if payment is made
    if (course.type === 'paid' && course.price > 0) {
      // In production, verify payment before enrollment
      // For now, allow enrollment for demo purposes
    }

    // Create enrollment record
    const crypto = require('crypto');
    const enrollmentId = crypto.randomUUID();

    await pool.query(
      `INSERT INTO course_enrollments (id, user_id, course_id, status, progress)
       VALUES (?, ?, ?, 'active', 0)`,
      [enrollmentId, req.user.userId, id]
    );

    return successResponse(res, {
      message: 'Course enrollment successful',
      enrollmentId,
      courseId: course.id,
      courseTitle: course.title,
      enrolledAt: new Date().toISOString()
    }, 201);

  } catch (error) {
    console.error('Enroll in course error:', error);
    return errorResponse(res, 500, 'ENROLLMENT_FAILED', 'Failed to enroll in course');
  }
});

// Get user enrollments
router.get('/my/enrollments', verifyToken, async (req, res) => {
  try {
    const [enrollments] = await pool.query(
      `SELECT ce.*, c.title, c.type, c.description, c.duration
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id
       WHERE ce.user_id = ?
       ORDER BY ce.enrolled_at DESC`,
      [req.user.userId]
    );

    return successResponse(res, {
      enrollments: enrollments.map(e => ({
        id: e.id,
        courseId: e.course_id,
        courseTitle: e.title,
        courseType: e.type,
        courseDescription: e.description,
        courseDuration: e.duration,
        progress: e.progress,
        status: e.status,
        enrolledAt: e.enrolled_at,
        completedAt: e.completed_at
      }))
    });

  } catch (error) {
    console.error('Get enrollments error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch enrollments');
  }
});

module.exports = router;
