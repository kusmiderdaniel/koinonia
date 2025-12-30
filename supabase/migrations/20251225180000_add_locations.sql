-- Add locations table for church venues/rooms
-- This allows churches to manage reusable locations for events

-- Create the locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_locations_church_id ON locations(church_id);
CREATE INDEX idx_locations_is_active ON locations(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS policies using the helper function
CREATE POLICY "Users can view locations from their church"
  ON locations FOR SELECT
  USING (church_id = get_user_church_id());

CREATE POLICY "Admins can insert locations for their church"
  ON locations FOR INSERT
  WITH CHECK (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

CREATE POLICY "Admins can update locations in their church"
  ON locations FOR UPDATE
  USING (church_id = get_user_church_id())
  WITH CHECK (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

CREATE POLICY "Admins can delete locations in their church"
  ON locations FOR DELETE
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add location_id to events table (optional FK to locations)
ALTER TABLE events ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
CREATE INDEX idx_events_location_id ON events(location_id);
