import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { getPublicUserProfile, updateUserProfile } from '../models/user.model.js';

/**
 * GET /api/users/:id
 * Fetches public user profile.
 * Strips PII (email, upiId, passwordHash) and formats completed gigs + rating.
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  const user = await getPublicUserProfile(targetId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    user,
  });
});

/**
 * PATCH /api/users/:id
 * Updates authenticated user's own profile.
 *
 * CRITICAL SECURITY RULE 5 (Strict IDOR Protection):
 * Verifies req.user.id matches req.params.id. Throws HTTP 403 Forbidden on mismatch.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);

  if (req.user.id !== targetId) {
    throw new ApiError(403, 'Forbidden: You can only update your own profile');
  }

  const user = await updateUserProfile(req.user.id, req.body);

  res.status(200).json({
    success: true,
    user,
  });
});
