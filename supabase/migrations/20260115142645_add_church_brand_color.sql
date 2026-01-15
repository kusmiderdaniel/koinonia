-- Add brand_color column to churches table
-- This allows each church to customize their accent color

ALTER TABLE churches
ADD COLUMN brand_color text DEFAULT '#f49f1e';

-- Add a comment explaining the column
COMMENT ON COLUMN churches.brand_color IS 'Custom brand/accent color for the church (hex format, e.g., #f49f1e)';
