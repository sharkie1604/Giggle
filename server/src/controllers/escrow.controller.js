import { asyncHandler } from '../utils/asyncHandler.js';

export const getEscrowDetails = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Get escrow placeholder' });
});

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  // Invariant 1: Ignores req.body.amount, must fetch from DB in implementation
  res.status(200).json({ success: true, message: 'Create order placeholder' });
});

export const releaseEscrow = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Release escrow placeholder' });
});

export const disputeEscrow = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Dispute escrow placeholder' });
});
