import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { razorpay } from '../config/razorpay.js';
import { findEscrowByIdWithJob, releaseEscrowAtomically } from '../models/escrow.model.js';
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

/**
 * PATCH /api/escrow/:id/release
 * Client owner approves work and releases payment from Escrow vault to Freelancer.
 *
 * CRITICAL SECURITY INVARIANTS:
 * 1. Strict IDOR Protection: Verifies escrow.job.clientId === req.user.id.
 * 2. Lifecycle Lock: Escrow must be in FUNDED status.
 * 3. Atomic Multi-Entity Release: Atomically marks Submission APPROVED, Escrow RELEASED,
 *    Job COMPLETED, and logs a PAYOUT Transaction.
 */
export const releaseEscrowPayout = asyncHandler(async (req, res) => {
  const escrowId = Number(req.params.id);

  const escrow = await findEscrowByIdWithJob(escrowId);
  if (!escrow) {
    throw new ApiError(404, 'Protected payment record not found');
  }

  // CRITICAL SECURITY RULE 5 (Strict IDOR Protection)
  if (escrow.job.clientId !== req.user.id) {
    throw new ApiError(403, 'Only the gig owner can release payment');
  }

  // Lifecycle check: payment can only be released when FUNDED
  if (escrow.status !== 'FUNDED') {
    throw new ApiError(409, 'Payment can only be released from a funded gig');
  }

  const result = await releaseEscrowAtomically({
    escrowId: escrow.id,
    jobId: escrow.job.id,
    userId: escrow.freelancer.id,
    amount: escrow.amount,
  });

  res.status(200).json({
    success: true,
    message: 'Delivery approved and payout released!',
    ...result,
  });
});

export const releaseEscrow = releaseEscrowPayout;

export const disputeEscrow = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Dispute escrow placeholder' });
});

export default {
  createEscrowOrder,
  createRazorpayOrder,
  getEscrowDetails,
  releaseEscrow,
  releaseEscrowPayout,
  disputeEscrow,
};
