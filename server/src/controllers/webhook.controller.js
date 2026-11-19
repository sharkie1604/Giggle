import crypto from 'node:crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { confirmDepositWebhookAtomically } from '../models/transaction.model.js';

/**
 * POST /api/webhooks/razorpay
 * Handles Razorpay webhook notifications.
 *
 * CRITICAL SECURITY INVARIANTS:
 * 1. Raw Buffer HMAC Verification: Verifies X-Razorpay-Signature using crypto.timingSafeEqual over raw request bytes.
 * 2. Webhook Idempotency: Duplicate webhooks are no-ops and never double-credit or re-fund.
 * 3. Atomic State Machine: Transitions Transaction -> SUCCESS and Escrow -> FUNDED in a single ACID transaction.
 */
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  // CRITICAL SECURITY RULE 3 (Raw Buffer Webhook HMAC Verification)
  if (!signature || !Buffer.isBuffer(req.body)) {
    throw new ApiError(401, 'Invalid or missing webhook signature');
  }

  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error('RAZORPAY_WEBHOOK_SECRET is not configured');
    throw new ApiError(500, 'Webhook secret not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    throw new ApiError(401, 'Invalid webhook signature');
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString('utf8'));
  } catch (err) {
    throw new ApiError(400, 'Invalid JSON webhook payload');
  }

  const event = payload.event;
  logger.info({ event }, 'Razorpay Webhook received');

  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = payload.payload?.payment?.entity;
    const razorpayOrderId =
      paymentEntity?.order_id || payload.payload?.order?.entity?.id;
    const razorpayPaymentId = paymentEntity?.id;

    if (razorpayOrderId) {
      const result = await confirmDepositWebhookAtomically({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: signature,
      });

      if (result.alreadyProcessed) {
        logger.info(
          { razorpayOrderId },
          'Webhook already processed (idempotent no-op)'
        );
      } else {
        logger.info(
          { razorpayOrderId, escrowId: result.escrow.id },
          'Escrow funded successfully via webhook'
        );
      }
    }
  }

  res.status(200).json({ success: true, received: true });
});

export default handleRazorpayWebhook;
