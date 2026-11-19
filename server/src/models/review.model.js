import { prisma } from '../config/db.js';

/**
 * createTwoWayReview — creates a mutual review between client and freelancer on a completed gig
 * @param {object} params - { jobId, reviewerId, revieweeId, rating, comment }
 * @returns {Promise<Review>}
 */
export const createTwoWayReview = async ({
  jobId,
  reviewerId,
  revieweeId,
  rating,
  comment,
}) => {
  return prisma.review.create({
    data: {
      jobId,
      reviewerId,
      revieweeId,
      rating,
      comment,
    },
    include: {
      reviewer: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      reviewee: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
};

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
  createTwoWayReview,
};

export default ReviewModel;
