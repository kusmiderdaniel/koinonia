-- Add ministry_id to event_agenda_items
-- Each agenda item is assigned to a ministry, which determines who can lead it

ALTER TABLE event_agenda_items
ADD COLUMN ministry_id UUID REFERENCES ministries(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_event_agenda_items_ministry_id ON event_agenda_items(ministry_id);

-- Add comment for documentation
COMMENT ON COLUMN event_agenda_items.ministry_id IS 'The ministry responsible for this agenda item. Determines who can be assigned as leader.';
