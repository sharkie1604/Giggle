import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
  createJob as createJobModel,
  findOpenJobs,
  findJobById,
  findJobWithProposalCount,
  updateJobById,
  cancelJobById,
} from '../models/job.model.js';

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

/**
 * PATCH /api/jobs/:id
 * Edits mutable gig fields.
 *
 * CRITICAL SECURITY INVARIANTS:
 * - IDOR Protection: Owner client only (HTTP 403)
 * - Lifecycle Lock: Only OPEN gigs can be edited (HTTP 409)
 * - Bait-and-Switch Budget Freeze: Budget edits strictly rejected with HTTP 409
 *   once any proposals exist.
 */
export const updateJob = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  const job = await findJobWithProposalCount(targetId);

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  // CRITICAL SECURITY RULE 5 (Strict IDOR Protection)
  if (job.clientId !== req.user.id) {
    throw new ApiError(403, 'Forbidden: You can only edit your own gigs');
  }

  // Lifecycle lock: Only OPEN gigs can be edited
  if (job.status !== 'OPEN') {
    throw new ApiError(409, 'Conflict: Only OPEN gigs can be edited');
  }

  // CRITICAL SECURITY RULE 2 (Bait-and-Switch Budget Freeze)
  if (
    req.body.budget !== undefined &&
    job._count.proposals > 0 &&
    Number(req.body.budget) !== Number(job.budget)
  ) {
    throw new ApiError(
      409,
      'Conflict: Budget is frozen once freelancers have submitted proposals'
    );
  }

  const updatedJob = await updateJobById(job.id, req.body);

  res.status(200).json({
    success: true,
    job: updatedJob,
  });
});

/**
 * DELETE /api/jobs/:id
 * Soft cancellation of an OPEN gig (status = 'CANCELLED').
 * Preserves audit history.
 *
 * CRITICAL SECURITY INVARIANTS:
 * - IDOR Protection: Owner client only (HTTP 403)
 * - Lifecycle Lock: Only OPEN gigs can be cancelled (HTTP 409)
 */
export const cancelJob = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  const job = await findJobWithProposalCount(targetId);

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  // CRITICAL SECURITY RULE 5 (Strict IDOR Protection)
  if (job.clientId !== req.user.id) {
    throw new ApiError(403, 'Forbidden: You can only cancel your own gigs');
  }

  // Lifecycle lock: Only OPEN gigs can be cancelled
  if (job.status !== 'OPEN') {
    throw new ApiError(
      409,
      'Conflict: Cannot cancel a gig once work is in progress or completed'
    );
  }

  const cancelledJob = await cancelJobById(job.id);

  res.status(200).json({
    success: true,
    message: 'Gig cancelled successfully',
    job: cancelledJob,
  });
});

// Aliases for backwards compatibility with existing stubs
export const createJob = postJob;
export const listJobs = getJobs;
