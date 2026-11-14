import { asyncHandler } from '../utils/asyncHandler.js';

export const submitWork = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, message: 'Submit work placeholder' });
});

export const getSubmissions = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Get submissions placeholder' });
});

export const requestRevision = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Request revision placeholder' });
});

export const approveSubmission = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Approve submission placeholder' });
});
