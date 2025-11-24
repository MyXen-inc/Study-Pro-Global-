const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const {
  generateUUID,
  addYears,
  formatDateTime,
  errorResponse,
  successResponse
} = require('../utils/helpers');

const router = express.Router();

// Get available subscription plans
router.get('/plans', (req, res) => {
  const plans = [
    {
      id: 'asia',
      name: 'Country Focus Pack (Asia)',
      price: 25,
      currency: 'USD',
      validity: '2 years',
      features: [
        'Asian Universities Access',
        '5 University Applications',
        'Full Search Access',
        'AI Support 24/7',
        'Newsletter & Updates',
        'Scholarship Opportunities'
      ]
    },
    {
      id: 'europe',
      name: 'Country Focus Pack (Europe)',
      price: 50,
      currency: 'USD',
      validity: '2 years',
      features: [
        'European Universities (excluding UK)',
        '5 University Applications',
        'Full Search Access',
        'AI Support 24/7',
        'Newsletter & Updates',
        'Scholarship Opportunities'
      ]
    },
    {
      id: 'global',
      name: 'Global Application Pack',
      price: 100,
      currency: 'USD',
      validity: '2 years',
      popular: true,
      features: [
        'Worldwide Universities (UK, USA, Canada, Australia, Europe, Asia)',
        'Unlimited Applications',
        'Premium Support (AI + Human)',
        'UK Bonus Package',
        'Auto Scholarship Matching',
        'Interview Support',
        'Language Test Discounts',
        'University Ambassador Access'
      ]
    }
  ];

  return successResponse(res, { plans });
});

// Create subscription
router.post('/', verifyToken, [
  body('planId').isIn(['asia', 'europe', 'global']).withMessage('Invalid plan ID'),
  body('paymentMethod').isIn(['myxn_token', 'credit_card']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', {
        errors: errors.array()
      });
    }

    const { planId, paymentMethod } = req.body;

    // Get plan details
    const planPrices = {
      asia: 25,
      europe: 50,
      global: 100
    };

    const amount = planPrices[planId];

    // Create subscription record
    const subscriptionId = generateUUID();
    
    await pool.query(
      `INSERT INTO subscriptions (id, user_id, plan_id, amount, payment_method, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [subscriptionId, req.user.userId, planId, amount, paymentMethod]
    );

    // Generate payment URL (placeholder)
    const paymentUrl = `https://www.studyproglobal.com.bd/payment/${subscriptionId}`;

    return successResponse(res, {
      subscriptionId,
      paymentUrl,
      orderId: subscriptionId,
      amount,
      currency: 'USD'
    }, 201);

  } catch (error) {
    console.error('Create subscription error:', error);
    return errorResponse(res, 500, 'SUBSCRIPTION_FAILED', 'Failed to create subscription');
  }
});

// Get user subscriptions
router.get('/my-subscriptions', verifyToken, async (req, res) => {
  try {
    const [subscriptions] = await pool.query(
      `SELECT id, plan_id, status, amount, currency, payment_method, started_at, expires_at, created_at
       FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.userId]
    );

    return successResponse(res, {
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        planId: sub.plan_id,
        status: sub.status,
        amount: sub.amount,
        currency: sub.currency,
        paymentMethod: sub.payment_method,
        startedAt: sub.started_at,
        expiresAt: sub.expires_at,
        createdAt: sub.created_at
      }))
    });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch subscriptions');
  }
});

// Activate subscription (internal use, called after payment confirmation)
router.post('/:subscriptionId/activate', verifyToken, async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    // Get subscription
    const [subscriptions] = await pool.query(
      'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
      [subscriptionId, req.user.userId]
    );

    if (subscriptions.length === 0) {
      return errorResponse(res, 404, 'SUBSCRIPTION_NOT_FOUND', 'Subscription not found');
    }

    const subscription = subscriptions[0];

    if (subscription.status === 'active') {
      return errorResponse(res, 400, 'ALREADY_ACTIVE', 'Subscription is already active');
    }

    // Activate subscription
    const startedAt = new Date();
    const expiresAt = addYears(startedAt, 2);

    await pool.query(
      `UPDATE subscriptions SET status = 'active', started_at = ?, expires_at = ?
       WHERE id = ?`,
      [formatDateTime(startedAt), formatDateTime(expiresAt), subscriptionId]
    );

    // Update user subscription
    await pool.query(
      `UPDATE users SET subscription_type = ?, subscription_expires_at = ?
       WHERE id = ?`,
      [subscription.plan_id, formatDateTime(expiresAt), req.user.userId]
    );

    return successResponse(res, {
      message: 'Subscription activated successfully',
      planId: subscription.plan_id,
      expiresAt
    });

  } catch (error) {
    console.error('Activate subscription error:', error);
    return errorResponse(res, 500, 'ACTIVATION_FAILED', 'Failed to activate subscription');
  }
});

module.exports = router;
