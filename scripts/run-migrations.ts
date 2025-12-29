#!/usr/bin/env tsx
// ============================================
// PostgreSQL Migration Runner
// ============================================
// Runs SQL migrations against PostgreSQL database
// Run with: tsx scripts/run-migrations.ts
// ============================================

import { getPool } from '../src/db/config';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { PoolClient } from 'pg';

// ============================================================================
// CONFIGURATION
// ============================================================================

const MIGRATIONS_DIR = join(process.cwd(), 'src/db/schema/migrations');
const SCHEMA_FILE = join(process.cwd(), 'src/db/schema/schema.sql');
const ROLLBACK_FILE = join(process.cwd(), 'src/db/schema/rollback.sql');

// ============================================================================
// TYPES
// ============================================================================

interface MigrationFile {
  name: string;
  path: string;
  number: number;
}

interface MigrationRecord {
  id: string;
  name: string;
  applied_at: Date;
}

// ============================================================================
// MIGRATION TRACKER TABLE
// ============================================================================

const MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

// ============================================================================
// MIGRATION RUNNER CLASS
// ============================================================================

class MigrationRunner {
  private pool = getPool();

  /**
   * Initialize migrations table
   */
  async init(): Promise<void> {
    await this.pool.query(MIGRATIONS_TABLE);
  }

  /**
   * Get migration files from directory
   */
  getMigrationFiles(): MigrationFile[] {
    if (!existsSync(MIGRATIONS_DIR)) {
      return [];
    }

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => {
        const match = f.match(/^(\d+)_(.+)\.sql$/);
        if (!match) {
          return null;
        }
        return {
          name: match[2],
          path: join(MIGRATIONS_DIR, f),
          number: parseInt(match[1], 10),
        };
      })
      .filter((f): f is MigrationFile => f !== null)
      .sort((a, b) => a.number - b.number);

    return files;
  }

  /**
   * Get applied migrations from database
   */
  async getAppliedMigrations(): Promise<Set<string>> {
    try {
      const result = await this.pool.query('SELECT name FROM schema_migrations');
      return new Set(result.rows.map((r: { name: string }) => r.name));
    } catch (error) {
      // Table might not exist yet
      return new Set();
    }
  }

  /**
   * Run a single migration
   */
  async runMigration(file: MigrationFile): Promise<void> {
    console.info(`[INFO] Applying migration: ${file.name}`);

    const sql = readFileSync(file.path, 'utf-8');

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Run the migration SQL
      await client.query(sql);

      // Record the migration
      await client.query('INSERT INTO schema_migrations (id, name) VALUES ($1, $2)', [
        file.number.toString(),
        file.name,
      ]);

      await client.query('COMMIT');
      console.info(`[INFO] Applied migration: ${file.name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`[ERROR] Failed to apply migration ${file.name}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<void> {
    await this.init();

    const files = this.getMigrationFiles();
    const applied = await this.getAppliedMigrations();

    const pending = files.filter((f) => !applied.has(f.name));

    if (pending.length === 0) {
      console.info('[INFO] No pending migrations');
      return;
    }

    console.info(`[INFO] Found ${pending.length} pending migration(s)`);

    for (const file of pending) {
      await this.runMigration(file);
    }

    console.info('[INFO] All migrations applied successfully');
  }

  /**
   * Get migration status
   */
  async status(): Promise<void> {
    await this.init();

    const files = this.getMigrationFiles();
    const applied = await this.getAppliedMigrations();

    console.info('\n=== Migration Status ===\n');

    for (const file of files) {
      const status = applied.has(file.name) ? 'X' : ' ';
      console.info(`  [${status}] ${file.number}_${file.name}.sql`);
    }

    console.info(`\nApplied: ${applied.size}/${files.length}\n`);
  }

  /**
   * Rollback all migrations
   */
  async rollback(): Promise<void> {
    if (!existsSync(ROLLBACK_FILE)) {
      console.error('[ERROR] Rollback file not found:', ROLLBACK_FILE);
      return;
    }

    console.info('[WARN] Rolling back all migrations...');
    const sql = readFileSync(ROLLBACK_FILE, 'utf-8');

    await this.pool.query(sql);

    // Clear migration records
    await this.pool.query('DELETE FROM schema_migrations');

    console.info('[INFO] Rollback complete');
  }

  /**
   * Reset database (rollback + migrate)
   */
  async reset(): Promise<void> {
    console.info('[WARN] Resetting database...');
    await this.rollback();
    await this.migrate();
    console.info('[INFO] Database reset complete');
  }

  /**
   * Run the complete schema (for fresh installs)
   */
  async setup(): Promise<void> {
    console.info('[INFO] Setting up database from schema...');

    if (!existsSync(SCHEMA_FILE)) {
      console.error('[ERROR] Schema file not found:', SCHEMA_FILE);
      return;
    }

    const sql = readFileSync(SCHEMA_FILE, 'utf-8');

    await this.pool.query(sql);

    // Mark all migrations as applied
    await this.init();

    const files = this.getMigrationFiles();
    for (const file of files) {
      await this.pool.query(
        'INSERT INTO schema_migrations (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [file.number.toString(), file.name]
      );
    }

    console.info('[INFO] Database setup complete');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
PostgreSQL Migration Runner

Usage: tsx scripts/run-migrations.ts [command] [options]

Commands:
  status    Show migration status (default)
  migrate   Run pending migrations
  setup     Run complete schema setup (fresh install)
  rollback  Rollback all migrations
  reset     Rollback and re-run all migrations

Options:
  --help, -h    Show this help message

Environment Variables:
  DATABASE_URL  PostgreSQL connection string

Examples:
  tsx scripts/run-migrations.ts status
  tsx scripts/run-migrations.ts migrate
  tsx scripts/run-migrations.ts setup
  tsx scripts/run-migrations.ts reset
`);
    process.exit(0);
  }

  const runner = new MigrationRunner();

  try {
    switch (command) {
      case 'migrate':
        await runner.migrate();
        break;
      case 'setup':
        await runner.setup();
        break;
      case 'rollback':
        await runner.rollback();
        break;
      case 'reset':
        await runner.reset();
        break;
      case 'status':
      default:
        await runner.status();
        break;
    }
    process.exit(0);
  } catch (error) {
    console.error('[FATAL] Migration failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { MigrationRunner };
