import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { razorpay } from '../config/razorpay.js';
import { findEscrowByIdWithJob } from '../models/escrow.model.js';
import { createInitiatedDeposit } from '../models/transaction.model.js';

/**
 * POST /api/escrow/:id/create-order
 * Creates a Razorpay UPI order for funding an escrow vault.
 *
 * CRITICAL SECURITY INVARIANTS:
 * 1. Zero Amount Tampering: Ignores any amount in req.body. Fetches escrow.amount directly from PostgreSQL.
 * 2. Strict IDOR Protection: Verifies that req.user.id === escrow.job.clientId.
 * 3. Lifecycle Protection: Only allows funding if escrow.status === 'PENDING'.
 */
export const createEscrowOrder = asyncHandler(async (req, res) => {
  const escrowId = Number(req.params.id);

  const escrow = await findEscrowByIdWithJob(escrowId);
  if (!escrow) {
    throw new ApiError(404, 'Protected payment record not found');
  }

  // CRITICAL SECURITY RULE 5 (Strict IDOR Protection)
  if (escrow.job.clientId !== req.user.id) {
    throw new ApiError(403, 'You can only fund payments for your own gigs');
  }

  // Lifecycle check: only PENDING escrows can be funded
  if (escrow.status !== 'PENDING') {
    throw new ApiError(409, 'This gig payment has already been funded or closed');
  }

  // CRITICAL SECURITY RULE 1 (Zero Client-Side Amount Tampering):
  // Ignore req.body entirely and convert escrow.amount from PostgreSQL to paise (INR)
  const amountInPaise = Math.round(Number(escrow.amount) * 100);

  const orderOptions = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `escrow_${escrow.id}_${Date.now()}`,
    notes: {
      escrowId: String(escrow.id),
      jobId: String(escrow.jobId),
    },
  };

  const order = await razorpay.orders.create(orderOptions);

  // Record an INITIATED DEPOSIT Transaction row
  await createInitiatedDeposit({
    escrowId: escrow.id,
    userId: req.user.id,
    razorpayOrderId: order.id,
    amount: escrow.amount,
  });

  res.status(201).json({
    success: true,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    },
    keyId: env.RAZORPAY_KEY_ID,
    escrowId: escrow.id,
  });
});

export const createRazorpayOrder = createEscrowOrder;

export const getEscrowDetails = asyncHandler(async (req, res) => {
  const escrowId = Number(req.params.id);
  const escrow = await findEscrowByIdWithJob(escrowId);
  if (!escrow) {
    throw new ApiError(404, 'Protected payment record not found');
  }
  res.status(200).json({ success: true, escrow });
});

export const releaseEscrow = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Release escrow placeholder' });
});

export const disputeEscrow = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Dispute escrow placeholder' });
});

export default {
  createEscrowOrder,
  createRazorpayOrder,
  getEscrowDetails,
  releaseEscrow,
  disputeEscrow,
};
