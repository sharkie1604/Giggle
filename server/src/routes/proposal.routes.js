import { Router } from 'express';
import { z } from 'zod';
import {
  withdrawProposal,
  acceptProposal,
} from '../controllers/proposal.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  validate,
  positiveIntParamSchema,
} from '../middleware/validate.middleware.js';

const router = Router();

// ─── Zod Validation Schemas ───────────────────────────────────────────────────

export const createProposalSchema = z
  .object({
    proposalNote: z
      .string({ required_error: 'Proposal note is required' })
      .min(20, 'Proposal note must be at least 20 characters')
      .max(3000, 'Proposal note must not exceed 3000 characters'),
    estimatedDays: z.coerce
      .number({ required_error: 'Estimated days is required' })
      .int('Estimated delivery must be an integer number of days')
      .min(1, 'Estimated delivery must be at least 1 day')
      .max(365, 'Estimated delivery cannot exceed 365 days'),
  })
  .strict();

export const proposalIdParamSchema = z.object({
  id: positiveIntParamSchema,
});

// ─── Route Declarations (mounted at /api/proposals) ───────────────────────────

// DELETE /api/proposals/:id -> Freelancer withdraws pending proposal
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('FREELANCER'),
  validate({ params: proposalIdParamSchema }),
  withdrawProposal
);

// PATCH /api/proposals/:id/accept -> Client accepts proposal (locks gig, rejects others, inits escrow)
router.patch(
  '/:id/accept',
  authenticate,
  authorizeRoles('CLIENT'),
  validate({ params: proposalIdParamSchema }),
  acceptProposal
);

export default router;
