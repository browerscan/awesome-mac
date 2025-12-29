// ============================================
// Database Configuration Module
// ============================================
// Unified exports for database configuration
// ============================================

export * from './connection';
// Prisma is not installed - comment out until needed
// export * from './prisma';
export * from './drizzle';

export { getPool as pool } from './connection';
// Prisma is not installed - comment out until needed
// export { prisma } from './prisma';
export { db as drizzle } from './drizzle';

// Re-export for backward compatibility
export {
  getDatabaseConfig,
  healthCheck,
  closePool,
  getConnection,
  withTransaction,
} from './connection';
