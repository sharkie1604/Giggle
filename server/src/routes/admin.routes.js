import { Router } from 'express';
import { z } from 'zod';
import {
  getDisputedEscrows,
  listDisputes,
  resolveDispute,
} from '../controllers/admin.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate, positiveIntParamSchema } from '../middleware/validate.middleware.js';

const router = Router();

export const adminEscrowIdParamSchema = z.object({
  id: positiveIntParamSchema,
});

export const resolveDisputeSchema = z
  .object({
    resolution: z.enum(['RELEASE_TO_FREELANCER', 'REFUND_TO_CLIENT'], {
      errorMap: () => ({
        message: "Resolution must be either 'RELEASE_TO_FREELANCER' or 'REFUND_TO_CLIENT'",
      }),
    }),
  })
  .strict();

// Require ADMIN role for all administrative endpoints
router.use(authenticate, authorizeRoles('ADMIN'));

// GET /api/admin/disputes -> List all disputed escrows
router.get('/disputes', getDisputedEscrows);

// PATCH /api/admin/escrow/:id/resolve -> Admin arbitration of dispute
router.patch(
  '/escrow/:id/resolve',
  validate({ params: adminEscrowIdParamSchema, body: resolveDisputeSchema }),
  resolveDispute
);

router.post(
  '/escrow/:id/resolve',
  validate({ params: adminEscrowIdParamSchema, body: resolveDisputeSchema }),
  resolveDispute
);

// Backward-compatibility alias
router.post(
  '/disputes/:id/resolve',
  validate({ params: adminEscrowIdParamSchema, body: resolveDisputeSchema }),
  resolveDispute
);

export default router;
