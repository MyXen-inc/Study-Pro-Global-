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

// Create payment
router.post('/create', verifyToken, [
  body('subscriptionId').notEmpty().withMessage('Subscription ID is required'),
  body('paymentMethod').isIn(['myxn_token', 'credit_card']).withMessage('Invalid payment method'),
  body('amount').isFloat({ min: 0 }).withMessage('Invalid amount')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', {
        errors: errors.array()
      });
    }

    const { subscriptionId, paymentMethod, amount, cardDetails } = req.body;

    // Verify subscription belongs to user
    const [subscriptions] = await pool.query(
      'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
      [subscriptionId, req.user.userId]
    );

    if (subscriptions.length === 0) {
      return errorResponse(res, 404, 'SUBSCRIPTION_NOT_FOUND', 'Subscription not found');
    }

    const subscription = subscriptions[0];

    if (subscription.status === 'active') {
      return errorResponse(res, 400, 'ALREADY_PAID', 'Subscription is already active');
    }

    // Create payment record
    const paymentId = generateUUID();
    const paymentData = paymentMethod === 'credit_card' ? { cardDetails } : {};

    await pool.query(
      `INSERT INTO payments (id, user_id, subscription_id, amount, currency, payment_method, payment_status, payment_data)
       VALUES (?, ?, ?, ?, 'USD', ?, 'pending', ?)`,
      [paymentId, req.user.userId, subscriptionId, amount, paymentMethod, JSON.stringify(paymentData)]
    );

    // Generate payment URL based on method
    let paymentUrl = '';
    let qrCode = null;

    if (paymentMethod === 'myxn_token') {
      // For cryptocurrency payment
      paymentUrl = `https://www.studyproglobal.com.bd/payment/crypto/${paymentId}`;
      qrCode = `data:image/png;base64,placeholder_qr_code`; // Placeholder
    } else {
      // For credit card payment (Stripe)
      paymentUrl = `https://www.studyproglobal.com.bd/payment/card/${paymentId}`;
    }

    return successResponse(res, {
      paymentId,
      paymentUrl,
      paymentMethod,
      amount,
      currency: 'USD',
      ...(qrCode && { qrCode })
    }, 201);

  } catch (error) {
    console.error('Create payment error:', error);
    return errorResponse(res, 500, 'PAYMENT_CREATION_FAILED', 'Failed to create payment');
  }
});

// Verify payment (webhook or manual verification)
router.post('/verify', async (req, res) => {
  try {
    const { paymentId, transactionHash } = req.body;

    if (!paymentId) {
      return errorResponse(res, 400, 'PAYMENT_ID_REQUIRED', 'Payment ID is required');
    }

    // Get payment
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE id = ?',
      [paymentId]
    );

    if (payments.length === 0) {
      return errorResponse(res, 404, 'PAYMENT_NOT_FOUND', 'Payment not found');
    }

    const payment = payments[0];

    if (payment.payment_status === 'completed') {
      return successResponse(res, {
        verified: true,
        message: 'Payment already verified',
        subscriptionActivated: true
      });
    }

    // In production, verify payment with payment gateway
    // For crypto: verify transaction on blockchain
    // For credit card: verify with Stripe webhook

    // Update payment status
    await pool.query(
      `UPDATE payments SET payment_status = 'completed', transaction_hash = ?, updated_at = NOW()
       WHERE id = ?`,
      [transactionHash || null, paymentId]
    );

    // Activate subscription
    await pool.query(
      `UPDATE subscriptions SET status = 'active', started_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL 2 YEAR)
       WHERE id = ?`,
      [payment.subscription_id]
    );

    // Get subscription to update user
    const [subscriptions] = await pool.query(
      'SELECT plan_id FROM subscriptions WHERE id = ?',
      [payment.subscription_id]
    );

    // Update user subscription
    await pool.query(
      `UPDATE users SET subscription_type = ?, subscription_expires_at = DATE_ADD(NOW(), INTERVAL 2 YEAR)
       WHERE id = ?`,
      [subscriptions[0].plan_id, payment.user_id]
    );

    return successResponse(res, {
      verified: true,
      message: 'Payment verified successfully',
      subscriptionActivated: true
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    return errorResponse(res, 500, 'VERIFICATION_FAILED', 'Failed to verify payment');
  }
});

// Get payment history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [payments] = await pool.query(
      `SELECT 
        p.id, p.amount, p.currency, p.payment_method, p.payment_status,
        p.transaction_id, p.transaction_hash, p.created_at,
        s.plan_id
       FROM payments p
       LEFT JOIN subscriptions s ON p.subscription_id = s.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.userId, parseInt(limit), offset]
    );

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM payments WHERE user_id = ?',
      [req.user.userId]
    );

    return successResponse(res, {
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        paymentMethod: p.payment_method,
        status: p.payment_status,
        transactionId: p.transaction_id,
        transactionHash: p.transaction_hash,
        planId: p.plan_id,
        createdAt: p.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    return errorResponse(res, 500, 'FETCH_FAILED', 'Failed to fetch payment history');
  }
});

// Stripe webhook endpoint (for production)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // In production, verify Stripe webhook signature
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    // Handle different event types
    // switch (event.type) {
    //   case 'payment_intent.succeeded':
    //     // Handle successful payment
    //     break;
    //   case 'payment_intent.payment_failed':
    //     // Handle failed payment
    //     break;
    // }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

module.exports = router;
