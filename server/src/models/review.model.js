import { prisma } from '../config/db.js';

export const ReviewModel = {
  create: (data) => prisma.review.create({ data }),
  findById: (id) => prisma.review.findUnique({ where: { id } }),
  findManyByReviewee: (revieweeId) =>
    prisma.review.findMany({
      where: { revieweeId },
      include: {
        reviewer: { select: { id: true, name: true, role: true } },
        job: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  findByJobAndReviewer: (jobId, reviewerId) =>
    prisma.review.findUnique({
      where: { jobId_reviewerId: { jobId, reviewerId } },
    }),
};
