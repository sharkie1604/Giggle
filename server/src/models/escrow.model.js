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

/**
 * markEscrowDisputed — transitions an escrow to DISPUTED status and saves disputeReason
 * @param {object} params - { escrowId, disputeReason }
 * @returns {Promise<Escrow>}
 */
export const markEscrowDisputed = async ({ escrowId, disputeReason }) => {
  return prisma.escrow.update({
    where: { id: escrowId },
    data: {
      status: 'DISPUTED',
      disputeReason,
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          clientId: true,
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
 * findAllDisputedEscrows — fetches all DISPUTED escrows for admin arbitration desk
 * @returns {Promise<Escrow[]>}
 */
export const findAllDisputedEscrows = async () => {
  return prisma.escrow.findMany({
    where: { status: 'DISPUTED' },
    orderBy: { updatedAt: 'asc' },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          budget: true,
          status: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          submissions: {
            orderBy: { createdAt: 'desc' },
          },
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          upiId: true,
        },
      },
      transactions: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
};

/**
 * resolveDisputeAtomically — executes binary admin arbitration in a single ACID transaction
 * - RELEASE_TO_FREELANCER: Escrow RELEASED, Job COMPLETED, Submissions APPROVED, PAYOUT Transaction SUCCESS
 * - REFUND_TO_CLIENT: Escrow RELEASED, Job CANCELLED, REFUND Transaction SUCCESS
 *
 * @param {object} params - { escrowId, jobId, clientId, freelancerId, amount, resolution }
 * @returns {Promise<{ escrow: Escrow, job: Job, resolutionTransaction: Transaction }>}
 */
export const resolveDisputeAtomically = async ({
  escrowId,
  jobId,
  clientId,
  freelancerId,
  amount,
  resolution,
}) => {
  return prisma.$transaction(async (tx) => {
    if (resolution === 'RELEASE_TO_FREELANCER') {
      // 1. Transition Escrow to RELEASED
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrowId },
        data: { status: 'RELEASED' },
      });

      // 2. Transition Job to COMPLETED
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: { status: 'COMPLETED' },
      });

      // 3. Mark any pending deliverables as APPROVED
      await tx.submission.updateMany({
        where: {
          jobId,
          status: { in: ['SUBMITTED', 'REVISION_REQUESTED'] },
        },
        data: { status: 'APPROVED' },
      });

      // 4. Record PAYOUT transaction to Freelancer
      const resolutionTransaction = await tx.transaction.create({
        data: {
          escrowId,
          userId: freelancerId,
          razorpayOrderId: `dispute_payout_${escrowId}_${Date.now()}`,
          amount,
          type: 'PAYOUT',
          status: 'SUCCESS',
        },
      });

      return {
        escrow: updatedEscrow,
        job: updatedJob,
        resolutionTransaction,
        transaction: resolutionTransaction,
      };
    } else {
      // REFUND_TO_CLIENT
      // 1. Transition Escrow to RELEASED (closing escrow state machine per enum)
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrowId },
        data: { status: 'RELEASED' },
      });

      // 2. Transition Job to CANCELLED
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: { status: 'CANCELLED' },
      });

      // 3. Record REFUND transaction to Client
      const resolutionTransaction = await tx.transaction.create({
        data: {
          escrowId,
          userId: clientId,
          razorpayOrderId: `dispute_refund_${escrowId}_${Date.now()}`,
          amount,
          type: 'REFUND',
          status: 'SUCCESS',
        },
      });

      return {
        escrow: updatedEscrow,
        job: updatedJob,
        resolutionTransaction,
        transaction: resolutionTransaction,
      };
    }
  });
};

export const EscrowModel = {
  create: (data) => prisma.escrow.create({ data }),
  findById: (id, include) => prisma.escrow.findUnique({ where: { id }, include }),
  findByJobId: (jobId, include) => prisma.escrow.findUnique({ where: { jobId }, include }),
  update: (id, data) => prisma.escrow.update({ where: { id }, data }),
  findEscrowByIdWithJob,
  releaseEscrowAtomically,
  markEscrowDisputed,
  findAllDisputedEscrows,
  resolveDisputeAtomically,
};

export default EscrowModel;
