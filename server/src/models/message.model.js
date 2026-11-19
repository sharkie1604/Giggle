import { prisma } from '../config/db.js';

/**
 * createMessage — Inserts a new workroom chat message for a gig
 *
 * @param {object} params
 * @param {number} params.jobId
 * @param {number} params.senderId
 * @param {string} params.content
 * @returns {Promise<Message>}
 */
export const createMessage = async ({ jobId, senderId, content }) => {
  return prisma.message.create({
    data: {
      jobId,
      senderId,
      content,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });
};

/**
 * findMessagesByJobId — Retrieves all chat messages for a gig in chronological order
 *
 * @param {number} jobId
 * @returns {Promise<Message[]>}
 */
export const findMessagesByJobId = async (jobId) => {
  return prisma.message.findMany({
    where: { jobId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });
};
