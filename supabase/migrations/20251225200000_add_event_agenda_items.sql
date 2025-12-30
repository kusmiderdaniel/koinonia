-- Event agenda items: reusable schedule items for events

CREATE TABLE event_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 5 CHECK (duration_minutes > 0),
  leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_event_agenda_items_event_id ON event_agenda_items(event_id);
CREATE INDEX idx_event_agenda_items_leader_id ON event_agenda_items(leader_id);
CREATE INDEX idx_event_agenda_items_sort_order ON event_agenda_items(event_id, sort_order);

-- Enable RLS
ALTER TABLE event_agenda_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view agenda items in their church"
  ON event_agenda_items FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE church_id = get_user_church_id()
    )
  );

CREATE POLICY "Admins and leaders can manage agenda items"
  ON event_agenda_items FOR ALL
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

-- Add updated_at trigger
CREATE TRIGGER update_event_agenda_items_updated_at
  BEFORE UPDATE ON event_agenda_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
