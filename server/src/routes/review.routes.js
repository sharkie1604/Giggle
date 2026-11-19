import { Router } from 'express';
import { z } from 'zod';
import { submitReview, getUserReviews } from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, positiveIntParamSchema } from '../middleware/validate.middleware.js';
import { createReviewSchema } from './job.routes.js';

const router = Router();

const jobIdParam = z.object({
  jobId: positiveIntParamSchema,
});

const userIdParam = z.object({
  userId: positiveIntParamSchema,
});

// POST /api/reviews/job/:jobId -> Submit review (alias for /api/jobs/:id/reviews)
router.post(
  '/job/:jobId',
  authenticate,
  validate({ params: jobIdParam, body: createReviewSchema }),
  submitReview
);

// GET /api/reviews/user/:userId -> Get reviews received by a user
router.get(
  '/user/:userId',
  validate({ params: userIdParam }),
  getUserReviews
);

export default router;
