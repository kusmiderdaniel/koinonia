-- Add responsible person to events
-- This is the person who is the main point of contact for the event

ALTER TABLE events
ADD COLUMN responsible_person_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_events_responsible_person_id ON events(responsible_person_id);

-- Add comment for documentation
COMMENT ON COLUMN events.responsible_person_id IS 'The person responsible for this event - main point of contact';
