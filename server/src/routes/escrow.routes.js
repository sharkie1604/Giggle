import { Router } from 'express';
import { z } from 'zod';
import {
  createEscrowOrder,
  getEscrowDetails,
  releaseEscrow,
  raiseDispute,
  disputeEscrow,
} from '../controllers/escrow.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate, positiveIntParamSchema } from '../middleware/validate.middleware.js';

const router = Router();

export const escrowIdParamSchema = z.object({
  id: positiveIntParamSchema,
});

export const disputeSchema = z
  .object({
    disputeReason: z
      .string({ required_error: 'Dispute reason is required' })
      .trim()
      .min(15, 'Dispute reason must be at least 15 characters')
      .max(2000, 'Dispute reason cannot exceed 2000 characters'),
  })
  .strict();

// POST /api/escrow/:id/create-order -> CLIENT owner creates Razorpay deposit order
router.post(
  '/:id/create-order',
  authenticate,
  authorizeRoles('CLIENT'),
  validate({ params: escrowIdParamSchema }),
  createEscrowOrder
);

// GET /api/escrow/:id -> Protected payment details
router.get(
  '/:id',
  authenticate,
  validate({ params: escrowIdParamSchema }),
  getEscrowDetails
);

// PATCH & POST /api/escrow/:id/release -> CLIENT releases payment to freelancer (Phase 5 - Task 5.2)
router.patch(
  '/:id/release',
  authenticate,
  authorizeRoles('CLIENT'),
  validate({ params: escrowIdParamSchema }),
  releaseEscrow
);

router.post(
  '/:id/release',
  authenticate,
  authorizeRoles('CLIENT'),
  validate({ params: escrowIdParamSchema }),
  releaseEscrow
);

// POST /api/escrow/:id/dispute -> Client owner or hired freelancer files dispute (Phase 5 - Task 5.3)
router.post(
  '/:id/dispute',
  authenticate,
  validate({ params: escrowIdParamSchema, body: disputeSchema }),
  raiseDispute
);

export default router;
