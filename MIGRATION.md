# PostgreSQL Migration Guide

This guide covers migrating the Awesome Mac project from SQLite (PayloadCMS default) to PostgreSQL.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step-by-Step Migration](#step-by-step-migration)
- [Testing](#testing)
- [Rollback Plan](#rollback-plan)
- [Troubleshooting](#troubleshooting)

## Overview

The migration moves data from a SQLite database (currently used by PayloadCMS) to a PostgreSQL database with improved schema support for:

- Full-text search capabilities
- Connection pooling for better performance
- Advanced analytics with time-series optimization
- Hierarchical category structures
- Tag-based app categorization

## Prerequisites

### 1. PostgreSQL Database

You need a running PostgreSQL instance. Options include:

- **Local development**: Docker Compose
- **Cloud**: Neon, Supabase, AWS RDS, Google Cloud SQL

#### Docker Compose (Recommended for Local Development)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: awesome_mac
      POSTGRES_PASSWORD: awesome_mac_password
      POSTGRES_DB: awesome_mac
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U awesome_mac']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Start with: `docker-compose up -d`

### 2. Environment Variables

Update your `.env` file:

```bash
# PostgreSQL Connection
DATABASE_URL=postgresql://awesome_mac:awesome_mac_password@localhost:5432/awesome_mac

# Or use individual variables
PGHOST=localhost
PGPORT=5432
PGDATABASE=awesome_mac
PGUSER=awesome_mac
PGPASSWORD=awesome_mac_password

# Connection Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=10000

# Migration Settings
MIGRATION_OVERWRITE=false  # Set to 'true' to overwrite existing data
```

### 3. Install Dependencies

```bash
npm install pg @types/pg drizzle-orm drizzle-kit
# or
npm install @prisma/client prisma
npm install -D better-sqlite3
```

## Step-by-Step Migration

### Phase 1: Preparation (DO NOT PROCEED IN PRODUCTION)

1. **Backup existing data**

```bash
# Export SQLite to JSON
tsx scripts/export-sqlite.ts

# Or backup the SQLite file directly
cp data/payload.db data/payload.db.backup
```

2. **Verify PostgreSQL connection**

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

3. **Create database schema**

```bash
# Run migrations in order
psql $DATABASE_URL -f src/db/schema/migrations/001_initial_schema.sql
psql $DATABASE_URL -f src/db/schema/migrations/002_add_indexes.sql
psql $DATABASE_URL -f src/db/schema/migrations/003_add_views.sql
psql $DATABASE_URL -f src/db/schema/migrations/004_add_analytics_triggers.sql

# Or run the complete schema
psql $DATABASE_URL -f src/db/schema/schema.sql
```

4. **Verify schema creation**

```bash
psql $DATABASE_URL -c "\dt"  # List tables
psql $DATABASE_URL -c "\dv"  # List views
```

### Phase 2: Data Migration

1. **Dry run** (always do this first)

```bash
tsx scripts/migrate-to-postgres.ts --dry-run
```

Expected output:

```
[INFO] === DRY RUN MODE ===
[INFO] Found 50 categories
[INFO] Found 1500 apps
[INFO] === DRY RUN COMPLETE ===
```

2. **Execute migration**

```bash
tsx scripts/migrate-to-postgres.ts
```

Expected output:

```
[INFO] Starting migration from SQLite to PostgreSQL...
[INFO] Found 50 categories and 1500 apps in SQLite
[INFO] Starting category migration...
[INFO] Migrated 50 categories
[INFO] Starting app migration...
[INFO] Processing batch 1/15
[INFO] Migrated 1500 apps (0 failed)
[INFO] Rebuilding category depths...
[INFO] === MIGRATION COMPLETE ===
```

### Phase 3: Verification

1. **Verify data counts**

```bash
# Compare row counts between databases
echo "SQLite apps:" && sqlite3 data/payload.db "SELECT COUNT(*) FROM apps;"
echo "PostgreSQL apps:" && psql $DATABASE_URL -tAc "SELECT COUNT(*) FROM apps;"
```

2. **Verify data integrity**

```bash
# Check for orphaned apps (apps with invalid category)
psql $DATABASE_URL -c "
  SELECT COUNT(*)
  FROM apps a
  LEFT JOIN categories c ON a.category_id = c.id
  WHERE c.id IS NULL;
"
```

3. **Test full-text search**

```bash
psql $DATABASE_URL -c "
  SELECT name, description
  FROM apps
  WHERE search_vector @@ plainto_tsquery('english', 'browser')
  LIMIT 5;
"
```

### Phase 4: Application Configuration

1. **Update PayloadCMS configuration**

In `src/payload.config.ts`:

```typescript
import { postgresAdapter } from '@payloadcms/db-postgres';

// Replace sqliteAdapter with postgresAdapter
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URL,
  },
}),
```

2. **Update repository usage**

```typescript
// Before: using in-memory data
import { getData } from '@/lib/data';

// After: using repository
import { appRepository } from '@/lib/repositories';
```

3. **Rebuild and test**

```bash
npm run build
npm run dev
```

## Testing

### Unit Tests

```bash
# Run repository tests
npm test -- src/lib/repositories

# Run migration tests
npm test -- scripts/migrate-to-postgres.test.ts
```

### Integration Tests

```bash
# Test full database operations
npm run test:e2e
```

### Manual Testing Checklist

- [ ] Categories display correctly
- [ ] Apps load by category
- [ ] Full-text search returns results
- [ ] App detail pages load
- [ ] Analytics are being tracked
- [ ] Admin panel (PayloadCMS) works

## Rollback Plan

If the migration fails or causes issues:

### Option 1: Revert to SQLite (Quick)

1. Stop the application
2. Restore the SQLite backup
3. Revert `src/payload.config.ts` to use `sqliteAdapter`
4. Restart the application

```bash
# Restore from backup
cp data/payload.db.backup data/payload.db

# Or re-export from JSON (if available)
# (import script would need to be created)
```

### Option 2: Fix PostgreSQL Issues

```bash
# Drop and recreate schema
psql $DATABASE_URL -f src/db/schema/rollback.sql

# Re-run migration
tsx scripts/migrate-to-postgres.ts
```

### Option 3: Partial Rollback

```bash
# Truncate specific tables
psql $DATABASE_URL -c "TRUNCATE apps, categories, tags CASCADE;"

# Re-import specific data
# (requires custom import script)
```

## Troubleshooting

### Connection Issues

**Problem**: `Connection refused` or `ECONNREFUSED`

**Solution**:

```bash
# Check PostgreSQL is running
docker-compose ps  # or pg_isready

# Check connection string
echo $DATABASE_URL
```

### SSL Issues

**Problem**: `SSL not supported` or `self-signed certificate`

**Solution**:

```bash
# Add SSL mode to connection string
DATABASE_URL="postgresql://...?sslmode=require"
# or for self-signed:
DATABASE_URL="postgresql://...?sslmode=no-verify"
```

### Memory Issues

**Problem**: Migration runs out of memory on large datasets

**Solution**:

```bash
# Reduce batch size in scripts/migrate-to-postgres.ts
const BATCH_SIZE = 50;  # Default is 100
```

### Permission Issues

**Problem**: `Permission denied` on schema creation

**Solution**:

```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE awesome_mac TO awesome_mac;
GRANT ALL PRIVILEGES ON SCHEMA public TO awesome_mac;
```

### Data Validation Errors

**Problem**: Foreign key constraint violations

**Solution**:

```sql
-- Find orphaned records
SELECT a.id, a.name, a.category_id
FROM apps a
LEFT JOIN categories c ON a.category_id = c.id
WHERE c.id IS NULL;

-- Set a default category for orphans
UPDATE apps
SET category_id = (SELECT id FROM categories WHERE slug = 'general')
WHERE category_id NOT IN (SELECT id FROM categories);
```

## Performance Considerations

### After Migration

1. **Run ANALYZE** to update query planner statistics:

```sql
ANALYZE;
```

2. **Check for missing indexes**:

```sql
-- Find missing indexes (requires pg_stat_statements extension)
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

3. **Monitor slow queries**:

```sql
-- Enable logging
ALTER DATABASE awesome_mac SET log_min_duration_statement = 1000;
```

## Maintenance

### Regular Tasks

```bash
# Update full-text search vectors
REFRESH MATERIALIZED VIEW CONCURRENTLY app_summaries;

# Archive old analytics data
DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '1 year';

# Reindex if needed
REINDEX DATABASE awesome_mac;
```

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review PostgreSQL logs: `docker-compose logs postgres`
3. Check application logs for database errors
4. Open an issue on GitHub

## Appendix: Schema Reference

### Core Tables

| Table              | Description               | Rows (approx) |
| ------------------ | ------------------------- | ------------- |
| `categories`       | Hierarchical categories   | 50            |
| `apps`             | Application entries       | 1500          |
| `tags`             | Tag definitions           | 50            |
| `app_tags`         | App-to-tag relationships  | 3000          |
| `analytics_events` | User interaction tracking | -             |
| `web_vitals`       | Performance metrics       | -             |
| `sync_logs`        | Data sync history         | -             |

### Key Indexes

- `apps_search_vector` - Full-text search (GIN)
- `apps_name_trgm` - Fuzzy name search (GIN)
- `apps_category_id` - Category lookups (B-tree)
- `analytics_events_date_bucket` - Time-series queries (BRIN recommended)
