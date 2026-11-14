import { asyncHandler } from '../utils/asyncHandler.js';

export const listJobs = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'List jobs placeholder' });
});

export const getJobById = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Get job placeholder' });
});

export const createJob = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, message: 'Create job placeholder' });
});

export const updateJob = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Update job placeholder' });
});

export const cancelJob = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Cancel job placeholder' });
});
