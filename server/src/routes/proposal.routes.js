import { Router } from 'express';
import {
  submitProposal,
  getJobProposals,
  acceptProposal,
} from '../controllers/proposal.controller.js';
import { verifyJwt, requireRole } from '../middleware/auth.middleware.js';
import { validateIdParam } from '../middleware/validate.middleware.js';

const router = Router();

router.post('/job/:jobId', verifyJwt, requireRole('FREELANCER'), validateIdParam('jobId'), submitProposal);
router.get('/job/:jobId', verifyJwt, validateIdParam('jobId'), getJobProposals);
router.post('/:id/accept', verifyJwt, requireRole('CLIENT'), validateIdParam('id'), acceptProposal);

export default router;
