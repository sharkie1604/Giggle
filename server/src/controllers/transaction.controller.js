import { asyncHandler } from '../utils/asyncHandler.js';

export const getUserTransactions = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Get transactions placeholder' });
});
