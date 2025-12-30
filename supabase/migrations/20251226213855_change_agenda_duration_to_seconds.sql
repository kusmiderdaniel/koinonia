-- Change event_agenda_items duration from minutes to seconds for more precision

-- Add new duration_seconds column
ALTER TABLE event_agenda_items
ADD COLUMN duration_seconds INTEGER;

-- Migrate existing data (multiply minutes by 60 to get seconds)
UPDATE event_agenda_items
SET duration_seconds = duration_minutes * 60;

-- Make the new column NOT NULL and add constraint
ALTER TABLE event_agenda_items
ALTER COLUMN duration_seconds SET NOT NULL,
ALTER COLUMN duration_seconds SET DEFAULT 300,
ADD CONSTRAINT event_agenda_items_duration_seconds_check CHECK (duration_seconds > 0);

-- Drop the old column
ALTER TABLE event_agenda_items DROP COLUMN duration_minutes;

-- Add comment for clarity
COMMENT ON COLUMN event_agenda_items.duration_seconds IS 'Duration of the agenda item in seconds';
