import rateLimit from 'express-rate-limit';

/**
 * Authentication Rate Limiter (Security Rule 8)
 * Caps requests to /api/auth/login and /api/auth/register at 10 requests per 15 minutes per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    });
  },
});

/**
 * General API Rate Limiter
 * Standard protection for general endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'Too many requests. Please slow down and try again shortly.',
    });
  },
});

export default {
  authRateLimiter,
  apiRateLimiter,
};
