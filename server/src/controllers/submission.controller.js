import { prisma } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
  createSubmissionAndTimestamp,
  findSubmissionByIdWithJob,
  markSubmissionRevisionRequested,
} from '../models/submission.model.js';

/**
 * POST /api/jobs/:id/submissions
 * Hired freelancer submits code/deliverable link for an in-progress funded gig.
 */
export const submitCodeDelivery = asyncHandler(async (req, res) => {
  const jobId = Number(req.params.id);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { escrow: true },
  });

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  // Strict Assignment & IDOR Check: Must be the hired freelancer for this gig's escrow
  if (!job.escrow || job.escrow.freelancerId !== req.user.id) {
    throw new ApiError(403, 'Only the hired freelancer can submit work for this gig');
  }

  // Payment Protection Lock: Escrow must be FUNDED before work can be submitted
  if (job.escrow.status !== 'FUNDED') {
    throw new ApiError(
      409,
      'Work can only be submitted while payment protection is funded'
    );
  }

  const { deliveryUrl, notes } = req.body;

  const { submission, escrow } = await createSubmissionAndTimestamp({
    jobId,
    freelancerId: req.user.id,
    escrowId: job.escrow.id,
    deliveryUrl,
    notes,
  });

  res.status(201).json({
    success: true,
    submission,
    escrow,
  });
});

export const submitWork = submitCodeDelivery;

/**
 * PATCH /api/submissions/:id/revision
 * Client owner requests a revision on a submitted deliverable.
 */
export const requestRevision = asyncHandler(async (req, res) => {
  const submissionId = Number(req.params.id);

  const submission = await findSubmissionByIdWithJob(submissionId);
  if (!submission) {
    throw new ApiError(404, 'Submission not found');
  }

  // Strict IDOR Protection: Must be the gig owner
  if (submission.job.clientId !== req.user.id) {
    throw new ApiError(403, 'Only the gig owner can request revisions');
  }

  // Lifecycle check: Escrow must be funded and submission must be in SUBMITTED state
  if (
    submission.job.escrow?.status !== 'FUNDED' ||
    submission.status !== 'SUBMITTED'
  ) {
    throw new ApiError(
      409,
      'Revisions can only be requested on submitted deliveries while payment is funded'
    );
  }

  const updatedSubmission = await markSubmissionRevisionRequested(submission.id);

  res.status(200).json({
    success: true,
    submission: updatedSubmission,
  });
});

/**
 * GET /api/submissions/job/:jobId
 * Retrieves all submissions for a gig.
 */
export const getSubmissions = asyncHandler(async (req, res) => {
  const jobId = Number(req.params.jobId);
  const submissions = await prisma.submission.findMany({
    where: { jobId },
    orderBy: { createdAt: 'desc' },
    include: {
      freelancer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    submissions,
  });
});

export const approveSubmission = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Approve submission is handled via escrow release endpoint',
  });
});

export default {
  submitCodeDelivery,
  submitWork,
  requestRevision,
  getSubmissions,
  approveSubmission,
};
