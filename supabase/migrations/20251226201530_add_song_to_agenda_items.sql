-- Add song_id column to event_agenda_items to link agenda items to songs
ALTER TABLE event_agenda_items
ADD COLUMN song_id UUID REFERENCES songs(id) ON DELETE SET NULL;

-- Add index for song lookups
CREATE INDEX idx_event_agenda_items_song_id ON event_agenda_items(song_id);

-- Add song_key column to store the key the song will be played in for this event
-- This allows overriding the default key from the song
ALTER TABLE event_agenda_items
ADD COLUMN song_key TEXT;

-- Comment for clarity
COMMENT ON COLUMN event_agenda_items.song_id IS 'Reference to a song from the song bank. When set, this agenda item represents a song.';
COMMENT ON COLUMN event_agenda_items.song_key IS 'The key the song will be played in for this event. Defaults to song default_key if not set.';
