import { prisma } from '../config/db.js';

/**
 * Fields safe to return to any caller (excludes passwordHash & upiId).
 * Re-used for both register response and profile queries.
 */
const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  bio: true,
  skills: true,
  githubUrl: true,
  portfolioUrl: true,
  createdAt: true,
};

/**
 * createUser — inserts a new user row and returns a safe subset.
 * Duplicate email throws Prisma P2002, which error.middleware maps to HTTP 409.
 *
 * @param {object} data — { email, passwordHash, name, role, skills?, bio?, githubUrl?, portfolioUrl? }
 * @returns {Promise<SafeUser>} safe user object (no passwordHash / upiId)
 */
export const createUser = async (data) => {
  return prisma.user.create({
    data,
    select: SAFE_USER_SELECT,
  });
};

/**
 * findUserByEmail — retrieves a user including passwordHash (for bcrypt.compare)
 * and upiId. MUST NOT be returned directly in HTTP responses.
 *
 * @param {string} email — raw email string; normalised here before the query
 * @returns {Promise<FullUser|null>}
 */
export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      ...SAFE_USER_SELECT,
      passwordHash: true,
      upiId: true,
    },
  });
};

/**
 * findUserById — retrieves a user by primary key returning only safe fields.
 * Used by /auth/me and profile lookups.
 *
 * @param {number} id
 * @returns {Promise<SafeUser|null>}
 */
export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: SAFE_USER_SELECT,
  });
};

/**
 * updateUser — partial update for profile fields.
 * Controllers MUST strip passwordHash / upiId from returned data.
 *
 * @param {number} id
 * @param {object} data
 * @returns {Promise<SafeUser>}
 */
export const updateUser = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
    select: SAFE_USER_SELECT,
  });
};

/**
 * getPublicUserProfile — queries public user profile by userId.
 * CRITICAL SECURITY RULE 6 (PII Isolation):
 * Explicitly whitelist fields and NEVER select passwordHash, email, or upiId.
 * Formats reviewsReceived (with reviewer id and name), averageRating, and completedGigs.
 *
 * @param {number} userId
 * @returns {Promise<PublicUserProfile|null>}
 */
export const getPublicUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      bio: true,
      skills: true,
      githubUrl: true,
      portfolioUrl: true,
      createdAt: true,
      reviewsReceived: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      escrows: {
        where: {
          job: {
            status: 'COMPLETED',
          },
        },
        select: {
          id: true,
          job: {
            select: {
              id: true,
              title: true,
              budget: true,
              category: true,
              updatedAt: true,
            },
          },
        },
      },
      jobsPosted: {
        where: {
          status: {
            in: ['OPEN', 'COMPLETED'],
          },
        },
        select: {
          id: true,
          title: true,
          budget: true,
          category: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const totalReviews = user.reviewsReceived.length;
  const averageRating =
    totalReviews > 0
      ? Math.round(
          (user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
            totalReviews) *
            10
        ) / 10
      : null;

  // Format completed gigs cleanly for clickable gig cards (/jobs/:id)
  const completedGigs =
    user.role === 'CLIENT'
      ? user.jobsPosted
          .filter((job) => job.status === 'COMPLETED')
          .map((job) => ({
            id: job.id,
            title: job.title,
            budget: Number(job.budget),
            category: job.category,
            updatedAt: job.updatedAt,
          }))
      : user.escrows
          .map((e) => e.job)
          .filter(Boolean)
          .map((job) => ({
            id: job.id,
            title: job.title,
            budget: Number(job.budget),
            category: job.category,
            updatedAt: job.updatedAt,
          }));

  // Jobs posted by client (OPEN and COMPLETED) for client profile view
  const jobsPosted =
    user.role === 'CLIENT'
      ? user.jobsPosted.map((job) => ({
          id: job.id,
          title: job.title,
          budget: Number(job.budget),
          category: job.category,
          status: job.status,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        }))
      : [];

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    bio: user.bio,
    skills: user.skills,
    githubUrl: user.githubUrl,
    portfolioUrl: user.portfolioUrl,
    createdAt: user.createdAt,
    averageRating,
    totalReviews,
    reviewsReceived: user.reviewsReceived,
    completedGigs,
    jobsPosted,
  };
};

/**
 * updateUserProfile — updates allowed profile fields for an authenticated owner.
 * Returns safe fields + email and upiId (strictly excluding passwordHash).
 *
 * @param {number} userId
 * @param {object} updateData
 * @returns {Promise<OwnerUserProfile>}
 */
export const updateUserProfile = async (userId, updateData) => {
  const allowedFields = ['name', 'bio', 'skills', 'githubUrl', 'portfolioUrl', 'upiId'];
  const data = {};

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      data[field] = updateData[field];
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      bio: true,
      skills: true,
      githubUrl: true,
      portfolioUrl: true,
      upiId: true,
      createdAt: true,
    },
  });
};

/**
 * getUserDashboardData — retrieves live workspace data tailored by role.
 *
 * For FREELANCER:
 * - proposals submitted by freelancerId (ordered by createdAt: 'desc'), including job with client info and escrow.
 * - escrows where freelancerId = userId (in ['PENDING', 'FUNDED', 'RELEASED', 'DISPUTED']) with job.
 * - summary stats: activeGigsCount, protectedAmount (sum of FUNDED escrows), totalProposalsCount, acceptedProposalsCount.
 *
 * For CLIENT:
 * - jobs posted by clientId = userId (ordered by createdAt: 'desc'), including escrow (with freelancer) and proposals (with safe freelancer).
 * - summary stats: openGigsCount, activeGigsCount (IN_PROGRESS), totalProposalsReceived, protectedAmount (sum of FUNDED escrows).
 *
 * Security: Strictly whitelists freelancer and client projections to NEVER expose passwordHash, email, or upiId.
 */
export const getUserDashboardData = async (userId, role) => {
  if (role === 'FREELANCER') {
    const [proposals, escrows] = await Promise.all([
      prisma.proposal.findMany({
        where: { freelancerId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              budget: true,
              category: true,
              status: true,
              deadline: true,
              client: {
                select: {
                  id: true,
                  name: true,
                },
              },
              escrow: {
                select: {
                  id: true,
                  status: true,
                  amount: true,
                },
              },
            },
          },
        },
      }),
      prisma.escrow.findMany({
        where: {
          freelancerId: userId,
          status: { in: ['PENDING', 'FUNDED', 'RELEASED', 'DISPUTED'] },
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              category: true,
              status: true,
              deadline: true,
            },
          },
        },
      }),
    ]);

    // Active gigs: jobs in progress where freelancer proposal is accepted
    const activeGigsCount = proposals.filter(
      (p) => p.status === 'ACCEPTED' && p.job?.status === 'IN_PROGRESS'
    ).length;

    // Protected amount: sum of FUNDED escrows
    const protectedAmount = escrows
      .filter((e) => e.status === 'FUNDED')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const totalProposalsCount = proposals.length;
    const acceptedProposalsCount = proposals.filter((p) => p.status === 'ACCEPTED').length;

    return {
      proposals: proposals.map((p) => ({
        ...p,
        job: p.job
          ? {
              ...p.job,
              budget: Number(p.job.budget),
              escrow: p.job.escrow
                ? {
                    ...p.job.escrow,
                    amount: Number(p.job.escrow.amount),
                  }
                : null,
            }
          : null,
      })),
      escrows: escrows.map((e) => ({
        ...e,
        amount: Number(e.amount),
      })),
      stats: {
        activeGigsCount,
        protectedAmount,
        totalProposalsCount,
        acceptedProposalsCount,
      },
    };
  }

  if (role === 'CLIENT') {
    const jobs = await prisma.job.findMany({
      where: { clientId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        escrow: {
          select: {
            id: true,
            status: true,
            amount: true,
            freelancer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        proposals: {
          orderBy: { createdAt: 'asc' },
          include: {
            freelancer: {
              select: {
                id: true,
                name: true,
                skills: true,
                githubUrl: true,
                portfolioUrl: true,
              },
            },
          },
        },
      },
    });

    const openGigsCount = jobs.filter((j) => j.status === 'OPEN').length;
    const activeGigsCount = jobs.filter((j) => j.status === 'IN_PROGRESS').length;
    const totalProposalsReceived = jobs.reduce((sum, j) => sum + (j.proposals?.length || 0), 0);
    const protectedAmount = jobs
      .filter((j) => j.escrow?.status === 'FUNDED')
      .reduce((sum, j) => sum + Number(j.escrow.amount), 0);

    return {
      jobs: jobs.map((j) => ({
        ...j,
        budget: Number(j.budget),
        escrow: j.escrow
          ? {
              ...j.escrow,
              amount: Number(j.escrow.amount),
            }
          : null,
      })),
      stats: {
        openGigsCount,
        activeGigsCount,
        totalProposalsReceived,
        protectedAmount,
      },
    };
  }

  // Fallback for ADMIN or unknown roles
  return {
    stats: {
      activeGigsCount: 0,
      protectedAmount: 0,
      totalProposalsCount: 0,
      acceptedProposalsCount: 0,
    },
  };
};
