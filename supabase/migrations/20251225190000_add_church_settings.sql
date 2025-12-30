-- Add church settings columns for calendar preferences
-- Note: timezone column already exists in initial schema

-- Add first_day_of_week column (0 = Sunday, 1 = Monday)
-- Default to Monday (1)
ALTER TABLE churches ADD COLUMN first_day_of_week INTEGER NOT NULL DEFAULT 1
  CHECK (first_day_of_week IN (0, 1));

-- Add comment for clarity
COMMENT ON COLUMN churches.first_day_of_week IS 'First day of week for calendar: 0 = Sunday, 1 = Monday';
