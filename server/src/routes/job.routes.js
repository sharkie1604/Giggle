import { Router } from 'express';
import {
  listJobs,
  getJobById,
  createJob,
  updateJob,
  cancelJob,
} from '../controllers/job.controller.js';
import { verifyJwt, requireRole } from '../middleware/auth.middleware.js';
import { validateIdParam } from '../middleware/validate.middleware.js';

const router = Router();

router.get('/', listJobs);
router.get('/:id', validateIdParam('id'), getJobById);
router.post('/', verifyJwt, requireRole('CLIENT', 'ADMIN'), createJob);
router.patch('/:id', verifyJwt, requireRole('CLIENT', 'ADMIN'), validateIdParam('id'), updateJob);
router.delete('/:id', verifyJwt, requireRole('CLIENT', 'ADMIN'), validateIdParam('id'), cancelJob);

export default router;
