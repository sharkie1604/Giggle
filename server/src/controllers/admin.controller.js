import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
  findAllDisputedEscrows,
  findEscrowByIdWithJob,
  resolveDisputeAtomically,
} from '../models/escrow.model.js';

/**
 * GET /api/admin/disputes
 * Admin fetches all escrows currently in DISPUTED status.
 */
export const getDisputedEscrows = asyncHandler(async (req, res) => {
  const disputes = await findAllDisputedEscrows();
  res.status(200).json({
    success: true,
    disputes,
  });
});

export const listDisputes = getDisputedEscrows;

/**
 * PATCH /api/admin/escrow/:id/resolve
 * Admin resolves a disputed escrow with binary arbitration:
 * - 'RELEASE_TO_FREELANCER': marks submissions approved, completes job, releases escrow, logs PAYOUT
 * - 'REFUND_TO_CLIENT': cancels job, closes escrow, logs REFUND
 */
export const resolveDispute = asyncHandler(async (req, res) => {
  const escrowId = Number(req.params.id || req.params.escrowId);

  const escrow = await findEscrowByIdWithJob(escrowId);
  if (!escrow) {
    throw new ApiError(404, 'Protected payment record not found');
  }

  // Lifecycle check: only DISPUTED escrows can be arbitrated
  if (escrow.status !== 'DISPUTED') {
    throw new ApiError(409, 'Only disputed payment records can be resolved by admin');
  }

  const { resolution } = req.body;
  if (!['RELEASE_TO_FREELANCER', 'REFUND_TO_CLIENT'].includes(resolution)) {
    throw new ApiError(
      400,
      "Invalid resolution. Must be either 'RELEASE_TO_FREELANCER' or 'REFUND_TO_CLIENT'"
    );
  }

  const result = await resolveDisputeAtomically({
    escrowId: escrow.id,
    jobId: escrow.job.id,
    clientId: escrow.job.clientId,
    freelancerId: escrow.freelancerId,
    amount: escrow.amount,
    resolution,
  });

  res.status(200).json({
    success: true,
    message: `Dispute resolved successfully: ${resolution}`,
    ...result,
  });
});

export default {
  getDisputedEscrows,
  listDisputes,
  resolveDispute,
};
