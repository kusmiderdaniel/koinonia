-- Add freeze_column_key column to saved_views table
-- This stores the column key up to which columns should be frozen (sticky)
-- All columns from the first column up to and including this one will be frozen

ALTER TABLE saved_views
ADD COLUMN IF NOT EXISTS freeze_column_key TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN saved_views.freeze_column_key IS 'Column key marking the freeze boundary. All columns up to and including this one are frozen (sticky) when scrolling horizontally.';
