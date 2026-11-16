import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Authentication Middleware: Extracts & verifies Bearer JWT
 * Attaches `{ id: decoded.userId, role: decoded.role }` to `req.user`
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      ApiError.unauthorized('Authentication required: Bearer token is missing or malformed')
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    if (!userId || !decoded.role) {
      return next(ApiError.unauthorized('Invalid token payload: Missing user identity or role'));
    }

    req.user = {
      id: userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Authentication failed: Access token has expired'));
    }
    return next(ApiError.unauthorized('Authentication failed: Invalid access token'));
  }
};

/**
 * Role-Based Access Control Middleware Factory
 * Restricts route to specific user roles (e.g. 'CLIENT', 'FREELANCER', 'ADMIN')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required before checking permissions'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Forbidden: Insufficient permissions. Required one of [${roles.join(', ')}], current role is '${req.user.role}'`
        )
      );
    }

    next();
  };
};

// Aliases for compatibility
export const verifyJwt = authenticate;
export const requireRole = authorizeRoles;

export default {
  authenticate,
  authorizeRoles,
  verifyJwt,
  requireRole,
};
