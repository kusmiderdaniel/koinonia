-- Events feature: Create events, positions, and assignments tables

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('service', 'rehearsal', 'meeting', 'special_event', 'other')),
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure end_time is after start_time
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create event_positions table (volunteer slots needed for an event)
CREATE TABLE event_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  role_id UUID REFERENCES ministry_roles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  quantity_needed INTEGER NOT NULL DEFAULT 1 CHECK (quantity_needed > 0),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_assignments table (volunteers assigned to positions)
CREATE TABLE event_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES event_positions(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  -- A person can only be assigned once per position
  UNIQUE(position_id, profile_id)
);

-- Create indexes for events
CREATE INDEX idx_events_church_id ON events(church_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_created_by ON events(created_by);

-- Create indexes for event_positions
CREATE INDEX idx_event_positions_event_id ON event_positions(event_id);
CREATE INDEX idx_event_positions_ministry_id ON event_positions(ministry_id);
CREATE INDEX idx_event_positions_role_id ON event_positions(role_id);

-- Create indexes for event_assignments
CREATE INDEX idx_event_assignments_position_id ON event_assignments(position_id);
CREATE INDEX idx_event_assignments_profile_id ON event_assignments(profile_id);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for events
CREATE POLICY "Users can view events in their church"
  ON events FOR SELECT
  USING (church_id = get_user_church_id());

CREATE POLICY "Admins and leaders can create events"
  ON events FOR INSERT
  WITH CHECK (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

CREATE POLICY "Admins and leaders can update events"
  ON events FOR UPDATE
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin')
    )
  );

-- RLS policies for event_positions
CREATE POLICY "Users can view event positions in their church"
  ON event_positions FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE church_id = get_user_church_id()
    )
  );

CREATE POLICY "Admins and leaders can manage event positions"
  ON event_positions FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- RLS policies for event_assignments
CREATE POLICY "Users can view assignments in their church"
  ON event_assignments FOR SELECT
  USING (
    position_id IN (
      SELECT ep.id FROM event_positions ep
      JOIN events e ON ep.event_id = e.id
      WHERE e.church_id = get_user_church_id()
    )
  );

CREATE POLICY "Admins and leaders can manage assignments"
  ON event_assignments FOR ALL
  USING (
    position_id IN (
      SELECT ep.id FROM event_positions ep
      JOIN events e ON ep.event_id = e.id
      WHERE e.church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_positions_updated_at
  BEFORE UPDATE ON event_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
