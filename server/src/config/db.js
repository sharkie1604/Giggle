import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import { env } from './env.js';

const isDev = env.NODE_ENV === 'development';

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: isDev
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
        ]
      : [
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
  });

  client.$on('error', (e) => {
    logger.error({ target: e.target, message: e.message }, 'Prisma Database Error');
  });

  client.$on('warn', (e) => {
    logger.warn({ target: e.target, message: e.message }, 'Prisma Database Warning');
  });

  if (isDev) {
    client.$on('query', (e) => {
      logger.debug(
        { query: e.query, params: e.params, durationMs: e.duration },
        'Prisma Query Executed'
      );
    });
  }

  return client;
};

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
