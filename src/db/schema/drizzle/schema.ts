// ============================================
// Awesome Mac - Drizzle Schema
// ============================================
// PostgreSQL Schema Definition with Drizzle ORM
// ============================================

import {
  pgTable,
  pgView,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  decimal,
  index,
  unique,
  primaryKey,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const appStatusEnum = pgEnum('app_status', ['active', 'deprecated', 'removed', 'pending']);
export const pricingModelEnum = pgEnum('pricing_model', [
  'free',
  'freemium',
  'paid',
  'open-source',
  'subscription',
]);
export const ratingEnum = pgEnum('rating', ['excellent', 'good', 'fair', 'poor']);

// ============================================================================
// TABLES: CATEGORIES
// ============================================================================

const categoriesTable = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    parentId: uuid('parent_id').references(() => categories.id, { onDelete: 'set null' }),
    sortOrder: integer('sort_order').default(0).notNull(),
    depth: integer('depth').default(0).notNull(),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    slugIdx: index('idx_categories_slug').on(table.slug),
    parentIdIdx: index('idx_categories_parent_id').on(table.parentId),
    sortOrderIdx: index('idx_categories_sort_order').on(table.sortOrder),
    depthIdx: index('idx_categories_depth').on(table.depth),
  })
);

// Export the categories table
export const categories = categoriesTable;

// ============================================================================
// TABLES: TAGS
// ============================================================================

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    description: text('description'),
    color: varchar('color', { length: 7 }),
    sortOrder: integer('sort_order').default(0).notNull(),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index('idx_tags_slug').on(table.slug),
  })
);

// ============================================================================
// TABLES: APPS
// ============================================================================

export const apps = pgTable(
  'apps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    url: text('url').notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),

    // Flags
    isFree: boolean('is_free').default(false).notNull(),
    isOpenSource: boolean('is_open_source').default(false).notNull(),
    isAppStore: boolean('is_app_store').default(false).notNull(),
    hasAwesomeList: boolean('has_awesome_list').default(false).notNull(),

    // URLs
    githubUrl: text('github_url'),
    appStoreUrl: text('app_store_url'),
    awesomeListUrl: text('awesome_list_url'),
    iconUrl: text('icon_url'),

    // Status and pricing
    status: appStatusEnum('status').default('active').notNull(),
    pricing: pricingModelEnum('pricing'),

    // Popularity metrics
    viewCount: integer('view_count').default(0).notNull(),
    clickCount: integer('click_count').default(0).notNull(),

    // GitHub metadata
    githubStars: integer('github_stars'),
    githubLastSyncAt: timestamp('github_last_sync_at'),

    // Metadata
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    slugIdx: index('idx_apps_slug').on(table.slug),
    categoryIdIdx: index('idx_apps_category_id').on(table.categoryId),
    urlIdx: index('idx_apps_url').on(table.url),
    statusIdx: index('idx_apps_status').on(table.status),
    isFreeIdx: index('idx_apps_is_free').on(table.isFree),
    isOpenSourceIdx: index('idx_apps_is_open_source').on(table.isOpenSource),
    isAppStoreIdx: index('idx_apps_is_app_store').on(table.isAppStore),
    viewCountIdx: index('idx_apps_view_count').on(table.viewCount),
    createdAtIdx: index('idx_apps_created_at').on(table.createdAt),
  })
);

// ============================================================================
// TABLES: APP_TAGS (Junction)
// ============================================================================

export const appTags = pgTable(
  'app_tags',
  {
    appId: uuid('app_id')
      .notNull()
      .references(() => apps.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.appId, table.tagId] }),
    appIdIdx: index('idx_app_tags_app_id').on(table.appId),
    tagIdIdx: index('idx_app_tags_tag_id').on(table.tagId),
  })
);

// ============================================================================
// TABLES: ANALYTICS EVENTS
// ============================================================================

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    appId: uuid('app_id').references(() => apps.id, { onDelete: 'set null' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    sessionId: varchar('session_id', { length: 255 }),
    userAgent: text('user_agent'),
    referrer: text('referrer'),
    ipAddress: varchar('ip_address', { length: 45 }),
    countryCode: varchar('country_code', { length: 2 }),
    searchQuery: text('search_query'),
    searchResultsCount: integer('search_results_count'),
    filterData: jsonb('filter_data'),
    dateBucket: timestamp('date_bucket').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index('idx_analytics_events_created_at').on(table.createdAt),
    dateBucketIdx: index('idx_analytics_events_date_bucket').on(table.dateBucket),
    eventTypeIdx: index('idx_analytics_events_event_type').on(table.eventType),
    appIdIdx: index('idx_analytics_events_app_id').on(table.appId),
    categoryIdIdx: index('idx_analytics_events_category_id').on(table.categoryId),
    sessionIdIdx: index('idx_analytics_events_session_id').on(table.sessionId),
    typeDateIdx: index('idx_analytics_events_type_date').on(table.eventType, table.dateBucket),
  })
);

// ============================================================================
// TABLES: WEB VITALS
// ============================================================================

export const webVitals = pgTable(
  'web_vitals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    metricName: varchar('metric_name', { length: 10 }).notNull(),
    value: decimal('value', { precision: 10, scale: 3 }).notNull(),
    rating: ratingEnum('rating').notNull(),
    delta: decimal('delta', { precision: 10, scale: 3 }).notNull(),
    metricId: varchar('metric_id', { length: 255 }).notNull(),
    page: varchar('page', { length: 500 }).notNull(),
    sessionId: varchar('session_id', { length: 255 }),
    userAgent: text('user_agent'),
    connectionType: varchar('connection_type', { length: 50 }),
    dateBucket: timestamp('date_bucket').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    dateBucketIdx: index('idx_web_vitals_date_bucket').on(table.dateBucket),
    metricNameIdx: index('idx_web_vitals_metric_name').on(table.metricName),
    ratingIdx: index('idx_web_vitals_rating').on(table.rating),
    pageIdx: index('idx_web_vitals_page').on(table.page),
  })
);

// ============================================================================
// TABLES: SYNC LOGS
// ============================================================================

export const syncLogs = pgTable(
  'sync_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    syncType: varchar('sync_type', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    appsCreated: integer('apps_created').default(0).notNull(),
    appsUpdated: integer('apps_updated').default(0).notNull(),
    appsDeleted: integer('apps_deleted').default(0).notNull(),
    appsSkipped: integer('apps_skipped').default(0).notNull(),
    categoriesCreated: integer('categories_created').default(0).notNull(),
    categoriesUpdated: integer('categories_updated').default(0).notNull(),
    errorMessage: text('error_message'),
    errorCount: integer('error_count').default(0).notNull(),
    sourceFile: text('source_file'),
    durationMs: integer('duration_ms'),
    metadata: jsonb('metadata')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    startedAtIdx: index('idx_sync_logs_started_at').on(table.startedAt),
    statusIdx: index('idx_sync_logs_status').on(table.status),
    syncTypeIdx: index('idx_sync_logs_sync_type').on(table.syncType),
  })
);

// ============================================================================
// VIEWS
// ============================================================================

// App summaries view
export const appSummaries = pgView('app_summaries').as((qb) =>
  qb
    .select({
      id: apps.id,
      name: apps.name,
      slug: apps.slug,
      description: sql`LEFT(${apps.description}, 200)`.as('description'),
      categoryId: apps.categoryId,
      isFree: apps.isFree,
      isOpenSource: apps.isOpenSource,
      isAppStore: apps.isAppStore,
      viewCount: apps.viewCount,
      clickCount: apps.clickCount,
      updatedAt: apps.updatedAt,
    })
    .from(apps)
    .where(sql`${apps.deletedAt} IS NULL AND ${apps.status} = 'active'`)
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type AppTag = typeof appTags.$inferSelect;
export type NewAppTag = typeof appTags.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type WebVital = typeof webVitals.$inferSelect;
export type NewWebVital = typeof webVitals.$inferInsert;
export type SyncLog = typeof syncLogs.$inferSelect;
export type NewSyncLog = typeof syncLogs.$inferInsert;
