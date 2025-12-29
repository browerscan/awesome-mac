#!/usr/bin/env tsx
// ============================================
// SQLite to PostgreSQL Migration Script
// ============================================
// Exports data from SQLite (PayloadCMS) and imports to PostgreSQL
// Run with: tsx scripts/migrate-to-postgres.ts
// ============================================

import Database from 'better-sqlite3';
import { getPool } from '../src/db/config';
import { getAppRepository } from '../src/lib/repositories/AppRepository';
import { getCategoryRepository } from '../src/lib/repositories/CategoryRepository';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface SQLiteApp {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  url: string;
  category: string; // Category ID from relationship
  is_free: number;
  is_open_source: number;
  has_app_store: number;
  github_url: string | null;
  app_store_url: string | null;
  awesome_list_url: string | null;
  icon_url: string | null;
  created_at: string;
  updated_at: string;
}

interface SQLiteCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

interface MigrationStats {
  categoriesMigrated: number;
  appsMigrated: number;
  appsFailed: number;
  errors: Array<{ entity: string; id: string; error: string }>;
  startTime: Date;
  endTime?: Date;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || './data/payload.db';
const BATCH_SIZE = 100;

// ============================================================================
// MIGRATION CLASS
// ============================================================================

class SQLiteToPostgresMigrator {
  private sqlite: Database.Database;
  private stats: MigrationStats;
  private appRepo = getAppRepository();
  private categoryRepo = getCategoryRepository();

  constructor(sqlitePath: string) {
    this.sqlite = new Database(sqlitePath);
    this.stats = {
      categoriesMigrated: 0,
      appsMigrated: 0,
      appsFailed: 0,
      errors: [],
      startTime: new Date(),
    };
  }

  // ========================================================================
  // VALIDATION
  // ========================================================================

  /**
   * Validate that the SQLite database exists and is accessible
   */
  async validateSource(): Promise<boolean> {
    try {
      // Check if the file exists
      if (!existsSync(SQLITE_DB_PATH)) {
        console.error(`[ERROR] SQLite database not found at: ${SQLITE_DB_PATH}`);
        return false;
      }

      // Test database connection
      const result = this.sqlite.prepare('SELECT 1 as test').get() as { test: number };
      if (result.test !== 1) {
        console.error('[ERROR] Failed to connect to SQLite database');
        return false;
      }

      // Check for required tables
      const tables = this.sqlite
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('apps', 'categories', 'users')"
        )
        .all() as Array<{ name: string }>;

      const tableNames = tables.map((t) => t.name);
      const missingTables = ['apps', 'categories'].filter((t) => !tableNames.includes(t));

      if (missingTables.length > 0) {
        console.error(`[ERROR] Missing required tables: ${missingTables.join(', ')}`);
        return false;
      }

      // Get row counts
      const appCount = this.sqlite.prepare('SELECT COUNT(*) as count FROM apps').get() as {
        count: number;
      };
      const categoryCount = this.sqlite
        .prepare('SELECT COUNT(*) as count FROM categories')
        .get() as {
        count: number;
      };

      console.log(
        `[INFO] Found ${appCount.count} apps and ${categoryCount.count} categories in SQLite`
      );

      return true;
    } catch (error) {
      console.error('[ERROR] Failed to validate SQLite database:', error);
      return false;
    }
  }

  /**
   * Validate that PostgreSQL is ready
   */
  async validateDestination(): Promise<boolean> {
    try {
      const pool = getPool();

      // Test connection
      await pool.query('SELECT 1');

      // Check for existing data
      const appResult = await pool.query('SELECT COUNT(*) as count FROM apps');
      const categoryResult = await pool.query('SELECT COUNT(*) as count FROM categories');

      const appCount = parseInt(appResult.rows[0].count, 10);
      const categoryCount = parseInt(categoryResult.rows[0].count, 10);

      if (appCount > 0 || categoryCount > 0) {
        console.warn(
          `[WARN] PostgreSQL already contains data: ${appCount} apps, ${categoryCount} categories`
        );
        const proceed = process.env.MIGRATION_OVERWRITE === 'true';
        if (!proceed) {
          console.error(
            '[ERROR] Set MIGRATION_OVERWRITE=true to proceed with overwriting existing data'
          );
          return false;
        }
        console.info('[INFO] MIGRATION_OVERWRITE=true - existing data may be updated');
      }

      return true;
    } catch (error) {
      console.error('[ERROR] Failed to connect to PostgreSQL:', error);
      return false;
    }
  }

  // ========================================================================
  // MIGRATION METHODS
  // ========================================================================

  /**
   * Migrate categories from SQLite to PostgreSQL
   */
  async migrateCategories(): Promise<void> {
    console.info('[INFO] Starting category migration...');

    try {
      const categories = this.sqlite
        .prepare('SELECT * FROM categories ORDER BY "order" ASC')
        .all() as SQLiteCategory[];

      console.info(`[INFO] Found ${categories.length} categories to migrate`);

      for (const category of categories) {
        try {
          await this.categoryRepo.upsertBySlug({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description || undefined,
            sortOrder: category.order,
            depth: 0, // Will need to be calculated based on hierarchy
          });

          this.stats.categoriesMigrated++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.stats.errors.push({
            entity: 'category',
            id: category.id,
            error: errorMessage,
          });
          console.error(`[ERROR] Failed to migrate category ${category.slug}:`, errorMessage);
        }
      }

      console.info(`[INFO] Migrated ${this.stats.categoriesMigrated} categories`);
    } catch (error) {
      console.error('[ERROR] Failed to migrate categories:', error);
      throw error;
    }
  }

  /**
   * Migrate apps from SQLite to PostgreSQL
   */
  async migrateApps(): Promise<void> {
    console.info('[INFO] Starting app migration...');

    try {
      const apps = this.sqlite.prepare('SELECT * FROM apps').all() as SQLiteApp[];
      console.info(`[INFO] Found ${apps.length} apps to migrate`);

      // Process in batches
      for (let i = 0; i < apps.length; i += BATCH_SIZE) {
        const batch = apps.slice(i, Math.min(i + BATCH_SIZE, apps.length));
        console.info(
          `[INFO] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(apps.length / BATCH_SIZE)}`
        );

        for (const app of batch) {
          try {
            await this.appRepo.upsertByUrl({
              id: app.id,
              name: app.name,
              slug: app.slug,
              description: app.description || undefined,
              url: app.url,
              categoryId: app.category,
              isFree: Boolean(app.is_free),
              isOpenSource: Boolean(app.is_open_source),
              isAppStore: Boolean(app.has_app_store),
              hasAwesomeList: app.awesome_list_url ? true : false,
              githubUrl: app.github_url || undefined,
              appStoreUrl: app.app_store_url || undefined,
              awesomeListUrl: app.awesome_list_url || undefined,
              iconUrl: app.icon_url || undefined,
              status: 'active',
            });

            this.stats.appsMigrated++;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.stats.errors.push({
              entity: 'app',
              id: app.id,
              error: errorMessage,
            });
            this.stats.appsFailed++;
            console.error(`[ERROR] Failed to migrate app ${app.slug}:`, errorMessage);
          }
        }
      }

      console.info(
        `[INFO] Migrated ${this.stats.appsMigrated} apps (${this.stats.appsFailed} failed)`
      );
    } catch (error) {
      console.error('[ERROR] Failed to migrate apps:', error);
      throw error;
    }
  }

  /**
   * Rebuild category depths after migration
   */
  async rebuildCategoryDepths(): Promise<void> {
    console.info('[INFO] Rebuilding category depths...');
    await this.categoryRepo.rebuildDepths();
    console.info('[INFO] Category depths rebuilt');
  }

  // ========================================================================
  // DRY RUN
  // ========================================================================

  /**
   * Perform a dry run without actually migrating data
   */
  async dryRun(): Promise<void> {
    console.info('[INFO] === DRY RUN MODE ===');
    console.info('[INFO] No data will be modified');

    await this.validateSource();

    const apps = this.sqlite.prepare('SELECT COUNT(*) as count FROM apps').get() as {
      count: number;
    };
    const categories = this.sqlite.prepare('SELECT COUNT(*) as count FROM categories').get() as {
      count: number;
    };

    console.info(`[INFO] Would migrate ${categories.count} categories`);
    console.info(`[INFO] Would migrate ${apps.count} apps`);

    // Check for potential issues
    const duplicateSlugs = this.sqlite
      .prepare('SELECT slug, COUNT(*) as count FROM apps GROUP BY slug HAVING count > 1')
      .all() as Array<{ slug: string; count: number }>;

    if (duplicateSlugs.length > 0) {
      console.warn('[WARN] Found duplicate slugs in apps:', duplicateSlugs);
    }

    const nullCategories = this.sqlite
      .prepare('SELECT COUNT(*) as count FROM apps WHERE category IS NULL')
      .get() as { count: number };

    if (nullCategories.count > 0) {
      console.warn(`[WARN] Found ${nullCategories.count} apps without categories`);
    }

    console.info('[INFO] === DRY RUN COMPLETE ===');
  }

  // ========================================================================
  // EXECUTE
  // ========================================================================

  /**
   * Execute the full migration
   */
  async execute(dryRun = false): Promise<MigrationStats> {
    try {
      if (dryRun) {
        await this.dryRun();
        return this.stats;
      }

      console.info('[INFO] Starting migration from SQLite to PostgreSQL...');
      console.info(`[INFO] Source: ${SQLITE_DB_PATH}`);
      console.info(`[INFO] Started at: ${this.stats.startTime.toISOString()}`);

      // Validate
      const sourceValid = await this.validateSource();
      if (!sourceValid) {
        throw new Error('Source database validation failed');
      }

      const destValid = await this.validateDestination();
      if (!destValid) {
        throw new Error('Destination database validation failed');
      }

      // Migrate
      await this.migrateCategories();
      await this.migrateApps();
      await this.rebuildCategoryDepths();

      // Complete
      this.stats.endTime = new Date();
      const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();

      console.info('[INFO] === MIGRATION COMPLETE ===');
      console.info(`[INFO] Categories migrated: ${this.stats.categoriesMigrated}`);
      console.info(`[INFO] Apps migrated: ${this.stats.appsMigrated}`);
      console.info(`[INFO] Apps failed: ${this.stats.appsFailed}`);
      console.info(`[INFO] Duration: ${(duration / 1000).toFixed(2)}s`);

      if (this.stats.errors.length > 0) {
        console.error(`[ERROR] ${this.stats.errors.length} errors occurred`);
        for (const error of this.stats.errors.slice(0, 10)) {
          console.error(`[ERROR] ${error.entity}/${error.id}: ${error.error}`);
        }
        if (this.stats.errors.length > 10) {
          console.error(`[ERROR] ... and ${this.stats.errors.length - 10} more errors`);
        }
      }

      return this.stats;
    } catch (error) {
      console.error('[ERROR] Migration failed:', error);
      this.stats.endTime = new Date();
      throw error;
    } finally {
      this.sqlite.close();
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
SQLite to PostgreSQL Migration Script

Usage: tsx scripts/migrate-to-postgres.ts [options]

Options:
  --dry-run, -n    Validate data without migrating
  --help, -h       Show this help message

Environment Variables:
  SQLITE_DB_PATH         Path to SQLite database (default: ./data/payload.db)
  DATABASE_URL           PostgreSQL connection string
  MIGRATION_OVERWRITE    Set to 'true' to overwrite existing PostgreSQL data

Examples:
  tsx scripts/migrate-to-postgres.ts
  tsx scripts/migrate-to-postgres.ts --dry-run
  MIGRATION_OVERWRITE=true tsx scripts/migrate-to-postgres.ts
`);
    process.exit(0);
  }

  const migrator = new SQLiteToPostgresMigrator(SQLITE_DB_PATH);

  try {
    await migrator.execute(dryRun);
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

export { SQLiteToPostgresMigrator, MigrationStats };
