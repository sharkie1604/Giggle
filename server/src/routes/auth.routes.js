import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/me', verifyJwt, getMe);

export default router;
