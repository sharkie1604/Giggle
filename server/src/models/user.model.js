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
 * and upiId.  MUST NOT be returned directly in HTTP responses.
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
