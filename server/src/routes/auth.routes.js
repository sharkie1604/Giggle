import { Router } from 'express';
import { z } from 'zod';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// ─── Zod Validation Schemas ───────────────────────────────────────────────────

/**
 * registerSchema — strict body validation for POST /register.
 *
 * .strict() rejects any extra key not declared here (prevents prototype pollution
 * and obscure bypass attempts via unexpected fields).
 *
 * Role enum intentionally excludes 'ADMIN' — ADMIN is never self-assignable.
 * Password max 72 chars matches bcrypt's internal processing limit.
 */
const registerSchema = z
  .object({
    email: z
      .string({ required_error: 'email is required' })
      .email('Must be a valid email address')
      .max(254, 'Email must not exceed 254 characters'),

    password: z
      .string({ required_error: 'password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must not exceed 72 characters'),

    name: z
      .string({ required_error: 'name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters'),

    role: z
      .enum(['CLIENT', 'FREELANCER'], {
        errorMap: () => ({ message: "role must be 'CLIENT' or 'FREELANCER'" }),
      })
      .optional(),

    skills: z
      .array(z.string().min(1, 'Skill must not be an empty string'))
      .optional(),

    bio: z.string().max(500, 'Bio must not exceed 500 characters').optional(),

    githubUrl: z
      .string()
      .url('githubUrl must be a valid URL')
      .startsWith('https://', 'githubUrl must use HTTPS')
      .optional(),

    portfolioUrl: z
      .string()
      .url('portfolioUrl must be a valid URL')
      .startsWith('https://', 'portfolioUrl must use HTTPS')
      .optional(),
  })
  .strict(); // Reject any extra fields not listed above

/**
 * loginSchema — strict body validation for POST /login.
 *
 * password min(1) here (not min(8)) — validation is intentionally lax on login
 * to avoid revealing whether a password policy mismatch caused the failure.
 * The generic 401 error in the controller is the actual security gate.
 */
const loginSchema = z
  .object({
    email: z
      .string({ required_error: 'email is required' })
      .email('Must be a valid email address'),

    password: z
      .string({ required_error: 'password is required' })
      .min(1, 'Password must not be empty'),
  })
  .strict();

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/auth/register
// authRateLimiter: 10 requests / 15 min / IP (defined in rateLimit.middleware.js)
// validate: Zod strict schema rejection before the controller ever runs
router.post('/register', authRateLimiter, validate({ body: registerSchema }), register);

// POST /api/auth/login
router.post('/login', authRateLimiter, validate({ body: loginSchema }), login);

// GET /api/auth/me  — returns authenticated user's own profile
router.get('/me', verifyJwt, getMe);

export default router;
