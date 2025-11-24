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

// AI Chat configuration
const getAIResponse = async (message, conversationHistory, userSubscription) => {
  // In production, integrate with OpenAI API
  // For now, return mock responses
  
  const features = getSubscriptionFeatures(userSubscription);
  
  // Mock response based on subscription level
  if (features.aiSupport === 'basic') {
    return `Thank you for your question: "${message}". Our AI assistant is available with basic responses. For premium support, please upgrade to our Global Application Pack.`;
  }
  
  // Simulate AI response
  const responses = {
    'requirement': 'To study abroad, you typically need: 1) Valid passport, 2) Academic transcripts, 3) Language proficiency test (IELTS/TOEFL), 4) Financial proof, 5) Statement of Purpose.',
    'usa': 'For studying in the USA, you need: SAT/GRE scores, TOEFL (minimum 80), financial documentation showing $50,000-$70,000 per year, and strong academic records.',
    'scholarship': 'We can help you find scholarships! Our platform lists numerous opportunities. Global plan members get automatic scholarship matching based on their profile.',
    'application': 'The application process involves: 1) Selecting universities, 2) Preparing documents, 3) Writing SOP, 4) Submitting through our platform, 5) Tracking status.',
    'default': `I understand you're asking about "${message}". For detailed guidance on studying abroad, including university selection, application process, and visa requirements, our AI assistant can provide comprehensive support. How can I help you specifically?`
  };

  // Simple keyword matching for demo
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('requirement') || lowerMessage.includes('need')) {
    return responses.requirement;
  }
  if (lowerMessage.includes('usa') || lowerMessage.includes('america')) {
    return responses.usa;
  }
  if (lowerMessage.includes('scholarship')) {
    return responses.scholarship;
  }
  if (lowerMessage.includes('application') || lowerMessage.includes('apply')) {
    return responses.application;
  }

  return responses.default;
};

// Send message to AI chat
router.post('/message', verifyToken, [
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('conversationId').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', {
        errors: errors.array()
      });
    }

    const { message, conversationId } = req.body;

    let convId = conversationId;

    // Create new conversation if not provided
    if (!convId) {
      convId = generateUUID();
      await pool.query(
        'INSERT INTO chat_conversations (id, user_id) VALUES (?, ?)',
        [convId, req.user.userId]
      );
    } else {
      // Verify conversation belongs to user
      const [conversations] = await pool.query(
        'SELECT id FROM chat_conversations WHERE id = ? AND user_id = ?',
        [convId, req.user.userId]
      );

      if (conversations.length === 0) {
        return errorResponse(res, 404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
      }
    }

    // Save user message
    const userMessageId = generateUUID();
    await pool.query(
      'INSERT INTO chat_messages (id, conversation_id, role, message) VALUES (?, ?, ?, ?)',
      [userMessageId, convId, 'user', message]
    );

    // Get conversation history
    const [history] = await pool.query(
      'SELECT role, message FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [convId]
    );

    // Get AI response
    const aiResponse = await getAIResponse(message, history, req.user.subscriptionType);

    // Save AI response
    const aiMessageId = generateUUID();
    await pool.query(
      'INSERT INTO chat_messages (id, conversation_id, role, message) VALUES (?, ?, ?, ?)',
      [aiMessageId, convId, 'assistant', aiResponse]
    );

    // Update conversation last_message_at
    await pool.query(
      'UPDATE chat_conversations SET last_message_at = NOW() WHERE id = ?',
      [convId]
    );

    return successResponse(res, {
      conversationId: convId,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat message error:', error);
    return errorResponse(res, 500, 'CHAT_FAILED', 'Failed to process message');
  }
});

// Get conversation history
router.get('/conversations/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify conversation belongs to user
    const [conversations] = await pool.query(
      'SELECT * FROM chat_conversations WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (conversations.length === 0) {
      return errorResponse(res, 404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    // Get messages
    const [messages] = await pool.query(
      'SELECT role, message, created_at FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [id]
    );

    return successResponse(res, {
      conversationId: id,
      startedAt: conversations[0].started_at,
      lastMessageAt: conversations[0].last_message_at,
      messages: messages.map(m => ({
        role: m.role,
        message: m.message,
        timestamp: m.created_at
      }))
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch conversation');
  }
});

// Get all user conversations
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [conversations] = await pool.query(
      `SELECT id, started_at, last_message_at
       FROM chat_conversations
       WHERE user_id = ?
       ORDER BY last_message_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.userId, parseInt(limit), offset]
    );

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM chat_conversations WHERE user_id = ?',
      [req.user.userId]
    );

    return successResponse(res, {
      conversations: conversations.map(c => ({
        id: c.id,
        startedAt: c.started_at,
        lastMessageAt: c.last_message_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch conversations');
  }
});

module.exports = router;
