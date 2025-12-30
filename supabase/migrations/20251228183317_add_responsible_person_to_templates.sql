-- Add responsible_person_id to event_templates
ALTER TABLE event_templates
ADD COLUMN responsible_person_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index for the new column
CREATE INDEX idx_event_templates_responsible_person_id ON event_templates(responsible_person_id);
