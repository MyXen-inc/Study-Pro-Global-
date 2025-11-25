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

// Create support ticket
router.post('/tickets', verifyToken, [
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('category').optional().isIn(['general', 'application', 'payment', 'technical', 'subscription', 'other']).withMessage('Invalid category'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', {
        errors: errors.array()
      });
    }

    const { subject, message, category = 'general', priority = 'medium' } = req.body;

    // Create ticket
    const ticketId = generateUUID();

    await pool.query(
      `INSERT INTO support_tickets (id, user_id, subject, category, priority, status)
       VALUES (?, ?, ?, ?, ?, 'open')`,
      [ticketId, req.user.userId, subject, category, priority]
    );

    // Create initial message
    const messageId = generateUUID();

    await pool.query(
      `INSERT INTO ticket_messages (id, ticket_id, user_id, message, is_staff_reply)
       VALUES (?, ?, ?, ?, false)`,
      [messageId, ticketId, req.user.userId, message]
    );

    return successResponse(res, {
      message: 'Support ticket created successfully',
      ticketId,
      subject,
      category,
      priority,
      status: 'open',
      createdAt: new Date().toISOString()
    }, 201);

  } catch (error) {
    console.error('Create support ticket error:', error);
    return errorResponse(res, 500, 'TICKET_CREATION_FAILED', 'Failed to create support ticket');
  }
});

// Get user's tickets
router.get('/tickets', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT id, subject, category, priority, status, created_at, updated_at
      FROM support_tickets
      WHERE user_id = ?
    `;
    const params = [req.user.userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Count total
    const countQuery = query.replace('SELECT id, subject, category, priority, status, created_at, updated_at', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [tickets] = await pool.query(query, params);

    return successResponse(res, {
      tickets: tickets.map(t => ({
        id: t.id,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: t.status,
        createdAt: t.created_at,
        updatedAt: t.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: offset + tickets.length < total
      }
    });

  } catch (error) {
    console.error('Get tickets error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch tickets');
  }
});

// Get ticket details
router.get('/tickets/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get ticket
    const [tickets] = await pool.query(
      'SELECT * FROM support_tickets WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (tickets.length === 0) {
      return errorResponse(res, 404, 'TICKET_NOT_FOUND', 'Ticket not found');
    }

    const ticket = tickets[0];

    // Get messages
    const [messages] = await pool.query(
      `SELECT tm.id, tm.message, tm.is_staff_reply, tm.created_at, u.full_name as author_name
       FROM ticket_messages tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.ticket_id = ?
       ORDER BY tm.created_at ASC`,
      [id]
    );

    return successResponse(res, {
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      closedAt: ticket.closed_at,
      messages: messages.map(m => ({
        id: m.id,
        message: m.message,
        isStaffReply: m.is_staff_reply,
        authorName: m.author_name,
        createdAt: m.created_at
      }))
    });

  } catch (error) {
    console.error('Get ticket details error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch ticket details');
  }
});

// Reply to ticket
router.post('/tickets/:id/reply', verifyToken, [
  body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', {
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { message } = req.body;

    // Check if ticket exists and belongs to user
    const [tickets] = await pool.query(
      'SELECT * FROM support_tickets WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (tickets.length === 0) {
      return errorResponse(res, 404, 'TICKET_NOT_FOUND', 'Ticket not found');
    }

    const ticket = tickets[0];

    // Check if ticket is open
    if (ticket.status === 'closed') {
      return errorResponse(res, 400, 'TICKET_CLOSED', 'Cannot reply to a closed ticket');
    }

    // Create message
    const messageId = generateUUID();

    await pool.query(
      `INSERT INTO ticket_messages (id, ticket_id, user_id, message, is_staff_reply)
       VALUES (?, ?, ?, ?, false)`,
      [messageId, id, req.user.userId, message]
    );

    // Update ticket status to waiting for response if it was answered
    if (ticket.status === 'answered') {
      await pool.query(
        'UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?',
        ['waiting', id]
      );
    } else {
      await pool.query(
        'UPDATE support_tickets SET updated_at = NOW() WHERE id = ?',
        [id]
      );
    }

    return successResponse(res, {
      message: 'Reply sent successfully',
      messageId,
      ticketId: id,
      createdAt: new Date().toISOString()
    }, 201);

  } catch (error) {
    console.error('Reply to ticket error:', error);
    return errorResponse(res, 500, 'REPLY_FAILED', 'Failed to send reply');
  }
});

// Close ticket
router.post('/tickets/:id/close', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ticket exists and belongs to user
    const [tickets] = await pool.query(
      'SELECT * FROM support_tickets WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (tickets.length === 0) {
      return errorResponse(res, 404, 'TICKET_NOT_FOUND', 'Ticket not found');
    }

    const ticket = tickets[0];

    if (ticket.status === 'closed') {
      return errorResponse(res, 400, 'ALREADY_CLOSED', 'Ticket is already closed');
    }

    // Close ticket
    await pool.query(
      'UPDATE support_tickets SET status = ?, closed_at = NOW(), updated_at = NOW() WHERE id = ?',
      ['closed', id]
    );

    return successResponse(res, {
      message: 'Ticket closed successfully',
      ticketId: id
    });

  } catch (error) {
    console.error('Close ticket error:', error);
    return errorResponse(res, 500, 'CLOSE_FAILED', 'Failed to close ticket');
  }
});

module.exports = router;
