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
          status: 'COMPLETED',
        },
        select: {
          id: true,
          title: true,
          budget: true,
          category: true,
          updatedAt: true,
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
      ? user.jobsPosted.map((job) => ({
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
