-- ============================================
-- Migration: 003_add_views
-- Created: 2025-12-29
-- Description: Add database views for common queries
-- ============================================

-- View for app summaries
CREATE OR REPLACE VIEW app_summaries AS
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
CREATE OR REPLACE VIEW category_tree AS
WITH RECURSIVE category_hierarchy AS (
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
CREATE OR REPLACE VIEW analytics_summary AS
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

DO $$
BEGIN
    RAISE NOTICE 'Migration 003_add_views completed successfully';
END $$;
