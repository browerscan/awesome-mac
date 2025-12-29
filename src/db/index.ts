// ============================================
// Database Module
// ============================================
// Unified exports for database functionality
// ============================================

export * from './config';
export * from './schema/drizzle/schema';

// Re-export commonly used items
export { getPool, healthCheck, withTransaction, getConnection } from './config';
export { prisma } from './config/prisma';
export { db as drizzleDb } from './config/drizzle';
export * from './schema/drizzle/schema';
