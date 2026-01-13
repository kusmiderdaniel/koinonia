-- Add columns_config to saved_views for column ordering and resizing
-- This replaces visible_columns with a more flexible structure

-- Add new columns_config column
ALTER TABLE saved_views
ADD COLUMN columns_config JSONB DEFAULT NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN saved_views.columns_config IS
  'Array of {key: string, width?: number, visible?: boolean} objects. Defines column order, widths, and visibility. NULL means use default configuration.';

-- Note: visible_columns is kept for backward compatibility
-- The application will migrate old views to columns_config on read
