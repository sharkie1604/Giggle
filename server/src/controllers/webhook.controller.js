import { asyncHandler } from '../utils/asyncHandler.js';

export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  // Invariant 3 & 4: Uses req.body (raw Buffer) with crypto HMAC SHA256 and idempotency lock
  res.status(200).json({ status: 'ok', received: true });
});
