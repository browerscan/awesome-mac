-- ============================================
-- Migration: 004_add_analytics_triggers
-- Created: 2025-12-29
-- Description: Add triggers for automatic view/click counting
-- ============================================

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_app_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE apps SET view_count = view_count + 1 WHERE id = NEW.app_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment click count
CREATE OR REPLACE FUNCTION increment_app_click_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE apps SET click_count = click_count + 1 WHERE id = NEW.app_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for view counting
DROP TRIGGER IF EXISTS increment_view_on_analytics ON analytics_events;
CREATE TRIGGER increment_view_on_analytics
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'view' AND NEW.app_id IS NOT NULL)
    EXECUTE FUNCTION increment_app_view_count();

-- Trigger for click counting
DROP TRIGGER IF EXISTS increment_click_on_analytics ON analytics_events;
CREATE TRIGGER increment_click_on_analytics
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'click' AND NEW.app_id IS NOT NULL)
    EXECUTE FUNCTION increment_app_click_count();

DO $$
BEGIN
    RAISE NOTICE 'Migration 004_add_analytics_triggers completed successfully';
END $$;
