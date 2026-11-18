import { prisma } from '../config/db.js';

/**
 * createJob — Inserts a new job record with status OPEN.
 * Fixed price INR budget; no bidding allowed.
 *
 * @param {number} clientId - Authenticated client ID
 * @param {object} data - { title, description, category, requiredSkills, budget, deadline }
 * @returns {Promise<Job>}
 */
export const createJob = async (clientId, data) => {
  return prisma.job.create({
    data: {
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      requiredSkills: data.requiredSkills,
      budget: data.budget,
      deadline: new Date(data.deadline),
      status: 'OPEN',
      clientId,
    },
    include: {
      client: {
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
 * findOpenJobs — Deterministic, paginated global job feed.
 * Filterable strictly by category and skill. No algorithmic black boxes.
 *
 * @param {object} params - { category, skill, page = 1, pageSize = 10 }
 * @returns {Promise<{ jobs: Job[], pagination: { total, page, pageSize, totalPages } }>}
 */
export const findOpenJobs = async ({ category, skill, page = 1, pageSize = 10 }) => {
  const pageNum = Number(page) || 1;
  const take = Number(pageSize) || 10;
  const skip = (pageNum - 1) * take;

  const where = {
    status: 'OPEN',
    ...(category && { category }),
    ...(skill && { requiredSkills: { has: skill } }),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            proposals: true,
          },
        },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return {
    jobs,
    pagination: {
      total,
      page: pageNum,
      pageSize: take,
      totalPages: Math.ceil(total / take) || (total === 0 ? 0 : 1),
    },
  };
};

/**
 * findJobById — Fetches a single gig with public client details,
 * proposals count, escrow state, and reviews.
 * Strictly isolates PII (no email, passwordHash, upiId).
 *
 * @param {number} jobId
 * @returns {Promise<Job|null>}
 */
export const findJobById = async (jobId) => {
  return prisma.job.findUnique({
    where: { id: jobId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          bio: true,
          githubUrl: true,
          portfolioUrl: true,
        },
      },
      _count: {
        select: {
          proposals: true,
        },
      },
      escrow: {
        select: {
          id: true,
          status: true,
          amount: true,
          freelancerId: true,
          submittedAt: true,
        },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          reviewerId: true,
          revieweeId: true,
          createdAt: true,
        },
      },
    },
  });
};

/**
 * findJobWithProposalCount — Queries job with proposals count.
 * Used for lifecycle verification, IDOR ownership check, and proposal budget lock.
 *
 * @param {number} jobId
 * @returns {Promise<Job|null>}
 */
export const findJobWithProposalCount = async (jobId) => {
  return prisma.job.findUnique({
    where: { id: jobId },
    include: {
      _count: {
        select: {
          proposals: true,
        },
      },
    },
  });
};

/**
 * updateJobById — Updates mutable gig fields.
 *
 * @param {number} jobId
 * @param {object} updateData
 * @returns {Promise<Job>}
 */
export const updateJobById = async (jobId, updateData) => {
  const allowed = ['title', 'description', 'category', 'requiredSkills', 'budget', 'deadline'];
  const data = {};

  for (const key of allowed) {
    if (updateData[key] !== undefined) {
      if (key === 'title' || key === 'description') {
        data[key] = updateData[key].trim();
      } else if (key === 'deadline') {
        data[key] = new Date(updateData[key]);
      } else {
        data[key] = updateData[key];
      }
    }
  }

  return prisma.job.update({
    where: { id: jobId },
    data,
    include: {
      client: {
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
 * cancelJobById — Sets gig status to CANCELLED (soft cancellation).
 *
 * @param {number} jobId
 * @returns {Promise<Job>}
 */
export const cancelJobById = async (jobId) => {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'CANCELLED',
    },
  });
};

export default {
  createJob,
  findOpenJobs,
  findJobById,
  findJobWithProposalCount,
  updateJobById,
  cancelJobById,
};
