# Database Schema Documentation

This directory contains the PostgreSQL database schema, configurations, and migration infrastructure for the Awesome Mac project.

## Directory Structure

```
src/db/
├── config/
│   ├── connection.ts       # PostgreSQL connection pool configuration
│   ├── prisma.ts           # Prisma ORM client setup
│   ├── drizzle.ts          # Drizzle ORM client setup
│   └── index.ts            # Unified exports
├── schema/
│   ├── schema.sql          # Complete database schema
│   ├── rollback.sql        # Rollback script
│   ├── prisma/
│   │   └── schema.prisma   # Prisma schema definition
│   ├── drizzle/
│   │   ├── schema.ts       # Drizzle schema definition
│   │   └── index.ts        # Drizzle Kit config
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_add_indexes.sql
│       ├── 003_add_views.sql
│       └── 004_add_analytics_triggers.sql
└── index.ts                # Module exports
```

## Core Tables

### Categories

Hierarchical category structure for organizing apps.

| Column      | Type         | Description                        |
| ----------- | ------------ | ---------------------------------- |
| id          | UUID         | Primary key                        |
| name        | VARCHAR(255) | Category name                      |
| slug        | VARCHAR(255) | URL-friendly identifier            |
| description | TEXT         | Category description               |
| parent_id   | UUID         | Parent category (self-referential) |
| sort_order  | INTEGER      | Display order                      |
| depth       | INTEGER      | Hierarchy depth (2 or 3)           |
| metadata    | JSONB        | Additional attributes              |

### Apps

Application entries with metadata and flags.

| Column         | Type         | Description               |
| -------------- | ------------ | ------------------------- |
| id             | UUID         | Primary key               |
| name           | VARCHAR(255) | App name                  |
| slug           | VARCHAR(255) | URL-friendly identifier   |
| description    | TEXT         | App description           |
| url            | TEXT         | Primary URL               |
| category_id    | UUID         | Foreign key to categories |
| is_free        | BOOLEAN      | Free app flag             |
| is_open_source | BOOLEAN      | Open source flag          |
| is_app_store   | BOOLEAN      | App Store availability    |
| github_url     | TEXT         | GitHub repository URL     |
| icon_url       | TEXT         | App icon URL              |
| view_count     | INTEGER      | View counter              |
| click_count    | INTEGER      | Click counter             |
| search_vector  | TSVECTOR     | Full-text search column   |

### Tags

Tag definitions for app categorization.

| Column      | Type         | Description             |
| ----------- | ------------ | ----------------------- |
| id          | UUID         | Primary key             |
| name        | VARCHAR(100) | Tag name                |
| slug        | VARCHAR(100) | URL-friendly identifier |
| description | TEXT         | Tag description         |
| color       | VARCHAR(7)   | Hex color code          |

### App_Tags

Junction table for many-to-many relationship between apps and tags.

| Column     | Type        | Description         |
| ---------- | ----------- | ------------------- |
| app_id     | UUID        | Foreign key to apps |
| tag_id     | UUID        | Foreign key to tags |
| created_at | TIMESTAMPTZ | Creation timestamp  |

### Analytics_Events

User interaction tracking for analytics.

| Column       | Type         | Description                              |
| ------------ | ------------ | ---------------------------------------- |
| id           | UUID         | Primary key                              |
| event_type   | VARCHAR(50)  | Event type (view, click, search, filter) |
| app_id       | UUID         | Related app (optional)                   |
| category_id  | UUID         | Related category (optional)              |
| session_id   | VARCHAR(255) | Session identifier                       |
| search_query | TEXT         | Search query text                        |
| filter_data  | JSONB        | Filter parameters                        |
| created_at   | TIMESTAMPTZ  | Event timestamp                          |

### Web_Vitals

Core Web Vitals metrics for performance monitoring.

| Column      | Type          | Description                                 |
| ----------- | ------------- | ------------------------------------------- |
| id          | UUID          | Primary key                                 |
| metric_name | VARCHAR(10)   | Metric name (CLS, FID, FCP, LCP, TTFB, INP) |
| value       | NUMERIC(10,3) | Metric value                                |
| rating      | VARCHAR(20)   | Rating (excellent, good, fair, poor)        |
| page        | VARCHAR(500)  | Page path                                   |
| created_at  | TIMESTAMPTZ   | Record timestamp                            |

### Sync_Logs

Data synchronization operation logs.

| Column        | Type        | Description                          |
| ------------- | ----------- | ------------------------------------ |
| id            | UUID        | Primary key                          |
| sync_type     | VARCHAR(50) | Sync type (github, markdown, manual) |
| status        | VARCHAR(50) | Status (started, completed, failed)  |
| apps_created  | INTEGER     | Number of apps created               |
| apps_updated  | INTEGER     | Number of apps updated               |
| error_message | TEXT        | Error details                        |
| started_at    | TIMESTAMPTZ | Start timestamp                      |
| completed_at  | TIMESTAMPTZ | Completion timestamp                 |

## Key Features

### Full-Text Search

The `apps` table includes a generated `search_vector` column using PostgreSQL's built-in full-text search:

```sql
search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED
```

Usage:

```typescript
// Search using the repository
const { data, total } = await appRepository.fullTextSearch('browser');
```

### Trigram Search

For fuzzy name matching, the schema uses the `pg_trgm` extension:

```sql
CREATE INDEX idx_apps_name_trgm ON apps USING GIN(name gin_trgm_ops);
```

Usage:

```typescript
const apps = await appRepository.fuzzySearch('chrme'); // Matches 'Chrome'
```

### Hierarchical Categories

Categories support parent-child relationships with recursive queries:

```sql
WITH RECURSIVE category_hierarchy AS (
  SELECT * FROM categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.* FROM categories c
  INNER JOIN category_hierarchy ch ON c.parent_id = ch.id
)
SELECT * FROM category_hierarchy;
```

### Connection Pooling

The database connection uses pg's built-in connection pooling for optimal performance:

```typescript
// Configurable via environment variables
DB_POOL_MIN = 2;
DB_POOL_MAX = 10;
DB_IDLE_TIMEOUT = 30000;
```

## ORM Support

The schema includes definitions for both Prisma and Drizzle ORM:

### Prisma

```typescript
import { prisma } from '@/db/config';

const apps = await prisma.app.findMany({
  where: { isFree: true },
  include: { category: true },
});
```

### Drizzle

```typescript
import { db } from '@/db/config';
import { apps } from '@/db/schema/drizzle/schema';

const result = await db.select().from(apps).where(eq(apps.isFree, true));
```

## Migrations

See [MIGRATION.md](../../MIGRATION.md) for complete migration documentation.

Quick commands:

```bash
# Start PostgreSQL
npm run db:postgres:start

# Run migrations
npm run db:migrate

# Check status
npm run db:migrate:status

# Health check
npm run db:health

# Migrate from SQLite
npm run db:migrate:sqlite-to-pg
```
