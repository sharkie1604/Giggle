import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * createInitiatedDeposit — creates a new transaction record for a newly initiated Razorpay deposit order
 * @param {object} params - { escrowId, userId, razorpayOrderId, amount }
 * @returns {Promise<Transaction>}
 */
export const createInitiatedDeposit = async ({
  escrowId,
  userId,
  razorpayOrderId,
  amount,
}) => {
  return prisma.transaction.create({
    data: {
      escrowId,
      userId,
      razorpayOrderId,
      amount,
      type: 'DEPOSIT',
      status: 'INITIATED',
    },
  });
};

/**
 * confirmDepositWebhookAtomically — idempotent atomic update for payment.captured webhook
 * @param {object} params - { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 * @returns {Promise<{ alreadyProcessed: boolean, escrow: Escrow, transaction: Transaction }>}
 */
export const confirmDepositWebhookAtomically = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const transaction = await prisma.transaction.findUnique({
    where: { razorpayOrderId },
    include: { escrow: true },
  });

  if (!transaction) {
    throw new ApiError(404, 'Transaction order not found');
  }

  // CRITICAL SECURITY RULE 4 (Webhook Idempotency):
  // If transaction is already SUCCESS or escrow is already not PENDING, return cleanly
  if (transaction.status === 'SUCCESS' || transaction.escrow.status !== 'PENDING') {
    return {
      alreadyProcessed: true,
      escrow: transaction.escrow,
      transaction,
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update Transaction to SUCCESS
    const updatedTransaction = await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'SUCCESS',
        razorpayPaymentId,
        razorpaySignature,
      },
    });

    // 2. Update Escrow status from PENDING to FUNDED
    const updatedEscrow = await tx.escrow.update({
      where: { id: transaction.escrowId },
      data: {
        status: 'FUNDED',
      },
    });

    return {
      alreadyProcessed: false,
      escrow: updatedEscrow,
      transaction: updatedTransaction,
    };
  });

  return result;
};

export const TransactionModel = {
  create: (data) => prisma.transaction.create({ data }),
  findById: (id) => prisma.transaction.findUnique({ where: { id } }),
  findByOrderId: (razorpayOrderId) =>
    prisma.transaction.findUnique({ where: { razorpayOrderId } }),
  findByPaymentId: (razorpayPaymentId) =>
    prisma.transaction.findUnique({ where: { razorpayPaymentId } }),
  findManyByUserId: (userId) =>
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { escrow: { include: { job: true } } },
    }),
  update: (id, data) => prisma.transaction.update({ where: { id }, data }),
  createInitiatedDeposit,
  confirmDepositWebhookAtomically,
};

export default TransactionModel;
