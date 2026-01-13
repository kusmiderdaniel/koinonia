-- Add visible_columns field to saved_views table
-- This stores which columns should be visible when the view is active
-- NULL means all columns are visible (default behavior)

ALTER TABLE saved_views
ADD COLUMN visible_columns JSONB DEFAULT NULL;

-- Add a comment explaining the field
COMMENT ON COLUMN saved_views.visible_columns IS 'Array of column keys to display when view is active. NULL means show all columns.';
