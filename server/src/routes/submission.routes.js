import { Router } from 'express';
import { z } from 'zod';
import {
  submitCodeDelivery,
  getSubmissions,
  requestRevision,
  approveSubmission,
} from '../controllers/submission.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  validate,
  positiveIntParamSchema,
  httpsUrlSchema,
} from '../middleware/validate.middleware.js';

const router = Router();

// ─── Zod Validation Schemas ───────────────────────────────────────────────────

export const createSubmissionSchema = z
  .object({
    deliveryUrl: httpsUrlSchema,
    notes: z
      .string({ required_error: 'Delivery notes are required' })
      .min(10, 'Delivery notes must be at least 10 characters')
      .max(3000, 'Delivery notes must not exceed 3000 characters'),
  })
  .strict();

export const submissionIdParamSchema = z.object({
  id: positiveIntParamSchema,
});

export const revisionSchema = z
  .object({
    revisionNotes: z
      .string({ required_error: 'Revision notes are required' })
      .trim()
      .min(5, 'Please describe the changes needed (min 5 characters)')
      .max(1000, 'Revision notes cannot exceed 1000 characters'),
  })
  .strict();

export const jobIdParamSchema = z.object({
  jobId: positiveIntParamSchema,
});

// ─── Route Bindings ───────────────────────────────────────────────────────────

// PATCH /api/submissions/:id/revision -> Client requests revisions on a delivery
router.patch(
  '/:id/revision',
  authenticate,
  authorizeRoles('CLIENT'),
  validate({ params: submissionIdParamSchema, body: revisionSchema }),
  requestRevision
);

// POST alias for revision request
router.post(
  '/:id/revision',
  authenticate,
  authorizeRoles('CLIENT'),
  validate({ params: submissionIdParamSchema, body: revisionSchema }),
  requestRevision
);

// GET /api/submissions/job/:jobId -> Fetch all submissions for a gig
router.get(
  '/job/:jobId',
  authenticate,
  validate({ params: jobIdParamSchema }),
  getSubmissions
);

// POST /api/submissions/:id/approve -> Placeholder / Info
router.post(
  '/:id/approve',
  authenticate,
  authorizeRoles('CLIENT'),
  validate({ params: submissionIdParamSchema }),
  approveSubmission
);

export default router;
