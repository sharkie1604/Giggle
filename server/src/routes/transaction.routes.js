import { Router } from 'express';
import { getUserTransactions } from '../controllers/transaction.controller.js';
import { verifyJwt } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', verifyJwt, getUserTransactions);

export default router;
