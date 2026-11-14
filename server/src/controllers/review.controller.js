import { asyncHandler } from '../utils/asyncHandler.js';

export const createReview = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, message: 'Create review placeholder' });
});

export const getUserReviews = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Get user reviews placeholder' });
});
