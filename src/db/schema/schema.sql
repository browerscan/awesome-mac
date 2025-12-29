-- ============================================
-- Awesome Mac - PostgreSQL Schema
-- ============================================
-- Migration: 001_initial_schema
-- Created: 2025-12-29
-- Description: Initial schema for apps, categories, tags, and analytics
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for advanced text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE app_status AS ENUM ('active', 'deprecated', 'removed', 'pending');

CREATE TYPE pricing_model AS ENUM ('free', 'freemium', 'paid', 'open-source', 'subscription');

CREATE TYPE rating AS ENUM ('excellent', 'good', 'fair', 'poor');

-- ============================================================================
-- TABLES: CATEGORIES
-- ============================================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    depth INTEGER NOT NULL DEFAULT 0, -- 2 or 3 based on heading level
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_categories_depth ON categories(depth);
CREATE INDEX idx_categories_active ON categories(id) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLES: APPS
-- ============================================================================

CREATE TABLE apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    url TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,

    -- Flags
    is_free BOOLEAN DEFAULT false,
    is_open_source BOOLEAN DEFAULT false,
    is_app_store BOOLEAN DEFAULT false,
    has_awesome_list BOOLEAN DEFAULT false,

    -- URLs
    github_url TEXT,
    app_store_url TEXT,
    awesome_list_url TEXT,
    icon_url TEXT,

    -- Additional metadata
    status app_status DEFAULT 'active',
    pricing pricing_model,

    -- Popularity metrics
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,

    -- GitHub metadata (for open source apps)
    github_stars INTEGER,
    github_last_sync_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Full-text search vector
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED
);

-- Indexes for apps
CREATE INDEX idx_apps_slug ON apps(slug);
CREATE INDEX idx_apps_category_id ON apps(category_id);
CREATE INDEX idx_apps_url ON apps(url);
CREATE INDEX idx_apps_status ON apps(status);
CREATE INDEX idx_apps_is_free ON apps(is_free);
CREATE INDEX idx_apps_is_open_source ON apps(is_open_source);
CREATE INDEX idx_apps_is_app_store ON apps(is_app_store);
CREATE INDEX idx_apps_active ON apps(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_apps_created_at ON apps(created_at);
CREATE INDEX idx_apps_view_count ON apps(view_count DESC);

-- Full-text search index
CREATE INDEX idx_apps_search_vector ON apps USING GIN(search_vector);

-- Trigram index for fuzzy search
CREATE INDEX idx_apps_name_trgm ON apps USING GIN(name gin_trgm_ops);
CREATE INDEX idx_apps_description_trgm ON apps USING GIN(description gin_trgm_ops);

-- ============================================================================
-- TABLES: TAGS
-- ============================================================================

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_name ON tags USING GIN(name gin_trgm_ops);

-- ============================================================================
-- TABLES: APP_TAGS (Junction)
-- ============================================================================

CREATE TABLE app_tags (
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (app_id, tag_id)
);

CREATE INDEX idx_app_tags_app_id ON app_tags(app_id);
CREATE INDEX idx_app_tags_tag_id ON app_tags(tag_id);

-- ============================================================================
-- TABLES: ANALYTICS
-- ============================================================================

CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'search', 'filter'
    app_id UUID REFERENCES apps(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

    -- Event data
    session_id VARCHAR(255),
    user_agent TEXT,
    referrer TEXT,
    ip_address VARCHAR(45), -- IPv6 compatible
    country_code CHAR(2),

    -- Search-specific data
    search_query TEXT,
    search_results_count INTEGER,

    -- Filter-specific data
    filter_data JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Partitioning hint (for future optimization)
    date_bucket DATE NOT NULL DEFAULT (CURRENT_DATE)
);

-- Indexes for analytics (optimized for time-series queries)
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_date_bucket ON analytics_events(date_bucket);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_app_id ON analytics_events(app_id);
CREATE INDEX idx_analytics_events_category_id ON analytics_events(category_id);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);

-- Composite index for common queries
CREATE INDEX idx_analytics_events_type_date ON analytics_events(event_type, date_bucket DESC);

-- ============================================================================
-- TABLES: WEB VITALS
-- ============================================================================

CREATE TABLE web_vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(10) NOT NULL, -- 'CLS', 'FID', 'FCP', 'LCP', 'TTFB', 'INP'
    value NUMERIC(10, 3) NOT NULL,
    rating rating NOT NULL,
    delta NUMERIC(10, 3) NOT NULL,
    metric_id VARCHAR(255) NOT NULL,
    page VARCHAR(500) NOT NULL,
    session_id VARCHAR(255),

    -- Request metadata
    user_agent TEXT,
    connection_type VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date_bucket DATE NOT NULL DEFAULT (CURRENT_DATE)
);

CREATE INDEX idx_web_vitals_date_bucket ON web_vitals(date_bucket DESC);
CREATE INDEX idx_web_vitals_metric_name ON web_vitals(metric_name);
CREATE INDEX idx_web_vitals_rating ON web_vitals(rating);
CREATE INDEX idx_web_vitals_page ON web_vitals(page);

-- ============================================================================
-- TABLES: SYNC_LOGS
-- ============================================================================

CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(50) NOT NULL, -- 'github', 'markdown', 'manual'
    status VARCHAR(50) NOT NULL, -- 'started', 'completed', 'failed', 'partial'

    -- Sync statistics
    apps_created INTEGER DEFAULT 0,
    apps_updated INTEGER DEFAULT 0,
    apps_deleted INTEGER DEFAULT 0,
    apps_skipped INTEGER DEFAULT 0,
    categories_created INTEGER DEFAULT 0,
    categories_updated INTEGER DEFAULT 0,

    -- Error tracking
    error_message TEXT,
    error_count INTEGER DEFAULT 0,

    -- Metadata
    source_file TEXT,
    duration_ms INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at DESC);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_sync_type ON sync_logs(sync_type);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apps_updated_at
    BEFORE UPDATE ON apps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_app_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE apps SET view_count = view_count + 1 WHERE id = NEW.app_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_view_on_analytics
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'view')
    EXECUTE FUNCTION increment_app_view_count();

-- Function to increment click count
CREATE OR REPLACE FUNCTION increment_app_click_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE apps SET click_count = click_count + 1 WHERE id = NEW.app_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql();

CREATE TRIGGER increment_click_on_analytics
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'click')
    EXECUTE FUNCTION increment_app_click_count();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for app summaries (lightweight queries)
CREATE VIEW app_summaries AS
SELECT
    id,
    name,
    slug,
    LEFT(description, 200) AS description,
    category_id,
    is_free,
    is_open_source,
    is_app_store,
    view_count,
    click_count,
    updated_at
FROM apps
WHERE deleted_at IS NULL AND status = 'active';

-- View for category tree
CREATE VIEW category_tree AS
WITH RECURSIVE category_hierarchy AS (
    -- Base case: root categories (no parent)
    SELECT
        id,
        name,
        slug,
        description,
        parent_id,
        sort_order,
        depth,
        ARRAY[id] AS path,
        ARRAY[name] AS path_names,
        0 AS level
    FROM categories
    WHERE parent_id IS NULL AND deleted_at IS NULL

    UNION ALL

    -- Recursive case: children
    SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.parent_id,
        c.sort_order,
        c.depth,
        ch.path || c.id,
        ch.path_names || c.name,
        ch.level + 1
    FROM categories c
    INNER JOIN category_hierarchy ch ON c.parent_id = ch.id
    WHERE c.deleted_at IS NULL
)
SELECT * FROM category_hierarchy;

-- View for analytics summary
CREATE VIEW analytics_summary AS
SELECT
    DATE_TRUNC('day', created_at) AS date,
    event_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT app_id) AS unique_apps,
    COUNT(DISTINCT session_id) AS unique_sessions
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), event_type
ORDER BY date DESC, event_type;

-- ============================================================================
-- INITIALIZATION DATA
-- ============================================================================

-- Insert root categories (these will be synced from the actual data)
-- This is placeholder data that will be replaced during migration

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE categories IS 'Hierarchical categories for organizing apps';
COMMENT ON TABLE apps IS 'Mac application entries with metadata and flags';
COMMENT ON TABLE tags IS 'Tags for categorizing and filtering apps';
COMMENT ON TABLE app_tags IS 'Many-to-many relationship between apps and tags';
COMMENT ON TABLE analytics_events IS 'User interaction tracking for analytics';
COMMENT ON TABLE web_vitals IS 'Core Web Vitals metrics for performance monitoring';
COMMENT ON TABLE sync_logs IS 'Data synchronization operation logs';

COMMENT ON COLUMN apps.search_vector IS 'Generated full-text search vector';
COMMENT ON COLUMN apps.metadata IS 'Flexible JSON storage for additional app attributes';
COMMENT ON COLUMN analytics_events.date_bucket IS 'Date partition key for query optimization';
COMMENT ON COLUMN web_vitals.date_bucket IS 'Date partition key for query optimization';
