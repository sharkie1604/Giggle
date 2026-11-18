import { prisma } from '../config/db.js';

/**
 * createProposal — inserts a new proposal row with PENDING status.
 * Returns the proposal with public freelancer details.
 *
 * @param {object} data — { jobId, freelancerId, proposalNote, estimatedDays }
 * @returns {Promise<Proposal>}
 */
export const createProposal = async ({ jobId, freelancerId, proposalNote, estimatedDays }) => {
  return prisma.proposal.create({
    data: {
      jobId,
      freelancerId,
      proposalNote,
      estimatedDays,
      status: 'PENDING',
    },
    include: {
      freelancer: {
        select: {
          id: true,
          name: true,
          skills: true,
          githubUrl: true,
          portfolioUrl: true,
        },
      },
    },
  });
};

/**
 * findProposalsByJobId — retrieves all proposals for a given gig in chronological order.
 * CRITICAL SECURITY RULE 6 (PII Isolation):
 * Selects only public freelancer details, omitting passwordHash, email, and upiId.
 *
 * @param {number} jobId
 * @returns {Promise<Proposal[]>}
 */
export const findProposalsByJobId = async (jobId) => {
  return prisma.proposal.findMany({
    where: { jobId },
    orderBy: { createdAt: 'asc' },
    include: {
      freelancer: {
        select: {
          id: true,
          name: true,
          bio: true,
          skills: true,
          githubUrl: true,
          portfolioUrl: true,
        },
      },
    },
  });
};

/**
 * findProposalByIdWithJob — retrieves a proposal including parent job metadata
 * (id, clientId, budget, status, title) for ownership and lifecycle verification.
 *
 * @param {number} proposalId
 * @returns {Promise<Proposal|null>}
 */
export const findProposalByIdWithJob = async (proposalId) => {
  return prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      job: {
        select: {
          id: true,
          clientId: true,
          budget: true,
          status: true,
          title: true,
        },
      },
    },
  });
};

/**
 * deleteProposalById — deletes a PENDING proposal when withdrawn by the owning freelancer.
 *
 * @param {number} proposalId
 * @returns {Promise<Proposal>}
 */
export const deleteProposalById = async (proposalId) => {
  return prisma.proposal.delete({
    where: { id: proposalId },
  });
};

/**
 * acceptProposalAtomically — executes a single Prisma interactive transaction
 * performing all 4 steps atomically:
 * 1. Updates chosen proposal to 'ACCEPTED'
 * 2. Bulk updates all competing 'PENDING' proposals on the gig to 'REJECTED'
 * 3. Locks Job.status to 'IN_PROGRESS'
 * 4. Creates 1-to-1 Escrow record initialized strictly with Job.budget
 *
 * @param {object} params — { proposalId, jobId, freelancerId, budget }
 * @returns {Promise<{ acceptedProposal, job, escrow }>}
 */
export const acceptProposalAtomically = async ({ proposalId, jobId, freelancerId, budget }) => {
  return prisma.$transaction(async (tx) => {
    // 1. Mark accepted proposal
    const acceptedProposal = await tx.proposal.update({
      where: { id: proposalId },
      data: { status: 'ACCEPTED' },
    });

    // 2. Reject competing pending proposals on the same job
    await tx.proposal.updateMany({
      where: {
        jobId,
        id: { not: proposalId },
        status: 'PENDING',
      },
      data: { status: 'REJECTED' },
    });

    // 3. Lock job to IN_PROGRESS
    const job = await tx.job.update({
      where: { id: jobId },
      data: { status: 'IN_PROGRESS' },
    });

    // 4. Create 1-to-1 Escrow record with Job.budget
    const escrow = await tx.escrow.create({
      data: {
        jobId,
        freelancerId,
        amount: budget,
        status: 'PENDING',
      },
    });

    return { acceptedProposal, job, escrow };
  });
};

export const ProposalModel = {
  create: (data) => prisma.proposal.create({ data }),
  findById: (id, include) => prisma.proposal.findUnique({ where: { id }, include }),
  findByJobAndFreelancer: (jobId, freelancerId) =>
    prisma.proposal.findUnique({
      where: {
        jobId_freelancerId: { jobId, freelancerId },
      },
    }),
  findMany: (args) => prisma.proposal.findMany(args),
  countByJobId: (jobId) => prisma.proposal.count({ where: { jobId } }),
  update: (id, data) => prisma.proposal.update({ where: { id }, data }),
};
