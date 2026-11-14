import { Router } from 'express';
import {
  getEscrowDetails,
  createRazorpayOrder,
  releaseEscrow,
  disputeEscrow,
} from '../controllers/escrow.controller.js';
import { verifyJwt, requireRole } from '../middleware/auth.middleware.js';
import { validateIdParam } from '../middleware/validate.middleware.js';

const router = Router();

router.get('/:id', verifyJwt, validateIdParam('id'), getEscrowDetails);
router.post('/:id/create-order', verifyJwt, requireRole('CLIENT'), validateIdParam('id'), createRazorpayOrder);
router.post('/:id/release', verifyJwt, requireRole('CLIENT'), validateIdParam('id'), releaseEscrow);
router.post('/:id/dispute', verifyJwt, validateIdParam('id'), disputeEscrow);

export default router;
