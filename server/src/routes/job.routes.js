import { Router } from 'express';
import { z } from 'zod';
import {
  postJob,
  getJobs,
  getJobById,
  updateJob,
  cancelJob,
} from '../controllers/job.controller.js';
import {
  submitProposal,
  getJobProposals,
} from '../controllers/proposal.controller.js';
import { submitCodeDelivery } from '../controllers/submission.controller.js';
import { submitReview } from '../controllers/review.controller.js';
import {
  getJobMessages,
  sendJobMessage,
} from '../controllers/message.controller.js';
import { createProposalSchema } from './proposal.routes.js';
import { createSubmissionSchema } from './submission.routes.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  validate,
  positiveIntParamSchema,
  nonEmptyObject,
} from '../middleware/validate.middleware.js';

const router = Router();

// ─── Zod Validation Schemas ───────────────────────────────────────────────────

export const createJobSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .min(5, 'Title must be at least 5 characters')
      .max(150, 'Title must not exceed 150 characters'),
    description: z
      .string({ required_error: 'Description is required' })
      .min(20, 'Description must be at least 20 characters')
      .max(5000, 'Description must not exceed 5000 characters'),
    category: z.enum(
      ['FRONTEND', 'BACKEND', 'FULLSTACK', 'MOBILE', 'AI_ML', 'DEVOPS'],
      {
        errorMap: () => ({
          message:
            "Category must be one of: 'FRONTEND', 'BACKEND', 'FULLSTACK', 'MOBILE', 'AI_ML', 'DEVOPS'",
        }),
      }
    ),
    requiredSkills: z
      .array(
        z
          .string()
          .min(1, 'Skill must not be empty')
          .max(50, 'Skill must not exceed 50 characters')
      )
      .min(1, 'At least 1 required skill must be specified')
      .max(15, 'Maximum 15 required skills allowed'),
    budget: z.coerce
      .number({ required_error: 'Budget is required' })
      .positive('Budget must be a positive number')
      .max(10000000, 'Budget cannot exceed ₹10,000,000'),
    deadline: z.coerce
      .date({ required_error: 'Deadline is required' })
      .refine((d) => d > new Date(), {
        message: 'Deadline must be in the future',
      }),
  })
  .strict();

export const updateJobSchema = nonEmptyObject(
  z
    .object({
      title: z
        .string()
        .min(5, 'Title must be at least 5 characters')
        .max(150, 'Title must not exceed 150 characters')
        .optional(),
      description: z
        .string()
        .min(20, 'Description must be at least 20 characters')
        .max(5000, 'Description must not exceed 5000 characters')
        .optional(),
      category: z
        .enum(['FRONTEND', 'BACKEND', 'FULLSTACK', 'MOBILE', 'AI_ML', 'DEVOPS'], {
          errorMap: () => ({
            message:
              "Category must be one of: 'FRONTEND', 'BACKEND', 'FULLSTACK', 'MOBILE', 'AI_ML', 'DEVOPS'",
          }),
        })
        .optional(),
      requiredSkills: z
        .array(
          z
            .string()
            .min(1, 'Skill must not be empty')
            .max(50, 'Skill must not exceed 50 characters')
        )
        .min(1, 'At least 1 required skill must be specified')
        .max(15, 'Maximum 15 required skills allowed')
        .optional(),
      budget: z.coerce
        .number()
        .positive('Budget must be a positive number')
        .max(10000000, 'Budget cannot exceed ₹10,000,000')
        .optional(),
      deadline: z.coerce
        .date()
        .refine((d) => d > new Date(), {
          message: 'Deadline must be in the future',
        })
        .optional(),
    })
    .strict()
);

export const listJobsQuerySchema = z
  .object({
    category: z
      .enum(['FRONTEND', 'BACKEND', 'FULLSTACK', 'MOBILE', 'AI_ML', 'DEVOPS'])
      .optional(),
    skill: z.string().min(1).max(50).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

export const jobIdParamSchema = z.object({
  id: positiveIntParamSchema,
});

export const createReviewSchema = z
  .object({
    rating: z.coerce
      .number({ required_error: 'Rating is required' })
      .int('Rating must be an integer')
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5'),
    comment: z
      .string()
      .trim()
      .max(1000, 'Comment cannot exceed 1000 characters')
      .optional(),
  })
  .strict();

// ─── Route Declarations ───────────────────────────────────────────────────────

// POST /api/jobs -> Client creates fixed-price gig
router.post(
  '/',
  authenticate,
  authorizeRoles('CLIENT'),
  validate({ body: createJobSchema }),
  postJob
);

// GET /api/jobs -> Public paginated & filtered gig feed
router.get('/', validate({ query: listJobsQuerySchema }), getJobs);

// GET /api/jobs/:id -> Public gig detail view
router.get('/:id', validate({ params: jobIdParamSchema }), getJobById);

// PATCH /api/jobs/:id -> Client owner updates gig (Bait-and-Switch Budget Freeze enforced)
router.patch(
  '/:id',
  authenticate,
  authorizeRoles('CLIENT'),
  validate({ params: jobIdParamSchema, body: updateJobSchema }),
  updateJob
);

// DELETE /api/jobs/:id -> Client owner soft cancels gig (status = 'CANCELLED')
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('CLIENT'),
  validate({ params: jobIdParamSchema }),
  cancelJob
);

// POST /api/jobs/:id/proposals -> Freelancer submits technical proposal
router.post(
  '/:id/proposals',
  authenticate,
  authorizeRoles('FREELANCER'),
  validate({ params: jobIdParamSchema, body: createProposalSchema }),
  submitProposal
);

// GET /api/jobs/:id/proposals -> Client owner views all proposals on gig
router.get(
  '/:id/proposals',
  authenticate,
  authorizeRoles('CLIENT'),
  validate({ params: jobIdParamSchema }),
  getJobProposals
);

// POST /api/jobs/:id/submissions -> Hired freelancer submits code/deliverables
router.post(
  '/:id/submissions',
  authenticate,
  authorizeRoles('FREELANCER'),
  validate({ params: jobIdParamSchema, body: createSubmissionSchema }),
  submitCodeDelivery
);

// POST /api/jobs/:id/reviews -> Submit mutual review on completed gig (Phase 5 - Task 5.3)
router.post(
  '/:id/reviews',
  authenticate,
  validate({ params: jobIdParamSchema, body: createReviewSchema }),
  submitReview
);

export const createMessageSchema = z
  .object({
    content: z
      .string({ required_error: 'Message content is required' })
      .trim()
      .min(1, 'Message cannot be empty')
      .max(2000, 'Message cannot exceed 2000 characters'),
  })
  .strict();

// GET /api/jobs/:id/messages -> Retrieve in-gig workroom chat messages
router.get(
  '/:id/messages',
  authenticate,
  validate({ params: jobIdParamSchema }),
  getJobMessages
);

// POST /api/jobs/:id/messages -> Post in-gig workroom chat message
router.post(
  '/:id/messages',
  authenticate,
  validate({ params: jobIdParamSchema, body: createMessageSchema }),
  sendJobMessage
);

export default router;
