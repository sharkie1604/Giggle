import { Router } from 'express';
import { createReview, getUserReviews } from '../controllers/review.controller.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { validateIdParam } from '../middleware/validate.middleware.js';

const router = Router();

router.post('/job/:jobId', verifyJwt, validateIdParam('jobId'), createReview);
router.get('/user/:userId', validateIdParam('userId'), getUserReviews);

export default router;
