import { prisma } from '../config/db.js';

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
