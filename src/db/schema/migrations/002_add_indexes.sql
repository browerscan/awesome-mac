-- ============================================
-- Migration: 002_add_indexes
-- Created: 2025-12-29
-- Description: Add additional performance indexes
-- ============================================

-- Additional indexes for apps table
CREATE INDEX IF NOT EXISTS idx_apps_is_free ON apps(is_free);
CREATE INDEX IF NOT EXISTS idx_apps_is_open_source ON apps(is_open_source);
CREATE INDEX IF NOT EXISTS idx_apps_is_app_store ON apps(is_app_store);
CREATE INDEX IF NOT EXISTS idx_apps_active ON apps(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_apps_created_at ON apps(created_at);
CREATE INDEX IF NOT EXISTS idx_apps_view_count ON apps(view_count DESC);

-- Additional indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_depth ON categories(depth);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(id) WHERE deleted_at IS NULL;

-- Additional indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_date_bucket ON analytics_events(date_bucket);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category_id ON analytics_events(category_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_date ON analytics_events(event_type, date_bucket DESC);

-- Additional indexes for web vitals
CREATE INDEX IF NOT EXISTS idx_web_vitals_rating ON web_vitals(rating);
CREATE INDEX IF NOT EXISTS idx_web_vitals_page ON web_vitals(page);

-- Trigram index for tags name
CREATE INDEX IF NOT EXISTS idx_tags_name_trgm ON tags USING GIN(name gin_trgm_ops);

-- Additional trigram indexes for apps
CREATE INDEX IF NOT EXISTS idx_apps_description_trgm ON apps USING GIN(description gin_trgm_ops);

DO $$
BEGIN
    RAISE NOTICE 'Migration 002_add_indexes completed successfully';
END $$;
