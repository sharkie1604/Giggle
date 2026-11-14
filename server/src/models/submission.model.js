import { prisma } from '../config/db.js';

export const SubmissionModel = {
  create: (data) => prisma.submission.create({ data }),
  findById: (id, include) => prisma.submission.findUnique({ where: { id }, include }),
  findManyByJobId: (jobId) =>
    prisma.submission.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: { freelancer: { select: { id: true, name: true } } },
    }),
  update: (id, data) => prisma.submission.update({ where: { id }, data }),
};
