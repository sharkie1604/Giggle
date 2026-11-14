import { asyncHandler } from '../utils/asyncHandler.js';

export const getUserProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'User profile placeholder' });
});

export const updateProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Update profile placeholder' });
});
