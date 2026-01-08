-- Add time format preference to churches
-- Allows churches to choose between 12-hour (AM/PM) and 24-hour time display

ALTER TABLE churches
ADD COLUMN time_format text NOT NULL DEFAULT '24h'
CHECK (time_format IN ('12h', '24h'));

-- Add comment for documentation
COMMENT ON COLUMN churches.time_format IS 'Time display format: 12h (AM/PM) or 24h';
