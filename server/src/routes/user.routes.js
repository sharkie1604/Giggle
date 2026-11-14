import { Router } from 'express';
import { getUserProfile, updateProfile } from '../controllers/user.controller.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { validateIdParam } from '../middleware/validate.middleware.js';

const router = Router();

router.get('/:id', validateIdParam('id'), getUserProfile);
router.patch('/profile', verifyJwt, updateProfile);

export default router;
