import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import jobRoutes from './job.routes.js';
import proposalRoutes from './proposal.routes.js';
import escrowRoutes from './escrow.routes.js';
import submissionRoutes from './submission.routes.js';
import reviewRoutes from './review.routes.js';
import transactionRoutes from './transaction.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);
router.use('/proposals', proposalRoutes);
router.use('/escrow', escrowRoutes);
router.use('/submissions', submissionRoutes);
router.use('/reviews', reviewRoutes);
router.use('/transactions', transactionRoutes);
router.use('/admin', adminRoutes);

export default router;
