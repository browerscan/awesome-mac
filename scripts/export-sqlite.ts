#!/usr/bin/env tsx
// ============================================
// SQLite Data Export Script
// ============================================
// Exports data from SQLite to JSON files
// Run with: tsx scripts/export-sqlite.ts
// ============================================

import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || './data/payload.db';
const EXPORT_DIR = process.env.EXPORT_DIR || './data/exports';

// ============================================================================
// TYPES
// ============================================================================

interface ExportResult {
  apps: number;
  categories: number;
  users: number;
  media: number;
  timestamp: string;
}

// ============================================================================
// EXPORTER CLASS
// ============================================================================

class SQLiteExporter {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  /**
   * Export all tables to JSON files
   */
  async exportAll(): Promise<ExportResult> {
    console.info('[INFO] Starting SQLite export...');

    // Ensure export directory exists
    mkdirSync(EXPORT_DIR, { recursive: true });

    const result: ExportResult = {
      apps: 0,
      categories: 0,
      users: 0,
      media: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      // Export categories
      result.categories = this.exportTable('categories');
      console.info(`[INFO] Exported ${result.categories} categories`);

      // Export apps
      result.apps = this.exportTable('apps');
      console.info(`[INFO] Exported ${result.apps} apps`);

      // Export users
      result.users = this.exportTable('users');
      console.info(`[INFO] Exported ${result.users} users`);

      // Export media
      result.media = this.exportTable('media');
      console.info(`[INFO] Exported ${result.media} media items`);

      // Export metadata
      this.exportMetadata(result);

      console.info('[INFO] Export complete!');
      return result;
    } catch (error) {
      console.error('[ERROR] Export failed:', error);
      throw error;
    } finally {
      this.db.close();
    }
  }

  /**
   * Export a single table to JSON
   */
  private exportTable(tableName: string): number {
    try {
      const rows = this.db.prepare(`SELECT * FROM ${tableName}`).all();
      const filename = join(EXPORT_DIR, `${tableName}.json`);
      writeFileSync(filename, JSON.stringify(rows, null, 2));
      return rows.length;
    } catch (error) {
      console.warn(`[WARN] Could not export table ${tableName}:`, error);
      return 0;
    }
  }

  /**
   * Export metadata about the export
   */
  private exportMetadata(result: ExportResult): void {
    const metadata = {
      exportDate: new Date().toISOString(),
      sourceDatabase: SQLITE_DB_PATH,
      tables: {
        apps: result.apps,
        categories: result.categories,
        users: result.users,
        media: result.media,
      },
      schema: this.getSchemaInfo(),
    };

    const filename = join(EXPORT_DIR, 'metadata.json');
    writeFileSync(filename, JSON.stringify(metadata, null, 2));
  }

  /**
   * Get schema information from SQLite
   */
  private getSchemaInfo(): Record<string, unknown> {
    const tables = this.db
      .prepare(
        "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )
      .all() as Array<{ name: string; sql: string }>;

    const schema: Record<string, string> = {};

    for (const table of tables) {
      // Get row count
      const countResult = this.db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as {
        count: number;
      };
      schema[table.name] = `${countResult.count} rows`;
    }

    return schema;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
SQLite Data Export Script

Usage: tsx scripts/export-sqlite.ts [options]

Options:
  --help, -h       Show this help message

Environment Variables:
  SQLITE_DB_PATH   Path to SQLite database (default: ./data/payload.db)
  EXPORT_DIR       Directory for exported files (default: ./data/exports)

Examples:
  tsx scripts/export-sqlite.ts
  EXPORT_DIR=./backup tsx scripts/export-sqlite.ts
`);
    process.exit(0);
  }

  const exporter = new SQLiteExporter(SQLITE_DB_PATH);

  try {
    const result = await exporter.exportAll();
    console.info(`\n[INFO] Export summary:`);
    console.info(`  - Categories: ${result.categories}`);
    console.info(`  - Apps: ${result.apps}`);
    console.info(`  - Users: ${result.users}`);
    console.info(`  - Media: ${result.media}`);
    console.info(`\n[INFO] Files saved to: ${EXPORT_DIR}`);
    process.exit(0);
  } catch (error) {
    console.error('[FATAL] Export failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { SQLiteExporter };
