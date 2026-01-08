-- Add duration_seconds to song_arrangements
-- This allows each arrangement to have its own duration
-- NULL means use the song's default duration

ALTER TABLE song_arrangements
ADD COLUMN duration_seconds INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN song_arrangements.duration_seconds IS 'Optional duration in seconds for this arrangement. If NULL, uses the song default duration.';
