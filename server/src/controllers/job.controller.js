import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { createJob as createJobModel, findOpenJobs, findJobById } from '../models/job.model.js';

/**
 * POST /api/jobs
 * Creates a new fixed-price gig.
 * Strictly restricted to CLIENT role.
 */
export const postJob = asyncHandler(async (req, res) => {
  const job = await createJobModel(req.user.id, req.body);

  res.status(201).json({
    success: true,
    job,
  });
});

/**
 * GET /api/jobs
 * Public, paginated feed of OPEN gigs.
 * Filterable by category and skill.
 */
export const getJobs = asyncHandler(async (req, res) => {
  const { category, skill, page, pageSize } = req.query;

  const result = await findOpenJobs({
    category,
    skill,
    page,
    pageSize,
  });

  res.status(200).json({
    success: true,
    jobs: result.jobs,
    pagination: result.pagination,
  });
});

/**
 * GET /api/jobs/:id
 * Public detail view for a specific gig.
 */
export const getJobById = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  const job = await findJobById(targetId);

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  res.status(200).json({
    success: true,
    job,
  });
});

// Aliases for backwards compatibility with existing stubs
export const createJob = postJob;
export const listJobs = getJobs;

// Placeholders for Task 3.2 (Job Cancellation & Bait-and-Switch Budget Freeze)
export const updateJob = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Update job placeholder (Task 3.2)' });
});

export const cancelJob = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Cancel job placeholder (Task 3.2)' });
});
