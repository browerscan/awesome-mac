-- ============================================
-- Migration: 001_initial_schema
-- Created: 2025-12-29
-- Description: Initial schema for awesome-mac PostgreSQL migration
-- ============================================

-- ============================================================================
-- PART 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- PART 2: ENUMS
-- ============================================================================

CREATE TYPE app_status AS ENUM ('active', 'deprecated', 'removed', 'pending');
CREATE TYPE pricing_model AS ENUM ('free', 'freemium', 'paid', 'open-source', 'subscription');
CREATE TYPE rating AS ENUM ('excellent', 'good', 'fair', 'poor');

-- ============================================================================
-- PART 3: CATEGORIES TABLE
-- ============================================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    depth INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- ============================================================================
-- PART 4: TAGS TABLE
-- ============================================================================

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7),
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags(slug);

-- ============================================================================
-- PART 5: APPS TABLE
-- ============================================================================

CREATE TABLE apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    url TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    is_free BOOLEAN DEFAULT false,
    is_open_source BOOLEAN DEFAULT false,
    is_app_store BOOLEAN DEFAULT false,
    has_awesome_list BOOLEAN DEFAULT false,
    github_url TEXT,
    app_store_url TEXT,
    awesome_list_url TEXT,
    icon_url TEXT,
    status app_status DEFAULT 'active',
    pricing pricing_model,
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    github_stars INTEGER,
    github_last_sync_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED
);

CREATE INDEX idx_apps_slug ON apps(slug);
CREATE INDEX idx_apps_category_id ON apps(category_id);
CREATE INDEX idx_apps_url ON apps(url);
CREATE INDEX idx_apps_status ON apps(status);
CREATE INDEX idx_apps_search_vector ON apps USING GIN(search_vector);
CREATE INDEX idx_apps_name_trgm ON apps USING GIN(name gin_trgm_ops);

-- ============================================================================
-- PART 6: APP_TAGS JUNCTION TABLE
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
-- PART 7: ANALYTICS EVENTS TABLE
-- ============================================================================

CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    app_id UUID REFERENCES apps(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    user_agent TEXT,
    referrer TEXT,
    ip_address VARCHAR(45),
    country_code CHAR(2),
    search_query TEXT,
    search_results_count INTEGER,
    filter_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date_bucket DATE NOT NULL DEFAULT (CURRENT_DATE)
);

CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_app_id ON analytics_events(app_id);

-- ============================================================================
-- PART 8: WEB VITALS TABLE
-- ============================================================================

CREATE TABLE web_vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(10) NOT NULL,
    value NUMERIC(10, 3) NOT NULL,
    rating rating NOT NULL,
    delta NUMERIC(10, 3) NOT NULL,
    metric_id VARCHAR(255) NOT NULL,
    page VARCHAR(500) NOT NULL,
    session_id VARCHAR(255),
    user_agent TEXT,
    connection_type VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date_bucket DATE NOT NULL DEFAULT (CURRENT_DATE)
);

CREATE INDEX idx_web_vitals_date_bucket ON web_vitals(date_bucket DESC);
CREATE INDEX idx_web_vitals_metric_name ON web_vitals(metric_name);

-- ============================================================================
-- PART 9: SYNC LOGS TABLE
-- ============================================================================

CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    apps_created INTEGER DEFAULT 0,
    apps_updated INTEGER DEFAULT 0,
    apps_deleted INTEGER DEFAULT 0,
    apps_skipped INTEGER DEFAULT 0,
    categories_created INTEGER DEFAULT 0,
    categories_updated INTEGER DEFAULT 0,
    error_message TEXT,
    error_count INTEGER DEFAULT 0,
    source_file TEXT,
    duration_ms INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at DESC);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);

-- ============================================================================
-- PART 10: FUNCTIONS AND TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 001_initial_schema completed successfully';
END $$;
