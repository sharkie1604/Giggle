import { prisma } from '../config/db.js';

export const JobModel = {
  create: (data) => prisma.job.create({ data }),
  findById: (id, include) => prisma.job.findUnique({ where: { id }, include }),
  findMany: (args) => prisma.job.findMany(args),
  count: (where) => prisma.job.count({ where }),
  update: (id, data) => prisma.job.update({ where: { id }, data }),
  delete: (id) => prisma.job.delete({ where: { id } }),
};
