-- Add is_system column to ministries table
-- System ministries cannot be deleted but their roles can be modified

ALTER TABLE ministries
ADD COLUMN is_system BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN ministries.is_system IS 'System ministries cannot be deleted. Default Worship ministry is created for each church.';

-- Create index for quick lookups
CREATE INDEX idx_ministries_is_system ON ministries(is_system) WHERE is_system = true;
