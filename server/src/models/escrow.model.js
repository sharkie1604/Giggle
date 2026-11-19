import { prisma } from '../config/db.js';

/**
 * findEscrowByIdWithJob — retrieves an escrow with attached job client ownership and safe freelancer info
 * @param {number} escrowId
 * @returns {Promise<Escrow|null>}
 */
export const findEscrowByIdWithJob = async (escrowId) => {
  return prisma.escrow.findUnique({
    where: { id: escrowId },
    include: {
      job: {
        select: {
          id: true,
          clientId: true,
          title: true,
          status: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          upiId: true,
        },
      },
    },
  });
};

/**
 * releaseEscrowAtomically — executes ACID release transaction across Submission, Escrow, Job, and Transaction.
 * 1. Updates pending/revision submissions to APPROVED.
 * 2. Transitions Escrow status to RELEASED.
 * 3. Transitions Job status to COMPLETED.
 * 4. Logs a PAYOUT Transaction with status SUCCESS.
 *
 * @param {object} params - { escrowId, jobId, userId, amount }
 * @returns {Promise<{ escrow: Escrow, job: Job, payoutTransaction: Transaction }>}
 */
export const releaseEscrowAtomically = async ({ escrowId, jobId, userId, amount }) => {
  return prisma.$transaction(async (tx) => {
    // 1. Update any non-approved submission on this gig to APPROVED
    await tx.submission.updateMany({
      where: {
        jobId,
        status: { in: ['SUBMITTED', 'REVISION_REQUESTED'] },
      },
      data: {
        status: 'APPROVED',
      },
    });

    // 2. Update Escrow status from FUNDED to RELEASED
    const updatedEscrow = await tx.escrow.update({
      where: { id: escrowId },
      data: {
        status: 'RELEASED',
      },
    });

    // 3. Update Job status from IN_PROGRESS to COMPLETED
    const updatedJob = await tx.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
      },
    });

    // 4. Insert PAYOUT record into Transaction
    const payoutTransaction = await tx.transaction.create({
      data: {
        escrowId,
        userId,
        razorpayOrderId: `payout_escrow_${escrowId}_${Date.now()}`,
        amount,
        type: 'PAYOUT',
        status: 'SUCCESS',
      },
    });

    return {
      escrow: updatedEscrow,
      job: updatedJob,
      payoutTransaction,
    };
  });
};

export const EscrowModel = {
  create: (data) => prisma.escrow.create({ data }),
  findById: (id, include) => prisma.escrow.findUnique({ where: { id }, include }),
  findByJobId: (jobId, include) => prisma.escrow.findUnique({ where: { jobId }, include }),
  update: (id, data) => prisma.escrow.update({ where: { id }, data }),
  findEscrowByIdWithJob,
  releaseEscrowAtomically,
};

export default EscrowModel;
