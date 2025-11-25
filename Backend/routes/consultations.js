const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const {
  generateUUID,
  errorResponse,
  successResponse
} = require('../utils/helpers');

const router = express.Router();

// Book a consultation
router.post('/book', verifyToken, [
  body('consultationType').isIn(['general', 'visa', 'scholarship', 'application', 'interview']).withMessage('Invalid consultation type'),
  body('scheduledAt').isISO8601().withMessage('Valid date and time is required'),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', {
        errors: errors.array()
      });
    }

    const { consultationType, scheduledAt, notes, durationMinutes = 30 } = req.body;

    // Check if the slot is available (no overlapping consultations)
    const scheduledDate = new Date(scheduledAt);
    const endTime = new Date(scheduledDate.getTime() + durationMinutes * 60000);

    const [existingConsultations] = await pool.query(
      `SELECT id FROM consultations 
       WHERE scheduled_at BETWEEN ? AND ?
       AND status IN ('scheduled', 'confirmed')`,
      [scheduledDate, endTime]
    );

    if (existingConsultations.length > 0) {
      return errorResponse(res, 409, 'SLOT_UNAVAILABLE', 'This time slot is not available');
    }

    // Create consultation
    const consultationId = generateUUID();

    await pool.query(
      `INSERT INTO consultations (id, user_id, consultation_type, scheduled_at, duration_minutes, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
      [consultationId, req.user.userId, consultationType, scheduledDate, durationMinutes, notes || null]
    );

    return successResponse(res, {
      message: 'Consultation booked successfully',
      consultationId,
      consultationType,
      scheduledAt: scheduledDate.toISOString(),
      durationMinutes,
      status: 'scheduled'
    }, 201);

  } catch (error) {
    console.error('Book consultation error:', error);
    return errorResponse(res, 500, 'BOOKING_FAILED', 'Failed to book consultation');
  }
});

// Get user's consultations
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT id, consultation_type, scheduled_at, duration_minutes, status, notes, meeting_link, created_at
      FROM consultations
      WHERE user_id = ?
    `;
    const params = [req.user.userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Count total
    const countQuery = query.replace('SELECT id, consultation_type, scheduled_at, duration_minutes, status, notes, meeting_link, created_at', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY scheduled_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [consultations] = await pool.query(query, params);

    return successResponse(res, {
      consultations: consultations.map(c => ({
        id: c.id,
        consultationType: c.consultation_type,
        scheduledAt: c.scheduled_at,
        durationMinutes: c.duration_minutes,
        status: c.status,
        notes: c.notes,
        meetingLink: c.meeting_link,
        createdAt: c.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: offset + consultations.length < total
      }
    });

  } catch (error) {
    console.error('Get consultations error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch consultations');
  }
});

// Get consultation details
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [consultations] = await pool.query(
      `SELECT * FROM consultations WHERE id = ? AND user_id = ?`,
      [id, req.user.userId]
    );

    if (consultations.length === 0) {
      return errorResponse(res, 404, 'CONSULTATION_NOT_FOUND', 'Consultation not found');
    }

    const consultation = consultations[0];

    return successResponse(res, {
      id: consultation.id,
      consultationType: consultation.consultation_type,
      consultantName: consultation.consultant_name,
      scheduledAt: consultation.scheduled_at,
      durationMinutes: consultation.duration_minutes,
      status: consultation.status,
      notes: consultation.notes,
      meetingLink: consultation.meeting_link,
      createdAt: consultation.created_at,
      updatedAt: consultation.updated_at
    });

  } catch (error) {
    console.error('Get consultation details error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch consultation details');
  }
});

// Reschedule consultation
router.put('/:id/reschedule', verifyToken, [
  body('scheduledAt').isISO8601().withMessage('Valid date and time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', {
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { scheduledAt } = req.body;

    // Check if consultation exists and belongs to user
    const [consultations] = await pool.query(
      'SELECT * FROM consultations WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (consultations.length === 0) {
      return errorResponse(res, 404, 'CONSULTATION_NOT_FOUND', 'Consultation not found');
    }

    const consultation = consultations[0];

    // Check if consultation can be rescheduled
    if (!['scheduled', 'confirmed'].includes(consultation.status)) {
      return errorResponse(res, 400, 'CANNOT_RESCHEDULE', 'This consultation cannot be rescheduled');
    }

    // Check if new slot is available
    const scheduledDate = new Date(scheduledAt);
    const endTime = new Date(scheduledDate.getTime() + consultation.duration_minutes * 60000);

    const [existingConsultations] = await pool.query(
      `SELECT id FROM consultations 
       WHERE scheduled_at BETWEEN ? AND ?
       AND status IN ('scheduled', 'confirmed')
       AND id != ?`,
      [scheduledDate, endTime, id]
    );

    if (existingConsultations.length > 0) {
      return errorResponse(res, 409, 'SLOT_UNAVAILABLE', 'This time slot is not available');
    }

    // Update consultation
    await pool.query(
      'UPDATE consultations SET scheduled_at = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [scheduledDate, 'rescheduled', id]
    );

    return successResponse(res, {
      message: 'Consultation rescheduled successfully',
      consultationId: id,
      newScheduledAt: scheduledDate.toISOString()
    });

  } catch (error) {
    console.error('Reschedule consultation error:', error);
    return errorResponse(res, 500, 'RESCHEDULE_FAILED', 'Failed to reschedule consultation');
  }
});

// Cancel consultation
router.delete('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if consultation exists and belongs to user
    const [consultations] = await pool.query(
      'SELECT * FROM consultations WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (consultations.length === 0) {
      return errorResponse(res, 404, 'CONSULTATION_NOT_FOUND', 'Consultation not found');
    }

    const consultation = consultations[0];

    // Check if consultation can be cancelled
    if (!['scheduled', 'confirmed', 'rescheduled'].includes(consultation.status)) {
      return errorResponse(res, 400, 'CANNOT_CANCEL', 'This consultation cannot be cancelled');
    }

    // Update consultation status
    await pool.query(
      'UPDATE consultations SET status = ?, updated_at = NOW() WHERE id = ?',
      ['cancelled', id]
    );

    return successResponse(res, {
      message: 'Consultation cancelled successfully',
      consultationId: id
    });

  } catch (error) {
    console.error('Cancel consultation error:', error);
    return errorResponse(res, 500, 'CANCEL_FAILED', 'Failed to cancel consultation');
  }
});

module.exports = router;
