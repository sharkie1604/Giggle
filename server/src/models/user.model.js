import { prisma } from '../config/db.js';

export const UserModel = {
  create: (data) => prisma.user.create({ data }),
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  findById: (id, select) => prisma.user.findUnique({ where: { id }, select }),
  findPublicProfile: (id) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        bio: true,
        skills: true,
        githubUrl: true,
        portfolioUrl: true,
        createdAt: true,
      },
    }),
  update: (id, data) => prisma.user.update({ where: { id }, data }),
};
