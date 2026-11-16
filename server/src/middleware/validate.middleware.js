import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

/**
 * Reusable Zod Helper: Validates positive integer parameters (e.g. route :id)
 * Rejects negative numbers, decimals, non-numbers, and string suffixes like '12abc'
 */
export const positiveIntParamSchema = z
  .string()
  .regex(/^\d+$/, 'Parameter must contain only positive numeric digits')
  .transform((val) => parseInt(val, 10))
  .refine((num) => Number.isInteger(num) && num > 0, {
    message: 'Parameter must be a positive integer greater than zero',
  });

/**
 * Reusable Zod Helper: Strictly parses URLs via `new URL(val)` and enforces `https:`
 * Invariant 7: Stored XSS Prevention
 */
export const httpsUrlSchema = z.string().trim().refine(
  (val) => {
    try {
      const parsed = new URL(val);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  },
  {
    message: 'URL must be a valid absolute HTTPS URL (e.g. https://github.com/...)',
  }
);

/**
 * Reusable Zod Helper: Enforces non-empty request body for PATCH/PUT updates
 * Invariant 9: Rejects empty payload `{}`
 */
export const nonEmptyObject = (schema) =>
  schema.refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Request payload must not be empty' }
  );

/**
 * Centralized Validation Middleware Factory
 * Supports optional `body`, `params`, and `query` Zod schemas.
 * Rejects unknown keys via `.strict()` on body schema.
 */
export const validate = ({ body, params, query }) => {
  return async (req, res, next) => {
    try {
      if (params) {
        req.params = await params.parseAsync(req.params);
      }

      if (query) {
        req.query = await query.parseAsync(req.query);
      }

      if (body) {
        // Enforce strictness to reject unexpected/unknown JSON keys (Invariant 9)
        const strictBody = body instanceof z.ZodObject ? body.strict() : body;
        req.body = await strictBody.parseAsync(req.body);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Helper middleware specifically for standard route `:id` parameter validation
 */
export const validateIdParam = (paramName = 'id') => {
  return validate({
    params: z.object({
      [paramName]: positiveIntParamSchema,
    }),
  });
};

export default validate;
