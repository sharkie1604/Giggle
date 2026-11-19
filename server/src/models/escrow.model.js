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

export const EscrowModel = {
  create: (data) => prisma.escrow.create({ data }),
  findById: (id, include) => prisma.escrow.findUnique({ where: { id }, include }),
  findByJobId: (jobId, include) => prisma.escrow.findUnique({ where: { jobId }, include }),
  update: (id, data) => prisma.escrow.update({ where: { id }, data }),
  findEscrowByIdWithJob,
};

export default EscrowModel;
