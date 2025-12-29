// ============================================
// Prisma Client Configuration
// ============================================

import { PrismaClient } from '@prisma/client';
import { getDatabaseConfig } from './connection';

// ============================================================================
// PRISMA CLIENT SINGLETON
// ============================================================================

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Get or create the Prisma Client singleton
 * Uses a global variable in development to prevent hot-reload from creating
 * multiple instances
 */
export function getPrismaClient(): PrismaClient {
  if (global.prisma) {
    return global.prisma;
  }

  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Log queries in development
  if (process.env.NODE_ENV === 'development') {
    client.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      console.log(`[Prisma] Query ${params.model}.${params.action} took ${after - before}ms`);
      return result;
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    global.prisma = client;
  }

  return client;
}

function getDatabaseUrl(): string {
  const config = getDatabaseConfig();
  const { host, port, database, user, password } = config;
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const prisma = getPrismaClient();

export default prisma;
