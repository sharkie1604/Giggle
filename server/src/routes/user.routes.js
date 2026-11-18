import { Router } from 'express';
import { z } from 'zod';
import { getUserProfile, updateProfile } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  validate,
  positiveIntParamSchema,
  httpsUrlSchema,
  nonEmptyObject,
} from '../middleware/validate.middleware.js';

const router = Router();

// ─── Zod Validation Schemas ───────────────────────────────────────────────────

export const userIdParamSchema = z.object({
  id: positiveIntParamSchema,
});

export const updateProfileSchema = nonEmptyObject(
  z
    .object({
      name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .optional(),
      bio: z
        .string()
        .max(2000, 'Bio must not exceed 2000 characters')
        .nullable()
        .optional(),
      skills: z
        .array(
          z
            .string()
            .min(1, 'Skill cannot be empty')
            .max(50, 'Skill name must not exceed 50 characters')
        )
        .max(20, 'Maximum 20 skills allowed')
        .optional(),
      githubUrl: httpsUrlSchema.nullable().optional(),
      portfolioUrl: httpsUrlSchema.nullable().optional(),
      upiId: z
        .string()
        .regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, 'Invalid UPI ID format')
        .nullable()
        .optional(),
    })
    .strict()
);

// ─── Route Bindings ───────────────────────────────────────────────────────────

// GET /api/users/:id -> Public profile view (No auth required)
router.get('/:id', validate({ params: userIdParamSchema }), getUserProfile);

// PATCH /api/users/:id -> Authenticated owner update with IDOR protection
router.patch(
  '/:id',
  authenticate,
  validate({ params: userIdParamSchema, body: updateProfileSchema }),
  updateProfile
);

export default router;
