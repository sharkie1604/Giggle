import { asyncHandler } from '../utils/asyncHandler.js';
import { findUserTransactionHistory } from '../models/transaction.model.js';

/**
 * GET /api/transactions/history & GET /api/transactions
 * Fetches transaction history for the authenticated user as payer, payee, or gig participant.
 */
export const getTransactionHistory = asyncHandler(async (req, res) => {
  const transactions = await findUserTransactionHistory(req.user.id);
  res.status(200).json({
    success: true,
    transactions,
  });
});

export const getUserTransactions = getTransactionHistory;

export default {
  getTransactionHistory,
  getUserTransactions,
};
