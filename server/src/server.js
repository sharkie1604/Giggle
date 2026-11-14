import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/db.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server successfully started on port ${PORT} [Environment: ${env.NODE_ENV}]`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received. Closing HTTP server and database connections.`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Prisma disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
