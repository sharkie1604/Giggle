import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Register handler placeholder' });
});

export const login = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Login handler placeholder' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});
