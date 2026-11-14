import { Router } from 'express';
import { listDisputes, resolveDispute } from '../controllers/admin.controller.js';
import { verifyJwt, requireRole } from '../middleware/auth.middleware.js';
import { validateIdParam } from '../middleware/validate.middleware.js';

const router = Router();

router.use(verifyJwt, requireRole('ADMIN'));

router.get('/disputes', listDisputes);
router.post('/disputes/:escrowId/resolve', validateIdParam('escrowId'), resolveDispute);

export default router;
