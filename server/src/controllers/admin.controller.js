import { asyncHandler } from '../utils/asyncHandler.js';

export const listDisputes = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'List disputes placeholder' });
});

export const resolveDispute = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Resolve dispute placeholder' });
});
