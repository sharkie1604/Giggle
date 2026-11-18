import { Router } from 'express';
import { z } from 'zod';
import {
  postJob,
  getJobs,
  getJobById,
  updateJob,
  cancelJob,
} from '../controllers/job.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate, positiveIntParamSchema } from '../middleware/validate.middleware.js';

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

// Placeholders for Task 3.2 (Job Cancellation & Bait-and-Switch Budget Freeze)
router.patch(
  '/:id',
  authenticate,
  authorizeRoles('CLIENT'),
  validate({ params: jobIdParamSchema }),
  updateJob
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('CLIENT'),
  validate({ params: jobIdParamSchema }),
  cancelJob
);

export default router;
