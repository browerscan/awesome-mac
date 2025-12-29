// ============================================
// Database Connection Configuration
// ============================================
// PostgreSQL connection with pooling configuration
// Supports both Prisma and Drizzle ORM
// ============================================

import { Pool, PoolConfig } from 'pg';

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

export interface DatabaseConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | Record<string, unknown>;
  poolMin?: number;
  poolMax?: number;
  idleTimeoutMs?: number;
  connectionTimeoutMs?: number;
}

/**
 * Parse DATABASE_URL into connection components
 * Supports formats:
 * - postgresql://user:password@host:port/database
 * - postgres://user:password@host:port/database
 * - Socket connections (for production environments like Neon, Supabase)
 */
function parseDatabaseUrl(url: string): DatabaseConfig {
  try {
    const parsed = new URL(url);

    const config: DatabaseConfig = {
      host: parsed.hostname || undefined,
      port: parsed.port ? parseInt(parsed.port, 10) : undefined,
      database: parsed.pathname.slice(1) || undefined,
      user: parsed.username || undefined,
      password: parsed.password || undefined,
    };

    // Handle SSL parameters from query string
    const sslParam = parsed.searchParams.get('sslmode');
    if (sslParam === 'require' || sslParam === 'no-verify') {
      config.ssl = sslParam === 'require' ? true : { rejectUnauthorized: false };
    }

    return config;
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${error}`);
  }
}

/**
 * Get database configuration from environment variables
 * Priority: DATABASE_URL > Individual env vars
 */
export function getDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return parseDatabaseUrl(databaseUrl);
  }

  // Fallback to individual environment variables
  return {
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432', 10),
    database: process.env.PGDATABASE || process.env.DB_NAME || 'awesome_mac',
    user: process.env.PGUSER || process.env.DB_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.PGSSLMODE === 'require' ? true : undefined,
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
  };
}

// ============================================================================
// CONNECTION POOL
// ============================================================================

let pool: Pool | null = null;

/**
 * Create or get the existing connection pool
 * Connection pooling is essential for PostgreSQL performance in serverless environments
 */
export function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const config = getDatabaseConfig();

  const poolConfig: PoolConfig = {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl,
    min: config.poolMin || 2,
    max: config.poolMax || 10,
    idleTimeoutMillis: config.idleTimeoutMs || 30000,
    connectionTimeoutMillis: config.connectionTimeoutMs || 10000,
  };

  pool = new Pool(poolConfig);

  // Log pool errors (don't let them crash the process)
  pool.on('error', (err) => {
    console.error('[DB] Unexpected pool error:', err);
  });

  return pool;
}

/**
 * Close the connection pool gracefully
 * Call this when shutting down the application
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// ============================================================================
// CONNECTION HEALTH CHECK
// ============================================================================

export interface HealthCheckResult {
  healthy: boolean;
  latency?: number;
  error?: string;
  poolStats?: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
}

/**
 * Check database connectivity and measure latency
 */
export async function healthCheck(): Promise<HealthCheckResult> {
  const client = getPool();

  try {
    const start = Date.now();
    const result = await client.query('SELECT 1 AS health_check');
    const latency = Date.now() - start;

    return {
      healthy: true,
      latency,
      poolStats: {
        totalCount: client.totalCount,
        idleCount: client.idleCount,
        waitingCount: client.waitingCount,
      },
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// TRANSACTION HELPERS
// ============================================================================

/**
 * Execute a callback within a database transaction
 * Automatically commits on success or rolls back on error
 */
export async function withTransaction<T>(
  callback: (
    query: (sql: string, params?: unknown[]) => Promise<import('pg').QueryResult>
  ) => Promise<T>
): Promise<T> {
  const poolClient = getPool();

  const client = await poolClient.connect();
  let released = false;

  const release = () => {
    if (!released) {
      released = true;
      client.release();
    }
  };

  try {
    await client.query('BEGIN');

    const query = async (
      sql: string,
      params: unknown[] = []
    ): Promise<import('pg').QueryResult> => {
      return client.query(sql, params);
    };

    const result = await callback(query);

    await client.query('COMMIT');
    release();

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    release();
    throw error;
  }
}

// ============================================================================
// CONNECTION FOR DIRECT QUERIES
// ============================================================================

/**
 * Get a connection from the pool for direct queries
 * Remember to release the connection when done
 */
export async function getConnection(): Promise<import('pg').PoolClient> {
  return getPool().connect();
}

// ============================================================================
// SHUTDOWN HANDLERS
// ============================================================================

// Graceful shutdown on process termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await closePool();
  });

  process.on('SIGINT', async () => {
    await closePool();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closePool();
    process.exit(0);
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export { getPool as pool };
export default getPool;
