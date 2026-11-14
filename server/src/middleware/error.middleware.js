import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error with request ID and trace
  logger.error(
    {
      requestId: req.id,
      path: req.originalUrl,
      method: req.method,
      errorName: err.name,
      errorMessage: err.message,
      stack: err.stack,
    },
    'Request Error'
  );

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    error = new ApiError(400, 'Validation failed', formattedErrors);
  }

  // Handle Prisma Known Request Errors
  else if (err.code) {
    switch (err.code) {
      case 'P2025':
        error = new ApiError(404, 'Requested record does not exist');
        break;
      case 'P2002': {
        const target = err.meta?.target ? ` on field (${err.meta.target})` : '';
        error = new ApiError(409, `Unique constraint violation${target}`);
        break;
      }
      case 'P2003':
        error = new ApiError(
          409,
          'Operation restricted due to dependent records (Foreign Key violation)'
        );
        break;
      case 'P2000':
        error = new ApiError(400, 'Provided value is too long for the column');
        break;
      default:
        if (err.name === 'PrismaClientKnownRequestError') {
          error = new ApiError(400, `Database error: ${err.message}`);
        }
    }
  }

  // Default to 500 if not an ApiError instance
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
