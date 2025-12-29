// ============================================
// Drizzle ORM Configuration
// ============================================

import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../schema/drizzle/schema';
import { getPool } from './connection';

// ============================================================================
// DRIZZLE CLIENT SINGLETON
// ============================================================================

declare global {
  // eslint-disable-next-line no-var
  var drizzleDb: ReturnType<typeof drizzle> | undefined;
}

/**
 * Get or create the Drizzle client singleton
 */
export function getDrizzleClient() {
  if (global.drizzleDb) {
    return global.drizzleDb;
  }

  const pool = getPool();
  const client = drizzle(pool, { schema });

  if (process.env.NODE_ENV !== 'production') {
    global.drizzleDb = client;
  }

  return client;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const db = getDrizzleClient();

export default db;
