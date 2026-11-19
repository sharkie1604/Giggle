import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/db.js';
import { createTwoWayReview, ReviewModel } from '../models/review.model.js';

/**
 * POST /api/jobs/:id/reviews
 * Submits a mutual two-way review on a COMPLETED gig.
 *
 * CRITICAL SECURITY INVARIANTS:
 * 1. Participants Only: Only the gig's client or hired freelancer can submit a review.
 * 2. Lifecycle Lock: Reviews can only be submitted after job.status === 'COMPLETED'.
 * 3. Idempotent Mutual Review: Database constraint @@unique([jobId, reviewerId]) prevents duplicate reviews.
 */
export const submitReview = asyncHandler(async (req, res) => {
  const jobId = Number(req.params.id || req.params.jobId);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      clientId: true,
      status: true,
      escrow: {
        select: {
          id: true,
          freelancerId: true,
        },
      },
    },
  });

  if (!job) {
    throw new ApiError(404, 'Gig not found');
  }

  // Lifecycle check: Reviews only allowed after gig completion
  if (job.status !== 'COMPLETED') {
    throw new ApiError(409, 'Reviews can only be submitted after a gig is completed');
  }

  const isClient = req.user.id === job.clientId;
  const isFreelancer = req.user.id === job.escrow?.freelancerId;

  if (!isClient && !isFreelancer) {
    throw new ApiError(403, 'Only participants on this gig can leave a review');
  }

  if (!job.escrow?.freelancerId) {
    throw new ApiError(409, 'Cannot review a gig without an assigned freelancer');
  }

  const revieweeId = isClient ? job.escrow.freelancerId : job.clientId;
  const { rating, comment } = req.body;

  try {
    const review = await createTwoWayReview({
      jobId,
      reviewerId: req.user.id,
      revieweeId,
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    // Catch unique constraint violation on @@unique([jobId, reviewerId])
    if (error.code === 'P2002') {
      throw new ApiError(409, 'You have already submitted a review for this gig');
    }
    throw error;
  }
});

export const createReview = submitReview;

/**
 * GET /api/reviews/user/:userId
 * Retrieves reviews received by a user.
 */
export const getUserReviews = asyncHandler(async (req, res) => {
  const userId = Number(req.params.userId || req.params.id);
  const reviews = await ReviewModel.findManyByReviewee(userId);
  res.status(200).json({
    success: true,
    reviews,
  });
});

export default {
  submitReview,
  createReview,
  getUserReviews,
};
