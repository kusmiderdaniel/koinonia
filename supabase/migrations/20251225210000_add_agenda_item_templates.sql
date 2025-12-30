-- Agenda item templates: reusable agenda items with default durations

CREATE TABLE agenda_item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  default_duration_minutes INTEGER NOT NULL DEFAULT 15 CHECK (default_duration_minutes > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique title per church
  UNIQUE(church_id, title)
);

-- Create indexes
CREATE INDEX idx_agenda_item_templates_church_id ON agenda_item_templates(church_id);
CREATE INDEX idx_agenda_item_templates_title ON agenda_item_templates(title);

-- Enable RLS
ALTER TABLE agenda_item_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view agenda templates in their church"
  ON agenda_item_templates FOR SELECT
  USING (church_id = get_user_church_id());

CREATE POLICY "Admins and leaders can manage agenda templates"
  ON agenda_item_templates FOR ALL
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_agenda_item_templates_updated_at
  BEFORE UPDATE ON agenda_item_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Also simplify event_positions: remove quantity_needed concept
-- All positions will accept exactly 1 person
-- First, update any existing positions to have quantity_needed = 1
UPDATE event_positions SET quantity_needed = 1 WHERE quantity_needed != 1;

-- Add a check constraint to enforce quantity_needed = 1
ALTER TABLE event_positions
  DROP CONSTRAINT IF EXISTS event_positions_quantity_needed_check,
  ADD CONSTRAINT event_positions_quantity_one CHECK (quantity_needed = 1);
