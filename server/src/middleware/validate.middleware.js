import { ApiError } from '../utils/ApiError.js';

export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body || req.body;
      req.query = parsed.query || req.query;
      req.params = parsed.params || req.params;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const val = Number(req.params[paramName]);
    if (!val || isNaN(val) || val <= 0 || !Number.isInteger(val)) {
      return next(ApiError.badRequest(`Invalid parameter '${paramName}': must be a positive integer`));
    }
    req.params[paramName] = val;
    next();
  };
};
