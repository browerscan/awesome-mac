-- ============================================
-- Awesome Mac - PostgreSQL Rollback Script
-- ============================================
-- WARNING: This script will DROP all tables and data
-- Only use this if you need to completely reset the database
-- ============================================

-- Set client_min_messages to WARNING to reduce noise
SET client_min_messages = WARNING;

-- ============================================================================
-- DROP VIEWS
-- ============================================================================

DROP VIEW IF EXISTS analytics_summary CASCADE;
DROP VIEW IF EXISTS category_tree CASCADE;
DROP VIEW IF EXISTS app_summaries CASCADE;

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS increment_click_on_analytics ON analytics_events;
DROP TRIGGER IF EXISTS increment_view_on_analytics ON analytics_events;
DROP TRIGGER IF EXISTS update_apps_updated_at ON apps;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS increment_app_click_count() CASCADE;
DROP FUNCTION IF EXISTS increment_app_view_count() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- DROP TABLES (in correct order due to foreign keys)
-- ============================================================================

-- Drop junction table first
DROP TABLE IF EXISTS app_tags CASCADE;

-- Drop main tables
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS web_vitals CASCADE;
DROP TABLE IF EXISTS sync_logs CASCADE;
DROP TABLE IF EXISTS apps CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ============================================================================
-- DROP ENUMS
-- ============================================================================

DROP TYPE IF EXISTS rating CASCADE;
DROP TYPE IF EXISTS pricing_model CASCADE;
DROP TYPE IF EXISTS app_status CASCADE;

-- ============================================================================
-- DROP EXTENSIONS
-- ============================================================================

-- Note: Only drop extensions if they were created specifically for this database
-- and are not used by other schemas
-- DROP EXTENSION IF EXISTS "pg_trgm" CASCADE;
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- ============================================================================
-- CONFIRMATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Rollback complete!';
    RAISE NOTICE 'All tables, views, and functions have been dropped.';
    RAISE NOTICE '===========================================';
END $$;
