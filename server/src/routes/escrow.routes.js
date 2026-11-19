import { Router } from 'express';
import { z } from 'zod';
import {
  createEscrowOrder,
  getEscrowDetails,
  releaseEscrow,
  disputeEscrow,
} from '../controllers/escrow.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate, positiveIntParamSchema } from '../middleware/validate.middleware.js';

const router = Router();

export const escrowIdParamSchema = z.object({
  id: positiveIntParamSchema,
});

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

// POST /api/escrow/:id/release -> CLIENT releases payment to freelancer (Phase 5 - Task 5.2)
router.post(
  '/:id/release',
  authenticate,
  authorizeRoles('CLIENT'),
  validate({ params: escrowIdParamSchema }),
  releaseEscrow
);

// POST /api/escrow/:id/dispute -> File a dispute (Phase 5 - Task 5.3)
router.post(
  '/:id/dispute',
  authenticate,
  validate({ params: escrowIdParamSchema }),
  disputeEscrow
);

export default router;
