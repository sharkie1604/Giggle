import { prisma } from '../config/db.js';

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
};
