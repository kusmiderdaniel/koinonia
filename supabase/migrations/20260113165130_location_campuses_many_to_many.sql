-- Migration: Convert locations-campuses from one-to-many to many-to-many
-- This allows a location to belong to multiple campuses

-- 1. Create junction table for location-campus many-to-many relationship
CREATE TABLE IF NOT EXISTS location_campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(location_id, campus_id)
);

-- 2. Migrate existing campus assignments from locations.campus_id to junction table
INSERT INTO location_campuses (location_id, campus_id)
SELECT id, campus_id
FROM locations
WHERE campus_id IS NOT NULL
ON CONFLICT (location_id, campus_id) DO NOTHING;

-- 3. Drop the campus_id column from locations (no longer needed)
ALTER TABLE locations DROP COLUMN IF EXISTS campus_id;

-- 4. Enable RLS on the junction table
ALTER TABLE location_campuses ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for location_campuses (based on location's church_id)
CREATE POLICY "Users can view location_campuses for their church"
  ON location_campuses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM locations l
      WHERE l.id = location_campuses.location_id
      AND l.church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert location_campuses for their church"
  ON location_campuses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM locations l
      WHERE l.id = location_campuses.location_id
      AND l.church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete location_campuses for their church"
  ON location_campuses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM locations l
      WHERE l.id = location_campuses.location_id
      AND l.church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    )
  );

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_campuses_location_id ON location_campuses(location_id);
CREATE INDEX IF NOT EXISTS idx_location_campuses_campus_id ON location_campuses(campus_id);
