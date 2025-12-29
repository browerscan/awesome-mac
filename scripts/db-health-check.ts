#!/usr/bin/env tsx
// ============================================
// Database Health Check Script
// ============================================
// Checks PostgreSQL connection and reports status
// Run with: tsx scripts/db-health-check.ts
// ============================================

import { healthCheck, getPool } from '../src/db/config';

async function main() {
  console.info('[INFO] Checking database health...\n');

  const result = await healthCheck();

  if (result.healthy) {
    console.info('[OK] Database is healthy');
    console.info(`     Latency: ${result.latency}ms`);

    if (result.poolStats) {
      console.info('\n[INFO] Connection Pool:');
      console.info(`     Total: ${result.poolStats.totalCount}`);
      console.info(`     Idle: ${result.poolStats.idleCount}`);
      console.info(`     Waiting: ${result.poolStats.waitingCount}`);
    }

    // Get table counts
    const pool = getPool();
    const tables = ['categories', 'apps', 'tags', 'app_tags', 'analytics_events', 'web_vitals'];

    console.info('\n[INFO] Table Row Counts:');
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.info(`     ${table}: ${result.rows[0].count}`);
      } catch (error) {
        console.info(`     ${table}: ERROR`);
      }
    }

    process.exit(0);
  } else {
    console.error('[ERROR] Database is unhealthy');
    console.error(`     Error: ${result.error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[FATAL]', error);
  process.exit(1);
});
