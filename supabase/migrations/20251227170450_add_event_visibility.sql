-- Add visibility column to events
ALTER TABLE events ADD COLUMN visibility TEXT NOT NULL DEFAULT 'members'
  CHECK (visibility IN ('members', 'volunteers', 'leaders', 'hidden'));

-- Add default visibility to churches
ALTER TABLE churches ADD COLUMN default_event_visibility TEXT NOT NULL DEFAULT 'members'
  CHECK (default_event_visibility IN ('members', 'volunteers', 'leaders'));

-- Create event invitations table for hidden events
CREATE TABLE event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, profile_id)
);

-- RLS for event_invitations
ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations for events in their church
CREATE POLICY "Users can view invitations for their church events"
  ON event_invitations FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE church_id = (
        SELECT church_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Policy: Leaders can manage invitations
CREATE POLICY "Leaders can manage invitations"
  ON event_invitations FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE church_id = (
        SELECT church_id FROM profiles WHERE id = auth.uid()
      )
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin', 'leader')
  );

-- Indexes for fast lookups
CREATE INDEX idx_event_invitations_event ON event_invitations(event_id);
CREATE INDEX idx_event_invitations_profile ON event_invitations(profile_id);
CREATE INDEX idx_events_visibility ON events(visibility);
