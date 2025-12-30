-- Add is_song_placeholder column to event_agenda_items
-- This tracks whether an agenda item is a song placeholder that needs a song to be selected

ALTER TABLE event_agenda_items
ADD COLUMN is_song_placeholder BOOLEAN NOT NULL DEFAULT false;

-- Add index for faster filtering of placeholders
CREATE INDEX idx_event_agenda_items_is_song_placeholder
ON event_agenda_items(is_song_placeholder)
WHERE is_song_placeholder = true;
