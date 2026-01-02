-- Add campus_id to locations table
ALTER TABLE locations ADD COLUMN campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_locations_campus_id ON locations(campus_id);

-- Assign existing locations to default campus of their church
UPDATE locations l
SET campus_id = c.id
FROM campuses c
WHERE c.church_id = l.church_id
  AND c.is_default = true;
