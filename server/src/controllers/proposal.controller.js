import { asyncHandler } from '../utils/asyncHandler.js';

export const submitProposal = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, message: 'Submit proposal placeholder' });
});

export const getJobProposals = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Get proposals placeholder' });
});

export const acceptProposal = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Accept proposal placeholder' });
});
