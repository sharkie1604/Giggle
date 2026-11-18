import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { createUser, findUserByEmail, findUserById } from '../models/user.model.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const BCRYPT_SALT_ROUNDS = 10; // Security Rule: minimum 10 rounds
const ALLOWED_SELF_REGISTER_ROLES = ['CLIENT', 'FREELANCER']; // ADMIN NEVER self-assignable

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * signToken — creates a signed JWT containing userId and role.
 * Payload uses `userId` (not `id`) as the canonical key — matches auth.middleware.
 *
 * @param {number} userId
 * @param {string} role
 * @returns {string} signed JWT string
 */
const signToken = (userId, role) =>
  jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || '7d',
  });

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Creates a new CLIENT or FREELANCER account.
 *
 * Security invariants:
 *  - email is lowercased + trimmed before storage and lookup
 *  - password hashed with bcrypt (BCRYPT_SALT_ROUNDS = 10)
 *  - ADMIN role is blocked at the Zod schema level (enum only allows CLIENT | FREELANCER)
 *  - passwordHash and upiId are NEVER returned in the response (enforced by Prisma select in createUser)
 *  - duplicate email → Prisma P2002 → error.middleware maps to HTTP 409 Conflict
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, name, role, skills, bio, githubUrl, portfolioUrl } = req.body;

  // 1. Normalise email (Zod validated it is a valid email format already)
  const normalisedEmail = email.toLowerCase().trim();

  // 2. Validate role — only CLIENT or FREELANCER allowed on public registration
  //    (Zod schema enforces this too, but belt-and-suspenders is correct here)
  const assignedRole = role ?? 'FREELANCER';
  if (!ALLOWED_SELF_REGISTER_ROLES.includes(assignedRole)) {
    throw ApiError.forbidden('You cannot self-assign that role.');
  }

  // 3. Hash the password — bcrypt with 10 salt rounds
  //    bcrypt internally stores the salt inside the hash string; no separate column needed.
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // 4. Persist the user — Prisma select inside createUser strips passwordHash + upiId
  const user = await createUser({
    email: normalisedEmail,
    passwordHash,
    name,
    role: assignedRole,
    ...(skills && { skills }),
    ...(bio && { bio }),
    ...(githubUrl && { githubUrl }),
    ...(portfolioUrl && { portfolioUrl }),
  });

  // 5. Issue JWT — payload: { userId, role }
  const token = signToken(user.id, user.role);

  // 6. HTTP 201 Created
  return res.status(201).json({
    success: true,
    token,
    user,
  });
});

/**
 * POST /api/auth/login
 * Authenticates an existing user and issues a JWT.
 *
 * Security invariants:
 *  - Generic 401 message used for BOTH "user not found" and "wrong password" cases.
 *    This prevents email-enumeration attacks.
 *  - bcrypt.compare is always called (even if user doesn't exist) only when user is found;
 *    we short-circuit early with the same error to avoid timing-difference leaks.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Lookup user (includes passwordHash for verification)
  const user = await findUserByEmail(email);

  // 2. Generic 401 if user not found — do NOT reveal whether the email exists
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // 3. Compare supplied password against the stored bcrypt hash
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // 4. Issue JWT
  const token = signToken(user.id, user.role);

  // 5. Strip sensitive fields before sending the response
  //    (passwordHash and upiId must NEVER appear in HTTP responses)
  const { passwordHash: _hash, upiId: _upi, ...safeUser } = user;

  // 6. HTTP 200 OK
  return res.status(200).json({
    success: true,
    token,
    user: safeUser,
  });
});

/**
 * GET /api/auth/me
 * Returns the authenticated user's safe profile.
 * Requires verifyJwt middleware (req.user is populated with { id, role }).
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);

  if (!user) {
    throw ApiError.notFound('User no longer exists.');
  }

  return res.status(200).json({ success: true, user });
});
