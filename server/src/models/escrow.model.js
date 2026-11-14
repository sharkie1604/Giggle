import { prisma } from '../config/db.js';

export const EscrowModel = {
  create: (data) => prisma.escrow.create({ data }),
  findById: (id, include) => prisma.escrow.findUnique({ where: { id }, include }),
  findByJobId: (jobId, include) => prisma.escrow.findUnique({ where: { jobId }, include }),
  update: (id, data) => prisma.escrow.update({ where: { id }, data }),
};
