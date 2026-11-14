import { Router } from 'express';
import {
  submitWork,
  getSubmissions,
  requestRevision,
  approveSubmission,
} from '../controllers/submission.controller.js';
import { verifyJwt, requireRole } from '../middleware/auth.middleware.js';
import { validateIdParam } from '../middleware/validate.middleware.js';

const router = Router();

router.post('/job/:jobId', verifyJwt, requireRole('FREELANCER'), validateIdParam('jobId'), submitWork);
router.get('/job/:jobId', verifyJwt, validateIdParam('jobId'), getSubmissions);
router.post('/:id/revision', verifyJwt, requireRole('CLIENT'), validateIdParam('id'), requestRevision);
router.post('/:id/approve', verifyJwt, requireRole('CLIENT'), validateIdParam('id'), approveSubmission);

export default router;
