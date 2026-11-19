import { Router } from 'express';
import {
  getTransactionHistory,
  getUserTransactions,
} from '../controllers/transaction.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/transactions/history -> Authenticated user's chronological payment ledger
router.get('/history', authenticate, getTransactionHistory);

// GET /api/transactions -> Base route alias
router.get('/', authenticate, getTransactionHistory);

export default router;
